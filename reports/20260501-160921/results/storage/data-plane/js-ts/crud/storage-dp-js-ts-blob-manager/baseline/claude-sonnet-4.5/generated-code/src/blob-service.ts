import {
  BlobServiceClient,
  ContainerClient,
  BlobClient,
  BlockBlobClient,
  BlockBlobUploadStreamOptions,
  BlobDownloadResponseParsed,
  BlobLeaseClient,
} from '@azure/storage-blob';
import { Readable } from 'stream';
import * as fs from 'fs';

export interface UploadOptions {
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  contentType?: string;
}

export interface BlobInfo {
  name: string;
  lastModified?: Date;
  contentLength?: number;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

/**
 * Service class for Azure Blob Storage operations
 * Provides upload, download, list, and delete functionality with streaming and leasing support
 */
export class BlobStorageService {
  private containerClient: ContainerClient;

  constructor(private blobServiceClient: BlobServiceClient, private containerName: string) {
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  /**
   * Ensure container exists, create if it doesn't
   */
  async ensureContainer(): Promise<void> {
    const exists = await this.containerClient.exists();
    if (!exists) {
      await this.containerClient.create();
      console.log(`✓ Container '${this.containerName}' created`);
    } else {
      console.log(`✓ Container '${this.containerName}' already exists`);
    }
  }

  /**
   * Upload a file to blob storage using streaming for memory efficiency
   * Handles large files without loading entire content into memory
   * @param blobName - Name of the blob in storage
   * @param filePath - Local file path to upload
   * @param options - Optional metadata and tags
   */
  async uploadFile(blobName: string, filePath: string, options?: UploadOptions): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    // Create a read stream for efficient memory usage with large files
    const readStream = fs.createReadStream(filePath);
    const fileStats = fs.statSync(filePath);

    const uploadOptions: BlockBlobUploadStreamOptions = {
      blobHTTPHeaders: {
        blobContentType: options?.contentType || 'application/octet-stream',
      },
      metadata: options?.metadata,
      tags: options?.tags,
    };

    // Upload using stream - memory efficient for large files
    await blockBlobClient.uploadStream(
      readStream,
      4 * 1024 * 1024, // Buffer size: 4MB
      5, // Max concurrent upload streams
      uploadOptions
    );

    console.log(`✓ Uploaded '${blobName}' (${fileStats.size} bytes) using streaming`);
    if (options?.metadata) {
      console.log(`  Metadata:`, options.metadata);
    }
    if (options?.tags) {
      console.log(`  Index Tags:`, options.tags);
    }
  }

  /**
   * Upload content from a stream or buffer
   * @param blobName - Name of the blob in storage
   * @param content - Stream or Buffer to upload
   * @param options - Optional metadata and tags
   */
  async uploadStream(
    blobName: string,
    content: Readable | Buffer,
    options?: UploadOptions
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    const uploadOptions: BlockBlobUploadStreamOptions = {
      blobHTTPHeaders: {
        blobContentType: options?.contentType || 'application/octet-stream',
      },
      metadata: options?.metadata,
      tags: options?.tags,
    };

    if (Buffer.isBuffer(content)) {
      await blockBlobClient.upload(content, content.length, uploadOptions);
    } else {
      await blockBlobClient.uploadStream(
        content,
        4 * 1024 * 1024,
        5,
        uploadOptions
      );
    }

    console.log(`✓ Uploaded '${blobName}' from stream/buffer`);
  }

  /**
   * Download a blob and return its content as a buffer
   * @param blobName - Name of the blob to download
   */
  async downloadBlob(blobName: string): Promise<Buffer> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const downloadResponse = await blobClient.download();

    if (!downloadResponse.readableStreamBody) {
      throw new Error('Failed to get readable stream from blob');
    }

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const buffer = Buffer.concat(chunks);
    console.log(`✓ Downloaded '${blobName}' (${buffer.length} bytes)`);
    return buffer;
  }

  /**
   * Download a blob to a file using streaming
   * @param blobName - Name of the blob to download
   * @param destinationPath - Local file path to save to
   */
  async downloadToFile(blobName: string, destinationPath: string): Promise<void> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    await blobClient.downloadToFile(destinationPath);
    console.log(`✓ Downloaded '${blobName}' to '${destinationPath}'`);
  }

  /**
   * List all blobs in the container with optional prefix filter
   * @param prefix - Optional prefix to filter blobs
   */
  async listBlobs(prefix?: string): Promise<BlobInfo[]> {
    const blobs: BlobInfo[] = [];
    const iterator = this.containerClient.listBlobsFlat({
      prefix,
      includeMetadata: true,
      includeTags: true,
    });

    for await (const blob of iterator) {
      blobs.push({
        name: blob.name,
        lastModified: blob.properties.lastModified,
        contentLength: blob.properties.contentLength,
        contentType: blob.properties.contentType,
        metadata: blob.metadata,
        tags: blob.tags,
      });
    }

    console.log(`✓ Listed ${blobs.length} blob(s)${prefix ? ` with prefix '${prefix}'` : ''}`);
    return blobs;
  }

  /**
   * Delete a blob
   * @param blobName - Name of the blob to delete
   */
  async deleteBlob(blobName: string): Promise<void> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    await blobClient.delete();
    console.log(`✓ Deleted '${blobName}'`);
  }

  /**
   * Acquire a lease on a blob to prevent concurrent modifications
   * Returns a lease client that must be used for subsequent operations
   * @param blobName - Name of the blob to lease
   * @param leaseDuration - Lease duration in seconds (15-60, or -1 for infinite)
   */
  async acquireLease(blobName: string, leaseDuration: number = 60): Promise<BlobLeaseClient> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const leaseClient = blobClient.getBlobLeaseClient();

    const leaseResponse = await leaseClient.acquireLease(leaseDuration);
    console.log(`✓ Acquired lease on '${blobName}' (ID: ${leaseResponse.leaseId})`);

    return leaseClient;
  }

  /**
   * Upload with an existing lease to safely update a blob
   * @param blobName - Name of the blob
   * @param content - Content to upload
   * @param leaseClient - Active lease client
   * @param options - Upload options
   */
  async uploadWithLease(
    blobName: string,
    content: Buffer | string,
    leaseClient: BlobLeaseClient,
    options?: UploadOptions
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

    await blockBlobClient.upload(buffer, buffer.length, {
      conditions: { leaseId: leaseClient.leaseId },
      blobHTTPHeaders: {
        blobContentType: options?.contentType || 'application/octet-stream',
      },
      metadata: options?.metadata,
      tags: options?.tags,
    });

    console.log(`✓ Uploaded '${blobName}' with lease protection`);
  }

  /**
   * Release a lease on a blob
   * @param leaseClient - Lease client to release
   */
  async releaseLease(leaseClient: BlobLeaseClient): Promise<void> {
    await leaseClient.releaseLease();
    console.log(`✓ Released lease (ID: ${leaseClient.leaseId})`);
  }
}
