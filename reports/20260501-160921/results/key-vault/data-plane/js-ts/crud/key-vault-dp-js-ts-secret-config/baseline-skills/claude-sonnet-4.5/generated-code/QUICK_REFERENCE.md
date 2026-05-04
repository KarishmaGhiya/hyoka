# Azure Key Vault Configuration Provider - Quick Reference

## Project Structure

```
├── src/
│   ├── SecretProvider.ts           # Core Key Vault secret operations
│   ├── CachingSecretProvider.ts    # In-memory caching with expiry management
│   ├── ConfigurationModule.ts      # Main configuration interface
│   ├── SecretRotationHelper.ts     # Secret rotation and lifecycle
│   └── index.ts                    # Demo application
├── dist/                           # Compiled JavaScript output
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # Full documentation

## Key Features

### 1. SecretProvider
- ✓ Get secrets by name with graceful error handling
- ✓ Retrieve specific secret versions
- ✓ Inspect secret metadata (expiry, created, updated dates)
- ✓ Check if secrets are expiring within a warning window
- ✓ List all versions of a secret

### 2. CachingSecretProvider
- ✓ In-memory caching of secret values
- ✓ Bulk-load secrets at startup
- ✓ On-demand refresh of individual secrets
- ✓ Automatic re-fetch of secrets nearing expiry
- ✓ Configurable expiry warning window (default: 7 days)

### 3. ConfigurationModule
- ✓ Singleton pattern for application-wide access
- ✓ Managed identity authentication using DefaultAzureCredential
- ✓ Works in Azure (managed identity) and locally (Azure CLI)
- ✓ Simple get/refresh API for configuration values
- ✓ Check for expiring secrets across all cached values

### 4. SecretRotationHelper
- ✓ Create new secret versions with updated values
- ✓ Set expiry dates and metadata on new versions
- ✓ Long-running delete operation with polling
- ✓ Safe purge of soft-deleted secrets
- ✓ Complete rotation with cleanup workflow

## Usage Examples

### Basic Setup

```typescript
import { ConfigurationModule } from "./ConfigurationModule";

// Set environment variable first
// process.env.AZURE_KEYVAULT_URL = "https://your-vault.vault.azure.net";

const config = ConfigurationModule.getInstance({
  expiryWarningDays: 7
});

// Bulk-load required secrets
await config.initialize([
  "DatabaseConnectionString",
  "ApiKey",
  "EncryptionKey"
]);
```

### Read Configuration

```typescript
// Get from cache (or fetch if not cached)
const apiKey = await config.get("ApiKey", "default-value");

// Force refresh from Key Vault
const refreshed = await config.refresh("ApiKey");
```

### Check Expiring Secrets

```typescript
const expiring = await config.checkExpiring();
if (expiring.length > 0) {
  console.warn("Secrets expiring soon:", expiring);
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
  { 
    expiryDays: 90,
    tags: { rotated: "true" }
  }
);
```

### Delete and Purge (Cleanup)

```typescript
// Step 1: Soft delete (long-running operation)
await rotationHelper.deleteSecretVersion("MySecret");

// Step 2: Wait for propagation
await sleep(5000);

// Step 3: Permanent purge
await rotationHelper.purgeDeletedSecret("MySecret");
```

## Authentication

Uses **DefaultAzureCredential** which tries:
1. Environment variables (service principal)
2. Workload Identity (Kubernetes)
3. **Managed Identity (Azure resources)** ← Primary for production
4. Visual Studio Code
5. **Azure CLI** ← Primary for local development
6. Azure PowerShell
7. Azure Developer CLI

## Required Permissions

Your identity needs these Key Vault permissions:
- **Get** - Read secret values
- **List** - List secret versions
- **Set** - Create/update secrets
- **Delete** - Soft-delete secrets
- **Purge** - Permanently delete secrets

Assign via Azure RBAC: **Key Vault Secrets Officer** role

## Running the Demo

```bash
# Set environment variable
export AZURE_KEYVAULT_URL="https://your-vault.vault.azure.net"

# Run the demo
npm start

# Or for development
npm run dev
```

## Demo Flow

1. ✓ Initialize configuration with managed identity
2. ✓ Bulk-load 3 config keys into cache
3. ✓ Read cached values (masked output)
4. ✓ Refresh individual key
5. ✓ Check for expiring secrets
6. ✓ Create test secret with expiry
7. ✓ Rotate secret to new version
8. ✓ Delete secret (long-running operation)
9. ✓ Purge deleted secret (permanent)

## Security Best Practices

✓ No secrets in code (managed identity)
✓ Secrets cached only in memory
✓ Expiry dates enforced
✓ Version-based rotation
✓ Safe soft-delete handling
✓ Environment-based configuration

## Dependencies

```json
{
  "@azure/identity": "^4.0.0",          // Authentication
  "@azure/keyvault-secrets": "^4.8.0",  // Key Vault SDK
  "typescript": "^5.3.0",               // TypeScript compiler
  "ts-node": "^10.9.0"                  // Development runtime
}
```

## Common Errors

### Missing Vault URL
```
Error: Vault URL must be provided via AZURE_KEYVAULT_URL environment variable
```
**Fix**: Set `AZURE_KEYVAULT_URL` environment variable

### Authentication Failed (401/403)
```
Authentication Error: Ensure your managed identity has proper Key Vault permissions
```
**Fix**: Assign Key Vault Secrets Officer role to your managed identity

### Secret Not Found (404)
```
Secret 'XYZ' not found. Using default value.
```
**Info**: Gracefully handled, returns default value if provided

## Key Concepts

### Soft Delete
When you delete a secret, it enters a soft-deleted state where it can be:
- **Recovered** - Restored to active state
- **Purged** - Permanently deleted (irreversible)

Soft-deleted secrets have a retention period (default: 90 days).

### Secret Versions
Each time you update a secret, Key Vault creates a new version:
- You can retrieve any version by its ID
- Latest version is used by default
- Old versions remain accessible unless deleted

### Expiry Management
- Set `expiresOn` when creating/rotating secrets
- Cache automatically refreshes secrets nearing expiry
- Configurable warning window (default: 7 days)

## Next Steps

1. **Set up Key Vault**: Create an Azure Key Vault instance
2. **Configure Identity**: Enable managed identity on your Azure resource
3. **Assign Permissions**: Grant Key Vault Secrets Officer role
4. **Add Secrets**: Create test secrets in your vault
5. **Run Demo**: Test the full flow with your vault

## Troubleshooting

**Q: How do I authenticate locally?**
A: Run `az login` to authenticate with Azure CLI

**Q: Can I use this in non-Azure environments?**
A: Yes, but you'll need to provide credentials via environment variables

**Q: How long does delete take?**
A: Delete is asynchronous, typically 5-30 seconds

**Q: Can I recover a purged secret?**
A: No, purging is permanent and irreversible

**Q: How do I know which version is current?**
A: Call `getSecret()` without version parameter for latest
