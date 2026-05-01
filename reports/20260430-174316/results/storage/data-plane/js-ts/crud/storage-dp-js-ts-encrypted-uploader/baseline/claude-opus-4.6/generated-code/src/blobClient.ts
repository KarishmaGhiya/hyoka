import * as crypto from "crypto";
import { ContainerClient } from "@azure/storage-blob";
import { KeyManager, WrappedKeyBundle } from "./keyManager";

const AES_ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // NIST-recommended for GCM
const AUTH_TAG_BYTES = 16;

/**
 * Metadata keys stored on the blob.
 * Azure Blob metadata keys are case-insensitive and must be valid C# identifiers,
 * so we use camelCase without special characters.
 */
const META = {
  wrappedDek: "wrappedDek",
  keyId: "keyId",
  iv: "iv",
  authTag: "authTag",
} as const;

export class EncryptedBlobClient {
  private readonly containerClient: ContainerClient;
  private readonly keyManager: KeyManager;

  constructor(containerClient: ContainerClient, keyManager: KeyManager) {
    this.containerClient = containerClient;
    this.keyManager = keyManager;
  }

  /**
   * Encrypt `plaintext` with a fresh DEK wrapped by Key Vault,
   * then upload the ciphertext to the given blob.  Cryptographic
   * parameters (IV, auth-tag, wrapped DEK, key ID) are stored as
   * blob metadata so they travel with the ciphertext.
   */
  async upload(blobName: string, plaintext: Buffer): Promise<WrappedKeyBundle> {
    const { dek, bundle } = await this.keyManager.generateAndWrapKey();

    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(AES_ALGORITHM, dek, iv, {
      authTagLength: AUTH_TAG_BYTES,
    });

    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Zero out the plaintext DEK – it must not linger in memory.
    dek.fill(0);

    const blockClient = this.containerClient.getBlockBlobClient(blobName);
    await blockClient.upload(encrypted, encrypted.length, {
      metadata: {
        [META.wrappedDek]: bundle.wrappedDek,
        [META.keyId]: bundle.keyId,
        [META.iv]: iv.toString("base64"),
        [META.authTag]: authTag.toString("base64"),
      },
    });

    return bundle;
  }

  /**
   * Download and decrypt a blob that was previously uploaded with `upload`.
   */
  async download(blobName: string): Promise<Buffer> {
    const blockClient = this.containerClient.getBlockBlobClient(blobName);

    let downloadResponse;
    try {
      downloadResponse = await blockClient.download(0);
    } catch (err: unknown) {
      if (isStorageError(err, 404)) {
        throw new Error(`Blob "${blobName}" does not exist`);
      }
      throw err;
    }

    const metadata = downloadResponse.metadata;
    if (!metadata) {
      throw new Error(`Blob "${blobName}" has no metadata – not an encrypted blob`);
    }

    const wrappedDek = metadata[META.wrappedDek.toLowerCase()];
    const keyId = metadata[META.keyId.toLowerCase()];
    const ivB64 = metadata[META.iv.toLowerCase()];
    const authTagB64 = metadata[META.authTag.toLowerCase()];

    if (!wrappedDek || !keyId || !ivB64 || !authTagB64) {
      throw new Error(
        `Blob "${blobName}" is missing required encryption metadata`
      );
    }

    const bundle: WrappedKeyBundle = { wrappedDek, keyId };

    let dek: Buffer;
    try {
      dek = await this.keyManager.unwrapKey(bundle);
    } catch (err: unknown) {
      throw new Error(
        `Failed to unwrap DEK for blob "${blobName}": ${(err as Error).message}`
      );
    }

    const ciphertext = await streamToBuffer(downloadResponse.readableStreamBody!);
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");

    const decipher = crypto.createDecipheriv(AES_ALGORITHM, dek, iv, {
      authTagLength: AUTH_TAG_BYTES,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    // Zero out the DEK.
    dek.fill(0);

    return decrypted;
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

function isStorageError(err: unknown, statusCode: number): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "statusCode" in err &&
    (err as { statusCode: number }).statusCode === statusCode
  );
}
