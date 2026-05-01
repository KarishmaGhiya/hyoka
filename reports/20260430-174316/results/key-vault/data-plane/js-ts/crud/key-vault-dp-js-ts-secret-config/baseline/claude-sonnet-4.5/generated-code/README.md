# Azure Key Vault Configuration Provider

A TypeScript Node.js application that implements a robust configuration provider backed by Azure Key Vault, featuring intelligent caching, automatic expiry detection, and safe secret rotation.

## Features

### 🔐 Secret Provider
- Retrieve secrets by name with graceful fallback to default values
- Get specific versions of secrets (not just latest)
- Inspect secret expiry dates
- List all versions of a secret

### 💾 Intelligent Caching Layer
- In-memory caching after first retrieval
- Bulk-load predefined config keys at startup
- On-demand refresh of individual secrets
- Automatic re-fetch when secrets approach expiry (configurable warning window)
- Cache invalidation support

### 🔄 Secret Rotation Helper
- Create new versions of secrets with updated values
- Set expiry dates on rotated secrets
- Safe cleanup with delete-and-purge flow
- Proper handling of Azure's soft-delete feature
- Long-running operation support

### 🔒 Secure Authentication
- Uses Azure Managed Identity (DefaultAzureCredential)
- No hardcoded secrets or certificates
- Environment-based vault URL configuration

## Prerequisites

- Node.js 18+ and npm
- Azure Key Vault instance
- Azure authentication (one of):
  - Managed Identity (for Azure-hosted apps)
  - Azure CLI (`az login`)
  - Service Principal credentials

## Installation

```bash
npm install
```

## Configuration

Set the Key Vault URL as an environment variable:

```bash
export AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net/"
```

### Required Key Vault Permissions

Your Azure identity needs the following permissions:
- **Secrets**: Get, Set, Delete, Purge, List

## Usage

### Build and Run

```bash
# Build TypeScript
npm run build

# Run the demo
npm start

# Or run directly with ts-node
npm run dev
```

### Using in Your Application

```typescript
import { CachedSecretProvider } from './CachedSecretProvider';
import { SecretRotationHelper } from './SecretRotationHelper';

// Initialize provider with 7-day expiry warning
const provider = new CachedSecretProvider(vaultUrl, {
  expiryWarningDays: 7
});

// Bulk load secrets at startup
const secrets = await provider.bulkLoad([
  'database-connection-string',
  'api-key',
  'storage-account-key'
]);

// Get secret (uses cache)
const apiKey = await provider.getSecret('api-key');

// Refresh on-demand
await provider.refreshSecret('api-key');

// Check for expiring secrets
const expiring = await provider.getExpiringSoonSecrets();
if (expiring.size > 0) {
  console.warn('Secrets expiring soon:', Array.from(expiring.keys()));
}

// Rotate a secret
const rotationHelper = new SecretRotationHelper(vaultUrl);
await rotationHelper.rotateSecret('api-key', {
  newValue: 'new-secure-value',
  expiresOn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
});
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Main Application                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    CachedSecretProvider                 │
│  - Bulk loading                         │
│  - In-memory cache                      │
│  - Auto-refresh on expiry               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       SecretProvider                    │
│  - Get by name/version                  │
│  - Metadata & expiry inspection         │
│  - Graceful error handling              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Azure Key Vault                    │
│  - Secret storage                       │
│  - Versioning                           │
│  - Soft-delete protection               │
└─────────────────────────────────────────┘
```

## Demo Flow

The demo script (`src/index.ts`) demonstrates:

1. **Bulk Loading**: Load multiple secrets at startup
2. **Cache Hits**: Subsequent reads use cached values
3. **On-Demand Refresh**: Manually refresh a specific secret
4. **Expiry Warnings**: Detect secrets expiring within 7 days
5. **Secret Rotation**: Create new versions with updated values
6. **Safe Cleanup**: Delete and purge with proper waiting

## Error Handling

- **404 Errors**: Returns default values instead of crashing
- **Authentication Failures**: Clear error messages with troubleshooting steps
- **Network Issues**: Graceful degradation and retry suggestions
- **Soft-Delete Protection**: Handles Azure Key Vault's delete/purge model

## Production Considerations

1. **Caching**: Adjust `expiryWarningDays` based on your security requirements
2. **Monitoring**: Add logging/telemetry for secret access patterns
3. **Secret Versions**: Keep old versions for rollback capability
4. **Retry Logic**: Add exponential backoff for transient failures
5. **Rate Limiting**: Be mindful of Key Vault API limits

## License

MIT
