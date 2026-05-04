import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';

export interface SecretInfo {
  name: string;
  value: string;
  version?: string;
  expiresOn?: Date;
  createdOn?: Date;
}

export class SecretProvider {
  constructor(private client: SecretClient) {}

  /**
   * Retrieves a secret by name. Returns default value if secret doesn't exist.
   */
  async getSecret(name: string, defaultValue?: string): Promise<string | undefined> {
    try {
      const secret = await this.client.getSecret(name);
      return secret.value;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return defaultValue;
      }
      throw error;
    }
  }

  /**
   * Retrieves a specific version of a secret.
   */
  async getSecretVersion(name: string, version: string, defaultValue?: string): Promise<string | undefined> {
    try {
      const secret = await this.client.getSecret(name, { version });
      return secret.value;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return defaultValue;
      }
      throw error;
    }
  }

  /**
   * Retrieves full secret information including expiry date.
   */
  async getSecretInfo(name: string): Promise<SecretInfo | null> {
    try {
      const secret = await this.client.getSecret(name);
      return {
        name: secret.name,
        value: secret.value || '',
        version: secret.properties.version,
        expiresOn: secret.properties.expiresOn,
        createdOn: secret.properties.createdOn,
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Checks if a secret is near expiry within the given warning window (in days).
   */
  isNearExpiry(expiresOn: Date | undefined, warningWindowDays: number): boolean {
    if (!expiresOn) {
      return false;
    }
    const now = new Date();
    const warningDate = new Date(now.getTime() + warningWindowDays * 24 * 60 * 60 * 1000);
    return expiresOn <= warningDate;
  }

  /**
   * Creates or updates a secret with an optional expiry date.
   */
  async setSecret(name: string, value: string, expiresOn?: Date): Promise<KeyVaultSecret> {
    return await this.client.setSecret(name, value, {
      expiresOn,
    });
  }

  /**
   * Lists all versions of a secret.
   */
  async listSecretVersions(name: string): Promise<string[]> {
    const versions: string[] = [];
    for await (const version of this.client.listPropertiesOfSecretVersions(name)) {
      if (version.version) {
        versions.push(version.version);
      }
    }
    return versions;
  }
}
