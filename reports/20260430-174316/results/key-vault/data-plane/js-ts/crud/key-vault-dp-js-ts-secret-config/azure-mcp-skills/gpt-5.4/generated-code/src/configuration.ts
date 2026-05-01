import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

import { CachedSecretProvider } from "./cachedSecretProvider";
import { KeyVaultSecretProvider } from "./keyVaultSecretProvider";
import { SecretRotationHelper } from "./secretRotationHelper";
import { CacheOptions } from "./types";

const KEY_VAULT_URL_ENV = "KEY_VAULT_URL";
const MANAGED_IDENTITY_CLIENT_ID_ENV = "AZURE_CLIENT_ID";

export interface ConfigurationModule {
  client: SecretClient;
  provider: KeyVaultSecretProvider;
  cache: CachedSecretProvider;
  rotationHelper: SecretRotationHelper;
}

export function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set.`);
  }

  return value;
}

export function createManagedIdentityCredential(): ManagedIdentityCredential {
  const clientId = process.env[MANAGED_IDENTITY_CLIENT_ID_ENV];
  return clientId
    ? new ManagedIdentityCredential({ clientId })
    : new ManagedIdentityCredential();
}

export function createSecretClient(): SecretClient {
  const vaultUrl = getRequiredEnvironmentVariable(KEY_VAULT_URL_ENV);
  return new SecretClient(vaultUrl, createManagedIdentityCredential());
}

export function createConfigurationModule(
  cacheOptions: CacheOptions,
): ConfigurationModule {
  const client = createSecretClient();
  const provider = new KeyVaultSecretProvider(client);
  const cache = new CachedSecretProvider(provider, cacheOptions);
  const rotationHelper = new SecretRotationHelper(client);

  return {
    client,
    provider,
    cache,
    rotationHelper,
  };
}
