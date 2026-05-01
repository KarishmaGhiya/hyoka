import * as crypto from "crypto";
import { KeyClient, CryptographyClient, KeyWrapAlgorithm } from "@azure/keyvault-keys";
import { AzureConfig, buildCryptographyClient } from "./config";

const WRAP_ALGORITHM: KeyWrapAlgorithm = "RSA-OAEP-256";
const DEK_BYTE_LENGTH = 32; // 256-bit AES key

export interface WrappedKeyBundle {
  /** Full Key Vault key identifier (includes version) */
  keyId: string;
  /** The wrapped (encrypted) data encryption key */
  wrappedDek: Buffer;
}

export interface UnwrappedKeyResult {
  /** The plaintext data encryption key – use immediately and discard */
  dek: Buffer;
}

/**
 * Manages envelope encryption using Azure Key Vault Keys.
 *
 * The vault's key material never leaves Key Vault. A random data encryption
 * key (DEK) is generated locally, wrapped (encrypted) by Key Vault for
 * storage, and unwrapped (decrypted) by Key Vault when needed. The plaintext
 * DEK is never persisted.
 */
export class KeyManager {
  private readonly keyClient: KeyClient;
  private readonly config: AzureConfig;
  private readonly keyName: string;

  constructor(config: AzureConfig) {
    this.keyClient = config.keyClient;
    this.config = config;
    this.keyName = config.keyVaultKeyName;
  }

  /**
   * Generate a random DEK, then wrap it with the Key Vault key.
   * Returns both the plaintext DEK (for immediate use) and the wrapped DEK
   * (for safe storage alongside the ciphertext).
   */
  async generateAndWrapKey(): Promise<{ dek: Buffer; bundle: WrappedKeyBundle }> {
    const dek = crypto.randomBytes(DEK_BYTE_LENGTH);

    const key = await this.keyClient.getKey(this.keyName);
    if (!key.id) {
      throw new Error(`Key Vault key "${this.keyName}" has no ID`);
    }

    const cryptoClient = buildCryptographyClient(this.config, key.id);
    const wrapResult = await cryptoClient.wrapKey(WRAP_ALGORITHM, dek);

    return {
      dek,
      bundle: {
        keyId: key.id,
        wrappedDek: Buffer.from(wrapResult.result),
      },
    };
  }

  /**
   * Unwrap (decrypt) a previously wrapped DEK using Key Vault.
   * The key version is encoded in the bundle's keyId so we always use
   * the same key version that performed the wrap.
   */
  async unwrapKey(bundle: WrappedKeyBundle): Promise<UnwrappedKeyResult> {
    const cryptoClient = buildCryptographyClient(this.config, bundle.keyId);

    try {
      const unwrapResult = await cryptoClient.unwrapKey(WRAP_ALGORITHM, bundle.wrappedDek);
      return { dek: Buffer.from(unwrapResult.result) };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Failed to unwrap DEK with key "${bundle.keyId}". ` +
        `The key may have been disabled or deleted. Original error: ${message}`,
      );
    }
  }
}
