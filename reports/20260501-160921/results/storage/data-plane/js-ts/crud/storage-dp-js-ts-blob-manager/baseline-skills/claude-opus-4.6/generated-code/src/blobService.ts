import * as fs from "fs";
import { Readable } from "stream";
import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobItem,
  Tags,
  BlobUploadCommonResponse,
} from "@azure/storage-blob";

export interface UploadOptions {
  /** Key-value metadata attached to the blob */
  metadata?: Record<string, string>;
  /** Blob index tags for server-side filtering / querying */
  tags?: Tags;
  /** MIME content type (default: application/octet-stream) */
  contentType?: string;
}

export interface BlobInfo {
  name: string;
  contentLength?: number;
  contentType?: string;
  lastModified?: Date;
}

/**
 * Reusable service that wraps common Azure Blob Storage operations.
 *
 * - Uses streaming for uploads so multi-GB files never load fully into memory.
 * - Acquires a blob lease before writes to prevent concurrent overwrites.
 */
export class BlobStorageService {
  private readonly serviceClient: BlobServiceClient;

  constructor(serviceClient: BlobServiceClient) {
    this.serviceClient = serviceClient;
  }

  /** Return (or create) a ContainerClient for the given container name. */
  async getContainer(containerName: string): Promise<ContainerClient> {
    const container = this.serviceClient.getContainerClient(containerName);
    await container.createIfNotExists();
    return container;
  }

  /**
   * Upload a file to a blob using a readable stream so arbitrarily large
   * files are handled without loading them entirely into memory.
   */
  async upload(
    containerName: string,
    blobName: string,
    filePath: string,
    options?: UploadOptions
  ): Promise<BlobUploadCommonResponse> {
    const container = await this.getContainer(containerName);
    const blockBlob: BlockBlobClient =
      container.getBlockBlobClient(blobName);

    const stream: Readable = fs.createReadStream(filePath);

    // 4 MiB blocks, 5 concurrent transfers – keeps memory bounded
    const bufferSize = 4 * 1024 * 1024;
    const maxConcurrency = 5;

    const response = await blockBlob.uploadStream(
      stream,
      bufferSize,
      maxConcurrency,
      {
        blobHTTPHeaders: {
          blobContentType:
            options?.contentType ?? "application/octet-stream",
        },
        metadata: options?.metadata,
        tags: options?.tags,
      }
    );

    return response;
  }

  /**
   * Download a blob's content and return it as a UTF-8 string.
   * Suitable for text blobs that fit comfortably in memory.
   */
  async download(
    containerName: string,
    blobName: string
  ): Promise<string> {
    const container = await this.getContainer(containerName);
    const blobClient = container.getBlobClient(blobName);
    const downloaded = await blobClient.download(0);

    if (!downloaded.readableStreamBody) {
      throw new Error("No readable stream returned for blob download");
    }

    return await streamToString(downloaded.readableStreamBody);
  }

  /** List all blobs in a container. */
  async listBlobs(containerName: string): Promise<BlobInfo[]> {
    const container = await this.getContainer(containerName);
    const blobs: BlobInfo[] = [];

    for await (const item of container.listBlobsFlat()) {
      blobs.push({
        name: item.name,
        contentLength: item.properties.contentLength,
        contentType: item.properties.contentType,
        lastModified: item.properties.lastModified,
      });
    }

    return blobs;
  }

  /**
   * Acquire a lease on the blob, overwrite it via streaming upload,
   * then release the lease. This prevents concurrent writers from
   * silently clobbering each other's changes.
   *
   * @param leaseDurationSeconds - lease duration (15-60 seconds, or -1 for infinite)
   */
  async leaseAndUpdate(
    containerName: string,
    blobName: string,
    filePath: string,
    options?: UploadOptions,
    leaseDurationSeconds: number = 30
  ): Promise<void> {
    const container = await this.getContainer(containerName);
    const blockBlob = container.getBlockBlobClient(blobName);
    const leaseClient = blockBlob.getBlobLeaseClient();

    const lease = await leaseClient.acquireLease(leaseDurationSeconds);
    const leaseId = lease.leaseId!;
    console.log(`  Lease acquired: ${leaseId}`);

    try {
      const stream: Readable = fs.createReadStream(filePath);
      const bufferSize = 4 * 1024 * 1024;
      const maxConcurrency = 5;

      await blockBlob.uploadStream(stream, bufferSize, maxConcurrency, {
        blobHTTPHeaders: {
          blobContentType:
            options?.contentType ?? "application/octet-stream",
        },
        metadata: options?.metadata,
        tags: options?.tags,
        conditions: { leaseId },
      });

      console.log("  Blob updated while holding lease.");
    } finally {
      await leaseClient.releaseLease();
      console.log("  Lease released.");
    }
  }

  /** Delete a blob if it exists. */
  async delete(
    containerName: string,
    blobName: string
  ): Promise<void> {
    const container = await this.getContainer(containerName);
    const blobClient = container.getBlobClient(blobName);
    await blobClient.deleteIfExists();
  }
}

/** Helper: drain a Node readable stream into a UTF-8 string. */
function streamToString(readable: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readable.on("data", (chunk: Buffer) => chunks.push(chunk));
    readable.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    readable.on("error", reject);
  });
}
