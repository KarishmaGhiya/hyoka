# Azure Key Vault Configuration Provider

A TypeScript Node.js application that implements a robust configuration provider backed by Azure Key Vault with caching, expiry monitoring, and secret rotation capabilities.

## Features

### 🔐 Secret Provider
- Retrieve secrets from Key Vault by name
- Graceful handling of missing secrets (returns default values)
- Retrieve specific versions of secrets
- Inspect secret metadata including expiry dates

### 💾 Caching Layer
- In-memory caching of secret values
- Bulk-loading of predefined config keys at startup
- On-demand refresh of individual keys
- Automatic re-fetch of secrets nearing expiry
- Configurable expiry warning window (default: 7 days)

### 🔒 Managed Identity Authentication
- Secure connection to Azure Key Vault using managed identity
- No client secrets or certificates in code
- Uses `DefaultAzureCredential` from Azure Identity SDK
- Vault URL configured via environment variable

### 🔄 Secret Rotation
- Create new versions of secrets with updated values
- Set expiry dates on new versions
- Safe cleanup with delete-and-purge operations
- Handles long-running delete operations
- Respects Key Vault's soft-delete feature

## Project Structure

```
├── src/
│   ├── SecretProvider.ts          # Core secret retrieval with version support
│   ├── CachedSecretProvider.ts    # Caching layer with expiry checks
│   ├── ConfigurationModule.ts     # Main configuration interface
│   ├── SecretRotationHelper.ts    # Secret rotation and cleanup
│   └── index.ts                   # Demo script
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure your Key Vault URL:
```bash
cp .env.example .env
# Edit .env and set AZURE_KEYVAULT_URL
```

3. Set up authentication:

**For local development:**
```bash
az login
```

**For Azure deployment:**
- Enable Managed Identity on your Azure resource (VM, App Service, Container Instance, etc.)
- Grant the identity "Key Vault Secrets User" role on your Key Vault

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

### Example: Basic Configuration Loading

```typescript
import { ConfigurationModule } from './ConfigurationModule';

const config = new ConfigurationModule({
  cacheOptions: {
    expiryWarningDays: 7,
  },
});

// Load required keys at startup
await config.initialize([
  'DatabaseConnectionString',
  'ApiKey',
  'ServicePassword',
]);

// Get cached values
const apiKey = await config.get('ApiKey');
const dbConn = await config.get('DatabaseConnectionString', 'fallback-value');
```

### Example: Secret Rotation

```typescript
import { SecretRotationHelper } from './SecretRotationHelper';

const rotationHelper = new SecretRotationHelper(secretClient);

// Rotate a secret
const newVersion = await rotationHelper.rotateSecret(
  'MySecret',
  'new-secret-value',
  {
    expiryDays: 90,
    tags: { rotated: 'true' },
  }
);

// Full rotation with cleanup
const { oldVersion, newVersion } = await rotationHelper.safeRotate(
  'MySecret',
  'new-value',
  {
    expiryDays: 90,
    deleteOldVersion: true,
    purgeAfterDelete: true,
  }
);
```

### Example: Checking Expiring Secrets

```typescript
// Check for secrets expiring soon
const expiring = await config.checkExpiry();

if (expiring.size > 0) {
  for (const [name, days] of expiring.entries()) {
    console.warn(`Secret ${name} expires in ${days} days`);
  }
}
```

## API Reference

### ConfigurationModule

Main entry point for configuration management.

```typescript
constructor(options?: ConfigurationModuleOptions)
initialize(requiredKeys: string[]): Promise<void>
get(key: string, defaultValue?: string): Promise<string | undefined>
refresh(key: string): Promise<void>
checkExpiry(): Promise<Map<string, number>>
```

### SecretProvider

Low-level secret retrieval.

```typescript
getSecret(name: string, defaultValue?: string): Promise<string | undefined>
getSecretVersion(name: string, version: string): Promise<string | undefined>
getSecretMetadata(name: string): Promise<SecretMetadata | null>
isSecretExpiringSoon(name: string, warningDays: number): Promise<boolean>
getDaysUntilExpiry(name: string): Promise<number | null>
```

### CachedSecretProvider

Caching layer with automatic refresh.

```typescript
bulkLoad(secretNames: string[]): Promise<Map<string, string | undefined>>
get(name: string, defaultValue?: string): Promise<string | undefined>
refresh(name: string): Promise<string | undefined>
refreshAll(): Promise<void>
checkExpiringSecrets(): Promise<Map<string, number>>
```

### SecretRotationHelper

Secret rotation and lifecycle management.

```typescript
rotateSecret(name: string, newValue: string, options?: RotationOptions): Promise<string>
listSecretVersions(name: string): Promise<string[]>
cleanupSecret(name: string, options?: CleanupOptions): Promise<void>
safeRotate(name: string, newValue: string, options?: RotationOptions & CleanupOptions): Promise<{ oldVersion: string | null; newVersion: string }>
```

## Authentication Methods

The application uses `DefaultAzureCredential` which tries multiple authentication methods in order:

1. **Environment Variables** - Service principal credentials
2. **Managed Identity** - For Azure-hosted applications (recommended for production)
3. **Azure CLI** - For local development (`az login`)
4. **Other methods** - Visual Studio, VS Code, etc.

## Security Best Practices

✅ **DO:**
- Use Managed Identity in production
- Set appropriate RBAC roles (Key Vault Secrets User)
- Enable Key Vault soft-delete and purge protection
- Set expiry dates on secrets
- Monitor expiring secrets
- Use version-specific retrieval for rollback scenarios

❌ **DON'T:**
- Commit secrets to source control
- Use client secrets in application code
- Disable soft-delete in production
- Skip expiry date validation

## Requirements

- Node.js 18+
- TypeScript 5+
- Azure Key Vault instance
- Azure authentication (Managed Identity or Azure CLI)

## Dependencies

- `@azure/keyvault-secrets` - Azure Key Vault SDK
- `@azure/identity` - Azure authentication
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions

## License

MIT
