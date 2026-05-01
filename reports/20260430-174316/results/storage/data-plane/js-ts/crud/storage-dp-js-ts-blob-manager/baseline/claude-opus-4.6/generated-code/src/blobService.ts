import * as fs from "fs";
import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobItem,
  BlobLeaseClient,
  BlockBlobUploadStreamOptions,
} from "@azure/storage-blob";

/** Metadata key-value pairs attached to a blob. */
export type BlobMetadata = Record<string, string>;

/** Index tags for server-side querying (Blob Index). */
export type BlobTags = Record<string, string>;

export interface UploadOptions {
  metadata?: BlobMetadata;
  tags?: BlobTags;
}

export interface LeaseUploadOptions extends UploadOptions {
  /** Duration of the lease in seconds (15-60, or -1 for infinite). */
  leaseDurationSeconds?: number;
}

/**
 * Reusable service that wraps Azure Blob Storage operations.
 *
 * All operations target a single container whose name is provided at
 * construction time. The container is created automatically if it does
 * not already exist.
 */
export class BlobStorageService {
  private readonly containerClient: ContainerClient;

  constructor(
    private readonly serviceClient: BlobServiceClient,
    private readonly containerName: string
  ) {
    this.containerClient = this.serviceClient.getContainerClient(
      this.containerName
    );
  }

  /** Ensure the target container exists. */
  async ensureContainer(): Promise<void> {
    await this.containerClient.createIfNotExists();
  }

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  /**
   * Upload a file to blob storage using streaming so that arbitrarily large
   * files can be uploaded without loading them entirely into memory.
   *
   * @param blobName  Destination blob name (may include virtual directory path).
   * @param filePath  Local path to the file to upload.
   * @param options   Optional metadata and index tags.
   */
  async upload(
    blobName: string,
    filePath: string,
    options: UploadOptions = {}
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const readStream = fs.createReadStream(filePath);

    // 4 MiB per block, up to 4 concurrent uploads — keeps memory bounded
    // even for multi-gigabyte files.
    const bufferSize = 4 * 1024 * 1024;
    const maxConcurrency = 4;

    const uploadOptions: BlockBlobUploadStreamOptions = {};
    if (options.metadata) {
      uploadOptions.metadata = options.metadata;
    }
    if (options.tags) {
      uploadOptions.tags = options.tags;
    }

    await blockBlobClient.uploadStream(
      readStream,
      bufferSize,
      maxConcurrency,
      uploadOptions
    );
  }

  // ---------------------------------------------------------------------------
  // Download
  // ---------------------------------------------------------------------------

  /**
   * Download a blob and return its contents as a string.
   *
   * For very large blobs you would typically stream to disk; this helper is
   * intended for reasonably-sized text blobs.
   */
  async download(blobName: string): Promise<string> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const response = await blobClient.download(0);

    if (!response.readableStreamBody) {
      throw new Error(`Blob "${blobName}" has no readable stream body.`);
    }

    return await streamToString(response.readableStreamBody);
  }

  // ---------------------------------------------------------------------------
  // List
  // ---------------------------------------------------------------------------

  /**
   * List all blobs in the container.
   *
   * Returns the full set of {@link BlobItem} objects so callers can inspect
   * names, metadata, tags, etc.
   */
  async listBlobs(): Promise<BlobItem[]> {
    const blobs: BlobItem[] = [];
    for await (const blob of this.containerClient.listBlobsFlat()) {
      blobs.push(blob);
    }
    return blobs;
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  /** Delete a blob. Does nothing if the blob does not exist. */
  async delete(blobName: string): Promise<void> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    await blobClient.deleteIfExists();
  }

  // ---------------------------------------------------------------------------
  // Lease-protected upload (optimistic concurrency)
  // ---------------------------------------------------------------------------

  /**
   * Acquire a lease on an existing blob, overwrite it while holding the lease,
   * then release the lease.  This prevents concurrent writers from silently
   * overwriting each other's changes.
   *
   * @param blobName              The blob to update.
   * @param filePath              Local file whose contents will replace the blob.
   * @param options               Optional metadata, tags and lease duration.
   * @returns                     The lease ID that was used.
   */
  async uploadWithLease(
    blobName: string,
    filePath: string,
    options: LeaseUploadOptions = {}
  ): Promise<string> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const blockBlobClient: BlockBlobClient =
      this.containerClient.getBlockBlobClient(blobName);
    const leaseClient: BlobLeaseClient = blobClient.getBlobLeaseClient();

    const leaseDuration = options.leaseDurationSeconds ?? 30;

    // Acquire the lease — this will fail with 409 if another writer already
    // holds the lease, which is the desired concurrency-safe behaviour.
    const leaseResponse = await leaseClient.acquireLease(leaseDuration);
    const leaseId = leaseResponse.leaseId!;

    try {
      const readStream = fs.createReadStream(filePath);
      const bufferSize = 4 * 1024 * 1024;
      const maxConcurrency = 4;

      const uploadOptions: BlockBlobUploadStreamOptions = {
        conditions: { leaseId },
      };
      if (options.metadata) {
        uploadOptions.metadata = options.metadata;
      }
      if (options.tags) {
        uploadOptions.tags = options.tags;
      }

      await blockBlobClient.uploadStream(
        readStream,
        bufferSize,
        maxConcurrency,
        uploadOptions
      );
    } finally {
      // Always release the lease, even if the upload fails.
      await leaseClient.releaseLease();
    }

    return leaseId;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Drain a Node.js readable stream into a UTF-8 string. */
function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });
}
