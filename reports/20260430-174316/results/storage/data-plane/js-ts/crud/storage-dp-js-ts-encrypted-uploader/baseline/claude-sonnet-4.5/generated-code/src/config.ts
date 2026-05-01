import { DefaultAzureCredential } from '@azure/identity';
import { KeyClient } from '@azure/keyvault-keys';
import { BlobServiceClient } from '@azure/storage-blob';
import { KeyManagementService } from './keyManagement';
import * as dotenv from 'dotenv';

dotenv.config();

export interface AzureConfig {
  keyVaultUrl: string;
  keyVaultKeyName: string;
  storageAccountUrl: string;
  storageContainerName: string;
}

export class AzureConnectionManager {
  private credential: DefaultAzureCredential;
  private keyClient: KeyClient | null = null;
  private blobServiceClient: BlobServiceClient | null = null;
  private config: AzureConfig;

  constructor() {
    // Shared credential instance for all Azure services
    this.credential = new DefaultAzureCredential();

    // Read configuration from environment variables
    this.config = {
      keyVaultUrl: this.getRequiredEnvVar('KEY_VAULT_URL'),
      keyVaultKeyName: this.getRequiredEnvVar('KEY_VAULT_KEY_NAME'),
      storageAccountUrl: this.getRequiredEnvVar('STORAGE_ACCOUNT_URL'),
      storageContainerName: this.getRequiredEnvVar('STORAGE_CONTAINER_NAME'),
    };
  }

  private getRequiredEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
  }

  getConfig(): AzureConfig {
    return { ...this.config };
  }

  getKeyClient(): KeyClient {
    if (!this.keyClient) {
      this.keyClient = new KeyClient(this.config.keyVaultUrl, this.credential);
    }
    return this.keyClient;
  }

  getBlobServiceClient(): BlobServiceClient {
    if (!this.blobServiceClient) {
      this.blobServiceClient = new BlobServiceClient(
        this.config.storageAccountUrl,
        this.credential
      );
    }
    return this.blobServiceClient;
  }

  getContainerClient() {
    return this.getBlobServiceClient().getContainerClient(
      this.config.storageContainerName
    );
  }

  getKeyManagementService(): KeyManagementService {
    return new KeyManagementService(
      this.getKeyClient(),
      this.config.keyVaultKeyName,
      this.credential
    );
  }
}
