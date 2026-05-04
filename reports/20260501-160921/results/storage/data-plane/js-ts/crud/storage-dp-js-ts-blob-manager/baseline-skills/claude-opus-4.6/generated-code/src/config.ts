import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobServiceClient,
  StorageRetryPolicyType,
  StorageRetryOptions,
} from "@azure/storage-blob";
import { setLogLevel, type AzureLogLevel } from "@azure/logger";

export interface BlobStorageConfig {
  /** Storage account blob endpoint, e.g. https://<account>.blob.core.windows.net */
  accountUrl: string;
  /** Maximum number of retries for failed requests (default: 3) */
  maxRetries?: number;
  /** Maximum delay between retries in ms (default: 4000) */
  maxRetryDelayMs?: number;
  /** Initial retry delay in ms (default: 1000) */
  retryDelayMs?: number;
  /** Azure SDK log level for debugging (default: "warning") */
  logLevel?: AzureLogLevel;
}

/**
 * Reads configuration from environment variables and optional overrides,
 * then returns a fully configured BlobServiceClient using DefaultAzureCredential.
 */
export function createBlobServiceClient(
  overrides?: Partial<BlobStorageConfig>
): BlobServiceClient {
  const accountUrl =
    overrides?.accountUrl ?? process.env.AZURE_STORAGE_ACCOUNT_URL;

  if (!accountUrl) {
    throw new Error(
      "Storage account URL is required. Set AZURE_STORAGE_ACCOUNT_URL or pass accountUrl in config."
    );
  }

  const logLevel: AzureLogLevel =
    overrides?.logLevel ??
    (process.env.AZURE_LOG_LEVEL as AzureLogLevel | undefined) ??
    "warning";
  setLogLevel(logLevel);

  const retryOptions: StorageRetryOptions = {
    retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
    maxTries: overrides?.maxRetries ?? 3,
    retryDelayInMs: overrides?.retryDelayMs ?? 1000,
    maxRetryDelayInMs: overrides?.maxRetryDelayMs ?? 4000,
  };

  const credential = new DefaultAzureCredential();

  return new BlobServiceClient(accountUrl, credential, {
    retryOptions,
  });
}
