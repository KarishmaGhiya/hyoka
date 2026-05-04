# Project Summary: Azure Key Vault Configuration Provider

## Overview
A production-ready TypeScript Node.js application for managing application configuration using Azure Key Vault as the backend. Features include caching, secret rotation, expiry tracking, and managed identity authentication.

## Project Structure

```
azure-keyvault-config-provider/
├── src/
│   ├── SecretProvider.ts           # Core secret retrieval with version/expiry support
│   ├── CachingSecretProvider.ts    # Caching layer with bulk-load and auto-refresh
│   ├── ConfigurationModule.ts      # Main configuration module with managed identity
│   ├── SecretRotationHelper.ts     # Secret rotation and cleanup operations
│   ├── index.ts                    # Complete demo script
│   └── examples.ts                 # Usage examples
├── dist/                           # Compiled JavaScript output
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── README.md                       # Full documentation
└── .gitignore                      # Git ignore rules
```

## Key Features Implemented

### 1. SecretProvider (src/SecretProvider.ts)
- ✅ Retrieve secrets by name with graceful fallback to defaults
- ✅ Get specific secret versions (not just latest)
- ✅ Inspect secret expiry dates and creation dates
- ✅ Check if secrets are near expiry within a configurable window
- ✅ Create/update secrets with expiry dates
- ✅ List all versions of a secret

### 2. CachingSecretProvider (src/CachingSecretProvider.ts)
- ✅ In-memory cache for secret values
- ✅ Bulk-load predefined keys at startup
- ✅ On-demand refresh of individual keys
- ✅ Automatic re-fetch of secrets near expiry
- ✅ Cache statistics and management
- ✅ Expiry tracking within configurable warning window (default: 7 days)

### 3. ConfigurationModule (src/ConfigurationModule.ts)
- ✅ Secure connection using vault URL from environment variable
- ✅ Managed identity authentication via DefaultAzureCredential
- ✅ No client secrets or certificates in code
- ✅ Easy initialization with required keys

### 4. SecretRotationHelper (src/SecretRotationHelper.ts)
- ✅ Rotate secrets by creating new versions
- ✅ Safe delete operation using long-running poller
- ✅ Wait for delete completion before purge
- ✅ Full delete-and-purge cleanup workflow
- ✅ List all versions for cleanup decisions
- ✅ Proper handling of Key Vault's soft-delete feature

### 5. Demo Script (src/index.ts)
- ✅ Complete workflow demonstration
- ✅ Bulk-load configuration at startup
- ✅ Read from cache
- ✅ Refresh individual keys
- ✅ Check for expiring secrets
- ✅ Perform secret rotation
- ✅ Demonstrate delete-and-purge cleanup
- ✅ Comprehensive error handling

## Dependencies

```json
{
  "@azure/identity": "^4.0.0",           // Managed identity support
  "@azure/keyvault-secrets": "^4.8.0",   // Key Vault SDK
  "typescript": "^5.3.3",                // TypeScript compiler
  "ts-node": "^10.9.2",                  // Direct TS execution
  "@types/node": "^20.11.0"              // Node.js types
}
```

## Usage

### Environment Setup
```bash
# Set Key Vault URL
$env:AZURE_KEYVAULT_URL="https://your-vault.vault.azure.net/"

# For local development (if not using Azure CLI)
$env:AZURE_TENANT_ID="your-tenant-id"
$env:AZURE_CLIENT_ID="your-client-id"
$env:AZURE_CLIENT_SECRET="your-client-secret"
```

### Build and Run
```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript
npm start          # Run compiled demo
npm run dev        # Run with ts-node (no build needed)
```

### Code Example
```typescript
import { ConfigurationModule } from './ConfigurationModule';

const config = new ConfigurationModule(
  'https://your-vault.vault.azure.net/',
  7  // 7-day expiry warning window
);

// Initialize with required keys
await config.initialize(['db-url', 'api-key']);

// Get from cache (fast)
const cachingProvider = config.getCachingProvider();
const apiKey = await cachingProvider.get('api-key');

// Check for expiring secrets
const expiring = cachingProvider.getExpiringSecrets();
if (expiring.length > 0) {
  console.warn('Secrets near expiry:', expiring);
  await cachingProvider.refreshExpiring();
}
```

## Authentication Options

The `DefaultAzureCredential` automatically tries these methods in order:

1. **Environment Variables** - AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID
2. **Managed Identity** - When running in Azure (App Service, Functions, VMs, AKS)
3. **Azure CLI** - When running locally after `az login`
4. **Visual Studio** - When logged in to VS
5. **Azure PowerShell** - When logged in to PowerShell

This makes the code work seamlessly in both Azure and local development!

## Key Vault Permissions Required

Your identity needs these permissions:
- **Get** - Read secret values
- **List** - List secrets and versions
- **Set** - Create/update secrets
- **Delete** - Delete secrets (moves to soft-delete)
- **Purge** - Permanently remove deleted secrets

## Soft-Delete Behavior

Azure Key Vault uses soft-delete by default:
1. **Delete** - Secret goes to soft-delete state (recoverable for 90 days)
2. **Purge** - Permanently removes secret (cannot recover)

The `deleteAndPurge()` method safely handles this:
- Initiates delete operation (long-running)
- Waits for delete to complete using poller
- Purges only after delete completes
- This prevents "not found" errors when purging

## Production Considerations

1. **Error Handling** - Add retry logic for transient failures
2. **Logging** - Integrate with your logging framework
3. **Monitoring** - Track cache hit rates and expiry warnings
4. **Rate Limits** - Key Vault has rate limits; caching helps minimize calls
5. **Secret Naming** - Use consistent naming conventions
6. **Rotation Schedule** - Automate rotation before expiry
7. **Backup** - Consider secret backup strategies
8. **Testing** - Mock the SecretClient for unit tests

## Testing

To test locally:
1. Create an Azure Key Vault
2. Run `az login` to authenticate
3. Set `AZURE_KEYVAULT_URL` environment variable
4. Run `npm run dev`

The demo script will:
- Create test secrets
- Demonstrate all features
- Clean up test secrets

## License
MIT
