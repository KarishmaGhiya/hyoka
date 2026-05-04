import * as crypto from "crypto";
import { CryptographyClient, KeyClient, KeyWrapAlgorithm } from "@azure/keyvault-keys";
import { TokenCredential } from "@azure/identity";

const WRAP_ALGORITHM: KeyWrapAlgorithm = "RSA-OAEP-256";
const DEK_BYTE_LENGTH = 32; // AES-256

export interface WrappedKeyBundle {
  /** The Key Vault key identifier (with version) used to wrap the DEK. */
  vaultKeyId: string;
  /** The wrapped (encrypted) data encryption key. */
  wrappedDek: Buffer;
}

export interface DataKeyMaterial {
  /** Plain-text data encryption key — must be zeroed after use. */
  plaintextDek: Buffer;
  /** The wrapped bundle to persist alongside the ciphertext. */
  bundle: WrappedKeyBundle;
}

/**
 * Manages envelope-encryption key material via Azure Key Vault.
 *
 * - The raw DEK is generated locally and never persisted.
 * - Key Vault wraps/unwraps the DEK; vault key material never leaves the HSM.
 */
export class KeyManager {
  constructor(
    private readonly keyClient: KeyClient,
    private readonly credential: TokenCredential
  ) {}

  /**
   * Generate a local AES-256 DEK, then wrap it with the named Key Vault key.
   */
  async generateDataKey(vaultKeyName: string): Promise<DataKeyMaterial> {
    const plaintextDek = crypto.randomBytes(DEK_BYTE_LENGTH);

    const key = await this.keyClient.getKey(vaultKeyName);
    if (!key.id) {
      throw new Error(`Key "${vaultKeyName}" has no ID`);
    }

    const cryptoClient = new CryptographyClient(key.id, this.credential);
    const wrapResult = await cryptoClient.wrapKey(WRAP_ALGORITHM, plaintextDek);

    return {
      plaintextDek,
      bundle: {
        vaultKeyId: key.id,
        wrappedDek: Buffer.from(wrapResult.result),
      },
    };
  }

  /**
   * Unwrap a previously-wrapped DEK using the vault key that originally wrapped it.
   */
  async unwrapDataKey(bundle: WrappedKeyBundle): Promise<Buffer> {
    const cryptoClient = new CryptographyClient(bundle.vaultKeyId, this.credential);
    const unwrapResult = await cryptoClient.unwrapKey(WRAP_ALGORITHM, bundle.wrappedDek);
    return Buffer.from(unwrapResult.result);
  }
}
