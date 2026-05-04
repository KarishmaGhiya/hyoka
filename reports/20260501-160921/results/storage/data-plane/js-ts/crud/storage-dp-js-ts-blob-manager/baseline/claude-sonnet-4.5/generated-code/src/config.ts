import { BlobServiceClient, StorageRetryPolicyType, StorageRetryOptions } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { setLogLevel, AzureLogger } from '@azure/logger';
import * as dotenv from 'dotenv';

dotenv.config();

export interface BlobStorageConfig {
  endpoint: string;
  containerName: string;
  maxRetries: number;
  retryDelayMs: number;
  logLevel: 'verbose' | 'info' | 'warning' | 'error';
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): BlobStorageConfig {
  const endpoint = process.env.AZURE_STORAGE_ENDPOINT;
  if (!endpoint) {
    throw new Error('AZURE_STORAGE_ENDPOINT environment variable is required');
  }

  const containerName = process.env.CONTAINER_NAME || 'demo-container';
  const maxRetries = parseInt(process.env.MAX_RETRIES || '3', 10);
  const retryDelayMs = parseInt(process.env.RETRY_DELAY_MS || '4000', 10);
  const logLevel = (process.env.LOG_LEVEL || 'info') as 'verbose' | 'info' | 'warning' | 'error';

  return {
    endpoint,
    containerName,
    maxRetries,
    retryDelayMs,
    logLevel,
  };
}

/**
 * Create a BlobServiceClient with managed identity and custom retry policy
 */
export function createBlobServiceClient(config: BlobStorageConfig): BlobServiceClient {
  // Configure SDK logging
  setLogLevel(config.logLevel);

  // Use DefaultAzureCredential for managed identity support
  // This will automatically try multiple credential types in order:
  // 1. EnvironmentCredential
  // 2. ManagedIdentityCredential (works in Azure with managed identity)
  // 3. AzureCliCredential (works locally if logged in via Azure CLI)
  // 4. etc.
  const credential = new DefaultAzureCredential();

  // Configure custom retry policy with exponential backoff
  const retryOptions: StorageRetryOptions = {
    retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
    maxTries: config.maxRetries,
    tryTimeoutInMs: 30000,
    retryDelayInMs: config.retryDelayMs,
    maxRetryDelayInMs: config.retryDelayMs * 8, // Max delay grows exponentially
  };

  const blobServiceClient = new BlobServiceClient(config.endpoint, credential, {
    retryOptions,
  });

  console.log(`✓ Blob Service Client configured with managed identity`);
  console.log(`  Endpoint: ${config.endpoint}`);
  console.log(`  Retry Policy: Exponential backoff (max ${config.maxRetries} retries, ${config.retryDelayMs}ms base delay)`);
  console.log(`  Log Level: ${config.logLevel}`);

  return blobServiceClient;
}
