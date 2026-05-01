import { SecretProvider, SecretInfo } from './SecretProvider';

interface CacheEntry {
  value: string;
  expiresOn?: Date;
  cachedAt: Date;
}

export class SecretCache {
  private cache: Map<string, CacheEntry> = new Map();
  private expiryWarningDays: number;

  constructor(
    private provider: SecretProvider,
    expiryWarningDays: number = 7
  ) {
    this.expiryWarningDays = expiryWarningDays;
  }

  async bulkLoad(keys: string[]): Promise<void> {
    console.log(`[Cache] Bulk loading ${keys.length} secrets...`);
    const promises = keys.map(key => this.refresh(key).catch(err => {
      console.error(`[Cache] Failed to load '${key}': ${err.message}`);
    }));
    await Promise.all(promises);
    console.log(`[Cache] Bulk load complete. ${this.cache.size} secrets cached.`);
  }

  async get(key: string): Promise<string> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached.value;
    }

    await this.refresh(key);
    const entry = this.cache.get(key);
    return entry?.value || '';
  }

  async refresh(key: string): Promise<void> {
    const info = await this.provider.getSecretInfo(key);
    if (info) {
      this.cache.set(key, {
        value: info.value,
        expiresOn: info.expiresOn,
        cachedAt: new Date(),
      });
      console.log(`[Cache] Refreshed '${key}'${info.expiresOn ? ` (expires: ${info.expiresOn.toISOString()})` : ''}`);
    }
  }

  async refreshExpiringSoon(): Promise<string[]> {
    const refreshed: string[] = [];
    const now = new Date();
    const warningDate = new Date(now.getTime() + this.expiryWarningDays * 24 * 60 * 60 * 1000);

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresOn && entry.expiresOn <= warningDate) {
        console.log(`[Cache] Secret '${key}' is expiring soon (${entry.expiresOn.toISOString()}), refreshing...`);
        await this.refresh(key);
        refreshed.push(key);
      }
    }

    return refreshed;
  }

  getCached(key: string): string | undefined {
    return this.cache.get(key)?.value;
  }

  getExpiringSecrets(): Array<{ key: string; expiresOn: Date }> {
    const now = new Date();
    const warningDate = new Date(now.getTime() + this.expiryWarningDays * 24 * 60 * 60 * 1000);
    const expiring: Array<{ key: string; expiresOn: Date }> = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresOn && entry.expiresOn <= warningDate) {
        expiring.push({ key, expiresOn: entry.expiresOn });
      }
    }

    return expiring;
  }

  clear(): void {
    this.cache.clear();
    console.log('[Cache] Cleared all cached secrets');
  }

  size(): number {
    return this.cache.size;
  }
}
