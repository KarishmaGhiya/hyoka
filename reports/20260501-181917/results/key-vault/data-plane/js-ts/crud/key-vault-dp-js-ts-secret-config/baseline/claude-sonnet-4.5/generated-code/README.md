# Azure Key Vault Configuration Provider

A TypeScript Node.js application that provides secure configuration management backed by Azure Key Vault, featuring caching, secret rotation, and managed identity authentication.

## Features

- **Secret Provider**: Retrieve secrets by name with graceful fallback to defaults
- **Version Support**: Access specific secret versions, not just the latest
- **Expiry Tracking**: Inspect secret expiry dates and detect approaching expiration
- **Caching Layer**: In-memory cache with bulk-loading and on-demand refresh
- **Automatic Refresh**: Re-fetch secrets nearing expiry within a configurable window
- **Managed Identity**: Secure authentication in Azure without hardcoded credentials
- **Secret Rotation**: Safely rotate secrets with cleanup (delete + purge)
- **Long-Running Operations**: Proper handling of Key Vault's soft-delete feature

## Project Structure

```
├── src/
│   ├── SecretProvider.ts          # Core secret retrieval with version/expiry support
│   ├── CachingSecretProvider.ts   # Caching layer with bulk-load and auto-refresh
│   ├── ConfigurationModule.ts     # Main configuration module with managed identity
│   ├── SecretRotationHelper.ts    # Secret rotation and cleanup operations
│   └── index.ts                   # Demo script showing full workflow
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- An Azure Key Vault instance
- Appropriate permissions:
  - `Key Vault Secrets Officer` or equivalent for full demo
  - At minimum: Get, List, Set, Delete, Purge secret permissions

## Installation

```bash
npm install
```

## Configuration

Set the Key Vault URL as an environment variable:

```bash
# Windows (PowerShell)
$env:AZURE_KEYVAULT_URL="https://your-keyvault-name.vault.azure.net/"

# Windows (CMD)
set AZURE_KEYVAULT_URL=https://your-keyvault-name.vault.azure.net/

# Linux/Mac
export AZURE_KEYVAULT_URL=https://your-keyvault-name.vault.azure.net/
```

## Authentication

The application uses `DefaultAzureCredential` which supports:

1. **Managed Identity** (in Azure): Automatically used when running in Azure App Service, Azure Functions, Azure VMs, etc.
2. **Azure CLI** (local dev): Run `az login` first
3. **Environment Variables** (local dev): Set `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`

For local development with Azure CLI:

```bash
az login
```

## Usage

### Build and Run

```bash
# Build TypeScript
npm run build

# Run compiled JavaScript
npm start

# Or run directly with ts-node
npm run dev
```

### Demo Flow

The demo script (`src/index.ts`) demonstrates:

1. **Bulk-load configuration keys** at startup
2. **Read secrets from cache** (fast, no API calls)
3. **Refresh a single key** on-demand
4. **Check for secrets near expiry** (within 7 days)
5. **Rotate a secret** (create new version with new expiry)
6. **Delete and purge** a secret (full cleanup)

### Using in Your Application

```typescript
import { ConfigurationModule } from './ConfigurationModule';

// Initialize with managed identity
const config = new ConfigurationModule(
  'https://your-keyvault.vault.azure.net/',
  7 // warning window: 7 days
);

// Bulk-load required keys at startup
await config.initialize([
  'database-connection-string',
  'api-key',
  'service-url'
]);

// Get secrets from cache
const cachingProvider = config.getCachingProvider();
const dbConnection = await cachingProvider.get('database-connection-string');

// Check for expiring secrets
const expiring = cachingProvider.getExpiringSecrets();
if (expiring.length > 0) {
  console.warn('Secrets near expiry:', expiring);
}

// Refresh a specific secret
await cachingProvider.refresh('api-key');

// Rotate a secret
const provider = config.getProvider();
const rotationHelper = new SecretRotationHelper(
  config.getClient(),
  provider
);

const result = await rotationHelper.rotateSecret(
  'api-key',
  'new-secret-value',
  new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
);
console.log(`Rotated from ${result.oldVersion} to ${result.newVersion}`);
```

## API Reference

### SecretProvider

- `getSecret(name, defaultValue?)`: Get secret by name with fallback
- `getSecretVersion(name, version, defaultValue?)`: Get specific version
- `getSecretInfo(name)`: Get full secret metadata including expiry
- `isNearExpiry(expiresOn, warningWindowDays)`: Check if secret is near expiry
- `setSecret(name, value, expiresOn?)`: Create or update secret

### CachingSecretProvider

- `bulkLoad(keys[])`: Load multiple secrets at startup
- `get(name, defaultValue?)`: Get from cache (or fetch and cache)
- `refresh(name)`: Force refresh a single key
- `refreshExpiring()`: Auto-refresh all near-expiry secrets
- `getExpiringSecrets()`: List secrets near expiry
- `getCacheStats()`: Get cache statistics

### SecretRotationHelper

- `rotateSecret(name, newValue, expiresOn?)`: Create new secret version
- `deleteSecretVersion(name, version)`: Delete secret (soft-delete)
- `purgeDeletedSecret(name)`: Permanently remove from soft-delete
- `deleteAndPurge(name)`: Full cleanup (delete + wait + purge)
- `listVersions(name)`: List all versions of a secret

## Notes

- **Soft-Delete**: Azure Key Vault uses soft-delete by default. Deleted secrets remain for 90 days unless purged.
- **Purge Permissions**: Purging requires special permissions. Ensure your identity has `purge` permission.
- **Rate Limits**: Key Vault has rate limits. The caching layer helps minimize API calls.
- **Production Use**: Consider implementing retry logic and more sophisticated error handling for production.

## License

MIT
