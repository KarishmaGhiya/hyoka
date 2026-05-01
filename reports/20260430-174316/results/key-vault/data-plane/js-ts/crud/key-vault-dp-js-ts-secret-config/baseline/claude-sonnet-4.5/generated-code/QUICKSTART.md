# Quick Start Guide

## Installation

```bash
npm install
```

## Configuration

Set your Azure Key Vault URL:

```bash
# Windows PowerShell
$env:AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net/"

# Windows Command Prompt
set AZURE_KEYVAULT_URL=https://your-vault-name.vault.azure.net/

# Linux/macOS
export AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net/"
```

## Authentication

The application uses `DefaultAzureCredential` which tries authentication in this order:
1. **Environment variables** (Service Principal)
2. **Managed Identity** (when running in Azure)
3. **Azure CLI** (if logged in via `az login`)
4. **Visual Studio Code**
5. **Azure PowerShell**

For local development, the easiest method is:

```bash
az login
```

## Running the Demo

```bash
# Build and run
npm start

# Or run directly with ts-node
npm run dev
```

## Project Structure

```
.
├── src/
│   ├── SecretProvider.ts          # Core provider for Key Vault access
│   ├── CachedSecretProvider.ts    # Caching layer with auto-refresh
│   ├── SecretRotationHelper.ts    # Secret rotation and cleanup
│   └── index.ts                   # Demo application
├── package.json
├── tsconfig.json
└── README.md
```

## Key Classes

### SecretProvider
- `getSecret(name, defaultValue?)` - Get secret with fallback
- `getSecretVersion(name, version)` - Get specific version
- `getSecretMetadata(name)` - Get metadata including expiry
- `isSecretExpiringSoon(name, days)` - Check expiry status
- `listSecretVersions(name)` - List all versions

### CachedSecretProvider
- `bulkLoad(names[])` - Load multiple secrets at startup
- `getSecret(name)` - Get with automatic caching
- `refreshSecret(name)` - Force refresh from Key Vault
- `getExpiringSoonSecrets()` - Find secrets near expiry
- `invalidateSecret(name)` - Remove from cache

### SecretRotationHelper
- `rotateSecret(name, options)` - Create new version
- `deleteSecret(name)` - Soft delete (long-running)
- `purgeDeletedSecret(name)` - Permanent removal
- `deleteAndPurgeSecret(name)` - Complete cleanup
- `recoverDeletedSecret(name)` - Restore soft-deleted secret

## Required Permissions

Your Azure identity needs these Key Vault permissions:
- **Get** - Read secret values
- **Set** - Create/update secrets
- **Delete** - Delete secrets
- **Purge** - Permanently remove deleted secrets
- **List** - List secrets and versions

## Example Usage

```typescript
import { CachedSecretProvider } from './CachedSecretProvider';

const provider = new CachedSecretProvider(
  process.env.AZURE_KEYVAULT_URL!,
  { expiryWarningDays: 7 }
);

// Load secrets at startup
await provider.bulkLoad(['db-password', 'api-key']);

// Get cached secret
const apiKey = await provider.getSecret('api-key');

// Check for expiring secrets
const expiring = await provider.getExpiringSoonSecrets();
if (expiring.size > 0) {
  console.warn('Secrets need rotation:', Array.from(expiring.keys()));
}
```

## Troubleshooting

**"Authentication Failed"**
- Run `az login` for local development
- Ensure managed identity is enabled in Azure
- Check identity has Key Vault permissions

**"Secret Not Found"**
- Verify secret exists in Key Vault
- Check AZURE_KEYVAULT_URL is correct
- Ensure identity has "Get" permission

**"Forbidden (403)"**
- Identity lacks required permissions
- Add permissions in Key Vault Access Policies or RBAC

**"Purge Failed"**
- Vault may have purge protection enabled
- Secret may not be deleted yet (use deleteSecret first)
- Wait for soft-delete operation to complete
