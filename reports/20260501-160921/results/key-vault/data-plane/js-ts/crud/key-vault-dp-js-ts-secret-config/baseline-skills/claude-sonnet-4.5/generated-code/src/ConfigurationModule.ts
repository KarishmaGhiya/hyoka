import { DefaultAzureCredential } from "@azure/identity";
import { SecretProvider } from "./SecretProvider";
import { CachingSecretProvider } from "./CachingSecretProvider";

export interface ConfigurationOptions {
  vaultUrl?: string;
  expiryWarningDays?: number;
}

export class ConfigurationModule {
  private static instance: ConfigurationModule;
  private cachingProvider: CachingSecretProvider;
  private vaultUrl: string;

  private constructor(options: ConfigurationOptions = {}) {
    // Get vault URL from environment variable or options
    this.vaultUrl =
      options.vaultUrl || process.env.AZURE_KEYVAULT_URL || "";

    if (!this.vaultUrl) {
      throw new Error(
        "Vault URL must be provided via AZURE_KEYVAULT_URL environment variable or options"
      );
    }

    // Use DefaultAzureCredential for managed identity authentication
    // This works both in Azure (managed identity) and locally (Azure CLI)
    const credential = new DefaultAzureCredential();

    const secretProvider = new SecretProvider(this.vaultUrl, credential);
    this.cachingProvider = new CachingSecretProvider(
      secretProvider,
      options.expiryWarningDays || 7
    );

    console.log(`Configuration module initialized with vault: ${this.vaultUrl}`);
  }

  /**
   * Gets the singleton instance of the configuration module.
   * @param options - Configuration options (only used on first call)
   * @returns ConfigurationModule instance
   */
  static getInstance(options?: ConfigurationOptions): ConfigurationModule {
    if (!ConfigurationModule.instance) {
      ConfigurationModule.instance = new ConfigurationModule(options);
    }
    return ConfigurationModule.instance;
  }

  /**
   * Initializes the configuration by bulk-loading required secrets.
   * @param secretNames - Array of secret names to preload
   */
  async initialize(secretNames: string[]): Promise<void> {
    await this.cachingProvider.bulkLoad(secretNames);
    console.log("Configuration module initialized successfully.");
  }

  /**
   * Gets a configuration value by key.
   * @param key - The configuration key (secret name)
   * @param defaultValue - Default value if key doesn't exist
   * @returns The configuration value
   */
  async get(key: string, defaultValue?: string): Promise<string> {
    return await this.cachingProvider.getSecret(key, defaultValue);
  }

  /**
   * Refreshes a specific configuration key from Key Vault.
   * @param key - The configuration key to refresh
   */
  async refresh(key: string): Promise<string> {
    return await this.cachingProvider.refreshSecret(key);
  }

  /**
   * Checks for secrets that are expiring soon.
   * @returns Array of secret names expiring soon
   */
  async checkExpiring(): Promise<string[]> {
    return await this.cachingProvider.checkExpiringSecrets();
  }

  /**
   * Gets the underlying caching provider for advanced operations.
   */
  getCachingProvider(): CachingSecretProvider {
    return this.cachingProvider;
  }

  /**
   * Gets the vault URL being used.
   */
  getVaultUrl(): string {
    return this.vaultUrl;
  }
}
