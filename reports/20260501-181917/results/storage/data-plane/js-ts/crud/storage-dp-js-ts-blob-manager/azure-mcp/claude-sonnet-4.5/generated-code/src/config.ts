import { BlobServiceClient, StorageRetryPolicyType, StorageRetryOptions } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { setLogLevel, AzureLogger } from '@azure/logger';
import * as dotenv from 'dotenv';

dotenv.config();

export interface BlobStorageConfig {
  endpoint: string;
  containerName: string;
  maxRetries: number;
  retryDelayMs: number;
  logLevel: 'verbose' | 'info' | 'warning' | 'error';
}

export class BlobStorageConfiguration {
  private static instance: BlobStorageConfiguration;
  private blobServiceClient: BlobServiceClient;
  public readonly config: BlobStorageConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.configureLogging();
    this.blobServiceClient = this.createBlobServiceClient();
  }

  public static getInstance(): BlobStorageConfiguration {
    if (!BlobStorageConfiguration.instance) {
      BlobStorageConfiguration.instance = new BlobStorageConfiguration();
    }
    return BlobStorageConfiguration.instance;
  }

  private loadConfig(): BlobStorageConfig {
    const endpoint = process.env.AZURE_STORAGE_ACCOUNT_ENDPOINT;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

    if (!endpoint) {
      throw new Error('AZURE_STORAGE_ACCOUNT_ENDPOINT environment variable is required');
    }

    if (!containerName) {
      throw new Error('AZURE_STORAGE_CONTAINER_NAME environment variable is required');
    }

    return {
      endpoint,
      containerName,
      maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
      retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
      logLevel: (process.env.LOG_LEVEL as any) || 'info'
    };
  }

  private configureLogging(): void {
    setLogLevel(this.config.logLevel);
    
    // Optional: Add custom logging handlers
    AzureLogger.log = (level, message) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [Azure SDK ${level}] ${message}`);
    };
  }

  private createBlobServiceClient(): BlobServiceClient {
    const credential = new DefaultAzureCredential();

    const retryOptions: StorageRetryOptions = {
      retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
      maxTries: this.config.maxRetries,
      retryDelayInMs: this.config.retryDelayMs,
      maxRetryDelayInMs: this.config.retryDelayMs * Math.pow(2, this.config.maxRetries),
      tryTimeoutInMs: 60000 // 60 seconds per attempt
    };

    return new BlobServiceClient(this.config.endpoint, credential, {
      retryOptions
    });
  }

  public getBlobServiceClient(): BlobServiceClient {
    return this.blobServiceClient;
  }

  public getContainerName(): string {
    return this.config.containerName;
  }
}
