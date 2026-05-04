import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient, StorageRetryPolicyType, StorageRetryOptions } from '@azure/storage-blob';
import { setLogLevel, AzureLogger } from '@azure/logger';

/**
 * Configuration options for Azure Blob Storage
 */
export interface BlobStorageConfig {
  /**
   * Azure Storage account endpoint (e.g., https://<account>.blob.core.windows.net)
   */
  accountEndpoint: string;
  
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
  
  /**
   * Maximum delay between retries in milliseconds
   */
  maxRetryDelayMs?: number;
  
  /**
   * Azure SDK log level: 'verbose' | 'info' | 'warning' | 'error'
   */
  logLevel?: 'verbose' | 'info' | 'warning' | 'error';
}

/**
 * Creates and configures a BlobServiceClient with managed identity authentication
 * and custom retry policies
 */
export class BlobStorageConfigManager {
  private readonly config: BlobStorageConfig;
  private blobServiceClient: BlobServiceClient | null = null;

  constructor(config?: Partial<BlobStorageConfig>) {
    // Load configuration from environment with defaults
    this.config = {
      accountEndpoint: config?.accountEndpoint || process.env.AZURE_STORAGE_ACCOUNT_ENDPOINT || '',
      maxRetries: config?.maxRetries ?? 3,
      maxRetryDelayMs: config?.maxRetryDelayMs ?? 4000,
      logLevel: config?.logLevel || (process.env.AZURE_LOG_LEVEL as any) || 'warning',
    };

    if (!this.config.accountEndpoint) {
      throw new Error(
        'Azure Storage account endpoint is required. ' +
        'Set AZURE_STORAGE_ACCOUNT_ENDPOINT environment variable or provide it in config.'
      );
    }

    this.initializeLogging();
  }

  /**
   * Configures Azure SDK logging based on the specified log level
   */
  private initializeLogging(): void {
    setLogLevel(this.config.logLevel!);
    
    AzureLogger.log = (...args) => {
      const message = args.join(' ');
      console.log(`[Azure SDK] ${message}`);
    };
  }

  /**
   * Creates and returns a configured BlobServiceClient instance
   */
  public getBlobServiceClient(): BlobServiceClient {
    if (this.blobServiceClient) {
      return this.blobServiceClient;
    }

    // Use DefaultAzureCredential for managed identity authentication
    // This will work in Azure environments (App Service, Functions, VMs, AKS, etc.)
    const credential = new DefaultAzureCredential();

    // Configure retry policy with exponential backoff
    const retryOptions: StorageRetryOptions = {
      retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
      maxTries: this.config.maxRetries!,
      maxRetryDelayInMs: this.config.maxRetryDelayMs!,
      retryDelayInMs: 800, // Initial delay
    };

    this.blobServiceClient = new BlobServiceClient(
      this.config.accountEndpoint,
      credential,
      {
        retryOptions,
      }
    );

    console.log(`✓ BlobServiceClient configured with endpoint: ${this.config.accountEndpoint}`);
    console.log(`✓ Retry policy: exponential backoff, max ${this.config.maxRetries} retries`);
    console.log(`✓ Log level: ${this.config.logLevel}`);

    return this.blobServiceClient;
  }

  /**
   * Gets the current configuration
   */
  public getConfig(): Readonly<BlobStorageConfig> {
    return { ...this.config };
  }
}
