import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import * as crypto from 'crypto';
import { KeyManagementService, WrappedKey } from './keyManagement';

export interface EncryptionMetadata {
  wrappedKey: string; // Base64 encoded wrapped DEK
  keyId: string; // Key Vault key ID
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded authentication tag
  algorithm: string; // Encryption algorithm used
}

/**
 * Blob uploader/downloader class that handles encryption and storage.
 * 
 * Encrypts data locally using AES-GCM, stores encrypted data in Blob Storage
 * with cryptographic metadata, and handles decryption on download.
 */
export class EncryptedBlobService {
  private blobServiceClient: BlobServiceClient;
  private keyManagementService: KeyManagementService;
  private containerName: string;

  constructor(
    blobServiceClient: BlobServiceClient,
    keyManagementService: KeyManagementService,
    containerName: string
  ) {
    this.blobServiceClient = blobServiceClient;
    this.keyManagementService = keyManagementService;
    this.containerName = containerName;
  }

  /**
   * Encrypt and upload data to Blob Storage.
   * 
   * Process:
   * 1. Generate a data encryption key (DEK) locally
   * 2. Encrypt the data using AES-256-GCM
   * 3. Wrap the DEK using Key Vault
   * 4. Upload ciphertext to Blob Storage with cryptographic metadata
   * 
   * @param blobName - Name of the blob to create
   * @param data - Data to encrypt and upload (string or Buffer)
   */
  async uploadEncrypted(blobName: string, data: string | Buffer): Promise<void> {
    try {
      // Ensure container exists
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      await containerClient.createIfNotExists();

      // Generate and wrap a data encryption key
      const { wrappedKey, plaintextKey } = await this.keyManagementService.generateAndWrapDataKey();

      // Encrypt the data locally using AES-256-GCM
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
      const iv = crypto.randomBytes(16); // 128-bit IV for GCM mode
      
      const cipher = crypto.createCipheriv('aes-256-gcm', plaintextKey, iv);
      const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
      
      // In Node.js, the auth tag is obtained separately
      const authTag = cipher.getAuthTag();

      // Prepare metadata with cryptographic parameters
      const metadata: EncryptionMetadata = {
        wrappedKey: wrappedKey.encryptedKey,
        keyId: wrappedKey.keyId,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        algorithm: 'aes-256-gcm',
      };

      // Upload encrypted data with metadata to Blob Storage
      const blobClient = containerClient.getBlockBlobClient(blobName);
      await blobClient.upload(encrypted, encrypted.length, {
        metadata: this.serializeMetadata(metadata),
      });

      // Clear sensitive data from memory
      plaintextKey.fill(0);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload encrypted blob: ${error.message}`);
      }
      throw new Error('Failed to upload encrypted blob: Unknown error');
    }
  }

  /**
   * Download and decrypt data from Blob Storage.
   * 
   * Process:
   * 1. Download blob and its metadata
   * 2. Extract cryptographic parameters from metadata
   * 3. Unwrap the DEK using Key Vault
   * 4. Decrypt the data locally using the DEK
   * 
   * @param blobName - Name of the blob to download
   * @returns Decrypted data as a Buffer
   */
  async downloadDecrypted(blobName: string): Promise<Buffer> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobClient = containerClient.getBlockBlobClient(blobName);

      // Check if blob exists
      const exists = await blobClient.exists();
      if (!exists) {
        throw new Error(`Blob '${blobName}' does not exist in container '${this.containerName}'`);
      }

      // Download blob and metadata
      const downloadResponse = await blobClient.download(0);
      
      if (!downloadResponse.metadata) {
        throw new Error('Blob metadata is missing - cannot decrypt');
      }

      // Parse encryption metadata
      const metadata = this.deserializeMetadata(downloadResponse.metadata);

      // Validate metadata
      if (!metadata.wrappedKey || !metadata.keyId || !metadata.iv || !metadata.authTag) {
        throw new Error('Incomplete encryption metadata - cannot decrypt');
      }

      // Download the encrypted content
      const encryptedData = await this.streamToBuffer(downloadResponse.readableStreamBody!);

      // Unwrap the data encryption key using Key Vault
      const wrappedKey: WrappedKey = {
        encryptedKey: metadata.wrappedKey,
        keyId: metadata.keyId,
      };
      const plaintextKey = await this.keyManagementService.unwrapDataKey(wrappedKey);

      // Decrypt the data locally
      const iv = Buffer.from(metadata.iv, 'base64');
      const authTag = Buffer.from(metadata.authTag, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-gcm', plaintextKey, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

      // Clear sensitive data from memory
      plaintextKey.fill(0);

      return decrypted;
    } catch (error) {
      if (error instanceof Error) {
        // Provide more specific error messages
        if (error.message.includes('disabled')) {
          throw new Error('Cannot decrypt: Key Vault key is disabled');
        }
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          throw new Error(`Cannot decrypt: ${error.message}`);
        }
        if (error.message.includes('Unsupported state or unable to authenticate data')) {
          throw new Error('Decryption failed: Authentication tag verification failed - data may be corrupted or tampered');
        }
        throw new Error(`Failed to download and decrypt blob: ${error.message}`);
      }
      throw new Error('Failed to download and decrypt blob: Unknown error');
    }
  }

  /**
   * Convert encryption metadata to blob metadata format (all values must be strings)
   */
  private serializeMetadata(metadata: EncryptionMetadata): Record<string, string> {
    return {
      encryption_wrappedkey: metadata.wrappedKey,
      encryption_keyid: metadata.keyId,
      encryption_iv: metadata.iv,
      encryption_authtag: metadata.authTag,
      encryption_algorithm: metadata.algorithm,
    };
  }

  /**
   * Parse blob metadata back to encryption metadata format
   */
  private deserializeMetadata(blobMetadata: Record<string, string>): EncryptionMetadata {
    return {
      wrappedKey: blobMetadata.encryption_wrappedkey || '',
      keyId: blobMetadata.encryption_keyid || '',
      iv: blobMetadata.encryption_iv || '',
      authTag: blobMetadata.encryption_authtag || '',
      algorithm: blobMetadata.encryption_algorithm || 'aes-256-gcm',
    };
  }

  /**
   * Convert a readable stream to a buffer
   */
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

  /**
   * Delete a blob from storage
   */
  async deleteBlob(blobName: string): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobClient = containerClient.getBlockBlobClient(blobName);
      await blobClient.deleteIfExists();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete blob: ${error.message}`);
      }
      throw new Error('Failed to delete blob: Unknown error');
    }
  }
}
