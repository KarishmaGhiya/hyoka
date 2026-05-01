export interface SecretRequest {
  name: string;
  defaultValue?: string;
  version?: string;
}

export interface SecretRecord {
  name: string;
  value: string | undefined;
  found: boolean;
  usedDefault: boolean;
  version: string | null;
  expiresOn: Date | null;
  fetchedAt: Date;
}

export interface CachedSecretRecord extends SecretRecord {
  cacheStatus: "hit" | "miss" | "refreshed-near-expiry" | "refresh";
}

export interface CachedSecretWarning {
  name: string;
  version: string | null;
  expiresOn: Date;
  remainingMs: number;
}

export interface CacheOptions {
  expiryWarningWindowMs: number;
  requiredSecrets?: SecretRequest[];
}

export interface RotationResult {
  name: string;
  previousVersion: string | null;
  newVersion: string | null;
  expiresOn: Date | null;
}

export interface DeleteAndPurgeResult {
  name: string;
  deletedOn: Date | null;
  scheduledPurgeDate: Date | null;
}
