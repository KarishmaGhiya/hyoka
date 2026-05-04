import { ContainerClient, BlockBlobClient } from "@azure/storage-blob";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { KeyManagement } from "./keyManagement.js";

export interface EncryptionMetadata {
  iv: string; // Base64-encoded initialization vector
  authTag: string; // Base64-encoded authentication tag (GCM mode)
  wrappedKey: string; // Base64-encoded wrapped data encryption key
  keyId: string; // Key Vault key ID used for wrapping
  algorithm: string; // Encryption algorithm used
}

/**
 * Handles encrypted upload and download of blobs.
 * Implements client-side encryption using AES-256-GCM.
 */
export class EncryptedBlobStorage {
  private containerClient: ContainerClient;
  private keyManagement: KeyManagement;
  private readonly algorithm = "aes-256-gcm";

  constructor(containerClient: ContainerClient, keyManagement: KeyManagement) {
    this.containerClient = containerClient;
    this.keyManagement = keyManagement;
  }

  /**
   * Encrypts data locally and uploads to Blob Storage.
   * Stores encryption metadata (IV, auth tag, wrapped key) as blob metadata.
   * 
   * @param blobName - Name of the blob to create
   * @param data - Plaintext data to encrypt and upload
   * @returns The blob client for the uploaded blob
   */
  public async uploadEncrypted(blobName: string, data: string | Buffer): Promise<BlockBlobClient> {
    try {
      const plaintext = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf-8");

      // Step 1: Generate a data encryption key (DEK)
      const dataKey = this.keyManagement.generateDataKey();

      // Step 2: Wrap (protect) the DEK using Key Vault
      const { wrappedKey, keyId } = await this.keyManagement.wrapDataKey(dataKey);

      // Step 3: Encrypt the data locally using AES-256-GCM
      const iv = randomBytes(12); // 96-bit IV for GCM mode
      const cipher = createCipheriv(this.algorithm, dataKey, iv);

      const encryptedChunks: Buffer[] = [];
      encryptedChunks.push(cipher.update(plaintext));
      encryptedChunks.push(cipher.final());
      
      const ciphertext = Buffer.concat(encryptedChunks);
      const authTag = cipher.getAuthTag(); // GCM authentication tag

      // Step 4: Store encryption metadata with the blob
      const metadata: Record<string, string> = {
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
        wrappedKey: wrappedKey.toString("base64"),
        keyId: keyId,
        algorithm: this.algorithm,
      };

      // Step 5: Upload ciphertext to Blob Storage
      const blobClient = this.containerClient.getBlockBlobClient(blobName);
      await blobClient.upload(ciphertext, ciphertext.length, {
        metadata,
      });

      console.log(`✓ Uploaded encrypted blob: ${blobName} (${ciphertext.length} bytes)`);

      // Clear sensitive data from memory
      dataKey.fill(0);

      return blobClient;
    } catch (error: any) {
      if (error?.statusCode === 403) {
        throw new Error(`Access denied to storage account. Check RBAC permissions (requires 'Storage Blob Data Contributor' role).`);
      } else if (error?.statusCode === 404) {
        throw new Error(`Container '${this.containerClient.containerName}' not found. Please create it first.`);
      }
      throw new Error(`Failed to upload encrypted blob: ${error?.message || error}`);
    }
  }

  /**
   * Downloads and decrypts a blob from storage.
   * Retrieves encryption metadata, unwraps the DEK via Key Vault, then decrypts.
   * 
   * @param blobName - Name of the blob to download
   * @returns The decrypted plaintext data
   */
  public async downloadDecrypted(blobName: string): Promise<Buffer> {
    try {
      const blobClient = this.containerClient.getBlockBlobClient(blobName);

      // Step 1: Download the blob and its metadata
      const downloadResponse = await blobClient.download(0);
      
      if (!downloadResponse.readableStreamBody) {
        throw new Error("Failed to get readable stream from blob");
      }

      // Read the ciphertext
      const ciphertext = await this.streamToBuffer(downloadResponse.readableStreamBody);

      // Step 2: Extract encryption metadata
      const metadata = downloadResponse.metadata;
      if (!metadata) {
        throw new Error("Blob has no metadata. It may not be encrypted.");
      }

      const encryptionMeta = this.parseMetadata(metadata);

      // Step 3: Unwrap (recover) the DEK using Key Vault
      const wrappedKey = Buffer.from(encryptionMeta.wrappedKey, "base64");
      const dataKey = await this.keyManagement.unwrapDataKey(wrappedKey, encryptionMeta.keyId);

      // Step 4: Decrypt the data locally
      const iv = Buffer.from(encryptionMeta.iv, "base64");
      const authTag = Buffer.from(encryptionMeta.authTag, "base64");

      const decipher = createDecipheriv(encryptionMeta.algorithm, dataKey, iv) as any;
      decipher.setAuthTag(authTag);

      const decryptedChunks: Buffer[] = [];
      decryptedChunks.push(decipher.update(ciphertext));
      decryptedChunks.push(decipher.final());

      const plaintext = Buffer.concat(decryptedChunks);

      console.log(`✓ Downloaded and decrypted blob: ${blobName} (${plaintext.length} bytes)`);

      // Clear sensitive data from memory
      dataKey.fill(0);

      return plaintext;
    } catch (error: any) {
      if (error?.statusCode === 404) {
        throw new Error(`Blob '${blobName}' not found in container '${this.containerClient.containerName}'.`);
      } else if (error?.statusCode === 403) {
        throw new Error(`Access denied to blob. Check RBAC permissions.`);
      } else if (error?.message?.includes("Unsupported state or unable to authenticate data")) {
        throw new Error("Decryption failed. The blob may be corrupted or tampered with.");
      }
      throw new Error(`Failed to download and decrypt blob: ${error?.message || error}`);
    }
  }

  /**
   * Ensures the container exists, creates it if not.
   */
  public async ensureContainerExists(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists();
      console.log(`Container '${this.containerClient.containerName}' is ready.`);
    } catch (error: any) {
      if (error?.statusCode === 403) {
        throw new Error(`Access denied. Cannot create container. Check RBAC permissions.`);
      }
      throw error;
    }
  }

  /**
   * Lists all blobs in the container.
   */
  public async listBlobs(): Promise<string[]> {
    const blobs: string[] = [];
    for await (const blob of this.containerClient.listBlobsFlat()) {
      blobs.push(blob.name);
    }
    return blobs;
  }

  /**
   * Parses and validates encryption metadata from blob metadata.
   */
  private parseMetadata(metadata: Record<string, string>): EncryptionMetadata {
    const { iv, authTag, wrappedKey, keyId, algorithm } = metadata;

    if (!iv || !authTag || !wrappedKey || !keyId || !algorithm) {
      throw new Error(
        "Missing encryption metadata. Required: iv, authTag, wrappedKey, keyId, algorithm"
      );
    }

    return { iv, authTag, wrappedKey, keyId, algorithm };
  }

  /**
   * Converts a readable stream to a buffer.
   */
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of readableStream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
