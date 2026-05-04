import { SecretClient, KeyVaultSecret, SecretProperties } from "@azure/keyvault-secrets";
import { RestError } from "@azure/core-rest-pipeline";

/**
 * Options for retrieving a secret
 */
export interface GetSecretOptions {
  version?: string;
  defaultValue?: string;
}

/**
 * Secret expiry information
 */
export interface SecretExpiryInfo {
  secretName: string;
  version: string;
  expiresOn: Date | undefined;
  isExpired: boolean;
  daysUntilExpiry: number | null;
}

/**
 * SecretProvider handles retrieval and inspection of secrets from Azure Key Vault
 */
export class SecretProvider {
  constructor(private readonly secretClient: SecretClient) {}

  /**
   * Get a secret by name with graceful error handling
   * @param secretName - Name of the secret
   * @param options - Options including version and default value
   * @returns The secret value or default value if not found
   */
  async getSecret(secretName: string, options?: GetSecretOptions): Promise<string> {
    try {
      const secret = await this.secretClient.getSecret(secretName, {
        version: options?.version,
      });
      return secret.value ?? options?.defaultValue ?? "";
    } catch (error) {
      if (error instanceof RestError && error.statusCode === 404) {
        console.log(`Secret '${secretName}' not found, using default value`);
        return options?.defaultValue ?? "";
      }
      throw error;
    }
  }

  /**
   * Get a specific version of a secret
   * @param secretName - Name of the secret
   * @param version - Version ID
   * @returns The secret value
   */
  async getSecretVersion(secretName: string, version: string): Promise<string> {
    return this.getSecret(secretName, { version });
  }

  /**
   * Get expiry information for a secret
   * @param secretName - Name of the secret
   * @param version - Optional version (defaults to latest)
   * @returns Expiry information including days until expiry
   */
  async getExpiryInfo(secretName: string, version?: string): Promise<SecretExpiryInfo> {
    const secret = await this.secretClient.getSecret(secretName, { version });
    const expiresOn = secret.properties.expiresOn;
    const now = new Date();

    let daysUntilExpiry: number | null = null;
    let isExpired = false;

    if (expiresOn) {
      const msUntilExpiry = expiresOn.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));
      isExpired = msUntilExpiry <= 0;
    }

    return {
      secretName,
      version: secret.properties.version ?? "",
      expiresOn,
      isExpired,
      daysUntilExpiry,
    };
  }

  /**
   * Check if a secret is near expiry
   * @param secretName - Name of the secret
   * @param warningDays - Days threshold for warning
   * @returns True if secret expires within warning window
   */
  async isNearExpiry(secretName: string, warningDays: number): Promise<boolean> {
    const expiryInfo = await this.getExpiryInfo(secretName);
    
    if (!expiryInfo.expiresOn) {
      return false;
    }

    return expiryInfo.daysUntilExpiry !== null && expiryInfo.daysUntilExpiry <= warningDays;
  }

  /**
   * List all versions of a secret
   * @param secretName - Name of the secret
   * @returns Array of secret properties for all versions
   */
  async listSecretVersions(secretName: string): Promise<SecretProperties[]> {
    const versions: SecretProperties[] = [];
    for await (const version of this.secretClient.listPropertiesOfSecretVersions(secretName)) {
      versions.push(version);
    }
    return versions;
  }
}
