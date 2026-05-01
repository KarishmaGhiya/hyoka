import { DefaultAzureCredential } from "@azure/identity";
import { KeyClient, CryptographyClient } from "@azure/keyvault-keys";
import { BlobServiceClient } from "@azure/storage-blob";

/**
 * Centralized configuration that builds Azure service clients
 * from environment variables, sharing a single credential instance.
 *
 * Required environment variables:
 *   KEY_VAULT_URL        – e.g. https://my-vault.vault.azure.net
 *   KEY_VAULT_KEY_NAME   – name of the RSA key in Key Vault
 *   STORAGE_ACCOUNT_URL  – e.g. https://myaccount.blob.core.windows.net
 *   STORAGE_CONTAINER    – blob container name
 */

export interface AppConfig {
  credential: DefaultAzureCredential;
  keyClient: KeyClient;
  blobServiceClient: BlobServiceClient;
  vaultKeyName: string;
  containerName: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function buildConfig(): AppConfig {
  const vaultUrl = requireEnv("KEY_VAULT_URL");
  const vaultKeyName = requireEnv("KEY_VAULT_KEY_NAME");
  const storageUrl = requireEnv("STORAGE_ACCOUNT_URL");
  const containerName = requireEnv("STORAGE_CONTAINER");

  const credential = new DefaultAzureCredential();

  return {
    credential,
    keyClient: new KeyClient(vaultUrl, credential),
    blobServiceClient: new BlobServiceClient(storageUrl, credential),
    vaultKeyName,
    containerName,
  };
}

/**
 * Creates a CryptographyClient for a specific key version.
 * The key ID is the full versioned URI returned by Key Vault.
 */
export function buildCryptoClient(
  keyId: string,
  credential: DefaultAzureCredential,
): CryptographyClient {
  return new CryptographyClient(keyId, credential);
}
