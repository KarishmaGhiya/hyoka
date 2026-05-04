import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretProvider } from './SecretProvider';
import { CachedSecretProvider } from './CachedSecretProvider';

export class ConfigurationModule {
  private secretClient: SecretClient;
  private secretProvider: SecretProvider;
  private cachedProvider: CachedSecretProvider;

  constructor(vaultUrl?: string, expiryWarningDays: number = 7) {
    const keyVaultUrl = vaultUrl || process.env.AZURE_KEY_VAULT_URL;

    if (!keyVaultUrl) {
      throw new Error(
        'Key Vault URL must be provided via constructor or AZURE_KEY_VAULT_URL environment variable'
      );
    }

    const credential = new DefaultAzureCredential();
    this.secretClient = new SecretClient(keyVaultUrl, credential);
    this.secretProvider = new SecretProvider(this.secretClient);
    this.cachedProvider = new CachedSecretProvider(
      this.secretProvider,
      expiryWarningDays
    );

    console.log(`Configuration module initialized with Key Vault: ${keyVaultUrl}`);
  }

  getSecretProvider(): SecretProvider {
    return this.secretProvider;
  }

  getCachedProvider(): CachedSecretProvider {
    return this.cachedProvider;
  }

  getSecretClient(): SecretClient {
    return this.secretClient;
  }

  async initialize(requiredSecrets: string[]): Promise<void> {
    console.log('Initializing configuration module...');
    await this.cachedProvider.bulkLoad(requiredSecrets);
    console.log('Configuration module ready');
  }
}
