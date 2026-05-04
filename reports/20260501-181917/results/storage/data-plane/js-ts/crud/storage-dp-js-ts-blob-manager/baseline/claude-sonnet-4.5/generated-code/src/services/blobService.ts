import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobUploadCommonResponse,
  BlobDownloadResponseParsed,
  ContainerListBlobsOptions,
  BlobItem,
  Tags,
  Metadata,
} from '@azure/storage-blob';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Options for uploading a blob
 */
export interface UploadOptions {
  /**
   * Metadata key-value pairs to attach to the blob
   */
  metadata?: Metadata;
  
  /**
   * Index tags for querying blobs (max 10 tags)
   */
  tags?: Tags;
  
  /**
   * Content type of the blob
   */
  contentType?: string;
  
  /**
   * Block size for uploads (default: 4MB for streaming)
   */
  blockSize?: number;
  
  /**
   * Number of concurrent uploads (default: 5)
   */
  concurrency?: number;
}

/**
 * Options for listing blobs
 */
export interface ListBlobsOptions {
  /**
   * Prefix filter for blob names
   */
  prefix?: string;
  
  /**
   * Include blob metadata in results
   */
  includeMetadata?: boolean;
  
  /**
   * Include blob tags in results
   */
  includeTags?: boolean;
}

/**
 * Service class for Azure Blob Storage operations
 * Provides upload, download, list, and delete functionality with streaming support
 */
export class BlobStorageService {
  private readonly blobServiceClient: BlobServiceClient;

  constructor(blobServiceClient: BlobServiceClient) {
    this.blobServiceClient = blobServiceClient;
  }

  /**
   * Gets a container client for the specified container
   */
  private getContainerClient(containerName: string): ContainerClient {
    return this.blobServiceClient.getContainerClient(containerName);
  }

  /**
   * Gets a block blob client for the specified container and blob
   */
  private getBlockBlobClient(containerName: string, blobName: string): BlockBlobClient {
    return this.getContainerClient(containerName).getBlockBlobClient(blobName);
  }

  /**
   * Uploads a file to Azure Blob Storage with streaming support for large files.
   * Handles multi-gigabyte files efficiently without loading into memory.
   * 
   * @param containerName - Name of the container
   * @param blobName - Name of the blob
   * @param filePath - Path to the file to upload
   * @param options - Upload options including metadata and tags
   * @returns Upload response
   */
  public async uploadFile(
    containerName: string,
    blobName: string,
    filePath: string,
    options?: UploadOptions
  ): Promise<BlobUploadCommonResponse> {
    const blockBlobClient = this.getBlockBlobClient(containerName, blobName);
    
    // Get file size for progress reporting
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    
    console.log(`Uploading ${filePath} (${(fileSize / 1024 / 1024).toFixed(2)} MB) to ${containerName}/${blobName}...`);

    // Create a readable stream from the file
    const readableStream = fs.createReadStream(filePath);

    // Upload with streaming - efficient for large files
    const uploadResponse = await blockBlobClient.uploadStream(
      readableStream,
      options?.blockSize || 4 * 1024 * 1024, // 4 MB blocks by default
      options?.concurrency || 5,
      {
        blobHTTPHeaders: options?.contentType ? { blobContentType: options.contentType } : undefined,
        metadata: options?.metadata,
        tags: options?.tags,
      }
    );

    console.log(`✓ Upload complete. ETag: ${uploadResponse.etag}`);
    
    return uploadResponse;
  }

