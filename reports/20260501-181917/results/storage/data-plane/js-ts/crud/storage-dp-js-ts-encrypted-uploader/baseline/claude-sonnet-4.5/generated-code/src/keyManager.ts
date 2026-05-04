import { KeyClient } from "@azure/keyvault-keys";
import * as crypto from "crypto";

export interface WrappedKey {
  wrappedKey: string;
  keyId: string;
}

export class KeyManager {
  private keyClient: KeyClient;
  private keyName: string;

  constructor(keyClient: KeyClient, keyName: string) {
    this.keyClient = keyClient;
    this.keyName = keyName;
  }

  generateDataEncryptionKey(): Buffer {
    return crypto.randomBytes(32);
  }

  async wrapKey(dataKey: Buffer): Promise<WrappedKey> {
    try {
      const key = await this.keyClient.getKey(this.keyName);
      
      if (!key.id) {
        throw new Error("Key ID is undefined");
      }

      const wrapResult = await this.keyClient.wrapKey(
        this.keyName,
        "RSA-OAEP-256",
        dataKey
      );

      return {
        wrappedKey: Buffer.from(wrapResult.result).toString("base64"),
        keyId: key.id,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to wrap key: ${error.message}`);
      }
      throw new Error("Failed to wrap key: Unknown error");
    }
  }

  async unwrapKey(wrappedKeyBase64: string, keyId: string): Promise<Buffer> {
    try {
      const wrappedKeyBuffer = Buffer.from(wrappedKeyBase64, "base64");

      const unwrapResult = await this.keyClient.unwrapKey(
        this.keyName,
        "RSA-OAEP-256",
        wrappedKeyBuffer
      );

      return Buffer.from(unwrapResult.result);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to unwrap key: ${error.message}`);
      }
      throw new Error("Failed to unwrap key: Unknown error");
    }
  }
}
