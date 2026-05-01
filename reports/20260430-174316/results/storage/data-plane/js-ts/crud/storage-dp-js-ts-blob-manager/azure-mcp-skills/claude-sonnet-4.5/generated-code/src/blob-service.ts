import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobDownloadResponseParsed,
  BlobItem,
  Tags,
} from '@azure/storage-blob';
import { BlobStorageConfig } from './config';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadOptions {
  metadata?: { [key: string]: string };
  tags?: Tags;
}

export interface LeaseInfo {
  leaseId: string;
  blockBlobClient: BlockBlobClient;
}

export class BlobStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;

  constructor() {
    const config = BlobStorageConfig.getInstance();
    this.blobServiceClient = config.getBlobServiceClient();
    this.containerName = config.getContainerName();
    this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
  }

  /**
   * Ensures the container exists, creating it if necessary
   */
  public async ensureContainer(): Promise<void> {
    const exists = await this.containerClient.exists();
    if (!exists) {
      console.log(`Container '${this.containerName}' does not exist. Creating...`);
      await this.containerClient.create();
      console.log(`Container '${this.containerName}' created successfully.`);
    }
  }

  /**
   * Upload a file to blob storage using streaming for efficient memory usage.
   * Supports metadata and blob index tags for querying.
   */
  public async upload(
    blobName: string,
    filePath: string,
    options?: UploadOptions
  ): Promise<void> {
    await this.ensureContainer();

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const fileStream = fs.createReadStream(filePath);
    const fileStats = fs.statSync(filePath);

    console.log(`Uploading '${blobName}' (${fileStats.size} bytes) using streaming...`);

    await blockBlobClient.uploadStream(
      fileStream,
      4 * 1024 * 1024, // 4MB buffer size
      5, // Max concurrent uploads
      {
        metadata: options?.metadata,
        tags: options?.tags,
      }
    );

    console.log(`Upload complete: ${blobName}`);
  }

  /**
   * Download a blob to a local file or return as a buffer
   */
  public async download(blobName: string, destinationPath?: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    console.log(`Downloading '${blobName}'...`);
    const downloadResponse: BlobDownloadResponseParsed = await blockBlobClient.download(0);

    if (!downloadResponse.readableStreamBody) {
      throw new Error('Failed to get readable stream from blob');
    }

    const chunks: Buffer[] = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }

    const buffer = Buffer.concat(chunks);

    if (destinationPath) {
      fs.writeFileSync(destinationPath, buffer);
      console.log(`Downloaded to: ${destinationPath}`);
    }

    return buffer;
  }

  /**
   * List all blobs in the container with their properties
   */
  public async listBlobs(): Promise<BlobItem[]> {
    console.log(`Listing blobs in container '${this.containerName}'...`);
    
    const blobs: BlobItem[] = [];
    const iterator = this.containerClient.listBlobsFlat({
      includeMetadata: true,
      includeTags: true,
    });

    for await (const blob of iterator) {
      blobs.push(blob);
    }

    return blobs;
  }

  /**
   * Delete a blob from the container
   */
  public async delete(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    console.log(`Deleting blob '${blobName}'...`);
    await blockBlobClient.delete();
    console.log(`Blob '${blobName}' deleted successfully.`);
  }

  /**
   * Acquire a lease on a blob to prevent concurrent writes.
   * Returns lease info that must be used for subsequent operations.
   */
  public async acquireLease(blobName: string, durationSeconds: number = 60): Promise<LeaseInfo> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const blobLeaseClient = blockBlobClient.getBlobLeaseClient();

    console.log(`Acquiring ${durationSeconds}s lease on '${blobName}'...`);
    const leaseResponse = await blobLeaseClient.acquireLease(durationSeconds);
    
    console.log(`Lease acquired: ${leaseResponse.leaseId}`);

    return {
      leaseId: leaseResponse.leaseId!,
      blockBlobClient,
    };
  }

  /**
   * Upload with an existing lease to ensure exclusive write access
   */
  public async uploadWithLease(
    leaseInfo: LeaseInfo,
    filePath: string,
    options?: UploadOptions
  ): Promise<void> {
    const fileStream = fs.createReadStream(filePath);
    const fileStats = fs.statSync(filePath);

    console.log(`Uploading with lease (${fileStats.size} bytes)...`);

    await leaseInfo.blockBlobClient.uploadStream(
      fileStream,
      4 * 1024 * 1024,
      5,
      {
        metadata: options?.metadata,
        tags: options?.tags,
        conditions: {
          leaseId: leaseInfo.leaseId,
        },
      }
    );

    console.log(`Upload with lease complete.`);
  }

  /**
   * Release a previously acquired lease
   */
  public async releaseLease(leaseInfo: LeaseInfo): Promise<void> {
    const blobLeaseClient = leaseInfo.blockBlobClient.getBlobLeaseClient(leaseInfo.leaseId);
    
    console.log(`Releasing lease ${leaseInfo.leaseId}...`);
    await blobLeaseClient.releaseLease();
    console.log(`Lease released.`);
  }
}
