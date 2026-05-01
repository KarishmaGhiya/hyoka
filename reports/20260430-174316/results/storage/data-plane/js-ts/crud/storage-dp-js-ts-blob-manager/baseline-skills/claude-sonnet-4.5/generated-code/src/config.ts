import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient, StorageRetryPolicyType, StorageRetryOptions } from '@azure/storage-blob';
import { setLogLevel, AzureLogger } from '@azure/logger';

/**
 * Configuration options for Azure Blob Storage
 */
export interface BlobStorageConfig {
  /** Azure Storage account endpoint (e.g., https://mystorageaccount.blob.core.windows.net) */
  accountEndpoint: string;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Maximum delay between retries in milliseconds */
  maxRetryDelayMs?: number;
  /** Log level: 'verbose' | 'info' | 'warning' | 'error' */
  logLevel?: 'verbose' | 'info' | 'warning' | 'error';
}

/**
 * Creates and configures a BlobServiceClient with managed identity authentication,
 * custom retry policy, and logging
 */
export class BlobStorageConfiguration {
  private blobServiceClient: BlobServiceClient;
  private config: BlobStorageConfig;

  constructor(config: BlobStorageConfig) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      maxRetryDelayMs: config.maxRetryDelayMs ?? 60000,
      logLevel: config.logLevel ?? 'info',
      ...config,
    };

    this.configureLogs();
    this.blobServiceClient = this.createBlobServiceClient();
  }

  /**
   * Configure Azure SDK logging
   */
  private configureLogs(): void {
    setLogLevel(this.config.logLevel!);
    
    // Optional: Add custom log listener for debugging
    AzureLogger.log = (message: string) => {
      console.log(`[Azure SDK] ${message}`);
    };
  }

  /**
   * Create BlobServiceClient with managed identity and custom retry policy
   */
  private createBlobServiceClient(): BlobServiceClient {
    // Use DefaultAzureCredential for managed identity in Azure
    const credential = new DefaultAzureCredential();

    // Configure exponential backoff retry policy
    const retryOptions: StorageRetryOptions = {
      retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
      maxTries: this.config.maxRetries!,
      maxRetryDelayInMs: this.config.maxRetryDelayMs!,
      // Optional: Configure other retry settings
      retryDelayInMs: 1000, // Initial delay
    };

    return new BlobServiceClient(this.config.accountEndpoint, credential, {
      retryOptions,
    });
  }

  /**
   * Get the configured BlobServiceClient
   */
  public getClient(): BlobServiceClient {
    return this.blobServiceClient;
  }

  /**
   * Get a container client
   */
  public getContainerClient(containerName: string) {
    return this.blobServiceClient.getContainerClient(containerName);
  }
}

/**
 * Factory function to create BlobStorageConfiguration from environment variables
 */
export function createBlobStorageConfig(): BlobStorageConfiguration {
  const accountEndpoint = process.env.AZURE_STORAGE_ACCOUNT_ENDPOINT;
  
  if (!accountEndpoint) {
    throw new Error('AZURE_STORAGE_ACCOUNT_ENDPOINT environment variable is required');
  }

  return new BlobStorageConfiguration({
    accountEndpoint,
    maxRetries: parseInt(process.env.AZURE_STORAGE_MAX_RETRIES || '3', 10),
    maxRetryDelayMs: parseInt(process.env.AZURE_STORAGE_MAX_RETRY_DELAY_MS || '60000', 10),
    logLevel: (process.env.AZURE_LOG_LEVEL as any) || 'info',
  });
}
