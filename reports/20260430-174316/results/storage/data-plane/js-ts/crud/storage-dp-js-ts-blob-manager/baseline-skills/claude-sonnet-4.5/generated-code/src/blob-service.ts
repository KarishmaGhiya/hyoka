import {
  BlobClient,
  BlockBlobClient,
  ContainerClient,
  BlobLeaseClient,
  BlobUploadCommonResponse,
  BlobDownloadResponseParsed,
} from '@azure/storage-blob';
import { Readable } from 'stream';
import * as fs from 'fs';

/**
 * Options for uploading a blob
 */
export interface UploadBlobOptions {
  /** Optional metadata key-value pairs */
  metadata?: Record<string, string>;
  /** Optional blob index tags for querying */
  tags?: Record<string, string>;
  /** Content type (MIME type) */
  contentType?: string;
}

/**
 * Result of listing blobs
 */
export interface BlobListItem {
  name: string;
  size?: number;
  lastModified?: Date;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

/**
 * Service class for Azure Blob Storage operations with streaming support and lease management
 */
export class BlobStorageService {
  constructor(private containerClient: ContainerClient) {}

  /**
   * Upload a file to blob storage with streaming for efficient memory usage.
   * Supports metadata and blob index tags.
   * 
   * @param blobName - Name of the blob
   * @param filePathOrStream - Path to file or readable stream
   * @param options - Upload options (metadata, tags, content type)
   */
  async uploadBlob(
    blobName: string,
    filePathOrStream: string | Readable,
    options?: UploadBlobOptions
  ): Promise<BlobUploadCommonResponse> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    let stream: Readable;
    let fileSize: number | undefined;

    if (typeof filePathOrStream === 'string') {
      // File path provided - create read stream
      const stats = fs.statSync(filePathOrStream);
      fileSize = stats.size;
      stream = fs.createReadStream(filePathOrStream);
    } else {
      // Stream provided directly
      stream = filePathOrStream;
    }

    // Upload with streaming (efficient for large files)
    const uploadOptions: any = {
      blobHTTPHeaders: {
        blobContentType: options?.contentType || 'application/octet-stream',
      },
      metadata: options?.metadata,
      tags: options?.tags,
    };

    // Use uploadStream for efficient streaming upload
    const response = await blockBlobClient.uploadStream(
      stream,
      4 * 1024 * 1024, // Buffer size: 4MB
      20, // Max concurrency
      uploadOptions
    );

    return response;
  }

  /**
   * Download a blob and return it as a stream for efficient memory usage
   * 
   * @param blobName - Name of the blob to download
   */
  async downloadBlob(blobName: string): Promise<BlobDownloadResponseParsed> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    return await blobClient.download();
  }

  /**
   * Download a blob to a file path
   * 
   * @param blobName - Name of the blob to download
   * @param destinationPath - Path where the file should be saved
   */
  async downloadBlobToFile(blobName: string, destinationPath: string): Promise<void> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    await blobClient.downloadToFile(destinationPath);
  }

  /**
   * Download blob content as a buffer
   * 
   * @param blobName - Name of the blob
   */
  async downloadBlobToBuffer(blobName: string): Promise<Buffer> {
    const response = await this.downloadBlob(blobName);
    
    if (!response.readableStreamBody) {
      throw new Error('No readable stream body in response');
    }

    return await this.streamToBuffer(response.readableStreamBody);
  }

  /**
   * List all blobs in the container with their metadata and tags
   * 
   * @param prefix - Optional prefix to filter blobs
   */
  async listBlobs(prefix?: string): Promise<BlobListItem[]> {
    const blobs: BlobListItem[] = [];

    const listOptions = {
      prefix,
      includeMetadata: true,
      includeTags: true,
    };

    for await (const blob of this.containerClient.listBlobsFlat(listOptions)) {
      blobs.push({
        name: blob.name,
        size: blob.properties.contentLength,
        lastModified: blob.properties.lastModified,
        contentType: blob.properties.contentType,
        metadata: blob.metadata,
        tags: blob.tags,
      });
    }

    return blobs;
  }

  /**
   * Delete a blob from the container
   * 
   * @param blobName - Name of the blob to delete
   */
  async deleteBlob(blobName: string): Promise<void> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    await blobClient.delete();
  }

  /**
   * Acquire a lease on a blob to prevent concurrent writes.
   * Returns the lease ID which must be used for subsequent operations.
   * 
   * @param blobName - Name of the blob to lease
   * @param leaseDurationSeconds - Duration of the lease (15-60 seconds, or -1 for infinite)
   */
  async acquireLease(blobName: string, leaseDurationSeconds: number = 60): Promise<string> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const leaseClient = blobClient.getBlobLeaseClient();
    
    const leaseResponse = await leaseClient.acquireLease(leaseDurationSeconds);
    
    if (!leaseResponse.leaseId) {
      throw new Error('Failed to acquire lease');
    }
    
    return leaseResponse.leaseId;
  }

  /**
   * Release a lease on a blob
   * 
   * @param blobName - Name of the blob
   * @param leaseId - Lease ID obtained from acquireLease
   */
  async releaseLease(blobName: string, leaseId: string): Promise<void> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const leaseClient = blobClient.getBlobLeaseClient(leaseId);
    await leaseClient.releaseLease();
  }

  /**
   * Upload a blob with an active lease (prevents concurrent overwrites)
   * 
   * @param blobName - Name of the blob
   * @param filePathOrStream - Path to file or readable stream
   * @param leaseId - Active lease ID
   * @param options - Upload options
   */
  async uploadBlobWithLease(
    blobName: string,
    filePathOrStream: string | Readable,
    leaseId: string,
    options?: UploadBlobOptions
  ): Promise<BlobUploadCommonResponse> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    let stream: Readable;

    if (typeof filePathOrStream === 'string') {
      stream = fs.createReadStream(filePathOrStream);
    } else {
      stream = filePathOrStream;
    }

    const uploadOptions: any = {
      blobHTTPHeaders: {
        blobContentType: options?.contentType || 'application/octet-stream',
      },
      metadata: options?.metadata,
      tags: options?.tags,
      conditions: {
        leaseId, // Require the lease to be held
      },
    };

    const response = await blockBlobClient.uploadStream(
      stream,
      4 * 1024 * 1024,
      20,
      uploadOptions
    );

    return response;
  }

  /**
   * Helper: Convert a readable stream to buffer
   */
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

  /**
   * Ensure the container exists, create if it doesn't
   */
  async ensureContainerExists(): Promise<void> {
    await this.containerClient.createIfNotExists();
  }
}
