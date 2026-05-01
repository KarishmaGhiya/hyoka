import { KeyVaultSecretProvider } from "./keyVaultSecretProvider";
import {
  CacheOptions,
  CachedSecretRecord,
  CachedSecretWarning,
  SecretRecord,
  SecretRequest,
} from "./types";

interface CacheEntry {
  request: SecretRequest;
  secret: SecretRecord;
}

export class CachedSecretProvider {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly requiredSecrets: SecretRequest[];
  private readonly expiryWarningWindowMs: number;

  public constructor(
    private readonly provider: KeyVaultSecretProvider,
    options: CacheOptions,
  ) {
    this.requiredSecrets = options.requiredSecrets ?? [];
    this.expiryWarningWindowMs = options.expiryWarningWindowMs;
  }

  public async preloadRequiredSecrets(): Promise<SecretRecord[]> {
    return Promise.all(
      this.requiredSecrets.map((secret) =>
        this.refresh(secret.name, {
          defaultValue: secret.defaultValue,
          version: secret.version,
        }),
      ),
    );
  }

  public async get(
    name: string,
    request: Omit<SecretRequest, "name"> = {},
  ): Promise<CachedSecretRecord> {
    const key = this.createCacheKey(name, request.version);
    const cached = this.cache.get(key);

    if (!cached) {
      const secret = await this.fetchAndCache({ name, ...request });
      return { ...secret, cacheStatus: "miss" };
    }

    if (this.provider.isNearExpiry(cached.secret, this.expiryWarningWindowMs)) {
      const secret = await this.fetchAndCache({
        name,
        defaultValue: request.defaultValue ?? cached.request.defaultValue,
        version: request.version ?? cached.request.version,
      });

      return { ...secret, cacheStatus: "refreshed-near-expiry" };
    }

    return {
      ...cached.secret,
      cacheStatus: "hit",
    };
  }

  public async refresh(
    name: string,
    request: Omit<SecretRequest, "name"> = {},
  ): Promise<CachedSecretRecord> {
    const secret = await this.fetchAndCache({ name, ...request });
    return { ...secret, cacheStatus: "refresh" };
  }

  public getNearExpirySecrets(now: Date = new Date()): CachedSecretWarning[] {
    const warnings: CachedSecretWarning[] = [];

    for (const entry of this.cache.values()) {
      if (!entry.secret.expiresOn) {
        continue;
      }

      const remainingMs = entry.secret.expiresOn.getTime() - now.getTime();
      if (remainingMs <= this.expiryWarningWindowMs) {
        warnings.push({
          name: entry.secret.name,
          version: entry.secret.version,
          expiresOn: entry.secret.expiresOn,
          remainingMs,
        });
      }
    }

    return warnings.sort(
      (left, right) => left.remainingMs - right.remainingMs,
    );
  }

  public getCachedSecrets(): SecretRecord[] {
    return Array.from(this.cache.values(), (entry) => entry.secret);
  }

  private async fetchAndCache(request: SecretRequest): Promise<SecretRecord> {
    const secret = await this.provider.getSecret(request.name, {
      defaultValue: request.defaultValue,
      version: request.version,
    });

    this.cache.set(this.createCacheKey(request.name, request.version), {
      request,
      secret,
    });

    return secret;
  }

  private createCacheKey(name: string, version?: string): string {
    return `${name}::${version ?? "latest"}`;
  }
}
