import { DefaultAzureCredential } from "@azure/identity";
import { setLogLevel, type AzureLogLevel } from "@azure/logger";
import {
  BlobServiceClient,
  StorageRetryPolicyType,
  type StoragePipelineOptions,
} from "@azure/storage-blob";

export interface BlobStorageConfig {
  endpoint: string;
  containerName: string;
  retry: {
    maxTries: number;
    retryDelayInMs: number;
    maxRetryDelayInMs: number;
  };
  logLevel: AzureLogLevel;
}

const VALID_LOG_LEVELS: AzureLogLevel[] = ["verbose", "info", "warning", "error"];

function getRequiredEnv(name: string, env: NodeJS.ProcessEnv): string {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getPositiveInteger(
  name: string,
  defaultValue: number,
  env: NodeJS.ProcessEnv,
): number {
  const rawValue = env[name];

  if (!rawValue) {
    return defaultValue;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} must be a positive integer. Received: ${rawValue}`);
  }

  return parsedValue;
}

function getLogLevel(env: NodeJS.ProcessEnv): AzureLogLevel {
  const rawValue = (env.AZURE_STORAGE_LOG_LEVEL ?? "info").toLowerCase() as AzureLogLevel;

  if (!VALID_LOG_LEVELS.includes(rawValue)) {
    throw new Error(
      `AZURE_STORAGE_LOG_LEVEL must be one of: ${VALID_LOG_LEVELS.join(", ")}.`,
    );
  }

  return rawValue;
}

export function loadBlobStorageConfig(
  env: NodeJS.ProcessEnv = process.env,
): BlobStorageConfig {
  const config: BlobStorageConfig = {
    endpoint: getRequiredEnv("AZURE_STORAGE_BLOB_ENDPOINT", env),
    containerName: getRequiredEnv("AZURE_STORAGE_CONTAINER_NAME", env),
    retry: {
      maxTries: getPositiveInteger("AZURE_STORAGE_MAX_RETRIES", 5, env),
      retryDelayInMs: getPositiveInteger("AZURE_STORAGE_RETRY_DELAY_MS", 1_000, env),
      maxRetryDelayInMs: getPositiveInteger(
        "AZURE_STORAGE_MAX_RETRY_DELAY_MS",
        10_000,
        env,
      ),
    },
    logLevel: getLogLevel(env),
  };

  setLogLevel(config.logLevel);

  return config;
}

export function createBlobServiceClient(
  config: BlobStorageConfig = loadBlobStorageConfig(),
): BlobServiceClient {
  const credential = new DefaultAzureCredential();
  const options: StoragePipelineOptions = {
    retryOptions: {
      maxTries: config.retry.maxTries,
      retryDelayInMs: config.retry.retryDelayInMs,
      maxRetryDelayInMs: config.retry.maxRetryDelayInMs,
      retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
    },
  };

  return new BlobServiceClient(config.endpoint, credential, options);
}
