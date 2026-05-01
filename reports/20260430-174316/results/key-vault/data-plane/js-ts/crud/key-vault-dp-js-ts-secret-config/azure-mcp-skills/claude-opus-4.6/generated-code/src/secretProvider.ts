import {
  SecretClient,
  KeyVaultSecret,
  SecretProperties,
} from "@azure/keyvault-secrets";

export interface SecretResult {
  name: string;
  value: string;
  version?: string;
  expiresOn?: Date;
  createdOn?: Date;
  updatedOn?: Date;
}

export class SecretProvider {
  constructor(private readonly client: SecretClient) {}

  /**
   * Retrieve a secret by name, returning a default value if the secret
   * does not exist rather than throwing.
   */
  async getSecret(
    name: string,
    defaultValue: string = "",
    version?: string
  ): Promise<SecretResult> {
    try {
      const options = version ? { version } : {};
      const secret: KeyVaultSecret = await this.client.getSecret(
        name,
        options
      );

      return {
        name: secret.name,
        value: secret.value ?? defaultValue,
        version: secret.properties.version,
        expiresOn: secret.properties.expiresOn,
        createdOn: secret.properties.createdOn,
        updatedOn: secret.properties.updatedOn,
      };
    } catch (error: unknown) {
      if (isNotFoundError(error)) {
        console.warn(`Secret "${name}" not found – returning default value.`);
        return { name, value: defaultValue };
      }
      throw error;
    }
  }

  /**
   * Retrieve a specific version of a secret.
   */
  async getSecretVersion(
    name: string,
    version: string,
    defaultValue: string = ""
  ): Promise<SecretResult> {
    return this.getSecret(name, defaultValue, version);
  }

  /**
   * Inspect expiry information for a secret.
   * Returns the number of days until expiry, or `undefined` if no
   * expiry is set.
   */
  async getDaysUntilExpiry(name: string): Promise<number | undefined> {
    const secret = await this.getSecret(name);
    if (!secret.expiresOn) return undefined;

    const now = new Date();
    const diffMs = secret.expiresOn.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check whether a secret is expiring within the given warning window.
   */
  async isNearExpiry(
    name: string,
    warningDays: number = 7
  ): Promise<{ nearExpiry: boolean; daysRemaining?: number }> {
    const days = await this.getDaysUntilExpiry(name);
    if (days === undefined) {
      return { nearExpiry: false, daysRemaining: undefined };
    }
    return { nearExpiry: days <= warningDays, daysRemaining: days };
  }
}

function isNotFoundError(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const statusCode = (error as Record<string, unknown>).statusCode;
    if (statusCode === 404) return true;

    const code = (error as Record<string, unknown>).code;
    if (code === "SecretNotFound") return true;
  }
  return false;
}
