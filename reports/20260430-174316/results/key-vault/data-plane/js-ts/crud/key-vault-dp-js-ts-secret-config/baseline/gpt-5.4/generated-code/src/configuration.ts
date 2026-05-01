import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { CachedSecretProvider } from "./CachedSecretProvider";
import { KeyVaultSecretProvider } from "./KeyVaultSecretProvider";
import { SecretRotationHelper } from "./SecretRotationHelper";

export interface KeyVaultConfiguration {
  vaultUrl: string;
  client: SecretClient;
  provider: KeyVaultSecretProvider;
  cache: CachedSecretProvider;
  rotationHelper: SecretRotationHelper;
}

export function createKeyVaultConfiguration(options?: {
  expiryWarningWindowMs?: number;
}): KeyVaultConfiguration {
  const vaultUrl = process.env.AZURE_KEY_VAULT_URL;

  if (vaultUrl === undefined || vaultUrl.trim() === "") {
    throw new Error(
      "AZURE_KEY_VAULT_URL must be set to the https://<vault-name>.vault.azure.net URL.",
    );
  }

  const managedIdentityClientId = process.env.AZURE_CLIENT_ID;
  const credential =
    managedIdentityClientId === undefined || managedIdentityClientId.trim() === ""
      ? new ManagedIdentityCredential()
      : new ManagedIdentityCredential(managedIdentityClientId);
  const client = new SecretClient(vaultUrl, credential);
  const provider = new KeyVaultSecretProvider(client);
  const cache = new CachedSecretProvider(provider, {
    expiryWarningWindowMs: options?.expiryWarningWindowMs,
  });
  const rotationHelper = new SecretRotationHelper(client);

  return {
    vaultUrl,
    client,
    provider,
    cache,
    rotationHelper,
  };
}
