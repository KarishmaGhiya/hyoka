import { ManagedIdentityCredential } from "@azure/identity";
import { KeyClient } from "@azure/keyvault-keys";
import { BlobServiceClient } from "@azure/storage-blob";

export interface AzureConfig {
  keyVaultUrl: string;
  storageAccountName: string;
  keyName: string;
  containerName: string;
}

export class AzureClientFactory {
  private readonly credential: ManagedIdentityCredential;
  private readonly config: AzureConfig;

  constructor(config?: Partial<AzureConfig>) {
    // Read configuration from environment variables
    this.config = {
      keyVaultUrl: config?.keyVaultUrl || process.env.KEY_VAULT_URL || "",
      storageAccountName: config?.storageAccountName || process.env.AZURE_STORAGE_ACCOUNT_NAME || "",
      keyName: config?.keyName || process.env.KEY_VAULT_KEY_NAME || "encryption-key",
      containerName: config?.containerName || process.env.CONTAINER_NAME || "encrypted-files",
    };

    // Validate configuration
    if (!this.config.keyVaultUrl) {
      throw new Error("KEY_VAULT_URL environment variable is required");
    }
    if (!this.config.storageAccountName) {
      throw new Error("AZURE_STORAGE_ACCOUNT_NAME environment variable is required");
    }

    // Create a single shared credential instance for all Azure services
    this.credential = new ManagedIdentityCredential();
  }

  getKeyClient(): KeyClient {
    return new KeyClient(this.config.keyVaultUrl, this.credential);
  }

  getBlobServiceClient(): BlobServiceClient {
    const blobEndpoint = `https://${this.config.storageAccountName}.blob.core.windows.net`;
    return new BlobServiceClient(blobEndpoint, this.credential);
  }

  getConfig(): AzureConfig {
    return { ...this.config };
  }
}
