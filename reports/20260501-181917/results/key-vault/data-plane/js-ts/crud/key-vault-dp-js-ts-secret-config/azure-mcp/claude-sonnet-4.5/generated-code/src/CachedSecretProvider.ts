import { SecretProvider, SecretMetadata } from './SecretProvider';

interface CacheEntry {
  value: string;
  metadata?: SecretMetadata;
  cachedAt: Date;
}

export interface CacheOptions {
  expiryWarningDays?: number; // Auto-refresh secrets expiring within this window
}

export class CachedSecretProvider {
  private provider: SecretProvider;
  private cache: Map<string, CacheEntry>;
  private options: Required<CacheOptions>;

  constructor(provider: SecretProvider, options: CacheOptions = {}) {
    this.provider = provider;
    this.cache = new Map();
    this.options = {
      expiryWarningDays: options.expiryWarningDays ?? 7,
    };
  }

  /**
   * Bulk-loads a predefined set of required config keys at startup.
   */
  async bulkLoad(secretNames: string[]): Promise<Map<string, string | undefined>> {
    const results = new Map<string, string | undefined>();

    await Promise.all(
      secretNames.map(async (name) => {
        try {
          const metadata = await this.provider.getSecretMetadata(name);
          if (metadata) {
            this.cache.set(name, {
              value: metadata.value,
              metadata,
              cachedAt: new Date(),
            });
            results.set(name, metadata.value);
          } else {
            results.set(name, undefined);
          }
        } catch (error) {
          console.error(`Failed to load secret ${name}:`, error);
          results.set(name, undefined);
        }
      })
    );

    return results;
  }

  /**
   * Gets a secret value from cache. If not cached, fetches from provider and caches it.
   */
  async get(name: string, defaultValue?: string): Promise<string | undefined> {
    const cached = this.cache.get(name);
    
    if (cached) {
      // Check if secret is expiring soon and auto-refresh
      if (cached.metadata && await this.shouldRefresh(cached.metadata)) {
        return await this.refresh(name, defaultValue);
      }
      return cached.value;
    }

    // Not in cache, fetch and cache
    return await this.refresh(name, defaultValue);
  }

  /**
   * On-demand refresh of an individual key.
   */
  async refresh(name: string, defaultValue?: string): Promise<string | undefined> {
    const metadata = await this.provider.getSecretMetadata(name);
    
    if (metadata) {
      this.cache.set(name, {
        value: metadata.value,
        metadata,
        cachedAt: new Date(),
      });
      return metadata.value;
    }

    // Secret doesn't exist, return default
    this.cache.delete(name);
    return defaultValue;
  }

  /**
   * Refreshes all cached secrets.
   */
  async refreshAll(): Promise<void> {
    const names = Array.from(this.cache.keys());
    await Promise.all(names.map((name) => this.refresh(name)));
  }

  /**
   * Gets metadata for a cached secret.
   */
  getCachedMetadata(name: string): SecretMetadata | undefined {
    return this.cache.get(name)?.metadata;
  }

  /**
   * Checks if any cached secrets are expiring soon.
   */
  async checkExpiringSecrets(): Promise<Map<string, number>> {
    const expiring = new Map<string, number>();

    for (const [name, entry] of this.cache.entries()) {
      if (entry.metadata) {
        const daysUntilExpiry = await this.provider.getDaysUntilExpiry(name);
        if (daysUntilExpiry !== null && daysUntilExpiry <= this.options.expiryWarningDays) {
          expiring.set(name, daysUntilExpiry);
        }
      }
    }

    return expiring;
  }

  /**
   * Clears the entire cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Removes a specific secret from cache.
   */
  evict(name: string): void {
    this.cache.delete(name);
  }

  /**
   * Gets all cached secret names.
   */
  getCachedNames(): string[] {
    return Array.from(this.cache.keys());
  }

  private async shouldRefresh(metadata: SecretMetadata): Promise<boolean> {
    if (!metadata.expiresOn) {
      return false;
    }

    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + this.options.expiryWarningDays);

    return metadata.expiresOn <= warningDate;
  }
}
