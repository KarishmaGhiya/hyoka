import { BlobServiceClient } from "@azure/storage-blob";
import { RestError } from "@azure/core-rest-pipeline";
import * as crypto from "crypto";
import { KeyManager } from "./keyManager";

const AES_ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // NIST-recommended for GCM
const AUTH_TAG_BYTES = 16;

/**
 * Encrypts data locally with AES-256-GCM and uploads ciphertext to Azure Blob Storage.
 * The data encryption key is envelope-encrypted via Key Vault.
 *
 * Blob metadata stores:
 *   encryptionkeyid – Key Vault key ID used for wrapping
 *   wrappeddek      – base-64 encoded wrapped DEK
 *   iv              – base-64 encoded initialization vector
 *   authtag         – base-64 encoded GCM authentication tag
 */
export class EncryptedBlobClient {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly keyManager: KeyManager;

  constructor(blobServiceClient: BlobServiceClient, keyManager: KeyManager) {
    this.blobServiceClient = blobServiceClient;
    this.keyManager = keyManager;
  }

  /**
   * Encrypt and upload data to a blob.
   *
   * @returns The metadata stored alongside the blob (useful for verification).
   */
  async upload(
    containerName: string,
    blobName: string,
    plaintext: Buffer
  ): Promise<{ keyId: string; wrappedDekBase64: string }> {
    // 1. Generate a DEK and wrap it with Key Vault
    let keyMaterial;
    try {
      keyMaterial = await this.keyManager.generateAndWrapKey();
    } catch (err) {
      throw new Error(
        `Key Vault operation failed while generating/wrapping DEK: ${messageFrom(err)}`
      );
    }

    const { plaintextDek, wrappedDek, keyId } = keyMaterial;

    // 2. Encrypt locally with AES-256-GCM
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(AES_ALGORITHM, plaintextDek, iv, {
      authTagLength: AUTH_TAG_BYTES,
    });
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Zero out the plaintext DEK as soon as possible
    plaintextDek.fill(0);

    // 3. Upload ciphertext with metadata
    const metadata: Record<string, string> = {
      encryptionkeyid: keyId,
      wrappeddek: wrappedDek.toString("base64"),
      iv: iv.toString("base64"),
      authtag: authTag.toString("base64"),
    };

    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists();
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(ciphertext, ciphertext.length, { metadata });
    } catch (err) {
      throw new Error(
        `Blob Storage upload failed: ${messageFrom(err)}`
      );
    }

    return { keyId, wrappedDekBase64: wrappedDek.toString("base64") };
  }

  /**
   * Download and decrypt a blob.
   */
  async download(containerName: string, blobName: string): Promise<Buffer> {
    // 1. Download blob and metadata
    let ciphertext: Buffer;
    let metadata: Record<string, string>;

    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blobClient = containerClient.getBlockBlobClient(blobName);
      const response = await blobClient.download(0);

      metadata = (response.metadata ?? {}) as Record<string, string>;
      ciphertext = await streamToBuffer(response.readableStreamBody!);
    } catch (err) {
      if (err instanceof RestError && err.statusCode === 404) {
        throw new Error(
          `Blob not found: ${containerName}/${blobName}`
        );
      }
      throw new Error(
        `Blob Storage download failed: ${messageFrom(err)}`
      );
    }

    // 2. Extract crypto parameters from metadata
    const keyId = metadata.encryptionkeyid;
    const wrappedDekB64 = metadata.wrappeddek;
    const ivB64 = metadata.iv;
    const authTagB64 = metadata.authtag;

    if (!keyId || !wrappedDekB64 || !ivB64 || !authTagB64) {
      throw new Error(
        "Blob metadata is missing required encryption fields " +
          "(encryptionkeyid, wrappeddek, iv, authtag)"
      );
    }

    const wrappedDek = Buffer.from(wrappedDekB64, "base64");
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");

    // 3. Unwrap DEK via Key Vault
    let plaintextDek: Buffer;
    try {
      plaintextDek = await this.keyManager.unwrapKey(wrappedDek, keyId);
    } catch (err) {
      throw new Error(
        `Key Vault unwrap failed (key may be disabled or deleted): ${messageFrom(err)}`
      );
    }

    // 4. Decrypt locally
    try {
      const decipher = crypto.createDecipheriv(AES_ALGORITHM, plaintextDek, iv, {
        authTagLength: AUTH_TAG_BYTES,
      });
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decrypted;
    } finally {
      plaintextDek.fill(0);
    }
  }
}

async function streamToBuffer(
  stream: NodeJS.ReadableStream
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function messageFrom(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
