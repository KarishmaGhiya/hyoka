import { BlobServiceClient, StorageRetryPolicyType } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { setLogLevel, type AzureLogLevel } from "@azure/logger";

export interface BlobStorageConfig {
  /** Max retry attempts for transient failures. Default: 3 */
  maxRetries?: number;
  /** Max delay in milliseconds between retries. Default: 4000 */
  maxRetryDelayMs?: number;
  /** Initial retry delay in milliseconds. Default: 1000 */
  retryDelayMs?: number;
  /** Azure SDK log level for debugging. Default: "warning" */
  logLevel?: AzureLogLevel;
}

/**
 * Creates an authenticated BlobServiceClient using managed identity
 * (DefaultAzureCredential) with a configurable exponential-backoff retry
 * policy and SDK-level logging.
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

  const {
    maxRetries = 3,
    maxRetryDelayMs = 4000,
    retryDelayMs = 1000,
    logLevel = "warning",
  } = config;

  setLogLevel(logLevel);

  const credential = new DefaultAzureCredential();

  const client = new BlobServiceClient(accountUrl, credential, {
    retryOptions: {
      maxTries: maxRetries,
      retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
      tryTimeoutInMs: 30_000,
      retryDelayInMs: retryDelayMs,
      maxRetryDelayInMs: maxRetryDelayMs,
    },
  });

  return client;
}
