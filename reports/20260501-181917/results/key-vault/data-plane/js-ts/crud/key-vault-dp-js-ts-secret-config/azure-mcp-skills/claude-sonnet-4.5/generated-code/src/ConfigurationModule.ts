import { SecretClient } from "@azure/keyvault-secrets";
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretProvider } from "./SecretProvider.js";
import { CachedSecretProvider, CacheOptions } from "./CachedSecretProvider.js";

/**
 * Configuration module that sets up Key Vault connection using managed identity
 */
export class ConfigurationModule {
  private readonly secretClient: SecretClient;
  private readonly secretProvider: SecretProvider;
  private readonly cachedProvider: CachedSecretProvider;

  constructor(cacheOptions?: CacheOptions) {
    // Get vault URL from environment variable
    const vaultUrl = process.env.KEY_VAULT_URL;
    if (!vaultUrl) {
      throw new Error("KEY_VAULT_URL environment variable is required");
    }

    // Use managed identity for authentication (for Azure-hosted apps)
    const credential = new ManagedIdentityCredential();

    // Initialize clients
    this.secretClient = new SecretClient(vaultUrl, credential);
    this.secretProvider = new SecretProvider(this.secretClient);
    this.cachedProvider = new CachedSecretProvider(this.secretProvider, cacheOptions);

    console.log(`✅ Configuration module initialized with vault: ${vaultUrl}`);
  }

  /**
   * Get the secret provider (direct access, no caching)
   */
  getSecretProvider(): SecretProvider {
    return this.secretProvider;
  }

  /**
   * Get the cached secret provider (recommended for most use cases)
   */
  getCachedProvider(): CachedSecretProvider {
    return this.cachedProvider;
  }

  /**
   * Get the underlying SecretClient for advanced operations
   */
  getSecretClient(): SecretClient {
    return this.secretClient;
  }
}
