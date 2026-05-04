import { DefaultAzureCredential } from "@azure/identity";
import { 
  BlobServiceClient, 
  StorageRetryPolicyType,
  StorageRetryOptions 
} from "@azure/storage-blob";
import { setLogLevel } from "@azure/logger";
import type { TokenCredential } from "@azure/core-auth";

/**
 * Configuration options for Azure Blob Storage
 */
export interface BlobStorageConfig {
  /** Storage account endpoint URL */
  endpoint: string;
  /** Container name */
  containerName: string;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial retry delay in milliseconds */
  retryDelayMs?: number;
  /** Log level for Azure SDK (verbose, info, warning, error) */
  logLevel?: "verbose" | "info" | "warning" | "error";
}

/**
 * Configuration module for Azure Blob Storage
 * Uses managed identity (DefaultAzureCredential) for secure authentication
 */
export class BlobStorageConfiguration {
  private credential: TokenCredential;
  private serviceClient: BlobServiceClient;
  private config: Required<BlobStorageConfig>;

  constructor(config: BlobStorageConfig) {
    // Set defaults
    this.config = {
      endpoint: config.endpoint,
      containerName: config.containerName,
      maxRetries: config.maxRetries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      logLevel: config.logLevel ?? "info"
    };

    // Configure SDK logging
    this.configureLogging();

    // Initialize credential using DefaultAzureCredential
    // This works in Azure (managed identity) and locally (Azure CLI, VS Code, etc.)
    this.credential = new DefaultAzureCredential();

    // Create BlobServiceClient with custom retry policy
    this.serviceClient = new BlobServiceClient(
      this.config.endpoint,
      this.credential,
      {
        retryOptions: this.getRetryOptions()
      }
    );
  }

  /**
   * Get the configured BlobServiceClient
   */
  public getServiceClient(): BlobServiceClient {
    return this.serviceClient;
  }

  /**
   * Get the container name
   */
  public getContainerName(): string {
    return this.config.containerName;
  }

  /**
   * Get the full configuration
   */
  public getConfig(): Required<BlobStorageConfig> {
    return { ...this.config };
  }

  /**
   * Configure exponential backoff retry policy
   */
  private getRetryOptions(): StorageRetryOptions {
    return {
      retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
      maxTries: this.config.maxRetries,
      retryDelayInMs: this.config.retryDelayMs,
      maxRetryDelayInMs: this.config.retryDelayMs * 8, // Cap at 8x initial delay
      tryTimeoutInMs: 60000 // 60 seconds per attempt
    };
  }

  /**
   * Configure Azure SDK logging
   */
  private configureLogging(): void {
    setLogLevel(this.config.logLevel);
  }

  /**
   * Create configuration from environment variables
   */
  public static fromEnvironment(): BlobStorageConfiguration {
    const endpoint = process.env.AZURE_STORAGE_ACCOUNT_ENDPOINT;
    if (!endpoint) {
      throw new Error("AZURE_STORAGE_ACCOUNT_ENDPOINT environment variable is required");
    }

    const config: BlobStorageConfig = {
      endpoint,
      containerName: process.env.AZURE_STORAGE_CONTAINER_NAME ?? "demo-container",
      maxRetries: process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES, 10) : 3,
      retryDelayMs: process.env.RETRY_DELAY_MS ? parseInt(process.env.RETRY_DELAY_MS, 10) : 1000,
      logLevel: (process.env.LOG_LEVEL as any) ?? "info"
    };

    return new BlobStorageConfiguration(config);
  }
}
