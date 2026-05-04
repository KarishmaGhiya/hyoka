import { BlobServiceClient, ContainerClient, BlockBlobClient, RestError } from "@azure/storage-blob";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { KeyManagementService, WrappedKey } from "./keyManagement";

export interface EncryptionMetadata {
  iv: string; // Initialization vector (base64)
  authTag: string; // Authentication tag for GCM mode (base64)
  wrappedKey: string; // Wrapped DEK (base64)
  keyId: string; // Key Vault key ID
  algorithm: string; // Wrapping algorithm
  encryptionAlgorithm: string; // Data encryption algorithm (AES-256-GCM)
}

export class BlobEncryptorService {
  private readonly containerClient: ContainerClient;
  private readonly keyManagement: KeyManagementService;

  constructor(
    blobServiceClient: BlobServiceClient,
    keyManagement: KeyManagementService,
    containerName: string
  ) {
    this.containerClient = blobServiceClient.getContainerClient(containerName);
    this.keyManagement = keyManagement;
  }

  /**
   * Ensure the container exists before upload/download operations.
   */
  async ensureContainer(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists();
    } catch (error: any) {
      throw new Error(`Failed to create container: ${error.message}`);
    }
  }

  /**
   * Encrypt data locally using AES-256-GCM, wrap the DEK with Key Vault,
   * then upload the ciphertext to Blob Storage with encryption metadata.
   */
  async uploadEncrypted(blobName: string, data: string | Buffer): Promise<void> {
    try {
      const plaintext = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf-8");

      // Step 1: Generate a random data encryption key (DEK) locally
      const dataKey = this.keyManagement.generateDataEncryptionKey();

      // Step 2: Encrypt the data locally using AES-256-GCM
      const iv = randomBytes(12); // 96-bit IV recommended for GCM
      const cipher = createCipheriv("aes-256-gcm", dataKey, iv);
      
      const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const authTag = cipher.getAuthTag(); // Get authentication tag after encryption

      // Step 3: Wrap (protect) the DEK using Key Vault
      const wrappedKey = await this.keyManagement.wrapDataKey(dataKey);

      // Step 4: Prepare metadata with all cryptographic parameters
      const metadata: EncryptionMetadata = {
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
        wrappedKey: wrappedKey.wrappedKey,
        keyId: wrappedKey.keyId,
        algorithm: wrappedKey.algorithm,
        encryptionAlgorithm: "aes-256-gcm",
      };

      // Step 5: Upload encrypted data to Blob Storage with metadata
      const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      // Convert metadata to string record (Azure blob metadata only supports strings)
      const metadataRecord: Record<string, string> = {
        iv: metadata.iv,
        authTag: metadata.authTag,
        wrappedKey: metadata.wrappedKey,
        keyId: metadata.keyId,
        algorithm: metadata.algorithm,
        encryptionAlgorithm: metadata.encryptionAlgorithm,
      };
      
      await blockBlobClient.upload(encrypted, encrypted.length, {
        metadata: metadataRecord,
        blobHTTPHeaders: {
          blobContentType: "application/octet-stream",
        },
      });

      // Clear sensitive data from memory (best effort)
      dataKey.fill(0);

    } catch (error: any) {
      if (error instanceof RestError) {
        if (error.statusCode === 403) {
          throw new Error("Access denied to Blob Storage. Check permissions.");
        } else if (error.statusCode === 404) {
          throw new Error("Blob Storage container not found.");
        }
      }
      throw new Error(`Failed to upload encrypted blob: ${error.message}`);
    }
  }

  /**
   * Download encrypted blob from storage, unwrap the DEK using Key Vault,
   * then decrypt the data locally.
   */
  async downloadDecrypted(blobName: string): Promise<Buffer> {
    try {
      // Step 1: Download the blob and its metadata
      const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      const downloadResponse = await blockBlobClient.download();
      
      if (!downloadResponse.metadata) {
        throw new Error("Blob metadata not found. This blob may not be encrypted.");
      }

      // Step 2: Extract encryption metadata
      const metadata = downloadResponse.metadata as unknown as EncryptionMetadata;
      
      if (!metadata.iv || !metadata.authTag || !metadata.wrappedKey || !metadata.keyId) {
        throw new Error("Invalid encryption metadata. Missing required fields.");
      }

      // Step 3: Read the encrypted data
      const encryptedData = await this.streamToBuffer(downloadResponse.readableStreamBody!);

      // Step 4: Unwrap (recover) the DEK using Key Vault
      const wrappedKey: WrappedKey = {
        wrappedKey: metadata.wrappedKey,
        keyId: metadata.keyId,
        algorithm: metadata.algorithm,
      };
      
      const dataKey = await this.keyManagement.unwrapDataKey(wrappedKey);

      // Step 5: Decrypt the data locally using AES-256-GCM
      const iv = Buffer.from(metadata.iv, "base64");
      const authTag = Buffer.from(metadata.authTag, "base64");
      
      const decipher = createDecipheriv("aes-256-gcm", dataKey, iv);
      decipher.setAuthTag(authTag); // Set auth tag for GCM verification
      
      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);

      // Clear sensitive data from memory (best effort)
      dataKey.fill(0);

      return decrypted;

    } catch (error: any) {
      if (error instanceof RestError) {
        if (error.statusCode === 404) {
          throw new Error(`Blob '${blobName}' not found in container.`);
        } else if (error.statusCode === 403) {
          throw new Error("Access denied to Blob Storage. Check permissions.");
        }
      }
      throw new Error(`Failed to download and decrypt blob: ${error.message}`);
    }
  }

  /**
   * Helper method to convert a readable stream to a buffer.
   */
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      readableStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on("error", reject);
    });
  }

  /**
   * Check if a blob exists in the container.
   */
  async blobExists(blobName: string): Promise<boolean> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      return await blockBlobClient.exists();
    } catch {
      return false;
    }
  }

  /**
   * Delete a blob from the container.
   */
  async deleteBlob(blobName: string): Promise<void> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
    } catch (error: any) {
      throw new Error(`Failed to delete blob: ${error.message}`);
    }
  }
}
