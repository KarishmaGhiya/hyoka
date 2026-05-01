import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient, StorageRetryPolicyType, StorageRetryOptions } from '@azure/storage-blob';
import { setLogLevel, AzureLogger } from '@azure/logger';
import * as dotenv from 'dotenv';

dotenv.config();

export interface AzureBlobConfig {
  endpoint: string;
  containerName: string;
  retryOptions: StorageRetryOptions;
  logLevel: string;
}

export class BlobStorageConfig {
  private static instance: BlobStorageConfig;
  private blobServiceClient: BlobServiceClient;
  public readonly config: AzureBlobConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.configureLogging();
    this.blobServiceClient = this.createBlobServiceClient();
  }

  public static getInstance(): BlobStorageConfig {
    if (!BlobStorageConfig.instance) {
      BlobStorageConfig.instance = new BlobStorageConfig();
    }
    return BlobStorageConfig.instance;
  }

  private loadConfig(): AzureBlobConfig {
    const endpoint = process.env.AZURE_STORAGE_ACCOUNT_ENDPOINT;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'demo-container';
    
    if (!endpoint) {
      throw new Error('AZURE_STORAGE_ACCOUNT_ENDPOINT environment variable is required');
    }

    const retryOptions: StorageRetryOptions = {
      retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
      maxRetries: parseInt(process.env.RETRY_MAX_RETRIES || '3', 10),
      maxRetryDelayInMs: parseInt(process.env.RETRY_MAX_DELAY_MS || '60000', 10),
      tryTimeoutInMs: 30000,
    };

    const logLevel = process.env.AZURE_LOG_LEVEL || 'info';

    return {
      endpoint,
      containerName,
      retryOptions,
      logLevel,
    };
  }

  private configureLogging(): void {
    const levelMap: { [key: string]: string } = {
      verbose: 'verbose',
      info: 'info',
      warning: 'warning',
      error: 'error',
    };

    const level = levelMap[this.config.logLevel.toLowerCase()] || 'info';
    setLogLevel(level as any);

    AzureLogger.log = (...args) => {
      console.log('[Azure SDK]', ...args);
    };
  }

  private createBlobServiceClient(): BlobServiceClient {
    const credential = new DefaultAzureCredential();
    
    return new BlobServiceClient(
      this.config.endpoint,
      credential,
      {
        retryOptions: this.config.retryOptions,
      }
    );
  }

  public getBlobServiceClient(): BlobServiceClient {
    return this.blobServiceClient;
  }

  public getContainerName(): string {
    return this.config.containerName;
  }
}
