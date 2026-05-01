import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobServiceClient,
  StorageRetryPolicyType,
  StorageRetryOptions,
} from "@azure/storage-blob";
import { setLogLevel, AzureLogger } from "@azure/logger";

export interface BlobStorageConfig {
  /** Storage account blob endpoint, e.g. https://<account>.blob.core.windows.net */
  storageEndpoint: string;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Maximum delay between retries in ms (default: 4000) */
  maxRetryDelayMs?: number;
  /** Initial retry delay in ms (default: 1000) */
  retryDelayMs?: number;
  /**
   * Azure SDK log level for debugging.
   * One of: verbose, info, warning, error (default: warning)
   */
  logLevel?: "verbose" | "info" | "warning" | "error";
}

/**
 * Build a BlobServiceClient using DefaultAzureCredential (managed identity /
 * Azure CLI / environment creds — no connection strings or account keys).
 */
export function createBlobServiceClient(
  config?: Partial<BlobStorageConfig>
): BlobServiceClient {
  const storageEndpoint =
    config?.storageEndpoint ??
    process.env.AZURE_STORAGE_ENDPOINT ??
    "";

  if (!storageEndpoint) {
    throw new Error(
      "Storage endpoint is required. Set AZURE_STORAGE_ENDPOINT or pass storageEndpoint in config."
    );
  }

  const logLevel = config?.logLevel ?? "warning";
  setLogLevel(logLevel);
  AzureLogger.log = (...args) => {
    console.log("[azure-sdk]", ...args);
  };

  const retryOptions: StorageRetryOptions = {
    retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
    maxTries: config?.maxRetries ?? 3,
    retryDelayInMs: config?.retryDelayMs ?? 1000,
    maxRetryDelayInMs: config?.maxRetryDelayMs ?? 4000,
  };

  const credential = new DefaultAzureCredential();

  return new BlobServiceClient(storageEndpoint, credential, {
    retryOptions,
  });
}
