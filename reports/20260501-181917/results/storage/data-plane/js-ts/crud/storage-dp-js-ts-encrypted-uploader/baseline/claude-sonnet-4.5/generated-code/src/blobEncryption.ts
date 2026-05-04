import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { KeyManager } from "./keyManager";
import * as crypto from "crypto";

export interface EncryptionMetadata {
  wrappedKey: string;
  keyId: string;
  iv: string;
  authTag: string;
}

export class BlobEncryptionClient {
  private containerClient: ContainerClient;
  private keyManager: KeyManager;

  constructor(
    blobServiceClient: BlobServiceClient,
    containerName: string,
    keyManager: KeyManager
  ) {
    this.containerClient = blobServiceClient.getContainerClient(containerName);
    this.keyManager = keyManager;
  }

  async ensureContainer(): Promise<void> {
    await this.containerClient.createIfNotExists();
  }

  async uploadEncrypted(
    blobName: string,
    data: string | Buffer
  ): Promise<EncryptionMetadata> {
    try {
      const dataBuffer = typeof data === "string" ? Buffer.from(data, "utf-8") : data;

      const dataKey = this.keyManager.generateDataEncryptionKey();
      const iv = crypto.randomBytes(12);

      const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, iv);
      const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
      const authTag = cipher.getAuthTag();

      const wrappedKeyInfo = await this.keyManager.wrapKey(dataKey);

      const metadata: EncryptionMetadata = {
        wrappedKey: wrappedKeyInfo.wrappedKey,
        keyId: wrappedKeyInfo.keyId,
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
      };

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(encrypted, encrypted.length, {
        metadata: {
          encrypted: "true",
          wrappedkey: metadata.wrappedKey,
          keyid: metadata.keyId,
          iv: metadata.iv,
          authtag: metadata.authTag,
        },
      });

      return metadata;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload encrypted blob: ${error.message}`);
      }
      throw new Error("Failed to upload encrypted blob: Unknown error");
    }
  }

  async downloadDecrypted(blobName: string): Promise<Buffer> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      const exists = await blockBlobClient.exists();
      if (!exists) {
        throw new Error(`Blob '${blobName}' does not exist`);
      }

      const properties = await blockBlobClient.getProperties();
      const metadata = properties.metadata;

      if (!metadata || metadata.encrypted !== "true") {
        throw new Error("Blob is not encrypted or missing encryption metadata");
      }

      if (!metadata.wrappedkey || !metadata.keyid || !metadata.iv || !metadata.authtag) {
        throw new Error("Missing required encryption metadata fields");
      }

      const downloadResponse = await blockBlobClient.download();
      if (!downloadResponse.readableStreamBody) {
        throw new Error("Failed to get blob content stream");
      }

      const encryptedData = await this.streamToBuffer(
        downloadResponse.readableStreamBody
      );

      const dataKey = await this.keyManager.unwrapKey(
        metadata.wrappedkey,
        metadata.keyid
      );

      const iv = Buffer.from(metadata.iv, "base64");
      const authTag = Buffer.from(metadata.authtag, "base64");

      const decipher = crypto.createDecipheriv("aes-256-gcm", dataKey, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);

      return decrypted;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to download and decrypt blob: ${error.message}`);
      }
      throw new Error("Failed to download and decrypt blob: Unknown error");
    }
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }
}
