import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobServiceClient,
  StorageRetryPolicyType,
  StorageRetryOptions,
} from "@azure/storage-blob";
import { setLogLevel, AzureLogger } from "@azure/logger";

export interface BlobStorageConfig {
  /** Storage account blob endpoint, e.g. https://<account>.blob.core.windows.net */
  accountUrl: string;
  /** Max retry attempts (default 3) */
  maxRetries?: number;
  /** Max delay between retries in ms (default 4000) */
  maxRetryDelayMs?: number;
  /** Initial retry delay in ms (default 1000) */
  retryDelayMs?: number;
  /**
   * Azure SDK log level for debugging.
   * One of: verbose | info | warning | error
   */
  logLevel?: "verbose" | "info" | "warning" | "error";
}

/**
 * Build a BlobServiceClient using DefaultAzureCredential (managed identity /
 * CLI / env-based auth — never connection strings or account keys).
 */
export function createBlobServiceClient(
  config?: Partial<BlobStorageConfig>
): BlobServiceClient {
  const accountUrl =
    config?.accountUrl ?? process.env.AZURE_STORAGE_ACCOUNT_URL;

  if (!accountUrl) {
    throw new Error(
      "Storage account URL is required. Set AZURE_STORAGE_ACCOUNT_URL or pass accountUrl in config."
    );
  }

  // SDK log level
  const logLevel = config?.logLevel ?? process.env.AZURE_LOG_LEVEL;
  if (logLevel) {
    setLogLevel(logLevel as Parameters<typeof setLogLevel>[0]);
    AzureLogger.log = (...args) => console.log("[azure-sdk]", ...args);
  }

  const retryOptions: StorageRetryOptions = {
    retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
    maxTries: config?.maxRetries ?? 3,
    retryDelayInMs: config?.retryDelayMs ?? 1000,
    maxRetryDelayInMs: config?.maxRetryDelayMs ?? 4000,
  };

  const credential = new DefaultAzureCredential();

  return new BlobServiceClient(accountUrl, credential, {
    retryOptions,
  });
}
