import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { KeyManagementService, WrappedKey } from './keyManagement';

export interface UploadResult {
  blobName: string;
  url: string;
  wrappedKeyBase64: string;
  keyId: string;
}

export class EncryptedBlobStorage {
  private containerClient: ContainerClient;

  constructor(
    private readonly blobServiceClient: BlobServiceClient,
    private readonly keyManagementService: KeyManagementService,
    private readonly containerName: string
  ) {
    this.containerClient = this.blobServiceClient.getContainerClient(containerName);
  }

  async ensureContainerExists(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to ensure container exists: ${error.message}`);
      }
      throw error;
    }
  }

  async uploadEncrypted(blobName: string, data: Buffer | string): Promise<UploadResult> {
    await this.ensureContainerExists();

    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');

    try {
      const encryptionResult = await this.keyManagementService.encryptData(dataBuffer);

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(encryptionResult.ciphertext, encryptionResult.ciphertext.length, {
        metadata: {
          encrypted: 'true',
          wrappedKey: encryptionResult.wrappedKey.wrappedKeyBase64,
          keyId: encryptionResult.wrappedKey.keyId,
          iv: encryptionResult.iv.toString('base64'),
          authTag: encryptionResult.authTag.toString('base64'),
          algorithm: 'aes-256-gcm',
        },
      });

      return {
        blobName,
        url: blockBlobClient.url,
        wrappedKeyBase64: encryptionResult.wrappedKey.wrappedKeyBase64,
        keyId: encryptionResult.wrappedKey.keyId,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload encrypted blob: ${error.message}`);
      }
      throw error;
    }
  }

  async downloadDecrypted(blobName: string): Promise<Buffer> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      const exists = await blockBlobClient.exists();
      if (!exists) {
        throw new Error(`Blob '${blobName}' does not exist`);
      }

      const propertiesResponse = await blockBlobClient.getProperties();
      const metadata = propertiesResponse.metadata;

      if (!metadata || metadata.encrypted !== 'true') {
        throw new Error('Blob is not encrypted or missing encryption metadata');
      }

      const wrappedKey: WrappedKey = {
        wrappedKeyBase64: metadata.wrappedKey!,
        keyId: metadata.keyId!,
      };

      const iv = Buffer.from(metadata.iv!, 'base64');
      const authTag = Buffer.from(metadata.authTag!, 'base64');

      const downloadResponse = await blockBlobClient.download();
      if (!downloadResponse.readableStreamBody) {
        throw new Error('Failed to download blob data');
      }

      const ciphertext = await this.streamToBuffer(downloadResponse.readableStreamBody);

      const plaintext = await this.keyManagementService.decryptData(
        ciphertext,
        iv,
        authTag,
        wrappedKey
      );

      return plaintext;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to download and decrypt blob: ${error.message}`);
      }
      throw error;
    }
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
}
