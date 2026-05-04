import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobDownloadResponseParsed,
  RestError,
  BlobLeaseClient,
} from "@azure/storage-blob";
import * as fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

export interface UploadOptions {
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  contentType?: string;
  onProgress?: (bytesUploaded: number) => void;
}

export interface BlobInfo {
  name: string;
  size: number;
  lastModified: Date;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

export class BlobStorageService {
  private readonly containerClient: ContainerClient;

  constructor(
    private readonly blobServiceClient: BlobServiceClient,
    private readonly containerName: string
  ) {
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  async initialize(): Promise<void> {
    await this.containerClient.createIfNotExists();
    console.log(`✓ Container '${this.containerName}' is ready`);
  }

  async uploadFromStream(
    blobName: string,
    stream: Readable,
    options?: UploadOptions
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    const bufferSize = 4 * 1024 * 1024; // 4MB
    const maxConcurrency = 5;

    await blockBlobClient.uploadStream(stream, bufferSize, maxConcurrency, {
      blobHTTPHeaders: options?.contentType
        ? { blobContentType: options.contentType }
        : undefined,
      metadata: options?.metadata,
      tags: options?.tags,
      onProgress: options?.onProgress
        ? (progress) => options.onProgress!(progress.loadedBytes)
        : undefined,
    });
  }

  async uploadFile(blobName: string, filePath: string, options?: UploadOptions): Promise<void> {
    const fileStream = fs.createReadStream(filePath);
    const stats = fs.statSync(filePath);

    console.log(`⬆ Uploading '${blobName}' (${this.formatBytes(stats.size)})...`);

    await this.uploadFromStream(blobName, fileStream, options);

    console.log(`✓ Upload complete: ${blobName}`);
  }

  async uploadWithLease(
    blobName: string,
    content: string | Buffer,
    options?: UploadOptions
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const leaseClient = blockBlobClient.getBlobLeaseClient();

    let leaseId: string | undefined;

    try {
      const blobExists = await blockBlobClient.exists();

      if (blobExists) {
        console.log(`🔒 Acquiring lease on '${blobName}'...`);
        const leaseResult = await leaseClient.acquireLease(30);
        leaseId = leaseResult.leaseId;
        console.log(`✓ Lease acquired: ${leaseId}`);
      }

      const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

      await blockBlobClient.upload(buffer, buffer.length, {
        conditions: leaseId ? { leaseId } : undefined,
        blobHTTPHeaders: options?.contentType
          ? { blobContentType: options.contentType }
          : undefined,
        metadata: options?.metadata,
        tags: options?.tags,
      });

      console.log(`✓ Blob updated with lease protection: ${blobName}`);
    } finally {
      if (leaseId) {
        try {
          await leaseClient.releaseLease();
          console.log(`✓ Lease released: ${leaseId}`);
        } catch (error) {
          console.warn(`⚠ Failed to release lease: ${error}`);
        }
      }
    }
  }

  async downloadToFile(blobName: string, destinationPath: string): Promise<void> {
    const blobClient = this.containerClient.getBlobClient(blobName);

    console.log(`⬇ Downloading '${blobName}'...`);

    const downloadResponse = await blobClient.download();

    if (!downloadResponse.readableStreamBody) {
      throw new Error("No readable stream in download response");
    }

    await pipeline(downloadResponse.readableStreamBody, fs.createWriteStream(destinationPath));

    console.log(`✓ Downloaded to: ${destinationPath}`);
  }

  async downloadToBuffer(blobName: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return await blockBlobClient.downloadToBuffer();
  }

  async downloadToString(blobName: string): Promise<string> {
    const buffer = await this.downloadToBuffer(blobName);
    return buffer.toString("utf-8");
  }

  async listBlobs(prefix?: string): Promise<BlobInfo[]> {
    const blobs: BlobInfo[] = [];

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

  async deleteBlob(blobName: string): Promise<void> {
    const blobClient = this.containerClient.getBlobClient(blobName);

    try {
      await blobClient.delete();
      console.log(`✓ Deleted: ${blobName}`);
    } catch (error) {
      if (error instanceof RestError && error.statusCode === 404) {
        console.log(`⚠ Blob not found: ${blobName}`);
      } else {
        throw error;
      }
    }
  }

  async blobExists(blobName: string): Promise<boolean> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    return await blobClient.exists();
  }

  async getBlobProperties(blobName: string): Promise<BlobInfo | null> {
    const blobClient = this.containerClient.getBlobClient(blobName);

    try {
      const properties = await blobClient.getProperties();
      const tagsResponse = await blobClient.getTags();

      return {
        name: blobName,
        size: properties.contentLength || 0,
        lastModified: properties.lastModified || new Date(),
        contentType: properties.contentType,
        metadata: properties.metadata,
        tags: tagsResponse.tags,
      };
    } catch (error) {
      if (error instanceof RestError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}
