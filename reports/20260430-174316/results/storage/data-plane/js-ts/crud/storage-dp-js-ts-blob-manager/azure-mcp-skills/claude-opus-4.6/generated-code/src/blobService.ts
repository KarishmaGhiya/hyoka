import * as fs from "fs";
import { Readable } from "stream";
import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobLeaseClient,
  Tags,
} from "@azure/storage-blob";

export interface UploadOptions {
  /** Arbitrary key-value metadata stored with the blob. */
  metadata?: Record<string, string>;
  /** Blob index tags for later querying via FindBlobsByTags. */
  tags?: Tags;
}

export interface DownloadResult {
  content: string;
  contentLength: number;
  metadata?: Record<string, string>;
}

/**
 * High-level wrapper around Azure Blob Storage operations.
 *
 * Features:
 *  - Streaming upload (constant memory regardless of file size)
 *  - Lease-based concurrency control for safe overwrites
 *  - Download, list, and delete helpers
 */
export class BlobStorageService {
  private readonly serviceClient: BlobServiceClient;

  constructor(serviceClient: BlobServiceClient) {
    this.serviceClient = serviceClient;
  }

  /** Return (and lazily create) a container client. */
  async getContainer(containerName: string): Promise<ContainerClient> {
    const container = this.serviceClient.getContainerClient(containerName);
    await container.createIfNotExists();
    return container;
  }

  /**
   * Upload a local file to blob storage using streaming so that even
   * multi-gigabyte files never need to be loaded entirely into memory.
   */
  async uploadFile(
    containerName: string,
    blobName: string,
    filePath: string,
    options?: UploadOptions
  ): Promise<void> {
    const container = await this.getContainer(containerName);
    const blockBlob: BlockBlobClient =
      container.getBlockBlobClient(blobName);

    const fileStream: Readable = fs.createReadStream(filePath);
    const fileSize = fs.statSync(filePath).size;

    // 4 MiB blocks, 5 concurrent transfers — keeps memory bounded.
    const bufferSize = 4 * 1024 * 1024;
    const maxConcurrency = 5;

    await blockBlob.uploadStream(fileStream, bufferSize, maxConcurrency, {
      metadata: options?.metadata,
      tags: options?.tags,
    });

    console.log(
      `  Uploaded "${blobName}" (${fileSize} bytes) via streaming.`
    );
  }

  /**
   * Upload a string/buffer directly (handy for small payloads or tests).
   */
  async uploadContent(
    containerName: string,
    blobName: string,
    content: string | Buffer,
    options?: UploadOptions
  ): Promise<void> {
    const container = await this.getContainer(containerName);
    const blockBlob = container.getBlockBlobClient(blobName);

    const data = typeof content === "string" ? Buffer.from(content) : content;

    await blockBlob.uploadData(data, {
      metadata: options?.metadata,
      tags: options?.tags,
    });

    console.log(
      `  Uploaded "${blobName}" (${data.length} bytes) from content.`
    );
  }

  /** Download blob content as a UTF-8 string. */
  async download(
    containerName: string,
    blobName: string
  ): Promise<DownloadResult> {
    const container = await this.getContainer(containerName);
    const blobClient = container.getBlobClient(blobName);
    const response = await blobClient.download(0);

    const chunks: Buffer[] = [];
    for await (const chunk of response.readableStreamBody as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }

    const content = Buffer.concat(chunks).toString("utf-8");

    return {
      content,
      contentLength: response.contentLength ?? content.length,
      metadata: response.metadata,
    };
  }

  /** List all blob names in a container. */
  async listBlobs(containerName: string): Promise<string[]> {
    const container = await this.getContainer(containerName);
    const names: string[] = [];

    for await (const blob of container.listBlobsFlat()) {
      names.push(blob.name);
    }

    return names;
  }

  /**
   * Acquire a lease on a blob, overwrite its content, then release the lease.
   *
   * This prevents concurrent writers from silently overwriting each other:
   * while the lease is held, any other attempt to write (without supplying
   * the same lease ID) will receive a 412 Precondition Failed.
   */
  async leaseAndUpdate(
    containerName: string,
    blobName: string,
    newContent: string | Buffer,
    leaseDurationSeconds: number = 30
  ): Promise<void> {
    const container = await this.getContainer(containerName);
    const blobClient = container.getBlobClient(blobName);
    const blockBlob = container.getBlockBlobClient(blobName);
    const leaseClient: BlobLeaseClient = blobClient.getBlobLeaseClient();

    // Acquire a fixed-duration lease.
    const leaseResponse = await leaseClient.acquireLease(leaseDurationSeconds);
    const leaseId = leaseResponse.leaseId!;
    console.log(`  Acquired lease ${leaseId} on "${blobName}".`);

    try {
      const data =
        typeof newContent === "string" ? Buffer.from(newContent) : newContent;

      await blockBlob.uploadData(data, {
        conditions: { leaseId },
      });
      console.log(`  Overwrote "${blobName}" while holding lease.`);
    } finally {
      await leaseClient.releaseLease();
      console.log(`  Released lease on "${blobName}".`);
    }
  }

  /** Delete a blob. */
  async delete(containerName: string, blobName: string): Promise<void> {
    const container = await this.getContainer(containerName);
    const blobClient = container.getBlobClient(blobName);
    await blobClient.deleteIfExists();
    console.log(`  Deleted "${blobName}".`);
  }
}
