import { randomBytes } from "node:crypto";
import { ManagedIdentityCredential } from "@azure/identity";
import {
  CryptographyClient,
  KeyClient,
  KeyWrapAlgorithm
} from "@azure/keyvault-keys";

export interface WrappedDataKey {
  plaintextKey: Buffer;
  wrappedKey: Buffer;
  wrappingAlgorithm: KeyWrapAlgorithm;
  keyId: string;
}

export class KeyVaultEnvelopeKeyManager {
  public static readonly dataKeyLengthBytes = 32;
  public static readonly wrapAlgorithm: KeyWrapAlgorithm = "RSA-OAEP-256";

  public constructor(
    private readonly keyClient: KeyClient,
    private readonly credential: ManagedIdentityCredential,
    private readonly keyName: string,
    private readonly keyVersion?: string
  ) {}

  public async generateWrappedDataKey(): Promise<WrappedDataKey> {
    const plaintextKey = randomBytes(KeyVaultEnvelopeKeyManager.dataKeyLengthBytes);
    const keyId = await this.resolveActiveKeyId();
    const cryptographyClient = new CryptographyClient(keyId, this.credential);

    try {
      const result = await cryptographyClient.wrapKey(
        KeyVaultEnvelopeKeyManager.wrapAlgorithm,
        plaintextKey
      );

      if (!result.result) {
        throw new Error("Key Vault did not return a wrapped key.");
      }

      return {
        plaintextKey,
        wrappedKey: Buffer.from(result.result),
        wrappingAlgorithm: KeyVaultEnvelopeKeyManager.wrapAlgorithm,
        keyId
      };
    } catch (error) {
      throw new Error(`Failed to wrap the data encryption key with Key Vault key "${keyId}".`, {
        cause: error
      });
    }
  }

  public async unwrapDataKey(
    wrappedKey: Buffer,
    keyId: string,
    wrappingAlgorithm: KeyWrapAlgorithm
  ): Promise<Buffer> {
    const cryptographyClient = new CryptographyClient(keyId, this.credential);

    try {
      const result = await cryptographyClient.unwrapKey(wrappingAlgorithm, wrappedKey);

      if (!result.result) {
        throw new Error("Key Vault did not return an unwrapped key.");
      }

      return Buffer.from(result.result);
    } catch (error) {
      throw new Error(`Failed to unwrap the data encryption key with Key Vault key "${keyId}".`, {
        cause: error
      });
    }
  }

  private async resolveActiveKeyId(): Promise<string> {
    try {
      const key = this.keyVersion
        ? await this.keyClient.getKey(this.keyName, { version: this.keyVersion })
        : await this.keyClient.getKey(this.keyName);

      if (key.properties.enabled === false) {
        throw new Error(`Key Vault key "${this.keyName}" is disabled.`);
      }

      if (!key.id) {
        throw new Error(`Key Vault key "${this.keyName}" did not include an id.`);
      }

      return key.id;
    } catch (error) {
      throw new Error(`Failed to resolve Key Vault key "${this.keyName}".`, {
        cause: error
      });
    }
  }
}
