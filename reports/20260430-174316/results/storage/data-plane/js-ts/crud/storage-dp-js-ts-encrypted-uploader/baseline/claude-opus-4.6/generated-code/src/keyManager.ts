import * as crypto from "crypto";
import { KeyClient, CryptographyClient, KeyWrapAlgorithm } from "@azure/keyvault-keys";
import { DefaultAzureCredential } from "@azure/identity";
import { buildCryptoClient } from "./config";

const WRAP_ALGORITHM: KeyWrapAlgorithm = "RSA-OAEP-256";

export interface WrappedKeyBundle {
  /** The wrapped (encrypted) data encryption key, base64-encoded. */
  wrappedDek: string;
  /** Full Key Vault key ID (includes version) used for wrapping. */
  keyId: string;
}

export class KeyManager {
  private readonly keyClient: KeyClient;
  private readonly keyName: string;
  private readonly vaultUrl: string;
  private readonly credential: DefaultAzureCredential;

  constructor(
    keyClient: KeyClient,
    keyName: string,
    vaultUrl: string,
    credential: DefaultAzureCredential
  ) {
    this.keyClient = keyClient;
    this.keyName = keyName;
    this.vaultUrl = vaultUrl;
    this.credential = credential;
  }

  /**
   * Generate a random 256-bit data encryption key, wrap it with Key Vault,
   * and return both the plaintext DEK (for immediate local use) and the
   * wrapped bundle (for storage alongside the ciphertext).
   *
   * The plaintext DEK must NOT be persisted – callers should discard it
   * after encrypting the data.
   */
  async generateAndWrapKey(): Promise<{ dek: Buffer; bundle: WrappedKeyBundle }> {
    const dek = crypto.randomBytes(32); // AES-256

    const key = await this.keyClient.getKey(this.keyName);
    if (!key.properties.enabled) {
      throw new Error(`Key Vault key "${this.keyName}" is disabled`);
    }

    const keyVersion = key.properties.version;
    if (!keyVersion) {
      throw new Error(`Key Vault key "${this.keyName}" has no version`);
    }

    const cryptoClient = buildCryptoClient(
      this.vaultUrl,
      this.keyName,
      keyVersion,
      this.credential
    );

    const wrapResult = await cryptoClient.wrapKey(WRAP_ALGORITHM, dek);

    return {
      dek,
      bundle: {
        wrappedDek: Buffer.from(wrapResult.result).toString("base64"),
        keyId: key.id!,
      },
    };
  }

  /**
   * Unwrap a previously wrapped DEK using Key Vault.
   * Extracts the key name and version from the stored key ID.
   */
  async unwrapKey(bundle: WrappedKeyBundle): Promise<Buffer> {
    const { keyName, keyVersion } = this.parseKeyId(bundle.keyId);

    // Verify the key is still enabled before attempting unwrap.
    const key = await this.keyClient.getKey(keyName);
    if (!key.properties.enabled) {
      throw new Error(`Key Vault key "${keyName}" is disabled – cannot unwrap DEK`);
    }

    const cryptoClient = buildCryptoClient(
      this.vaultUrl,
      keyName,
      keyVersion,
      this.credential
    );

    const unwrapResult = await cryptoClient.unwrapKey(
      WRAP_ALGORITHM,
      Buffer.from(bundle.wrappedDek, "base64")
    );

    return Buffer.from(unwrapResult.result);
  }

  private parseKeyId(keyId: string): { keyName: string; keyVersion: string } {
    // Key IDs look like: https://vault.vault.azure.net/keys/my-key/abc123
    const parts = keyId.split("/");
    const keysIndex = parts.indexOf("keys");
    if (keysIndex === -1 || keysIndex + 2 >= parts.length) {
      throw new Error(`Malformed Key Vault key ID: ${keyId}`);
    }
    return {
      keyName: parts[keysIndex + 1],
      keyVersion: parts[keysIndex + 2],
    };
  }
}
