import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import { KeyClient } from '@azure/keyvault-keys';

/**
 * Configuration module that builds Azure connections for Blob Storage and Key Vault.
 * Reads endpoints from environment variables and authenticates with managed identity.
 * All connections share a single credential instance.
 */
export class AzureConfig {
  private static credential: DefaultAzureCredential | null = null;
  private static blobServiceClient: BlobServiceClient | null = null;
  private static keyClient: KeyClient | null = null;

  /**
   * Get or create a shared credential instance
   */
  static getCredential(): DefaultAzureCredential {
    if (!this.credential) {
      this.credential = new DefaultAzureCredential();
    }
    return this.credential;
  }

  /**
   * Get or create a Blob Storage client
   */
  static getBlobServiceClient(): BlobServiceClient {
    if (!this.blobServiceClient) {
      const storageAccountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL;
      if (!storageAccountUrl) {
        throw new Error('AZURE_STORAGE_ACCOUNT_URL environment variable is required');
      }
      
      this.blobServiceClient = new BlobServiceClient(
        storageAccountUrl,
        this.getCredential()
      );
    }
    return this.blobServiceClient;
  }

  /**
   * Get or create a Key Vault Key client
   */
  static getKeyClient(): KeyClient {
    if (!this.keyClient) {
      const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;
      if (!keyVaultUrl) {
        throw new Error('AZURE_KEYVAULT_URL environment variable is required');
      }
      
      this.keyClient = new KeyClient(
        keyVaultUrl,
        this.getCredential()
      );
    }
    return this.keyClient;
  }

  /**
   * Get the Key Vault key name to use for wrapping/unwrapping
   */
  static getKeyName(): string {
    const keyName = process.env.AZURE_KEYVAULT_KEY_NAME;
    if (!keyName) {
      throw new Error('AZURE_KEYVAULT_KEY_NAME environment variable is required');
    }
    return keyName;
  }

  /**
   * Get the container name for blob storage
   */
  static getContainerName(): string {
    return process.env.AZURE_STORAGE_CONTAINER_NAME || 'encrypted-files';
  }
}
