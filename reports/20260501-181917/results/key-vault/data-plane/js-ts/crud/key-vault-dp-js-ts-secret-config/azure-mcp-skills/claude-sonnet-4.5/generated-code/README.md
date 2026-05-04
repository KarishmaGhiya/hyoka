# Azure Key Vault Configuration Provider

A TypeScript Node.js project that implements a production-ready application configuration provider backed by Azure Key Vault, featuring caching, secret rotation, and managed identity authentication.

## Features

- **Secret Provider**: Retrieve secrets by name with graceful error handling
  - Get latest or specific versions of secrets
  - Inspect expiry dates and check if secrets are near expiration
  - Return default values when secrets don't exist

- **Caching Layer**: In-memory cache for improved performance
  - Bulk-load secrets at startup
  - On-demand refresh of individual secrets
  - Automatic re-fetch of secrets near expiry
  - Cache statistics and monitoring

- **Managed Identity Authentication**: Secure, credential-free authentication
  - No client secrets or certificates in code
  - Works seamlessly in Azure environments

- **Secret Rotation Helper**: Safe secret lifecycle management
  - Create new versions with updated values and expiry dates
  - Disable old versions automatically
  - Delete and purge operations with proper polling
  - Version listing and tracking

## Prerequisites

- Node.js 18+ with ES modules support
- Azure Key Vault instance with soft-delete enabled
- Managed Identity configured for your Azure resource (VM, App Service, Container App, etc.)
- RBAC permissions:
  - `Key Vault Secrets Officer` or equivalent role
  - Minimum: Get, Set, Delete, Purge permissions on secrets

## Installation

```bash
npm install
```

## Configuration

Set the required environment variable:

```bash
# Linux/macOS
export KEY_VAULT_URL="https://your-vault-name.vault.azure.net"

# Windows PowerShell
$env:KEY_VAULT_URL="https://your-vault-name.vault.azure.net"
```

## Usage

### Build and Run

```bash
# Build TypeScript
npm run build

# Run the demo
npm start

# Or build and run in one command
npm run dev
```

### Local Development

For local development without Managed Identity, modify `ConfigurationModule.ts` to use `DefaultAzureCredential`:

```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Replace ManagedIdentityCredential with DefaultAzureCredential
const credential = new DefaultAzureCredential();
```

Then authenticate locally:

```bash
# Use Azure CLI
az login

# Or set environment variables for service principal
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export AZURE_TENANT_ID="your-tenant-id"
```

## Project Structure

```
src/
├── ConfigurationModule.ts      # Main module - sets up Key Vault connection
├── SecretProvider.ts            # Direct secret retrieval with error handling
├── CachedSecretProvider.ts     # Caching layer with bulk loading
├── SecretRotationHelper.ts     # Secret rotation and cleanup operations
└── index.ts                     # Demo application
```

## Code Examples

### Initialize Configuration Module

```typescript
import { ConfigurationModule } from "./ConfigurationModule.js";

const config = new ConfigurationModule({ expiryWarningDays: 7 });
const cachedProvider = config.getCachedProvider();
```

### Bulk Load Secrets at Startup

```typescript
const configKeys = [
  "database-connection-string",
  "api-key",
  "encryption-key"
];
await cachedProvider.bulkLoad(configKeys);
```

### Read from Cache

```typescript
const apiKey = await cachedProvider.get("api-key", "default-value");
```

### Check for Expiring Secrets

```typescript
const expiringSecrets = await cachedProvider.getExpiringSecrets();
expiringSecrets.forEach(secret => {
  console.log(`${secret.secretName} expires in ${secret.daysUntilExpiry} days`);
});
```

### Rotate a Secret

```typescript
import { SecretRotationHelper } from "./SecretRotationHelper.js";

const rotationHelper = new SecretRotationHelper(config.getSecretClient());

const newSecret = await rotationHelper.rotateSecret("my-secret", {
  newValue: "new-secure-value",
  expiryDays: 90,
  tags: { rotatedBy: "automation" }
});
```

### Safe Delete and Purge

```typescript
// Delete with soft-delete (recoverable)
await rotationHelper.deleteAndPurgeSecret("old-secret", false);

// Delete and purge (permanent)
await rotationHelper.deleteAndPurgeSecret("old-secret", true);
```

## Demo Output

The demo script demonstrates:

1. ✅ Configuration module initialization
2. ✅ Bulk loading of config keys
3. ✅ Reading secrets from cache
4. ✅ Cache statistics
5. ✅ On-demand secret refresh
6. ✅ Expiry monitoring and warnings
7. ✅ Secret rotation with version management
8. ✅ Delete and purge workflow

## Best Practices

1. **Use Managed Identity in production** - No credentials to manage or rotate
2. **Enable soft-delete** - Required for Key Vault best practices
3. **Set expiration dates** - Enforce regular secret rotation
4. **Monitor expiring secrets** - Automate rotation before expiry
5. **Cache secrets** - Reduce Key Vault API calls and improve performance
6. **Use bulk loading** - Load all required secrets at startup
7. **Implement least privilege** - Grant only necessary RBAC permissions

## Troubleshooting

### Authentication Issues

```
Error: AADSTS70001: Application with identifier 'xxx' was not found
```

**Solution**: Ensure Managed Identity is enabled on your Azure resource and has access to the Key Vault.

### Permission Denied

```
Error: Caller is not authorized to perform action on resource
```

**Solution**: Grant the Managed Identity the `Key Vault Secrets Officer` role or equivalent permissions.

### Secret Not Found

```
Secret 'xxx' not found, using default value
```

**Expected behavior**: The provider gracefully returns the default value instead of crashing.

## License

MIT

## Contributing

Contributions are welcome! Please ensure all changes include appropriate error handling and follow the existing code patterns.
