import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Build a {@link SecretClient} that authenticates via managed identity
 * (or any credential in the {@link DefaultAzureCredential} chain when
 * running locally).
 *
 * The vault URL is read from the `AZURE_KEYVAULT_URL` environment variable.
 * Example value: `https://my-vault.vault.azure.net`
 */
export function createSecretClient(): SecretClient {
  const vaultUrl = process.env.AZURE_KEYVAULT_URL;
  if (!vaultUrl) {
    throw new Error(
      "Environment variable AZURE_KEYVAULT_URL is required " +
        "(e.g. https://my-vault.vault.azure.net)",
    );
  }

  // DefaultAzureCredential automatically uses ManagedIdentityCredential when
  // running in Azure, and falls back to AzureCliCredential / other developer
  // credentials locally — no client secrets or certificates needed.
  const credential = new DefaultAzureCredential();
  return new SecretClient(vaultUrl, credential);
}
