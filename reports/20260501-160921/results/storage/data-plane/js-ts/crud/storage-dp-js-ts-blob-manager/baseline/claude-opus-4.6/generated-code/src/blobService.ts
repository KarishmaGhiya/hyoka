import * as fs from "fs";
import {
  BlobServiceClient,
  ContainerClient,
  BlobUploadCommonResponse,
  BlobDeleteResponse,
  Tags,
} from "@azure/storage-blob";

/** Metadata key-value pairs attached to a blob. */
export type BlobMetadata = Record<string, string>;

/** Options for uploading a blob. */
export interface UploadBlobOptions {
  /** Arbitrary metadata key-value pairs stored alongside the blob. */
  metadata?: BlobMetadata;
  /** Blob index tags used for querying blobs across containers. */
  tags?: Tags;
}

/** Represents a listed blob with its basic properties. */
export interface BlobInfo {
  name: string;
  contentLength?: number;
  contentType?: string;
  lastModified?: Date;
}

/**
 * A reusable service that wraps common Azure Blob Storage operations.
 *
 * Features:
 * - Upload with optional metadata and index tags (streams large files to avoid memory pressure).
 * - Download blob content to a string or a writable stream.
 * - List all blobs in a container.
 * - Delete a blob.
 * - Lease-based concurrency control for safe overwrites.
 */
export class BlobStorageService {
  private readonly serviceClient: BlobServiceClient;

  constructor(serviceClient: BlobServiceClient) {
    this.serviceClient = serviceClient;
  }

  /** Returns a {@link ContainerClient}, creating the container if it doesn't exist. */
  async getContainer(containerName: string): Promise<ContainerClient> {
    const containerClient =
      this.serviceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
    return containerClient;
  }

  /**
   * Uploads a file to a blob using streaming, so arbitrarily large files can be
   * uploaded without loading them entirely into memory.
   *
   * @param containerName - Target container.
   * @param blobName      - Destination blob path/name.
   * @param filePath      - Local file to upload.
   * @param options       - Optional metadata and index tags.
   * @returns The upload response from Azure.
   */
  async uploadBlob(
    containerName: string,
    blobName: string,
    filePath: string,
    options?: UploadBlobOptions
  ): Promise<BlobUploadCommonResponse> {
    const container = await this.getContainer(containerName);
    const blockBlobClient = container.getBlockBlobClient(blobName);

    const fileStream = fs.createReadStream(filePath);

    // Upload via stream – bufferSize and maxConcurrency control memory usage.
    // 4 MiB buffers × 4 concurrent transfers keeps memory bounded.
    const bufferSize = 4 * 1024 * 1024; // 4 MiB
    const maxConcurrency = 4;

    const response = await blockBlobClient.uploadStream(
      fileStream,
      bufferSize,
      maxConcurrency,
      {
        metadata: options?.metadata,
        tags: options?.tags,
        blobHTTPHeaders: {
          blobContentType: "application/octet-stream",
        },
      }
    );

    return response;
  }

  /**
   * Downloads a blob's content and returns it as a UTF-8 string.
   *
   * Suitable for blobs that fit comfortably in memory. For very large downloads
   * consider streaming to a file instead.
   */
  async downloadBlobAsString(
    containerName: string,
    blobName: string
  ): Promise<string> {
    const container = await this.getContainer(containerName);
    const blobClient = container.getBlockBlobClient(blobName);

    const downloadResponse = await blobClient.download(0);
    const readableStream = downloadResponse.readableStreamBody;
    if (!readableStream) {
      throw new Error("Failed to get readable stream from blob download");
    }

    return await streamToString(readableStream);
  }

  /** Lists all blobs in a container and returns basic info about each. */
  async listBlobs(containerName: string): Promise<BlobInfo[]> {
    const container = await this.getContainer(containerName);
    const blobs: BlobInfo[] = [];

    for await (const blob of container.listBlobsFlat()) {
      blobs.push({
        name: blob.name,
        contentLength: blob.properties.contentLength,
        contentType: blob.properties.contentType,
        lastModified: blob.properties.lastModified,
      });
    }

    return blobs;
  }

  /** Deletes a blob from a container. */
  async deleteBlob(
    containerName: string,
    blobName: string
  ): Promise<BlobDeleteResponse> {
    const container = await this.getContainer(containerName);
    const blobClient = container.getBlockBlobClient(blobName);
    return await blobClient.delete();
  }

  /**
   * Overwrites a blob using lease-based concurrency control.
   *
   * Acquires a finite lease on the target blob so that no other writer can
   * modify it during the upload. The lease is released after the write
   * completes (or on error).
   *
   * @param containerName - Target container.
   * @param blobName      - Blob to overwrite.
   * @param filePath      - Local file whose contents replace the blob.
   * @param leaseDurationSeconds - Lease duration (15–60 s). Defaults to 30.
   * @returns The upload response.
   */
  async overwriteWithLease(
    containerName: string,
    blobName: string,
    filePath: string,
    leaseDurationSeconds: number = 30
  ): Promise<BlobUploadCommonResponse> {
    const container = await this.getContainer(containerName);
    const blockBlobClient = container.getBlockBlobClient(blobName);
    const leaseClient = blockBlobClient.getBlobLeaseClient();

    // Acquire a fixed-duration lease (Azure allows 15–60 seconds or infinite).
    const lease = await leaseClient.acquireLease(leaseDurationSeconds);
    const leaseId = lease.leaseId!;

    try {
      const fileStream = fs.createReadStream(filePath);
      const bufferSize = 4 * 1024 * 1024;
      const maxConcurrency = 4;

      const response = await blockBlobClient.uploadStream(
        fileStream,
        bufferSize,
        maxConcurrency,
        {
          conditions: { leaseId },
          blobHTTPHeaders: {
            blobContentType: "application/octet-stream",
          },
        }
      );

      return response;
    } finally {
      // Always release the lease so other writers are not blocked.
      await leaseClient.releaseLease();
    }
  }
}

/** Collects a Node.js readable stream into a UTF-8 string. */
async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}
