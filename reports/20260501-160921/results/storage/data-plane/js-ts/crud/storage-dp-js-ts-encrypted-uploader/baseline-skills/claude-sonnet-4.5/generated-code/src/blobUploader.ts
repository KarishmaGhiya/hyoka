import { BlobServiceClient, ContainerClient, BlockBlobClient } from "@azure/storage-blob";
import * as crypto from "crypto";
import { KeyManager } from "./keyManager";

/**
 * Metadata stored with each encrypted blob.
 * Contains all information needed to decrypt the blob.
 */
interface EncryptionMetadata {
  encryptionAlgorithm: string;
  wrappedKey: string; // base64 encoded
  iv: string; // base64 encoded initialization vector
  authTag: string; // base64 encoded authentication tag for AES-GCM
  keyId: string; // Key Vault key ID used to wrap the DEK
}

/**
 * Blob uploader/downloader class that handles encryption and storage.
 * 
 * Upload flow:
 * 1. Generate a data encryption key (DEK)
 * 2. Encrypt data locally using AES-256-GCM
 * 3. Protect the DEK via Key Vault (wrap)
 * 4. Upload ciphertext + metadata to Blob Storage
 * 
 * Download flow:
 * 1. Download blob and metadata
 * 2. Recover the DEK via Key Vault (unwrap)
 * 3. Decrypt locally using the DEK
 */
export class EncryptedBlobUploader {
  private containerClient: ContainerClient;
  private keyManager: KeyManager;

  constructor(blobServiceClient: BlobServiceClient, containerName: string, keyManager: KeyManager) {
    this.containerClient = blobServiceClient.getContainerClient(containerName);
    this.keyManager = keyManager;
  }

  /**
   * Ensure the container exists before performing operations.
   */
  async ensureContainer(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create/verify container: ${error.message}`);
      }
      throw new Error("Failed to create/verify container: Unknown error");
    }
  }

  /**
   * Encrypt data locally using AES-256-GCM.
   * GCM mode provides both confidentiality and authenticity.
   * 
   * @param data - The plaintext data to encrypt
   * @param key - The data encryption key
   * @returns Object containing ciphertext, IV, and authentication tag
   */
  private encryptData(data: Buffer, key: Buffer): { ciphertext: Buffer; iv: Buffer; authTag: Buffer } {
    // Generate a random 96-bit (12-byte) IV for AES-GCM
    // NIST recommends 96-bit IVs for GCM mode
    const iv = crypto.randomBytes(12);

    // Create cipher with AES-256-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    // Encrypt the data
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

    // Get the authentication tag (16 bytes by default)
    // This is crucial for GCM - it provides integrity and authenticity
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv,
      authTag
    };
  }

  /**
   * Decrypt data locally using AES-256-GCM.
   * 
   * @param ciphertext - The encrypted data
   * @param key - The data encryption key
   * @param iv - The initialization vector used during encryption
   * @param authTag - The authentication tag from encryption
   * @returns The plaintext data
   */
  private decryptData(ciphertext: Buffer, key: Buffer, iv: Buffer, authTag: Buffer): Buffer {
    try {
      // Create decipher with AES-256-GCM
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

      // Set the authentication tag before decryption
      // If the tag doesn't match, decryption will fail (tamper detection)
      decipher.setAuthTag(authTag);

      // Decrypt the data
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

      return decrypted;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Decryption failed - data may be corrupted or tampered: ${error.message}`);
      }
      throw new Error("Decryption failed - data may be corrupted or tampered");
    }
  }

  /**
   * Upload data to Blob Storage with client-side encryption.
   * 
   * @param blobName - The name of the blob to create
   * @param data - The plaintext data to encrypt and upload
   * @returns Metadata about the encryption (for verification/debugging)
   */
  async uploadEncrypted(blobName: string, data: string | Buffer): Promise<EncryptionMetadata> {
    try {
      // Ensure we have a Buffer
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf-8");

      // Step 1: Generate a data encryption key locally
      const dataKey = this.keyManager.generateDataEncryptionKey();

      // Step 2: Encrypt the data locally using AES-256-GCM
      const { ciphertext, iv, authTag } = this.encryptData(dataBuffer, dataKey);

      // Step 3: Protect the data key via Key Vault (wrap)
      const { wrappedKey, keyId } = await this.keyManager.wrapKey(dataKey);

      // Step 4: Prepare metadata to store with the blob
      const metadata: EncryptionMetadata = {
        encryptionAlgorithm: "AES-256-GCM",
        wrappedKey: wrappedKey.toString("base64"),
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
        keyId
      };

      // Step 5: Upload the ciphertext to Blob Storage with metadata
      const blobClient = this.containerClient.getBlockBlobClient(blobName);
      await blobClient.upload(ciphertext, ciphertext.length, {
        metadata: metadata as Record<string, string>
      });

      // Clear the raw data key from memory (best practice)
      dataKey.fill(0);

      return metadata;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload encrypted blob: ${error.message}`);
      }
      throw new Error("Failed to upload encrypted blob: Unknown error");
    }
  }

  /**
   * Download and decrypt data from Blob Storage.
   * 
   * @param blobName - The name of the blob to download
   * @returns The decrypted plaintext data
   */
  async downloadDecrypted(blobName: string): Promise<Buffer> {
    try {
      // Step 1: Download the blob and its metadata
      const blobClient = this.containerClient.getBlockBlobClient(blobName);
      
      // Check if blob exists
      const exists = await blobClient.exists();
      if (!exists) {
        throw new Error(`Blob '${blobName}' does not exist`);
      }

      // Download blob properties (includes metadata)
      const properties = await blobClient.getProperties();
      const metadata = properties.metadata as EncryptionMetadata | undefined;

      if (!metadata || !metadata.wrappedKey || !metadata.iv || !metadata.authTag) {
        throw new Error(`Blob '${blobName}' is missing encryption metadata - may not be encrypted`);
      }

      // Verify encryption algorithm
      if (metadata.encryptionAlgorithm !== "AES-256-GCM") {
        throw new Error(`Unsupported encryption algorithm: ${metadata.encryptionAlgorithm}`);
      }

      // Download the ciphertext
      const downloadResponse = await blobClient.download();
      if (!downloadResponse.readableStreamBody) {
        throw new Error("Failed to download blob content");
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
      }
      const ciphertext = Buffer.concat(chunks);

      // Step 2: Decode metadata from base64
      const wrappedKey = Buffer.from(metadata.wrappedKey, "base64");
      const iv = Buffer.from(metadata.iv, "base64");
      const authTag = Buffer.from(metadata.authTag, "base64");

      // Step 3: Recover the data key via Key Vault (unwrap)
      const dataKey = await this.keyManager.unwrapKey(wrappedKey);

      // Step 4: Decrypt locally
      const plaintext = this.decryptData(ciphertext, dataKey, iv, authTag);

      // Clear the data key from memory
      dataKey.fill(0);

      return plaintext;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to download/decrypt blob: ${error.message}`);
      }
      throw new Error("Failed to download/decrypt blob: Unknown error");
    }
  }

  /**
   * Delete a blob from storage.
   * 
   * @param blobName - The name of the blob to delete
   */
  async deleteBlob(blobName: string): Promise<void> {
    try {
      const blobClient = this.containerClient.getBlockBlobClient(blobName);
      await blobClient.delete();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete blob: ${error.message}`);
      }
      throw new Error("Failed to delete blob: Unknown error");
    }
  }
}
