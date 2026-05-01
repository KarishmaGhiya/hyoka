import { createCipheriv, createDecipheriv } from "node:crypto";
import { randomBytes } from "node:crypto";
import { BlobServiceClient } from "@azure/storage-blob";
import { KeyManager } from "./keyManager";

const AES_ALGORITHM = "aes-256-gcm";
const IV_BYTE_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_BYTE_LENGTH = 16;

// Metadata keys stored on the blob
const META_VAULT_KEY_ID = "vaultkeyid";
const META_WRAPPED_DEK = "wrappeddek";
const META_IV = "iv";
const META_AUTH_TAG = "authtag";

/**
 * Handles client-side AES-GCM encryption/decryption and
 * Azure Blob Storage upload/download.
 *
 * Cryptographic parameters (IV, auth tag, wrapped DEK, vault key ID)
 * are persisted as blob metadata so decryption is self-describing.
 */
export class EncryptedBlobClient {
  constructor(
    private readonly blobServiceClient: BlobServiceClient,
    private readonly containerName: string,
    private readonly keyManager: KeyManager,
  ) {}

  /**
   * Encrypt `plaintext` with a fresh DEK, wrap the DEK via Key Vault,
   * then upload the ciphertext to Blob Storage.
   */
  async upload(blobName: string, plaintext: Buffer): Promise<{ vaultKeyId: string; wrappedDekBase64: string }> {
    const container = this.blobServiceClient.getContainerClient(this.containerName);
    await container.createIfNotExists();

    const { vaultKeyId, wrappedDek, plaintextDek } = await this.keyManager.generateAndWrapDek();

    const iv = randomBytes(IV_BYTE_LENGTH);
    const cipher = createCipheriv(AES_ALGORITHM, plaintextDek, iv, {
      authTagLength: AUTH_TAG_BYTE_LENGTH,
    });

    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Zero out the plaintext DEK in memory
    plaintextDek.fill(0);

    const wrappedDekBase64 = wrappedDek.toString("base64");

    const blockBlob = container.getBlockBlobClient(blobName);
    await blockBlob.upload(ciphertext, ciphertext.length, {
      metadata: {
        [META_VAULT_KEY_ID]: vaultKeyId,
        [META_WRAPPED_DEK]: wrappedDekBase64,
        [META_IV]: iv.toString("base64"),
        [META_AUTH_TAG]: authTag.toString("base64"),
      },
    });

    return { vaultKeyId, wrappedDekBase64 };
  }

  /**
   * Download a blob, unwrap its DEK via Key Vault, and decrypt.
   */
  async download(blobName: string): Promise<Buffer> {
    const container = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlob = container.getBlockBlobClient(blobName);

    let downloadResponse;
    try {
      downloadResponse = await blockBlob.download(0);
    } catch (err: unknown) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404) {
        throw new Error(`Blob "${blobName}" does not exist in container "${this.containerName}"`);
      }
      throw err;
    }

    const properties = await blockBlob.getProperties();
    const metadata = properties.metadata ?? {};

    const vaultKeyId = metadata[META_VAULT_KEY_ID];
    const wrappedDekB64 = metadata[META_WRAPPED_DEK];
    const ivB64 = metadata[META_IV];
    const authTagB64 = metadata[META_AUTH_TAG];

    if (!vaultKeyId || !wrappedDekB64 || !ivB64 || !authTagB64) {
      throw new Error(
        `Blob "${blobName}" is missing required encryption metadata`,
      );
    }

    const wrappedDek = Buffer.from(wrappedDekB64, "base64");
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");

    const plaintextDek = await this.keyManager.unwrapDek(vaultKeyId, wrappedDek);

    const ciphertext = await streamToBuffer(downloadResponse.readableStreamBody!);

    const decipher = createDecipheriv(AES_ALGORITHM, plaintextDek, iv, {
      authTagLength: AUTH_TAG_BYTE_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    // Zero out the plaintext DEK in memory
    plaintextDek.fill(0);

    return plaintext;
  }
}

async function streamToBuffer(readable: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
