import * as crypto from "node:crypto";
import { BlobServiceClient, RestError } from "@azure/storage-blob";
import { KeyManager, type WrappedKeyBundle } from "./keyManager";

const AES_ALGORITHM = "aes-256-gcm";
const IV_BYTE_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_BYTE_LENGTH = 16;

/**
 * Encrypts data locally using AES-256-GCM with envelope encryption keys
 * managed by Key Vault, then uploads / downloads ciphertext to / from
 * Azure Blob Storage.
 */
export class EncryptedBlobClient {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly keyManager: KeyManager;

  constructor(blobServiceClient: BlobServiceClient, keyManager: KeyManager) {
    this.blobServiceClient = blobServiceClient;
    this.keyManager = keyManager;
  }

  /**
   * Encrypt `plaintext` with a fresh DEK and upload the ciphertext to Blob
   * Storage.  The wrapped DEK and crypto parameters are stored as blob
   * metadata so that `download()` can reverse the process.
   */
  async upload(
    containerName: string,
    blobName: string,
    plaintext: Buffer,
  ): Promise<WrappedKeyBundle> {
    // 1. Generate a DEK and wrap it via Key Vault.
    const { dek, bundle } = await this.keyManager.generateDataKey();

    // 2. Encrypt locally with AES-256-GCM.
    const iv = crypto.randomBytes(IV_BYTE_LENGTH);
    const cipher = crypto.createCipheriv(AES_ALGORITHM, dek, iv, {
      authTagLength: AUTH_TAG_BYTE_LENGTH,
    });
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // 3. Build metadata.
    const metadata: Record<string, string> = {
      enc_key_id: bundle.keyId,
      enc_wrapped_dek: bundle.wrappedDek,
      enc_iv: iv.toString("base64"),
      enc_auth_tag: authTag.toString("base64"),
    };

    // 4. Upload ciphertext + metadata.
    const containerClient =
      this.blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(ciphertext, ciphertext.length, { metadata });

    return bundle;
  }

  /**
   * Download and decrypt a blob that was previously uploaded with `upload()`.
   */
  async download(containerName: string, blobName: string): Promise<Buffer> {
    const containerClient =
      this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    // 1. Download ciphertext and metadata.
    let downloadResponse;
    try {
      downloadResponse = await blobClient.download(0);
    } catch (err) {
      if (err instanceof RestError && err.statusCode === 404) {
        throw new Error(
          `Blob "${blobName}" not found in container "${containerName}".`,
        );
      }
      throw err;
    }

    const ciphertext = await streamToBuffer(downloadResponse.readableStreamBody!);
    const metadata = downloadResponse.metadata ?? {};

    if (!metadata.enc_wrapped_dek || !metadata.enc_iv || !metadata.enc_auth_tag || !metadata.enc_key_id) {
      throw new Error("Blob metadata is missing required encryption fields.");
    }

    // 2. Unwrap the DEK via Key Vault.
    const bundle: WrappedKeyBundle = {
      keyId: metadata.enc_key_id,
      wrappedDek: metadata.enc_wrapped_dek,
    };

    let dek: Buffer;
    try {
      dek = await this.keyManager.unwrapDataKey(bundle);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Failed to unwrap DEK (the vault key may be disabled or deleted): ${message}`,
      );
    }

    // 3. Decrypt locally.
    const iv = Buffer.from(metadata.enc_iv, "base64");
    const authTag = Buffer.from(metadata.enc_auth_tag, "base64");

    const decipher = crypto.createDecipheriv(AES_ALGORITHM, dek, iv, {
      authTagLength: AUTH_TAG_BYTE_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted;
  }
}

/** Drain a Node.js readable stream into a Buffer. */
async function streamToBuffer(
  stream: NodeJS.ReadableStream,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
