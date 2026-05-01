import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobUploadCommonResponse,
  BlobDownloadResponseParsed,
  BlobItem,
  Tags,
  Metadata
} from '@azure/storage-blob';
import { Readable } from 'stream';
import * as fs from 'fs';

export interface UploadOptions {
  metadata?: Metadata;
  tags?: Tags;
  contentType?: string;
}

export interface LeaseInfo {
  leaseId: string;
  expiresAt: Date;
}

export class BlobStorageService {
  private containerClient: ContainerClient;

  constructor(
    private blobServiceClient: BlobServiceClient,
    private containerName: string
  ) {
    this.containerClient = this.blobServiceClient.getContainerClient(containerName);
  }

  /**
   * Ensures the container exists, creates it if it doesn't
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
   * Upload a file to blob storage using streaming for memory efficiency.
   * Handles large files without loading them entirely into memory.
   */
  async uploadFile(
    blobName: string,
    filePath: string,
    options?: UploadOptions
  ): Promise<BlobUploadCommonResponse> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    // Create read stream for memory-efficient upload
    const fileStream = fs.createReadStream(filePath);
    const fileStats = fs.statSync(filePath);
    
    console.log(`⬆️  Uploading '${blobName}' (${this.formatBytes(fileStats.size)})...`);

    const uploadResponse = await blockBlobClient.uploadStream(
      fileStream,
      4 * 1024 * 1024, // 4MB buffer size for streaming
      5, // 5 concurrent uploads
      {
        blobHTTPHeaders: options?.contentType ? { blobContentType: options.contentType } : undefined,
        metadata: options?.metadata,
        tags: options?.tags
      }
    );

    console.log(`✓ Upload complete. ETag: ${uploadResponse.etag}`);
    return uploadResponse;
  }

  /**
   * Upload from a stream (useful for in-memory data or piped content)
   */
  async uploadStream(
    blobName: string,
    stream: Readable,
    options?: UploadOptions
  ): Promise<BlobUploadCommonResponse> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    console.log(`⬆️  Uploading '${blobName}' from stream...`);

    const uploadResponse = await blockBlobClient.uploadStream(
      stream,
      4 * 1024 * 1024,
      5,
      {
        blobHTTPHeaders: options?.contentType ? { blobContentType: options.contentType } : undefined,
        metadata: options?.metadata,
        tags: options?.tags
      }
    );

    console.log(`✓ Upload complete. ETag: ${uploadResponse.etag}`);
    return uploadResponse;
  }

  /**
   * Download a blob to a file
   */
  async downloadToFile(blobName: string, destinationPath: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    console.log(`⬇️  Downloading '${blobName}'...`);
    
    await blockBlobClient.downloadToFile(destinationPath);
    
    const fileStats = fs.statSync(destinationPath);
    console.log(`✓ Download complete (${this.formatBytes(fileStats.size)})`);
  }

  /**
   * Download blob content as a buffer
   */
  async downloadToBuffer(blobName: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    console.log(`⬇️  Downloading '${blobName}' to memory...`);
    
    const downloadResponse = await blockBlobClient.download();
    const chunks: Buffer[] = [];
    
    if (downloadResponse.readableStreamBody) {
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
      }
    }
    
    const buffer = Buffer.concat(chunks);
    console.log(`✓ Downloaded ${this.formatBytes(buffer.length)} to memory`);
    return buffer;
  }

  /**
   * List all blobs in the container with their metadata and tags
   */
  async listBlobs(): Promise<BlobItem[]> {
    console.log(`📋 Listing blobs in container '${this.containerName}'...`);
    
    const blobs: BlobItem[] = [];
    
    // Include metadata and tags in the listing
    for await (const blob of this.containerClient.listBlobsFlat({
      includeMetadata: true,
      includeTags: true
    })) {
      blobs.push(blob);
    }
    
    console.log(`✓ Found ${blobs.length} blob(s)`);
    return blobs;
  }

  /**
   * Delete a blob
   */
  async deleteBlob(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    console.log(`🗑️  Deleting '${blobName}'...`);
    
    await blockBlobClient.delete();
    
    console.log(`✓ Blob deleted`);
  }

  /**
   * Acquire a lease on a blob to prevent concurrent modifications.
   * Returns the lease ID which must be provided for subsequent operations.
   */
  async acquireLease(blobName: string, durationSeconds: number = 60): Promise<LeaseInfo> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const blobLeaseClient = blockBlobClient.getBlobLeaseClient();
    
    console.log(`🔒 Acquiring ${durationSeconds}s lease on '${blobName}'...`);
    
    const leaseResponse = await blobLeaseClient.acquireLease(durationSeconds);
    
    const expiresAt = new Date(Date.now() + durationSeconds * 1000);
    
    console.log(`✓ Lease acquired. Lease ID: ${leaseResponse.leaseId}`);
    console.log(`  Expires at: ${expiresAt.toISOString()}`);
    
    return {
      leaseId: leaseResponse.leaseId!,
      expiresAt
    };
  }

  /**
   * Release a lease on a blob
   */
  async releaseLease(blobName: string, leaseId: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const blobLeaseClient = blockBlobClient.getBlobLeaseClient(leaseId);
    
    console.log(`🔓 Releasing lease on '${blobName}'...`);
    
    await blobLeaseClient.releaseLease();
    
    console.log(`✓ Lease released`);
  }

  /**
   * Upload with lease (prevents concurrent writes)
   */
  async uploadFileWithLease(
    blobName: string,
    filePath: string,
    leaseId: string,
    options?: UploadOptions
  ): Promise<BlobUploadCommonResponse> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    const fileStream = fs.createReadStream(filePath);
    const fileStats = fs.statSync(filePath);
    
    console.log(`⬆️  Uploading '${blobName}' with lease (${this.formatBytes(fileStats.size)})...`);

    const uploadResponse = await blockBlobClient.uploadStream(
      fileStream,
      4 * 1024 * 1024,
      5,
      {
        blobHTTPHeaders: options?.contentType ? { blobContentType: options.contentType } : undefined,
        metadata: options?.metadata,
        tags: options?.tags,
        conditions: {
          leaseId: leaseId
        }
      }
    );

    console.log(`✓ Upload with lease complete. ETag: ${uploadResponse.etag}`);
    return uploadResponse;
  }

  /**
   * Query blobs by index tags (requires Blob Index feature enabled on storage account)
   */
  async queryBlobsByTags(tagQuery: string): Promise<string[]> {
    console.log(`🔍 Querying blobs with tags: ${tagQuery}...`);
    
    const blobNames: string[] = [];
    
    const iterator = this.blobServiceClient.findBlobsByTags(tagQuery);
    
    for await (const blob of iterator) {
      if (blob.containerName === this.containerName) {
        blobNames.push(blob.name);
      }
    }
    
    console.log(`✓ Found ${blobNames.length} matching blob(s)`);
    return blobNames;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
