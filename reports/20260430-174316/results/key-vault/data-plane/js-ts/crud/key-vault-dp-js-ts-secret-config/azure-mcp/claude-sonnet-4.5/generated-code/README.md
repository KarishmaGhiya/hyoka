# Azure Key Vault Configuration Provider

A TypeScript Node.js application that implements a robust configuration provider backed by Azure Key Vault, featuring caching, automatic expiry detection, and secure secret rotation.

## Features

### 🔐 Secret Provider
- Retrieve secrets from Azure Key Vault by name
- Graceful handling of missing secrets (returns default values)
- Support for fetching specific secret versions
- Inspect secret expiry dates

### 💾 Caching Layer
- In-memory caching for performance optimization
- Bulk-loading of required configuration keys at startup
- On-demand refresh of individual secrets
- Automatic re-fetch of secrets nearing expiry
- Configurable expiry warning window (default: 7 days)

### 🔑 Managed Identity Authentication
- Secure authentication using Azure Managed Identity
- No client secrets or certificates in code
- Works seamlessly in Azure environments
- Falls back to Azure CLI credentials for local development

### 🔄 Secret Rotation
- Safe secret rotation with new version creation
- Set custom expiry dates for rotated secrets
- Add tags and metadata during rotation
- Safe cleanup workflow:
  - Long-running delete operation
  - Wait for completion
  - Purge deleted secret (respects soft-delete)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Configuration Module                    │
│  - Initialization & Setup                           │
│  - Environment Variable Management                  │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│           Cached Secret Provider                    │
│  - In-Memory Cache                                  │
│  - Bulk Loading                                     │
│  - Auto-Refresh on Expiry                           │
│  - Cache Statistics                                 │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│              Secret Provider                         │
│  - Key Vault Client Wrapper                        │
│  - Error Handling                                   │
│  - Version Management                               │
│  - Expiry Checking                                  │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│           Azure Key Vault SDK                        │
│  (@azure/keyvault-secrets)                          │
└─────────────────────────────────────────────────────┘
```

## Installation

```bash
npm install
```

## Configuration

Set the Azure Key Vault URL as an environment variable:

```bash
export AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net/"
```

Or on Windows PowerShell:

```powershell
$env:AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net/"
```

## Building

```bash
npm run build
```

## Running

```bash
npm start
```

Or for development (build + run):

```bash
npm run dev
```

## Usage Example

```typescript
import { ConfigurationModule } from './ConfigurationModule';
import { SecretRotationHelper } from './SecretRotationHelper';

// Initialize with managed identity
const config = new ConfigurationModule({
  cacheOptions: {
    expiryWarningDays: 7,
    autoRefreshNearExpiry: true,
  },
});

// Bulk load secrets at startup
await config.initialize([
  'DatabaseConnectionString',
  'ApiKey',
  'AppSecret',
], {
  DatabaseConnectionString: 'fallback-connection',
});

// Read from cache
const dbConnection = await config.getConfig('DatabaseConnectionString');

// Refresh specific key
await config.refreshConfig('ApiKey');

// Check for expiring secrets
const expiring = await config.checkHealth();
if (expiring.length > 0) {
  console.warn('Secrets near expiry:', expiring);
}

// Rotate a secret
const rotationHelper = new SecretRotationHelper(config.getSecretClient());
await rotationHelper.rotateSecret('AppSecret', 'new-value', {
  expiryDays: 90,
  tags: { rotatedBy: 'app', rotatedAt: new Date().toISOString() },
});

// Delete and purge (cleanup)
await rotationHelper.deleteAndPurgeSecret('old-secret', true);
```

## Authentication

The application uses `DefaultAzureCredential` from `@azure/identity`, which automatically tries multiple authentication methods in this order:

1. **Environment variables** (service principal)
2. **Managed Identity** (when running in Azure)
3. **Azure CLI** (for local development)
4. **Visual Studio Code** (Azure Account extension)
5. **Azure PowerShell**
6. **Interactive browser** (as last resort)

### For Local Development

Install Azure CLI and authenticate:

```bash
az login
```

### For Azure Deployment

Enable **Managed Identity** on your Azure resource (App Service, Function App, VM, AKS, etc.) and grant it access to the Key Vault:

```bash
# Enable system-assigned managed identity
az webapp identity assign --name <app-name> --resource-group <rg-name>

# Grant Key Vault access
az keyvault set-policy --name <vault-name> \
  --object-id <identity-principal-id> \
  --secret-permissions get list set delete purge
```

## Project Structure

```
├── src/
│   ├── SecretProvider.ts          # Core Key Vault operations
│   ├── CachedSecretProvider.ts    # Caching layer
│   ├── ConfigurationModule.ts     # Main configuration interface
│   ├── SecretRotationHelper.ts    # Secret rotation & cleanup
│   └── index.ts                   # Demo script
├── package.json
├── tsconfig.json
└── README.md
```

## Key Vault Permissions Required

The managed identity or service principal needs these permissions:

- **Secrets**: `get`, `list`, `set`, `delete`, `purge`

## Security Best Practices

✅ Uses managed identity (no credentials in code)  
✅ Supports secret versioning  
✅ Automatic expiry detection and warnings  
✅ Safe delete/purge workflow (respects soft-delete)  
✅ Graceful error handling (doesn't crash on missing secrets)  
✅ Cache-aside pattern for performance  

## License

MIT
