import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretProvider } from './SecretProvider';
import { CachingSecretProvider } from './CachingSecretProvider';

export class ConfigurationModule {
  private client: SecretClient;
  private provider: SecretProvider;
  private cachingProvider: CachingSecretProvider;

  constructor(vaultUrl?: string, warningWindowDays: number = 7) {
    const keyVaultUrl = vaultUrl || process.env.AZURE_KEYVAULT_URL;
    
    if (!keyVaultUrl) {
      throw new Error('Vault URL must be provided via constructor or AZURE_KEYVAULT_URL environment variable');
    }

    // Use DefaultAzureCredential for managed identity support
    const credential = new DefaultAzureCredential();
    
    this.client = new SecretClient(keyVaultUrl, credential);
    this.provider = new SecretProvider(this.client);
    this.cachingProvider = new CachingSecretProvider(this.provider, warningWindowDays);
  }

  /**
   * Gets the underlying SecretClient.
   */
  getClient(): SecretClient {
    return this.client;
  }

  /**
   * Gets the SecretProvider (direct access, no caching).
   */
  getProvider(): SecretProvider {
    return this.provider;
  }

  /**
   * Gets the CachingSecretProvider (with caching).
   */
  getCachingProvider(): CachingSecretProvider {
    return this.cachingProvider;
  }

  /**
   * Initializes the configuration by bulk-loading required keys.
   */
  async initialize(requiredKeys: string[]): Promise<void> {
    await this.cachingProvider.bulkLoad(requiredKeys);
  }
}
