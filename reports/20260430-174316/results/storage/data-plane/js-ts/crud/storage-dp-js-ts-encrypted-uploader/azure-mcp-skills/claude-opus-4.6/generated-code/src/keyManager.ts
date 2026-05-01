import * as crypto from "node:crypto";
import { KeyClient, CryptographyClient, type KeyVaultKey } from "@azure/keyvault-keys";
import { DefaultAzureCredential } from "@azure/identity";
import { buildCryptoClient } from "./config";

const DEK_BYTE_LENGTH = 32; // AES-256

export interface WrappedKeyBundle {
  /** Full Key Vault key ID including version (used for unwrap). */
  keyId: string;
  /** The DEK encrypted (wrapped) by Key Vault – base-64 encoded. */
  wrappedDek: string;
}

/**
 * Manages envelope encryption via Azure Key Vault Keys.
 *
 * • generateDataKey  – creates a random AES-256 key, wraps it with Key Vault,
 *                      and returns both the plaintext DEK and the wrapped bundle.
 * • unwrapDataKey    – sends the wrapped DEK to Key Vault for unwrapping and
 *                      returns the plaintext DEK.
 *
 * The vault's key material never leaves Key Vault; the raw DEK is only held
 * in-process memory and is never persisted.
 */
export class KeyManager {
  private readonly keyClient: KeyClient;
  private readonly credential: DefaultAzureCredential;
  private readonly vaultUrl: string;
  private readonly keyName: string;

  constructor(
    keyClient: KeyClient,
    credential: DefaultAzureCredential,
    vaultUrl: string,
    keyName: string,
  ) {
    this.keyClient = keyClient;
    this.credential = credential;
    this.vaultUrl = vaultUrl;
    this.keyName = keyName;
  }

  /**
   * Generate a local DEK, wrap it with the latest version of the vault key,
   * and return both the plaintext DEK and the wrapped bundle.
   */
  async generateDataKey(): Promise<{ dek: Buffer; bundle: WrappedKeyBundle }> {
    const dek = crypto.randomBytes(DEK_BYTE_LENGTH);

    // Retrieve the current key (latest version) so we know the exact version.
    const vaultKey: KeyVaultKey = await this.keyClient.getKey(this.keyName);
    if (!vaultKey.properties.enabled) {
      throw new Error(`Key Vault key "${this.keyName}" is disabled.`);
    }

    const version = vaultKey.properties.version!;
    const cryptoClient = buildCryptoClient(
      this.vaultUrl,
      this.keyName,
      version,
      this.credential,
    );

    const wrapResult = await cryptoClient.wrapKey("RSA-OAEP-256", dek);

    return {
      dek,
      bundle: {
        keyId: vaultKey.id!,
        wrappedDek: Buffer.from(wrapResult.result).toString("base64"),
      },
    };
  }

  /**
   * Unwrap a previously wrapped DEK using Key Vault.
   */
  async unwrapDataKey(bundle: WrappedKeyBundle): Promise<Buffer> {
    // Extract version from the full key ID (last path segment).
    const segments = bundle.keyId.split("/");
    const version = segments[segments.length - 1];
    const keyName = segments[segments.length - 2];

    const cryptoClient = buildCryptoClient(
      this.vaultUrl,
      keyName,
      version,
      this.credential,
    );

    const unwrapResult = await cryptoClient.unwrapKey(
      "RSA-OAEP-256",
      Buffer.from(bundle.wrappedDek, "base64"),
    );

    return Buffer.from(unwrapResult.result);
  }
}
