import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { KeyManagement, EncryptedData } from './keyManagement';

export interface UploadResult {
  blobName: string;
  containerName: string;
  wrappedDEK: string;
  keyId: string;
}

export interface DownloadResult {
  plaintext: Buffer;
  wrappedDEK: string;
  keyId: string;
}

/**
 * Blob uploader/downloader class that handles encryption and storage.
 * For upload: generates a data key, encrypts locally with AES-GCM,
 * protects the data key via Key Vault, then uploads ciphertext to Blob Storage
 * with the protected key and cryptographic parameters in metadata.
 * For download: reads blob and metadata, recovers the data key via Key Vault, and decrypts.
 */
export class EncryptedBlobUploader {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly keyManagement: KeyManagement;

  constructor(blobServiceClient: BlobServiceClient, keyManagement: KeyManagement) {
    this.blobServiceClient = blobServiceClient;
    this.keyManagement = keyManagement;
  }

  /**
   * Gets or creates a container client.
   */
  private async getContainerClient(containerName: string): Promise<ContainerClient> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    
    try {
      // Try to create the container if it doesn't exist
      await containerClient.createIfNotExists();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to access container: ${error.message}`);
      }
      throw new Error('Failed to access container: Unknown error');
    }

    return containerClient;
  }

  /**
   * Uploads encrypted data to Azure Blob Storage.
   * Steps:
   * 1. Generate a data encryption key (DEK)
   * 2. Encrypt the data locally using AES-GCM
   * 3. Protect the DEK via Key Vault (wrap)
   * 4. Upload the ciphertext to Blob Storage
   * 5. Store the wrapped key, IV, and auth tag in blob metadata
   */
  async uploadEncrypted(
    containerName: string,
    blobName: string,
    data: Buffer | string
  ): Promise<UploadResult> {
    try {
      // Convert string to buffer if needed
      const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

      // Encrypt the data and wrap the DEK
      const encryptedData = await this.keyManagement.encryptData(dataBuffer);

      // Get the container client
      const containerClient = await this.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Store cryptographic parameters in blob metadata
      const metadata = {
        wrappedDEK: encryptedData.wrappedKey.wrappedDEK,
        keyId: encryptedData.wrappedKey.keyId,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        encrypted: 'true',
      };

      // Upload the ciphertext to blob storage
      await blockBlobClient.upload(
        encryptedData.ciphertext,
        encryptedData.ciphertext.length,
        {
          metadata,
        }
      );

      return {
        blobName,
        containerName,
        wrappedDEK: encryptedData.wrappedKey.wrappedDEK,
        keyId: encryptedData.wrappedKey.keyId,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload encrypted blob: ${error.message}`);
      }
      throw new Error('Failed to upload encrypted blob: Unknown error');
    }
  }

  /**
   * Downloads and decrypts data from Azure Blob Storage.
   * Steps:
   * 1. Download the blob and its metadata
   * 2. Extract the wrapped DEK, IV, and auth tag from metadata
   * 3. Recover the DEK via Key Vault (unwrap)
   * 4. Decrypt the ciphertext locally
   */
  async downloadDecrypted(
    containerName: string,
    blobName: string
  ): Promise<DownloadResult> {
    try {
      // Get the container client
      const containerClient = await this.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Check if blob exists
      const exists = await blockBlobClient.exists();
      if (!exists) {
        throw new Error(`Blob '${blobName}' does not exist in container '${containerName}'`);
      }

      // Download the blob
      const downloadResponse = await blockBlobClient.download(0);

      if (!downloadResponse.readableStreamBody) {
        throw new Error('Failed to read blob stream');
      }

      // Read the ciphertext
      const ciphertext = await this.streamToBuffer(downloadResponse.readableStreamBody);

      // Get metadata
      const properties = await blockBlobClient.getProperties();
      const metadata = properties.metadata;

      if (!metadata || metadata.encrypted !== 'true') {
        throw new Error('Blob is not encrypted or missing encryption metadata');
      }

      if (!metadata.wrappedDEK || !metadata.keyId || !metadata.iv || !metadata.authTag) {
        throw new Error('Blob is missing required encryption metadata');
      }

      // Reconstruct the encrypted data object
      const encryptedData: EncryptedData = {
        ciphertext,
        iv: metadata.iv,
        authTag: metadata.authTag,
        wrappedKey: {
          wrappedDEK: metadata.wrappedDEK,
          keyId: metadata.keyId,
        },
      };

      // Decrypt the data
      const plaintext = await this.keyManagement.decryptData(encryptedData);

      return {
        plaintext,
        wrappedDEK: metadata.wrappedDEK,
        keyId: metadata.keyId,
      };
    } catch (error) {
      if (error instanceof Error) {
        // Check for specific Azure errors
        if (error.message.includes('vault key')) {
          throw new Error(`Key Vault error: ${error.message}. The vault key may have been disabled or deleted.`);
        }
        if (error.message.includes('does not exist')) {
          throw error; // Re-throw blob not found errors as-is
        }
        throw new Error(`Failed to download and decrypt blob: ${error.message}`);
      }
      throw new Error('Failed to download and decrypt blob: Unknown error');
    }
  }

  /**
   * Helper method to convert a readable stream to a buffer.
   */
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data: Buffer) => {
        chunks.push(data);
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

  /**
   * Deletes a blob from Azure Blob Storage (helper method for cleanup).
   */
  async deleteBlob(containerName: string, blobName: string): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete blob: ${error.message}`);
      }
      throw new Error('Failed to delete blob: Unknown error');
    }
  }
}
