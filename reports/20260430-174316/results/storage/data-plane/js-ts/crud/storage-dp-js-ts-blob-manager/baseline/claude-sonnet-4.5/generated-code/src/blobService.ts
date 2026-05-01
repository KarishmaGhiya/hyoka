import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobDownloadResponseParsed,
  ContainerListBlobFlatSegmentResponse,
  BlobItem,
  Tags,
} from '@azure/storage-blob';
import { Readable } from 'stream';
import * as fs from 'fs';

export interface UploadOptions {
  metadata?: Record<string, string>;
  tags?: Tags;
  contentType?: string;
}

export interface BlobInfo {
  name: string;
  size?: number;
  lastModified?: Date;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Tags;
}

export class BlobStorageService {
  private containerClient: ContainerClient;

  constructor(
    private blobServiceClient: BlobServiceClient,
    private containerName: string
  ) {
    this.containerClient = this.blobServiceClient.getContainerClient(containerName);
  }

  public async ensureContainerExists(): Promise<void> {
    await this.containerClient.createIfNotExists();
  }

  public async uploadStream(
    blobName: string,
    stream: Readable,
    options?: UploadOptions
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    const uploadOptions = {
      metadata: options?.metadata,
      tags: options?.tags,
      blobHTTPHeaders: options?.contentType
        ? { blobContentType: options.contentType }
        : undefined,
    };

    await blockBlobClient.uploadStream(stream, undefined, undefined, uploadOptions);
  }

  public async uploadFile(
    blobName: string,
    filePath: string,
    options?: UploadOptions
  ): Promise<void> {
    const stream = fs.createReadStream(filePath);
    await this.uploadStream(blobName, stream, options);
  }

  public async uploadWithLease(
    blobName: string,
    stream: Readable,
    options?: UploadOptions
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const blobLeaseClient = blockBlobClient.getBlobLeaseClient();

    let leaseId: string | undefined;

    try {
      const blobExists = await blockBlobClient.exists();

      if (blobExists) {
        const leaseResponse = await blobLeaseClient.acquireLease(30);
        leaseId = leaseResponse.leaseId;
        console.log(`[BlobService] Acquired lease for blob '${blobName}': ${leaseId}`);
      }

      const uploadOptions = {
        metadata: options?.metadata,
        tags: options?.tags,
        blobHTTPHeaders: options?.contentType
          ? { blobContentType: options.contentType }
          : undefined,
        conditions: leaseId ? { leaseId } : undefined,
      };

      await blockBlobClient.uploadStream(stream, undefined, undefined, uploadOptions);

      if (leaseId) {
        await blobLeaseClient.releaseLease();
        console.log(`[BlobService] Released lease for blob '${blobName}'`);
      }
    } catch (error) {
      if (leaseId) {
        try {
          await blobLeaseClient.releaseLease();
          console.log(`[BlobService] Released lease after error for blob '${blobName}'`);
        } catch (releaseError) {
          console.error(`[BlobService] Failed to release lease:`, releaseError);
        }
      }
      throw error;
    }
  }

  public async download(blobName: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const downloadResponse: BlobDownloadResponseParsed = await blockBlobClient.download();

    if (!downloadResponse.readableStreamBody) {
      throw new Error('No readable stream in download response');
    }

    return this.streamToBuffer(downloadResponse.readableStreamBody);
  }

  public async downloadToFile(blobName: string, destinationPath: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.downloadToFile(destinationPath);
  }

  public async listBlobs(prefix?: string): Promise<BlobInfo[]> {
    const blobs: BlobInfo[] = [];
    const iterator = this.containerClient.listBlobsFlat({ prefix });

    for await (const blob of iterator) {
      const blobClient = this.containerClient.getBlobClient(blob.name);
      const properties = await blobClient.getProperties();

      blobs.push({
        name: blob.name,
        size: blob.properties.contentLength,
        lastModified: blob.properties.lastModified,
        contentType: blob.properties.contentType,
        metadata: properties.metadata,
        tags: properties.tags,
      });
    }

    return blobs;
  }

  public async deleteBlob(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  }

  public async blobExists(blobName: string): Promise<boolean> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.exists();
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data: Buffer | string) => {
        chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
}
