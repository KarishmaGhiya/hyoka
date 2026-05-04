import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { setLogLevel } from "@azure/logger";

/** Configuration options for the Azure Blob Storage client. */
export interface BlobStorageConfig {
  /** Storage account blob endpoint URL (e.g. "https://<account>.blob.core.windows.net"). */
  storageAccountUrl: string;
  /** Maximum number of retries for transient failures. Defaults to 4. */
  maxRetries?: number;
  /** Base delay in milliseconds between retries. Defaults to 1000. */
  retryDelayMs?: number;
  /**
   * Azure SDK log level for debugging.
   * One of "verbose", "info", "warning", "error". Defaults to undefined (logging disabled).
   */
  logLevel?: "verbose" | "info" | "warning" | "error";
}

/**
 * Creates a configured {@link BlobServiceClient} using managed identity
 * (via {@link DefaultAzureCredential}) and a custom exponential-backoff retry policy.
 *
 * No connection strings or account keys are used — authentication relies on
 * Azure AD credentials available in the runtime environment (managed identity,
 * Azure CLI, environment variables, etc.).
 */
export function createBlobServiceClient(
  config: BlobStorageConfig
): BlobServiceClient {
  if (config.logLevel) {
    setLogLevel(config.logLevel);
  }

  const credential = new DefaultAzureCredential();

  const client = new BlobServiceClient(config.storageAccountUrl, credential, {
    retryOptions: {
      maxTries: config.maxRetries ?? 4,
      retryDelayInMs: config.retryDelayMs ?? 1000,
      maxRetryDelayInMs: (config.retryDelayMs ?? 1000) * 32,
      retryPolicyType: 1, // StorageRetryPolicyType.EXPONENTIAL
    },
  });

  return client;
}

/**
 * Builds a {@link BlobStorageConfig} from environment variables with sensible defaults.
 *
 * | Variable                       | Purpose                                       |
 * |-------------------------------|-----------------------------------------------|
 * | `AZURE_STORAGE_ACCOUNT_URL`   | Required – blob service endpoint URL           |
 * | `AZURE_STORAGE_MAX_RETRIES`   | Optional – max retry attempts (default 4)      |
 * | `AZURE_STORAGE_RETRY_DELAY_MS`| Optional – base retry delay in ms (default 1000)|
 * | `AZURE_SDK_LOG_LEVEL`         | Optional – SDK log level for debugging         |
 */
export function loadConfigFromEnv(): BlobStorageConfig {
  const storageAccountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL;
  if (!storageAccountUrl) {
    throw new Error(
      "Environment variable AZURE_STORAGE_ACCOUNT_URL is required " +
        '(e.g. "https://<account>.blob.core.windows.net")'
    );
  }

  const logLevel = process.env.AZURE_SDK_LOG_LEVEL as
    | BlobStorageConfig["logLevel"]
    | undefined;

  return {
    storageAccountUrl,
    maxRetries: process.env.AZURE_STORAGE_MAX_RETRIES
      ? parseInt(process.env.AZURE_STORAGE_MAX_RETRIES, 10)
      : undefined,
    retryDelayMs: process.env.AZURE_STORAGE_RETRY_DELAY_MS
      ? parseInt(process.env.AZURE_STORAGE_RETRY_DELAY_MS, 10)
      : undefined,
    logLevel,
  };
}
