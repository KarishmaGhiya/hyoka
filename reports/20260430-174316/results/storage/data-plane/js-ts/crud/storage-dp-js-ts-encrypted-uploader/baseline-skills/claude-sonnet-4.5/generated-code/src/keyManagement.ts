import { KeyClient, CryptographyClient } from '@azure/keyvault-keys';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface WrappedKey {
  wrappedDEK: string; // Base64-encoded wrapped data encryption key
  keyId: string; // The Key Vault key ID used for wrapping
}

export interface EncryptedData {
  ciphertext: Buffer;
  iv: string; // Base64-encoded initialization vector
  authTag: string; // Base64-encoded authentication tag
  wrappedKey: WrappedKey;
}

/**
 * Key management class that interacts with Azure Key Vault's Keys service.
 * Implements envelope encryption: generates a data encryption key locally,
 * uses Key Vault to protect (wrap) it, and provides methods to unwrap it.
 * The raw data key is never persisted, and vault key material never leaves Key Vault.
 */
export class KeyManagement {
  private readonly keyClient: KeyClient;
  private readonly keyName: string;
  private readonly algorithm = 'aes-256-gcm';
  private readonly dekSize = 32; // 256 bits for AES-256

  constructor(keyClient: KeyClient, keyName: string) {
    this.keyClient = keyClient;
    this.keyName = keyName;
  }

  /**
   * Generates a random data encryption key (DEK) for local encryption.
   * The DEK is never persisted in plaintext.
   */
  private generateDataKey(): Buffer {
    return randomBytes(this.dekSize);
  }

  /**
   * Wraps (encrypts) the data encryption key using Azure Key Vault.
   * The vault's key material never leaves Key Vault.
   */
  private async wrapDataKey(dek: Buffer): Promise<WrappedKey> {
    try {
      const key = await this.keyClient.getKey(this.keyName);
      const keyId = key.properties.id || key.id || this.keyName;
      
      // Create a CryptographyClient for the specific key
      const cryptoClient = new CryptographyClient(key, this.keyClient['credential']);
      
      const wrapResult = await cryptoClient.wrapKey('RSA-OAEP-256', dek);

      return {
        wrappedDEK: Buffer.from(wrapResult.result).toString('base64'),
        keyId: keyId,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to wrap data key: ${error.message}`);
      }
      throw new Error('Failed to wrap data key: Unknown error');
    }
  }

  /**
   * Unwraps (decrypts) the data encryption key using Azure Key Vault.
   */
  private async unwrapDataKey(wrappedKey: WrappedKey): Promise<Buffer> {
    try {
      const key = await this.keyClient.getKey(this.keyName);
      
      // Create a CryptographyClient for the specific key
      const cryptoClient = new CryptographyClient(key, this.keyClient['credential']);
      
      const unwrapResult = await cryptoClient.unwrapKey(
        'RSA-OAEP-256',
        Buffer.from(wrappedKey.wrappedDEK, 'base64')
      );

      return Buffer.from(unwrapResult.result);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to unwrap data key: ${error.message}`);
      }
      throw new Error('Failed to unwrap data key: Unknown error');
    }
  }

  /**
   * Encrypts data using AES-GCM with a freshly generated DEK.
   * Returns the ciphertext, IV, auth tag, and the wrapped DEK.
   */
  async encryptData(plaintext: Buffer): Promise<EncryptedData> {
    // Generate a new data encryption key
    const dek = this.generateDataKey();

    try {
      // Generate a random IV for AES-GCM
      const iv = randomBytes(12); // 96 bits is recommended for GCM

      // Encrypt the data with the DEK
      const cipher = createCipheriv(this.algorithm, dek, iv);
      const ciphertext = Buffer.concat([
        cipher.update(plaintext),
        cipher.final(),
      ]);

      // Get the authentication tag (separate in Node.js)
      const authTag = cipher.getAuthTag();

      // Wrap the DEK with Key Vault
      const wrappedKey = await this.wrapDataKey(dek);

      return {
        ciphertext,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        wrappedKey,
      };
    } finally {
      // Clear the DEK from memory (best effort)
      dek.fill(0);
    }
  }

  /**
   * Decrypts data using AES-GCM with the DEK recovered from Key Vault.
   * The wrapped key is unwrapped by Key Vault, then used to decrypt locally.
   */
  async decryptData(encryptedData: EncryptedData): Promise<Buffer> {
    // Unwrap the DEK using Key Vault
    const dek = await this.unwrapDataKey(encryptedData.wrappedKey);

    try {
      // Decrypt the data with the recovered DEK
      const decipher = createDecipheriv(
        this.algorithm,
        dek,
        Buffer.from(encryptedData.iv, 'base64')
      );

      // Set the authentication tag
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));

      const plaintext = Buffer.concat([
        decipher.update(encryptedData.ciphertext),
        decipher.final(),
      ]);

      return plaintext;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to decrypt data: ${error.message}`);
      }
      throw new Error('Failed to decrypt data: Unknown error');
    } finally {
      // Clear the DEK from memory (best effort)
      dek.fill(0);
    }
  }

  /**
   * Returns the Key Vault key ID being used for wrapping operations.
   */
  async getKeyId(): Promise<string> {
    try {
      const key = await this.keyClient.getKey(this.keyName);
      return key.properties.id || key.id || this.keyName;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get key ID: ${error.message}`);
      }
      throw new Error('Failed to get key ID: Unknown error');
    }
  }
}
