import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { KeyManager, EncryptedData } from './keyManager';

export interface UploadResult {
  blobName: string;
  url: string;
  wrappedKey: string;
  keyId: string;
}

export interface DownloadResult {
  content: Buffer;
  metadata: Record<string, string>;
}

/**
 * Blob storage class that handles encrypted uploads and downloads.
 * 
 * Upload process:
 * 1. Generate a DEK and encrypt data locally using AES-GCM
 * 2. Wrap the DEK using Key Vault
 * 3. Upload ciphertext to Blob Storage
 * 4. Store wrapped DEK, IV, and auth tag in blob metadata
 * 
 * Download process:
 * 1. Download blob and read metadata
 * 2. Unwrap DEK using Key Vault
 * 3. Decrypt data locally using the unwrapped DEK
 */
export class EncryptedBlobStorage {
  constructor(
    private readonly blobServiceClient: BlobServiceClient,
    private readonly keyManager: KeyManager
  ) {}

  /**
   * Get or create a container client.
   * 
   * @param containerName - Name of the container
   * @returns Container client
   */
  private async getContainerClient(containerName: string): Promise<ContainerClient> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    
    try {
      // Create container if it doesn't exist
      await containerClient.createIfNotExists({
        access: 'blob'
      });
    } catch (error) {
      throw new Error(`Failed to access container '${containerName}': ${error instanceof Error ? error.message : String(error)}`);
    }

    return containerClient;
  }

  /**
   * Upload data to blob storage with client-side encryption.
   * 
   * @param containerName - Name of the container
   * @param blobName - Name of the blob
   * @param data - Data to encrypt and upload (string or Buffer)
   * @returns Upload result with blob information
   */
  async uploadEncrypted(
    containerName: string,
    blobName: string,
    data: string | Buffer
  ): Promise<UploadResult> {
    try {
      // Convert string to Buffer if necessary
      const plaintext = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');

      // Step 1: Encrypt data locally with envelope encryption
      const encryptedData = await this.keyManager.encryptData(plaintext);

      // Step 2: Get container client
      const containerClient = await this.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Step 3: Upload encrypted data with metadata
      const metadata = {
        'encrypted': 'true',
        'wrappedKey': encryptedData.wrappedKey.wrappedKey,
        'keyId': encryptedData.wrappedKey.keyId,
        'iv': encryptedData.iv,
        'authTag': encryptedData.authTag,
        'algorithm': 'aes-256-gcm'
      };

      await blockBlobClient.upload(
        encryptedData.ciphertext,
        encryptedData.ciphertext.length,
        {
          metadata
        }
      );

      return {
        blobName,
        url: blockBlobClient.url,
        wrappedKey: encryptedData.wrappedKey.wrappedKey,
        keyId: encryptedData.wrappedKey.keyId
      };
    } catch (error) {
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Download and decrypt data from blob storage.
   * 
   * @param containerName - Name of the container
   * @param blobName - Name of the blob
   * @returns Decrypted content and metadata
   */
  async downloadDecrypted(
    containerName: string,
    blobName: string
  ): Promise<DownloadResult> {
    try {
      // Step 1: Get container and blob client
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Step 2: Check if blob exists
      const exists = await blockBlobClient.exists();
      if (!exists) {
        throw new Error(`Blob '${blobName}' does not exist in container '${containerName}'`);
      }

      // Step 3: Download blob with metadata
      const downloadResponse = await blockBlobClient.download();
      
      if (!downloadResponse.readableStreamBody) {
        throw new Error('Failed to get blob content stream');
      }

      // Read stream to buffer
      const ciphertext = await this.streamToBuffer(downloadResponse.readableStreamBody);
      const metadata = downloadResponse.metadata || {};

      // Step 4: Validate metadata
      if (metadata.encrypted !== 'true') {
        throw new Error('Blob is not encrypted or missing encryption metadata');
      }

      if (!metadata.wrappedKey || !metadata.keyId || !metadata.iv || !metadata.authTag) {
        throw new Error('Blob is missing required encryption metadata');
      }

      // Step 5: Reconstruct encrypted data structure
      const encryptedData: EncryptedData = {
        ciphertext,
        iv: metadata.iv,
        authTag: metadata.authTag,
        wrappedKey: {
          wrappedKey: metadata.wrappedKey,
          keyId: metadata.keyId
        }
      };

      // Step 6: Decrypt data
      const plaintext = await this.keyManager.decryptData(encryptedData);

      return {
        content: plaintext,
        metadata
      };
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Helper method to convert a readable stream to a buffer.
   * 
   * @param readableStream - Readable stream
   * @returns Buffer with stream contents
   */
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

  /**
   * Delete a blob from storage.
   * 
   * @param containerName - Name of the container
   * @param blobName - Name of the blob
   */
  async deleteBlob(containerName: string, blobName: string): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      throw new Error(`Delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
