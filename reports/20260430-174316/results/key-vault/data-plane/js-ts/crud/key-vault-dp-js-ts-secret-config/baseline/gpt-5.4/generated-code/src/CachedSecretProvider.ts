import { KeyVaultSecretProvider } from "./KeyVaultSecretProvider";
import {
  CachedSecretRecord,
  CacheOptions,
  SecretRequest,
} from "./types";

const DEFAULT_WARNING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export class CachedSecretProvider {
  private readonly cache = new Map<string, CachedSecretRecord>();
  private readonly expiryWarningWindowMs: number;

  public constructor(
    private readonly provider: KeyVaultSecretProvider,
    options: CacheOptions = {},
  ) {
    this.expiryWarningWindowMs =
      options.expiryWarningWindowMs ?? DEFAULT_WARNING_WINDOW_MS;
  }

  public async preloadSecrets(
    requests: SecretRequest[],
  ): Promise<CachedSecretRecord[]> {
    return Promise.all(requests.map((request) => this.refreshSecret(request)));
  }

  public async getSecret(request: SecretRequest): Promise<CachedSecretRecord> {
    const cacheKey = this.createCacheKey(request.name, request.version);
    const cachedSecret = this.cache.get(cacheKey);

    if (cachedSecret === undefined) {
      return this.refreshSecret(request);
    }

    if (this.shouldRefetch(cachedSecret)) {
      return this.refreshSecret(request);
    }

    return cachedSecret;
  }

  public async refreshSecret(
    request: SecretRequest,
  ): Promise<CachedSecretRecord> {
    const cacheKey = this.createCacheKey(request.name, request.version);
    const secret = await this.provider.getSecret(
      request.name,
      request.defaultValue,
      request.version,
    );

    const cachedRecord: CachedSecretRecord = {
      ...secret,
      cacheKey,
      cachedAt: new Date(),
    };

    this.cache.set(cacheKey, cachedRecord);

    return cachedRecord;
  }

  public getCachedSecret(
    name: string,
    version?: string,
  ): CachedSecretRecord | undefined {
    return this.cache.get(this.createCacheKey(name, version));
  }

  public getAllCachedSecrets(): CachedSecretRecord[] {
    return Array.from(this.cache.values());
  }

  public getSecretsNearExpiry(referenceTime = new Date()): CachedSecretRecord[] {
    return this.getAllCachedSecrets().filter((secret) => {
      if (secret.expiresOn === undefined) {
        return false;
      }

      return (
        secret.expiresOn.getTime() - referenceTime.getTime() <=
        this.expiryWarningWindowMs
      );
    });
  }

  private shouldRefetch(secret: CachedSecretRecord): boolean {
    if (secret.expiresOn === undefined) {
      return false;
    }

    return Date.now() + this.expiryWarningWindowMs >= secret.expiresOn.getTime();
  }

  private createCacheKey(name: string, version?: string): string {
    return version === undefined ? `${name}:latest` : `${name}:${version}`;
  }
}
