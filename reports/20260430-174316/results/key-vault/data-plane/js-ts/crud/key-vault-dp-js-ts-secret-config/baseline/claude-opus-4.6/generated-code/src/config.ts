import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Build a SecretClient that authenticates via managed identity.
 *
 * The vault URL is read from the `AZURE_KEYVAULT_URL` environment variable
 * (e.g. "https://my-vault.vault.azure.net").
 *
 * `DefaultAzureCredential` automatically picks up managed identity when
 * running in Azure, and falls back to other credential types (CLI, env vars)
 * during local development.
 */
export function createSecretClient(): SecretClient {
  const vaultUrl = process.env.AZURE_KEYVAULT_URL;
  if (!vaultUrl) {
    throw new Error(
      "Environment variable AZURE_KEYVAULT_URL must be set " +
        '(e.g. "https://my-vault.vault.azure.net").'
    );
  }

  const credential = new DefaultAzureCredential();
  return new SecretClient(vaultUrl, credential);
}
