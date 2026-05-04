import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobUploadCommonResponse,
  BlobDownloadResponseParsed,
  BlobItem,
  BlobLeaseClient,
  Tags
} from '@azure/storage-blob';
import { BlobStorageConfiguration } from './config';
import * as fs from 'fs';
import * as stream from 'stream';
import { pipeline } from 'stream/promises';

export interface UploadOptions {
  metadata?: Record<string, string>;
  tags?: Tags;
  contentType?: string;
}

export interface BlobMetadata {
  name: string;
  size: number;
  lastModified: Date;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Tags;
}

export class BlobStorageService {
  private containerClient: ContainerClient;
  private blobServiceClient: BlobServiceClient;

  constructor() {
    const config = BlobStorageConfiguration.getInstance();
    this.blobServiceClient = config.getBlobServiceClient();
    this.containerClient = this.blobServiceClient.getContainerClient(config.getContainerName());
  }

  /**
   * Ensures the container exists, creating it if necessary
   */
  public async ensureContainer(): Promise<void> {
    await this.containerClient.createIfNotExists();
    console.log(`Container '${this.containerClient.containerName}' ready`);
  }

  /**
   * Upload a file to blob storage using streaming for memory efficiency
   * Handles large files without loading entire content into memory
   */
  public async uploadFile(
    localFilePath: string,
    blobName: string,
    options?: UploadOptions
  ): Promise<BlobUploadCommonResponse> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    const fileStats = fs.statSync(localFilePath);
    const fileStream = fs.createReadStream(localFilePath);

    console.log(`Uploading ${blobName} (${fileStats.size} bytes) using streaming...`);

    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: options?.contentType || 'application/octet-stream'
      },
      metadata: options?.metadata,
      tags: options?.tags
    };

    // Upload with streaming - handles large files efficiently
    const response = await blockBlobClient.uploadStream(
      fileStream,
      4 * 1024 * 1024, // 4 MB buffer size
      20, // Max concurrent requests
      uploadOptions
    );

    console.log(`✓ Upload completed. ETag: ${response.etag}`);
    return response;
  }

  /**
   * Upload content from a stream with optional metadata and tags
   */
  public async uploadStream(
    inputStream: stream.Readable,
    blobName: string,
    options?: UploadOptions
  ): Promise<BlobUploadCommonResponse> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: options?.contentType || 'application/octet-stream'
      },
      metadata: options?.metadata,
      tags: options?.tags
    };

    return await blockBlobClient.uploadStream(
      inputStream,
      4 * 1024 * 1024,
      20,
      uploadOptions
    );
  }

  /**
   * Download a blob to a local file using streaming
   */
  public async downloadFile(blobName: string, destinationPath: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    console.log(`Downloading ${blobName} to ${destinationPath}...`);

    const downloadResponse = await blockBlobClient.download(0);
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error('No readable stream in download response');
    }

    const writeStream = fs.createWriteStream(destinationPath);
    await pipeline(downloadResponse.readableStreamBody, writeStream);

    console.log(`✓ Download completed`);
  }

  /**
   * Download blob content as a buffer
   */
  public async downloadToBuffer(blobName: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const downloadResponse = await blockBlobClient.download(0);
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error('No readable stream in download response');
    }

    const chunks: Buffer[] = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  /**
   * List all blobs in the container with their metadata
   */
  public async listBlobs(): Promise<BlobMetadata[]> {
    const blobs: BlobMetadata[] = [];

    console.log('Listing blobs in container...');

    for await (const blob of this.containerClient.listBlobsFlat({ includeMetadata: true, includeTags: true })) {
      blobs.push({
        name: blob.name,
        size: blob.properties.contentLength || 0,
        lastModified: blob.properties.lastModified || new Date(),
        contentType: blob.properties.contentType,
        metadata: blob.metadata,
        tags: blob.tags
      });
    }

    console.log(`✓ Found ${blobs.length} blob(s)`);
    return blobs;
  }

  /**
   * Delete a blob
   */
  public async deleteBlob(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    console.log(`Deleting ${blobName}...`);
    await blockBlobClient.delete();
    console.log(`✓ Blob deleted`);
  }

  /**
   * Acquire a lease on a blob to prevent concurrent writes
   * Returns the lease ID which must be provided for subsequent operations
   */
  public async acquireLease(blobName: string, leaseDurationSeconds: number = 15): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const leaseClient = blockBlobClient.getBlobLeaseClient();

    console.log(`Acquiring lease on ${blobName} for ${leaseDurationSeconds} seconds...`);
    const leaseResult = await leaseClient.acquireLease(leaseDurationSeconds);
    
    console.log(`✓ Lease acquired: ${leaseResult.leaseId}`);
    return leaseResult.leaseId!;
  }

  /**
   * Release a lease on a blob
   */
  public async releaseLease(blobName: string, leaseId: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const leaseClient = blockBlobClient.getBlobLeaseClient(leaseId);

    console.log(`Releasing lease ${leaseId}...`);
    await leaseClient.releaseLease();
    console.log(`✓ Lease released`);
  }

  /**
   * Upload with lease protection - prevents concurrent writes
   */
  public async uploadWithLease(
    localFilePath: string,
    blobName: string,
    leaseId: string,
    options?: UploadOptions
  ): Promise<BlobUploadCommonResponse> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    const fileStats = fs.statSync(localFilePath);
    const fileStream = fs.createReadStream(localFilePath);

    console.log(`Uploading ${blobName} with lease protection...`);

    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: options?.contentType || 'application/octet-stream'
      },
      metadata: options?.metadata,
      tags: options?.tags,
      conditions: {
        leaseId: leaseId
      }
    };

    const response = await blockBlobClient.uploadStream(
      fileStream,
      4 * 1024 * 1024,
      20,
      uploadOptions
    );

    console.log(`✓ Upload with lease completed`);
    return response;
  }

  /**
   * Get blob properties including metadata and tags
   */
  public async getBlobProperties(blobName: string): Promise<BlobMetadata> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    const properties = await blockBlobClient.getProperties();
    const tags = await blockBlobClient.getTags();

    return {
      name: blobName,
      size: properties.contentLength || 0,
      lastModified: properties.lastModified || new Date(),
      contentType: properties.contentType,
      metadata: properties.metadata,
      tags: tags.tags
    };
  }
}
