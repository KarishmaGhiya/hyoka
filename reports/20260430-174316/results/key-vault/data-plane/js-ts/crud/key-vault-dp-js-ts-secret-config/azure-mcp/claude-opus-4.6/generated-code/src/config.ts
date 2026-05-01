import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { SecretProvider } from "./secretProvider";
import { CachingSecretProvider, CachingProviderOptions } from "./cachingProvider";

const VAULT_URL_ENV = "AZURE_KEYVAULT_URL";

/**
 * Build a CachingSecretProvider connected to the Key Vault whose URL is
 * defined in the AZURE_KEYVAULT_URL environment variable.
 *
 * Authentication uses DefaultAzureCredential which resolves — in order —
 * managed identity, Azure CLI, environment variables, etc.  In production
 * on Azure this means no client secrets or certificates are needed.
 */
export function createConfigProvider(
  options?: CachingProviderOptions
): { provider: SecretProvider; cache: CachingSecretProvider; client: SecretClient } {
  const vaultUrl = process.env[VAULT_URL_ENV];
  if (!vaultUrl) {
    throw new Error(
      `Environment variable ${VAULT_URL_ENV} is required. ` +
        `Set it to your vault URL, e.g. https://my-vault.vault.azure.net`
    );
  }

  const credential = new DefaultAzureCredential();
  const client = new SecretClient(vaultUrl, credential);
  const provider = new SecretProvider(client);
  const cache = new CachingSecretProvider(provider, options);

  return { provider, cache, client };
}
