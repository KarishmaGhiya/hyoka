import { KeyVaultSecretProvider } from "./keyVaultSecretProvider";
import { CacheOptions, CachedSecretRecord, SecretLookupOptions, SecretRecord } from "./types";

const DEFAULT_WARNING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export class SecretCache {
  private readonly cache = new Map<string, CachedSecretRecord>();
  private readonly requiredKeys: readonly string[];
  private readonly defaultValues: Readonly<Record<string, string>>;
  private readonly expiryWarningWindowMs: number;

  public constructor(
    private readonly provider: KeyVaultSecretProvider,
    options: CacheOptions
  ) {
    this.requiredKeys = [...options.requiredKeys];
    this.defaultValues = options.defaultValues ?? {};
    this.expiryWarningWindowMs = options.expiryWarningWindowMs ?? DEFAULT_WARNING_WINDOW_MS;
  }

  public async preload(): Promise<CachedSecretRecord[]> {
    return Promise.all(this.requiredKeys.map((name) => this.refresh(name)));
  }

  public async get(name: string, options: SecretLookupOptions = {}): Promise<CachedSecretRecord> {
    const cached = this.cache.get(name);
    const requestedVersion = options.version;

    if (!cached) {
      return this.refresh(name, options);
    }

    if (requestedVersion && cached.version !== requestedVersion) {
      return this.refresh(name, options);
    }

    if (this.isNearExpiry(cached.expiresOn)) {
      return this.refresh(name, options);
    }

    return cached;
  }

  public async refresh(name: string, options: SecretLookupOptions = {}): Promise<CachedSecretRecord> {
    const secret = await this.provider.getSecret(name, {
      defaultValue: options.defaultValue ?? this.defaultValues[name],
      version: options.version
    });

    const cached = this.toCachedSecret(secret);
    this.cache.set(name, cached);
    return cached;
  }

  public async refreshExpiringSecrets(): Promise<CachedSecretRecord[]> {
    const expiringKeys = [...this.cache.values()]
      .filter((secret) => this.isNearExpiry(secret.expiresOn))
      .map((secret) => secret.name);

    return Promise.all(expiringKeys.map((name) => this.refresh(name)));
  }

  public getCached(name: string): CachedSecretRecord | undefined {
    return this.cache.get(name);
  }

  public listCached(): CachedSecretRecord[] {
    return [...this.cache.values()];
  }

  public listNearExpirySecrets(): CachedSecretRecord[] {
    return this.listCached().filter((secret) => this.isNearExpiry(secret.expiresOn));
  }

  private toCachedSecret(secret: SecretRecord): CachedSecretRecord {
    return {
      ...secret,
      cacheUpdatedAt: new Date(),
      isNearExpiry: this.isNearExpiry(secret.expiresOn)
    };
  }

  private isNearExpiry(expiresOn?: Date): boolean {
    if (!expiresOn) {
      return false;
    }

    return expiresOn.getTime() - Date.now() <= this.expiryWarningWindowMs;
  }
}
