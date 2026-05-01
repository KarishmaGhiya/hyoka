import * as fs from "fs";
import { Readable } from "stream";
import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobItem,
  BlobUploadCommonResponse,
  BlobDeleteResponse,
} from "@azure/storage-blob";

export interface UploadOptions {
  /** Optional metadata key-value pairs stored with the blob. */
  metadata?: Record<string, string>;
  /** Optional blob index tags for later querying. */
  tags?: Record<string, string>;
  /** MIME content type (default: application/octet-stream). */
  contentType?: string;
}

export interface DownloadResult {
  content: string;
  contentLength: number;
  metadata?: Record<string, string>;
}

/**
 * Reusable wrapper around Azure Blob Storage operations.
 *
 * Features:
 *  - Upload with streaming (memory-efficient for large files)
 *  - Download to string
 *  - List blobs in a container
 *  - Delete a blob
 *  - Lease-protected upload to prevent concurrent overwrites
 */
export class BlobStorageService {
  private readonly serviceClient: BlobServiceClient;

  constructor(serviceClient: BlobServiceClient) {
    this.serviceClient = serviceClient;
  }

  private getContainerClient(containerName: string): ContainerClient {
    return this.serviceClient.getContainerClient(containerName);
  }

  private getBlockBlobClient(
    containerName: string,
    blobName: string
  ): BlockBlobClient {
    return this.getContainerClient(containerName).getBlockBlobClient(blobName);
  }

  /**
   * Ensure the container exists (creates it if not).
   */
  async ensureContainer(containerName: string): Promise<void> {
    const container = this.getContainerClient(containerName);
    await container.createIfNotExists();
  }

  /**
   * Upload a file using streaming so the entire file is never loaded into
   * memory at once. Supports optional metadata and blob index tags.
   */
  async uploadFile(
    containerName: string,
    blobName: string,
    filePath: string,
    options?: UploadOptions
  ): Promise<BlobUploadCommonResponse> {
    const blockBlob = this.getBlockBlobClient(containerName, blobName);
    const stream = fs.createReadStream(filePath);

    // 4 MiB buffer size, 5 concurrent buffers — keeps memory bounded even
    // for multi-gigabyte files.
    const bufferSize = 4 * 1024 * 1024;
    const maxConcurrency = 5;

    return blockBlob.uploadStream(stream, bufferSize, maxConcurrency, {
      metadata: options?.metadata,
      tags: options?.tags,
      blobHTTPHeaders: {
        blobContentType: options?.contentType ?? "application/octet-stream",
      },
    });
  }

  /**
   * Upload content from a string or Buffer using streaming.
   */
  async uploadContent(
    containerName: string,
    blobName: string,
    content: string | Buffer,
    options?: UploadOptions
  ): Promise<BlobUploadCommonResponse> {
    const blockBlob = this.getBlockBlobClient(containerName, blobName);
    const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const stream = Readable.from(buf);

    const bufferSize = 4 * 1024 * 1024;
    const maxConcurrency = 5;

    return blockBlob.uploadStream(stream, bufferSize, maxConcurrency, {
      metadata: options?.metadata,
      tags: options?.tags,
      blobHTTPHeaders: {
        blobContentType: options?.contentType ?? "application/octet-stream",
      },
    });
  }

  /**
   * Download a blob and return its content as a UTF-8 string.
   */
  async download(
    containerName: string,
    blobName: string
  ): Promise<DownloadResult> {
    const blockBlob = this.getBlockBlobClient(containerName, blobName);
    const response = await blockBlob.download(0);

    const body = response.readableStreamBody;
    if (!body) {
      throw new Error("Download response did not contain a readable stream.");
    }

    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    return {
      content: buffer.toString("utf-8"),
      contentLength: buffer.length,
      metadata: response.metadata,
    };
  }

  /**
   * List all blobs in a container.
   */
  async listBlobs(containerName: string): Promise<BlobItem[]> {
    const container = this.getContainerClient(containerName);
    const blobs: BlobItem[] = [];
    for await (const blob of container.listBlobsFlat({ includeMetadata: true })) {
      blobs.push(blob);
    }
    return blobs;
  }

  /**
   * Delete a blob. Returns silently if the blob does not exist.
   */
  async delete(
    containerName: string,
    blobName: string
  ): Promise<BlobDeleteResponse> {
    const blockBlob = this.getBlockBlobClient(containerName, blobName);
    return blockBlob.deleteIfExists({ deleteSnapshots: "include" });
  }

  /**
   * Acquire a lease on a blob, perform a write, then release the lease.
   * This prevents concurrent writers from overwriting each other's changes.
   *
   * @param leaseDurationSec  Lease duration in seconds (15–60, or -1 for infinite).
   */
  async uploadWithLease(
    containerName: string,
    blobName: string,
    content: string | Buffer,
    options?: UploadOptions & { leaseDurationSec?: number }
  ): Promise<BlobUploadCommonResponse> {
    const blockBlob = this.getBlockBlobClient(containerName, blobName);
    const leaseClient = blockBlob.getBlobLeaseClient();
    const leaseDuration = options?.leaseDurationSec ?? 30;

    const lease = await leaseClient.acquireLease(leaseDuration);
    const leaseId = lease.leaseId!;

    try {
      const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
      const stream = Readable.from(buf);

      const bufferSize = 4 * 1024 * 1024;
      const maxConcurrency = 5;

      return await blockBlob.uploadStream(stream, bufferSize, maxConcurrency, {
        metadata: options?.metadata,
        tags: options?.tags,
        blobHTTPHeaders: {
          blobContentType: options?.contentType ?? "application/octet-stream",
        },
        conditions: { leaseId },
      });
    } finally {
      await leaseClient.releaseLease();
    }
  }
}
