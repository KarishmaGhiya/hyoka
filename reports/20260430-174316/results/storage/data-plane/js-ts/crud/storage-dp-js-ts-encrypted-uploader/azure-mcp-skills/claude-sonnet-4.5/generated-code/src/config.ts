import { BlobServiceClient } from '@azure/storage-blob';
import { KeyClient } from '@azure/keyvault-keys';
import { DefaultAzureCredential } from '@azure/identity';

export interface AzureConfig {
  blobServiceClient: BlobServiceClient;
  keyClient: KeyClient;
  keyName: string;
  credential: DefaultAzureCredential;
  keyVaultUrl: string;
}

/**
 * Configuration module that builds Azure connections for Blob Storage and Key Vault.
 * Uses managed identity authentication with a single shared credential instance.
 */
export class ConfigurationManager {
  private credential: DefaultAzureCredential;

  constructor() {
    this.credential = new DefaultAzureCredential();
  }

  /**
   * Initialize and return Azure service clients.
   * Reads configuration from environment variables:
   * - AZURE_STORAGE_ACCOUNT_NAME: Storage account name
   * - AZURE_KEY_VAULT_URL: Key Vault endpoint (e.g., https://myvault.vault.azure.net/)
   * - AZURE_KEY_VAULT_KEY_NAME: Name of the key in Key Vault
   */
  public getConfig(): AzureConfig {
    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL;
    const keyName = process.env.AZURE_KEY_VAULT_KEY_NAME;

    if (!storageAccountName) {
      throw new Error('AZURE_STORAGE_ACCOUNT_NAME environment variable is required');
    }

    if (!keyVaultUrl) {
      throw new Error('AZURE_KEY_VAULT_URL environment variable is required');
    }

    if (!keyName) {
      throw new Error('AZURE_KEY_VAULT_KEY_NAME environment variable is required');
    }

    const blobServiceUrl = `https://${storageAccountName}.blob.core.windows.net`;
    const blobServiceClient = new BlobServiceClient(blobServiceUrl, this.credential);
    const keyClient = new KeyClient(keyVaultUrl, this.credential);

    return {
      blobServiceClient,
      keyClient,
      keyName,
      credential: this.credential,
      keyVaultUrl
    };
  }
}
