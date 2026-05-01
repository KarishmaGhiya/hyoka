import { ManagedIdentityCredential } from "@azure/identity";
import { KeyClient } from "@azure/keyvault-keys";
import { BlobServiceClient } from "@azure/storage-blob";

export interface AppConfig {
  blobServiceUrl: string;
  blobContainerName: string;
  keyVaultUrl: string;
  keyName: string;
  keyVersion?: string;
  managedIdentityClientId?: string;
}

export interface AzureClients {
  config: AppConfig;
  credential: ManagedIdentityCredential;
  blobServiceClient: BlobServiceClient;
  keyClient: KeyClient;
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function loadConfigFromEnv(): AppConfig {
  return {
    blobServiceUrl: requireEnv("AZURE_STORAGE_BLOB_URL"),
    blobContainerName: requireEnv("AZURE_STORAGE_CONTAINER_NAME"),
    keyVaultUrl: requireEnv("AZURE_KEY_VAULT_URL"),
    keyName: requireEnv("AZURE_KEY_VAULT_KEY_NAME"),
    keyVersion: process.env.AZURE_KEY_VAULT_KEY_VERSION,
    managedIdentityClientId: process.env.AZURE_CLIENT_ID
  };
}

export function createAzureClients(config: AppConfig = loadConfigFromEnv()): AzureClients {
  const credential = config.managedIdentityClientId
    ? new ManagedIdentityCredential(config.managedIdentityClientId)
    : new ManagedIdentityCredential();

  return {
    config,
    credential,
    blobServiceClient: new BlobServiceClient(config.blobServiceUrl, credential),
    keyClient: new KeyClient(config.keyVaultUrl, credential)
  };
}
