import { KeyClient } from '@azure/keyvault-keys';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface WrappedKey {
  wrappedKeyBase64: string;
  keyId: string;
}

export interface EncryptionResult {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  wrappedKey: WrappedKey;
}

export class KeyManagementService {
  constructor(
    private readonly keyClient: KeyClient,
    private readonly keyName: string
  ) {}

  async encryptData(plaintext: Buffer): Promise<EncryptionResult> {
    const dataKey = randomBytes(32);
    const iv = randomBytes(12);

    const cipher = createCipheriv('aes-256-gcm', dataKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const wrappedKey = await this.wrapKey(dataKey);

    return {
      ciphertext,
      iv,
      authTag,
      wrappedKey,
    };
  }

  async decryptData(
    ciphertext: Buffer,
    iv: Buffer,
    authTag: Buffer,
    wrappedKey: WrappedKey
  ): Promise<Buffer> {
    const dataKey = await this.unwrapKey(wrappedKey);

    const decipher = createDecipheriv('aes-256-gcm', dataKey, iv);
    decipher.setAuthTag(authTag);

    try {
      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return plaintext;
    } finally {
      dataKey.fill(0);
    }
  }

  private async wrapKey(dataKey: Buffer): Promise<WrappedKey> {
    try {
      const key = await this.keyClient.getKey(this.keyName);
      
      if (!key.key) {
        throw new Error('Key material not found in Key Vault response');
      }

      const wrapResult = await this.keyClient.wrapKey(
        this.keyName,
        key.properties.version!,
        'RSA-OAEP-256',
        dataKey
      );

      if (!wrapResult.result) {
        throw new Error('Key wrap operation failed');
      }

      return {
        wrappedKeyBase64: Buffer.from(wrapResult.result).toString('base64'),
        keyId: key.id!,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to wrap data encryption key: ${error.message}`);
      }
      throw error;
    }
  }

  private async unwrapKey(wrappedKey: WrappedKey): Promise<Buffer> {
    try {
      const keyIdParts = wrappedKey.keyId.split('/');
      const version = keyIdParts[keyIdParts.length - 1];

      const wrappedKeyBuffer = Buffer.from(wrappedKey.wrappedKeyBase64, 'base64');

      const unwrapResult = await this.keyClient.unwrapKey(
        this.keyName,
        version,
        'RSA-OAEP-256',
        wrappedKeyBuffer
      );

      if (!unwrapResult.result) {
        throw new Error('Key unwrap operation failed');
      }

      return Buffer.from(unwrapResult.result);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to unwrap data encryption key: ${error.message}`);
      }
      throw error;
    }
  }
}
