import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { setLogLevel, AzureLogger } from '@azure/logger';

export interface StorageConfig {
  storageAccountEndpoint: string;
  maxRetries?: number;
  retryDelayMs?: number;
  logLevel?: 'verbose' | 'info' | 'warning' | 'error';
}

export class AzureStorageConfig {
  private blobServiceClient: BlobServiceClient;
  private config: Required<StorageConfig>;

  constructor(config: StorageConfig) {
    // Set defaults
    this.config = {
      storageAccountEndpoint: config.storageAccountEndpoint,
      maxRetries: config.maxRetries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      logLevel: config.logLevel ?? 'info'
    };

    // Configure SDK logging
    this.configureLogging(this.config.logLevel);

    // Create BlobServiceClient with managed identity
    const credential = new DefaultAzureCredential();
    
    this.blobServiceClient = new BlobServiceClient(
      this.config.storageAccountEndpoint,
      credential,
      {
        retryOptions: {
          maxTries: this.config.maxRetries,
          retryDelayInMs: this.config.retryDelayMs,
          // Exponential backoff
          maxRetryDelayInMs: this.config.retryDelayMs * Math.pow(2, this.config.maxRetries)
        }
      }
    );

    console.log(`✓ Azure Storage configured with managed identity`);
    console.log(`  Endpoint: ${this.config.storageAccountEndpoint}`);
    console.log(`  Max retries: ${this.config.maxRetries}`);
    console.log(`  Retry delay: ${this.config.retryDelayMs}ms (exponential backoff)`);
    console.log(`  Log level: ${this.config.logLevel}`);
  }

  private configureLogging(level: string): void {
    // Map log levels to Azure SDK log levels
    const logLevelMap: Record<string, any> = {
      'verbose': 'verbose',
      'info': 'info',
      'warning': 'warning',
      'error': 'error'
    };

    setLogLevel(logLevelMap[level] || 'info');

    // Set up logger to output to console
    AzureLogger.log = (...args) => {
      console.log('[Azure SDK]', ...args);
    };
  }

  public getBlobServiceClient(): BlobServiceClient {
    return this.blobServiceClient;
  }

  public getConfig(): Required<StorageConfig> {
    return { ...this.config };
  }
}

// Factory function to create configuration from environment
export function createStorageConfigFromEnv(): AzureStorageConfig {
  const endpoint = process.env.AZURE_STORAGE_ENDPOINT;
  
  if (!endpoint) {
    throw new Error('AZURE_STORAGE_ENDPOINT environment variable is required');
  }

  return new AzureStorageConfig({
    storageAccountEndpoint: endpoint,
    maxRetries: process.env.AZURE_STORAGE_MAX_RETRIES 
      ? parseInt(process.env.AZURE_STORAGE_MAX_RETRIES, 10) 
      : undefined,
    retryDelayMs: process.env.AZURE_STORAGE_RETRY_DELAY_MS 
      ? parseInt(process.env.AZURE_STORAGE_RETRY_DELAY_MS, 10) 
      : undefined,
    logLevel: (process.env.AZURE_STORAGE_LOG_LEVEL as any) || undefined
  });
}
