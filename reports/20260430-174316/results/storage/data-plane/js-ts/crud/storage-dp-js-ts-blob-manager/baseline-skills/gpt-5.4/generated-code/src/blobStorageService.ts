import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import { dirname } from "node:path";
import {
  BlobServiceClient,
  BlobItem,
  BlockBlobParallelUploadOptions,
  ContainerClient,
  Tags
} from "@azure/storage-blob";

export interface UploadBlobOptions {
  metadata?: Record<string, string>;
  tags?: Tags;
  blockSize?: number;
  concurrency?: number;
  leaseDurationSeconds?: number;
}

export interface UploadBlobResult {
  etag?: string;
  lastModified?: Date;
  usedLease: boolean;
}

export class BlobStorageService {
  constructor(private readonly blobServiceClient: BlobServiceClient) {}

  async ensureContainer(containerName: string): Promise<void> {
    await this.getContainerClient(containerName).createIfNotExists();
  }

  async uploadBlob(
    containerName: string,
    blobName: string,
    filePath: string,
    options: UploadBlobOptions = {}
  ): Promise<UploadBlobResult> {
    const containerClient = this.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const uploadOptions: BlockBlobParallelUploadOptions = {
      metadata: options.metadata,
      tags: options.tags
    };

    const streamOptions = {
      bufferSize: options.blockSize ?? 8 * 1024 * 1024,
      maxConcurrency: options.concurrency ?? 5
    };

    const blobExists = await blockBlobClient.exists();
    let usedLease = false;

    if (blobExists) {
      const leaseClient = blockBlobClient.getBlobLeaseClient();
      const leaseDurationSeconds = options.leaseDurationSeconds ?? 60;
      const leaseResponse = await leaseClient.acquireLease(leaseDurationSeconds);

      usedLease = true;
      uploadOptions.conditions = { leaseId: leaseResponse.leaseId };

      try {
        const uploadResponse = await blockBlobClient.uploadStream(
          createReadStream(filePath),
          streamOptions.bufferSize,
          streamOptions.maxConcurrency,
          uploadOptions
        );

        return {
          etag: uploadResponse.etag,
          lastModified: uploadResponse.lastModified,
          usedLease
        };
      } finally {
        await leaseClient.releaseLease();
      }
    }

    uploadOptions.conditions = { ifNoneMatch: "*" };

    try {
      const uploadResponse = await blockBlobClient.uploadStream(
        createReadStream(filePath),
        streamOptions.bufferSize,
        streamOptions.maxConcurrency,
        uploadOptions
      );

      return {
        etag: uploadResponse.etag,
        lastModified: uploadResponse.lastModified,
        usedLease
      };
    } catch (error) {
      if (!isBlobAlreadyExistsError(error)) {
        throw error;
      }

      return this.uploadBlob(containerName, blobName, filePath, options);
    }
  }

  async downloadBlob(containerName: string, blobName: string, destinationPath: string): Promise<void> {
    await fs.mkdir(dirname(destinationPath), { recursive: true });

    const blockBlobClient = this.getContainerClient(containerName).getBlockBlobClient(blobName);
    await blockBlobClient.downloadToFile(destinationPath);
  }

  async listBlobs(containerName: string): Promise<BlobItem[]> {
    const containerClient = this.getContainerClient(containerName);
    const blobs: BlobItem[] = [];

    for await (const blob of containerClient.listBlobsFlat({ includeMetadata: true, includeTags: true })) {
      blobs.push(blob);
    }

    return blobs;
  }

  async deleteBlob(containerName: string, blobName: string): Promise<void> {
    const blockBlobClient = this.getContainerClient(containerName).getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists({ deleteSnapshots: "include" });
  }

  private getContainerClient(containerName: string): ContainerClient {
    return this.blobServiceClient.getContainerClient(containerName);
  }
}

function isBlobAlreadyExistsError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const statusCode = "statusCode" in error ? error.statusCode : undefined;
  const details = "details" in error ? error.details : undefined;
  const errorCode =
    details && typeof details === "object" && details !== null && "errorCode" in details
      ? details.errorCode
      : undefined;

  return statusCode === 412 || errorCode === "ConditionNotMet";
}
