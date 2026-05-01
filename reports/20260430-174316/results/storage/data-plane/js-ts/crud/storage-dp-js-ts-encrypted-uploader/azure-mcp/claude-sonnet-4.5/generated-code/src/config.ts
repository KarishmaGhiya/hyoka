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
 * Configuration module that builds necessary Azure connections
 * for both Blob Storage and Key Vault using managed identity authentication.
 */
export class ConfigurationManager {
  private static instance: AzureConfig | null = null;

  /**
   * Get or create a singleton configuration instance
   */
  static getConfig(): AzureConfig {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = ConfigurationManager.createConfig();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Create Azure service clients with shared credential
   */
  private static createConfig(): AzureConfig {
    // Read configuration from environment variables
    const storageAccountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL;
    const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;
    const keyName = process.env.AZURE_KEYVAULT_KEY_NAME;

    if (!storageAccountUrl) {
      throw new Error('AZURE_STORAGE_ACCOUNT_URL environment variable is required');
    }

    if (!keyVaultUrl) {
      throw new Error('AZURE_KEYVAULT_URL environment variable is required');
    }

    if (!keyName) {
      throw new Error('AZURE_KEYVAULT_KEY_NAME environment variable is required');
    }

    // Create a single credential instance shared across all services
    const credential = new DefaultAzureCredential();

    // Initialize Blob Service Client
    const blobServiceClient = new BlobServiceClient(storageAccountUrl, credential);

    // Initialize Key Vault Key Client
    const keyClient = new KeyClient(keyVaultUrl, credential);

    return {
      credential,
      blobServiceClient,
      keyClient,
      keyName,
    };
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    ConfigurationManager.instance = null;
  }
}
