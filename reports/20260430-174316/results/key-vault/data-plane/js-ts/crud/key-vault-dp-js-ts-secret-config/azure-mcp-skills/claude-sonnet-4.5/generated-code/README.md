# Azure Key Vault Configuration Provider

A TypeScript Node.js application that implements a robust configuration provider backed by Azure Key Vault with caching, secret rotation, and managed identity authentication.

## Features

- **Secret Provider**: Retrieve secrets by name with graceful error handling, version support, and expiry inspection
- **Caching Layer**: In-memory caching with bulk loading, on-demand refresh, and automatic expiry detection
- **Managed Identity**: Secure authentication using Azure Managed Identity (no secrets in code)
- **Secret Rotation**: Safe rotation with multi-version support, delete, and purge operations
- **Expiry Monitoring**: Automatic detection of secrets expiring within a configurable window

## Prerequisites

- Node.js 18+ and npm
- Azure subscription with a Key Vault
- Azure CLI installed (for local development)
- Managed Identity enabled (when running in Azure)

## Installation

```bash
npm install
```

## Configuration

Set the Key Vault URL as an environment variable:

```bash
# Linux/macOS
export KEY_VAULT_URL="https://your-vault-name.vault.azure.net/"

# Windows PowerShell
$env:KEY_VAULT_URL="https://your-vault-name.vault.azure.net/"

# Windows CMD
set KEY_VAULT_URL=https://your-vault-name.vault.azure.net/
```

## Authentication

### Local Development
Run `az login` to authenticate with your Azure account. Ensure your account has proper Key Vault permissions (Get, List, Set, Delete, Purge secrets).

### Azure Environment
Enable Managed Identity on your Azure resource (App Service, VM, Container Instance, etc.) and grant it Key Vault permissions through Access Policies or RBAC.

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

### Code Example

```typescript
import { Configuration } from './Configuration';
import { SecretRotationHelper } from './SecretRotationHelper';

const config = new Configuration(process.env.KEY_VAULT_URL, 7);

// Bulk load secrets at startup
await config.initialize(['database-url', 'api-key']);

// Get from cache
const cache = config.getCache();
const apiKey = await cache.get('api-key');

// Check for expiring secrets
const expiring = cache.getExpiringSecrets();

// Rotate a secret
const rotationHelper = new SecretRotationHelper(config.getClient());
await rotationHelper.rotateSecret('api-key', 'new-value', {
  expiresOn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
});
```

## Project Structure

```
src/
├── Configuration.ts          # Main configuration module with managed identity
├── SecretProvider.ts         # Core provider for Key Vault operations
├── SecretCache.ts            # Caching layer with expiry detection
├── SecretRotationHelper.ts   # Secret rotation and cleanup utilities
└── index.ts                  # Demo application
```

## Key Vault Permissions Required

- **Get** - Retrieve secret values
- **List** - List secret versions
- **Set** - Create/update secrets (for rotation)
- **Delete** - Soft-delete secrets
- **Purge** - Permanently remove soft-deleted secrets

## Architecture

1. **SecretProvider**: Low-level interface to Key Vault with error handling
2. **SecretCache**: Manages in-memory cache with refresh logic
3. **Configuration**: Orchestrates provider, cache, and authentication
4. **SecretRotationHelper**: Handles safe multi-version rotation and cleanup

## Security Notes

- Uses Azure Managed Identity (no credentials in code)
- Supports Key Vault's soft-delete and purge protection
- Handles long-running delete operations properly
- Masks sensitive values in demo output

## License

MIT
