# Azure Key Vault Configuration Provider

A TypeScript Node.js application that implements a comprehensive configuration provider backed by Azure Key Vault with caching, secret rotation, and expiry management.

## Features

- **Secret Provider**: Retrieves secrets from Key Vault with graceful error handling
  - Get secrets by name with default values
  - Retrieve specific secret versions
  - Inspect secret expiry dates
  
- **Caching Layer**: In-memory caching with intelligent refresh
  - Bulk-load configuration keys at startup
  - On-demand refresh of individual keys
  - Automatic re-fetch of secrets nearing expiry
  
- **Managed Identity Authentication**: Secure authentication using Azure DefaultAzureCredential
  - Works in Azure with managed identity
  - Works locally with Azure CLI authentication
  - No secrets or certificates in code
  
- **Secret Rotation**: Safe secret rotation with versioning
  - Create new secret versions with updated values and expiry dates
  - Long-running delete operation with proper polling
  - Safe purge of soft-deleted secrets
  
## Prerequisites

- Node.js 18 or higher
- Azure subscription
- Azure Key Vault instance
- Appropriate Key Vault permissions: Get, List, Set, Delete, Purge secrets
- Authentication configured:
  - In Azure: Managed Identity enabled on your resource
  - Locally: Azure CLI (`az login`)

## Installation

```bash
npm install
```

## Configuration

Set the Key Vault URL via environment variable:

```bash
export AZURE_KEYVAULT_URL="https://your-vault.vault.azure.net"
```

Or set it in your shell (Windows):

```powershell
$env:AZURE_KEYVAULT_URL="https://your-vault.vault.azure.net"
```

## Building

```bash
npm run build
```

## Running

```bash
npm start
```

Or for development:

```bash
npm run dev
```

## Project Structure

```
src/
├── SecretProvider.ts          # Core secret retrieval with version support
├── CachingSecretProvider.ts   # Caching layer with expiry management
├── ConfigurationModule.ts     # Main configuration interface
├── SecretRotationHelper.ts    # Secret rotation and lifecycle management
└── index.ts                   # Demo application
```

## Usage Examples

### Initialize Configuration Module

```typescript
import { ConfigurationModule } from "./ConfigurationModule";

const config = ConfigurationModule.getInstance({
  vaultUrl: "https://your-vault.vault.azure.net",
  expiryWarningDays: 7
});

// Bulk-load required secrets
await config.initialize([
  "DatabaseConnectionString",
  "ApiKey",
  "EncryptionKey"
]);
```

### Retrieve Configuration Values

```typescript
// Get from cache (or fetch if not cached)
const apiKey = await config.get("ApiKey", "default-value");

// Force refresh from Key Vault
const refreshedKey = await config.refresh("ApiKey");
```

### Check for Expiring Secrets

```typescript
const expiringSecrets = await config.checkExpiring();
if (expiringSecrets.length > 0) {
  console.warn("Secrets expiring soon:", expiringSecrets);
}
```

### Rotate Secrets

```typescript
import { SecretRotationHelper } from "./SecretRotationHelper";
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();
const rotationHelper = new SecretRotationHelper(vaultUrl, credential);

// Create new version with expiry
const newVersion = await rotationHelper.rotateSecret(
  "MySecret",
  "new-secret-value",
  { expiryDays: 90 }
);

// Delete and purge old version (if needed)
await rotationHelper.deleteSecretVersion("MySecret");
await rotationHelper.purgeDeletedSecret("MySecret");
```

## Authentication

The application uses `DefaultAzureCredential` which tries authentication methods in order:

1. Environment variables (service principal)
2. Workload Identity (Kubernetes)
3. Managed Identity (Azure resources)
4. Visual Studio Code
5. Azure CLI
6. Azure PowerShell
7. Azure Developer CLI

This ensures the code works both locally and in Azure without modification.

## Key Vault Permissions

Your identity needs the following Key Vault permissions:

- **Secrets**: Get, List, Set, Delete, Purge

Assign these via Azure RBAC role: `Key Vault Secrets Officer` or custom role.

## Demo Output

The demo script demonstrates:

1. ✓ Configuration module initialization with managed identity
2. ✓ Bulk-loading secrets into cache
3. ✓ Reading cached values
4. ✓ Refreshing individual secrets
5. ✓ Checking for expiring secrets
6. ✓ Creating new secret versions
7. ✓ Safe delete and purge flow

## Error Handling

- Graceful handling of missing secrets (returns default values)
- Proper authentication error messages
- Safe handling of Key Vault soft-delete feature
- Long-running operation polling for deletes

## Security Best Practices

✓ Uses managed identity (no secrets in code)  
✓ Secrets are cached in memory (not persisted)  
✓ Supports secret expiry dates  
✓ Safe rotation with versioning  
✓ Proper soft-delete handling  

## License

MIT
