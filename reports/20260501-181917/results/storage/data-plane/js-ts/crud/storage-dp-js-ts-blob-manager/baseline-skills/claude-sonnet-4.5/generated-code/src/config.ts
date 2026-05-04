import { BlobServiceClient, StorageRetryOptions, StorageRetryPolicyType } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { setLogLevel, AzureLogger } from "@azure/logger";

export interface StorageConfig {
  accountName: string;
  containerName: string;
  retryOptions?: {
    maxRetries?: number;
    retryDelayInMs?: number;
    maxRetryDelayInMs?: number;
  };
  logLevel?: "verbose" | "info" | "warning" | "error";
}

export class AzureStorageConfig {
  private readonly client: BlobServiceClient;
  private readonly config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;

    if (config.logLevel) {
      this.setupLogging(config.logLevel);
    }

    const credential = new DefaultAzureCredential();

    const retryOptions: StorageRetryOptions = {
      retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
      maxTries: config.retryOptions?.maxRetries ?? 3,
      retryDelayInMs: config.retryOptions?.retryDelayInMs ?? 1000,
      maxRetryDelayInMs: config.retryOptions?.maxRetryDelayInMs ?? 30000,
    };

    this.client = new BlobServiceClient(
      `https://${config.accountName}.blob.core.windows.net`,
      credential,
      {
        retryOptions,
      }
    );
  }

  private setupLogging(level: "verbose" | "info" | "warning" | "error"): void {
    setLogLevel(level);

    AzureLogger.log = (...args) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [Azure SDK]`, ...args);
    };
  }

  getClient(): BlobServiceClient {
    return this.client;
  }

  getContainerName(): string {
    return this.config.containerName;
  }
}

export function createStorageConfig(): AzureStorageConfig {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "demo-container";
  const maxRetries = process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES, 10) : 3;
  const retryDelayMs = process.env.RETRY_DELAY_MS ? parseInt(process.env.RETRY_DELAY_MS, 10) : 1000;
  const maxRetryDelayMs = process.env.MAX_RETRY_DELAY_MS ? parseInt(process.env.MAX_RETRY_DELAY_MS, 10) : 30000;
  const logLevel = (process.env.AZURE_LOG_LEVEL as "verbose" | "info" | "warning" | "error") || "info";

  if (!accountName) {
    throw new Error("AZURE_STORAGE_ACCOUNT_NAME environment variable is required");
  }

  return new AzureStorageConfig({
    accountName,
    containerName,
    retryOptions: {
      maxRetries,
      retryDelayInMs: retryDelayMs,
      maxRetryDelayInMs: maxRetryDelayMs,
    },
    logLevel,
  });
}
