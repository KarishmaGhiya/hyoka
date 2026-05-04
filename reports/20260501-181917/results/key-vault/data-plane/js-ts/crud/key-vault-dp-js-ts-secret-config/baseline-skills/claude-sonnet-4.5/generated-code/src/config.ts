import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { SecretProvider } from "./secretProvider.js";
import { CachingSecretProvider } from "./cachingProvider.js";

export interface ConfigModuleOptions {
  vaultUrl?: string;
  expiryWarningDays?: number;
}

export class ConfigModule {
  private secretClient: SecretClient;
  private secretProvider: SecretProvider;
  private cachingProvider: CachingSecretProvider;

  constructor(options?: ConfigModuleOptions) {
    const vaultUrl =
      options?.vaultUrl || process.env.KEY_VAULT_URL || process.env.AZURE_KEYVAULT_URL;

    if (!vaultUrl) {
      throw new Error(
        "KEY_VAULT_URL or AZURE_KEYVAULT_URL environment variable is required"
      );
    }

    // Use Managed Identity for Azure authentication (no secrets in code)
    const credential = new ManagedIdentityCredential();

    this.secretClient = new SecretClient(vaultUrl, credential);
    this.secretProvider = new SecretProvider(this.secretClient);
    this.cachingProvider = new CachingSecretProvider(this.secretProvider, {
      expiryWarningDays: options?.expiryWarningDays,
    });

    console.log(`🔐 Connected to Key Vault: ${vaultUrl}`);
    console.log(`🆔 Using Managed Identity authentication`);
  }

  /**
   * Get the underlying SecretClient for advanced operations
   */
  getSecretClient(): SecretClient {
    return this.secretClient;
  }

  /**
   * Get the secret provider (no caching)
   */
  getSecretProvider(): SecretProvider {
    return this.secretProvider;
  }

  /**
   * Get the caching provider
   */
  getCachingProvider(): CachingSecretProvider {
    return this.cachingProvider;
  }
}
