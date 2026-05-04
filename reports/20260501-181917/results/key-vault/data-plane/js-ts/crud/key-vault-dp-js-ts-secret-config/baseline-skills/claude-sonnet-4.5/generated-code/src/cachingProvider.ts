import { SecretProvider, SecretMetadata } from "./secretProvider.js";

export interface CachingConfig {
  expiryWarningDays: number;
}

export class CachingSecretProvider {
  private cache = new Map<string, SecretMetadata>();
  private config: CachingConfig;

  constructor(
    private provider: SecretProvider,
    config?: Partial<CachingConfig>
  ) {
    this.config = {
      expiryWarningDays: config?.expiryWarningDays ?? 7,
    };
  }

  /**
   * Bulk-load a predefined set of secrets at startup
   */
  async bulkLoad(secretNames: string[]): Promise<void> {
    console.log(`\n📦 Bulk-loading ${secretNames.length} secrets...`);

    const results = await Promise.allSettled(
      secretNames.map((name) => this.loadSecret(name))
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `✅ Loaded ${successful} secrets, ${failed} failed or not found`
    );
  }

  /**
   * Load a single secret into cache
   */
  private async loadSecret(name: string): Promise<void> {
    const metadata = await this.provider.getSecretMetadata(name);
    if (metadata) {
      this.cache.set(name, metadata);
    }
  }

  /**
   * Get a secret from cache (load if not cached)
   */
  async get(name: string, defaultValue?: string): Promise<string | undefined> {
    if (!this.cache.has(name)) {
      await this.loadSecret(name);
    }

    const metadata = this.cache.get(name);
    if (!metadata) {
      return defaultValue;
    }

    // Auto-refresh if expiring soon
    if (this.provider.isSecretExpiring(metadata, this.config.expiryWarningDays)) {
      console.log(
        `⚠️  Secret '${name}' is expiring soon, auto-refreshing...`
      );
      await this.refresh(name);
      return this.cache.get(name)?.value ?? defaultValue;
    }

    return metadata.value;
  }

  /**
   * Get secret metadata from cache
   */
  getMetadata(name: string): SecretMetadata | undefined {
    return this.cache.get(name);
  }

  /**
   * Refresh a single secret in cache
   */
  async refresh(name: string): Promise<void> {
    const metadata = await this.provider.getSecretMetadata(name);
    if (metadata) {
      this.cache.set(name, metadata);
      console.log(`🔄 Refreshed secret '${name}'`);
    } else {
      this.cache.delete(name);
      console.log(`🗑️  Removed missing secret '${name}' from cache`);
    }
  }

  /**
   * Check all cached secrets and return those expiring within warning window
   */
  getExpiringSoonSecrets(): SecretMetadata[] {
    const expiring: SecretMetadata[] = [];

    for (const metadata of this.cache.values()) {
      if (
        this.provider.isSecretExpiring(metadata, this.config.expiryWarningDays)
      ) {
        expiring.push(metadata);
      }
    }

    return expiring;
  }

  /**
   * Get all cached secrets
   */
  getAllCached(): SecretMetadata[] {
    return Array.from(this.cache.values());
  }

  /**
   * Clear all cached secrets
   */
  clearCache(): void {
    this.cache.clear();
    console.log("🧹 Cache cleared");
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}
