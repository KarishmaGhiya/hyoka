import { KeyClient, CryptographyClient } from "@azure/keyvault-keys";
import type { KeyWrapAlgorithm } from "@azure/keyvault-keys";
import type { TokenCredential } from "@azure/core-auth";
import * as crypto from "crypto";
import { buildCryptographyClient } from "./config";

const WRAP_ALGORITHM: KeyWrapAlgorithm = "RSA-OAEP-256";

/** Material returned after generating and wrapping a data encryption key. */
export interface WrappedKeyMaterial {
  /** The encrypted (wrapped) DEK – safe to persist. */
  wrappedDek: Buffer;
  /** The plaintext DEK – use immediately and discard. */
  plaintextDek: Buffer;
  /** Full Key Vault key ID (with version) used for wrapping. */
  keyId: string;
}

/**
 * Envelope-encryption key manager backed by Azure Key Vault Keys.
 *
 * - Generates a random AES-256 data encryption key (DEK) locally.
 * - Uses Key Vault to wrap (protect) the DEK with an RSA key.
 * - For decryption, asks Key Vault to unwrap the DEK, then decrypts locally.
 * - The raw DEK is never persisted; the vault key material never leaves Key Vault.
 */
export class KeyManager {
  private readonly keyClient: KeyClient;
  private readonly credential: TokenCredential;
  private readonly keyName: string;

  constructor(keyClient: KeyClient, credential: TokenCredential, keyName: string) {
    this.keyClient = keyClient;
    this.credential = credential;
    this.keyName = keyName;
  }

  /**
   * Generate a random 256-bit DEK, wrap it with the Key Vault key, and return both.
   */
  async generateAndWrapKey(): Promise<WrappedKeyMaterial> {
    const plaintextDek = crypto.randomBytes(32); // AES-256

    const key = await this.keyClient.getKey(this.keyName);
    if (!key.id) {
      throw new Error(`Key Vault key "${this.keyName}" has no ID`);
    }

    const cryptoClient = buildCryptographyClient(key.id, this.credential);
    const wrapResult = await cryptoClient.wrapKey(
      WRAP_ALGORITHM,
      plaintextDek
    );

    return {
      wrappedDek: Buffer.from(wrapResult.result),
      plaintextDek,
      keyId: key.id,
    };
  }

  /**
   * Unwrap a previously wrapped DEK using Key Vault.
   *
   * @param wrappedDek  The encrypted DEK (from blob metadata).
   * @param keyId       The full Key Vault key ID that was used to wrap it.
   * @returns           The recovered plaintext DEK.
   */
  async unwrapKey(wrappedDek: Buffer, keyId: string): Promise<Buffer> {
    const cryptoClient = buildCryptographyClient(keyId, this.credential);
    const unwrapResult = await cryptoClient.unwrapKey(
      WRAP_ALGORITHM,
      wrappedDek
    );
    return Buffer.from(unwrapResult.result);
  }
}
