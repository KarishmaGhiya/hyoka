import { randomBytes } from "node:crypto";
import { KeyClient, CryptographyClient, type KeyWrapAlgorithm } from "@azure/keyvault-keys";
import { DefaultAzureCredential } from "@azure/identity";
import { buildCryptoClient } from "./config";

const WRAP_ALGORITHM: KeyWrapAlgorithm = "RSA-OAEP-256";
const DEK_BYTE_LENGTH = 32; // 256-bit AES key

export interface WrappedKeyBundle {
  /** Full versioned Key Vault key ID used for wrapping */
  vaultKeyId: string;
  /** The DEK encrypted (wrapped) by the vault key */
  wrappedDek: Buffer;
  /** The plaintext DEK – caller must use immediately and discard */
  plaintextDek: Buffer;
}

/**
 * Manages envelope-encryption key operations via Azure Key Vault.
 *
 * - The vault RSA key never leaves Key Vault.
 * - The plaintext DEK is generated locally and never persisted.
 */
export class KeyManager {
  constructor(
    private readonly keyClient: KeyClient,
    private readonly credential: DefaultAzureCredential,
    private readonly keyName: string,
  ) {}

  /**
   * Generate a fresh DEK locally, then wrap it with the vault key.
   * Returns both the plaintext DEK (for immediate use) and the
   * wrapped DEK (for storage alongside the ciphertext).
   */
  async generateAndWrapDek(): Promise<WrappedKeyBundle> {
    const key = await this.keyClient.getKey(this.keyName);
    if (!key.properties.enabled) {
      throw new Error(`Key Vault key "${this.keyName}" is disabled`);
    }

    const keyId = key.id;
    if (!keyId) {
      throw new Error(`Key Vault key "${this.keyName}" has no ID`);
    }

    const cryptoClient = buildCryptoClient(keyId, this.credential);
    const plaintextDek = randomBytes(DEK_BYTE_LENGTH);

    const { result: wrappedDek } = await cryptoClient.wrapKey(
      WRAP_ALGORITHM,
      plaintextDek,
    );

    return {
      vaultKeyId: keyId,
      wrappedDek: Buffer.from(wrappedDek),
      plaintextDek,
    };
  }

  /**
   * Unwrap a previously wrapped DEK using the same vault key version
   * that was used to wrap it.
   */
  async unwrapDek(vaultKeyId: string, wrappedDek: Buffer): Promise<Buffer> {
    const cryptoClient = buildCryptoClient(vaultKeyId, this.credential);

    try {
      const { result } = await cryptoClient.unwrapKey(
        WRAP_ALGORITHM,
        wrappedDek,
      );
      return Buffer.from(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Failed to unwrap DEK with key ${vaultKeyId}: ${message}`,
      );
    }
  }
}
