import { DefaultAzureCredential, TokenCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import { KeyClient } from '@azure/keyvault-keys';

export interface AzureConfig {
  credential: TokenCredential;
  blobServiceClient: BlobServiceClient;
  keyClient: KeyClient;
  keyVaultKeyName: string;
  containerName: string;
}

export function buildAzureConfig(): AzureConfig {
  const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL;
  const keyVaultKeyName = process.env.AZURE_KEY_VAULT_KEY_NAME || 'encryption-key';
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'encrypted-files';

  if (!storageAccountName) {
    throw new Error('AZURE_STORAGE_ACCOUNT_NAME environment variable is required');
  }

  if (!keyVaultUrl) {
    throw new Error('AZURE_KEY_VAULT_URL environment variable is required');
  }

  const credential = new DefaultAzureCredential();

  const blobServiceUrl = `https://${storageAccountName}.blob.core.windows.net`;
  const blobServiceClient = new BlobServiceClient(blobServiceUrl, credential);

  const keyClient = new KeyClient(keyVaultUrl, credential);

  return {
    credential,
    blobServiceClient,
    keyClient,
    keyVaultKeyName,
    containerName,
  };
}
