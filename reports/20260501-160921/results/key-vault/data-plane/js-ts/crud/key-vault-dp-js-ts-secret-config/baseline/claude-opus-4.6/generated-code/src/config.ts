import { SecretClient } from "@azure/keyvault-secrets";
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretProvider } from "./secretProvider";
import { CachedConfigProvider, CachedConfigOptions } from "./cachedConfigProvider";

/**
 * Create a CachedConfigProvider connected to Azure Key Vault.
 *
 * Authenticates with managed identity — no client secrets or certificates
 * required. The vault URL is read from the KEY_VAULT_URL environment variable.
 */
export function createConfigProvider(
  options?: CachedConfigOptions,
): CachedConfigProvider {
  const vaultUrl = process.env.KEY_VAULT_URL;
  if (!vaultUrl) {
    throw new Error(
      "KEY_VAULT_URL environment variable is required (e.g. https://my-vault.vault.azure.net)",
    );
  }

  const credential = new ManagedIdentityCredential();
  const secretClient = new SecretClient(vaultUrl, credential);
  const provider = new SecretProvider(secretClient);

  return new CachedConfigProvider(provider, options);
}

export { SecretProvider } from "./secretProvider";
export { CachedConfigProvider } from "./cachedConfigProvider";
export type { SecretInfo } from "./secretProvider";
export type { CachedConfigOptions } from "./cachedConfigProvider";
