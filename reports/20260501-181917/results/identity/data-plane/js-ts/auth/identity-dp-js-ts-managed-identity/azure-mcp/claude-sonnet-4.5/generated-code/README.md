# Azure Managed Identity Authentication Demo

This TypeScript program demonstrates how to use Managed Identity to authenticate Azure SDK clients.

## Features

1. **System-assigned Managed Identity**: Authenticates using the VM or App Service's built-in identity
2. **User-assigned Managed Identity**: Authenticates using a specific user-assigned identity (with client ID)
3. **ChainedTokenCredential**: Automatically falls back to Azure CLI credential for local development
4. **Error Handling**: Properly handles `CredentialUnavailableError` when not running in Azure
5. **Practical Example**: Uses Azure Blob Storage client to list containers

## Prerequisites

- Node.js 18+ and npm
- Azure subscription (for deployment)
- Azure CLI (for local development)

## Installation

```bash
npm install
```

## Configuration

Set environment variables:

```bash
# Required: Your Azure Storage Account name
export AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount

# Optional: User-assigned Managed Identity client ID
export AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
```

## Running Locally

For local development, make sure you're logged in with Azure CLI:

```bash
az login
```

Then run the program:

```bash
# Using ts-node
npm run dev

# Or build and run
npm run build
npm start
```

## Running in Azure

Deploy this application to any Azure service that supports Managed Identity:

- **Azure Virtual Machines**: Enable system-assigned or user-assigned managed identity
- **Azure App Service**: Enable managed identity in the Identity blade
- **Azure Functions**: Enable managed identity in the Identity blade
- **Azure Container Instances**: Enable managed identity when creating the container
- **Azure Kubernetes Service**: Use Azure AD pod identity or workload identity

### Enable System-assigned Identity

```bash
# For App Service
az webapp identity assign --name <app-name> --resource-group <resource-group>

# For VM
az vm identity assign --name <vm-name> --resource-group <resource-group>
```

### Grant Storage Access

Grant the managed identity access to your storage account:

```bash
# Get the managed identity principal ID
PRINCIPAL_ID=$(az webapp identity show --name <app-name> --resource-group <resource-group> --query principalId -o tsv)

# Assign Storage Blob Data Reader role
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Storage Blob Data Reader" \
  --scope /subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.Storage/storageAccounts/<storage-account>
```

## How It Works

### System-assigned Managed Identity

```typescript
const credential = new ManagedIdentityCredential();
```

### User-assigned Managed Identity

```typescript
const credential = new ManagedIdentityCredential({ 
  clientId: "00000000-0000-0000-0000-000000000000" 
});
```

### ChainedTokenCredential with Fallback

```typescript
const credential = new ChainedTokenCredential(
  new ManagedIdentityCredential(),
  new AzureCliCredential() // Fallback for local dev
);
```

### Using with Azure SDK Clients

```typescript
const blobServiceClient = new BlobServiceClient(
  `https://${storageAccountName}.blob.core.windows.net`,
  credential
);

for await (const container of blobServiceClient.listContainers()) {
  console.log(container.name);
}
```

## Authentication Flow

1. **In Azure**: Tries system-assigned managed identity → user-assigned (if configured) → fails if unavailable
2. **Locally**: Tries managed identity → falls back to Azure CLI credential
3. **Error Handling**: Catches `CredentialUnavailableError` and provides helpful guidance

## Troubleshooting

### "Managed Identity is not available"

- Ensure managed identity is enabled on your Azure resource
- Verify the identity has the appropriate role assignments
- Check that `AZURE_CLIENT_ID` is correct (for user-assigned identity)

### "Azure CLI credential not available"

Run `az login` to authenticate locally:

```bash
az login
```

### "Access Denied"

The managed identity needs proper RBAC role assignments:

```bash
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Storage Blob Data Reader" \
  --scope <storage-account-resource-id>
```

## Learn More

- [Azure Managed Identity](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/)
- [Azure Identity SDK](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/identity/identity)
- [Azure Storage SDK](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob)
