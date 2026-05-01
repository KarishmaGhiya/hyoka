import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

import { KeyVaultSecretProvider } from "./keyVaultSecretProvider";
import { SecretRotationHelper } from "./secretRotationHelper";
import { SecretCache } from "./secretCache";

export interface AppConfigServices {
  client: SecretClient;
  provider: KeyVaultSecretProvider;
  cache: SecretCache;
  rotationHelper: SecretRotationHelper;
}

function requireVaultUrl(): string {
  const vaultUrl = process.env.KEY_VAULT_URL ?? process.env.AZURE_KEY_VAULT_URL;

  if (!vaultUrl) {
    throw new Error("Set KEY_VAULT_URL (or AZURE_KEY_VAULT_URL) to your Azure Key Vault URL.");
  }

  return vaultUrl;
}

function createManagedIdentityCredential(): ManagedIdentityCredential {
  const clientId = process.env.AZURE_CLIENT_ID;
  return clientId ? new ManagedIdentityCredential(clientId) : new ManagedIdentityCredential();
}

export function createSecretClient(): SecretClient {
  return new SecretClient(requireVaultUrl(), createManagedIdentityCredential());
}

export function createAppConfigServices(
  requiredKeys: string[],
  defaultValues: Record<string, string>,
  expiryWarningWindowMs: number
): AppConfigServices {
  const client = createSecretClient();
  const provider = new KeyVaultSecretProvider(client);
  const cache = new SecretCache(provider, {
    requiredKeys,
    defaultValues,
    expiryWarningWindowMs
  });
  const rotationHelper = new SecretRotationHelper(client);

  return {
    client,
    provider,
    cache,
    rotationHelper
  };
}
