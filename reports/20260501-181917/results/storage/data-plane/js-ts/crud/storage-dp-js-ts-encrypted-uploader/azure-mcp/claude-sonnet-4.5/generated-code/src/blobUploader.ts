import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { KeyManager } from './keyManager';

/**
 * Metadata keys used for storing encryption parameters
 */
const METADATA_KEYS = {
  WRAPPED_KEY: 'x_ms_encryption_wrapped_key',
  KEY_ID: 'x_ms_encryption_key_id',
  IV: 'x_ms_encryption_iv',
  AUTH_TAG: 'x_ms_encryption_auth_tag',
  ENCRYPTED: 'x_ms_encryption_encrypted'
} as const;

/**
 * Blob uploader/downloader that handles client-side encryption and Azure Blob Storage operations.
 * 
 * Upload workflow:
 * 1. Generate a data encryption key (DEK)
 * 2. Encrypt data locally using AES-256-GCM
 * 3. Wrap the DEK using Key Vault
 * 4. Upload ciphertext to Blob Storage with encryption metadata
 * 
 * Download workflow:
 * 1. Download blob and read metadata
 * 2. Unwrap the DEK using Key Vault
 * 3. Decrypt the ciphertext locally
 * 
 * Error handling:
 * - Key Vault errors (key disabled, access denied, etc.)
 * - Blob Storage errors (blob not found, access denied, etc.)
 * - Decryption failures (corrupted data, wrong key, etc.)
 */
export class BlobUploader {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private keyManager: KeyManager;
  private containerName: string;

  constructor(
    blobServiceClient: BlobServiceClient,
    keyManager: KeyManager,
    containerName: string
  ) {
    this.blobServiceClient = blobServiceClient;
    this.keyManager = keyManager;
    this.containerName = containerName;
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  /**
   * Ensure the container exists, creating it if necessary
   */
  async ensureContainer(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists();
    } catch (error) {
      throw new Error(`Failed to create container: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Upload data to Azure Blob Storage with client-side encryption
   * @param blobName Name of the blob to create
   * @param data Data to encrypt and upload
   */
  async uploadEncrypted(blobName: string, data: Buffer | string): Promise<void> {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

    try {
      // Encrypt the data and get encryption metadata
      const {
        ciphertext,
        wrappedKey,
        keyId,
        iv,
        authTag
      } = await this.keyManager.encryptData(dataBuffer);

      // Prepare blob metadata
      const metadata: Record<string, string> = {
        [METADATA_KEYS.WRAPPED_KEY]: wrappedKey,
        [METADATA_KEYS.KEY_ID]: keyId,
        [METADATA_KEYS.IV]: iv,
        [METADATA_KEYS.AUTH_TAG]: authTag,
        [METADATA_KEYS.ENCRYPTED]: 'true'
      };

      // Upload the encrypted data with metadata
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(ciphertext, ciphertext.length, {
        metadata,
        blobHTTPHeaders: {
          blobContentType: 'application/octet-stream'
        }
      });

      console.log(`✓ Uploaded encrypted blob: ${blobName}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Key Vault')) {
        throw new Error(`Key Vault error during upload: ${error.message}`);
      }
      throw new Error(`Failed to upload blob: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Download and decrypt data from Azure Blob Storage
   * @param blobName Name of the blob to download
   * @returns Decrypted data as a Buffer
   */
  async downloadDecrypted(blobName: string): Promise<Buffer> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Check if blob exists
      const exists = await blockBlobClient.exists();
      if (!exists) {
        throw new Error(`Blob not found: ${blobName}`);
      }

      // Download the blob
      const downloadResponse = await blockBlobClient.download(0);
      if (!downloadResponse.readableStreamBody) {
        throw new Error('No data stream in blob response');
      }

      // Read the ciphertext
      const chunks: Buffer[] = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
      }
      const ciphertext = Buffer.concat(chunks);

      // Get metadata
      const properties = await blockBlobClient.getProperties();
      const metadata = properties.metadata;

      if (!metadata) {
        throw new Error('No metadata found on blob');
      }

      // Check if blob is encrypted
      if (metadata[METADATA_KEYS.ENCRYPTED] !== 'true') {
        throw new Error('Blob is not encrypted or missing encryption flag');
      }

      // Extract encryption parameters
      const wrappedKey = metadata[METADATA_KEYS.WRAPPED_KEY];
      const keyId = metadata[METADATA_KEYS.KEY_ID];
      const iv = metadata[METADATA_KEYS.IV];
      const authTag = metadata[METADATA_KEYS.AUTH_TAG];

      if (!wrappedKey || !keyId || !iv || !authTag) {
        throw new Error('Missing encryption metadata on blob');
      }

      console.log(`✓ Downloaded encrypted blob: ${blobName}`);
      console.log(`  Key ID: ${keyId}`);

      // Decrypt the data
      const plaintext = await this.keyManager.decryptData(
        ciphertext,
        wrappedKey,
        iv,
        authTag
      );

      console.log(`✓ Decrypted blob successfully`);

      return plaintext;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Key Vault') || error.message.includes('unwrap')) {
          throw new Error(`Key Vault error during download: ${error.message}`);
        }
        if (error.message.includes('Blob not found')) {
          throw error;
        }
        if (error.message.includes('authentication')) {
          throw new Error(`Decryption failed - data may be corrupted or wrong key used: ${error.message}`);
        }
      }
      throw new Error(`Failed to download and decrypt blob: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a blob from storage
   * @param blobName Name of the blob to delete
   */
  async deleteBlob(blobName: string): Promise<void> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
      console.log(`✓ Deleted blob: ${blobName}`);
    } catch (error) {
      throw new Error(`Failed to delete blob: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
