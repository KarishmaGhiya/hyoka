# Azure Managed Identity with Node.js/TypeScript

Comprehensive guide and examples for using Azure Managed Identity to authenticate Azure SDK clients in Node.js applications.

## 📋 Table of Contents

1. [System-Assigned vs User-Assigned Identity](#identity-types)
2. [Creating Credentials](#creating-credentials)
3. [Using with Azure SDK Clients](#using-with-sdk)
4. [Local Development Fallback](#local-development)
5. [Common Pitfalls](#common-pitfalls)
6. [Complete Example](#complete-example)

## 🔐 Identity Types

### System-Assigned Identity
- **Lifecycle**: Tied to your Azure resource (VM, App Service, etc.)
- **Creation**: Automatically created/deleted with the resource
- **Use case**: Single resource needs access to Azure services
- **Example**: `system-assigned-identity.ts`

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// No parameters needed - uses system-assigned identity
const credential = new ManagedIdentityCredential();
```

### User-Assigned Identity
- **Lifecycle**: Standalone Azure resource, independent lifecycle
- **Creation**: Created separately, can be assigned to multiple resources
- **Use case**: Multiple resources sharing the same identity, or need identity lifecycle control
- **Example**: `user-assigned-identity.ts`

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// Requires client ID of the user-assigned identity
const credential = new ManagedIdentityCredential({ 
  clientId: "12345678-1234-1234-1234-123456789abc" 
});
```

## 🛠️ Creating Credentials

### System-Assigned
```typescript
// Simple - no parameters
const credential = new ManagedIdentityCredential();
```

### User-Assigned (by Client ID)
```typescript
const credential = new ManagedIdentityCredential({ 
  clientId: process.env.AZURE_CLIENT_ID 
});
```

### User-Assigned (by Resource ID)
```typescript
const credential = new ManagedIdentityCredential({ 
  resourceId: "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}"
});
```

### Best Practice: DefaultAzureCredential
```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Works everywhere: Azure (Managed Identity), Local (Azure CLI), CI/CD (Service Principal)
const credential = new DefaultAzureCredential({
  managedIdentityClientId: process.env.AZURE_CLIENT_ID // optional for user-assigned
});
```

## 🔌 Using with Azure SDK Clients

### Blob Storage
```typescript
import { BlobServiceClient } from "@azure/storage-blob";

const credential = new ManagedIdentityCredential();
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  credential
);

// Use the client
const containers = blobServiceClient.listContainers();
for await (const container of containers) {
  console.log(container.name);
}
```

### Key Vault
```typescript
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new ManagedIdentityCredential();
const secretClient = new SecretClient(
  "https://mykeyvault.vault.azure.net",
  credential
);

const secret = await secretClient.getSecret("my-secret");
console.log(secret.value);
```

### Cosmos DB
```typescript
import { CosmosClient } from "@azure/cosmos";

const credential = new ManagedIdentityCredential();
const cosmosClient = new CosmosClient({ 
  endpoint: "https://mycosmosdb.documents.azure.com:443/",
  aadCredentials: credential 
});
```

See `complete-example.ts` for a full production-ready implementation.

## 💻 Local Development Fallback

Managed Identity only works in Azure. For local development:

### Option 1: DefaultAzureCredential (Recommended)
```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Automatically falls back to Azure CLI, Environment Variables, etc.
const credential = new DefaultAzureCredential();
```

**Credential chain order:**
1. Environment variables (service principal)
2. Workload Identity (Kubernetes)
3. **Managed Identity** (Azure)
4. **Azure CLI** (local dev)
5. Azure PowerShell
6. Azure Developer CLI

### Option 2: Azure CLI
```bash
# One-time setup
az login
az account set --subscription "your-subscription"

# Your app automatically uses these credentials locally
```

### Option 3: Custom Chain
```typescript
import { ChainedTokenCredential, ManagedIdentityCredential, AzureCliCredential } from "@azure/identity";

const credential = new ChainedTokenCredential(
  new ManagedIdentityCredential({ clientId: process.env.AZURE_CLIENT_ID }),
  new AzureCliCredential()
);
```

### Option 4: Environment-Based Selection
```typescript
const isAzure = process.env.WEBSITE_INSTANCE_ID || process.env.IDENTITY_ENDPOINT;

const credential = isAzure
  ? new ManagedIdentityCredential()
  : new AzureCliCredential();
```

See `local-development-fallback.ts` for all strategies.

## ⚠️ Common Pitfalls

### 1. Identity Not Enabled
**Error:** "No Managed Identity endpoint found"

**Solution:**
```bash
# Enable system-assigned identity
az vm identity assign --name myVM --resource-group myRG
az webapp identity assign --name myApp --resource-group myRG
```

### 2. Missing RBAC Permissions
**Error:** 403 Forbidden

**Solution:**
```bash
# Get identity principal ID
principalId=$(az vm identity show --name myVM --resource-group myRG --query principalId -o tsv)

# Assign role
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $principalId \
  --scope /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/{vault}
```

**Common roles:**
- `Storage Blob Data Contributor`
- `Storage Queue Data Contributor`
- `Key Vault Secrets User`
- `Cosmos DB Account Reader Role`

### 3. Wrong Client ID
**Error:** "The requested identity has not been assigned"

**Solution:**
1. Verify client ID: Azure Portal → Managed Identities → Your Identity → Properties
2. Assign to resource: Azure Portal → Your Resource → Identity → User assigned → Add

### 4. No Retry Logic
**Solution:** Implement retries for transient errors (429, 503, 504)

```typescript
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    return await operation();
  } catch (error) {
    if (isTransient(error) && attempt < maxRetries) {
      await delay(retryDelayMs * attempt);
    } else {
      throw error;
    }
  }
}
```

### 5. Hardcoded Resource URLs
**Solution:** Use environment variables

```typescript
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const keyVaultName = process.env.AZURE_KEYVAULT_NAME;
```

See `common-pitfalls.ts` for detailed error handling.

## 🚀 Complete Example

See `complete-example.ts` for a production-ready application that:
- ✅ Uses DefaultAzureCredential for flexibility
- ✅ Validates authentication and permissions
- ✅ Handles errors gracefully
- ✅ Supports both identity types
- ✅ Uses environment variables for configuration
- ✅ Includes comprehensive logging

### Running the Example

```bash
# Install dependencies
npm install

# Set environment variables
export AZURE_STORAGE_ACCOUNT_NAME="mystorageaccount"
export AZURE_KEYVAULT_NAME="mykeyvault"
export AZURE_QUEUE_NAME="tasks"
export AZURE_CLIENT_ID="..." # Optional for user-assigned identity

# Run
npm start

# Test authentication
npm run test-auth
```

## 📦 Dependencies

```json
{
  "dependencies": {
    "@azure/identity": "^4.0.0",
    "@azure/storage-blob": "^12.17.0",
    "@azure/storage-queue": "^12.16.0",
    "@azure/keyvault-secrets": "^4.8.0",
    "@azure/cosmos": "^4.0.0"
  }
}
```

## 🎯 Best Practices

1. ✅ **Use `DefaultAzureCredential`** - Works everywhere (Azure, local, CI/CD)
2. ✅ **System-assigned when possible** - Simpler lifecycle management
3. ✅ **Least privilege** - Grant only necessary RBAC permissions
4. ✅ **Handle errors gracefully** - Implement retry logic
5. ✅ **Test thoroughly** - Local → Staging → Production
6. ✅ **Use environment variables** - Never hardcode resource names
7. ✅ **Monitor authentication** - Track failures with Application Insights
8. ✅ **Document permissions** - Document required roles and assignments

## 📚 Files in This Repository

- `system-assigned-identity.ts` - Examples using system-assigned identity
- `user-assigned-identity.ts` - Examples using user-assigned identity
- `local-development-fallback.ts` - Strategies for local development
- `common-pitfalls.ts` - Error handling and troubleshooting
- `complete-example.ts` - Production-ready full application
- `package.json` - Dependencies and scripts
- `README.md` - This file

## 🔗 Resources

- [Azure Identity SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/identity/identity)
- [Managed identities for Azure resources](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)
- [DefaultAzureCredential documentation](https://docs.microsoft.com/javascript/api/@azure/identity/defaultazurecredential)
- [Azure RBAC roles](https://docs.microsoft.com/azure/role-based-access-control/built-in-roles)

## 💡 Quick Start

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

// Works in Azure AND locally (with az login)
const credential = new DefaultAzureCredential();

const blobServiceClient = new BlobServiceClient(
  `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  credential
);

// Use the client!
const containers = blobServiceClient.listContainers();
for await (const container of containers) {
  console.log(container.name);
}
```

That's it! The credential automatically:
- Uses Managed Identity in Azure
- Uses Azure CLI when running locally
- Uses Service Principal in CI/CD

---

For questions or issues, refer to the detailed examples in each file.
