import { SecretProvider, SecretInfo } from './SecretProvider';

interface CacheEntry {
  value: string;
  expiresOn?: Date;
  cachedAt: Date;
}

export class CachedSecretProvider {
  private cache: Map<string, CacheEntry> = new Map();
  private expiryWarningDays: number;

  constructor(
    private provider: SecretProvider,
    expiryWarningDays: number = 7
  ) {
    this.expiryWarningDays = expiryWarningDays;
  }

  async bulkLoad(
    secretNames: string[],
    defaults?: Map<string, string>
  ): Promise<void> {
    const loadPromises = secretNames.map((name) =>
      this.loadSecretToCache(name, defaults?.get(name))
    );
    await Promise.all(loadPromises);
    console.log(`Bulk loaded ${secretNames.length} secrets into cache`);
  }

  private async loadSecretToCache(
    name: string,
    defaultValue?: string
  ): Promise<void> {
    const secretInfo = await this.provider.getSecretWithMetadata(
      name,
      defaultValue
    );
    if (secretInfo) {
      this.cache.set(name, {
        value: secretInfo.value,
        expiresOn: secretInfo.expiresOn,
        cachedAt: new Date(),
      });
    }
  }

  async getSecret(name: string, defaultValue?: string): Promise<string | undefined> {
    const cached = this.cache.get(name);
    if (cached) {
      return cached.value;
    }

    const value = await this.provider.getSecret(name, defaultValue);
    if (value !== undefined) {
      this.cache.set(name, {
        value,
        cachedAt: new Date(),
      });
    }
    return value;
  }

  async refreshSecret(name: string, defaultValue?: string): Promise<void> {
    this.cache.delete(name);
    await this.loadSecretToCache(name, defaultValue);
    console.log(`Refreshed secret: ${name}`);
  }

  async refreshExpiringSoon(): Promise<string[]> {
    const refreshed: string[] = [];
    const warningThreshold = new Date();
    warningThreshold.setDate(
      warningThreshold.getDate() + this.expiryWarningDays
    );

    for (const [name, entry] of this.cache.entries()) {
      if (entry.expiresOn && entry.expiresOn <= warningThreshold) {
        await this.refreshSecret(name);
        refreshed.push(name);
      }
    }

    return refreshed;
  }

  getCachedValue(name: string): string | undefined {
    return this.cache.get(name)?.value;
  }

  getExpiryInfo(name: string): Date | undefined {
    return this.cache.get(name)?.expiresOn;
  }

  getExpiringSoonSecrets(): string[] {
    const warningThreshold = new Date();
    warningThreshold.setDate(
      warningThreshold.getDate() + this.expiryWarningDays
    );

    const expiringSoon: string[] = [];
    for (const [name, entry] of this.cache.entries()) {
      if (entry.expiresOn && entry.expiresOn <= warningThreshold) {
        expiringSoon.push(name);
      }
    }

    return expiringSoon;
  }

  clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}
