import { randomBytes } from "node:crypto";

import { CryptographyClient, KeyClient, KeyVaultKey } from "@azure/keyvault-keys";
import type { ManagedIdentityCredential } from "@azure/identity";
import type { KeyWrapAlgorithm } from "@azure/keyvault-keys";

const WRAP_ALGORITHM: KeyWrapAlgorithm = "RSA-OAEP-256";
const DATA_KEY_LENGTH_BYTES = 32;

export interface WrappedDataKey {
  rawDataKey: Buffer;
  wrappedDataKey: Buffer;
  keyId: string;
  wrapAlgorithm: string;
}

export class KeyVaultEnvelopeKeyManager {
  private readonly cryptographyClients = new Map<string, CryptographyClient>();

  constructor(
    private readonly keyClient: KeyClient,
    private readonly credential: ManagedIdentityCredential,
    private readonly keyName: string,
    private readonly keyVersion?: string,
  ) {}

  async generateAndWrapDataKey(): Promise<WrappedDataKey> {
    const rawDataKey = randomBytes(DATA_KEY_LENGTH_BYTES);
    const key = await this.getCurrentKey();
    const cryptographyClient = this.getCryptographyClient(key.id);
    const wrapResult = await cryptographyClient.wrapKey(WRAP_ALGORITHM, rawDataKey);

    return {
      rawDataKey,
      wrappedDataKey: Buffer.from(wrapResult.result),
      keyId: key.id,
      wrapAlgorithm: WRAP_ALGORITHM,
    };
  }

  async unwrapDataKey(
    wrappedDataKey: Buffer,
    keyId: string,
    wrapAlgorithm: KeyWrapAlgorithm = WRAP_ALGORITHM,
  ): Promise<Buffer> {
    const cryptographyClient = this.getCryptographyClient(keyId);
    const unwrapResult = await cryptographyClient.unwrapKey(wrapAlgorithm, wrappedDataKey);

    return Buffer.from(unwrapResult.result);
  }

  private async getCurrentKey(): Promise<KeyVaultKey & { id: string }> {
    let key: KeyVaultKey;

    try {
      key = await this.keyClient.getKey(this.keyName, { version: this.keyVersion });
    } catch (error: unknown) {
      throw new Error(
        `Failed to load Key Vault key "${this.keyName}" from ${this.keyClient.vaultUrl}: ${formatAzureError(error)}`,
      );
    }

    if (!key.id) {
      throw new Error(`Key Vault key "${this.keyName}" did not return a usable key identifier.`);
    }

    if (key.properties.enabled === false) {
      throw new Error(`Key Vault key "${this.keyName}" is disabled and cannot wrap or unwrap data keys.`);
    }

    return key as KeyVaultKey & { id: string };
  }

  private getCryptographyClient(keyId: string): CryptographyClient {
    const existingClient = this.cryptographyClients.get(keyId);

    if (existingClient) {
      return existingClient;
    }

    const cryptographyClient = new CryptographyClient(keyId, this.credential);
    this.cryptographyClients.set(keyId, cryptographyClient);

    return cryptographyClient;
  }
}

export function formatAzureError(error: unknown): string {
  if (error instanceof Error) {
    const statusCode = "statusCode" in error ? String(error.statusCode) : undefined;
    const code = "code" in error ? String(error.code) : undefined;

    if (statusCode && code) {
      return `${error.message} (status ${statusCode}, code ${code})`;
    }

    if (statusCode) {
      return `${error.message} (status ${statusCode})`;
    }

    if (code) {
      return `${error.message} (code ${code})`;
    }

    return error.message;
  }

  return String(error);
}
