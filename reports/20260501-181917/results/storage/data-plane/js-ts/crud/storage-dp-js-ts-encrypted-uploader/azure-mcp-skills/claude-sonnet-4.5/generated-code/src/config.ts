import { BlobServiceClient } from "@azure/storage-blob";
import { KeyClient, CryptographyClient } from "@azure/keyvault-keys";
import { ManagedIdentityCredential } from "@azure/identity";

export interface AzureConfig {
  storageAccountName: string;
  keyVaultName: string;
  keyName: string;
  containerName: string;
}

export class AzureConnections {
  private credential: ManagedIdentityCredential;
  private config: AzureConfig;

  public blobServiceClient: BlobServiceClient;
  public keyClient: KeyClient;

  constructor(config: AzureConfig) {
    this.config = config;
    
    // Single shared credential instance
    this.credential = new ManagedIdentityCredential();

    // Initialize Blob Storage client
    const storageUrl = `https://${config.storageAccountName}.blob.core.windows.net`;
    this.blobServiceClient = new BlobServiceClient(storageUrl, this.credential);

    // Initialize Key Vault client
    const vaultUrl = `https://${config.keyVaultName}.vault.azure.net`;
    this.keyClient = new KeyClient(vaultUrl, this.credential);
  }

  /**
   * Creates a CryptographyClient for the configured key
   */
  public getCryptographyClient(keyId: string): CryptographyClient {
    return new CryptographyClient(keyId, this.credential);
  }

  /**
   * Loads configuration from environment variables
   */
  public static fromEnvironment(): AzureConnections {
    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const keyVaultName = process.env.AZURE_KEYVAULT_NAME;
    const keyName = process.env.AZURE_KEY_NAME;
    const containerName = process.env.AZURE_CONTAINER_NAME || "encrypted-files";

    if (!storageAccountName) {
      throw new Error("AZURE_STORAGE_ACCOUNT_NAME environment variable is required");
    }
    if (!keyVaultName) {
      throw new Error("AZURE_KEYVAULT_NAME environment variable is required");
    }
    if (!keyName) {
      throw new Error("AZURE_KEY_NAME environment variable is required");
    }

    return new AzureConnections({
      storageAccountName,
      keyVaultName,
      keyName,
      containerName,
    });
  }

  public getConfig(): AzureConfig {
    return this.config;
  }
}
