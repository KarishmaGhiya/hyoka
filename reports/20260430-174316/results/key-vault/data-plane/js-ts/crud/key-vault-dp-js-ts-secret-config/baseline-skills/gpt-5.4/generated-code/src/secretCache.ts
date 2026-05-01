import {
  KeyVaultSecretProvider,
  ResolvedSecret,
  SecretFetchOptions,
} from "./keyVaultSecretProvider";

export interface RequiredSecretDefinition extends SecretFetchOptions {
  name: string;
}

export interface CachedSecret extends ResolvedSecret {
  cacheKey: string;
  cachedAt: Date;
  requestedVersion?: string;
  defaultValue?: string;
}

export interface SecretCacheOptions {
  expiryWarningWindowMs?: number;
}

export class SecretCache {
  private readonly cache = new Map<string, CachedSecret>();
  private readonly expiryWarningWindowMs: number;

  public constructor(
    private readonly provider: KeyVaultSecretProvider,
    options: SecretCacheOptions = {},
  ) {
    this.expiryWarningWindowMs =
      options.expiryWarningWindowMs ?? 7 * 24 * 60 * 60 * 1000;
  }

  public async preload(
    requiredSecrets: RequiredSecretDefinition[],
  ): Promise<CachedSecret[]> {
    return Promise.all(
      requiredSecrets.map((secret) =>
        this.refresh(secret.name, {
          defaultValue: secret.defaultValue,
          version: secret.version,
        }),
      ),
    );
  }

  public async get(
    name: string,
    options: SecretFetchOptions = {},
  ): Promise<CachedSecret> {
    const key = this.toCacheKey(name, options.version);
    const existing = this.cache.get(key);

    if (!existing) {
      return this.refresh(name, options);
    }

    if (this.provider.isExpiringSoon(existing, this.expiryWarningWindowMs)) {
      return this.refresh(name, {
        defaultValue: existing.defaultValue,
        version: existing.requestedVersion,
      });
    }

    return existing;
  }

  public async refresh(
    name: string,
    options: SecretFetchOptions = {},
  ): Promise<CachedSecret> {
    const resolved = await this.provider.getSecret(name, options);
    const cached: CachedSecret = {
      ...resolved,
      cacheKey: this.toCacheKey(name, options.version),
      cachedAt: new Date(),
      requestedVersion: options.version,
      defaultValue: options.defaultValue,
    };

    this.cache.set(cached.cacheKey, cached);
    return cached;
  }

  public async refreshExpiringSecrets(): Promise<CachedSecret[]> {
    const expiringEntries = Array.from(this.cache.values()).filter((entry) =>
      this.provider.isExpiringSoon(entry, this.expiryWarningWindowMs),
    );

    return Promise.all(
      expiringEntries.map((entry) =>
        this.refresh(entry.name, {
          defaultValue: entry.defaultValue,
          version: entry.requestedVersion,
        }),
      ),
    );
  }

  public getExpiringSecrets(): CachedSecret[] {
    return Array.from(this.cache.values()).filter((entry) =>
      this.provider.isExpiringSoon(entry, this.expiryWarningWindowMs),
    );
  }

  public snapshot(): CachedSecret[] {
    return Array.from(this.cache.values());
  }

  private toCacheKey(name: string, version?: string): string {
    return version ? `${name}@${version}` : name;
  }
}
