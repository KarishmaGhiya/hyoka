import { SecretProvider, SecretInfo } from './SecretProvider';

interface CacheEntry {
  value: string;
  expiresOn?: Date;
  cachedAt: Date;
}

export class CachingSecretProvider {
  private cache: Map<string, CacheEntry> = new Map();
  private warningWindowDays: number;

  constructor(
    private provider: SecretProvider,
    warningWindowDays: number = 7
  ) {
    this.warningWindowDays = warningWindowDays;
  }

  /**
   * Bulk-loads a predefined set of required config keys at startup.
   */
  async bulkLoad(keys: string[]): Promise<void> {
    const promises = keys.map(async (key) => {
      const info = await this.provider.getSecretInfo(key);
      if (info) {
        this.cache.set(key, {
          value: info.value,
          expiresOn: info.expiresOn,
          cachedAt: new Date(),
        });
      }
    });
    await Promise.all(promises);
  }

  /**
   * Gets a secret from cache. If not cached, fetches from provider and caches it.
   */
  async get(name: string, defaultValue?: string): Promise<string | undefined> {
    const cached = this.cache.get(name);
    if (cached) {
      return cached.value;
    }

    const value = await this.provider.getSecret(name, defaultValue);
    if (value !== undefined) {
      this.cache.set(name, {
        value,
        cachedAt: new Date(),
      });
    }
    return value;
  }

  /**
   * Refreshes a single key by fetching from provider and updating cache.
   */
  async refresh(name: string): Promise<void> {
    const info = await this.provider.getSecretInfo(name);
    if (info) {
      this.cache.set(name, {
        value: info.value,
        expiresOn: info.expiresOn,
        cachedAt: new Date(),
      });
    } else {
      this.cache.delete(name);
    }
  }

  /**
   * Refreshes all secrets that are near expiry.
   */
  async refreshExpiring(): Promise<string[]> {
    const refreshed: string[] = [];
    for (const [name, entry] of this.cache.entries()) {
      if (this.provider.isNearExpiry(entry.expiresOn, this.warningWindowDays)) {
        await this.refresh(name);
        refreshed.push(name);
      }
    }
    return refreshed;
  }

  /**
   * Checks if any cached secrets are near expiry.
   */
  getExpiringSecrets(): Array<{ name: string; expiresOn: Date }> {
    const expiring: Array<{ name: string; expiresOn: Date }> = [];
    for (const [name, entry] of this.cache.entries()) {
      if (entry.expiresOn && this.provider.isNearExpiry(entry.expiresOn, this.warningWindowDays)) {
        expiring.push({ name, expiresOn: entry.expiresOn });
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
   * Gets all cached keys.
   */
  getCachedKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Gets cache statistics.
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: this.getCachedKeys(),
    };
  }
}
