import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { SecretProvider } from './SecretProvider';
import { CachedSecretProvider, CacheOptions } from './CachedSecretProvider';

export interface ConfigurationModuleOptions {
  vaultUrl?: string;
  cacheOptions?: CacheOptions;
}

export class ConfigurationModule {
  private secretClient: SecretClient;
  private secretProvider: SecretProvider;
  private cachedProvider: CachedSecretProvider;

  constructor(options?: ConfigurationModuleOptions) {
    // Get vault URL from environment variable or options
    const vaultUrl = options?.vaultUrl || process.env.AZURE_KEYVAULT_URL;
    
    if (!vaultUrl) {
      throw new Error(
        'Vault URL not provided. Set AZURE_KEYVAULT_URL environment variable or pass vaultUrl in options.'
      );
    }

    console.log(`Initializing configuration module with vault: ${vaultUrl}`);

    // Use DefaultAzureCredential for managed identity authentication
    // This works in Azure (managed identity) and locally (Azure CLI, VS Code, etc.)
    const credential = new DefaultAzureCredential();

    // Initialize the Key Vault client
    this.secretClient = new SecretClient(vaultUrl, credential);

    // Initialize provider layers
    this.secretProvider = new SecretProvider(this.secretClient);
    this.cachedProvider = new CachedSecretProvider(
      this.secretProvider,
      options?.cacheOptions
    );

    console.log('✓ Configuration module initialized');
  }

  /**
   * Gets the cached secret provider for configuration access
   */
  getProvider(): CachedSecretProvider {
    return this.cachedProvider;
  }

  /**
   * Gets the underlying secret provider for direct Key Vault access
   */
  getSecretProvider(): SecretProvider {
    return this.secretProvider;
  }

  /**
   * Gets the raw Secret Client for advanced operations
   */
  getSecretClient(): SecretClient {
    return this.secretClient;
  }

  /**
   * Initializes the configuration by bulk-loading required secrets
   * @param requiredSecrets Array of secret names to preload
   * @param defaults Optional default values
   */
  async initialize(requiredSecrets: string[], defaults?: Record<string, string>): Promise<void> {
    console.log('Initializing configuration...');
    await this.cachedProvider.bulkLoad(requiredSecrets, defaults);
    console.log('✓ Configuration initialized');
  }

  /**
   * Gets a configuration value
   * @param key Configuration key (secret name)
   * @param defaultValue Default value if not found
   */
  async getConfig(key: string, defaultValue?: string): Promise<string | null> {
    return await this.cachedProvider.get(key, defaultValue);
  }

  /**
   * Refreshes a configuration value from Key Vault
   * @param key Configuration key to refresh
   */
  async refreshConfig(key: string): Promise<void> {
    await this.cachedProvider.refresh(key);
  }

  /**
   * Checks for expiring secrets and returns their names
   */
  async checkHealth(): Promise<string[]> {
    return await this.cachedProvider.checkExpiringSecrets();
  }
}
