import { SecretClient, KeyVaultSecret } from "@azure/keyvault-secrets";

export interface SecretMetadata {
  name: string;
  value: string;
  version?: string;
  expiresOn?: Date;
  createdOn?: Date;
  updatedOn?: Date;
}

export class SecretProvider {
  constructor(private client: SecretClient) {}

  /**
   * Retrieve a secret by name with graceful handling for missing secrets
   */
  async getSecret(
    name: string,
    defaultValue?: string
  ): Promise<string | undefined> {
    try {
      const secret = await this.client.getSecret(name);
      return secret.value;
    } catch (error: any) {
      if (error.code === "SecretNotFound") {
        return defaultValue;
      }
      throw error;
    }
  }

  /**
   * Retrieve a specific version of a secret
   */
  async getSecretVersion(
    name: string,
    version: string,
    defaultValue?: string
  ): Promise<string | undefined> {
    try {
      const secret = await this.client.getSecret(name, { version });
      return secret.value;
    } catch (error: any) {
      if (error.code === "SecretNotFound") {
        return defaultValue;
      }
      throw error;
    }
  }

  /**
   * Get full secret metadata including expiry date
   */
  async getSecretMetadata(name: string): Promise<SecretMetadata | null> {
    try {
      const secret = await this.client.getSecret(name);
      return {
        name: secret.name,
        value: secret.value!,
        version: secret.properties.version,
        expiresOn: secret.properties.expiresOn,
        createdOn: secret.properties.createdOn,
        updatedOn: secret.properties.updatedOn,
      };
    } catch (error: any) {
      if (error.code === "SecretNotFound") {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if a secret is expiring within the specified warning window (in days)
   */
  isSecretExpiring(metadata: SecretMetadata, warningDays: number): boolean {
    if (!metadata.expiresOn) {
      return false;
    }

    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + warningDays);

    return metadata.expiresOn <= warningDate;
  }

  /**
   * Get days until expiration (negative if expired)
   */
  getDaysUntilExpiration(metadata: SecretMetadata): number | null {
    if (!metadata.expiresOn) {
      return null;
    }

    const now = new Date();
    const diffMs = metadata.expiresOn.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}
