import { SecretClient } from "@azure/keyvault-secrets";

export interface SecretFetchOptions {
  defaultValue?: string;
  version?: string;
}

export interface ResolvedSecret {
  name: string;
  value: string;
  version?: string;
  expiresOn?: Date;
  usedDefault: boolean;
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === 404
  );
}

export class KeyVaultSecretProvider {
  public constructor(private readonly client: SecretClient) {}

  public async getSecret(
    name: string,
    options: SecretFetchOptions = {},
  ): Promise<ResolvedSecret> {
    try {
      const secret = await this.client.getSecret(name, {
        version: options.version,
      });

      if (secret.value === undefined) {
        throw new Error(`Secret "${name}" does not contain a value.`);
      }

      return {
        name: secret.name,
        value: secret.value,
        version: secret.properties.version,
        expiresOn: secret.properties.expiresOn,
        usedDefault: false,
      };
    } catch (error) {
      if (isNotFoundError(error) && options.defaultValue !== undefined) {
        return {
          name,
          value: options.defaultValue,
          version: options.version,
          usedDefault: true,
        };
      }

      throw error;
    }
  }

  public async getSecretVersion(
    name: string,
    version: string,
    defaultValue?: string,
  ): Promise<ResolvedSecret> {
    return this.getSecret(name, {
      defaultValue,
      version,
    });
  }

  public async getSecretExpiry(
    name: string,
    version?: string,
  ): Promise<Date | undefined> {
    const secret = await this.getSecret(name, { version });
    return secret.expiresOn;
  }

  public isExpiringSoon(
    secret: Pick<ResolvedSecret, "expiresOn">,
    warningWindowMs: number,
  ): boolean {
    if (!secret.expiresOn) {
      return false;
    }

    return secret.expiresOn.getTime() - Date.now() <= warningWindowMs;
  }
}
