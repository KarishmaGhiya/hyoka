export interface SecretLookupOptions {
  defaultValue?: string;
  version?: string;
}

export interface SecretRecord {
  name: string;
  value: string;
  version?: string;
  expiresOn?: Date;
  fetchedAt: Date;
  isDefault: boolean;
}

export interface CacheOptions {
  requiredKeys: string[];
  defaultValues?: Record<string, string>;
  expiryWarningWindowMs?: number;
}

export interface CachedSecretRecord extends SecretRecord {
  cacheUpdatedAt: Date;
  isNearExpiry: boolean;
}

export interface RotationOptions {
  expiresOn: Date;
  enabled?: boolean;
  notBefore?: Date;
  tags?: Record<string, string>;
}

export interface RotationResult {
  name: string;
  version?: string;
  value: string;
  expiresOn?: Date;
}
