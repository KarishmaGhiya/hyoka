import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { CipherGCMTypes } from "node:crypto";

import { ContainerClient } from "@azure/storage-blob";

import { KeyVaultEnvelopeKeyManager, formatAzureError } from "./keyVaultEnvelopeKeyManager";

const LOCAL_ENCRYPTION_ALGORITHM: CipherGCMTypes = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;

interface EncryptionMetadata {
  [key: string]: string;
  encryptionalgorithm: string;
  wrapalgorithm: string;
  wrappeddek: string;
  keyid: string;
  iv: string;
  authtag: string;
}

export interface UploadEncryptedBlobResult {
  blobName: string;
  vaultKeyId: string;
  wrappedDataKeyBase64: string;
}

export class EncryptedBlobClient {
  constructor(
    private readonly containerClient: ContainerClient,
    private readonly keyManager: KeyVaultEnvelopeKeyManager,
  ) {}

  async uploadText(blobName: string, plaintext: string): Promise<UploadEncryptedBlobResult> {
    return this.uploadBuffer(blobName, Buffer.from(plaintext, "utf8"));
  }

  async uploadBuffer(blobName: string, plaintext: Buffer): Promise<UploadEncryptedBlobResult> {
    try {
      await this.containerClient.createIfNotExists();
    } catch (error: unknown) {
      throw new Error(
        `Failed to create or access Blob Storage container "${this.containerClient.containerName}": ${formatAzureError(error)}`,
      );
    }

    let wrappedKey;

    try {
      wrappedKey = await this.keyManager.generateAndWrapDataKey();
    } catch (error: unknown) {
      throw new Error(`Failed to generate or wrap the data encryption key: ${formatAzureError(error)}`);
    }

    try {
      const iv = randomBytes(IV_LENGTH_BYTES);
      const cipher = createCipheriv(LOCAL_ENCRYPTION_ALGORITHM, wrappedKey.rawDataKey, iv);
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const authTag = cipher.getAuthTag();
      const metadata: EncryptionMetadata = {
        encryptionalgorithm: LOCAL_ENCRYPTION_ALGORITHM,
        wrapalgorithm: wrappedKey.wrapAlgorithm,
        wrappeddek: wrappedKey.wrappedDataKey.toString("base64"),
        keyid: wrappedKey.keyId,
        iv: iv.toString("base64"),
        authtag: authTag.toString("base64"),
      };

      await this.containerClient.getBlockBlobClient(blobName).uploadData(ciphertext, {
        metadata,
        blobHTTPHeaders: {
          blobContentType: "application/octet-stream",
        },
      });

      return {
        blobName,
        vaultKeyId: wrappedKey.keyId,
        wrappedDataKeyBase64: metadata.wrappeddek,
      };
    } catch (error: unknown) {
      throw new Error(`Failed to upload encrypted blob "${blobName}": ${formatAzureError(error)}`);
    } finally {
      wrappedKey.rawDataKey.fill(0);
    }
  }

  async downloadText(blobName: string): Promise<string> {
    const plaintext = await this.downloadBuffer(blobName);
    return plaintext.toString("utf8");
  }

  async downloadBuffer(blobName: string): Promise<Buffer> {
    const blobClient = this.containerClient.getBlobClient(blobName);

    const exists = await blobClient.exists().catch((error: unknown) => {
      throw new Error(`Failed to check whether blob "${blobName}" exists: ${formatAzureError(error)}`);
    });

    if (!exists) {
      throw new Error(`Blob "${blobName}" does not exist in container "${this.containerClient.containerName}".`);
    }

    const properties = await blobClient.getProperties().catch((error: unknown) => {
      throw new Error(`Failed to read metadata for blob "${blobName}": ${formatAzureError(error)}`);
    });

    const metadata = this.requireEncryptionMetadata(blobName, properties.metadata);

    const ciphertext = await blobClient.downloadToBuffer().catch((error: unknown) => {
      throw new Error(`Failed to download encrypted blob "${blobName}": ${formatAzureError(error)}`);
    });

    let rawDataKey: Buffer | undefined;

    try {
      rawDataKey = await this.keyManager.unwrapDataKey(
        Buffer.from(metadata.wrappeddek, "base64"),
        metadata.keyid,
        metadata.wrapalgorithm,
      );
    } catch (error: unknown) {
      throw new Error(`Failed to unwrap the data encryption key for blob "${blobName}": ${formatAzureError(error)}`);
    }

    try {
      if (metadata.encryptionalgorithm !== LOCAL_ENCRYPTION_ALGORITHM) {
        throw new Error(
          `Unsupported encryption algorithm "${metadata.encryptionalgorithm}" on blob "${blobName}".`,
        );
      }

      const decipher = createDecipheriv(LOCAL_ENCRYPTION_ALGORITHM, rawDataKey, Buffer.from(metadata.iv, "base64"));
      decipher.setAuthTag(Buffer.from(metadata.authtag, "base64"));

      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch (error: unknown) {
      throw new Error(`Failed to decrypt blob "${blobName}": ${formatAzureError(error)}`);
    } finally {
      rawDataKey.fill(0);
    }
  }

  private requireEncryptionMetadata(
    blobName: string,
    metadata: Record<string, string> | undefined,
  ): EncryptionMetadata {
    const requiredKeys: Array<keyof EncryptionMetadata> = [
      "encryptionalgorithm",
      "wrapalgorithm",
      "wrappeddek",
      "keyid",
      "iv",
      "authtag",
    ];

    if (!metadata) {
      throw new Error(`Blob "${blobName}" is missing encryption metadata.`);
    }

    for (const key of requiredKeys) {
      if (!metadata[key]) {
        throw new Error(`Blob "${blobName}" is missing required encryption metadata field "${key}".`);
      }
    }

    return {
      encryptionalgorithm: metadata.encryptionalgorithm,
      wrapalgorithm: metadata.wrapalgorithm,
      wrappeddek: metadata.wrappeddek,
      keyid: metadata.keyid,
      iv: metadata.iv,
      authtag: metadata.authtag,
    };
  }
}
