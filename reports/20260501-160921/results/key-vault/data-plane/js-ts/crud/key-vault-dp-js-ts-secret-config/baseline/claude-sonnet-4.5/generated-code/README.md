# Azure Key Vault Configuration Provider

A TypeScript/Node.js application configuration provider backed by Azure Key Vault with caching, secret rotation, and managed identity support.

## Features

- **Secret Provider**: Retrieve secrets from Azure Key Vault with graceful fallback to default values
- **Version Support**: Get specific versions of secrets
- **Expiry Tracking**: Inspect secret expiry dates and detect expiring secrets
- **Caching Layer**: In-memory caching with bulk-loading and on-demand refresh
- **Auto-Refresh**: Automatically refresh secrets nearing expiry
- **Managed Identity**: Secure authentication using Azure managed identity (DefaultAzureCredential)
- **Secret Rotation**: Safe secret rotation with version management and cleanup
- **Delete & Purge**: Proper handling of Key Vault soft-delete and purge operations

## Prerequisites

- Node.js 18+ and npm
- Azure Key Vault with appropriate permissions
- Azure authentication configured (managed identity, Azure CLI, or environment variables)

## Installation

```bash
npm install
```

## Configuration

Set the Key Vault URL via environment variable:

```bash
export AZURE_KEY_VAULT_URL="https://your-vault-name.vault.azure.net/"
```

## Key Vault Permissions

The application requires the following Key Vault permissions:

- **Get** (secrets)
- **Set** (secrets)
- **Delete** (secrets)
- **Purge** (deleted secrets)
- **List** (secret versions)

Configure via Access Policies or Azure RBAC (Key Vault Secrets Officer role).

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

### Example Code

```typescript
import { ConfigurationModule } from './ConfigurationModule';
import { SecretRotationHelper } from './SecretRotationHelper';

// Initialize with managed identity
const config = new ConfigurationModule(
  'https://your-vault.vault.azure.net/',
  7 // expiry warning window in days
);

// Bulk load required secrets
await config.initialize([
  'database-connection-string',
  'api-key',
  'smtp-password'
]);

// Read from cache
const cachedProvider = config.getCachedProvider();
const apiKey = cachedProvider.getCachedValue('api-key');

// Refresh a specific secret
await cachedProvider.refreshSecret('api-key');

// Check for expiring secrets
const expiring = cachedProvider.getExpiringSoonSecrets();
console.log('Expiring soon:', expiring);

// Rotate a secret
const rotationHelper = new SecretRotationHelper(config.getSecretClient());
const newVersion = await rotationHelper.rotateSecret(
  'my-secret',
  'new-value',
  { expiryDays: 90, cleanupOldVersion: true }
);
```

## Architecture

### SecretProvider
Core provider for Key Vault operations with graceful error handling.

### CachedSecretProvider
Wraps SecretProvider with in-memory caching and expiry management.

### ConfigurationModule
Main entry point that sets up authentication and providers.

### SecretRotationHelper
Handles secret rotation, versioning, and cleanup operations.

## Demo Script

The included demo (`src/index.ts`) demonstrates:

1. Bulk loading configuration keys at startup
2. Reading secrets from cache
3. Refreshing individual secrets
4. Checking for expiring secrets with warnings
5. Creating new secret versions with expiry dates
6. Rotating secrets safely
7. Deleting and purging secrets (with long-running operation handling)

## Authentication Methods

The application uses `DefaultAzureCredential` which tries (in order):

1. Environment variables (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID)
2. Managed Identity (when running in Azure)
3. Azure CLI credentials
4. Azure PowerShell credentials

## License

MIT
