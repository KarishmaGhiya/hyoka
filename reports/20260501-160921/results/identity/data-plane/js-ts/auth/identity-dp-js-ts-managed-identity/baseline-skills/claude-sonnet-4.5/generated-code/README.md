# Azure Managed Identity Examples for Node.js/TypeScript

Complete examples demonstrating how to use Managed Identity to authenticate Azure SDK clients in Node.js applications.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Choose Your Scenario

#### System-Assigned Managed Identity (Simplest)

```typescript
import { ManagedIdentityCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

const credential = new ManagedIdentityCredential();
const client = new SecretClient('https://my-vault.vault.azure.net', credential);
const secret = await client.getSecret('my-secret');
```

#### User-Assigned Managed Identity

```typescript
import { ManagedIdentityCredential } from '@azure/identity';

const credential = new ManagedIdentityCredential({
  clientId: '12345678-1234-1234-1234-123456789abc'
});
```

#### DefaultAzureCredential (Recommended - Works Everywhere)

```typescript
import { DefaultAzureCredential } from '@azure/identity';

// Works in Azure (with managed identity) AND locally (with Azure CLI)
const credential = new DefaultAzureCredential();
```

## Files Included

- **`managed-identity-examples.ts`** - Complete TypeScript examples with all scenarios
- **`MANAGED_IDENTITY_GUIDE.md`** - Comprehensive guide with best practices and troubleshooting
- **`package.json`** - Project dependencies
- **`tsconfig.json`** - TypeScript configuration

## Key Concepts

### System-Assigned vs User-Assigned

| Feature | System-Assigned | User-Assigned |
|---------|----------------|---------------|
| Lifecycle | Tied to resource | Independent |
| Sharing | One resource only | Multiple resources |
| Configuration | Automatic | Requires client ID |
| Use Case | Simple scenarios | Complex architectures |

### Local Development

For local development, use one of these approaches:

1. **Azure CLI** (Easiest)
   ```bash
   az login
   # Your code with DefaultAzureCredential will work automatically!
   ```

2. **Environment Variables** (Service Principal)
   ```bash
   export AZURE_TENANT_ID="..."
   export AZURE_CLIENT_ID="..."
   export AZURE_CLIENT_SECRET="..."
   ```

3. **Explicit Fallback** (ChainedTokenCredential)
   ```typescript
   const credential = new ChainedTokenCredential(
     new ManagedIdentityCredential(),
     new AzureCliCredential()
   );
   ```

## Common Issues

### ❌ "IDENTITY_ENDPOINT not found"
**Solution:** Enable Managed Identity on your Azure resource (App Service, VM, etc.)

### ❌ 403 Forbidden
**Solution:** Grant RBAC permissions to the managed identity

```bash
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee <managed-identity-object-id> \
  --scope <resource-id>
```

### ❌ "Multiple user assigned identities exist"
**Solution:** Specify which identity to use:

```typescript
const credential = new ManagedIdentityCredential({
  clientId: process.env.AZURE_CLIENT_ID
});
```

## Environment Variables

### Production (Azure)
```bash
# Optional: specify user-assigned identity
AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
```

### Local Development
```bash
# Option 1: Use az login (recommended)
# No env vars needed!

# Option 2: Service Principal
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

## Best Practices

✅ Use `DefaultAzureCredential` for most scenarios  
✅ Store configuration in environment variables  
✅ Implement proper error handling  
✅ Use retry logic for transient failures  
✅ Prefer system-assigned for simple scenarios  
✅ Use user-assigned for complex architectures  
✅ Validate credentials during startup  

❌ Don't hardcode credentials  
❌ Don't ignore error types (403 vs 404 vs network errors)  
❌ Don't retry authentication errors (401, 403)  

## Running the Examples

```bash
# Development mode
npm run dev

# Build and run
npm run build
npm start
```

## Supported Azure Services

The examples demonstrate integration with:
- ✅ Azure Key Vault
- ✅ Azure Blob Storage
- ✅ Azure Queue Storage

The same patterns work with ALL Azure SDKs:
- Azure Cosmos DB
- Azure Service Bus
- Azure Event Hubs
- Azure SQL Database
- And more...

## Further Reading

See **`MANAGED_IDENTITY_GUIDE.md`** for:
- Detailed explanations
- Troubleshooting guide
- Advanced scenarios
- Production-ready patterns
- Complete error handling examples

## License

MIT
