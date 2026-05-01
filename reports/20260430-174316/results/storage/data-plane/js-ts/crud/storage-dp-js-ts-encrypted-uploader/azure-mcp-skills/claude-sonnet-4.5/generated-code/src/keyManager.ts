import { KeyClient, CryptographyClient } from '@azure/keyvault-keys';
import { DefaultAzureCredential } from '@azure/identity';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface WrappedKey {
  wrappedKey: string; // Base64-encoded wrapped DEK
  keyId: string; // Key Vault key ID used for wrapping
}

export interface EncryptedData {
  ciphertext: Buffer;
  iv: string; // Base64-encoded initialization vector
  authTag: string; // Base64-encoded authentication tag
  wrappedKey: WrappedKey;
}

/**
 * Key management class that implements envelope encryption using Azure Key Vault.
 * 
 * Envelope encryption pattern:
 * 1. Generate a Data Encryption Key (DEK) locally for each encryption operation
 * 2. Use Key Vault to wrap (encrypt) the DEK with the Key Encryption Key (KEK)
 * 3. Encrypt data locally with the DEK using AES-256-GCM
 * 4. Store the wrapped DEK alongside the encrypted data
 * 5. For decryption, unwrap the DEK using Key Vault, then decrypt locally
 * 
 * Security guarantees:
 * - Raw DEK never persisted to disk or sent over the network
 * - KEK material never leaves Key Vault
 * - AES-GCM provides authenticated encryption
 */
export class KeyManager {
  private readonly AES_KEY_SIZE = 32; // 256 bits
  private readonly IV_SIZE = 12; // 96 bits for GCM
  private readonly ALGORITHM = 'aes-256-gcm';
  private cryptoClient: CryptographyClient | null = null;

  constructor(
    private readonly keyClient: KeyClient,
    private readonly keyName: string,
    private readonly credential: DefaultAzureCredential,
    private readonly keyVaultUrl: string
  ) {}

  /**
   * Get or create CryptographyClient for the key.
   */
  private async getCryptoClient(): Promise<CryptographyClient> {
    if (!this.cryptoClient) {
      const key = await this.keyClient.getKey(this.keyName);
      if (!key.id) {
        throw new Error('Key ID not found');
      }
      this.cryptoClient = new CryptographyClient(key.id, this.credential);
    }
    return this.cryptoClient;
  }

  /**
   * Encrypt data using envelope encryption.
   * 
   * @param plaintext - Data to encrypt
   * @returns Encrypted data with wrapped DEK and cryptographic parameters
   */
  async encryptData(plaintext: Buffer): Promise<EncryptedData> {
    // Step 1: Generate a random Data Encryption Key (DEK)
    const dek = randomBytes(this.AES_KEY_SIZE);

    // Step 2: Generate random initialization vector
    const iv = randomBytes(this.IV_SIZE);

    try {
      // Step 3: Encrypt the plaintext locally using AES-256-GCM
      const cipher = createCipheriv(this.ALGORITHM, dek, iv);
      const ciphertext = Buffer.concat([
        cipher.update(plaintext),
        cipher.final()
      ]);

      // Get the authentication tag (separate from ciphertext in Node.js)
      const authTag = cipher.getAuthTag();

      // Step 4: Wrap (encrypt) the DEK using Key Vault's KEK
      const wrappedKey = await this.wrapKey(dek);

      // Zero out the DEK from memory (best effort)
      dek.fill(0);

      return {
        ciphertext,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        wrappedKey
      };
    } catch (error) {
      // Ensure DEK is cleared even on error
      dek.fill(0);
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decrypt data using envelope encryption.
   * 
   * @param encryptedData - Encrypted data with wrapped DEK
   * @returns Decrypted plaintext
   */
  async decryptData(encryptedData: EncryptedData): Promise<Buffer> {
    let dek: Buffer | null = null;

    try {
      // Step 1: Unwrap (decrypt) the DEK using Key Vault
      dek = await this.unwrapKey(encryptedData.wrappedKey);

      // Step 2: Decrypt the ciphertext locally using the unwrapped DEK
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');

      const decipher = createDecipheriv(this.ALGORITHM, dek, iv);
      decipher.setAuthTag(authTag);

      const plaintext = Buffer.concat([
        decipher.update(encryptedData.ciphertext),
        decipher.final()
      ]);

      // Zero out the DEK from memory
      dek.fill(0);

      return plaintext;
    } catch (error) {
      // Ensure DEK is cleared even on error
      if (dek) {
        dek.fill(0);
      }
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Wrap (encrypt) a data encryption key using Key Vault.
   * 
   * @param dek - Data encryption key to wrap
   * @returns Wrapped key with key ID
   */
  private async wrapKey(dek: Buffer): Promise<WrappedKey> {
    try {
      const cryptoClient = await this.getCryptoClient();
      const result = await cryptoClient.wrapKey('RSA-OAEP-256', dek);

      if (!result.result) {
        throw new Error('Key wrapping returned no result');
      }

      return {
        wrappedKey: Buffer.from(result.result).toString('base64'),
        keyId: result.keyID || ''
      };
    } catch (error) {
      throw new Error(`Key wrapping failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Unwrap (decrypt) a data encryption key using Key Vault.
   * 
   * @param wrappedKey - Wrapped key to unwrap
   * @returns Unwrapped data encryption key
   */
  private async unwrapKey(wrappedKey: WrappedKey): Promise<Buffer> {
    try {
      const wrappedKeyBytes = Buffer.from(wrappedKey.wrappedKey, 'base64');
      const cryptoClient = await this.getCryptoClient();
      
      const result = await cryptoClient.unwrapKey('RSA-OAEP-256', wrappedKeyBytes);

      if (!result.result) {
        throw new Error('Key unwrapping returned no result');
      }

      return Buffer.from(result.result);
    } catch (error) {
      throw new Error(`Key unwrapping failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
