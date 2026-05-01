import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import {
  BlobItem,
  BlockBlobClient,
  ContainerClient,
  Metadata,
  RestError,
  Tags,
} from "@azure/storage-blob";

export interface UploadBlobOptions {
  metadata?: Metadata;
  tags?: Tags;
  bufferSize?: number;
  maxConcurrency?: number;
  leaseId?: string;
}

export interface LeaseHandle {
  leaseId: string;
  release: () => Promise<void>;
}

const DEFAULT_BUFFER_SIZE = 8 * 1024 * 1024;
const DEFAULT_MAX_CONCURRENCY = 5;

export class BlobStorageService {
  public constructor(private readonly containerClient: ContainerClient) {}

  public async ensureContainerExists(): Promise<void> {
    await this.containerClient.createIfNotExists();
  }

  public async uploadFile(
    blobName: string,
    localFilePath: string,
    options: UploadBlobOptions = {},
  ): Promise<void> {
    await this.ensureContainerExists();
    await this.assertLocalFileExists(localFilePath);

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const blobAlreadyExists = await blockBlobClient.exists();

    if (!blobAlreadyExists) {
      try {
        await this.uploadStream(blockBlobClient, localFilePath, options, { ifNoneMatch: "*" });
        return;
      } catch (error) {
        if (!this.isAlreadyExistsRace(error)) {
          throw error;
        }
      }
    }

    await this.uploadWithLease(blockBlobClient, localFilePath, options);
  }

  public async downloadBlob(blobName: string): Promise<Buffer> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const response = await blobClient.download();
    const readableStream = response.readableStreamBody;

    if (!readableStream) {
      throw new Error(`Blob ${blobName} did not return a readable stream.`);
    }

    const chunks: Buffer[] = [];
    for await (const chunk of readableStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  public async listBlobs(): Promise<BlobItem[]> {
    const blobs: BlobItem[] = [];
    for await (const blob of this.containerClient.listBlobsFlat({
      includeMetadata: true,
      includeTags: true,
    })) {
      blobs.push(blob);
    }

    return blobs;
  }

  public async deleteBlob(blobName: string): Promise<void> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    await blobClient.deleteIfExists({ deleteSnapshots: "include" });
  }

  public async acquireLease(blobName: string, durationInSeconds = -1): Promise<LeaseHandle> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const exists = await blobClient.exists();
    if (!exists) {
      throw new Error(`Cannot acquire a lease for missing blob ${blobName}.`);
    }

    const leaseClient = blobClient.getBlobLeaseClient();
    const response = await leaseClient.acquireLease(durationInSeconds);
    if (!response.leaseId) {
      throw new Error(`Azure Storage did not return a lease ID for blob ${blobName}.`);
    }

    return {
      leaseId: response.leaseId,
      release: async () => {
        await leaseClient.releaseLease();
      },
    };
  }

  private async uploadWithLease(
    blockBlobClient: BlockBlobClient,
    localFilePath: string,
    options: UploadBlobOptions,
  ): Promise<void> {
    let leaseHandle: LeaseHandle | undefined;
    let leaseId = options.leaseId;

    if (!leaseId) {
      leaseHandle = await this.acquireLease(blockBlobClient.name);
      leaseId = leaseHandle.leaseId;
    }

    try {
      await this.uploadStream(blockBlobClient, localFilePath, options, { leaseId });
    } finally {
      if (leaseHandle) {
        await leaseHandle.release();
      }
    }
  }

  private async uploadStream(
    blockBlobClient: BlockBlobClient,
    localFilePath: string,
    options: UploadBlobOptions,
    conditions?: { ifNoneMatch?: string; leaseId?: string },
  ): Promise<void> {
    const readStream = createReadStream(localFilePath);

    await blockBlobClient.uploadStream(
      readStream,
      options.bufferSize ?? DEFAULT_BUFFER_SIZE,
      options.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY,
      {
        metadata: options.metadata,
        tags: options.tags,
        conditions,
      },
    );
  }

  private async assertLocalFileExists(localFilePath: string): Promise<void> {
    const fileStats = await stat(localFilePath);
    if (!fileStats.isFile()) {
      throw new Error(`Expected ${localFilePath} to be a file.`);
    }
  }

  private isAlreadyExistsRace(error: unknown): boolean {
    if (!(error instanceof RestError)) {
      return false;
    }

    return error.statusCode === 409 || error.statusCode === 412;
  }
}
