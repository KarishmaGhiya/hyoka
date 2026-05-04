# Azure Managed Identity Authentication Demo

A comprehensive TypeScript demonstration of using Managed Identity to authenticate Azure SDK clients.

## Features

This demo illustrates:

1. **System-Assigned Managed Identity** - Default identity for Azure resources
2. **User-Assigned Managed Identity** - Custom identity with explicit client ID
3. **ChainedTokenCredential** - Falls back to Azure CLI for local development
4. **Azure SDK Integration** - Uses credentials with Azure Key Vault client
5. **Error Handling** - Properly handles `CredentialUnavailableError`

## Prerequisites

- Node.js 18+ and npm
- TypeScript 5+
- Azure subscription (for production use)
- Azure CLI installed (for local development)

## Installation

```bash
npm install
```

## Configuration

Set environment variables (optional):

```bash
# For user-assigned managed identity
export AZURE_CLIENT_ID="your-user-assigned-identity-client-id"

# For testing with Key Vault
export KEY_VAULT_URL="https://your-keyvault.vault.azure.net/"
```

## Running Locally

### Option 1: Using Azure CLI (Recommended for local dev)

```bash
# Login to Azure CLI first
az login

# Run the demo
npm run dev
```

### Option 2: Build and run

```bash
npm run build
npm start
```

## Running in Azure

Deploy to any Azure resource that supports Managed Identity:

- Azure Virtual Machine
- Azure App Service
- Azure Container Instances
- Azure Kubernetes Service
- Azure Functions

### Enable Managed Identity

#### System-Assigned Identity
```bash
az vm identity assign --name myVM --resource-group myRG
```

#### User-Assigned Identity
```bash
# Create user-assigned identity
az identity create --name myIdentity --resource-group myRG

# Assign to VM
az vm identity assign \
  --name myVM \
  --resource-group myRG \
  --identities /subscriptions/{sub}/resourceGroups/myRG/providers/Microsoft.ManagedIdentity/userAssignedIdentities/myIdentity
```

## How It Works

### ChainedTokenCredential Flow

```typescript
const credential = new ChainedTokenCredential(
  new ManagedIdentityCredential(),              // Try system-assigned MI first
  new ManagedIdentityCredential({ clientId }), // Then user-assigned MI
  new AzureCliCredential()                     // Fall back to Azure CLI
);
```

The credential chain tries each method in order:
1. **In Azure** → Uses Managed Identity (no secrets needed!)
2. **Locally** → Falls back to Azure CLI credentials

### Error Handling

```typescript
try {
  const credential = new ManagedIdentityCredential();
  // Use credential...
} catch (error) {
  if (error instanceof CredentialUnavailableError) {
    // Expected when not running in Azure
    console.log("Managed Identity not available");
  }
}
```

## Key Vault Permissions

To test with Key Vault, grant the identity access:

```bash
# Get the identity's object ID
az identity show --name myIdentity --resource-group myRG --query principalId -o tsv

# Grant Key Vault permissions
az keyvault set-policy \
  --name myKeyVault \
  --object-id <principal-id> \
  --secret-permissions get list
```

## Code Examples

### Using with Azure SDK Client

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new ManagedIdentityCredential();
const client = new SecretClient("https://myvault.vault.azure.net/", credential);

const secret = await client.getSecret("my-secret");
console.log(secret.value);
```

### Getting an Access Token

```typescript
const token = await credential.getToken("https://vault.azure.net/.default");
console.log(token.token);
console.log(token.expiresOnTimestamp);
```

## Best Practices

1. **Use ChainedTokenCredential** - Works in both Azure and local development
2. **Never hardcode credentials** - Use Managed Identity in production
3. **Handle CredentialUnavailableError** - Expected when not in Azure
4. **Use user-assigned for multi-tenant** - Better control and security
5. **Grant least privilege** - Only assign necessary permissions

## Troubleshooting

### "Managed Identity not available"
- **Locally**: Run `az login` to authenticate via Azure CLI
- **In Azure**: Ensure Managed Identity is enabled on your resource

### "Access denied (403)"
- Grant the identity appropriate permissions (e.g., Key Vault access policy)

### "ENOTFOUND" or connection errors
- Check that the service URL is correct
- Verify network connectivity to Azure services

## Resources

- [Azure Identity SDK Docs](https://learn.microsoft.com/javascript/api/@azure/identity)
- [Managed Identity Overview](https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)
- [DefaultAzureCredential](https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential)

## License

MIT
