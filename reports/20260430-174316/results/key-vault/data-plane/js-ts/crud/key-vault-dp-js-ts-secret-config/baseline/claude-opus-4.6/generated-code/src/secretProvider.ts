import {
  SecretClient,
  KeyVaultSecret,
  DeletedSecret,
} from "@azure/keyvault-secrets";

export interface SecretResult {
  name: string;
  value: string;
  version?: string;
  expiresOn?: Date;
}

/**
 * Retrieves secrets from Azure Key Vault with graceful fallback
 * when a secret does not exist.
 */
export class SecretProvider {
  constructor(private readonly client: SecretClient) {}

  /**
   * Get a secret by name, optionally at a specific version.
   * Returns `defaultValue` instead of throwing when the secret is not found.
   */
  async getSecret(
    name: string,
    defaultValue: string = "",
    version?: string
  ): Promise<SecretResult> {
    try {
      const secret: KeyVaultSecret = await this.client.getSecret(name, {
        version,
      });

      return {
        name: secret.name,
        value: secret.value ?? defaultValue,
        version: secret.properties.version,
        expiresOn: secret.properties.expiresOn,
      };
    } catch (error: unknown) {
      if (isNotFoundError(error)) {
        return { name, value: defaultValue };
      }
      throw error;
    }
  }

  /**
   * Returns the expiry date of the current (latest) version of a secret,
   * or `undefined` if the secret has no expiry or does not exist.
   */
  async getExpiryDate(name: string): Promise<Date | undefined> {
    try {
      const secret = await this.client.getSecret(name);
      return secret.properties.expiresOn;
    } catch (error: unknown) {
      if (isNotFoundError(error)) {
        return undefined;
      }
      throw error;
    }
  }
}

function isNotFoundError(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    return (error as { statusCode: number }).statusCode === 404;
  }
  return false;
}
