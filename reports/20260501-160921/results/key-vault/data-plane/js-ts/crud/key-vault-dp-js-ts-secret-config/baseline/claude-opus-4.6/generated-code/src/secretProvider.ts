import { SecretClient, KeyVaultSecret } from "@azure/keyvault-secrets";

/** Metadata about a retrieved secret. */
export interface SecretInfo {
  name: string;
  value: string;
  version: string | undefined;
  expiresOn: Date | undefined;
  createdOn: Date | undefined;
}

/**
 * Retrieves secrets from Azure Key Vault by name.
 *
 * Handles missing secrets gracefully by returning a caller-supplied default
 * instead of throwing, and exposes version retrieval and expiry inspection.
 */
export class SecretProvider {
  constructor(private readonly client: SecretClient) {}

  /**
   * Get the latest version of a secret, or a specific version.
   * Returns `defaultValue` when the secret does not exist.
   */
  async getSecret(
    name: string,
    defaultValue: string = "",
    version?: string,
  ): Promise<SecretInfo> {
    try {
      const options = version ? { version } : {};
      const secret: KeyVaultSecret = await this.client.getSecret(name, options);

      return {
        name: secret.name,
        value: secret.value ?? defaultValue,
        version: secret.properties.version,
        expiresOn: secret.properties.expiresOn,
        createdOn: secret.properties.createdOn,
      };
    } catch (error: unknown) {
      if (isNotFoundError(error)) {
        return {
          name,
          value: defaultValue,
          version: undefined,
          expiresOn: undefined,
          createdOn: undefined,
        };
      }
      throw error;
    }
  }

  /**
   * Check whether a secret's expiry date falls within `warningDays` from now.
   * Returns `false` when the secret has no expiry set.
   */
  isNearExpiry(secret: SecretInfo, warningDays: number = 7): boolean {
    if (!secret.expiresOn) {
      return false;
    }
    const warningMs = warningDays * 24 * 60 * 60 * 1000;
    return secret.expiresOn.getTime() - Date.now() <= warningMs;
  }
}

function isNotFoundError(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    return (error as { statusCode: number }).statusCode === 404;
  }
  return false;
}
