import { SecretClient } from "@azure/keyvault-secrets";
import { SecretExpiryInfo, SecretValueResult } from "./types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export class KeyVaultSecretProvider {
  public constructor(private readonly client: SecretClient) {}

  public async getSecret(
    name: string,
    defaultValue = "",
    version?: string,
  ): Promise<SecretValueResult> {
    try {
      const secret = await this.client.getSecret(name, { version });

      return {
        name: secret.name,
        value: secret.value ?? defaultValue,
        version: secret.properties.version,
        expiresOn: secret.properties.expiresOn,
        source: "keyvault",
      };
    } catch (error) {
      if (this.isSecretMissingError(error)) {
        return {
          name,
          value: defaultValue,
          version,
          source: "default",
        };
      }

      throw error;
    }
  }

  public async inspectExpiry(
    name: string,
    version?: string,
    warningWindowMs = 0,
  ): Promise<SecretExpiryInfo | undefined> {
    try {
      const secret = await this.client.getSecret(name, { version });
      const expiresOn = secret.properties.expiresOn;
      const daysUntilExpiry =
        expiresOn === undefined
          ? undefined
          : Math.ceil((expiresOn.getTime() - Date.now()) / DAY_IN_MS);

      return {
        name: secret.name,
        version: secret.properties.version,
        expiresOn,
        isExpiringSoon:
          expiresOn !== undefined &&
          expiresOn.getTime() - Date.now() <= warningWindowMs,
        daysUntilExpiry,
      };
    } catch (error) {
      if (this.isSecretMissingError(error)) {
        return undefined;
      }

      throw error;
    }
  }

  private isSecretMissingError(error: unknown): boolean {
    if (typeof error !== "object" || error === null) {
      return false;
    }

    const candidate = error as {
      statusCode?: number;
      code?: string;
      details?: { error?: { code?: string } };
    };

    return (
      candidate.statusCode === 404 ||
      candidate.code === "SecretNotFound" ||
      candidate.details?.error?.code === "SecretNotFound"
    );
  }
}
