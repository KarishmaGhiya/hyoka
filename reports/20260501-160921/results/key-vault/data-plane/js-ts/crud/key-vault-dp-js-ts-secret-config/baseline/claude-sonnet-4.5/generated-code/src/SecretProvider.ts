import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';

export interface SecretInfo {
  name: string;
  value: string;
  version?: string;
  expiresOn?: Date;
}

export class SecretProvider {
  constructor(private client: SecretClient) {}

  async getSecret(
    name: string,
    defaultValue?: string
  ): Promise<string | undefined> {
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

  async getSecretVersion(
    name: string,
    version: string,
    defaultValue?: string
  ): Promise<string | undefined> {
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

  async getSecretWithMetadata(
    name: string,
    defaultValue?: string
  ): Promise<SecretInfo | undefined> {
    try {
      const secret = await this.client.getSecret(name);
      return {
        name: secret.name,
        value: secret.value || '',
        version: secret.properties.version,
        expiresOn: secret.properties.expiresOn,
      };
    } catch (error: any) {
      if (error.statusCode === 404 && defaultValue !== undefined) {
        return {
          name,
          value: defaultValue,
        };
      }
      throw error;
    }
  }

  async getSecretExpiryDate(name: string): Promise<Date | undefined> {
    try {
      const secret = await this.client.getSecret(name);
      return secret.properties.expiresOn;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async isSecretExpiringSoon(
    name: string,
    warningWindowDays: number = 7
  ): Promise<boolean> {
    const expiryDate = await this.getSecretExpiryDate(name);
    if (!expiryDate) {
      return false;
    }

    const warningThreshold = new Date();
    warningThreshold.setDate(warningThreshold.getDate() + warningWindowDays);

    return expiryDate <= warningThreshold;
  }
}
