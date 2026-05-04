import { SecretClient, KeyVaultSecret } from "@azure/keyvault-secrets";
import { TokenCredential } from "@azure/core-auth";

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

  constructor(vaultUrl: string, credential: TokenCredential) {
    this.client = new SecretClient(vaultUrl, credential);
  }

  /**
   * Retrieves a secret by name, with graceful handling if it doesn't exist.
   * @param secretName - The name of the secret to retrieve
   * @param defaultValue - Value to return if the secret doesn't exist
   * @returns The secret value or the default value
   */
  async getSecret(secretName: string, defaultValue?: string): Promise<string> {
    try {
      const secret = await this.client.getSecret(secretName);
      return secret.value || defaultValue || "";
    } catch (error: any) {
      if (error.statusCode === 404 || error.code === "SecretNotFound") {
        console.warn(`Secret '${secretName}' not found. Using default value.`);
        return defaultValue || "";
      }
      throw error;
    }
  }

  /**
   * Retrieves a specific version of a secret.
   * @param secretName - The name of the secret
   * @param version - The version identifier of the secret
   * @returns The secret value from the specified version
   */
  async getSecretVersion(secretName: string, version: string): Promise<string> {
    try {
      const secret = await this.client.getSecret(secretName, { version });
      return secret.value || "";
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error(
          `Secret '${secretName}' version '${version}' not found`
        );
      }
      throw error;
    }
  }

  /**
   * Retrieves full metadata about a secret including expiry date.
   * @param secretName - The name of the secret
   * @returns SecretMetadata with all available information
   */
  async getSecretMetadata(secretName: string): Promise<SecretMetadata> {
    const secret = await this.client.getSecret(secretName);
    return this.extractMetadata(secret);
  }

  /**
   * Checks if a secret is expiring within a specified number of days.
   * @param secretName - The name of the secret to check
   * @param warningDays - Number of days before expiry to trigger warning
   * @returns true if the secret expires within the warning window
   */
  async isSecretExpiring(
    secretName: string,
    warningDays: number
  ): Promise<boolean> {
    try {
      const metadata = await this.getSecretMetadata(secretName);
      if (!metadata.expiresOn) {
        return false; // No expiry date set
      }

      const now = new Date();
      const warningDate = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);
      return metadata.expiresOn <= warningDate;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Lists all versions of a secret.
   * @param secretName - The name of the secret
   * @returns Array of version identifiers
   */
  async listSecretVersions(secretName: string): Promise<string[]> {
    const versions: string[] = [];
    for await (const properties of this.client.listPropertiesOfSecretVersions(
      secretName
    )) {
      if (properties.version) {
        versions.push(properties.version);
      }
    }
    return versions;
  }

  private extractMetadata(secret: KeyVaultSecret): SecretMetadata {
    return {
      name: secret.name,
      value: secret.value || "",
      version: secret.properties.version,
      expiresOn: secret.properties.expiresOn,
      createdOn: secret.properties.createdOn,
      updatedOn: secret.properties.updatedOn,
    };
  }
}
