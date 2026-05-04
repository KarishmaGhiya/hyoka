import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';

export interface SecretMetadata {
  name: string;
  value: string;
  version?: string;
  expiresOn?: Date;
  createdOn?: Date;
  updatedOn?: Date;
}

export class SecretProvider {
  private client: SecretClient;

  constructor(client: SecretClient) {
    this.client = client;
  }

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
   * Retrieves complete secret metadata including expiry date.
   */
  async getSecretMetadata(name: string): Promise<SecretMetadata | null> {
    try {
      const secret = await this.client.getSecret(name);
      return this.mapToMetadata(secret);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Retrieves metadata for a specific version of a secret.
   */
  async getSecretVersionMetadata(name: string, version: string): Promise<SecretMetadata | null> {
    try {
      const secret = await this.client.getSecret(name, { version });
      return this.mapToMetadata(secret);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Checks if a secret is expiring within a given number of days.
   */
  async isSecretExpiringSoon(name: string, warningDays: number): Promise<boolean> {
    const metadata = await this.getSecretMetadata(name);
    if (!metadata || !metadata.expiresOn) {
      return false;
    }

    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + warningDays);

    return metadata.expiresOn <= warningDate;
  }

  /**
   * Gets the number of days until a secret expires.
   * Returns null if secret doesn't exist or has no expiry date.
   */
  async getDaysUntilExpiry(name: string): Promise<number | null> {
    const metadata = await this.getSecretMetadata(name);
    if (!metadata || !metadata.expiresOn) {
      return null;
    }

    const now = new Date();
    const diffMs = metadata.expiresOn.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  private mapToMetadata(secret: KeyVaultSecret): SecretMetadata {
    return {
      name: secret.name,
      value: secret.value || '',
      version: secret.properties.version,
      expiresOn: secret.properties.expiresOn,
      createdOn: secret.properties.createdOn,
      updatedOn: secret.properties.updatedOn,
    };
  }
}
