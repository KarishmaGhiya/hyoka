import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { KeyWrapAlgorithm } from "@azure/keyvault-keys";
import { ContainerClient } from "@azure/storage-blob";
import { KeyVaultEnvelopeKeyManager } from "./keyManager";

const CONTENT_ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const supportedWrapAlgorithms = new Set<KeyWrapAlgorithm>([
  "A128KW",
  "A192KW",
  "A256KW",
  "RSA-OAEP",
  "RSA-OAEP-256",
  "RSA1_5",
  "CKM_AES_KEY_WRAP",
  "CKM_AES_KEY_WRAP_PAD"
]);

const metadataKeys = {
  wrappedDataKey: "wrappeddek",
  wrappingAlgorithm: "wrapalg",
  keyId: "keyid",
  initializationVector: "iv",
  authenticationTag: "authtag",
  contentEncryptionAlgorithm: "contentalg"
} as const;

export interface UploadEncryptedBlobResult {
  blobName: string;
  keyId: string;
  wrappedDataKeyBase64: string;
}

export class EncryptedBlobStorage {
  public constructor(
    private readonly containerClient: ContainerClient,
    private readonly keyManager: KeyVaultEnvelopeKeyManager
  ) {}

  public async uploadText(blobName: string, plaintext: string): Promise<UploadEncryptedBlobResult> {
    return this.uploadBuffer(blobName, Buffer.from(plaintext, "utf8"));
  }

  public async uploadBuffer(blobName: string, plaintext: Buffer): Promise<UploadEncryptedBlobResult> {
    await this.ensureContainerExists();

    const { plaintextKey, wrappedKey, wrappingAlgorithm, keyId } =
      await this.keyManager.generateWrappedDataKey();
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(CONTENT_ENCRYPTION_ALGORITHM, plaintextKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    try {
      await blockBlobClient.uploadData(ciphertext, {
        metadata: {
          [metadataKeys.wrappedDataKey]: wrappedKey.toString("base64"),
          [metadataKeys.wrappingAlgorithm]: wrappingAlgorithm,
          [metadataKeys.keyId]: keyId,
          [metadataKeys.initializationVector]: iv.toString("base64"),
          [metadataKeys.authenticationTag]: authTag.toString("base64"),
          [metadataKeys.contentEncryptionAlgorithm]: CONTENT_ENCRYPTION_ALGORITHM
        }
      });

      return {
        blobName,
        keyId,
        wrappedDataKeyBase64: wrappedKey.toString("base64")
      };
    } catch (error) {
      throw new Error(
        `Failed to upload encrypted blob "${blobName}" to container "${this.containerClient.containerName}".`,
        { cause: error }
      );
    }
  }

  public async downloadText(blobName: string): Promise<string> {
    const plaintext = await this.downloadBuffer(blobName);
    return plaintext.toString("utf8");
  }

  public async downloadBuffer(blobName: string): Promise<Buffer> {
    const blobClient = this.containerClient.getBlobClient(blobName);
    const exists = await blobClient.exists();

    if (!exists) {
      throw new Error(
        `Blob "${blobName}" does not exist in container "${this.containerClient.containerName}".`
      );
    }

    let metadata: Record<string, string>;
    let ciphertext: Buffer;

    try {
      const [properties, downloaded] = await Promise.all([
        blobClient.getProperties(),
        blobClient.downloadToBuffer()
      ]);

      metadata = properties.metadata ?? {};
      ciphertext = downloaded;
    } catch (error) {
      throw new Error(
        `Failed to download encrypted blob "${blobName}" from container "${this.containerClient.containerName}".`,
        { cause: error }
      );
    }

    const wrappedDataKeyBase64 = this.requireMetadata(metadata, metadataKeys.wrappedDataKey, blobName);
    const wrappingAlgorithm = this.parseWrapAlgorithm(
      this.requireMetadata(metadata, metadataKeys.wrappingAlgorithm, blobName),
      blobName
    );
    const keyId = this.requireMetadata(metadata, metadataKeys.keyId, blobName);
    const ivBase64 = this.requireMetadata(metadata, metadataKeys.initializationVector, blobName);
    const authTagBase64 = this.requireMetadata(metadata, metadataKeys.authenticationTag, blobName);
    const contentAlgorithm = this.requireMetadata(
      metadata,
      metadataKeys.contentEncryptionAlgorithm,
      blobName
    );

    if (contentAlgorithm !== CONTENT_ENCRYPTION_ALGORITHM) {
      throw new Error(
        `Blob "${blobName}" uses unsupported content encryption algorithm "${contentAlgorithm}".`
      );
    }

    const plaintextKey = await this.keyManager.unwrapDataKey(
      Buffer.from(wrappedDataKeyBase64, "base64"),
      keyId,
      wrappingAlgorithm
    );

    try {
      const decipher = createDecipheriv(
        CONTENT_ENCRYPTION_ALGORITHM,
        plaintextKey,
        Buffer.from(ivBase64, "base64")
      );

      decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch (error) {
      throw new Error(`Failed to decrypt blob "${blobName}" with the unwrapped data key.`, {
        cause: error
      });
    }
  }

  private async ensureContainerExists(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists();
    } catch (error) {
      throw new Error(
        `Failed to ensure container "${this.containerClient.containerName}" exists in Blob Storage.`,
        { cause: error }
      );
    }
  }

  private requireMetadata(
    metadata: Record<string, string>,
    metadataKey: string,
    blobName: string
  ): string {
    const value = metadata[metadataKey];

    if (!value) {
      throw new Error(`Blob "${blobName}" is missing required metadata field "${metadataKey}".`);
    }

    return value;
  }

  private parseWrapAlgorithm(value: string, blobName: string): KeyWrapAlgorithm {
    if (!supportedWrapAlgorithms.has(value as KeyWrapAlgorithm)) {
      throw new Error(`Blob "${blobName}" uses unsupported key wrap algorithm "${value}".`);
    }

    return value as KeyWrapAlgorithm;
  }
}
