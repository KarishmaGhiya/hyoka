import { KeyClient } from '@azure/keyvault-keys';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Key management class that implements envelope encryption using Azure Key Vault.
 * 
 * Envelope encryption workflow:
 * 1. Generate a random data encryption key (DEK) locally
 * 2. Use Key Vault to wrap (encrypt) the DEK with a key encryption key (KEK)
 * 3. Encrypt data locally with the DEK using AES-256-GCM
 * 4. Store the wrapped DEK alongside the encrypted data
 * 5. For decryption: unwrap the DEK using Key Vault, then decrypt locally
 * 
 * Security properties:
 * - Raw DEK is never persisted
 * - KEK material never leaves Key Vault
 * - AES-GCM provides authenticated encryption
 */
export class KeyManager {
  private keyClient: KeyClient;
  private keyName: string;

  constructor(keyClient: KeyClient, keyName: string) {
    this.keyClient = keyClient;
    this.keyName = keyName;
  }

  /**
   * Generate a random 256-bit data encryption key
   */
  private generateDataKey(): Buffer {
    return randomBytes(32); // 256 bits
  }

  /**
   * Wrap (encrypt) a data encryption key using Key Vault
   * @param dataKey The plaintext data key to wrap
   * @returns Base64-encoded wrapped key
   */
  async wrapDataKey(dataKey: Buffer): Promise<{ wrappedKey: string; keyId: string }> {
    try {
      const key = await this.keyClient.getKey(this.keyName);
      if (!key.id) {
        throw new Error('Key ID not found in Key Vault response');
      }

      const cryptoClient = this.keyClient.getCryptographyClient(key.name, { keyVersion: key.properties.version });
      const wrapResult = await cryptoClient.wrapKey('RSA-OAEP', dataKey);
      
      return {
        wrappedKey: Buffer.from(wrapResult.result).toString('base64'),
        keyId: key.id
      };
    } catch (error) {
      throw new Error(`Failed to wrap data key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Unwrap (decrypt) a data encryption key using Key Vault
   * @param wrappedKey Base64-encoded wrapped key
   * @returns The plaintext data key
   */
  async unwrapDataKey(wrappedKey: string): Promise<Buffer> {
    try {
      const key = await this.keyClient.getKey(this.keyName);
      const cryptoClient = this.keyClient.getCryptographyClient(key.name, { keyVersion: key.properties.version });
      
      const wrappedKeyBuffer = Buffer.from(wrappedKey, 'base64');
      const unwrapResult = await cryptoClient.unwrapKey('RSA-OAEP', wrappedKeyBuffer);
      
      return Buffer.from(unwrapResult.result);
    } catch (error) {
      throw new Error(`Failed to unwrap data key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Encrypt data using AES-256-GCM with a freshly generated data key
   * @param plaintext Data to encrypt
   * @returns Encrypted data with metadata needed for decryption
   */
  async encryptData(plaintext: Buffer): Promise<{
    ciphertext: Buffer;
    wrappedKey: string;
    keyId: string;
    iv: string;
    authTag: string;
  }> {
    // Generate a fresh data encryption key
    const dataKey = this.generateDataKey();
    
    // Wrap the DEK using Key Vault
    const { wrappedKey, keyId } = await this.wrapDataKey(dataKey);
    
    // Generate a random IV (12 bytes is recommended for GCM)
    const iv = randomBytes(12);
    
    // Encrypt the data using AES-256-GCM
    const cipher = createCipheriv('aes-256-gcm', dataKey, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext),
      cipher.final()
    ]);
    
    // Get the authentication tag (16 bytes)
    const authTag = cipher.getAuthTag();
    
    // Clear the plaintext DEK from memory (best effort)
    dataKey.fill(0);
    
    return {
      ciphertext,
      wrappedKey,
      keyId,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  }

  /**
   * Decrypt data using AES-256-GCM with a Key Vault-unwrapped data key
   * @param ciphertext Encrypted data
   * @param wrappedKey Base64-encoded wrapped data key
   * @param iv Base64-encoded initialization vector
   * @param authTag Base64-encoded authentication tag
   * @returns Decrypted plaintext
   */
  async decryptData(
    ciphertext: Buffer,
    wrappedKey: string,
    iv: string,
    authTag: string
  ): Promise<Buffer> {
    // Unwrap the DEK using Key Vault
    const dataKey = await this.unwrapDataKey(wrappedKey);
    
    try {
      // Decrypt the data using AES-256-GCM
      const decipher = createDecipheriv(
        'aes-256-gcm',
        dataKey,
        Buffer.from(iv, 'base64')
      );
      
      // Set the authentication tag
      decipher.setAuthTag(Buffer.from(authTag, 'base64'));
      
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]);
      
      return plaintext;
    } finally {
      // Clear the plaintext DEK from memory (best effort)
      dataKey.fill(0);
    }
  }
}
