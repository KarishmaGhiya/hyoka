import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobItem,
  BlobDownloadResponseParsed,
  BlobLeaseClient,
} from "@azure/storage-blob";
import * as fs from "fs";
import { pipeline } from "stream/promises";

export interface UploadOptions {
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  contentType?: string;
}

export interface BlobMetadata {
  name: string;
  size: number;
  lastModified: Date;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

export class BlobStorageService {
  private containerClient: ContainerClient;

  constructor(
    private blobServiceClient: BlobServiceClient,
    private containerName: string
  ) {
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  /**
   * Ensures the container exists, creating it if necessary.
   */
  async ensureContainerExists(): Promise<void> {
    await this.containerClient.createIfNotExists();
  }

  /**
   * Uploads a file with streaming for efficient memory usage.
   * Supports metadata and blob index tags for querying.
   * 
   * @param blobName - Name of the blob in the container
   * @param filePath - Local file path to upload
   * @param options - Optional metadata, tags, and content type
   */
  async uploadFile(
    blobName: string,
    filePath: string,
    options?: UploadOptions
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    // Get file size for upload
    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;

    // Create read stream for efficient memory usage (doesn't load entire file)
    const readStream = fs.createReadStream(filePath);

    console.log(`Uploading ${blobName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)...`);

    // Upload using stream with parallel upload (4MB chunks, 5 concurrent)
    await blockBlobClient.uploadStream(
      readStream,
      4 * 1024 * 1024, // 4MB buffer size
      5, // max concurrency
      {
        blobHTTPHeaders: {
          blobContentType: options?.contentType || "application/octet-stream",
        },
        metadata: options?.metadata,
        tags: options?.tags,
        onProgress: (progress) => {
          const percent = ((progress.loadedBytes / fileSize) * 100).toFixed(2);
          process.stdout.write(`\rUpload progress: ${percent}%`);
        },
      }
    );

    console.log(`\n✓ Upload complete: ${blobName}`);
  }

  /**
   * Uploads a buffer or string content with metadata and tags.
   * 
   * @param blobName - Name of the blob in the container
   * @param content - Buffer or string content to upload
   * @param options - Optional metadata, tags, and content type
   */
  async uploadContent(
    blobName: string,
    content: Buffer | string,
    options?: UploadOptions
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    const buffer = typeof content === "string" ? Buffer.from(content) : content;

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: options?.contentType || "application/octet-stream",
      },
      metadata: options?.metadata,
      tags: options?.tags,
    });

    console.log(`✓ Upload complete: ${blobName}`);
  }

  /**
   * Downloads a blob to a local file with streaming.
   * 
   * @param blobName - Name of the blob to download
   * @param destinationPath - Local file path to save the blob
   */
  async downloadFile(blobName: string, destinationPath: string): Promise<void> {
    const blobClient = this.containerClient.getBlobClient(blobName);

    console.log(`Downloading ${blobName}...`);

    const downloadResponse: BlobDownloadResponseParsed = await blobClient.download(0);

    if (!downloadResponse.readableStreamBody) {
      throw new Error("No readable stream available for download");
    }

    // Stream to file (memory efficient)
    const writeStream = fs.createWriteStream(destinationPath);
    await pipeline(downloadResponse.readableStreamBody, writeStream);

    console.log(`✓ Download complete: ${destinationPath}`);
  }

  /**
   * Downloads blob content to a Buffer.
   * 
   * @param blobName - Name of the blob to download
   * @returns Buffer containing the blob content
   */
  async downloadToBuffer(blobName: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return await blockBlobClient.downloadToBuffer();
  }

  /**
   * Lists all blobs in the container with their metadata.
   * 
   * @param prefix - Optional prefix to filter blobs
   * @returns Array of blob metadata
   */
  async listBlobs(prefix?: string): Promise<BlobMetadata[]> {
    const blobs: BlobMetadata[] = [];

    for await (const blob of this.containerClient.listBlobsFlat({
      prefix,
      includeMetadata: true,
      includeTags: true,
    })) {
      blobs.push({
        name: blob.name,
        size: blob.properties.contentLength || 0,
        lastModified: blob.properties.lastModified || new Date(),
        contentType: blob.properties.contentType,
        metadata: blob.metadata,
        tags: blob.tags,
      });
    }

    return blobs;
  }

  /**
   * Deletes a blob from the container.
   * 
   * @param blobName - Name of the blob to delete
   */
  async deleteBlob(blobName: string): Promise<void> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    await blobClient.deleteIfExists();
    console.log(`✓ Deleted: ${blobName}`);
  }

  /**
   * Acquires a lease on a blob to prevent concurrent writes.
   * Returns a lease ID that must be used for subsequent operations.
   * 
   * @param blobName - Name of the blob to lease
   * @param leaseDurationSeconds - Lease duration (15-60 seconds, or -1 for infinite)
   * @returns Lease ID for subsequent operations
   */
  async acquireLease(
    blobName: string,
    leaseDurationSeconds: number = 30
  ): Promise<string> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const leaseClient = blobClient.getBlobLeaseClient();

    const leaseResponse = await leaseClient.acquireLease(leaseDurationSeconds);
    console.log(`✓ Lease acquired for ${blobName}: ${leaseResponse.leaseId}`);

    return leaseResponse.leaseId!;
  }

  /**
   * Releases a lease on a blob.
   * 
   * @param blobName - Name of the blob
   * @param leaseId - The lease ID to release
   */
  async releaseLease(blobName: string, leaseId: string): Promise<void> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const leaseClient = blobClient.getBlobLeaseClient(leaseId);

    await leaseClient.releaseLease();
    console.log(`✓ Lease released for ${blobName}`);
  }

  /**
   * Uploads content to a blob with a lease to prevent concurrent writes.
   * 
   * @param blobName - Name of the blob
   * @param content - Content to upload
   * @param leaseId - Active lease ID
   * @param options - Upload options
   */
  async uploadWithLease(
    blobName: string,
    content: Buffer | string,
    leaseId: string,
    options?: UploadOptions
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    const buffer = typeof content === "string" ? Buffer.from(content) : content;

    await blockBlobClient.upload(buffer, buffer.length, {
      conditions: {
        leaseId,
      },
      blobHTTPHeaders: {
        blobContentType: options?.contentType || "application/octet-stream",
      },
      metadata: options?.metadata,
      tags: options?.tags,
    });

    console.log(`✓ Upload with lease complete: ${blobName}`);
  }

  /**
   * Gets blob properties including metadata and tags.
   * 
   * @param blobName - Name of the blob
   */
  async getBlobProperties(blobName: string): Promise<BlobMetadata> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const properties = await blobClient.getProperties();

    // Fetch tags separately (they require a separate API call)
    const tagsResponse = await blobClient.getTags();

    return {
      name: blobName,
      size: properties.contentLength || 0,
      lastModified: properties.lastModified || new Date(),
      contentType: properties.contentType,
      metadata: properties.metadata,
      tags: tagsResponse.tags,
    };
  }
}
