import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';

export interface SecretMetadata {
  value: string;
  version?: string;
  expiresOn?: Date;
  enabled?: boolean;
}

export class SecretProvider {
  private client: SecretClient;

  constructor(client: SecretClient) {
    this.client = client;
  }

  /**
   * Retrieves a secret by name from Key Vault
   * @param secretName The name of the secret
   * @param defaultValue Value to return if secret doesn't exist
   * @param version Optional specific version of the secret
   * @returns Secret metadata or default value
   */
  async getSecret(
    secretName: string,
    defaultValue?: string,
    version?: string
  ): Promise<SecretMetadata | null> {
    try {
      const secret = version
        ? await this.client.getSecret(secretName, { version })
        : await this.client.getSecret(secretName);

      return this.mapToMetadata(secret);
    } catch (error: any) {
      if (error.statusCode === 404 || error.code === 'SecretNotFound') {
        console.warn(`Secret '${secretName}' not found, returning default value`);
        return defaultValue ? { value: defaultValue } : null;
      }
      console.error(`Error retrieving secret '${secretName}':`, error.message);
      throw error;
    }
  }

  /**
   * Checks if a secret is near expiry
   * @param secretName The name of the secret
   * @param warningDays Number of days before expiry to warn
   * @returns True if secret expires within warning window
   */
  async isNearExpiry(secretName: string, warningDays: number = 7): Promise<boolean> {
    const secret = await this.getSecret(secretName);
    if (!secret || !secret.expiresOn) {
      return false;
    }

    const now = new Date();
    const warningDate = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);
    return secret.expiresOn <= warningDate;
  }

  /**
   * Gets the expiry date of a secret
   * @param secretName The name of the secret
   * @returns Expiry date or null if not set
   */
  async getSecretExpiry(secretName: string): Promise<Date | null> {
    const secret = await this.getSecret(secretName);
    return secret?.expiresOn || null;
  }

  /**
   * Lists all versions of a secret
   * @param secretName The name of the secret
   * @returns Array of version IDs
   */
  async listSecretVersions(secretName: string): Promise<string[]> {
    const versions: string[] = [];
    try {
      for await (const properties of this.client.listPropertiesOfSecretVersions(secretName)) {
        if (properties.version) {
          versions.push(properties.version);
        }
      }
    } catch (error: any) {
      console.error(`Error listing versions for '${secretName}':`, error.message);
    }
    return versions;
  }

  private mapToMetadata(secret: KeyVaultSecret): SecretMetadata {
    return {
      value: secret.value || '',
      version: secret.properties.version,
      expiresOn: secret.properties.expiresOn,
      enabled: secret.properties.enabled,
    };
  }
}
