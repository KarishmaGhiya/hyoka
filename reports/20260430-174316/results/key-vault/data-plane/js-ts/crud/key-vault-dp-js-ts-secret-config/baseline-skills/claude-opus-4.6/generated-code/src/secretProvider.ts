import {
  SecretClient,
  KeyVaultSecret,
  DeletedSecret,
} from "@azure/keyvault-secrets";

/** Metadata returned alongside a secret value. */
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
   * Get a secret by name, optionally requesting a specific version.
   * Returns `defaultValue` (or `undefined`) when the secret does not exist
   * instead of throwing.
   */
  async getSecret(
    name: string,
    options?: { version?: string; defaultValue?: string }
  ): Promise<SecretResult | undefined> {
    try {
      const secret: KeyVaultSecret = await this.client.getSecret(
        name,
        options?.version ? { version: options.version } : undefined
      );

      return {
        name: secret.name,
        value: secret.value ?? options?.defaultValue ?? "",
        version: secret.properties.version,
        expiresOn: secret.properties.expiresOn,
      };
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        if (options?.defaultValue !== undefined) {
          return {
            name,
            value: options.defaultValue,
          };
        }
        return undefined;
      }
      throw err;
    }
  }

  /**
   * Check whether a secret's expiry date falls within the given warning
   * window (defaults to 7 days).
   */
  isExpiringSoon(secret: SecretResult, warningDays: number = 7): boolean {
    if (!secret.expiresOn) return false;
    const now = new Date();
    const threshold = new Date(
      now.getTime() + warningDays * 24 * 60 * 60 * 1000
    );
    return secret.expiresOn <= threshold;
  }
}

function isNotFoundError(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "statusCode" in err) {
    return (err as { statusCode: number }).statusCode === 404;
  }
  return false;
}
