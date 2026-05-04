# Azure Key Vault CRUD Operations Demo

A TypeScript script demonstrating all four CRUD operations on Azure Key Vault secrets using the Azure SDK.

## Features

✅ **Create** - Add a new secret with value  
✅ **Read** - Retrieve and display secret value  
✅ **Update** - Modify secret value with tags  
✅ **Delete** - Soft delete and permanent purge  

## Prerequisites

- Node.js 18 or higher
- Azure subscription
- Azure Key Vault with soft-delete enabled
- Authentication configured (one of the following):
  - Azure CLI: `az login`
  - Service Principal with environment variables
  - Managed Identity (when running in Azure)

## Required Permissions

Your identity needs one of these roles on the Key Vault:
- **Key Vault Secrets Officer** (recommended)
- **Key Vault Administrator**

Or these specific access policy permissions:
- Get, Set, Delete, Purge secrets

## Installation

```bash
npm install
```

### Required Packages

- `@azure/identity` - Authentication with DefaultAzureCredential
- `@azure/keyvault-secrets` - Key Vault operations

## Configuration

Set the Key Vault name as an environment variable:

```bash
# Windows (PowerShell)
$env:KEY_VAULT_NAME="your-keyvault-name"

# Windows (Command Prompt)
set KEY_VAULT_NAME=your-keyvault-name

# Linux/macOS
export KEY_VAULT_NAME="your-keyvault-name"
```

## Usage

### Run with tsx (TypeScript execution)

```bash
npm start
```

### Build and run JavaScript

```bash
npm run build
node dist/keyvault-crud.js
```

### Development mode (watch)

```bash
npm run dev
```

## Authentication Methods

`DefaultAzureCredential` attempts authentication in this order:

1. **Environment** - Service principal via environment variables
2. **Workload Identity** - Kubernetes federated token
3. **Managed Identity** - Azure VM/App Service/Container Apps
4. **Visual Studio Code** - VS Code Azure Account extension
5. **Azure CLI** - `az login` credentials
6. **Azure PowerShell** - `Connect-AzAccount` credentials
7. **Azure Developer CLI** - `azd auth login` credentials

## Example Output

```
🔐 Azure Key Vault CRUD Operations Demo
Key Vault: https://your-vault.vault.azure.net

📝 Creating secret "my-secret"...
✅ Secret created successfully
   - Name: my-secret
   - Version: abc123...
   - Created: 2026-05-01T16:00:00.000Z

📖 Reading secret "my-secret"...
✅ Secret retrieved successfully
   - Name: my-secret
   - Value: my-secret-value
   - Version: abc123...

🔄 Updating secret "my-secret"...
✅ Secret updated successfully
   - Name: my-secret
   - New Version: def456...

🗑️  Deleting secret "my-secret"...
✅ Secret deleted (soft delete)

🔥 Purging secret "my-secret" permanently...
✅ Secret purged successfully

✨ All CRUD operations completed successfully!
```

## Error Handling

The script includes comprehensive error handling for common scenarios:

- **401 Unauthorized** - Authentication failure
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Key Vault doesn't exist
- Network errors, timeouts, etc.

## Troubleshooting

### Authentication Failed (401)

```bash
# Login with Azure CLI
az login

# Verify your identity
az account show
```

### Access Denied (403)

```bash
# Check your role assignments
az role assignment list --assignee <your-email> --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault-name>

# Assign required role (requires Owner/User Access Administrator)
az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee <your-email> \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault-name>
```

### Key Vault Not Found (404)

```bash
# List your Key Vaults
az keyvault list --output table

# Verify the vault exists
az keyvault show --name <vault-name>
```

## Security Best Practices

- ✅ Uses `DefaultAzureCredential` (no hardcoded credentials)
- ✅ Reads vault name from environment variable
- ✅ Demonstrates soft-delete and purge protection
- ✅ Includes proper error handling
- ❌ Never commit secrets to source control
- ❌ Never hardcode credentials in code

## Learn More

- [Azure Key Vault Documentation](https://learn.microsoft.com/azure/key-vault/)
- [Azure Identity SDK](https://www.npmjs.com/package/@azure/identity)
- [Azure Key Vault Secrets SDK](https://www.npmjs.com/package/@azure/keyvault-secrets)
- [DefaultAzureCredential](https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential)
