import { SecretClient, KeyVaultSecret } from "@azure/keyvault-secrets";
import { RestError } from "@azure/core-rest-pipeline";

/** Lightweight wrapper exposing a secret's value alongside its expiry metadata. */
export interface SecretResult {
  name: string;
  value: string;
  version?: string;
  expiresOn?: Date;
}

/**
 * Retrieves secrets from Azure Key Vault by name with graceful fallback
 * when a secret does not exist.
 */
export class SecretProvider {
  constructor(private readonly client: SecretClient) {}

  /**
   * Get a secret by name, optionally pinning to a specific version.
   * Returns the provided `defaultValue` (or `undefined`) when the secret is
   * not found instead of throwing.
   */
  async getSecret(
    name: string,
    options?: { version?: string; defaultValue?: string },
  ): Promise<SecretResult | undefined> {
    try {
      const secret: KeyVaultSecret = await this.client.getSecret(name, {
        version: options?.version,
      });

      return {
        name: secret.name,
        value: secret.value ?? "",
        version: secret.properties.version,
        expiresOn: secret.properties.expiresOn,
      };
    } catch (err) {
      if (err instanceof RestError && err.statusCode === 404) {
        if (options?.defaultValue !== undefined) {
          return {
            name,
            value: options.defaultValue,
            version: undefined,
            expiresOn: undefined,
          };
        }
        return undefined;
      }
      throw err;
    }
  }

  /**
   * Check whether a secret's expiry date falls within the given warning
   * window (milliseconds).  Returns `true` when the secret expires within
   * the window or has already expired.  Returns `false` when there is no
   * expiry date set.
   */
  isNearExpiry(secret: SecretResult, warningWindowMs: number): boolean {
    if (!secret.expiresOn) return false;
    return secret.expiresOn.getTime() - Date.now() <= warningWindowMs;
  }
}
