import { ManagedIdentityCredential } from "@azure/identity";
import { AzureLogLevel, setLogLevel } from "@azure/logger";
import {
  BlobServiceClient,
  StorageRetryPolicyType,
} from "@azure/storage-blob";

const DEFAULT_RETRY_MAX_TRIES = 5;
const DEFAULT_RETRY_DELAY_MS = 1_000;
const DEFAULT_RETRY_MAX_DELAY_MS = 8_000;
const DEFAULT_UPLOAD_BUFFER_SIZE_MB = 8;
const DEFAULT_UPLOAD_CONCURRENCY = 5;
const DEFAULT_LEASE_DURATION_SECONDS = 60;

const AZURE_LOG_LEVELS: AzureLogLevel[] = ["verbose", "info", "warning", "error"];

export interface BlobStorageConfig {
  accountEndpoint: string;
  containerName: string;
  managedIdentityClientId?: string;
  retryMaxTries: number;
  retryDelayInMs: number;
  retryMaxDelayInMs: number;
  sdkLogLevel?: AzureLogLevel;
  uploadBufferSizeBytes: number;
  uploadConcurrency: number;
  leaseDurationInSeconds: number;
}

export function loadBlobStorageConfig(
  env: NodeJS.ProcessEnv = process.env,
): BlobStorageConfig {
  const accountEndpoint = readRequiredEnv(env, "AZURE_STORAGE_BLOB_ENDPOINT");
  const containerName = readRequiredEnv(env, "AZURE_STORAGE_CONTAINER_NAME");
  const sdkLogLevel = parseLogLevel(env.AZURE_SDK_LOG_LEVEL);

  return {
    accountEndpoint,
    containerName,
    managedIdentityClientId: env.AZURE_CLIENT_ID,
    retryMaxTries: parsePositiveInteger(
      env.AZURE_STORAGE_RETRY_MAX_TRIES,
      DEFAULT_RETRY_MAX_TRIES,
      "AZURE_STORAGE_RETRY_MAX_TRIES",
    ),
    retryDelayInMs: parsePositiveInteger(
      env.AZURE_STORAGE_RETRY_DELAY_MS,
      DEFAULT_RETRY_DELAY_MS,
      "AZURE_STORAGE_RETRY_DELAY_MS",
    ),
    retryMaxDelayInMs: parsePositiveInteger(
      env.AZURE_STORAGE_RETRY_MAX_DELAY_MS,
      DEFAULT_RETRY_MAX_DELAY_MS,
      "AZURE_STORAGE_RETRY_MAX_DELAY_MS",
    ),
    sdkLogLevel,
    uploadBufferSizeBytes:
      parsePositiveInteger(
        env.AZURE_STORAGE_UPLOAD_BUFFER_SIZE_MB,
        DEFAULT_UPLOAD_BUFFER_SIZE_MB,
        "AZURE_STORAGE_UPLOAD_BUFFER_SIZE_MB",
      ) * 1024 * 1024,
    uploadConcurrency: parsePositiveInteger(
      env.AZURE_STORAGE_UPLOAD_MAX_CONCURRENCY,
      DEFAULT_UPLOAD_CONCURRENCY,
      "AZURE_STORAGE_UPLOAD_MAX_CONCURRENCY",
    ),
    leaseDurationInSeconds: parsePositiveInteger(
      env.AZURE_STORAGE_LEASE_DURATION_SECONDS,
      DEFAULT_LEASE_DURATION_SECONDS,
      "AZURE_STORAGE_LEASE_DURATION_SECONDS",
    ),
  };
}

export function createBlobServiceClient(
  config: BlobStorageConfig,
): BlobServiceClient {
  if (config.sdkLogLevel) {
    setLogLevel(config.sdkLogLevel);
  }

  const credential = config.managedIdentityClientId
    ? new ManagedIdentityCredential(config.managedIdentityClientId)
    : new ManagedIdentityCredential();

  return new BlobServiceClient(config.accountEndpoint, credential, {
    retryOptions: {
      maxTries: config.retryMaxTries,
      retryDelayInMs: config.retryDelayInMs,
      maxRetryDelayInMs: config.retryMaxDelayInMs,
      retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
    },
  });
}

function readRequiredEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable ${key}.`);
  }

  return value;
}

function parsePositiveInteger(
  rawValue: string | undefined,
  fallback: number,
  key: string,
): number {
  if (rawValue === undefined || rawValue.trim() === "") {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer.`);
  }

  return parsed;
}

function parseLogLevel(rawValue: string | undefined): AzureLogLevel | undefined {
  if (rawValue === undefined || rawValue.trim() === "") {
    return undefined;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (AZURE_LOG_LEVELS.includes(normalized as AzureLogLevel)) {
    return normalized as AzureLogLevel;
  }

  throw new Error(
    `AZURE_SDK_LOG_LEVEL must be one of: ${AZURE_LOG_LEVELS.join(", ")}.`,
  );
}
