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
  /** Arbitrary key/value metadata stored with the blob. */
  metadata?: Record<string, string>;
  /** Blob index tags for server-side filtering / querying. */
  tags?: Tags;
}

export interface UploadResult {
  url: string;
  response: BlobUploadCommonResponse;
}

/**
 * High-level wrapper around Azure Blob Storage operations.
 *
 * Supports upload (streaming for large files), download, list and delete.
 * Lease-based concurrency control prevents concurrent writers from
 * silently overwriting each other's data.
 */
export class BlobStorageService {
  private readonly serviceClient: BlobServiceClient;

  constructor(serviceClient: BlobServiceClient) {
    this.serviceClient = serviceClient;
  }

  // ── helpers ───────────────────────────────────────────────────────────

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
   * Ensure the container exists (no-op if it already does).
   */
  async ensureContainer(containerName: string): Promise<void> {
    const container = this.getContainerClient(containerName);
    await container.createIfNotExists();
  }

  // ── upload ────────────────────────────────────────────────────────────

  /**
   * Upload a file to blob storage using streaming so arbitrarily large
   * files never need to be fully buffered in memory.
   *
   * @param containerName  Target container.
   * @param blobName       Destination blob path / name.
   * @param filePath       Local file to upload.
   * @param options        Optional metadata and index tags.
   * @returns              The blob URL and raw SDK response.
   */
  async uploadFile(
    containerName: string,
    blobName: string,
    filePath: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    await this.ensureContainer(containerName);
    const blockBlob = this.getBlockBlobClient(containerName, blobName);

    const stream = fs.createReadStream(filePath);
    // 4 MiB per block, 5 concurrent block uploads
    const bufferSize = 4 * 1024 * 1024;
    const maxConcurrency = 5;

    const response = await blockBlob.uploadStream(
      stream,
      bufferSize,
      maxConcurrency,
      {
        metadata: options?.metadata,
        tags: options?.tags,
      }
    );

    return { url: blockBlob.url, response };
  }

  /**
   * Upload from an in-memory Buffer or string.
   */
  async uploadBuffer(
    containerName: string,
    blobName: string,
    content: Buffer | string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    await this.ensureContainer(containerName);
    const blockBlob = this.getBlockBlobClient(containerName, blobName);

    const buf = typeof content === "string" ? Buffer.from(content) : content;
    const response = await blockBlob.uploadData(buf, {
      metadata: options?.metadata,
      tags: options?.tags,
    });

    return { url: blockBlob.url, response };
  }

  // ── download ──────────────────────────────────────────────────────────

  /**
   * Download a blob and return its content as a Buffer.
   */
  async downloadToBuffer(
    containerName: string,
    blobName: string
  ): Promise<Buffer> {
    const blockBlob = this.getBlockBlobClient(containerName, blobName);
    const downloadResponse = await blockBlob.download(0);

    if (!downloadResponse.readableStreamBody) {
      throw new Error(`Blob "${blobName}" has no readable body.`);
    }

    return this.streamToBuffer(
      downloadResponse.readableStreamBody as Readable
    );
  }

  /**
   * Download a blob directly to a local file path using streaming.
   */
  async downloadToFile(
    containerName: string,
    blobName: string,
    destPath: string
  ): Promise<void> {
    const blockBlob = this.getBlockBlobClient(containerName, blobName);
    await blockBlob.downloadToFile(destPath);
  }

  // ── list ──────────────────────────────────────────────────────────────

  /**
   * List all blobs in a container, optionally filtered by a name prefix.
   */
  async listBlobs(
    containerName: string,
    prefix?: string
  ): Promise<BlobItem[]> {
    const container = this.getContainerClient(containerName);
    const blobs: BlobItem[] = [];

    for await (const blob of container.listBlobsFlat({ prefix })) {
      blobs.push(blob);
    }

    return blobs;
  }

  // ── delete ────────────────────────────────────────────────────────────

  /**
   * Delete a blob. Succeeds silently if the blob does not exist.
   */
  async deleteBlob(containerName: string, blobName: string): Promise<void> {
    const blockBlob = this.getBlockBlobClient(containerName, blobName);
    await blockBlob.deleteIfExists({ deleteSnapshots: "include" });
  }

  // ── lease-protected update ────────────────────────────────────────────

  /**
   * Acquire a lease on a blob, perform a write under that lease, then
   * release the lease. This prevents concurrent writers from silently
   * overwriting each other's changes.
   *
   * @param containerName  Container holding the blob.
   * @param blobName       Blob to update.
   * @param content        New content (Buffer or string).
   * @param leaseDuration  Lease duration in seconds (15 – 60, or -1 for
   *                       infinite). Default: 30.
   */
  async updateWithLease(
    containerName: string,
    blobName: string,
    content: Buffer | string,
    leaseDuration: number = 30
  ): Promise<UploadResult> {
    const blockBlob = this.getBlockBlobClient(containerName, blobName);
    const leaseClient = blockBlob.getBlobLeaseClient();

    // Acquire an exclusive lease.
    const lease = await leaseClient.acquireLease(leaseDuration);
    const leaseId = lease.leaseId;

    try {
      const buf = typeof content === "string" ? Buffer.from(content) : content;
      const response = await blockBlob.uploadData(buf, {
        conditions: { leaseId },
      });
      return { url: blockBlob.url, response };
    } finally {
      // Always release the lease so other writers are not blocked.
      await leaseClient.releaseLease();
    }
  }

  // ── internal ──────────────────────────────────────────────────────────

  private async streamToBuffer(readableStream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of readableStream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  }
}
