import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

export interface SecretMetadata {
  value: string;
  version?: string;
  expiresOn?: Date;
  createdOn?: Date;
  updatedOn?: Date;
}

export class SecretProvider {
  private client: SecretClient;

  constructor(vaultUrl: string) {
    const credential = new DefaultAzureCredential();
    this.client = new SecretClient(vaultUrl, credential);
  }

  /**
   * Retrieves a secret by name with graceful error handling
   * @param secretName The name of the secret
   * @param defaultValue Value to return if secret doesn't exist
   * @param version Optional specific version to retrieve
   * @returns The secret metadata or default value if not found
   */
  async getSecret(
    secretName: string,
    defaultValue: string = '',
    version?: string
  ): Promise<SecretMetadata> {
    try {
      const secret = version
        ? await this.client.getSecret(secretName, { version })
        : await this.client.getSecret(secretName);

      return this.mapToMetadata(secret);
    } catch (error: any) {
      // Handle secret not found gracefully
      if (error.statusCode === 404 || error.code === 'SecretNotFound') {
        console.warn(`Secret '${secretName}' not found, using default value`);
        return {
          value: defaultValue,
          version: undefined,
          expiresOn: undefined,
        };
      }
      throw error;
    }
  }

  /**
   * Retrieves a specific version of a secret
   * @param secretName The name of the secret
   * @param version The version identifier
   * @returns The secret metadata
   */
  async getSecretVersion(secretName: string, version: string): Promise<SecretMetadata> {
    return this.getSecret(secretName, '', version);
  }

  /**
   * Checks if a secret is expiring soon
   * @param secretName The name of the secret
   * @param warningWindowDays Number of days before expiry to consider as "expiring soon"
   * @returns Object with expiry information
   */
  async checkSecretExpiry(
    secretName: string,
    warningWindowDays: number = 7
  ): Promise<{ isExpiring: boolean; expiresOn?: Date; daysUntilExpiry?: number }> {
    const metadata = await this.getSecret(secretName);

    if (!metadata.expiresOn) {
      return { isExpiring: false };
    }

    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (metadata.expiresOn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      isExpiring: daysUntilExpiry <= warningWindowDays && daysUntilExpiry >= 0,
      expiresOn: metadata.expiresOn,
      daysUntilExpiry,
    };
  }

  /**
   * Sets or updates a secret value
   * @param secretName The name of the secret
   * @param value The secret value
   * @param expiresOn Optional expiry date
   * @returns The created secret metadata
   */
  async setSecret(
    secretName: string,
    value: string,
    expiresOn?: Date
  ): Promise<SecretMetadata> {
    const options = expiresOn ? { expiresOn } : {};
    const secret = await this.client.setSecret(secretName, value, options);
    return this.mapToMetadata(secret);
  }

  /**
   * Maps Azure KeyVaultSecret to our SecretMetadata interface
   */
  private mapToMetadata(secret: KeyVaultSecret): SecretMetadata {
    return {
      value: secret.value || '',
      version: secret.properties.version,
      expiresOn: secret.properties.expiresOn,
      createdOn: secret.properties.createdOn,
      updatedOn: secret.properties.updatedOn,
    };
  }

  /**
   * Gets the underlying SecretClient for advanced operations
   */
  getClient(): SecretClient {
    return this.client;
  }
}
