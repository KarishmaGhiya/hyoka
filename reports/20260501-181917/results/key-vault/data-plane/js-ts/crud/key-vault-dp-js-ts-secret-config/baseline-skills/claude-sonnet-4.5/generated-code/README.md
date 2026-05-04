# Azure Key Vault Configuration Provider

A production-ready TypeScript Node.js application that implements a robust configuration provider backed by Azure Key Vault with caching, rotation, and expiry management.

## Features

### 🔐 Secret Provider
- Retrieve secrets by name with graceful handling for missing secrets
- Support for specific version retrieval (not just latest)
- Inspect secret expiry dates and metadata
- Default value support when secrets don't exist

### 💾 Caching Layer
- In-memory cache for fast secret retrieval
- Bulk-loading of predefined secrets at startup
- On-demand refresh of individual secrets
- Automatic re-fetch when secrets are near expiry
- Configurable expiry warning window (default: 7 days)

### 🔄 Secret Rotation
- Safe secret rotation with new version creation
- Set expiry dates and metadata on rotated secrets
- List all versions of a secret
- Clean delete-and-purge workflow with long-running operation support

### 🆔 Managed Identity Authentication
- Secure Azure authentication using Managed Identity
- No client secrets or certificates in code
- Works seamlessly in Azure App Service, Container Apps, Functions, and VMs

## Installation

```bash
npm install
```

## Configuration

Set the Key Vault URL via environment variable:

```bash
export KEY_VAULT_URL=https://your-vault-name.vault.azure.net
```

Or copy `.env.example` to `.env` and update the values.

## Usage

### Build and Run

```bash
# Build TypeScript
npm run build

# Run the demo
npm start

# Or build and run together
npm run dev
```

### Using in Your Application

```typescript
import { ConfigModule } from "./config.js";
import { SecretRotationHelper } from "./rotationHelper.js";

// Initialize with Managed Identity
const config = new ConfigModule({
  expiryWarningDays: 7
});

const cache = config.getCachingProvider();

// Bulk-load secrets at startup
await cache.bulkLoad([
  "database-connection-string",
  "api-key",
  "storage-account-key"
]);

// Read from cache
const dbConnection = await cache.get("database-connection-string");
const apiKey = await cache.get("api-key", "default-key");

// Refresh a specific secret
await cache.refresh("api-key");

// Check for expiring secrets
const expiring = cache.getExpiringSoonSecrets();
for (const secret of expiring) {
  const provider = config.getSecretProvider();
  const daysLeft = provider.getDaysUntilExpiration(secret);
  console.warn(`Secret ${secret.name} expires in ${daysLeft} days`);
}

// Rotate a secret
const rotationHelper = new SecretRotationHelper(config.getSecretClient());
const newVersion = await rotationHelper.rotateSecret(
  "api-key",
  "new-secret-value",
  {
    expiresOn: new Date("2027-12-31"),
    tags: { rotatedBy: "automation" }
  }
);

// Safe delete and purge
await rotationHelper.deleteAndPurgeSecret("old-secret");
```

## Architecture

### Components

- **SecretProvider** (`src/secretProvider.ts`): Core secret retrieval with version and expiry support
- **CachingSecretProvider** (`src/cachingProvider.ts`): In-memory caching layer with bulk operations
- **ConfigModule** (`src/config.ts`): Main configuration module with Managed Identity setup
- **SecretRotationHelper** (`src/rotationHelper.ts`): Safe rotation and deletion workflows
- **Demo Script** (`src/index.ts`): Complete demonstration of all features

### Key Vault Permissions Required

The Managed Identity needs the following permissions on the Key Vault:

- **Secrets**: Get, List, Set, Delete, Purge

Assign these via Azure Portal → Key Vault → Access policies or using Azure CLI:

```bash
az keyvault set-policy \
  --name your-vault-name \
  --object-id <managed-identity-object-id> \
  --secret-permissions get list set delete purge
```

## Local Development

For local development without Managed Identity:

1. Install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli
2. Login: `az login`
3. Set subscription: `az account set --subscription <subscription-id>`

The `ManagedIdentityCredential` will automatically fall back to Azure CLI credentials during local development.

Alternatively, update `src/config.ts` to use `DefaultAzureCredential`:

```typescript
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();
```

## Demo Output

The demo script demonstrates:

1. ✅ Creating test secrets with expiry dates
2. 📦 Bulk-loading secrets at startup
3. 📖 Reading secrets from cache
4. 🔄 On-demand secret refresh
5. ⚠️ Checking for expiring secrets with warnings
6. 📌 Retrieving specific secret versions
7. 🔐 Secret rotation with new version creation
8. 🗑️ Safe delete-and-purge workflow
9. 🧹 Automatic cleanup

## Error Handling

The provider includes robust error handling:

- **SecretNotFound**: Returns default value instead of throwing
- **Authentication errors**: Clear messages about Managed Identity permissions
- **Network errors**: Helpful tips about Key Vault URL configuration
- **Soft-delete awareness**: Proper handling of Key Vault's soft-delete feature

## Production Considerations

1. **Enable soft-delete**: All production Key Vaults should have soft-delete enabled
2. **Set expiry dates**: Always set expiration dates on secrets for compliance
3. **Monitor expiry warnings**: Set up alerts for secrets expiring soon
4. **Automate rotation**: Implement automated secret rotation policies
5. **Cache invalidation**: Consider TTL-based cache invalidation for long-running apps
6. **Retry logic**: Add retry policies for transient failures (built into Azure SDK)

## License

MIT
