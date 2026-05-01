import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Creates a SecretClient connected to the Key Vault URL found in the
 * `AZURE_KEYVAULT_URL` environment variable, authenticating via managed
 * identity (through DefaultAzureCredential).
 */
export function createKeyVaultClient(): SecretClient {
  const vaultUrl = process.env.AZURE_KEYVAULT_URL;
  if (!vaultUrl) {
    throw new Error(
      "Environment variable AZURE_KEYVAULT_URL is not set. " +
        "Set it to your Key Vault URL, e.g. https://my-vault.vault.azure.net"
    );
  }

  // DefaultAzureCredential automatically uses managed identity when
  // running in Azure, and falls back to other credential types (CLI,
  // environment variables) during local development.
  const credential = new DefaultAzureCredential();
  return new SecretClient(vaultUrl, credential);
}
