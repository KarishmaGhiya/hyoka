# Azure Managed Identity Authentication Demo

A comprehensive TypeScript demonstration of Azure Managed Identity authentication patterns using the Azure Identity SDK.

## Features

This demo showcases:

1. **System-Assigned Managed Identity** - Authenticate using the identity automatically assigned to Azure resources
2. **User-Assigned Managed Identity** - Authenticate using a specific user-assigned identity with client ID
3. **ChainedTokenCredential** - Fall back from Managed Identity to Azure CLI for seamless local development
4. **Azure SDK Integration** - Use credentials with Azure SDK clients (Blob Storage example)
5. **Error Handling** - Proper handling of `CredentialUnavailableError` and other exceptions

## Prerequisites

- Node.js 18+ and npm
- Azure CLI installed (for local development)
- An Azure Storage account (for the SDK demo)
- Managed Identity enabled on your Azure resource (for production)

## Installation

```bash
npm install
```

## Configuration

### Environment Variables (Optional)

```bash
# For user-assigned identity demo
export AZURE_USER_ASSIGNED_CLIENT_ID="your-client-id"

# For Azure SDK client demo
export AZURE_STORAGE_ACCOUNT_URL="https://yourstorageaccount.blob.core.windows.net"
```

### Local Development Setup

Authenticate with Azure CLI for local development:

```bash
az login
```

### Azure Environment Setup

1. Enable managed identity on your Azure resource (VM, App Service, Function App, etc.):
   ```bash
   # System-assigned identity
   az vm identity assign --name myVM --resource-group myRG
   
   # User-assigned identity
   az vm identity assign --name myVM --resource-group myRG \
     --identities /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}
   ```

2. Grant RBAC permissions to the managed identity:
   ```bash
   # Example: Grant Storage Blob Data Reader role
   az role assignment create \
     --role "Storage Blob Data Reader" \
     --assignee-object-id <managed-identity-principal-id> \
     --scope /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{account}
   ```

## Usage

### Development Mode (with ts-node)

```bash
npm run dev
```

### Build and Run

```bash
npm run build
npm start
```

## How It Works

### System-Assigned Managed Identity

```typescript
const credential = new ManagedIdentityCredential();
```

Uses the system-assigned identity attached to the Azure resource.

### User-Assigned Managed Identity

```typescript
const credential = new ManagedIdentityCredential({
  clientId: "your-client-id"
});
```

Uses a specific user-assigned identity by client ID.

### ChainedTokenCredential (Production + Local Dev)

```typescript
const credential = new ChainedTokenCredential(
  new ManagedIdentityCredential(),    // Try managed identity first (Azure)
  new AzureCliCredential()             // Fall back to CLI (local dev)
);
```

This pattern allows the same code to work in:
- **Azure environments**: Uses Managed Identity automatically
- **Local development**: Falls back to Azure CLI credentials

### Using with Azure SDK Clients

```typescript
const blobServiceClient = new BlobServiceClient(
  "https://mystorageaccount.blob.core.windows.net",
  credential
);

// Perform operations
for await (const container of blobServiceClient.listContainers()) {
  console.log(container.name);
}
```

## Error Handling

The demo includes comprehensive error handling:

```typescript
try {
  const token = await credential.getToken(scope);
  // Use token
} catch (error) {
  if (error instanceof CredentialUnavailableError) {
    // Managed identity not available
    // Fall back or provide user guidance
  } else {
    // Other errors (network, permissions, etc.)
  }
}
```

## Common Issues

### CredentialUnavailableError

**Cause**: Not running in an Azure environment with managed identity enabled.

**Solutions**:
- Enable managed identity on your Azure resource
- Use `ChainedTokenCredential` with `AzureCliCredential` for local development
- Run `az login` for local authentication

### 403 Forbidden

**Cause**: The managed identity lacks necessary permissions.

**Solution**: Grant appropriate RBAC roles to the managed identity:
```bash
az role assignment create \
  --role "Storage Blob Data Reader" \
  --assignee-object-id <identity-principal-id> \
  --scope <resource-scope>
```

### IMDS Endpoint Not Accessible

**Cause**: The Azure Instance Metadata Service (IMDS) is not reachable.

**Solutions**:
- Verify managed identity is enabled on the resource
- Check network security groups and firewall rules
- Ensure the resource is running in Azure

## Best Practices

1. **Use ChainedTokenCredential** for applications that run in both Azure and local environments
2. **Never hardcode credentials** - always use managed identity or environment-based authentication
3. **Grant least privilege** - only assign the minimum RBAC roles needed
4. **Handle CredentialUnavailableError** - provide clear error messages and fallback options
5. **Use user-assigned identities** for multi-tenant scenarios or when identity needs to be shared across resources

## Resources

- [Azure Identity SDK Documentation](https://learn.microsoft.com/javascript/api/@azure/identity)
- [Managed Identity Overview](https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)
- [Azure RBAC Documentation](https://learn.microsoft.com/azure/role-based-access-control/)

## License

MIT
