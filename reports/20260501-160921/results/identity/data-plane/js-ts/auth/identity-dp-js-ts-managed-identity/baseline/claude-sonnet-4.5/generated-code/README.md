# Azure Managed Identity Authentication Guide

Complete guide for using Managed Identity with Azure SDK clients in Node.js/TypeScript.

## Quick Start

### 1. Install Dependencies

```bash
npm install @azure/identity @azure/storage-blob @azure/keyvault-secrets
```

### 2. System-Assigned Managed Identity (Simplest)

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

const credential = new ManagedIdentityCredential();
const client = new BlobServiceClient(
  "https://mystorageaccount.blob.core.windows.net",
  credential
);
```

### 3. User-Assigned Managed Identity

```typescript
const credential = new ManagedIdentityCredential({
  clientId: "12345678-1234-1234-1234-123456789012"
});
```

### 4. DefaultAzureCredential (Recommended)

Works both in Azure and locally for development:

```typescript
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();
// Works in Azure with Managed Identity
// Works locally with Azure CLI (az login)
```

## Key Differences

### System-Assigned vs User-Assigned

| Feature | System-Assigned | User-Assigned |
|---------|----------------|---------------|
| **Lifecycle** | Tied to resource | Independent resource |
| **Scope** | Single resource | Multiple resources |
| **Use Case** | Single app needs access | Shared identity across apps |
| **Setup** | Enable on resource | Create identity, then assign |
| **Code** | `new ManagedIdentityCredential()` | `new ManagedIdentityCredential({ clientId })` |

## Local Development

### Option 1: Azure CLI (Recommended)

```bash
az login
```

Then use `DefaultAzureCredential` - it will automatically use your Azure CLI credentials locally.

### Option 2: Environment Variables

```bash
export AZURE_TENANT_ID="..."
export AZURE_CLIENT_ID="..."
export AZURE_CLIENT_SECRET="..."
```

### Option 3: Explicit Fallback

```typescript
import { ManagedIdentityCredential, AzureCliCredential, ChainedTokenCredential } from "@azure/identity";

const credential = new ChainedTokenCredential(
  new ManagedIdentityCredential(), // Azure
  new AzureCliCredential()         // Local
);
```

## Common Pitfalls

### 1. Missing Role Assignments

**Error:** 403 Forbidden

**Solution:** Assign RBAC roles to the managed identity:

```bash
# Storage
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee <identity-client-id> \
  --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<account>

# Key Vault
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee <identity-client-id> \
  --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault>
```

### 2. Multiple User-Assigned Identities

**Error:** "Multiple user assigned identities exist, please specify the identity"

**Solution:** Specify the client ID:

```typescript
const credential = new ManagedIdentityCredential({
  clientId: process.env.MANAGED_IDENTITY_CLIENT_ID
});
```

### 3. Not Available Locally

**Error:** "ManagedIdentityCredential authentication failed"

**Solution:** Use `DefaultAzureCredential` instead:

```typescript
const credential = new DefaultAzureCredential();
```

### 4. Wrong Scope

Each Azure service requires a specific scope:

```typescript
// Storage
const scope = "https://storage.azure.com/.default";

// Key Vault
const scope = "https://vault.azure.net/.default";

// Azure Resource Manager
const scope = "https://management.azure.com/.default";
```

## Enable Managed Identity

### App Service / Function App

```bash
az webapp identity assign \
  --name <app-name> \
  --resource-group <resource-group>
```

Or in Azure Portal: **App Service → Identity → System assigned → Status: On**

### Virtual Machine

```bash
az vm identity assign \
  --name <vm-name> \
  --resource-group <resource-group>
```

### User-Assigned Identity

```bash
# Create identity
az identity create \
  --name <identity-name> \
  --resource-group <resource-group>

# Assign to App Service
az webapp identity assign \
  --name <app-name> \
  --resource-group <resource-group> \
  --identities <identity-resource-id>
```

## Complete Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";

export class AzureServices {
  private credential = new DefaultAzureCredential();

  async uploadToBlob(content: string) {
    const client = new BlobServiceClient(
      "https://mystorageaccount.blob.core.windows.net",
      this.credential
    );
    
    const container = client.getContainerClient("data");
    await container.createIfNotExists();
    
    const blob = container.getBlockBlobClient("file.txt");
    await blob.upload(content, content.length);
  }

  async getSecret(name: string): Promise<string> {
    const client = new SecretClient(
      "https://myvault.vault.azure.net",
      this.credential
    );
    
    const secret = await client.getSecret(name);
    return secret.value || "";
  }
}
```

## Troubleshooting

### Check if Managed Identity is enabled

```bash
# App Service
az webapp identity show --name <app-name> --resource-group <rg>

# VM
az vm identity show --name <vm-name> --resource-group <rg>
```

### Test locally with Azure CLI

```bash
az login
az account show

# Verify you have access
az storage blob list --account-name mystorageaccount --container-name data --auth-mode login
```

### View role assignments

```bash
az role assignment list --assignee <identity-client-id>
```

## Best Practices

1. **Use `DefaultAzureCredential`** - Works everywhere (Azure + local)
2. **Assign minimal roles** - Only give permissions needed
3. **Handle errors** - Check for 401/403 and log useful messages
4. **Use User-Assigned MI** - When sharing identity across resources
5. **Test locally** - Use Azure CLI to simulate Managed Identity locally
6. **Environment variables** - Store client IDs in config, not code
7. **Monitor** - Enable diagnostic logs for authentication issues

## Resources

- [Azure Identity SDK Docs](https://learn.microsoft.com/en-us/javascript/api/@azure/identity)
- [Managed Identity Overview](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview)
- [DefaultAzureCredential](https://learn.microsoft.com/en-us/javascript/api/@azure/identity/defaultazurecredential)
