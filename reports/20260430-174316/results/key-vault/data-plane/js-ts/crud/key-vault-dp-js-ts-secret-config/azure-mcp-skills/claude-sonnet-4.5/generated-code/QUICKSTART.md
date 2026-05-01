# Quick Start Guide

## Setup

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Set environment variable**:
   ```bash
   # PowerShell
   $env:KEY_VAULT_URL="https://your-vault-name.vault.azure.net/"
   
   # Linux/macOS
   export KEY_VAULT_URL="https://your-vault-name.vault.azure.net/"
   ```

3. **Authenticate** (local development):
   ```bash
   az login
   ```

4. **Grant permissions** to your identity:
   - Key Vault Access Policies: Get, List, Set, Delete, Purge (Secrets)
   - Or use RBAC: "Key Vault Secrets Officer" role

## Build and Run

```bash
# Build TypeScript
npm run build

# Run the demo
npm start

# Or run directly without building
npm run dev
```

## Project Components

### 1. SecretProvider (`src/SecretProvider.ts`)
Core provider that interfaces with Key Vault:
```typescript
const provider = new SecretProvider(client);

// Get secret with default fallback
const value = await provider.getSecret('api-key', 'default-value');

// Get specific version
const oldValue = await provider.getSecretVersion('api-key', 'abc123');

// Check expiry
const isExpiring = await provider.isSecretExpiringSoon('api-key', 7);
```

### 2. SecretCache (`src/SecretCache.ts`)
In-memory caching layer:
```typescript
const cache = new SecretCache(provider, 7); // 7-day warning window

// Bulk load at startup
await cache.bulkLoad(['db-url', 'api-key', 'token']);

// Get from cache (loads on-demand if missing)
const apiKey = await cache.get('api-key');

// Refresh specific key
await cache.refresh('api-key');

// Check expiring secrets
const expiring = cache.getExpiringSecrets();
```

### 3. Configuration (`src/Configuration.ts`)
Main orchestrator with managed identity:
```typescript
const config = new Configuration(vaultUrl, 7);

// Initialize with required keys
await config.initialize(['db-url', 'api-key']);

// Access components
const cache = config.getCache();
const provider = config.getProvider();
const client = config.getClient();
```

### 4. SecretRotationHelper (`src/SecretRotationHelper.ts`)
Safe secret rotation:
```typescript
const helper = new SecretRotationHelper(client);

// Rotate with expiry
const newVersion = await helper.rotateSecret('api-key', 'new-value', {
  expiresOn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  tags: { rotatedAt: new Date().toISOString() }
});

// List all versions
const versions = await helper.listVersions('api-key');

// Safe delete and purge
await helper.deleteAndPurgeOldVersion('old-secret');
```

## Architecture Flow

```
┌─────────────────────────────────────────────────┐
│              Configuration                       │
│  (Managed Identity + Vault Connection)          │
└────────┬────────────────────────────────────────┘
         │
         ├──► SecretProvider ──► Azure Key Vault
         │    (Get, GetVersion, CheckExpiry)
         │
         └──► SecretCache ──► In-Memory Cache
              (Bulk Load, Refresh, Expiry Detection)

         SecretRotationHelper ──► Azure Key Vault
         (Rotate, Delete, Purge, List Versions)
```

## Key Features

✅ **Managed Identity** - No secrets in code  
✅ **Graceful error handling** - Default values when secrets don't exist  
✅ **Version support** - Retrieve specific secret versions  
✅ **Expiry monitoring** - Automatic detection of expiring secrets  
✅ **Caching** - In-memory cache with bulk loading  
✅ **Safe rotation** - Multi-version support with delete/purge  
✅ **Long-running operations** - Proper handling of delete polling  

## Common Use Cases

### Startup Configuration
```typescript
const config = new Configuration();
await config.initialize([
  'database-url',
  'api-key',
  'service-token'
]);

const cache = config.getCache();
const dbUrl = await cache.get('database-url');
```

### Expiry Warnings
```typescript
const expiring = cache.getExpiringSecrets();
if (expiring.length > 0) {
  for (const { key, expiresOn } of expiring) {
    console.warn(`⚠️ Secret ${key} expires on ${expiresOn}`);
  }
}
```

### Periodic Secret Rotation
```typescript
const helper = new SecretRotationHelper(config.getClient());
const newExpiry = new Date();
newExpiry.setDate(newExpiry.getDate() + 90);

await helper.rotateSecret('service-token', generateNewToken(), {
  expiresOn: newExpiry
});
```

## Testing Without Key Vault

For local testing without a Key Vault, you could:
1. Mock the `SecretClient` in tests
2. Use a test Key Vault instance
3. Create a mock provider implementing the same interface

## Deployment

When deploying to Azure:
1. Enable Managed Identity on your resource (App Service, VM, Container, etc.)
2. Grant the identity Key Vault permissions
3. Set `KEY_VAULT_URL` environment variable
4. No code changes needed!

## Troubleshooting

**401 Authentication Error**
- Run `az login` locally
- Enable Managed Identity in Azure
- Check Key Vault access policies/RBAC

**404 Secret Not Found**
- Secret doesn't exist in Key Vault
- Check secret name spelling
- Verify you have "Get" permission

**403 Forbidden**
- Missing Key Vault permissions
- Add required permissions: Get, List, Set, Delete, Purge
