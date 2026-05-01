import { ManagedIdentityCredential } from "@azure/identity";
import { KeyClient } from "@azure/keyvault-keys";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

export interface AzureConnectionConfig {
  blobServiceUrl: string;
  containerName: string;
  keyVaultUrl: string;
  keyName: string;
  keyVersion?: string;
  managedIdentityClientId?: string;
}

export interface AzureClients {
  config: AzureConnectionConfig;
  credential: ManagedIdentityCredential;
  blobServiceClient: BlobServiceClient;
  containerClient: ContainerClient;
  keyClient: KeyClient;
}

let sharedCredential: ManagedIdentityCredential | undefined;

function getRequiredEnv(name: string, env: NodeJS.ProcessEnv): string {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function loadAzureConnectionConfig(env: NodeJS.ProcessEnv = process.env): AzureConnectionConfig {
  return {
    blobServiceUrl: getRequiredEnv("AZURE_STORAGE_BLOB_ENDPOINT", env),
    containerName: getRequiredEnv("AZURE_STORAGE_CONTAINER_NAME", env),
    keyVaultUrl: getRequiredEnv("AZURE_KEY_VAULT_URL", env),
    keyName: getRequiredEnv("AZURE_KEY_VAULT_KEY_NAME", env),
    keyVersion: env.AZURE_KEY_VAULT_KEY_VERSION,
    managedIdentityClientId: env.AZURE_CLIENT_ID,
  };
}

export function getManagedIdentityCredential(
  config: AzureConnectionConfig = loadAzureConnectionConfig(),
): ManagedIdentityCredential {
  if (!sharedCredential) {
    sharedCredential = config.managedIdentityClientId
      ? new ManagedIdentityCredential({ clientId: config.managedIdentityClientId })
      : new ManagedIdentityCredential();
  }

  return sharedCredential;
}

export function createAzureClients(config: AzureConnectionConfig = loadAzureConnectionConfig()): AzureClients {
  const credential = getManagedIdentityCredential(config);
  const blobServiceClient = new BlobServiceClient(config.blobServiceUrl, credential);
  const containerClient = blobServiceClient.getContainerClient(config.containerName);
  const keyClient = new KeyClient(config.keyVaultUrl, credential);

  return {
    config,
    credential,
    blobServiceClient,
    containerClient,
    keyClient,
  };
}
