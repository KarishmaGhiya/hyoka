import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { KeyVaultSecretProvider } from "./keyVaultSecretProvider";
import { SecretCache } from "./secretCache";
import { SecretRotationHelper } from "./secretRotationHelper";

export const KEY_VAULT_URL_ENV = "KEY_VAULT_URL";

export interface ConfigurationModule {
  vaultUrl: string;
  credential: ManagedIdentityCredential;
  secretClient: SecretClient;
  secretProvider: KeyVaultSecretProvider;
  secretCache: SecretCache;
  secretRotationHelper: SecretRotationHelper;
}

export function createConfigurationModule(): ConfigurationModule {
  const vaultUrl = process.env[KEY_VAULT_URL_ENV];

  if (!vaultUrl) {
    throw new Error(
      `Missing ${KEY_VAULT_URL_ENV}. Set it to your Azure Key Vault URL.`,
    );
  }

  const credential = new ManagedIdentityCredential();
  const secretClient = new SecretClient(vaultUrl, credential);
  const secretProvider = new KeyVaultSecretProvider(secretClient);
  const secretCache = new SecretCache(secretProvider);
  const secretRotationHelper = new SecretRotationHelper(secretClient);

  return {
    vaultUrl,
    credential,
    secretClient,
    secretProvider,
    secretCache,
    secretRotationHelper,
  };
}
