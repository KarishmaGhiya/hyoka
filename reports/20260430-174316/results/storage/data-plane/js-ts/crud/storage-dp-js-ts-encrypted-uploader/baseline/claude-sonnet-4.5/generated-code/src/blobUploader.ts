import { ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import { KeyManagementService, WrappedKey } from './keyManagement';

export interface BlobMetadata {
  iv: string; // Base64-encoded
  authTag: string; // Base64-encoded
  wrappedKey: string; // Base64-encoded
  keyId: string; // Key Vault key ID
  encryptionAlgorithm: string; // "AES-256-GCM"
}

export class EncryptedBlobUploader {
  private containerClient: ContainerClient;
  private keyManagement: KeyManagementService;

  constructor(containerClient: ContainerClient, keyManagement: KeyManagementService) {
    this.containerClient = containerClient;
    this.keyManagement = keyManagement;
  }

  /**
   * Ensure the container exists before upload/download
   */
  private async ensureContainer(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to ensure container exists: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Upload encrypted data to Azure Blob Storage
   * 1. Encrypt the data locally using envelope encryption
   * 2. Upload ciphertext to blob storage
   * 3. Store encryption metadata (IV, auth tag, wrapped DEK) as blob metadata
   */
  async uploadEncrypted(blobName: string, data: Buffer | string): Promise<void> {
    await this.ensureContainer();

    const plaintext = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');

    try {
      // Encrypt the data using envelope encryption
      const encryptionResult = await this.keyManagement.encryptData(plaintext);

      // Prepare metadata to store with the blob
      const metadata: BlobMetadata = {
        iv: encryptionResult.iv.toString('base64'),
        authTag: encryptionResult.authTag.toString('base64'),
        wrappedKey: encryptionResult.wrappedKey.wrappedKey,
        keyId: encryptionResult.wrappedKey.keyId,
        encryptionAlgorithm: 'AES-256-GCM',
      };

      // Get blob client
      const blobClient = this.containerClient.getBlockBlobClient(blobName);

      // Upload ciphertext with metadata
      // Convert BlobMetadata to Record<string, string> for Azure SDK
      const metadataRecord: Record<string, string> = {
        iv: metadata.iv,
        authTag: metadata.authTag,
        wrappedKey: metadata.wrappedKey,
        keyId: metadata.keyId,
        encryptionAlgorithm: metadata.encryptionAlgorithm,
      };
      
      await blobClient.upload(encryptionResult.ciphertext, encryptionResult.ciphertext.length, {
        metadata: metadataRecord,
      });

      console.log(`✓ Uploaded encrypted blob: ${blobName}`);
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific Azure errors
        if (error.message.includes('BlobNotFound')) {
          throw new Error(`Blob ${blobName} not found`);
        } else if (error.message.includes('ContainerNotFound')) {
          throw new Error('Storage container not found');
        } else if (error.message.includes('AuthenticationFailed')) {
          throw new Error('Authentication failed. Check managed identity permissions.');
        } else {
          throw new Error(`Failed to upload encrypted blob: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Download and decrypt data from Azure Blob Storage
   * 1. Download blob and retrieve metadata
   * 2. Extract encryption parameters from metadata
   * 3. Decrypt using envelope encryption
   */
  async downloadDecrypted(blobName: string): Promise<Buffer> {
    await this.ensureContainer();

    try {
      // Get blob client
      const blobClient = this.containerClient.getBlockBlobClient(blobName);

      // Check if blob exists
      const exists = await blobClient.exists();
      if (!exists) {
        throw new Error(`Blob ${blobName} does not exist`);
      }

      // Download blob properties and metadata
      const properties = await blobClient.getProperties();
      const metadata = properties.metadata as BlobMetadata | undefined;

      if (!metadata || !metadata.iv || !metadata.authTag || !metadata.wrappedKey || !metadata.keyId) {
        throw new Error(
          'Blob is missing required encryption metadata. It may not have been encrypted by this service.'
        );
      }

      // Verify encryption algorithm
      if (metadata.encryptionAlgorithm !== 'AES-256-GCM') {
        throw new Error(
          `Unsupported encryption algorithm: ${metadata.encryptionAlgorithm}`
        );
      }

      // Download the ciphertext
      const downloadResponse = await blobClient.download(0);
      if (!downloadResponse.readableStreamBody) {
        throw new Error('Failed to download blob: no readable stream');
      }

      const ciphertext = await this.streamToBuffer(downloadResponse.readableStreamBody);

      // Reconstruct encryption parameters
      const iv = Buffer.from(metadata.iv, 'base64');
      const authTag = Buffer.from(metadata.authTag, 'base64');
      const wrappedKey: WrappedKey = {
        wrappedKey: metadata.wrappedKey,
        keyId: metadata.keyId,
      };

      // Decrypt the data using envelope encryption
      const plaintext = await this.keyManagement.decryptData(
        ciphertext,
        iv,
        authTag,
        wrappedKey
      );

      console.log(`✓ Downloaded and decrypted blob: ${blobName}`);
      return plaintext;
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific Azure errors
        if (error.message.includes('BlobNotFound')) {
          throw new Error(`Blob ${blobName} not found`);
        } else if (error.message.includes('ContainerNotFound')) {
          throw new Error('Storage container not found');
        } else if (error.message.includes('AuthenticationFailed')) {
          throw new Error('Authentication failed. Check managed identity permissions.');
        } else if (error.message.includes('key may have been disabled')) {
          throw new Error('Key Vault key is disabled or inaccessible');
        } else if (error.message.includes('Failed to unwrap key')) {
          throw new Error('Failed to unwrap encryption key. The key may have been rotated or deleted.');
        } else if (!error.message.includes('does not exist') && !error.message.includes('missing required encryption metadata')) {
          throw new Error(`Failed to download/decrypt blob: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Convert a readable stream to a buffer
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
   * List all encrypted blobs in the container
   */
  async listBlobs(): Promise<string[]> {
    await this.ensureContainer();

    const blobNames: string[] = [];
    for await (const blob of this.containerClient.listBlobsFlat()) {
      blobNames.push(blob.name);
    }
    return blobNames;
  }

  /**
   * Delete a blob from the container
   */
  async deleteBlob(blobName: string): Promise<void> {
    try {
      const blobClient = this.containerClient.getBlockBlobClient(blobName);
      await blobClient.delete();
      console.log(`✓ Deleted blob: ${blobName}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete blob: ${error.message}`);
      }
      throw error;
    }
  }
}
