import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient, StorageRetryPolicyType, StorageRetryOptions } from '@azure/storage-blob';
import { setLogLevel, AzureLogger } from '@azure/logger';
import * as dotenv from 'dotenv';

dotenv.config();

export interface BlobStorageConfig {
  accountName: string;
  containerName: string;
  maxRetries: number;
  retryDelayMs: number;
  logLevel: 'verbose' | 'info' | 'warning' | 'error';
}

export class BlobStorageConfiguration {
  private config: BlobStorageConfig;
  private blobServiceClient: BlobServiceClient;

  constructor() {
    this.config = this.loadConfig();
    this.setupLogging();
    this.blobServiceClient = this.createBlobServiceClient();
  }

  private loadConfig(): BlobStorageConfig {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

    if (!accountName) {
      throw new Error('AZURE_STORAGE_ACCOUNT_NAME environment variable is required');
    }

    if (!containerName) {
      throw new Error('AZURE_STORAGE_CONTAINER_NAME environment variable is required');
    }

    return {
      accountName,
      containerName,
      maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
      retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '800', 10),
      logLevel: (process.env.LOG_LEVEL as BlobStorageConfig['logLevel']) || 'info',
    };
  }

  private setupLogging(): void {
    setLogLevel(this.config.logLevel);

    AzureLogger.log = (...args) => {
      console.log('[Azure SDK]', ...args);
    };
  }

  private createBlobServiceClient(): BlobServiceClient {
    const credential = new DefaultAzureCredential();
    const accountUrl = `https://${this.config.accountName}.blob.core.windows.net`;

    const retryOptions: StorageRetryOptions = {
      retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
      maxRetries: this.config.maxRetries,
      retryDelayInMs: this.config.retryDelayMs,
      maxRetryDelayInMs: this.config.retryDelayMs * 10,
    };

    return new BlobServiceClient(accountUrl, credential, {
      retryOptions,
    });
  }

  public getBlobServiceClient(): BlobServiceClient {
    return this.blobServiceClient;
  }

  public getContainerName(): string {
    return this.config.containerName;
  }

  public getConfig(): BlobStorageConfig {
    return { ...this.config };
  }
}
