import * as crypto from "crypto";
import { ContainerClient } from "@azure/storage-blob";
import { KeyManager, WrappedKeyBundle } from "./keyManager";

const AES_ALGORITHM = "aes-256-gcm";
const IV_BYTE_LENGTH = 12; // NIST-recommended for GCM
const AUTH_TAG_BYTE_LENGTH = 16;

/**
 * Metadata keys stored on the blob alongside the ciphertext.
 */
const META = {
  VAULT_KEY_ID: "enc_vaultKeyId",
  WRAPPED_DEK: "enc_wrappedDek",
  IV: "enc_iv",
  AUTH_TAG: "enc_authTag",
} as const;

/**
 * Encrypts data locally with AES-256-GCM, wraps the DEK via Key Vault, and
 * uploads to Azure Blob Storage. Downloads perform the reverse.
 */
export class EncryptedBlobClient {
  constructor(
    private readonly containerClient: ContainerClient,
    private readonly keyManager: KeyManager,
    private readonly vaultKeyName: string
  ) {}

  /**
   * Encrypt `plaintext` and upload the ciphertext to the given blob.
   *
   * @returns metadata that was persisted (useful for logging / verification).
   */
  async upload(
    blobName: string,
    plaintext: Buffer
  ): Promise<{ vaultKeyId: string; wrappedDekBase64: string }> {
    // 1. Generate envelope key material
    const { plaintextDek, bundle } =
      await this.keyManager.generateDataKey(this.vaultKeyName);

    try {
      // 2. Encrypt locally with AES-256-GCM
      const iv = crypto.randomBytes(IV_BYTE_LENGTH);
      const cipher = crypto.createCipheriv(AES_ALGORITHM, plaintextDek, iv, {
        authTagLength: AUTH_TAG_BYTE_LENGTH,
      });
      const ciphertext = Buffer.concat([
        cipher.update(plaintext),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag();

      // 3. Upload ciphertext + metadata
      const wrappedDekBase64 = bundle.wrappedDek.toString("base64");
      const metadata: Record<string, string> = {
        [META.VAULT_KEY_ID]: bundle.vaultKeyId,
        [META.WRAPPED_DEK]: wrappedDekBase64,
        [META.IV]: iv.toString("base64"),
        [META.AUTH_TAG]: authTag.toString("base64"),
      };

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(ciphertext, ciphertext.length, { metadata });

      return { vaultKeyId: bundle.vaultKeyId, wrappedDekBase64 };
    } finally {
      // Zero the plaintext DEK so it never lingers in memory.
      plaintextDek.fill(0);
    }
  }

  /**
   * Download a blob, unwrap its DEK via Key Vault, and decrypt.
   */
  async download(blobName: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    // 1. Download blob + properties
    let downloadResponse;
    try {
      downloadResponse = await blockBlobClient.download(0);
    } catch (err: unknown) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404) {
        throw new Error(`Blob "${blobName}" does not exist in container "${this.containerClient.containerName}".`);
      }
      throw err;
    }

    const ciphertext = await streamToBuffer(downloadResponse.readableStreamBody!);

    // 2. Read cryptographic metadata
    const meta = downloadResponse.metadata ?? {};
    const vaultKeyId = meta[META.VAULT_KEY_ID];
    const wrappedDekB64 = meta[META.WRAPPED_DEK];
    const ivB64 = meta[META.IV];
    const authTagB64 = meta[META.AUTH_TAG];

    if (!vaultKeyId || !wrappedDekB64 || !ivB64 || !authTagB64) {
      throw new Error(
        `Blob "${blobName}" is missing required encryption metadata. ` +
          "It may not have been encrypted by this tool."
      );
    }

    const bundle: WrappedKeyBundle = {
      vaultKeyId,
      wrappedDek: Buffer.from(wrappedDekB64, "base64"),
    };
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");

    // 3. Unwrap DEK via Key Vault
    let plaintextDek: Buffer;
    try {
      plaintextDek = await this.keyManager.unwrapDataKey(bundle);
    } catch (err: unknown) {
      const message = (err as Error).message ?? "";
      if (/disabled|not enabled/i.test(message)) {
        throw new Error(
          `The Key Vault key used to wrap this blob's DEK is disabled. ` +
            `Key ID: ${vaultKeyId}`
        );
      }
      throw err;
    }

    // 4. Decrypt locally
    try {
      const decipher = crypto.createDecipheriv(AES_ALGORITHM, plaintextDek, iv, {
        authTagLength: AUTH_TAG_BYTE_LENGTH,
      });
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } finally {
      plaintextDek.fill(0);
    }
  }
}

/** Read a Node.js readable stream into a Buffer. */
async function streamToBuffer(
  stream: NodeJS.ReadableStream
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
