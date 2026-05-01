import { KeyClient, CryptographyClient } from '@azure/keyvault-keys';
import * as crypto from 'crypto';

export interface WrappedKey {
  encryptedKey: string; // Base64 encoded wrapped key
  keyId: string; // Key Vault key ID used for wrapping
}

/**
 * Key management class that implements envelope encryption using Azure Key Vault.
 * 
 * Generates data encryption keys (DEK) locally, uses Key Vault to wrap/unwrap them.
 * The raw DEK is never persisted, and the vault's key material never leaves Key Vault.
 */
export class KeyManagementService {
  private keyClient: KeyClient;
  private keyName: string;

  constructor(keyClient: KeyClient, keyName: string) {
    this.keyClient = keyClient;
    this.keyName = keyName;
  }

  /**
   * Generate a new data encryption key (DEK) locally and wrap it using Key Vault.
   * 
   * @returns Object containing the wrapped key and the plaintext key (for immediate use)
   */
  async generateAndWrapDataKey(): Promise<{ wrappedKey: WrappedKey; plaintextKey: Buffer }> {
    try {
      // Generate a 256-bit (32 bytes) AES key locally
      const plaintextKey = crypto.randomBytes(32);

      // Get the key from Key Vault to obtain the cryptography client
      const key = await this.keyClient.getKey(this.keyName);
      const cryptoClient = new CryptographyClient(key, this.keyClient.vaultUrl);

      // Wrap the data encryption key using the Key Vault key
      const wrapResult = await cryptoClient.wrapKey('RSA-OAEP', plaintextKey);

      if (!wrapResult.result) {
        throw new Error('Key wrapping failed: no result returned');
      }

      const wrappedKey: WrappedKey = {
        encryptedKey: Buffer.from(wrapResult.result).toString('base64'),
        keyId: key.id!,
      };

      return { wrappedKey, plaintextKey };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate and wrap data key: ${error.message}`);
      }
      throw new Error('Failed to generate and wrap data key: Unknown error');
    }
  }

  /**
   * Unwrap a data encryption key using Key Vault.
   * 
   * @param wrappedKey - The wrapped key information
   * @returns The plaintext data encryption key
   */
  async unwrapDataKey(wrappedKey: WrappedKey): Promise<Buffer> {
    try {
      // Get the key from Key Vault
      const key = await this.keyClient.getKey(this.keyName);

      // Verify the key ID matches (security check)
      if (key.id !== wrappedKey.keyId) {
        throw new Error(
          `Key ID mismatch: expected ${wrappedKey.keyId}, got ${key.id}`
        );
      }

      const cryptoClient = new CryptographyClient(key, this.keyClient.vaultUrl);

      // Unwrap the data encryption key
      const encryptedKeyBuffer = Buffer.from(wrappedKey.encryptedKey, 'base64');
      const unwrapResult = await cryptoClient.unwrapKey('RSA-OAEP', encryptedKeyBuffer);

      if (!unwrapResult.result) {
        throw new Error('Key unwrapping failed: no result returned');
      }

      return Buffer.from(unwrapResult.result);
    } catch (error) {
      if (error instanceof Error) {
        // Check for common Key Vault errors
        if (error.message.includes('disabled')) {
          throw new Error('Key Vault key is disabled and cannot be used for decryption');
        }
        if (error.message.includes('not found')) {
          throw new Error('Key Vault key not found');
        }
        throw new Error(`Failed to unwrap data key: ${error.message}`);
      }
      throw new Error('Failed to unwrap data key: Unknown error');
    }
  }

  /**
   * Get the current Key Vault key ID
   */
  async getKeyId(): Promise<string> {
    try {
      const key = await this.keyClient.getKey(this.keyName);
      return key.id!;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get key ID: ${error.message}`);
      }
      throw new Error('Failed to get key ID: Unknown error');
    }
  }
}
