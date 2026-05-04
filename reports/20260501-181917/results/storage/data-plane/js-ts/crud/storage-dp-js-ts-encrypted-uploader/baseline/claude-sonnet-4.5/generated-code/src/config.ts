import { DefaultAzureCredential } from "@azure/identity";
import { KeyClient } from "@azure/keyvault-keys";
import { BlobServiceClient } from "@azure/storage-blob";

export interface AzureConfig {
  credential: DefaultAzureCredential;
  keyClient: KeyClient;
  blobServiceClient: BlobServiceClient;
  keyVaultKeyName: string;
}

export function createAzureConfig(): AzureConfig {
  const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;
  const storageAccountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL;
  const keyVaultKeyName = process.env.AZURE_KEYVAULT_KEY_NAME || "encryption-key";

  if (!keyVaultUrl) {
    throw new Error("AZURE_KEYVAULT_URL environment variable is required");
  }

  if (!storageAccountUrl) {
    throw new Error("AZURE_STORAGE_ACCOUNT_URL environment variable is required");
  }

  const credential = new DefaultAzureCredential();

  const keyClient = new KeyClient(keyVaultUrl, credential);
  
  const blobServiceClient = new BlobServiceClient(storageAccountUrl, credential);

  return {
    credential,
    keyClient,
    blobServiceClient,
    keyVaultKeyName,
  };
}
