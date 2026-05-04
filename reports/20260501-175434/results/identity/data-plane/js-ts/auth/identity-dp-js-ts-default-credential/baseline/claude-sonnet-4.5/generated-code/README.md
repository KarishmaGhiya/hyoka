# Azure Key Vault Authentication with DefaultAzureCredential

This TypeScript program demonstrates how to authenticate to Azure Key Vault using `DefaultAzureCredential` from the Azure Identity SDK.

## Features

- ✅ Uses `DefaultAzureCredential` for flexible authentication
- ✅ Retrieves secrets from Azure Key Vault
- ✅ Comprehensive error handling with `AuthenticationError`
- ✅ Async/await throughout
- ✅ Type-safe TypeScript implementation

## Prerequisites

- Node.js 16+ installed
- Azure subscription
- Azure Key Vault created
- At least one secret stored in the Key Vault

## Authentication Methods

`DefaultAzureCredential` tries the following authentication methods in order:

1. **Environment Variables** - Service principal credentials
2. **Workload Identity** - Kubernetes federated credentials
3. **Managed Identity** - Azure VM/App Service/Container Apps
4. **Visual Studio Code** - VS Code Azure extension
5. **Azure CLI** - `az login`
6. **Azure PowerShell** - `Connect-AzAccount`
7. **Azure Developer CLI** - `azd auth login`

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Set the following environment variables:

```bash
# Required
export KEY_VAULT_NAME="your-keyvault-name"
export SECRET_NAME="your-secret-name"

# Optional (for service principal authentication)
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

**Windows (PowerShell):**
```powershell
$env:KEY_VAULT_NAME="your-keyvault-name"
$env:SECRET_NAME="your-secret-name"
```

### 3. Azure CLI Login (Alternative)

If not using service principal, login with Azure CLI:

```bash
az login
```

### 4. Grant Access to Key Vault

Ensure your identity has permission to read secrets:

**Using Access Policies:**
```bash
az keyvault set-policy --name your-keyvault-name \
  --upn user@example.com \
  --secret-permissions get list
```

**Using RBAC:**
```bash
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee user@example.com \
  --scope /subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/{vault-name}
```

## Usage

### Run with ts-node

```bash
npm start
```

### Build and Run

```bash
npm run build
node dist/index.js
```

### Run with Environment Variables

```bash
KEY_VAULT_NAME="my-vault" SECRET_NAME="my-secret" npm start
```

## Expected Output

```
🔐 Azure Key Vault Authentication Demo
==================================================
Key Vault URL: https://my-vault.vault.azure.net
Secret Name: my-secret

📌 Step 1: Creating DefaultAzureCredential...
✅ DefaultAzureCredential created successfully

📌 Step 2: Creating SecretClient...
✅ SecretClient created successfully

📌 Step 3: Retrieving secret from Key Vault...
✅ Secret retrieved successfully
==================================================
Secret Name: my-secret
Secret Value: ***SECRET_VALUE***
Secret Version: abc123def456
Created On: 2026-01-15T10:30:00.000Z
Updated On: 2026-01-15T10:30:00.000Z
==================================================
```

## Error Handling

The program handles the following error scenarios:

- **AuthenticationError**: Credential/authentication failures
- **Key Vault Not Found**: Invalid Key Vault name
- **Access Denied**: Insufficient permissions
- **Secret Not Found**: Invalid secret name

## Security Best Practices

1. **Never hardcode credentials** - Use environment variables or managed identity
2. **Use Managed Identity in production** - No secrets to manage
3. **Rotate secrets regularly** - Use Key Vault's versioning feature
4. **Limit secret permissions** - Grant minimum required access
5. **Enable Key Vault logging** - Monitor access and changes

## Troubleshooting

### Authentication Failed

1. Check if logged in: `az account show`
2. Login if needed: `az login`
3. Verify environment variables are set correctly

### Access Denied (403)

1. Check Key Vault access policies or RBAC assignments
2. Ensure your identity has "Get" permission for secrets

### Key Vault Not Found

1. Verify the Key Vault name is correct
2. Ensure the Key Vault exists: `az keyvault show --name your-vault-name`

## Dependencies

- `@azure/identity` - Azure authentication library
- `@azure/keyvault-secrets` - Key Vault client library
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution environment

## License

MIT
