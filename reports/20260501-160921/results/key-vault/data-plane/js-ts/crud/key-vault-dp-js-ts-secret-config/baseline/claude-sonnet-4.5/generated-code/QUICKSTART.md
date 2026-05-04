# Azure Key Vault Configuration Provider - Quick Reference

## Project Structure

```
├── src/
│   ├── SecretProvider.ts          # Core secret retrieval with graceful fallback
│   ├── CachedSecretProvider.ts    # In-memory caching with auto-refresh
│   ├── ConfigurationModule.ts     # Main entry point with managed identity
│   ├── SecretRotationHelper.ts    # Safe secret rotation with cleanup
│   └── index.ts                   # Complete demo script
├── package.json                   # Azure SDK dependencies
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Full documentation

```

## Key Features Implemented

### ✅ SecretProvider (src/SecretProvider.ts)
- `getSecret(name, defaultValue?)` - Retrieve secret with graceful fallback
- `getSecretVersion(name, version, defaultValue?)` - Get specific version
- `getSecretWithMetadata(name, defaultValue?)` - Get value + expiry + version
- `getSecretExpiryDate(name)` - Inspect expiry date
- `isSecretExpiringSoon(name, warningWindowDays)` - Check if expiring soon

### ✅ CachedSecretProvider (src/CachedSecretProvider.ts)
- `bulkLoad(secretNames, defaults?)` - Load multiple secrets at startup
- `getSecret(name, defaultValue?)` - Retrieve from cache (or fetch if missing)
- `refreshSecret(name, defaultValue?)` - On-demand refresh of individual key
- `refreshExpiringSoon()` - Auto-refresh secrets within warning window
- `getExpiringSoonSecrets()` - List secrets nearing expiry
- `getCacheSize()` - Cache statistics

### ✅ ConfigurationModule (src/ConfigurationModule.ts)
- Uses `DefaultAzureCredential` for managed identity authentication
- Vault URL from environment variable (`AZURE_KEY_VAULT_URL`)
- Configurable expiry warning window (default 7 days)
- `initialize(requiredSecrets)` - Bulk load required configuration

### ✅ SecretRotationHelper (src/SecretRotationHelper.ts)
- `createNewVersionWithExpiry(name, value, expiryDays)` - Create new version
- `rotateSecret(name, newValue, options)` - Full rotation with optional cleanup
- `deleteAndPurgeSecret(name)` - Safe delete with long-running operation handling
  - Uses `beginDeleteSecret()` with polling
  - Waits for soft-delete completion before purging
- `listSecretVersions(name)` - View all versions of a secret

### ✅ Demo Script (src/index.ts)
1. Initialize with managed identity
2. Bulk load configuration keys
3. Read from cache
4. Refresh individual secrets
5. Check for expiring secrets with warnings
6. Create secret with expiry date
7. Rotate secret to new version
8. List all versions
9. Delete and purge demo (safe cleanup)

## Azure SDK Dependencies

- `@azure/identity` ^4.0.0 - DefaultAzureCredential for managed identity
- `@azure/keyvault-secrets` ^4.8.0 - Key Vault Secrets client

## Usage Example

```typescript
import { ConfigurationModule } from './ConfigurationModule';

// Initialize (uses managed identity)
const config = new ConfigurationModule(
  process.env.AZURE_KEY_VAULT_URL,
  7  // expiry warning days
);

// Bulk load required secrets
await config.initialize([
  'database-connection-string',
  'api-key',
  'smtp-password'
]);

// Read from cache
const cached = config.getCachedProvider();
const dbConnection = cached.getCachedValue('database-connection-string');

// Check expiring secrets
const expiring = cached.getExpiringSoonSecrets();
if (expiring.length > 0) {
  console.log('⚠️  Expiring soon:', expiring);
}

// Rotate a secret
const rotationHelper = new SecretRotationHelper(config.getSecretClient());
await rotationHelper.rotateSecret(
  'my-secret',
  'new-value',
  { expiryDays: 90, cleanupOldVersion: true }
);
```

## Authentication Methods

DefaultAzureCredential tries (in order):
1. Environment variables (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID)
2. **Managed Identity** (when running in Azure - VM, App Service, Functions, etc.)
3. Azure CLI credentials (for local development)
4. Azure PowerShell credentials

## Required Key Vault Permissions

- Get (secrets)
- Set (secrets)
- Delete (secrets)
- Purge (deleted secrets)
- List (secret versions)

Configure via **Access Policies** or **Azure RBAC** (Key Vault Secrets Officer role).

## Build & Run

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run demo
npm start

# Or use ts-node for development
npm run dev
```

## Error Handling

All methods gracefully handle missing secrets:
- Return default value instead of throwing
- 404 errors caught and handled
- Other errors propagated for proper error handling

## Long-Running Operations

The delete and purge flow properly handles Azure Key Vault's async operations:
1. `beginDeleteSecret()` returns a poller
2. `pollUntilDone()` waits for soft-delete completion
3. Only then calls `purgeDeletedSecret()`

This ensures the secret is fully deleted before attempting purge.
