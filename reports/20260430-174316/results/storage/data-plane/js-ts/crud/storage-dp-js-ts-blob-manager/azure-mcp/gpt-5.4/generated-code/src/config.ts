import { DefaultAzureCredential } from "@azure/identity";
import { AzureLogLevel, AzureLogger, setLogLevel } from "@azure/logger";
import {
  BlobServiceClient,
  StorageRetryPolicyType,
  StoragePipelineOptions,
} from "@azure/storage-blob";

export interface BlobStorageConfig {
  endpoint: string;
  containerName: string;
  retryMaxTries: number;
  retryDelayInMs: number;
  retryMaxRetryDelayInMs: number;
  logLevel: AzureLogLevel | "none";
}

const supportedLogLevels = new Set<BlobStorageConfig["logLevel"]>([
  "none",
  "verbose",
  "info",
  "warning",
  "error",
]);

function requireEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function parsePositiveInteger(
  env: NodeJS.ProcessEnv,
  key: string,
  defaultValue: number,
): number {
  const rawValue = env[key]?.trim();
  if (!rawValue) {
    return defaultValue;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`Environment variable ${key} must be a positive integer.`);
  }

  return parsedValue;
}

function parseLogLevel(env: NodeJS.ProcessEnv, key: string): BlobStorageConfig["logLevel"] {
  const rawValue = env[key]?.trim().toLowerCase() as BlobStorageConfig["logLevel"] | undefined;
  if (!rawValue) {
    return "warning";
  }

  if (!supportedLogLevels.has(rawValue)) {
    throw new Error(
      `Environment variable ${key} must be one of: ${Array.from(supportedLogLevels).join(", ")}.`,
    );
  }

  return rawValue;
}

function configureAzureSdkLogging(logLevel: BlobStorageConfig["logLevel"]): void {
  if (logLevel === "none") {
    return;
  }

  AzureLogger.log = (...args: unknown[]) => {
    console.error("[azure-sdk]", ...args);
  };
  setLogLevel(logLevel);
}

export function loadBlobStorageConfig(env: NodeJS.ProcessEnv = process.env): BlobStorageConfig {
  return {
    endpoint: requireEnv(env, "AZURE_STORAGE_BLOB_ENDPOINT"),
    containerName: requireEnv(env, "AZURE_STORAGE_CONTAINER_NAME"),
    retryMaxTries: parsePositiveInteger(env, "AZURE_STORAGE_RETRY_MAX_TRIES", 5),
    retryDelayInMs: parsePositiveInteger(env, "AZURE_STORAGE_RETRY_DELAY_MS", 1_000),
    retryMaxRetryDelayInMs: parsePositiveInteger(env, "AZURE_STORAGE_RETRY_MAX_DELAY_MS", 10_000),
    logLevel: parseLogLevel(env, "AZURE_SDK_LOG_LEVEL"),
  };
}

export function createBlobServiceClient(
  config: BlobStorageConfig = loadBlobStorageConfig(),
): BlobServiceClient {
  configureAzureSdkLogging(config.logLevel);

  const pipelineOptions: StoragePipelineOptions = {
    retryOptions: {
      maxTries: config.retryMaxTries,
      retryDelayInMs: config.retryDelayInMs,
      maxRetryDelayInMs: config.retryMaxRetryDelayInMs,
      retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
    },
  };

  return new BlobServiceClient(config.endpoint, new DefaultAzureCredential(), pipelineOptions);
}
