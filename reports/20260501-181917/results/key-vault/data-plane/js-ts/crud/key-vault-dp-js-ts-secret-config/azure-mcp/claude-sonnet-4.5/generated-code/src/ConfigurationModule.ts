import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretProvider } from './SecretProvider';
import { CachedSecretProvider, CacheOptions } from './CachedSecretProvider';

export interface ConfigurationModuleOptions {
  vaultUrl?: string; // If not provided, reads from AZURE_KEYVAULT_URL env var
  cacheOptions?: CacheOptions;
}

export class ConfigurationModule {
  private secretClient: SecretClient;
  private secretProvider: SecretProvider;
  private cachedProvider: CachedSecretProvider;

  constructor(options: ConfigurationModuleOptions = {}) {
    const vaultUrl = options.vaultUrl || process.env.AZURE_KEYVAULT_URL;

    if (!vaultUrl) {
      throw new Error(
        'Vault URL must be provided via options.vaultUrl or AZURE_KEYVAULT_URL environment variable'
      );
    }

    // Use DefaultAzureCredential for managed identity authentication
    const credential = new DefaultAzureCredential();
    
    this.secretClient = new SecretClient(vaultUrl, credential);
    this.secretProvider = new SecretProvider(this.secretClient);
    this.cachedProvider = new CachedSecretProvider(
      this.secretProvider,
      options.cacheOptions
    );
  }

  /**
   * Gets the underlying SecretProvider (uncached).
   */
  getSecretProvider(): SecretProvider {
    return this.secretProvider;
  }

  /**
   * Gets the CachedSecretProvider.
   */
  getCachedProvider(): CachedSecretProvider {
    return this.cachedProvider;
  }

  /**
   * Gets the underlying SecretClient for advanced operations.
   */
  getSecretClient(): SecretClient {
    return this.secretClient;
  }

  /**
   * Convenience method to bulk-load config keys at startup.
   */
  async initialize(requiredKeys: string[]): Promise<void> {
    console.log(`Initializing configuration with ${requiredKeys.length} keys...`);
    const results = await this.cachedProvider.bulkLoad(requiredKeys);
    
    const missing = Array.from(results.entries())
      .filter(([_, value]) => value === undefined)
      .map(([name]) => name);

    if (missing.length > 0) {
      console.warn(`Warning: ${missing.length} secrets not found: ${missing.join(', ')}`);
    } else {
      console.log('All configuration keys loaded successfully.');
    }
  }

  /**
   * Gets a configuration value from cache.
   */
  async get(key: string, defaultValue?: string): Promise<string | undefined> {
    return await this.cachedProvider.get(key, defaultValue);
  }

  /**
   * Refreshes a specific configuration key.
   */
  async refresh(key: string): Promise<void> {
    await this.cachedProvider.refresh(key);
  }

  /**
   * Checks for expiring secrets and logs warnings.
   */
  async checkExpiry(): Promise<Map<string, number>> {
    const expiring = await this.cachedProvider.checkExpiringSecrets();
    
    if (expiring.size > 0) {
      console.warn('⚠️  WARNING: The following secrets are expiring soon:');
      for (const [name, days] of expiring.entries()) {
        console.warn(`  - ${name}: ${days} day(s) remaining`);
      }
    }

    return expiring;
  }
}
