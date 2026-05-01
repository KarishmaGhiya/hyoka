export interface SecretRequest {
  name: string;
  defaultValue: string;
  version?: string;
}

export interface SecretValueResult {
  name: string;
  value: string;
  version?: string;
  expiresOn?: Date;
  source: "keyvault" | "default";
}

export interface SecretExpiryInfo {
  name: string;
  version?: string;
  expiresOn?: Date;
  isExpiringSoon: boolean;
  daysUntilExpiry?: number;
}

export interface CachedSecretRecord extends SecretValueResult {
  cacheKey: string;
  cachedAt: Date;
}

export interface CacheOptions {
  expiryWarningWindowMs?: number;
}
