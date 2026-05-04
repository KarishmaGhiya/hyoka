import { KeyClient } from "@azure/keyvault-keys";
import * as crypto from "crypto";

/**
 * Key management class that implements envelope encryption using Azure Key Vault.
 * 
 * Envelope encryption flow:
 * 1. Generate a data encryption key (DEK) locally
 * 2. Protect (wrap) the DEK using Key Vault
 * 3. Store the wrapped DEK alongside encrypted data
 * 4. For decryption: unwrap the DEK using Key Vault, then decrypt locally
 * 
 * The raw DEK never leaves memory and is never persisted.
 * Key Vault's key material never leaves the vault.
 */
export class KeyManager {
  private keyClient: KeyClient;
  private keyName: string;

  constructor(keyClient: KeyClient, keyName: string) {
    this.keyClient = keyClient;
    this.keyName = keyName;
  }

  /**
   * Generate a random 256-bit AES data encryption key (DEK).
   * This key is generated locally and kept in memory only.
   */
  generateDataEncryptionKey(): Buffer {
    return crypto.randomBytes(32); // 256 bits for AES-256
  }

  /**
   * Wrap (encrypt) the data encryption key using Key Vault.
   * The DEK is protected by the Key Vault key and can be safely stored.
   * 
   * @param dataKey - The plaintext data encryption key to protect
   * @returns Object containing the wrapped key and the Key Vault key ID used
   */
  async wrapKey(dataKey: Buffer): Promise<{ wrappedKey: Buffer; keyId: string }> {
    try {
      // Get the latest version of the key
      const key = await this.keyClient.getKey(this.keyName);
      
      if (!key.key) {
        throw new Error(`Key '${this.keyName}' not found or has no key material`);
      }

      // Use Key Vault to wrap (encrypt) the data key
      // RSA-OAEP is a secure asymmetric encryption algorithm
      const wrapResult = await this.keyClient.wrapKey(
        this.keyName,
        "RSA-OAEP",
        dataKey
      );

      if (!wrapResult.result) {
        throw new Error("Key wrap operation returned no result");
      }

      return {
        wrappedKey: Buffer.from(wrapResult.result),
        keyId: key.id || key.key.kid || `${this.keyClient.vaultUrl}/keys/${this.keyName}`
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to wrap key: ${error.message}`);
      }
      throw new Error("Failed to wrap key: Unknown error");
    }
  }

  /**
   * Unwrap (decrypt) the data encryption key using Key Vault.
   * Recovers the plaintext DEK so it can be used to decrypt data locally.
   * 
   * @param wrappedKey - The wrapped (encrypted) data encryption key
   * @returns The plaintext data encryption key
   */
  async unwrapKey(wrappedKey: Buffer): Promise<Buffer> {
    try {
      // Use Key Vault to unwrap (decrypt) the data key
      const unwrapResult = await this.keyClient.unwrapKey(
        this.keyName,
        "RSA-OAEP",
        wrappedKey
      );

      if (!unwrapResult.result) {
        throw new Error("Key unwrap operation returned no result");
      }

      return Buffer.from(unwrapResult.result);
    } catch (error) {
      if (error instanceof Error) {
        // Provide helpful error messages for common issues
        if (error.message.includes("not found")) {
          throw new Error(`Key '${this.keyName}' not found in Key Vault`);
        }
        if (error.message.includes("disabled")) {
          throw new Error(`Key '${this.keyName}' is disabled in Key Vault`);
        }
        throw new Error(`Failed to unwrap key: ${error.message}`);
      }
      throw new Error("Failed to unwrap key: Unknown error");
    }
  }

  /**
   * Get the current Key Vault key ID for reference.
   */
  async getKeyId(): Promise<string> {
    try {
      const key = await this.keyClient.getKey(this.keyName);
      return key.id || key.key?.kid || `${this.keyClient.vaultUrl}/keys/${this.keyName}`;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get key ID: ${error.message}`);
      }
      throw new Error("Failed to get key ID: Unknown error");
    }
  }
}
