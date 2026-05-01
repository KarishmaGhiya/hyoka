# Azure Key Vault Configuration Provider

A TypeScript Node.js application that implements a robust configuration provider backed by Azure Key Vault, featuring caching, automatic expiry monitoring, and safe secret rotation.

## Features

### 🔐 Secret Provider
- Retrieve secrets from Azure Key Vault by name
- Graceful error handling (returns default values for missing secrets)
- Support for specific secret versions
- Inspect secret expiry dates

### 💾 Caching Layer
- In-memory caching for fast access
- Bulk-load predefined configuration keys at startup
- On-demand refresh of individual keys
- Automatic re-fetch of secrets nearing expiry
- Configurable expiry warning window (default: 7 days)

### 🔄 Secret Rotation
- Create new secret versions with updated values and expiry dates
- Safe delete and purge workflow for cleanup
- Handles Key Vault's soft-delete feature properly
- Waits for long-running delete operations before purging

### 🔒 Secure Authentication
- Uses Azure Managed Identity via `DefaultAzureCredential`
- No client secrets or certificates in code
- Production-ready for Azure-hosted applications

## Prerequisites

- Node.js 18+ and npm
- Azure subscription with Key Vault access
- One of the following for authentication:
  - Azure CLI (`az login`) for local development
  - Managed Identity when running in Azure
  - Environment variables for service principal (if needed)

## Installation

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build
```

## Configuration

Set the Key Vault URL as an environment variable:

```bash
# Linux/macOS
export AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net"

# Windows PowerShell
$env:AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net"

# Windows Command Prompt
set AZURE_KEYVAULT_URL=https://your-vault-name.vault.azure.net
```

## Usage

### Run the Demo

```bash
# Using Node.js (after building)
npm start

# Or using ts-node for development
npm run dev
```

### Basic Usage Example

```typescript
import { SecretProvider } from './secretProvider';
import { CachingProvider } from './cachingProvider';

// Initialize provider with Key Vault URL
const provider = new SecretProvider(process.env.AZURE_KEYVAULT_URL!);

// Create caching layer
const cache = new CachingProvider(provider, {
  expiryWarningDays: 7,
  autoRefreshExpiring: true,
});

// Bulk load configuration at startup
await cache.bulkLoad([
  'DatabaseConnectionString',
  'ApiKey',
  'ServiceBusConnectionString',
]);

// Read from cache (fast!)
const apiKey = await cache.get('ApiKey', 'default-key');

// Check for expiring secrets
const expiring = await cache.checkExpiringSecrets();
for (const secret of expiring) {
  console.warn(`Secret '${secret.name}' expires in ${secret.daysUntilExpiry} days`);
}

// Refresh a specific secret
await cache.refresh('ApiKey');
```

### Secret Rotation Example

```typescript
import { SecretRotationHelper } from './secretRotation';

const rotationHelper = new SecretRotationHelper(provider);

// Rotate a secret
const newExpiry = new Date();
newExpiry.setDate(newExpiry.getDate() + 180); // 180 days from now

await rotationHelper.rotateSecret('MySecret', {
  newValue: 'new-secure-value',
  expiresOn: newExpiry,
  cleanupOldVersions: false,
});

// Delete and purge old secret (use carefully!)
await rotationHelper.deleteAndPurgeSecret('OldSecret');
```

## Key Vault Permissions Required

Your managed identity or service principal needs these permissions:

- **Secrets**: Get, List, Set, Delete, Purge
- **Optional**: Backup, Restore, Recover (for advanced scenarios)

Configure using Azure RBAC (recommended):
- Role: **Key Vault Secrets Officer** or **Key Vault Administrator**

Or using Access Policies:
- Secret permissions: Get, List, Set, Delete, Purge

## Project Structure

```
src/
├── secretProvider.ts      # Core provider for Key Vault operations
├── cachingProvider.ts     # Caching layer with bulk loading
├── secretRotation.ts      # Secret rotation and cleanup helpers
└── index.ts               # Demo application

package.json               # Dependencies and scripts
tsconfig.json              # TypeScript configuration
README.md                  # This file
```

## How It Works

### Secret Retrieval Flow

1. **Cache Check**: First checks in-memory cache
2. **Expiry Check**: If cached and near expiry, automatically refreshes
3. **Key Vault Fetch**: If not cached, fetches from Key Vault
4. **Graceful Fallback**: Returns default value if secret doesn't exist

### Safe Secret Deletion

Key Vault uses soft-delete, so deletion is a two-step process:

1. **Begin Delete**: Initiates a long-running delete operation
2. **Poll Until Done**: Waits for deletion to complete
3. **Purge**: Permanently removes the secret (allows name reuse)

This ensures secrets aren't left in a "deleted but recoverable" state.

## Authentication Methods

`DefaultAzureCredential` tries these methods in order:

1. **Environment** - Service principal via environment variables
2. **Managed Identity** - Azure VM, App Service, Functions, etc.
3. **Azure CLI** - `az login` for local development
4. **Azure PowerShell** - For PowerShell users
5. **Visual Studio Code** - VS Code Azure extension
6. **Interactive Browser** - Last resort fallback

## Error Handling

- **404/SecretNotFound**: Returns default value (graceful degradation)
- **401/403**: Authentication/authorization errors (check permissions)
- **Network errors**: Propagated with clear error messages
- **Expiry warnings**: Logged but non-blocking

## Best Practices

1. **Use Managed Identity**: Avoid hardcoding credentials
2. **Set Expiry Dates**: Always set expiry on secrets
3. **Monitor Expiry**: Check expiring secrets regularly
4. **Rotate Secrets**: Rotate before expiry, not after
5. **Test Locally**: Use Azure CLI authentication for development
6. **Cache Configuration**: Reduce Key Vault calls for performance
7. **Handle Defaults**: Always provide sensible default values

## Troubleshooting

### Authentication Fails
```bash
# For local development, log in with Azure CLI
az login

# Verify you have access
az keyvault secret list --vault-name your-vault-name
```

### Permission Denied
- Check your managed identity has Key Vault permissions
- Verify RBAC role assignment or access policies
- Ensure firewall rules allow your IP/network

### Secret Not Found
- Verify secret name (case-sensitive)
- Check if secret was soft-deleted
- Ensure you're using the correct Key Vault URL

## License

MIT
