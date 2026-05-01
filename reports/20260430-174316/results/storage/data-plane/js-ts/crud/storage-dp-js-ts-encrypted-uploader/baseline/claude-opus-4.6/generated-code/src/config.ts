import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { KeyClient, CryptographyClient } from "@azure/keyvault-keys";

/**
 * Holds the Azure service clients built from environment configuration.
 *
 * Required environment variables:
 *   AZURE_KEYVAULT_URL  – e.g. https://my-vault.vault.azure.net
 *   AZURE_STORAGE_URL   – e.g. https://mystorage.blob.core.windows.net
 *   AZURE_KEY_NAME      – name of the RSA key in Key Vault
 */
export interface AzureClients {
  credential: DefaultAzureCredential;
  blobServiceClient: BlobServiceClient;
  keyClient: KeyClient;
  keyName: string;
  vaultUrl: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function buildClients(): AzureClients {
  const vaultUrl = requireEnv("AZURE_KEYVAULT_URL");
  const storageUrl = requireEnv("AZURE_STORAGE_URL");
  const keyName = requireEnv("AZURE_KEY_NAME");

  const credential = new DefaultAzureCredential();

  const blobServiceClient = new BlobServiceClient(storageUrl, credential);
  const keyClient = new KeyClient(vaultUrl, credential);

  return { credential, blobServiceClient, keyClient, keyName, vaultUrl };
}

/**
 * Build a CryptographyClient for a specific key version.
 * Reuses the shared credential so no extra token fetches are needed.
 */
export function buildCryptoClient(
  vaultUrl: string,
  keyName: string,
  keyVersion: string,
  credential: DefaultAzureCredential
): CryptographyClient {
  const keyId = `${vaultUrl}/keys/${keyName}/${keyVersion}`;
  return new CryptographyClient(keyId, credential);
}
