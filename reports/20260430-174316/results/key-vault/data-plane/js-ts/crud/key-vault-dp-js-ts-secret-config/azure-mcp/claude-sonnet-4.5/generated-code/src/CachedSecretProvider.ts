import { SecretProvider, SecretMetadata } from './SecretProvider';

export interface CacheEntry {
  metadata: SecretMetadata;
  cachedAt: Date;
}

export interface CacheOptions {
  expiryWarningDays?: number;
  autoRefreshNearExpiry?: boolean;
}

export class CachedSecretProvider {
  private provider: SecretProvider;
  private cache: Map<string, CacheEntry>;
  private options: CacheOptions;

  constructor(provider: SecretProvider, options?: CacheOptions) {
    this.provider = provider;
    this.cache = new Map();
    this.options = {
      expiryWarningDays: 7,
      autoRefreshNearExpiry: true,
      ...options,
    };
  }

  /**
   * Bulk-loads a predefined set of required config keys at startup
   * @param secretNames Array of secret names to preload
   * @param defaults Optional default values for each secret
   */
  async bulkLoad(secretNames: string[], defaults?: Record<string, string>): Promise<void> {
    console.log(`Bulk loading ${secretNames.length} secrets...`);
    
    const promises = secretNames.map(async (name) => {
      try {
        const defaultValue = defaults?.[name];
        const secret = await this.provider.getSecret(name, defaultValue);
        
        if (secret) {
          this.cache.set(name, {
            metadata: secret,
            cachedAt: new Date(),
          });
          console.log(`✓ Loaded secret: ${name}`);
        }
      } catch (error: any) {
        console.error(`✗ Failed to load secret '${name}':`, error.message);
      }
    });

    await Promise.all(promises);
    console.log(`Bulk load complete. ${this.cache.size} secrets in cache.`);
  }

  /**
   * Gets a secret from cache or fetches it if not cached
   * @param secretName The name of the secret
   * @param defaultValue Default value if secret doesn't exist
   * @returns Secret value or default
   */
  async get(secretName: string, defaultValue?: string): Promise<string | null> {
    // Check if we should auto-refresh due to near expiry
    if (this.options.autoRefreshNearExpiry && this.cache.has(secretName)) {
      const entry = this.cache.get(secretName)!;
      if (await this.shouldRefresh(entry)) {
        console.log(`Auto-refreshing secret '${secretName}' due to near expiry`);
        await this.refresh(secretName, defaultValue);
      }
    }

    const entry = this.cache.get(secretName);
    if (entry) {
      return entry.metadata.value;
    }

    // Not in cache, fetch it
    const secret = await this.provider.getSecret(secretName, defaultValue);
    if (secret) {
      this.cache.set(secretName, {
        metadata: secret,
        cachedAt: new Date(),
      });
      return secret.value;
    }

    return defaultValue || null;
  }

  /**
   * Forces a refresh of a specific secret from Key Vault
   * @param secretName The name of the secret to refresh
   * @param defaultValue Default value if secret doesn't exist
   */
  async refresh(secretName: string, defaultValue?: string): Promise<void> {
    console.log(`Refreshing secret: ${secretName}`);
    const secret = await this.provider.getSecret(secretName, defaultValue);
    
    if (secret) {
      this.cache.set(secretName, {
        metadata: secret,
        cachedAt: new Date(),
      });
      console.log(`✓ Refreshed secret: ${secretName}`);
    } else {
      console.warn(`✗ Could not refresh secret: ${secretName}`);
    }
  }

  /**
   * Checks if any cached secret is near expiry
   * @returns Array of secret names that are near expiry
   */
  async checkExpiringSecrets(): Promise<string[]> {
    const expiring: string[] = [];
    
    for (const [name, entry] of this.cache.entries()) {
      if (entry.metadata.expiresOn) {
        const now = new Date();
        const warningDate = new Date(
          now.getTime() + (this.options.expiryWarningDays || 7) * 24 * 60 * 60 * 1000
        );
        
        if (entry.metadata.expiresOn <= warningDate) {
          expiring.push(name);
        }
      }
    }
    
    return expiring;
  }

  /**
   * Gets metadata for a cached secret
   * @param secretName The name of the secret
   * @returns Secret metadata or null
   */
  getMetadata(secretName: string): SecretMetadata | null {
    const entry = this.cache.get(secretName);
    return entry?.metadata || null;
  }

  /**
   * Clears the entire cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  private async shouldRefresh(entry: CacheEntry): Promise<boolean> {
    if (!entry.metadata.expiresOn) {
      return false;
    }

    const now = new Date();
    const warningDate = new Date(
      now.getTime() + (this.options.expiryWarningDays || 7) * 24 * 60 * 60 * 1000
    );

    return entry.metadata.expiresOn <= warningDate;
  }
}
