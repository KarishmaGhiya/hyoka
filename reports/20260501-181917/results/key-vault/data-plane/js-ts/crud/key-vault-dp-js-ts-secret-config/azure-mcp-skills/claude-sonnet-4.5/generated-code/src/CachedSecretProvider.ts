import { SecretProvider, SecretExpiryInfo } from "./SecretProvider.js";

/**
 * Configuration options for the caching layer
 */
export interface CacheOptions {
  expiryWarningDays?: number;
}

/**
 * Cached secret entry with metadata
 */
interface CacheEntry {
  value: string;
  fetchedAt: Date;
  expiresOn?: Date;
}

/**
 * CachedSecretProvider adds an in-memory caching layer on top of SecretProvider
 */
export class CachedSecretProvider {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly expiryWarningDays: number;

  constructor(
    private readonly secretProvider: SecretProvider,
    options?: CacheOptions
  ) {
    this.expiryWarningDays = options?.expiryWarningDays ?? 7;
  }

  /**
   * Get a secret from cache or fetch if not cached
   * @param secretName - Name of the secret
   * @param defaultValue - Default value if secret not found
   * @returns The secret value
   */
  async get(secretName: string, defaultValue?: string): Promise<string> {
    const cached = this.cache.get(secretName);
    if (cached) {
      return cached.value;
    }

    return this.refresh(secretName, defaultValue);
  }

  /**
   * Force refresh a secret from Key Vault and update cache
   * @param secretName - Name of the secret
   * @param defaultValue - Default value if secret not found
   * @returns The secret value
   */
  async refresh(secretName: string, defaultValue?: string): Promise<string> {
    const value = await this.secretProvider.getSecret(secretName, { defaultValue });
    const expiryInfo = await this.secretProvider.getExpiryInfo(secretName).catch(() => null);

    this.cache.set(secretName, {
      value,
      fetchedAt: new Date(),
      expiresOn: expiryInfo?.expiresOn,
    });

    return value;
  }

  /**
   * Bulk load multiple secrets at startup
   * @param secretNames - Array of secret names to preload
   */
  async bulkLoad(secretNames: string[]): Promise<void> {
    console.log(`\n🔄 Bulk loading ${secretNames.length} secrets...`);
    
    const results = await Promise.allSettled(
      secretNames.map(async (name) => {
        const value = await this.secretProvider.getSecret(name, { defaultValue: "" });
        const expiryInfo = await this.secretProvider.getExpiryInfo(name).catch(() => null);
        
        this.cache.set(name, {
          value,
          fetchedAt: new Date(),
          expiresOn: expiryInfo?.expiresOn,
        });
        
        return { name, success: true };
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    
    console.log(`✅ Loaded ${succeeded} secrets successfully${failed > 0 ? `, ${failed} failed` : ""}`);
  }

  /**
   * Refresh all secrets that are near expiry
   * @returns Array of refreshed secret names
   */
  async refreshExpiring(): Promise<string[]> {
    const refreshed: string[] = [];

    for (const [secretName, entry] of this.cache.entries()) {
      if (entry.expiresOn) {
        const msUntilExpiry = entry.expiresOn.getTime() - Date.now();
        const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= this.expiryWarningDays && daysUntilExpiry > 0) {
          await this.refresh(secretName);
          refreshed.push(secretName);
        }
      }
    }

    return refreshed;
  }

  /**
   * Get all secrets that are near expiry
   * @returns Array of secret names and their expiry information
   */
  async getExpiringSecrets(): Promise<SecretExpiryInfo[]> {
    const expiring: SecretExpiryInfo[] = [];

    for (const secretName of this.cache.keys()) {
      try {
        const expiryInfo = await this.secretProvider.getExpiryInfo(secretName);
        if (
          expiryInfo.daysUntilExpiry !== null &&
          expiryInfo.daysUntilExpiry <= this.expiryWarningDays
        ) {
          expiring.push(expiryInfo);
        }
      } catch (error) {
        console.error(`Failed to check expiry for ${secretName}:`, error);
      }
    }

    return expiring;
  }

  /**
   * Check if a secret exists in cache
   * @param secretName - Name of the secret
   * @returns True if cached
   */
  has(secretName: string): boolean {
    return this.cache.has(secretName);
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ name: string; fetchedAt: Date; expiresOn?: Date }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([name, entry]) => ({
      name,
      fetchedAt: entry.fetchedAt,
      expiresOn: entry.expiresOn,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}
