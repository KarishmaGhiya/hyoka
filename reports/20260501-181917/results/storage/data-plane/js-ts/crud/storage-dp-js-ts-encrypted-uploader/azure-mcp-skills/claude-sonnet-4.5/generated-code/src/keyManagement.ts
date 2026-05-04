import { KeyClient, CryptographyClient } from "@azure/keyvault-keys";
import { randomBytes } from "node:crypto";

export interface WrappedKey {
  wrappedKey: Buffer;
  keyId: string;
}

/**
 * Key management class implementing envelope encryption pattern.
 * - Generates data encryption keys (DEK) locally
 * - Uses Key Vault to wrap/unwrap DEKs
 * - Raw DEKs are never persisted, only wrapped versions
 * - Vault key material never leaves Key Vault
 */
export class KeyManagement {
  private keyClient: KeyClient;
  private keyName: string;
  private getCryptoClient: (keyId: string) => CryptographyClient;

  constructor(
    keyClient: KeyClient,
    keyName: string,
    getCryptoClient: (keyId: string) => CryptographyClient
  ) {
    this.keyClient = keyClient;
    this.keyName = keyName;
    this.getCryptoClient = getCryptoClient;
  }

  /**
   * Generates a new data encryption key (DEK) for encrypting data.
   * Returns a 32-byte AES-256 key (never persisted in raw form).
   */
  public generateDataKey(): Buffer {
    return randomBytes(32); // 256-bit AES key
  }

  /**
   * Wraps (encrypts) a data encryption key using Key Vault's key.
   * The wrapped key can be safely stored alongside encrypted data.
   * 
   * @param dataKey - The plaintext data encryption key to wrap
   * @returns Object containing the wrapped key and the Key Vault key ID used
   */
  public async wrapDataKey(dataKey: Buffer): Promise<WrappedKey> {
    try {
      // Get the latest version of the key
      const key = await this.keyClient.getKey(this.keyName);
      
      if (!key.id) {
        throw new Error("Key ID is undefined");
      }

      // Create cryptography client for this key
      const cryptoClient = this.getCryptoClient(key.id);

      // Wrap the data key using RSA-OAEP
      const wrapResult = await cryptoClient.wrapKey("RSA-OAEP", dataKey);

      return {
        wrappedKey: Buffer.from(wrapResult.result),
        keyId: key.id,
      };
    } catch (error: any) {
      if (error?.statusCode === 404) {
        throw new Error(`Key '${this.keyName}' not found in Key Vault. Please create it first.`);
      } else if (error?.statusCode === 403) {
        throw new Error(`Access denied to key '${this.keyName}'. Check RBAC permissions (requires 'Key Vault Crypto User' role).`);
      } else if (error?.code === "KeyDisabled") {
        throw new Error(`Key '${this.keyName}' is disabled in Key Vault.`);
      }
      throw new Error(`Failed to wrap data key: ${error?.message || error}`);
    }
  }

  /**
   * Unwraps (decrypts) a data encryption key using Key Vault's key.
   * Returns the plaintext DEK for decrypting data.
   * 
   * @param wrappedKey - The wrapped (encrypted) data key
   * @param keyId - The Key Vault key ID used to wrap the key
   * @returns The plaintext data encryption key
   */
  public async unwrapDataKey(wrappedKey: Buffer, keyId: string): Promise<Buffer> {
    try {
      // Create cryptography client using the specific key ID/version
      const cryptoClient = this.getCryptoClient(keyId);

      // Unwrap the data key
      const unwrapResult = await cryptoClient.unwrapKey("RSA-OAEP", wrappedKey);

      return Buffer.from(unwrapResult.result);
    } catch (error: any) {
      if (error?.statusCode === 404) {
        throw new Error(`Key with ID '${keyId}' not found. It may have been deleted or rotated.`);
      } else if (error?.statusCode === 403) {
        throw new Error(`Access denied to key. Check RBAC permissions.`);
      } else if (error?.code === "KeyDisabled") {
        throw new Error(`Key is disabled in Key Vault.`);
      }
      throw new Error(`Failed to unwrap data key: ${error?.message || error}`);
    }
  }

  /**
   * Ensures the encryption key exists in Key Vault.
   * Creates an RSA-2048 key if it doesn't exist.
   */
  public async ensureKeyExists(): Promise<void> {
    try {
      await this.keyClient.getKey(this.keyName);
    } catch (error: any) {
      if (error?.statusCode === 404) {
        console.log(`Key '${this.keyName}' not found, creating it...`);
        await this.keyClient.createRsaKey(this.keyName, {
          keySize: 2048,
          keyOps: ["wrapKey", "unwrapKey"],
        });
        console.log(`Key '${this.keyName}' created successfully.`);
      } else {
        throw error;
      }
    }
  }
}
