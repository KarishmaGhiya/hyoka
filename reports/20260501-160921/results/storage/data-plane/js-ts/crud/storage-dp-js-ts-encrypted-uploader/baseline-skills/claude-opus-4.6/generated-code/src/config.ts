import { DefaultAzureCredential } from "@azure/identity";
import { KeyClient, CryptographyClient } from "@azure/keyvault-keys";
import { BlobServiceClient } from "@azure/storage-blob";
import type { TokenCredential } from "@azure/core-auth";

export interface AzureConfig {
  credential: TokenCredential;
  keyClient: KeyClient;
  blobServiceClient: BlobServiceClient;
  keyVaultKeyName: string;
}

/**
 * Builds Azure connections from environment variables, sharing a single credential.
 *
 * Required env vars:
 *   KEY_VAULT_URL       – e.g. https://my-vault.vault.azure.net
 *   STORAGE_ACCOUNT_URL – e.g. https://myaccount.blob.core.windows.net
 *   KEY_VAULT_KEY_NAME  – name of the RSA key in Key Vault
 */
export function buildAzureConfig(): AzureConfig {
  const keyVaultUrl = requireEnv("KEY_VAULT_URL");
  const storageAccountUrl = requireEnv("STORAGE_ACCOUNT_URL");
  const keyVaultKeyName = requireEnv("KEY_VAULT_KEY_NAME");

  const credential = new DefaultAzureCredential();

  const keyClient = new KeyClient(keyVaultUrl, credential);
  const blobServiceClient = new BlobServiceClient(storageAccountUrl, credential);

  return { credential, keyClient, blobServiceClient, keyVaultKeyName };
}

/**
 * Creates a CryptographyClient for a specific key version.
 */
export function buildCryptographyClient(
  keyId: string,
  credential: TokenCredential
): CryptographyClient {
  return new CryptographyClient(keyId, credential);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
