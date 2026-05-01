import { DefaultAzureCredential } from "@azure/identity";
import { KeyClient, CryptographyClient } from "@azure/keyvault-keys";
import { BlobServiceClient } from "@azure/storage-blob";

export interface AzureConfig {
  credential: DefaultAzureCredential;
  keyClient: KeyClient;
  blobServiceClient: BlobServiceClient;
  keyVaultKeyName: string;
}

/**
 * Builds Azure connections from environment variables, sharing a single
 * DefaultAzureCredential instance across all services.
 *
 * Required environment variables:
 *   KEY_VAULT_URL        – e.g. https://my-vault.vault.azure.net
 *   KEY_VAULT_KEY_NAME   – name of the RSA key in Key Vault
 *   STORAGE_ACCOUNT_URL  – e.g. https://mystorage.blob.core.windows.net
 */
export function buildConfig(): AzureConfig {
  const keyVaultUrl = requireEnv("KEY_VAULT_URL");
  const keyVaultKeyName = requireEnv("KEY_VAULT_KEY_NAME");
  const storageAccountUrl = requireEnv("STORAGE_ACCOUNT_URL");

  const credential = new DefaultAzureCredential();

  const keyClient = new KeyClient(keyVaultUrl, credential);
  const blobServiceClient = new BlobServiceClient(storageAccountUrl, credential);

  return { credential, keyClient, blobServiceClient, keyVaultKeyName };
}

/**
 * Creates a CryptographyClient for a specific key version. Reuses the
 * shared credential from the config so no extra token fetches are needed.
 */
export function buildCryptographyClient(
  config: AzureConfig,
  keyId: string,
): CryptographyClient {
  return new CryptographyClient(keyId, config.credential);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
