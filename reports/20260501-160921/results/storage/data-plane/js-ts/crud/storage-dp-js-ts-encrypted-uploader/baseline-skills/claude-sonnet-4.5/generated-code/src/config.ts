import { DefaultAzureCredential, TokenCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { KeyClient } from "@azure/keyvault-keys";

/**
 * Configuration module that builds Azure connections for Blob Storage and Key Vault.
 * Reads endpoints from environment variables and authenticates with managed identity.
 */
export class AzureConfig {
  private static credentialInstance: TokenCredential | null = null;

  /**
   * Get a shared credential instance (singleton pattern).
   * Uses DefaultAzureCredential which works with managed identity in production
   * and falls back to developer credentials (Azure CLI, etc.) in local development.
   */
  static getCredential(): TokenCredential {
    if (!this.credentialInstance) {
      this.credentialInstance = new DefaultAzureCredential();
    }
    return this.credentialInstance;
  }

  /**
   * Create a BlobServiceClient from environment variables.
   * Expects: AZURE_STORAGE_ACCOUNT_NAME
   */
  static createBlobServiceClient(): BlobServiceClient {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) {
      throw new Error("AZURE_STORAGE_ACCOUNT_NAME environment variable is required");
    }

    const blobEndpoint = `https://${accountName}.blob.core.windows.net`;
    const credential = this.getCredential();

    return new BlobServiceClient(blobEndpoint, credential);
  }

  /**
   * Create a KeyClient from environment variables.
   * Expects: AZURE_KEY_VAULT_URL (e.g., https://myvault.vault.azure.net)
   */
  static createKeyClient(): KeyClient {
    const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
    if (!vaultUrl) {
      throw new Error("AZURE_KEY_VAULT_URL environment variable is required");
    }

    const credential = this.getCredential();

    return new KeyClient(vaultUrl, credential);
  }

  /**
   * Get the Key Vault key name to use for envelope encryption.
   * Expects: AZURE_KEY_VAULT_KEY_NAME
   */
  static getKeyName(): string {
    const keyName = process.env.AZURE_KEY_VAULT_KEY_NAME;
    if (!keyName) {
      throw new Error("AZURE_KEY_VAULT_KEY_NAME environment variable is required");
    }
    return keyName;
  }

  /**
   * Get the container name for blob storage.
   * Expects: AZURE_STORAGE_CONTAINER_NAME
   */
  static getContainerName(): string {
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    if (!containerName) {
      throw new Error("AZURE_STORAGE_CONTAINER_NAME environment variable is required");
    }
    return containerName;
  }
}
