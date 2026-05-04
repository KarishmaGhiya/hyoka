# Quick Reference - Azure Key Vault Config Provider

## Quick Start

```bash
# Setup
$env:AZURE_KEYVAULT_URL="https://your-vault.vault.azure.net/"
az login  # For local dev

# Install & Build
npm install
npm run build

# Run Demo
npm start
```

## Core Classes

### ConfigurationModule
**Purpose:** Main entry point with managed identity auth

```typescript
const config = new ConfigurationModule(vaultUrl, warningWindowDays);
await config.initialize(['key1', 'key2']);  // Bulk load

const provider = config.getProvider();           // Direct access
const cachingProvider = config.getCachingProvider();  // With cache
const client = config.getClient();               // Raw SDK client
```

### SecretProvider
**Purpose:** Direct Key Vault access, no caching

```typescript
// Get secret with fallback
const value = await provider.getSecret('name', 'default');

// Get specific version
const oldValue = await provider.getSecretVersion('name', 'v1', 'default');

// Get full metadata
const info = await provider.getSecretInfo('name');
// Returns: { name, value, version, expiresOn, createdOn }

// Check expiry
const isNear = provider.isNearExpiry(info.expiresOn, 7);

// Set secret with expiry
const expiry = new Date('2026-12-31');
await provider.setSecret('name', 'value', expiry);

// List versions
const versions = await provider.listSecretVersions('name');
```

### CachingSecretProvider
**Purpose:** Fast cached access with auto-refresh

```typescript
// Bulk load at startup
await cachingProvider.bulkLoad(['key1', 'key2', 'key3']);

// Get from cache (or fetch if not cached)
const value = await cachingProvider.get('key1', 'default');

// Force refresh one key
await cachingProvider.refresh('key1');

// Auto-refresh all near-expiry secrets
const refreshed = await cachingProvider.refreshExpiring();

// Get expiring secrets
const expiring = cachingProvider.getExpiringSecrets();
// Returns: [{ name: 'key1', expiresOn: Date }]

// Cache management
const stats = cachingProvider.getCacheStats();
// Returns: { size: 3, keys: ['key1', 'key2', 'key3'] }
cachingProvider.clearCache();
```

### SecretRotationHelper
**Purpose:** Safe secret rotation and cleanup

```typescript
const rotationHelper = new SecretRotationHelper(client, provider);

// Rotate: create new version
const expiry = new Date(Date.now() + 90*24*60*60*1000);  // 90 days
const result = await rotationHelper.rotateSecret('name', 'newValue', expiry);
// Returns: { oldVersion: 'abc123', newVersion: 'def456' }

// List versions
const versions = await rotationHelper.listVersions('name');
// Returns: [{ version: 'abc', enabled: true }, ...]

// Safe delete (waits for completion)
await rotationHelper.deleteSecretVersion('name', 'v1');

// Purge deleted secret
await rotationHelper.purgeDeletedSecret('name');

// Full cleanup (delete + wait + purge)
await rotationHelper.deleteAndPurge('name');
```

## Common Patterns

### Startup Configuration
```typescript
const config = new ConfigurationModule();
await config.initialize(['db-url', 'api-key', 'service-url']);
const cache = config.getCachingProvider();

// Use throughout app
const dbUrl = await cache.get('db-url');
```

### Expiry Monitoring
```typescript
// Check on startup or periodically
const expiring = cache.getExpiringSecrets();
if (expiring.length > 0) {
  console.warn('Secrets expiring soon:', expiring);
  await cache.refreshExpiring();  // Auto-refresh
}
```

### Safe Rotation
```typescript
// Step 1: Create new version
const newExpiry = new Date(Date.now() + 90*24*60*60*1000);
await rotationHelper.rotateSecret('api-key', 'new-value', newExpiry);

// Step 2: App automatically uses latest version
const latest = await provider.getSecret('api-key');

// Step 3: (Optional) Clean up old versions after grace period
const versions = await rotationHelper.listVersions('api-key');
// Manually delete specific old versions if needed
```

## Environment Variables

```bash
# Required
AZURE_KEYVAULT_URL=https://your-vault.vault.azure.net/

# Optional (for local dev without Azure CLI)
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

## Required Permissions

Assign to your Managed Identity or Service Principal:
- Get (read secrets)
- List (list secrets/versions)
- Set (create/update secrets)
- Delete (soft-delete secrets)
- Purge (permanently remove)

**Role:** Key Vault Secrets Officer (or custom role)

## Error Handling

```typescript
try {
  const value = await provider.getSecret('name', 'fallback');
} catch (error: any) {
  if (error.statusCode === 404) {
    // Secret not found
  } else if (error.statusCode === 403) {
    // Permission denied
  } else {
    // Other error
  }
}
```

## Soft-Delete Flow

```
1. Secret exists
   ↓
2. Delete → Soft-delete state (recoverable 90 days)
   ↓
3. Purge → Permanently deleted (cannot recover)
```

**Important:** Always wait for delete to complete before purging!

```typescript
// ✅ CORRECT - waits for delete
await rotationHelper.deleteAndPurge('name');

// ❌ WRONG - might fail to purge
await client.beginDeleteSecret('name');  // Don't wait
await client.purgeDeletedSecret('name');  // May fail!
```

## TypeScript Types

```typescript
interface SecretInfo {
  name: string;
  value: string;
  version?: string;
  expiresOn?: Date;
  createdOn?: Date;
}

interface CacheEntry {
  value: string;
  expiresOn?: Date;
  cachedAt: Date;
}
```

## Testing Locally

```bash
# 1. Login to Azure
az login

# 2. Set vault URL
$env:AZURE_KEYVAULT_URL="https://test-vault.vault.azure.net/"

# 3. Run demo
npm run dev
```

## Production Checklist

- [ ] Use Managed Identity (not secrets)
- [ ] Set appropriate Key Vault permissions
- [ ] Configure warning window (default: 7 days)
- [ ] Monitor expiring secrets
- [ ] Implement rotation schedule
- [ ] Add retry logic for transient failures
- [ ] Log cache hit rates
- [ ] Set up alerts for expiry warnings
- [ ] Document secret naming conventions
- [ ] Test rotation procedures
