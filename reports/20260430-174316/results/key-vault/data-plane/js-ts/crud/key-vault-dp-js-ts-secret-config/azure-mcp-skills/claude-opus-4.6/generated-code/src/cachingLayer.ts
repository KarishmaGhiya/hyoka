import { SecretProvider, SecretResult } from "./secretProvider";

interface CacheEntry {
  result: SecretResult;
  fetchedAt: Date;
}

export interface CachingProviderOptions {
  /** Number of days before expiry to consider a secret "near expiry". */
  expiryWarningDays?: number;
}

const DEFAULT_WARNING_DAYS = 7;

export class CachingSecretProvider {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly warningDays: number;

  constructor(
    private readonly provider: SecretProvider,
    options: CachingProviderOptions = {}
  ) {
    this.warningDays = options.expiryWarningDays ?? DEFAULT_WARNING_DAYS;
  }

  /**
   * Bulk-load a predefined set of required config keys at startup.
   * Fetches all keys in parallel and populates the cache.
   */
  async loadAll(keys: string[]): Promise<Map<string, SecretResult>> {
    const results = await Promise.allSettled(
      keys.map(async (key) => {
        const result = await this.provider.getSecret(key);
        this.cache.set(key, { result, fetchedAt: new Date() });
        return { key, result };
      })
    );

    const loaded = new Map<string, SecretResult>();
    for (const outcome of results) {
      if (outcome.status === "fulfilled") {
        loaded.set(outcome.value.key, outcome.value.result);
      } else {
        console.error(`Failed to load secret: ${outcome.reason}`);
      }
    }
    return loaded;
  }

  /**
   * Get a secret from cache, or fetch from Key Vault on cache miss.
   * Automatically re-fetches if the cached secret is near expiry.
   */
  async get(name: string, defaultValue: string = ""): Promise<SecretResult> {
    const cached = this.cache.get(name);

    if (cached) {
      if (this.isWithinWarningWindow(cached.result)) {
        console.log(
          `Secret "${name}" is near expiry – auto-refreshing from Key Vault.`
        );
        return this.refresh(name);
      }
      return cached.result;
    }

    const result = await this.provider.getSecret(name, defaultValue);
    this.cache.set(name, { result, fetchedAt: new Date() });
    return result;
  }

  /**
   * Force-refresh a single key from Key Vault, updating the cache.
   */
  async refresh(name: string): Promise<SecretResult> {
    const result = await this.provider.getSecret(name);
    this.cache.set(name, { result, fetchedAt: new Date() });
    return result;
  }

  /**
   * Check all cached secrets and return any that are within the
   * expiry warning window.
   */
  getNearExpiry(): Array<{ name: string; daysRemaining: number }> {
    const warnings: Array<{ name: string; daysRemaining: number }> = [];

    for (const [name, entry] of this.cache) {
      if (entry.result.expiresOn) {
        const diffMs = entry.result.expiresOn.getTime() - Date.now();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysRemaining <= this.warningDays) {
          warnings.push({ name, daysRemaining });
        }
      }
    }
    return warnings;
  }

  /**
   * Return all currently cached entries (for inspection / logging).
   */
  getCachedKeys(): string[] {
    return [...this.cache.keys()];
  }

  /**
   * Clear the entire cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  private isWithinWarningWindow(secret: SecretResult): boolean {
    if (!secret.expiresOn) return false;
    const diffMs = secret.expiresOn.getTime() - Date.now();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return daysRemaining <= this.warningDays;
  }
}
