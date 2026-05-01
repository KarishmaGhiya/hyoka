import { SecretClient, KeyVaultSecret } from "@azure/keyvault-secrets";

export interface SecretResult {
  name: string;
  value: string;
  version: string;
  expiresOn: Date | undefined;
  createdOn: Date | undefined;
}

export class SecretProvider {
  constructor(private readonly client: SecretClient) {}

  /**
   * Retrieve a secret by name, optionally at a specific version.
   * Returns `defaultValue` instead of throwing when the secret does not exist.
   */
  async getSecret(
    name: string,
    options?: { version?: string; defaultValue?: string }
  ): Promise<SecretResult> {
    try {
      const secret: KeyVaultSecret = await this.client.getSecret(
        name,
        options?.version ? { version: options.version } : undefined
      );

      return {
        name: secret.name,
        value: secret.value ?? options?.defaultValue ?? "",
        version: secret.properties.version ?? "unknown",
        expiresOn: secret.properties.expiresOn,
        createdOn: secret.properties.createdOn,
      };
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        return {
          name,
          value: options?.defaultValue ?? "",
          version: "none",
          expiresOn: undefined,
          createdOn: undefined,
        };
      }
      throw err;
    }
  }

  /**
   * Check whether a secret's expiry falls within a warning window.
   * Returns the number of days until expiry, or `null` if no expiry is set.
   */
  daysUntilExpiry(secret: SecretResult): number | null {
    if (!secret.expiresOn) return null;
    const msPerDay = 86_400_000;
    return Math.floor(
      (secret.expiresOn.getTime() - Date.now()) / msPerDay
    );
  }

  /** Expose the underlying client for advanced operations. */
  get secretClient(): SecretClient {
    return this.client;
  }
}

function isNotFoundError(err: unknown): boolean {
  if (typeof err === "object" && err !== null && "statusCode" in err) {
    return (err as { statusCode: number }).statusCode === 404;
  }
  return false;
}
