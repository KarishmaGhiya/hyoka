import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';

export interface SecretInfo {
  value: string;
  version?: string;
  expiresOn?: Date;
  name: string;
}

export class SecretProvider {
  constructor(private client: SecretClient) {}

  async getSecret(name: string, defaultValue?: string): Promise<string> {
    try {
      const secret = await this.client.getSecret(name);
      return secret.value || defaultValue || '';
    } catch (error: any) {
      if (error.statusCode === 404) {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        throw new Error(`Secret '${name}' not found and no default value provided`);
      }
      throw error;
    }
  }

  async getSecretVersion(name: string, version: string, defaultValue?: string): Promise<string> {
    try {
      const secret = await this.client.getSecret(name, { version });
      return secret.value || defaultValue || '';
    } catch (error: any) {
      if (error.statusCode === 404) {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        throw new Error(`Secret '${name}' version '${version}' not found and no default value provided`);
      }
      throw error;
    }
  }

  async getSecretInfo(name: string): Promise<SecretInfo | null> {
    try {
      const secret = await this.client.getSecret(name);
      return {
        name: secret.name,
        value: secret.value || '',
        version: secret.properties.version,
        expiresOn: secret.properties.expiresOn,
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async isSecretExpiringSoon(name: string, warningWindowDays: number): Promise<boolean> {
    const info = await this.getSecretInfo(name);
    if (!info || !info.expiresOn) {
      return false;
    }

    const now = new Date();
    const warningDate = new Date(now.getTime() + warningWindowDays * 24 * 60 * 60 * 1000);
    return info.expiresOn <= warningDate;
  }
}
