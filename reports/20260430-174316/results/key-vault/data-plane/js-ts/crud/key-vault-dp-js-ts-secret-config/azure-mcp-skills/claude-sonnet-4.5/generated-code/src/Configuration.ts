import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretProvider } from './SecretProvider';
import { SecretCache } from './SecretCache';

export class Configuration {
  private client: SecretClient;
  private provider: SecretProvider;
  private cache: SecretCache;
  private vaultUrl: string;

  constructor(vaultUrl?: string, expiryWarningDays: number = 7) {
    this.vaultUrl = vaultUrl || process.env.KEY_VAULT_URL || '';
    
    if (!this.vaultUrl) {
      throw new Error('KEY_VAULT_URL environment variable is not set');
    }

    const credential = new DefaultAzureCredential();
    this.client = new SecretClient(this.vaultUrl, credential);
    this.provider = new SecretProvider(this.client);
    this.cache = new SecretCache(this.provider, expiryWarningDays);

    console.log(`[Config] Initialized with vault: ${this.vaultUrl}`);
    console.log(`[Config] Using Managed Identity for authentication`);
  }

  getProvider(): SecretProvider {
    return this.provider;
  }

  getCache(): SecretCache {
    return this.cache;
  }

  getClient(): SecretClient {
    return this.client;
  }

  getVaultUrl(): string {
    return this.vaultUrl;
  }

  async initialize(requiredKeys: string[]): Promise<void> {
    console.log('[Config] Initializing configuration...');
    await this.cache.bulkLoad(requiredKeys);
    console.log('[Config] Initialization complete');
  }
}
