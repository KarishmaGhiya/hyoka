import { KeyClient, CryptographyClient, KeyVaultKey } from "@azure/keyvault-keys";
import { randomBytes } from "crypto";

export interface WrappedKey {
  wrappedKey: string; // Base64-encoded wrapped key
  keyId: string; // Key Vault key ID used for wrapping
  algorithm: string; // Wrapping algorithm
}

export class KeyManagementService {
  private readonly keyClient: KeyClient;
  private readonly keyName: string;

  constructor(keyClient: KeyClient, keyName: string) {
    this.keyClient = keyClient;
    this.keyName = keyName;
  }

  /**
   * Generate a random data encryption key (DEK) locally.
   * Returns a 256-bit (32-byte) key for AES-256-GCM.
   */
  generateDataEncryptionKey(): Buffer {
    return randomBytes(32);
  }

  /**
   * Wrap (encrypt) the data encryption key using Azure Key Vault.
   * The DEK is encrypted with the Key Vault key and never stored in plaintext.
   */
  async wrapDataKey(dataKey: Buffer): Promise<WrappedKey> {
    try {
      // Get the key from Key Vault
      const key: KeyVaultKey = await this.keyClient.getKey(this.keyName);
      
      if (!key.id) {
        throw new Error("Key ID is undefined");
      }

      // Create a CryptographyClient for cryptographic operations
      const cryptoClient = new CryptographyClient(key.id, this.keyClient["credential"]);

      // Wrap the data key using RSA-OAEP algorithm
      const wrapResult = await cryptoClient.wrapKey("RSA-OAEP", dataKey);

      return {
        wrappedKey: Buffer.from(wrapResult.result).toString("base64"),
        keyId: key.id,
        algorithm: wrapResult.algorithm,
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error(`Key Vault key '${this.keyName}' not found. Please create it first.`);
      } else if (error.statusCode === 403) {
        throw new Error(`Access denied to Key Vault key '${this.keyName}'. Check permissions.`);
      } else if (error.code === "KeyNotFound") {
        throw new Error(`Key '${this.keyName}' does not exist in Key Vault.`);
      }
      throw new Error(`Failed to wrap data key: ${error.message}`);
    }
  }

  /**
   * Unwrap (decrypt) the data encryption key using Azure Key Vault.
   * Returns the plaintext DEK which should be used immediately and never persisted.
   */
  async unwrapDataKey(wrappedKey: WrappedKey): Promise<Buffer> {
    try {
      // Create a CryptographyClient using the key ID from metadata
      const cryptoClient = new CryptographyClient(
        wrappedKey.keyId,
        this.keyClient["credential"]
      );

      // Unwrap the data key
      const unwrapResult = await cryptoClient.unwrapKey(
        wrappedKey.algorithm as any,
        Buffer.from(wrappedKey.wrappedKey, "base64")
      );

      return Buffer.from(unwrapResult.result);
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error("Access denied when unwrapping key. The key may have been disabled or permissions revoked.");
      } else if (error.statusCode === 404) {
        throw new Error("Key Vault key not found. The key may have been deleted.");
      }
      throw new Error(`Failed to unwrap data key: ${error.message}`);
    }
  }

  /**
   * Get the Key Vault key ID for reference.
   */
  async getKeyId(): Promise<string> {
    try {
      const key = await this.keyClient.getKey(this.keyName);
      if (!key.id) {
        throw new Error("Key ID is undefined");
      }
      return key.id;
    } catch (error: any) {
      throw new Error(`Failed to get key ID: ${error.message}`);
    }
  }
}
