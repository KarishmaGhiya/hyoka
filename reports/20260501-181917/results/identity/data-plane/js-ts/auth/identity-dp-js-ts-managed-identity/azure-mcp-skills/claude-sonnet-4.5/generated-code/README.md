# Azure Managed Identity Authentication Demo

A comprehensive TypeScript demonstration of Azure Managed Identity authentication patterns, including system-assigned, user-assigned, and chained credentials.

## Features

This demo showcases:

1. **System-Assigned Managed Identity** - Simplest authentication method for Azure resources
2. **User-Assigned Managed Identity** - Authentication with specific client ID
3. **ChainedTokenCredential** - Automatic fallback from Managed Identity to Azure CLI for local development
4. **Azure SDK Integration** - Using credentials with Azure Storage Blob client
5. **Error Handling** - Proper handling of `CredentialUnavailableError`

## Prerequisites

- Node.js 18+ and npm
- Azure subscription
- Azure CLI installed (for local development)

## Installation

```bash
npm install
```

## Configuration

Set environment variables for your Azure resources:

```bash
# Optional: User-assigned managed identity client ID
export USER_ASSIGNED_CLIENT_ID="your-client-id"

# Optional: Storage account name for testing
export STORAGE_ACCOUNT_NAME="yourstorageaccount"

# Optional: Additional client IDs (comma-separated)
export ADDITIONAL_CLIENT_IDS="client-id-1,client-id-2"
```

## Running the Demo

### Local Development

First, authenticate with Azure CLI:

```bash
az login
```

Then run the demo:

```bash
# Using ts-node
npm run dev

# Or build and run
npm run build
npm start
```

### In Azure

Deploy this code to any Azure service with managed identity enabled:
- Azure App Service
- Azure Functions
- Azure Container Apps
- Azure Virtual Machines
- Azure Kubernetes Service

The code will automatically detect and use the managed identity.

## Code Structure

```
src/
└── index.ts          # Main demo with all examples
```

## Authentication Flow

### ChainedTokenCredential Flow

```
Try Managed Identity (works in Azure)
    ↓ (if fails)
Fall back to Azure CLI (works locally)
```

This pattern allows the same code to work in both development and production without changes.

## Examples Explained

### Example 1: System-Assigned Identity

```typescript
const credential = new ManagedIdentityCredential();
```

Used when your Azure resource has a single, automatically-created identity.

### Example 2: User-Assigned Identity

```typescript
const credential = new ManagedIdentityCredential({
  clientId: "00000000-0000-0000-0000-000000000000"
});
```

Used when you need to specify which identity to use (multiple identities scenario).

### Example 3: Chained Credential

```typescript
const credential = new ChainedTokenCredential(
  new ManagedIdentityCredential(),
  new AzureCliCredential()
);
```

Best practice for code that runs both locally and in Azure.

### Example 4: Azure SDK Client

```typescript
const blobServiceClient = new BlobServiceClient(
  `https://${storageAccountName}.blob.core.windows.net`,
  credential
);
```

Shows how to use the credential with actual Azure services.

### Example 5: Multiple Identities

Demonstrates iterating through multiple user-assigned identities, useful for multi-tenant scenarios.

## Error Handling

The code properly handles `CredentialUnavailableError`, which occurs when:
- Not running in Azure (no managed identity available)
- Azure CLI is not logged in (no local credentials)
- Managed identity is not enabled on the Azure resource

## When to Use Each Pattern

| Pattern | Use Case |
|---------|----------|
| System-Assigned | Single identity per resource, simplest setup |
| User-Assigned | Multiple resources sharing one identity, explicit identity selection |
| ChainedCredential | Development/production flexibility, automatic fallback |

## Security Best Practices

1. ✅ **Never hardcode credentials** - Use managed identity or environment variables
2. ✅ **Prefer system-assigned identity** - When you only need one identity per resource
3. ✅ **Use ChainedTokenCredential** - For seamless local/cloud development
4. ✅ **Handle CredentialUnavailableError** - Provide clear error messages
5. ✅ **Minimize identity permissions** - Follow principle of least privilege

## Enabling Managed Identity

### Azure App Service / Functions

```bash
# Enable system-assigned identity
az webapp identity assign --name <app-name> --resource-group <rg-name>

# Assign a user-assigned identity
az webapp identity assign --name <app-name> --resource-group <rg-name> \
  --identities <identity-resource-id>
```

### Azure Container Apps

```bash
# Enable system-assigned identity
az containerapp identity assign --name <app-name> --resource-group <rg-name> \
  --system-assigned

# Assign user-assigned identity
az containerapp identity assign --name <app-name> --resource-group <rg-name> \
  --user-assigned <identity-resource-id>
```

### Azure VM

```bash
# Enable system-assigned identity
az vm identity assign --name <vm-name> --resource-group <rg-name>
```

## Troubleshooting

### "Credential Unavailable" Error Locally

**Solution:** Run `az login` to authenticate with Azure CLI

### "Credential Unavailable" Error in Azure

**Solution:** Enable managed identity on your Azure resource

### Permission Denied When Accessing Resources

**Solution:** Grant the managed identity appropriate RBAC roles:

```bash
# Example: Grant Storage Blob Data Contributor role
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee <managed-identity-principal-id> \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<account>
```

## Additional Resources

- [Azure Identity SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/@azure/identity)
- [Managed Identities Overview](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview)
- [Best Practices for Authentication](https://learn.microsoft.com/en-us/azure/active-directory/develop/identity-platform-integration-checklist)

## License

MIT
