import { SecretProvider, SecretResult } from "./secretProvider";

export interface CachingProviderOptions {
  /** Number of days before expiry to trigger a warning / automatic re-fetch. */
  expiryWarningDays: number;
}

export class CachingSecretProvider {
  private cache = new Map<string, SecretResult>();
  private readonly warningDays: number;

  constructor(
    private readonly provider: SecretProvider,
    options: CachingProviderOptions = { expiryWarningDays: 7 }
  ) {
    this.warningDays = options.expiryWarningDays;
  }

  /**
   * Bulk-load a predefined set of config keys into the cache at startup.
   * Keys that don't exist in Key Vault receive their default values.
   */
  async loadKeys(
    keys: { name: string; defaultValue?: string }[]
  ): Promise<void> {
    const results = await Promise.all(
      keys.map((k) =>
        this.provider.getSecret(k.name, { defaultValue: k.defaultValue })
      )
    );
    for (const result of results) {
      this.cache.set(result.name, result);
    }
  }

  /**
   * Get a secret from cache. Falls back to Key Vault on cache miss.
   * Automatically re-fetches if the cached value is near expiry.
   */
  async get(name: string, defaultValue?: string): Promise<SecretResult> {
    const cached = this.cache.get(name);

    if (cached && !this.isNearExpiry(cached)) {
      return cached;
    }

    // Cache miss or near-expiry → fetch fresh value
    const fresh = await this.provider.getSecret(name, { defaultValue });
    this.cache.set(name, fresh);
    return fresh;
  }

  /** Force a refresh of a single key from Key Vault. */
  async refresh(name: string): Promise<SecretResult> {
    const fresh = await this.provider.getSecret(name);
    this.cache.set(name, fresh);
    return fresh;
  }

  /** Return all cached secrets that are within the expiry warning window. */
  getNearExpiry(): SecretResult[] {
    const results: SecretResult[] = [];
    for (const secret of this.cache.values()) {
      if (this.isNearExpiry(secret)) {
        results.push(secret);
      }
    }
    return results;
  }

  /** Snapshot of the entire cache for diagnostics. */
  allCached(): SecretResult[] {
    return [...this.cache.values()];
  }

  private isNearExpiry(secret: SecretResult): boolean {
    const days = this.provider.daysUntilExpiry(secret);
    if (days === null) return false; // no expiry set
    return days <= this.warningDays;
  }
}
