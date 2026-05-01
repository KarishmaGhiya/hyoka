import { SecretClient } from "@azure/keyvault-secrets";

import { SecretRecord } from "./types";

type KeyVaultError = {
  statusCode?: number;
  code?: string;
};

export interface GetSecretOptions {
  defaultValue?: string;
  version?: string;
}

export class KeyVaultSecretProvider {
  public constructor(private readonly client: SecretClient) {}

  public async getSecret(
    name: string,
    options: GetSecretOptions = {},
  ): Promise<SecretRecord> {
    try {
      const secret = await this.client.getSecret(
        name,
        options.version ? { version: options.version } : undefined,
      );

      return {
        name,
        value: secret.value ?? options.defaultValue,
        found: secret.value !== undefined,
        usedDefault: secret.value === undefined && options.defaultValue !== undefined,
        version: secret.properties.version ?? null,
        expiresOn: secret.properties.expiresOn ?? null,
        fetchedAt: new Date(),
      };
    } catch (error: unknown) {
      if (this.isMissingSecret(error)) {
        return {
          name,
          value: options.defaultValue,
          found: false,
          usedDefault: options.defaultValue !== undefined,
          version: options.version ?? null,
          expiresOn: null,
          fetchedAt: new Date(),
        };
      }

      throw error;
    }
  }

  public async getSecretExpiry(
    name: string,
    version?: string,
  ): Promise<Date | null> {
    const secret = await this.getSecret(name, { version });
    return secret.expiresOn;
  }

  public isNearExpiry(
    secret: Pick<SecretRecord, "expiresOn">,
    warningWindowMs: number,
    now: Date = new Date(),
  ): boolean {
    if (!secret.expiresOn) {
      return false;
    }

    return secret.expiresOn.getTime() - now.getTime() <= warningWindowMs;
  }

  private isMissingSecret(error: unknown): boolean {
    const candidate = error as KeyVaultError;
    return candidate.statusCode === 404 || candidate.code === "SecretNotFound";
  }
}