  /**
   * Uploads content from a buffer or string to Azure Blob Storage
   * 
   * @param containerName - Name of the container
   * @param blobName - Name of the blob
   * @param content - Content to upload (string or Buffer)
   * @param options - Upload options
   * @returns Upload response
   */
  public async uploadContent(
    containerName: string,
    blobName: string,
    content: string | Buffer,
    options?: UploadOptions
  ): Promise<BlobUploadCommonResponse> {
    const blockBlobClient = this.getBlockBlobClient(containerName, blobName);
    
    const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
    
    console.log(`Uploading content to ${containerName}/${blobName} (${buffer.length} bytes)...`);

    const uploadResponse = await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: options?.contentType ? { blobContentType: options.contentType } : undefined,
      metadata: options?.metadata,
      tags: options?.tags,
    });

    console.log(`✓ Upload complete. ETag: ${uploadResponse.etag}`);
    
    return uploadResponse;
  }

  /**
   * Uploads content with lease-based concurrency control.
   * Acquires a lease before writing to prevent concurrent overwrites.
   * 
   * @param containerName - Name of the container
   * @param blobName - Name of the blob
   * @param content - Content to upload
   * @param leaseDuration - Lease duration in seconds (15-60, or -1 for infinite)
   * @param options - Upload options
   * @returns Upload response
   */
  public async uploadWithLease(
    containerName: string,
    blobName: string,
    content: string | Buffer,
    leaseDuration: number = 15,
    options?: UploadOptions
  ): Promise<BlobUploadCommonResponse> {
    const blockBlobClient = this.getBlockBlobClient(containerName, blobName);
    const blobLeaseClient = blockBlobClient.getBlobLeaseClient();
    
    console.log(`Acquiring ${leaseDuration}s lease on ${containerName}/${blobName}...`);
    
    try {
      // Acquire lease to prevent concurrent writes
      const leaseResponse = await blobLeaseClient.acquireLease(leaseDuration);
      console.log(`✓ Lease acquired: ${leaseResponse.leaseId}`);
      
      try {
        const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
        
        // Upload with lease condition
        const uploadResponse = await blockBlobClient.upload(buffer, buffer.length, {
          conditions: { leaseId: leaseResponse.leaseId },
          blobHTTPHeaders: options?.contentType ? { blobContentType: options.contentType } : undefined,
          metadata: options?.metadata,
          tags: options?.tags,
        });
        
        console.log(`✓ Upload with lease complete. ETag: ${uploadResponse.etag}`);
        
        return uploadResponse;
      } finally {
        // Always release the lease
        await blobLeaseClient.releaseLease();
        console.log(`✓ Lease released`);
      }
    } catch (error: any) {
      if (error.statusCode === 409) {
        throw new Error(`Blob is already leased by another client: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Downloads a blob from Azure Blob Storage to a file
   * 
   * @param containerName - Name of the container
   * @param blobName - Name of the blob
   * @param downloadPath - Path where the file should be saved
   * @returns Download response
   */
  public async downloadToFile(
    containerName: string,
    blobName: string,
    downloadPath: string
  ): Promise<void> {
    const blockBlobClient = this.getBlockBlobClient(containerName, blobName);
    
    console.log(`Downloading ${containerName}/${blobName} to ${downloadPath}...`);
    
    await blockBlobClient.downloadToFile(downloadPath);
    
    console.log(`✓ Download complete`);
  }

  /**
   * Downloads a blob and returns its content as a buffer
   * 
   * @param containerName - Name of the container
   * @param blobName - Name of the blob
   * @returns Blob content as Buffer
   */
  public async downloadToBuffer(
    containerName: string,
    blobName: string
  ): Promise<Buffer> {
    const blockBlobClient = this.getBlockBlobClient(containerName, blobName);
    
    console.log(`Downloading ${containerName}/${blobName} to buffer...`);
    
    const downloadResponse = await blockBlobClient.download(0);
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error('No readable stream in download response');
    }
    
    const chunks: Buffer[] = [];
    
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }
    
    const buffer = Buffer.concat(chunks);
    console.log(`✓ Downloaded ${buffer.length} bytes`);
    
    return buffer;
  }

  /**
   * Lists all blobs in a container with optional filtering
   * 
   * @param containerName - Name of the container
   * @param options - List options
   * @returns Array of blob items
   */
  public async listBlobs(
    containerName: string,
    options?: ListBlobsOptions
  ): Promise<BlobItem[]> {
    const containerClient = this.getContainerClient(containerName);
    
    const listOptions: ContainerListBlobsOptions = {
      prefix: options?.prefix,
      includeMetadata: options?.includeMetadata,
      includeTags: options?.includeTags,
    };
    
    console.log(`Listing blobs in container: ${containerName}${options?.prefix ? ` (prefix: ${options.prefix})` : ''}...`);
    
    const blobs: BlobItem[] = [];
    
    for await (const blob of containerClient.listBlobsFlat(listOptions)) {
      blobs.push(blob);
    }
    
    console.log(`✓ Found ${blobs.length} blob(s)`);
    
    return blobs;
  }

  /**
   * Deletes a blob from Azure Blob Storage
   * 
   * @param containerName - Name of the container
   * @param blobName - Name of the blob
   */
  public async deleteBlob(containerName: string, blobName: string): Promise<void> {
    const blockBlobClient = this.getBlockBlobClient(containerName, blobName);
    
    console.log(`Deleting ${containerName}/${blobName}...`);
    
    await blockBlobClient.delete();
    
    console.log(`✓ Blob deleted`);
  }

  /**
   * Ensures a container exists, creating it if necessary
   * 
   * @param containerName - Name of the container
   */
  public async ensureContainer(containerName: string): Promise<void> {
    const containerClient = this.getContainerClient(containerName);
    
    const exists = await containerClient.exists();
    
    if (!exists) {
      console.log(`Creating container: ${containerName}...`);
      await containerClient.create();
      console.log(`✓ Container created`);
    } else {
      console.log(`✓ Container ${containerName} already exists`);
    }
  }
}
