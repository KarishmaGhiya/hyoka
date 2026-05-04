import { SecretProvider, SecretInfo } from "./secretProvider";

export interface CachedConfigOptions {
  /** Days before expiry at which a secret is considered "near expiry". */
  expiryWarningDays?: number;
}

/**
 * In-memory caching layer over SecretProvider.
 *
 * Supports bulk-loading a set of required keys at startup, on-demand refresh
 * of individual keys, and automatic re-fetch of secrets that are near expiry.
 */
export class CachedConfigProvider {
  private readonly cache = new Map<string, SecretInfo>();
  private readonly expiryWarningDays: number;

  constructor(
    private readonly provider: SecretProvider,
    options: CachedConfigOptions = {},
  ) {
    this.expiryWarningDays = options.expiryWarningDays ?? 7;
  }

  /**
   * Bulk-load a predefined list of config keys into the cache.
   * Each key is fetched from Key Vault (or resolved to its default).
   */
  async loadKeys(
    keys: { name: string; defaultValue?: string }[],
  ): Promise<void> {
    const results = await Promise.all(
      keys.map((k) => this.provider.getSecret(k.name, k.defaultValue)),
    );
    for (const secret of results) {
      this.cache.set(secret.name, secret);
    }
  }

  /**
   * Get a config value from the cache.
   * If the cached entry is near expiry it is transparently refreshed first.
   * If the key is not cached, it is fetched on demand.
   */
  async get(name: string, defaultValue: string = ""): Promise<SecretInfo> {
    const cached = this.cache.get(name);

    if (cached && !this.provider.isNearExpiry(cached, this.expiryWarningDays)) {
      return cached;
    }

    // Fetch (or re-fetch) from Key Vault
    return this.refresh(name, defaultValue);
  }

  /**
   * Force-refresh a single key from Key Vault, updating the cache.
   */
  async refresh(
    name: string,
    defaultValue: string = "",
  ): Promise<SecretInfo> {
    const secret = await this.provider.getSecret(name, defaultValue);
    this.cache.set(name, secret);
    return secret;
  }

  /** Return all currently cached entries. */
  getAll(): SecretInfo[] {
    return [...this.cache.values()];
  }

  /** Return cached entries that are within the expiry warning window. */
  getNearExpiry(): SecretInfo[] {
    return this.getAll().filter((s) =>
      this.provider.isNearExpiry(s, this.expiryWarningDays),
    );
  }
}
