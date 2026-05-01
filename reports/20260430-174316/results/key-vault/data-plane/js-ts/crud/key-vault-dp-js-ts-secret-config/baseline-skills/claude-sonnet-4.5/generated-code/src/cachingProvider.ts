import { SecretProvider, SecretMetadata } from './secretProvider';

export interface CacheEntry {
  metadata: SecretMetadata;
  cachedAt: Date;
}

export interface CachingProviderOptions {
  expiryWarningDays?: number;
  autoRefreshExpiring?: boolean;
}

export class CachingProvider {
  private cache: Map<string, CacheEntry>;
  private provider: SecretProvider;
  private expiryWarningDays: number;
  private autoRefreshExpiring: boolean;

  constructor(provider: SecretProvider, options: CachingProviderOptions = {}) {
    this.provider = provider;
    this.cache = new Map();
    this.expiryWarningDays = options.expiryWarningDays ?? 7;
    this.autoRefreshExpiring = options.autoRefreshExpiring ?? true;
  }

  /**
   * Bulk-loads a predefined set of required config keys at startup
   * @param secretNames Array of secret names to preload
   * @param defaultValues Optional map of default values for each secret
   */
  async bulkLoad(
    secretNames: string[],
    defaultValues: Map<string, string> = new Map()
  ): Promise<void> {
    console.log(`Bulk loading ${secretNames.length} secrets...`);

    const promises = secretNames.map(async (name) => {
      const defaultValue = defaultValues.get(name) || '';
      const metadata = await this.provider.getSecret(name, defaultValue);
      this.cache.set(name, {
        metadata,
        cachedAt: new Date(),
      });
      console.log(`  ✓ Loaded: ${name}`);
    });

    await Promise.all(promises);
    console.log('Bulk load complete\n');
  }

  /**
   * Gets a secret value from cache, fetching from Key Vault if not cached
   * Automatically refreshes if secret is near expiry
   * @param secretName The name of the secret
   * @param defaultValue Value to return if secret doesn't exist
   * @returns The secret value
   */
  async get(secretName: string, defaultValue: string = ''): Promise<string> {
    let entry = this.cache.get(secretName);

    // Check if we need to refresh due to expiry
    if (entry && this.autoRefreshExpiring) {
      const shouldRefresh = await this.shouldRefreshForExpiry(entry.metadata);
      if (shouldRefresh) {
        console.log(`Auto-refreshing secret '${secretName}' due to approaching expiry...`);
        entry = undefined; // Force refresh
      }
    }

    // Fetch from Key Vault if not in cache
    if (!entry) {
      const metadata = await this.provider.getSecret(secretName, defaultValue);
      entry = {
        metadata,
        cachedAt: new Date(),
      };
      this.cache.set(secretName, entry);
    }

    return entry.metadata.value;
  }

  /**
   * Gets the full metadata for a secret from cache
   * @param secretName The name of the secret
   * @returns The secret metadata or undefined if not cached
   */
  getCached(secretName: string): SecretMetadata | undefined {
    const entry = this.cache.get(secretName);
    return entry?.metadata;
  }

  /**
   * On-demand refresh of an individual secret key
   * @param secretName The name of the secret to refresh
   * @param defaultValue Value to return if secret doesn't exist
   */
  async refresh(secretName: string, defaultValue: string = ''): Promise<void> {
    console.log(`Refreshing secret '${secretName}'...`);
    const metadata = await this.provider.getSecret(secretName, defaultValue);
    this.cache.set(secretName, {
      metadata,
      cachedAt: new Date(),
    });
    console.log(`  ✓ Refreshed: ${secretName}\n`);
  }

  /**
   * Checks all cached secrets for expiry warnings
   * @returns Array of secrets that are expiring soon
   */
  async checkExpiringSecrets(): Promise<
    Array<{ name: string; expiresOn?: Date; daysUntilExpiry?: number }>
  > {
    const expiringSecrets: Array<{
      name: string;
      expiresOn?: Date;
      daysUntilExpiry?: number;
    }> = [];

    for (const [name, entry] of this.cache.entries()) {
      if (entry.metadata.expiresOn) {
        const now = new Date();
        const daysUntilExpiry = Math.floor(
          (entry.metadata.expiresOn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= this.expiryWarningDays && daysUntilExpiry >= 0) {
          expiringSecrets.push({
            name,
            expiresOn: entry.metadata.expiresOn,
            daysUntilExpiry,
          });
        }
      }
    }

    return expiringSecrets;
  }

  /**
   * Clears the entire cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared\n');
  }

  /**
   * Clears a specific secret from cache
   * @param secretName The name of the secret to clear
   */
  clearSecret(secretName: string): void {
    this.cache.delete(secretName);
  }

  /**
   * Gets the number of secrets currently cached
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Determines if a secret should be refreshed based on expiry
   */
  private async shouldRefreshForExpiry(metadata: SecretMetadata): Promise<boolean> {
    if (!metadata.expiresOn) {
      return false;
    }

    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (metadata.expiresOn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysUntilExpiry <= this.expiryWarningDays && daysUntilExpiry >= 0;
  }
}
