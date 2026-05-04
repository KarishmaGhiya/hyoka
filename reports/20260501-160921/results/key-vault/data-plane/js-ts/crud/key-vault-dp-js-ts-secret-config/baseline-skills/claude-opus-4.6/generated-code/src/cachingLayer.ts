import { SecretProvider, SecretResult } from "./secretProvider";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * In-memory caching layer on top of {@link SecretProvider}.
 *
 * Features:
 * - Bulk-load a predefined set of config keys at startup.
 * - On-demand refresh of individual keys.
 * - Automatic re-fetch of any cached secret whose expiry date falls within a
 *   configurable warning window.
 */
export class CachedSecretProvider {
  private readonly cache = new Map<string, SecretResult>();
  private readonly warningWindowMs: number;

  constructor(
    private readonly provider: SecretProvider,
    options?: { warningWindowMs?: number },
  ) {
    this.warningWindowMs = options?.warningWindowMs ?? SEVEN_DAYS_MS;
  }

  /** Load many keys in parallel and cache the results. */
  async bulkLoad(keys: string[]): Promise<void> {
    const results = await Promise.all(
      keys.map((key) => this.provider.getSecret(key, { defaultValue: "" })),
    );

    for (const result of results) {
      if (result) {
        this.cache.set(result.name, result);
      }
    }
  }

  /**
   * Retrieve a secret from cache.  If the cached entry is near expiry it is
   * transparently refreshed before being returned.
   */
  async get(name: string): Promise<SecretResult | undefined> {
    let entry = this.cache.get(name);

    if (entry && this.provider.isNearExpiry(entry, this.warningWindowMs)) {
      entry = await this.refresh(name);
    }

    return entry;
  }

  /** Force-refresh a single key from Key Vault and update the cache. */
  async refresh(name: string): Promise<SecretResult | undefined> {
    const fresh = await this.provider.getSecret(name);
    if (fresh) {
      this.cache.set(name, fresh);
    } else {
      this.cache.delete(name);
    }
    return fresh;
  }

  /** Return all currently cached entries. */
  entries(): ReadonlyMap<string, SecretResult> {
    return this.cache;
  }

  /** Return names of cached secrets that are near expiry. */
  getNearExpiryKeys(): string[] {
    const result: string[] = [];
    for (const [name, entry] of this.cache) {
      if (this.provider.isNearExpiry(entry, this.warningWindowMs)) {
        result.push(name);
      }
    }
    return result;
  }
}
