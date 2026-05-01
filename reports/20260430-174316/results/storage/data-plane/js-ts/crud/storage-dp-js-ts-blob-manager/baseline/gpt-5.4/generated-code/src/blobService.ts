import {
  BlobLeaseClient,
  type BlobRequestConditions,
  type BlockBlobParallelUploadOptions,
  type ContainerClient,
} from "@azure/storage-blob";

const DEFAULT_BLOCK_SIZE_IN_BYTES = 8 * 1024 * 1024;
const DEFAULT_UPLOAD_CONCURRENCY = 5;
const DEFAULT_LEASE_DURATION_IN_SECONDS = 60;

export interface UploadBlobOptions {
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  leaseId?: string;
  blockSizeInBytes?: number;
  concurrency?: number;
  leaseDurationInSeconds?: number;
}

export interface ListedBlob {
  name: string;
  sizeInBytes: number;
  lastModified?: string;
}

export class AzureBlobStorageService {
  constructor(private readonly containerClient: ContainerClient) {}

  async ensureContainerExists(): Promise<void> {
    await this.containerClient.createIfNotExists();
  }

  async upload(
    blobName: string,
    filePath: string,
    options: UploadBlobOptions = {},
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    if (options.leaseId) {
      await blockBlobClient.uploadFile(
        filePath,
        this.buildUploadOptions(options, { leaseId: options.leaseId }),
      );
      return;
    }

    if (await blockBlobClient.exists()) {
      const leaseClient = blockBlobClient.getBlobLeaseClient();
      await leaseClient.acquireLease(
        options.leaseDurationInSeconds ?? DEFAULT_LEASE_DURATION_IN_SECONDS,
      );

      try {
        await blockBlobClient.uploadFile(
          filePath,
          this.buildUploadOptions(options, { leaseId: leaseClient.leaseId }),
        );
      } finally {
        await leaseClient.releaseLease();
      }

      return;
    }

    await blockBlobClient.uploadFile(
      filePath,
      this.buildUploadOptions(options, { ifNoneMatch: "*" }),
    );
  }

  async download(blobName: string): Promise<Buffer> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const downloadResponse = await blobClient.download();

    return streamToBuffer(downloadResponse.readableStreamBody);
  }

  async listBlobs(): Promise<ListedBlob[]> {
    const blobs: ListedBlob[] = [];

    for await (const blob of this.containerClient.listBlobsFlat()) {
      blobs.push({
        name: blob.name,
        sizeInBytes: blob.properties.contentLength ?? 0,
        lastModified: blob.properties.lastModified?.toISOString(),
      });
    }

    return blobs;
  }

  async delete(blobName: string): Promise<void> {
    await this.containerClient.deleteBlob(blobName);
  }

  async acquireLease(
    blobName: string,
    leaseDurationInSeconds = DEFAULT_LEASE_DURATION_IN_SECONDS,
  ): Promise<BlobLeaseClient> {
    const leaseClient = this.containerClient.getBlobClient(blobName).getBlobLeaseClient();

    await leaseClient.acquireLease(leaseDurationInSeconds);

    return leaseClient;
  }

  private buildUploadOptions(
    options: UploadBlobOptions,
    conditions?: BlobRequestConditions,
  ): BlockBlobParallelUploadOptions {
    return {
      metadata: options.metadata,
      tags: options.tags,
      blockSize: options.blockSizeInBytes ?? DEFAULT_BLOCK_SIZE_IN_BYTES,
      concurrency: options.concurrency ?? DEFAULT_UPLOAD_CONCURRENCY,
      conditions,
    };
  }
}

async function streamToBuffer(
  readableStream: NodeJS.ReadableStream | undefined,
): Promise<Buffer> {
  if (!readableStream) {
    throw new Error("Blob download did not return a readable stream.");
  }

  const chunks: Buffer[] = [];

  for await (const chunk of readableStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}
