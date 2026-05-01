import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobServiceClient,
  StorageRetryPolicyType,
  StorageRetryOptions,
} from "@azure/storage-blob";
import { setLogLevel, AzureLogger } from "@azure/logger";

export interface BlobStorageConfig {
  /** Maximum number of retries for failed requests. */
  maxRetries?: number;
  /** Maximum delay between retries in milliseconds. */
  maxRetryDelayMs?: number;
  /**
   * Azure SDK log level for debugging.
   * One of: "verbose", "info", "warning", "error".
   */
  logLevel?: "verbose" | "info" | "warning" | "error";
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_MAX_RETRY_DELAY_MS = 4000;

/**
 * Creates a BlobServiceClient authenticated via DefaultAzureCredential
 * (managed identity / Azure CLI / environment credentials — no keys).
 *
 * The storage account endpoint is read from the AZURE_STORAGE_ACCOUNT_URL
 * environment variable (e.g. "https://<account>.blob.core.windows.net").
 */
export function createBlobServiceClient(
  config: BlobStorageConfig = {}
): BlobServiceClient {
  const accountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL;
  if (!accountUrl) {
    throw new Error(
      "Environment variable AZURE_STORAGE_ACCOUNT_URL is required " +
        '(e.g. "https://<account>.blob.core.windows.net").'
    );
  }

  const logLevel =
    config.logLevel ??
    (process.env.AZURE_LOG_LEVEL as BlobStorageConfig["logLevel"]);
  if (logLevel) {
    setLogLevel(logLevel);
    AzureLogger.log = (...args) => {
      console.log("[AzureSDK]", ...args);
    };
  }

  const retryOptions: StorageRetryOptions = {
    retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
    maxTries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
    retryDelayInMs: 500,
    maxRetryDelayInMs: config.maxRetryDelayMs ?? DEFAULT_MAX_RETRY_DELAY_MS,
  };

  const credential = new DefaultAzureCredential();

  return new BlobServiceClient(accountUrl, credential, {
    retryOptions,
  });
}
