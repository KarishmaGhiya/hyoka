import { SecretProvider, SecretMetadata } from "./SecretProvider";

interface CacheEntry {
  value: string;
  metadata: SecretMetadata;
  fetchedAt: Date;
}

export class CachingSecretProvider {
  private cache: Map<string, CacheEntry> = new Map();
  private provider: SecretProvider;
  private expiryWarningDays: number;

  constructor(provider: SecretProvider, expiryWarningDays: number = 7) {
    this.provider = provider;
    this.expiryWarningDays = expiryWarningDays;
  }

  /**
   * Bulk-loads a predefined set of required config keys at startup.
   * @param secretNames - Array of secret names to preload
   * @returns Map of secret names to their values
   */
  async bulkLoad(secretNames: string[]): Promise<Map<string, string>> {
    console.log(`Bulk loading ${secretNames.length} secrets...`);
    const results = new Map<string, string>();

    await Promise.all(
      secretNames.map(async (name) => {
        try {
          const value = await this.getSecret(name);
          results.set(name, value);
        } catch (error: any) {
          console.error(`Failed to load secret '${name}':`, error.message);
          results.set(name, "");
        }
      })
    );

    console.log(`Bulk load complete. Loaded ${results.size} secrets.`);
    return results;
  }

  /**
   * Retrieves a secret from cache if available, otherwise fetches from Key Vault.
   * Automatically refreshes secrets that are expiring soon.
   * @param secretName - The name of the secret
   * @param defaultValue - Default value if secret doesn't exist
   * @returns The secret value
   */
  async getSecret(secretName: string, defaultValue?: string): Promise<string> {
    const cached = this.cache.get(secretName);

    // Check if cached and not expiring soon
    if (cached && !this.shouldRefresh(cached)) {
      return cached.value;
    }

    // Fetch from provider
    return await this.refreshSecret(secretName, defaultValue);
  }

  /**
   * Forces a refresh of a specific secret from Key Vault.
   * @param secretName - The name of the secret to refresh
   * @param defaultValue - Default value if secret doesn't exist
   * @returns The refreshed secret value
   */
  async refreshSecret(
    secretName: string,
    defaultValue?: string
  ): Promise<string> {
    const metadata = await this.provider.getSecretMetadata(secretName);
    const value = metadata.value || defaultValue || "";

    this.cache.set(secretName, {
      value,
      metadata,
      fetchedAt: new Date(),
    });

    return value;
  }

  /**
   * Checks all cached secrets and returns those expiring within the warning window.
   * @returns Array of secret names that are expiring soon
   */
  async checkExpiringSecrets(): Promise<string[]> {
    const expiring: string[] = [];

    for (const [name, entry] of this.cache.entries()) {
      if (this.isExpiringSoon(entry.metadata)) {
        expiring.push(name);
      }
    }

    return expiring;
  }

  /**
   * Gets metadata for a cached secret, or fetches it if not cached.
   * @param secretName - The name of the secret
   * @returns Secret metadata
   */
  async getMetadata(secretName: string): Promise<SecretMetadata> {
    const cached = this.cache.get(secretName);
    if (cached) {
      return cached.metadata;
    }

    // Fetch and cache
    await this.refreshSecret(secretName);
    const entry = this.cache.get(secretName);
    return entry!.metadata;
  }

  /**
   * Clears the entire cache.
   */
  clearCache(): void {
    this.cache.clear();
    console.log("Cache cleared.");
  }

  /**
   * Clears a specific secret from cache.
   * @param secretName - The name of the secret to remove from cache
   */
  clearSecret(secretName: string): void {
    this.cache.delete(secretName);
    console.log(`Secret '${secretName}' removed from cache.`);
  }

  /**
   * Gets the current cache size.
   * @returns Number of cached secrets
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  private shouldRefresh(entry: CacheEntry): boolean {
    return this.isExpiringSoon(entry.metadata);
  }

  private isExpiringSoon(metadata: SecretMetadata): boolean {
    if (!metadata.expiresOn) {
      return false;
    }

    const now = new Date();
    const warningDate = new Date(
      now.getTime() + this.expiryWarningDays * 24 * 60 * 60 * 1000
    );
    return metadata.expiresOn <= warningDate;
  }
}
