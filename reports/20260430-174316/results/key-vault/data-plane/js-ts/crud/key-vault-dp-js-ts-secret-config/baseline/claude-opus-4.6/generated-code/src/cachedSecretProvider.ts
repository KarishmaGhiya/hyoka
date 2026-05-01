import { SecretProvider, SecretResult } from "./secretProvider";

export interface CacheEntry extends SecretResult {
  cachedAt: Date;
}

export interface CachedProviderOptions {
  /** Warn if a secret expires within this many milliseconds. Default: 7 days. */
  expiryWarningMs?: number;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * In-memory caching layer over SecretProvider.
 *
 * - Bulk-load a set of required keys at startup.
 * - Serve subsequent reads from cache.
 * - Refresh individual keys on demand.
 * - Automatically re-fetch any secret whose expiry is within the warning window.
 */
export class CachedSecretProvider {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly expiryWarningMs: number;

  constructor(
    private readonly provider: SecretProvider,
    options: CachedProviderOptions = {}
  ) {
    this.expiryWarningMs = options.expiryWarningMs ?? SEVEN_DAYS_MS;
  }

  /**
   * Load all `keys` into the cache in parallel.
   * Secrets that don't exist will be cached with their default value.
   */
  async loadAll(keys: string[], defaultValue: string = ""): Promise<void> {
    const results = await Promise.all(
      keys.map((key) => this.provider.getSecret(key, defaultValue))
    );

    for (const result of results) {
      this.cache.set(result.name, { ...result, cachedAt: new Date() });
    }
  }

  /**
   * Return a cached secret. On a cache miss the secret is fetched, cached,
   * and then returned.
   *
   * If the cached entry has an expiry date within the warning window the
   * value is silently re-fetched before being returned.
   */
  async get(name: string, defaultValue: string = ""): Promise<CacheEntry> {
    const existing = this.cache.get(name);

    if (existing && !this.isNearExpiry(existing)) {
      return existing;
    }

    return this.refresh(name, defaultValue);
  }

  /**
   * Force-refresh a single key from Key Vault and update the cache.
   */
  async refresh(
    name: string,
    defaultValue: string = ""
  ): Promise<CacheEntry> {
    const result = await this.provider.getSecret(name, defaultValue);
    const entry: CacheEntry = { ...result, cachedAt: new Date() };
    this.cache.set(name, entry);
    return entry;
  }

  /**
   * Return all cached entries whose expiry date falls within the
   * configured warning window.
   */
  getExpiringSecrets(): CacheEntry[] {
    const expiring: CacheEntry[] = [];
    for (const entry of this.cache.values()) {
      if (this.isNearExpiry(entry)) {
        expiring.push(entry);
      }
    }
    return expiring;
  }

  /** Snapshot of the full cache (read-only). */
  getAll(): ReadonlyMap<string, CacheEntry> {
    return this.cache;
  }

  private isNearExpiry(entry: CacheEntry): boolean {
    if (!entry.expiresOn) return false;
    return entry.expiresOn.getTime() - Date.now() < this.expiryWarningMs;
  }
}
