import { SecretProvider, SecretMetadata } from './SecretProvider';

interface CacheEntry {
  value: string;
  metadata: SecretMetadata;
  cachedAt: Date;
}

export interface CachedSecretProviderConfig {
  expiryWarningDays: number;
}

export class CachedSecretProvider {
  private provider: SecretProvider;
  private cache: Map<string, CacheEntry>;
  private config: CachedSecretProviderConfig;

  constructor(
    vaultUrl: string,
    config: CachedSecretProviderConfig = { expiryWarningDays: 7 }
  ) {
    this.provider = new SecretProvider(vaultUrl);
    this.cache = new Map();
    this.config = config;
  }

  /**
   * Bulk-loads a predefined set of required config keys at startup.
   */
  async bulkLoad(secretNames: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    console.log(`Bulk loading ${secretNames.length} secrets...`);
    for (const name of secretNames) {
      try {
        const value = await this.getSecret(name);
        if (value !== undefined) {
          results.set(name, value);
        }
      } catch (error: any) {
        console.error(`Failed to load secret '${name}':`, error.message);
      }
    }

    console.log(`Bulk load complete: ${results.size}/${secretNames.length} secrets loaded`);
    return results;
  }

  /**
   * Retrieves a secret, using cache if available.
   */
  async getSecret(secretName: string): Promise<string | undefined> {
    const cached = this.cache.get(secretName);
    if (cached) {
      console.log(`Cache hit for '${secretName}'`);

      // Check if secret is expiring soon and auto-refresh
      if (await this.shouldRefreshDueToExpiry(cached.metadata)) {
        console.log(
          `Secret '${secretName}' is expiring soon, auto-refreshing...`
        );
        return await this.refreshSecret(secretName);
      }

      return cached.value;
    }

    console.log(`Cache miss for '${secretName}', fetching from Key Vault...`);
    return await this.refreshSecret(secretName);
  }

  /**
   * On-demand refresh of an individual key.
   */
  async refreshSecret(secretName: string): Promise<string | undefined> {
    const metadata = await this.provider.getSecretMetadata(secretName);
    if (!metadata) {
      this.cache.delete(secretName);
      return undefined;
    }

    this.cache.set(secretName, {
      value: metadata.value,
      metadata,
      cachedAt: new Date(),
    });

    console.log(`Secret '${secretName}' cached (version: ${metadata.version})`);
    return metadata.value;
  }

  /**
   * Checks if a secret should be refreshed due to upcoming expiry.
   */
  private async shouldRefreshDueToExpiry(
    metadata: SecretMetadata
  ): Promise<boolean> {
    if (!metadata.expiresOn) {
      return false;
    }

    const now = new Date();
    const warningDate = new Date(now);
    warningDate.setDate(warningDate.getDate() + this.config.expiryWarningDays);

    return metadata.expiresOn <= warningDate;
  }

  /**
   * Gets all cached secrets that are expiring within the warning window.
   */
  async getExpiringSoonSecrets(): Promise<Map<string, Date>> {
    const expiring = new Map<string, Date>();

    for (const [name, entry] of this.cache.entries()) {
      if (entry.metadata.expiresOn) {
        const isExpiring = await this.shouldRefreshDueToExpiry(
          entry.metadata
        );
        if (isExpiring) {
          expiring.set(name, entry.metadata.expiresOn);
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
    console.log('Cache cleared');
  }

  /**
   * Removes a specific secret from cache.
   */
  invalidateSecret(secretName: string): void {
    this.cache.delete(secretName);
    console.log(`Secret '${secretName}' invalidated from cache`);
  }

  /**
   * Gets the underlying provider for direct access when needed.
   */
  getProvider(): SecretProvider {
    return this.provider;
  }
}
