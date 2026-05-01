import * as crypto from "crypto";
import { ContainerClient } from "@azure/storage-blob";
import { AzureConfig } from "./config";
import { KeyManager, WrappedKeyBundle } from "./keyManager";

const AES_ALGORITHM = "aes-256-gcm";
const IV_BYTE_LENGTH = 12; // 96-bit IV recommended for AES-GCM
const AUTH_TAG_BYTE_LENGTH = 16;

// Metadata keys stored on the blob
const META_WRAPPED_DEK = "wrappedDek";
const META_KEY_ID = "keyId";
const META_IV = "iv";
const META_AUTH_TAG = "authTag";

/**
 * Encrypts data locally with AES-256-GCM and uploads the ciphertext to
 * Azure Blob Storage. The wrapped DEK, IV, and authentication tag are
 * stored as blob metadata so that no additional storage is required.
 */
export class EncryptedBlobClient {
  private readonly keyManager: KeyManager;
  private readonly containerClient: ContainerClient;

  constructor(config: AzureConfig, containerName: string) {
    this.keyManager = new KeyManager(config);
    this.containerClient = config.blobServiceClient.getContainerClient(containerName);
  }

  /**
   * Encrypt and upload plaintext data to a blob.
   *
   * Returns the vault key ID and wrapped DEK for informational purposes.
   */
  async upload(
    blobName: string,
    plaintext: Buffer,
  ): Promise<{ keyId: string; wrappedDek: Buffer }> {
    // 1. Generate a DEK and wrap it via Key Vault
    const { dek, bundle } = await this.keyManager.generateAndWrapKey();

    try {
      // 2. Encrypt locally with AES-256-GCM
      const iv = crypto.randomBytes(IV_BYTE_LENGTH);
      const cipher = crypto.createCipheriv(AES_ALGORITHM, dek, iv, {
        authTagLength: AUTH_TAG_BYTE_LENGTH,
      });
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // 3. Upload ciphertext with cryptographic parameters in metadata
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(ciphertext, ciphertext.length, {
        metadata: {
          [META_WRAPPED_DEK]: bundle.wrappedDek.toString("base64"),
          [META_KEY_ID]: bundle.keyId,
          [META_IV]: iv.toString("base64"),
          [META_AUTH_TAG]: authTag.toString("base64"),
        },
      });

      return { keyId: bundle.keyId, wrappedDek: bundle.wrappedDek };
    } finally {
      // Zero out the plaintext DEK so it is not retained in memory
      dek.fill(0);
    }
  }

  /**
   * Download a blob and decrypt it.
   *
   * Handles missing blobs and disabled/deleted Key Vault keys with clear
   * error messages.
   */
  async download(blobName: string): Promise<Buffer> {
    // 1. Download the blob
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    let downloadResponse;
    try {
      downloadResponse = await blockBlobClient.download(0);
    } catch (err: unknown) {
      if (isStorageError(err, 404)) {
        throw new Error(`Blob "${blobName}" does not exist in container "${this.containerClient.containerName}".`);
      }
      throw err;
    }

    // 2. Read the ciphertext into a buffer
    const ciphertext = await streamToBuffer(downloadResponse.readableStreamBody!);

    // 3. Extract cryptographic metadata
    const metadata = downloadResponse.metadata ?? {};
    const wrappedDekB64 = metadata[META_WRAPPED_DEK];
    const keyId = metadata[META_KEY_ID];
    const ivB64 = metadata[META_IV];
    const authTagB64 = metadata[META_AUTH_TAG];

    if (!wrappedDekB64 || !keyId || !ivB64 || !authTagB64) {
      throw new Error(
        `Blob "${blobName}" is missing required encryption metadata. ` +
        "It may not have been uploaded with this tool.",
      );
    }

    const bundle: WrappedKeyBundle = {
      keyId,
      wrappedDek: Buffer.from(wrappedDekB64, "base64"),
    };

    // 4. Unwrap the DEK via Key Vault
    const { dek } = await this.keyManager.unwrapKey(bundle);

    try {
      // 5. Decrypt locally
      const iv = Buffer.from(ivB64, "base64");
      const authTag = Buffer.from(authTagB64, "base64");
      const decipher = crypto.createDecipheriv(AES_ALGORITHM, dek, iv, {
        authTagLength: AUTH_TAG_BYTE_LENGTH,
      });
      decipher.setAuthTag(authTag);
      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

      return plaintext;
    } finally {
      dek.fill(0);
    }
  }
}

function isStorageError(err: unknown, statusCode: number): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "statusCode" in err &&
    (err as { statusCode: number }).statusCode === statusCode
  );
}

async function streamToBuffer(
  stream: NodeJS.ReadableStream,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
