import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

export interface StorageConfig {
  accountName: string;
  retryMaxRetries: number;
  retryDelayMs: number;
  logLevel?: "verbose" | "info" | "warning" | "error";
}

export interface RetryPolicyOptions {
  maxRetries: number;
  retryDelayInMs: number;
  maxRetryDelayInMs: number;
}

export class StorageClientFactory {
  private static instance: BlobServiceClient | null = null;

  /**
   * Creates and configures a BlobServiceClient with managed identity authentication.
   * Uses exponential backoff retry policy and optional SDK logging.
   */
  static getClient(config: StorageConfig): BlobServiceClient {
    if (this.instance) {
      return this.instance;
    }

    // Use DefaultAzureCredential for managed identity in Azure
    // Will try: Environment variables, Managed Identity, Azure CLI, etc.
    const credential = new DefaultAzureCredential();

    const accountUrl = `https://${config.accountName}.blob.core.windows.net`;

    // Configure custom retry policy with exponential backoff
    const retryOptions: RetryPolicyOptions = {
      maxRetries: config.retryMaxRetries,
      retryDelayInMs: config.retryDelayMs,
      maxRetryDelayInMs: config.retryDelayMs * Math.pow(2, config.retryMaxRetries),
    };

    // Create client with retry policy
    this.instance = new BlobServiceClient(accountUrl, credential, {
      retryOptions: {
        maxTries: retryOptions.maxRetries,
        retryDelayInMs: retryOptions.retryDelayInMs,
        maxRetryDelayInMs: retryOptions.maxRetryDelayInMs,
        retryPolicyType: 1, // ExponentialRetry
      },
    });

    // Enable SDK logging if configured
    if (config.logLevel) {
      this.configureSdkLogging(config.logLevel);
    }

    return this.instance;
  }

  /**
   * Configures Azure SDK logging level for debugging.
   */
  private static configureSdkLogging(level: string): void {
    // Azure SDK uses @azure/logger for logging
    // Set the logging level via environment variable
    process.env.AZURE_LOG_LEVEL = level;
    
    console.log(`Azure SDK logging enabled at level: ${level}`);
  }

  /**
   * Loads configuration from environment variables.
   */
  static loadConfigFromEnv(): StorageConfig {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;

    if (!accountName) {
      throw new Error(
        "AZURE_STORAGE_ACCOUNT_NAME environment variable is required"
      );
    }

    return {
      accountName,
      retryMaxRetries: parseInt(process.env.RETRY_MAX_RETRIES || "3", 10),
      retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || "1000", 10),
      logLevel: (process.env.AZURE_LOG_LEVEL as any) || "info",
    };
  }

  /**
   * Resets the singleton instance (useful for testing).
   */
  static reset(): void {
    this.instance = null;
  }
}
