import { DefaultAzureCredential } from "@azure/identity";
import { AzureLogger, AzureLogLevel, setLogLevel } from "@azure/logger";
import {
  BlobServiceClient,
  StorageRetryPolicyType,
  StoragePipelineOptions
} from "@azure/storage-blob";

const SUPPORTED_LOG_LEVELS: AzureLogLevel[] = ["verbose", "info", "warning", "error"];

export interface BlobStorageConfig {
  endpoint: string;
  containerName: string;
  retryMaxTries: number;
  retryDelayInMs: number;
  retryMaxDelayInMs: number;
  sdkLogLevel: AzureLogLevel;
}

export function loadBlobStorageConfig(): BlobStorageConfig {
  const endpoint = process.env.AZURE_STORAGE_BLOB_ENDPOINT;

  if (!endpoint) {
    throw new Error("AZURE_STORAGE_BLOB_ENDPOINT must be set to the Blob service endpoint.");
  }

  const sdkLogLevel = parseLogLevel(process.env.AZURE_SDK_LOG_LEVEL);

  return {
    endpoint,
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME ?? "blob-demo",
    retryMaxTries: parsePositiveInteger(process.env.AZURE_STORAGE_RETRY_MAX_TRIES, 5),
    retryDelayInMs: parsePositiveInteger(process.env.AZURE_STORAGE_RETRY_DELAY_MS, 800),
    retryMaxDelayInMs: parsePositiveInteger(process.env.AZURE_STORAGE_RETRY_MAX_DELAY_MS, 8_000),
    sdkLogLevel
  };
}

export function createBlobServiceClient(config: BlobStorageConfig): BlobServiceClient {
  setLogLevel(config.sdkLogLevel);
  AzureLogger.log = (...args: unknown[]) => {
    console.log("[azure-sdk]", ...args);
  };

  const credential = new DefaultAzureCredential();

  const options: StoragePipelineOptions = {
    retryOptions: {
      maxTries: config.retryMaxTries,
      retryDelayInMs: config.retryDelayInMs,
      maxRetryDelayInMs: config.retryMaxDelayInMs,
      retryPolicyType: StorageRetryPolicyType.EXPONENTIAL
    }
  };

  return new BlobServiceClient(config.endpoint, credential, options);
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer but received "${value}".`);
  }

  return parsed;
}

function parseLogLevel(value: string | undefined): AzureLogLevel {
  if (!value) {
    return "info";
  }

  if (SUPPORTED_LOG_LEVELS.includes(value as AzureLogLevel)) {
    return value as AzureLogLevel;
  }

  throw new Error(
    `Unsupported AZURE_SDK_LOG_LEVEL "${value}". Supported values: ${SUPPORTED_LOG_LEVELS.join(", ")}.`
  );
}
