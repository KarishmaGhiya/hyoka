import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobDownloadResponseParsed,
  BlobItem,
  Tags
} from "@azure/storage-blob";
import { Readable } from "stream";
import * as fs from "fs";

/**
 * Options for uploading a blob
 */
export interface UploadOptions {
  /** Custom metadata key-value pairs */
  metadata?: Record<string, string>;
  /** Blob index tags for querying */
  tags?: Tags;
  /** Content type (MIME type) */
  contentType?: string;
}

/**
 * Options for downloading a blob
 */
export interface DownloadOptions {
  /** Download to a file path instead of returning content */
  filePath?: string;
}

/**
 * Result of a blob upload operation
 */
export interface UploadResult {
  blobName: string;
  etag: string;
  lastModified: Date;
  contentLength: number;
}

/**
 * Result of a blob download operation
 */
export interface DownloadResult {
  blobName: string;
  content?: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Tags;
}

/**
 * Information about a blob in a container
 */
export interface BlobInfo {
  name: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
}

/**
 * Service class for Azure Blob Storage operations
 * Provides upload, download, list, and delete functionality with streaming support
 */
export class BlobStorageService {
  private serviceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;

  constructor(serviceClient: BlobServiceClient, containerName: string) {
    this.serviceClient = serviceClient;
    this.containerName = containerName;
    this.containerClient = serviceClient.getContainerClient(containerName);
  }

  /**
   * Ensure the container exists, create if it doesn't
   */
  public async ensureContainer(): Promise<void> {
    const exists = await this.containerClient.exists();
    if (!exists) {
      await this.containerClient.create();
      console.log(`Container '${this.containerName}' created`);
    }
  }

  /**
   * Upload a blob with streaming support for large files
   * Handles multi-gigabyte files without loading entire content into memory
   * 
   * @param blobName - Name of the blob to create
   * @param source - File path or readable stream
   * @param options - Upload options (metadata, tags, content type)
   */
  public async uploadBlob(
    blobName: string,
    source: string | Readable,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    let stream: Readable;
    let contentLength: number | undefined;

    // Handle file path or stream input
    if (typeof source === "string") {
      const stats = fs.statSync(source);
      contentLength = stats.size;
      stream = fs.createReadStream(source);
    } else {
      stream = source;
    }

    // Upload with streaming
    const uploadResponse = await blockBlobClient.uploadStream(
      stream,
      4 * 1024 * 1024, // 4MB buffer size
      20, // Max concurrent uploads
      {
        metadata: options?.metadata,
        blobHTTPHeaders: {
          blobContentType: options?.contentType
        },
        tags: options?.tags
      }
    );

    return {
      blobName,
      etag: uploadResponse.etag!,
      lastModified: uploadResponse.lastModified!,
      contentLength: contentLength ?? 0
    };
  }

  /**
   * Upload a blob with lease acquisition to prevent concurrent writes
   * Acquires a lease before writing, ensuring no other process can modify the blob
   * 
   * @param blobName - Name of the blob to create/update
   * @param source - File path or readable stream
   * @param options - Upload options (metadata, tags, content type)
   */
  public async uploadBlobWithLease(
    blobName: string,
    source: string | Readable,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const blobLeaseClient = blockBlobClient.getBlobLeaseClient();

    // Check if blob exists
    const exists = await blockBlobClient.exists();
    let leaseId: string | undefined;

    try {
      if (exists) {
        // Acquire lease for 15 seconds (minimum duration)
        const leaseResponse = await blobLeaseClient.acquireLease(15);
        leaseId = leaseResponse.leaseId;
        console.log(`Lease acquired for blob '${blobName}': ${leaseId}`);
      }

      let stream: Readable;
      let contentLength: number | undefined;

      if (typeof source === "string") {
        const stats = fs.statSync(source);
        contentLength = stats.size;
        stream = fs.createReadStream(source);
      } else {
        stream = source;
      }

      // Upload with lease condition
      const uploadResponse = await blockBlobClient.uploadStream(
        stream,
        4 * 1024 * 1024,
        20,
        {
          metadata: options?.metadata,
          blobHTTPHeaders: {
            blobContentType: options?.contentType
          },
          tags: options?.tags,
          conditions: leaseId ? { leaseId } : undefined
        }
      );

      return {
        blobName,
        etag: uploadResponse.etag!,
        lastModified: uploadResponse.lastModified!,
        contentLength: contentLength ?? 0
      };
    } finally {
      // Always release the lease
      if (leaseId) {
        try {
          await blobLeaseClient.releaseLease();
          console.log(`Lease released for blob '${blobName}'`);
        } catch (error) {
          console.warn(`Failed to release lease: ${error}`);
        }
      }
    }
  }

  /**
   * Download a blob
   * 
   * @param blobName - Name of the blob to download
   * @param options - Download options
   */
  public async downloadBlob(
    blobName: string,
    options?: DownloadOptions
  ): Promise<DownloadResult> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    const downloadResponse = await blockBlobClient.download(0);

    // Download to file if path specified
    if (options?.filePath) {
      const writeStream = fs.createWriteStream(options.filePath);
      await this.streamToFile(downloadResponse, writeStream);

      return {
        blobName,
        contentType: downloadResponse.contentType,
        metadata: downloadResponse.metadata,
        tags: await this.getBlobTags(blobName)
      };
    }

    // Download to buffer
    const content = await this.streamToBuffer(downloadResponse);

    return {
      blobName,
      content,
      contentType: downloadResponse.contentType,
      metadata: downloadResponse.metadata,
      tags: await this.getBlobTags(blobName)
    };
  }

  /**
   * List all blobs in the container
   * 
   * @param prefix - Optional prefix to filter blobs
   */
  public async listBlobs(prefix?: string): Promise<BlobInfo[]> {
    const blobs: BlobInfo[] = [];

    for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
      blobs.push({
        name: blob.name,
        size: blob.properties.contentLength ?? 0,
        lastModified: blob.properties.lastModified!,
        etag: blob.properties.etag!,
        contentType: blob.properties.contentType
      });
    }

    return blobs;
  }

  /**
   * Delete a blob
   * 
   * @param blobName - Name of the blob to delete
   */
  public async deleteBlob(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  }

  /**
   * Get blob index tags
   */
  private async getBlobTags(blobName: string): Promise<Tags> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const tagsResponse = await blockBlobClient.getTags();
    return tagsResponse.tags;
  }

  /**
   * Stream blob content to buffer
   */
  private async streamToBuffer(
    response: BlobDownloadResponseParsed
  ): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    if (!response.readableStreamBody) {
      throw new Error("No readable stream body available");
    }

    return new Promise((resolve, reject) => {
      response.readableStreamBody!.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      response.readableStreamBody!.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      response.readableStreamBody!.on("error", reject);
    });
  }

  /**
   * Stream blob content to file
   */
  private async streamToFile(
    response: BlobDownloadResponseParsed,
    writeStream: fs.WriteStream
  ): Promise<void> {
    if (!response.readableStreamBody) {
      throw new Error("No readable stream body available");
    }

    return new Promise((resolve, reject) => {
      response.readableStreamBody!.pipe(writeStream);
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });
  }
}
