import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import {
  BlobLeaseClient,
  ContainerClient,
} from "@azure/storage-blob";

export interface UploadBlobOptions {
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  contentType?: string;
}

export interface UploadBlobResult {
  etag?: string;
  requestId?: string;
  versionId?: string;
  leaseId?: string;
}

export interface ListedBlob {
  name: string;
  contentLength?: number;
  lastModified?: Date;
}

export interface BlobStorageServiceOptions {
  uploadBufferSizeBytes: number;
  uploadConcurrency: number;
  leaseDurationInSeconds: number;
}

export class BlobStorageService {
  constructor(
    private readonly containerClient: ContainerClient,
    private readonly options: BlobStorageServiceOptions,
  ) {}

  async uploadFile(
    blobName: string,
    filePath: string,
    options: UploadBlobOptions = {},
  ): Promise<UploadBlobResult> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const stats = await fs.stat(filePath);

    if (!stats.isFile()) {
      throw new Error(`Cannot upload ${filePath} because it is not a file.`);
    }

    let leaseClient: BlobLeaseClient | undefined;
    let leaseId: string | undefined;

    if (await blockBlobClient.exists()) {
      leaseClient = blockBlobClient.getBlobLeaseClient();
      const leaseResponse = await leaseClient.acquireLease(
        this.options.leaseDurationInSeconds,
      );
      leaseId = leaseResponse.leaseId;
    }

    const fileStream = createReadStream(filePath);

    try {
      const uploadResponse = await blockBlobClient.uploadStream(
        fileStream,
        this.options.uploadBufferSizeBytes,
        this.options.uploadConcurrency,
        {
          blobHTTPHeaders: options.contentType
            ? { blobContentType: options.contentType }
            : undefined,
          metadata: options.metadata,
          tags: options.tags,
          conditions: leaseId ? { leaseId } : { ifNoneMatch: "*" },
        },
      );

      return {
        etag: uploadResponse.etag,
        requestId: uploadResponse.requestId,
        versionId: uploadResponse.versionId,
        leaseId,
      };
    } finally {
      fileStream.destroy();

      if (leaseClient && leaseId) {
        await leaseClient.releaseLease();
      }
    }
  }

  async downloadBlob(blobName: string): Promise<Buffer> {
    const response = await this.containerClient
      .getBlobClient(blobName)
      .download();

    if (!response.readableStreamBody) {
      throw new Error(`Blob ${blobName} did not return a readable stream.`);
    }

    return streamToBuffer(response.readableStreamBody);
  }

  async listBlobs(): Promise<ListedBlob[]> {
    const blobs: ListedBlob[] = [];

    for await (const blob of this.containerClient.listBlobsFlat()) {
      blobs.push({
        name: blob.name,
        contentLength: blob.properties.contentLength,
        lastModified: blob.properties.lastModified,
      });
    }

    return blobs;
  }

  async deleteBlob(blobName: string): Promise<boolean> {
    const response = await this.containerClient.deleteBlob(blobName, {
      deleteSnapshots: "include",
    });

    return response._response.status === 202;
  }
}

async function streamToBuffer(
  readableStream: NodeJS.ReadableStream,
): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of readableStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}
