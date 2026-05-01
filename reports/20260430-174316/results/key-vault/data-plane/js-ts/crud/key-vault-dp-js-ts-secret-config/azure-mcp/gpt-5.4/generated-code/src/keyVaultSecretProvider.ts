import { SecretClient } from "@azure/keyvault-secrets";

import { SecretLookupOptions, SecretRecord } from "./types";

function hasStatusCode(error: unknown, statusCode: number): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number" &&
    (error as { statusCode: number }).statusCode === statusCode
  );
}

export class KeyVaultSecretProvider {
  public constructor(private readonly client: SecretClient) {}

  public async getSecret(name: string, options: SecretLookupOptions = {}): Promise<SecretRecord> {
    try {
      const secret = await this.client.getSecret(name, {
        version: options.version
      });

      return {
        name: secret.name,
        value: secret.value ?? "",
        version: secret.properties.version,
        expiresOn: secret.properties.expiresOn,
        fetchedAt: new Date(),
        isDefault: false
      };
    } catch (error) {
      if (hasStatusCode(error, 404) && options.defaultValue !== undefined) {
        return {
          name,
          value: options.defaultValue,
          version: options.version,
          fetchedAt: new Date(),
          expiresOn: undefined,
          isDefault: true
        };
      }

      throw error;
    }
  }

  public async getSecretValue(name: string, options: SecretLookupOptions = {}): Promise<string> {
    const secret = await this.getSecret(name, options);
    return secret.value;
  }

  public async getSecretExpiry(name: string, version?: string): Promise<Date | undefined> {
    const secret = await this.getSecret(name, { version });
    return secret.expiresOn;
  }
}
