import { KeyClient, CryptographyClient, KeyVaultKey } from '@azure/keyvault-keys';
import { TokenCredential } from '@azure/identity';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface WrappedKey {
  wrappedKey: string; // Base64-encoded wrapped key
  keyId: string; // Key Vault key ID used for wrapping
}

export interface EncryptionResult {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  wrappedKey: WrappedKey;
}

export class KeyManagementService {
  private keyClient: KeyClient;
  private keyName: string;
  private credential: TokenCredential;
  private cryptoClient: CryptographyClient | null = null;

  constructor(keyClient: KeyClient, keyName: string, credential: TokenCredential) {
    this.keyClient = keyClient;
    this.keyName = keyName;
    this.credential = credential;
  }

  private async getCryptoClient(): Promise<CryptographyClient> {
    if (!this.cryptoClient) {
      const key = await this.keyClient.getKey(this.keyName);
      if (!key.id) {
        throw new Error('Key ID is not available');
      }
      // CryptographyClient needs the key ID and credential
      this.cryptoClient = new CryptographyClient(key.id, this.credential);
    }
    return this.cryptoClient;
  }

  /**
   * Generate a local data encryption key (DEK) for AES-256-GCM
   * The DEK is 256 bits (32 bytes) for AES-256
   */
  private generateDataEncryptionKey(): Buffer {
    return randomBytes(32); // 256-bit key
  }

  /**
   * Wrap (encrypt) the data encryption key using Azure Key Vault
   * The DEK never leaves the local system in plaintext
   */
  private async wrapKey(dek: Buffer): Promise<WrappedKey> {
    try {
      const cryptoClient = await this.getCryptoClient();
      const wrapResult = await cryptoClient.wrapKey('RSA-OAEP', dek);

      if (!wrapResult.result) {
        throw new Error('Key wrapping failed: no result returned');
      }

      return {
        wrappedKey: Buffer.from(wrapResult.result).toString('base64'),
        keyId: wrapResult.keyID || '',
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to wrap key: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Unwrap (decrypt) the data encryption key using Azure Key Vault
   * Returns the plaintext DEK for local decryption
   */
  private async unwrapKey(wrappedKey: WrappedKey): Promise<Buffer> {
    try {
      const cryptoClient = await this.getCryptoClient();
      const wrappedKeyBuffer = Buffer.from(wrappedKey.wrappedKey, 'base64');
      const unwrapResult = await cryptoClient.unwrapKey('RSA-OAEP', wrappedKeyBuffer);

      if (!unwrapResult.result) {
        throw new Error('Key unwrapping failed: no result returned');
      }

      return Buffer.from(unwrapResult.result);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to unwrap key: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Encrypt data using envelope encryption:
   * 1. Generate a random DEK locally
   * 2. Encrypt data with DEK using AES-256-GCM
   * 3. Wrap the DEK using Key Vault
   * 4. Return ciphertext, IV, auth tag, and wrapped DEK
   */
  async encryptData(plaintext: Buffer): Promise<EncryptionResult> {
    // Generate a random DEK (never persisted)
    const dek = this.generateDataEncryptionKey();

    // Generate a random IV for AES-GCM (96 bits / 12 bytes is recommended)
    const iv = randomBytes(12);

    try {
      // Encrypt the data locally using AES-256-GCM
      const cipher = createCipheriv('aes-256-gcm', dek, iv);
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // Wrap the DEK using Key Vault (DEK is protected, never stored in plaintext)
      const wrappedKey = await this.wrapKey(dek);

      // Clear the DEK from memory (best effort)
      dek.fill(0);

      return {
        ciphertext,
        iv,
        authTag,
        wrappedKey,
      };
    } catch (error) {
      // Ensure DEK is cleared even on error
      dek.fill(0);
      throw error;
    }
  }

  /**
   * Decrypt data using envelope encryption:
   * 1. Unwrap the DEK using Key Vault
   * 2. Decrypt the ciphertext locally using the DEK
   * 3. Clear the DEK from memory
   */
  async decryptData(
    ciphertext: Buffer,
    iv: Buffer,
    authTag: Buffer,
    wrappedKey: WrappedKey
  ): Promise<Buffer> {
    let dek: Buffer | null = null;

    try {
      // Unwrap the DEK using Key Vault
      dek = await this.unwrapKey(wrappedKey);

      // Decrypt the data locally using AES-256-GCM
      const decipher = createDecipheriv('aes-256-gcm', dek, iv);
      decipher.setAuthTag(authTag);

      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return plaintext;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to decrypt data: ${error.message}`);
      }
      throw error;
    } finally {
      // Always clear the DEK from memory
      if (dek) {
        dek.fill(0);
      }
    }
  }
}
