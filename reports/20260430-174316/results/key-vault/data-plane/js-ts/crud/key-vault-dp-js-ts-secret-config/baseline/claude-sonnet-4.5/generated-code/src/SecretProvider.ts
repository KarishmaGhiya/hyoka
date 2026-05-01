import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

export interface SecretMetadata {
  name: string;
  value: string;
  version?: string;
  expiresOn?: Date;
  enabled?: boolean;
}

export class SecretProvider {
  private client: SecretClient;

  constructor(vaultUrl: string) {
    const credential = new DefaultAzureCredential();
    this.client = new SecretClient(vaultUrl, credential);
  }

  /**
   * Retrieves a secret by name. Returns default value if secret doesn't exist.
   */
  async getSecret(
    secretName: string,
    defaultValue?: string
  ): Promise<string | undefined> {
    try {
      const secret = await this.client.getSecret(secretName);
      return secret.value;
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.warn(
          `Secret '${secretName}' not found, returning default value`
        );
        return defaultValue;
      }
      throw error;
    }
  }

  /**
   * Retrieves a specific version of a secret.
   */
  async getSecretVersion(
    secretName: string,
    version: string
  ): Promise<string | undefined> {
    try {
      const secret = await this.client.getSecret(secretName, { version });
      return secret.value;
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.warn(
          `Secret '${secretName}' version '${version}' not found`
        );
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Retrieves secret metadata including expiry date.
   */
  async getSecretMetadata(secretName: string): Promise<SecretMetadata | null> {
    try {
      const secret = await this.client.getSecret(secretName);
      return {
        name: secret.name,
        value: secret.value || '',
        version: secret.properties.version,
        expiresOn: secret.properties.expiresOn,
        enabled: secret.properties.enabled,
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.warn(`Secret '${secretName}' not found`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Checks if a secret is expiring within the specified days.
   */
  async isSecretExpiringSoon(
    secretName: string,
    daysBeforeExpiry: number
  ): Promise<boolean> {
    const metadata = await this.getSecretMetadata(secretName);
    if (!metadata || !metadata.expiresOn) {
      return false;
    }

    const now = new Date();
    const warningDate = new Date(now);
    warningDate.setDate(warningDate.getDate() + daysBeforeExpiry);

    return metadata.expiresOn <= warningDate;
  }

  /**
   * Lists all versions of a secret.
   */
  async listSecretVersions(secretName: string): Promise<string[]> {
    const versions: string[] = [];
    try {
      const propertiesIterator = this.client.listPropertiesOfSecretVersions(
        secretName
      );
      for await (const properties of propertiesIterator) {
        if (properties.version) {
          versions.push(properties.version);
        }
      }
    } catch (error: any) {
      console.warn(`Failed to list versions for secret '${secretName}'`);
    }
    return versions;
  }
}
