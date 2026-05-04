# Quick Start Guide

Get up and running with the Azure Key Vault Configuration Provider in 5 minutes.

## Prerequisites

- Node.js 18+
- Azure Key Vault instance
- Managed Identity or Azure CLI authentication

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Environment Variable

### Windows (PowerShell)
```powershell
$env:KEY_VAULT_URL="https://your-vault-name.vault.azure.net"
```

### Linux/macOS
```bash
export KEY_VAULT_URL="https://your-vault-name.vault.azure.net"
```

## Step 3: Create Test Secrets (Optional)

```bash
# Using Azure CLI
az keyvault secret set --vault-name your-vault-name \
  --name database-connection-string \
  --value "Server=tcp:myserver.database.windows.net;Database=mydb"

az keyvault secret set --vault-name your-vault-name \
  --name api-key \
  --value "test-api-key-12345"

az keyvault secret set --vault-name your-vault-name \
  --name encryption-key \
  --value "test-encryption-key-67890"

az keyvault secret set --vault-name your-vault-name \
  --name smtp-password \
  --value "test-smtp-password"
```

## Step 4: Run the Demo

```bash
npm run dev
```

Expected output:
```
🚀 Azure Key Vault Configuration Provider Demo

============================================================

📦 Step 1: Initialize Configuration Module
------------------------------------------------------------
✅ Configuration module initialized with vault: https://...

📦 Step 2: Bulk Load Configuration Keys
------------------------------------------------------------
🔄 Bulk loading 4 secrets...
✅ Loaded 4 secrets successfully

📦 Step 3: Read Secrets from Cache
------------------------------------------------------------
✅ database-connection-string: Serv***
✅ api-key: test***
✅ encryption-key: test***
✅ smtp-password: test***

... (continued)
```

## Step 5: Use in Your Application

```typescript
import { ConfigurationModule } from "./ConfigurationModule.js";

// Initialize
const config = new ConfigurationModule({ expiryWarningDays: 7 });
const cache = config.getCachedProvider();

// Load secrets at startup
await cache.bulkLoad([
  "database-connection-string",
  "api-key"
]);

// Use secrets (from cache)
const dbConnection = await cache.get("database-connection-string");
const apiKey = await cache.get("api-key");

console.log("Connected to database");
```

## Local Development (No Managed Identity)

If running locally without managed identity, modify `ConfigurationModule.ts`:

```typescript
// Change line 25 from:
const credential = new ManagedIdentityCredential();

// To:
import { DefaultAzureCredential } from "@azure/identity";
const credential = new DefaultAzureCredential();
```

Then authenticate with Azure CLI:
```bash
az login
```

## Common Issues

### "KEY_VAULT_URL environment variable is required"
**Fix**: Set the environment variable with your vault URL

### "Authentication failed"
**Fix**: 
- For Managed Identity: Ensure it's enabled and has Key Vault access
- For local dev: Run `az login` and ensure you have permissions

### "Caller is not authorized"
**Fix**: Grant Key Vault RBAC permissions:
```bash
az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee <user-or-identity-object-id> \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault-name>
```

## Next Steps

1. Read [USAGE.md](./USAGE.md) for detailed usage patterns
2. Review [STRUCTURE.md](./STRUCTURE.md) for architecture details
3. Check [src/examples.ts](./src/examples.ts) for code examples
4. Explore the [demo application](./src/index.ts)

## Key Features to Try

- ✅ Bulk loading secrets at startup
- ✅ Caching for performance
- ✅ Expiry monitoring and warnings
- ✅ Secret rotation with versioning
- ✅ Safe delete and purge operations
- ✅ Graceful error handling with defaults

## Production Checklist

Before deploying to production:

- [ ] Enable Managed Identity on your Azure resource
- [ ] Grant appropriate RBAC permissions
- [ ] Enable soft-delete on Key Vault (should be default)
- [ ] Consider enabling purge protection
- [ ] Set expiration dates on all secrets
- [ ] Set up monitoring/alerting for expiring secrets
- [ ] Test secret rotation workflow
- [ ] Never log secret values

## Support

For issues or questions:
- Check the [README.md](./README.md) for full documentation
- Review error messages for troubleshooting hints
- Consult Azure Key Vault documentation

Happy coding! 🚀
