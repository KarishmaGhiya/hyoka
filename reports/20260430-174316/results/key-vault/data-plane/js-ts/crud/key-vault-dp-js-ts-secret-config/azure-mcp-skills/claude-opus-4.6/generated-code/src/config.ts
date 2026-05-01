import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretProvider } from "./secretProvider";
import { CachingSecretProvider, CachingProviderOptions } from "./cachingLayer";

const VAULT_URL_ENV = "AZURE_KEYVAULT_URL";

/**
 * Build a fully configured CachingSecretProvider connected to the
 * Key Vault specified by the AZURE_KEYVAULT_URL environment variable.
 *
 * Authentication uses DefaultAzureCredential which, in Azure,
 * resolves to managed identity — no client secrets or certificates needed.
 */
export function createConfigProvider(
  options: CachingProviderOptions = {}
): CachingSecretProvider {
  const vaultUrl = process.env[VAULT_URL_ENV];
  if (!vaultUrl) {
    throw new Error(
      `Environment variable ${VAULT_URL_ENV} is not set. ` +
        `Set it to your Key Vault URL (e.g. https://my-vault.vault.azure.net).`
    );
  }

  const credential = new DefaultAzureCredential();
  const client = new SecretClient(vaultUrl, credential);
  const provider = new SecretProvider(client);

  return new CachingSecretProvider(provider, options);
}

/**
 * Return the raw SecretClient for advanced operations (e.g. rotation).
 */
export function createSecretClient(): SecretClient {
  const vaultUrl = process.env[VAULT_URL_ENV];
  if (!vaultUrl) {
    throw new Error(
      `Environment variable ${VAULT_URL_ENV} is not set. ` +
        `Set it to your Key Vault URL (e.g. https://my-vault.vault.azure.net).`
    );
  }

  const credential = new DefaultAzureCredential();
  return new SecretClient(vaultUrl, credential);
}
