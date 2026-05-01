import { SecretProvider, SecretResult } from "./secretProvider";

/**
 * In-memory caching layer on top of SecretProvider.
 *
 * - Bulk-loads a predefined set of config keys at startup.
 * - On-demand refresh of individual keys.
 * - Automatic re-fetch of secrets whose expiry is within a configurable
 *   warning window.
 */
export class CachedSecretProvider {
  private cache = new Map<string, SecretResult>();

  constructor(
    private readonly provider: SecretProvider,
    private readonly warningDays: number = 7
  ) {}

  /**
   * Bulk-load a set of required config keys into the cache.
   * Returns a map of key → SecretResult for every key that was found.
   */
  async loadSecrets(
    keys: string[],
    defaults?: Record<string, string>
  ): Promise<Map<string, SecretResult>> {
    const results = await Promise.all(
      keys.map(async (key) => {
        const result = await this.provider.getSecret(key, {
          defaultValue: defaults?.[key],
        });
        if (result) {
          this.cache.set(key, result);
        }
        return [key, result] as const;
      })
    );

    const loaded = new Map<string, SecretResult>();
    for (const [key, result] of results) {
      if (result) loaded.set(key, result);
    }
    return loaded;
  }

  /**
   * Get a secret from the cache, falling back to the provider on a miss.
   */
  async getSecret(
    name: string,
    defaultValue?: string
  ): Promise<SecretResult | undefined> {
    const cached = this.cache.get(name);
    if (cached) return cached;

    const result = await this.provider.getSecret(name, { defaultValue });
    if (result) this.cache.set(name, result);
    return result;
  }

  /**
   * Force-refresh a single key from Key Vault, updating the cache.
   */
  async refreshSecret(name: string): Promise<SecretResult | undefined> {
    const result = await this.provider.getSecret(name);
    if (result) {
      this.cache.set(name, result);
    } else {
      this.cache.delete(name);
    }
    return result;
  }

  /**
   * Re-fetch every cached secret whose expiry date falls within the
   * configured warning window, returning the list of refreshed keys.
   */
  async refreshExpiring(): Promise<string[]> {
    const refreshed: string[] = [];

    for (const [name, secret] of this.cache) {
      if (this.provider.isExpiringSoon(secret, this.warningDays)) {
        const updated = await this.provider.getSecret(name);
        if (updated) {
          this.cache.set(name, updated);
          refreshed.push(name);
        }
      }
    }

    return refreshed;
  }

  /**
   * Return all secrets currently in cache that are expiring within the
   * warning window.
   */
  getExpiringSecrets(): SecretResult[] {
    const expiring: SecretResult[] = [];
    for (const secret of this.cache.values()) {
      if (this.provider.isExpiringSoon(secret, this.warningDays)) {
        expiring.push(secret);
      }
    }
    return expiring;
  }

  /** Retrieve the current cache contents (read-only snapshot). */
  getCachedSecrets(): ReadonlyMap<string, SecretResult> {
    return new Map(this.cache);
  }
}
