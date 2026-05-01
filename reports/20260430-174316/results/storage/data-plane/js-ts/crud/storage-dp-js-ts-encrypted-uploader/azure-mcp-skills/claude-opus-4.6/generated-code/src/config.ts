import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { KeyClient, CryptographyClient } from "@azure/keyvault-keys";

/**
 * Reads Azure endpoints from environment variables and builds authenticated
 * clients for Blob Storage and Key Vault, sharing a single credential instance.
 *
 * Required env vars:
 *   AZURE_STORAGE_ACCOUNT_URL  – e.g. https://<account>.blob.core.windows.net
 *   AZURE_KEYVAULT_URL         – e.g. https://<vault>.vault.azure.net
 *   AZURE_KEYVAULT_KEY_NAME    – name of the RSA key in Key Vault
 */

export interface AzureClients {
  credential: DefaultAzureCredential;
  blobServiceClient: BlobServiceClient;
  keyClient: KeyClient;
  vaultUrl: string;
  keyName: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function buildClients(): AzureClients {
  const storageUrl = requireEnv("AZURE_STORAGE_ACCOUNT_URL");
  const vaultUrl = requireEnv("AZURE_KEYVAULT_URL");
  const keyName = requireEnv("AZURE_KEYVAULT_KEY_NAME");

  const credential = new DefaultAzureCredential();

  const blobServiceClient = new BlobServiceClient(storageUrl, credential);
  const keyClient = new KeyClient(vaultUrl, credential);

  return { credential, blobServiceClient, keyClient, vaultUrl, keyName };
}

/**
 * Returns a CryptographyClient bound to a specific key version in the vault.
 */
export function buildCryptoClient(
  vaultUrl: string,
  keyName: string,
  keyVersion: string,
  credential: DefaultAzureCredential,
): CryptographyClient {
  const keyId = `${vaultUrl}/keys/${keyName}/${keyVersion}`;
  return new CryptographyClient(keyId, credential);
}
