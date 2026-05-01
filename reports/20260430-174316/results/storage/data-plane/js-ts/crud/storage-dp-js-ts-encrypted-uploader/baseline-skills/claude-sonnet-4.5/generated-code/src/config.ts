import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import { KeyClient } from '@azure/keyvault-keys';

export interface AzureConfig {
  credential: DefaultAzureCredential;
  blobServiceClient: BlobServiceClient;
  keyClient: KeyClient;
  keyName: string;
}

/**
 * Configuration module that builds Azure connections for Blob Storage and Key Vault.
 * Reads endpoints from environment variables and authenticates with managed identity.
 * All connections share a single credential instance.
 */
export class AzureConfigManager {
  private static instance: AzureConfig | null = null;

  /**
   * Initialize and return the Azure configuration.
   * Requires the following environment variables:
   * - AZURE_STORAGE_ACCOUNT_URL: The Blob Storage account URL
   * - AZURE_KEY_VAULT_URL: The Key Vault URL
   * - AZURE_KEY_VAULT_KEY_NAME: The name of the key in Key Vault to use for wrapping
   */
  static getConfig(): AzureConfig {
    if (this.instance) {
      return this.instance;
    }

    const storageAccountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL;
    const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL;
    const keyName = process.env.AZURE_KEY_VAULT_KEY_NAME;

    if (!storageAccountUrl) {
      throw new Error('AZURE_STORAGE_ACCOUNT_URL environment variable is required');
    }

    if (!keyVaultUrl) {
      throw new Error('AZURE_KEY_VAULT_URL environment variable is required');
    }

    if (!keyName) {
      throw new Error('AZURE_KEY_VAULT_KEY_NAME environment variable is required');
    }

    // Create a single credential instance shared across all services
    const credential = new DefaultAzureCredential();

    // Initialize Blob Storage client
    const blobServiceClient = new BlobServiceClient(storageAccountUrl, credential);

    // Initialize Key Vault Keys client
    const keyClient = new KeyClient(keyVaultUrl, credential);

    this.instance = {
      credential,
      blobServiceClient,
      keyClient,
      keyName,
    };

    return this.instance;
  }

  /**
   * Reset the configuration instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}
