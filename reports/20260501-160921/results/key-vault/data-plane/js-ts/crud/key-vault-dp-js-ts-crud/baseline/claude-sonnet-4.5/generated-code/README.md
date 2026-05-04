# Azure Key Vault CRUD Operations Demo

A TypeScript script demonstrating all four CRUD operations on Azure Key Vault secrets.

## Prerequisites

1. **Azure Key Vault**: Create a Key Vault in Azure
2. **Authentication**: One of the following:
   - Azure CLI: Run `az login`
   - Managed Identity (if running on Azure)
   - Environment variables (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)
3. **Permissions**: Your identity needs these Key Vault permissions:
   - Get Secrets
   - Set Secrets
   - Delete Secrets
   - Purge Secrets

## Required NPM Packages

```json
{
  "dependencies": {
    "@azure/keyvault-secrets": "^4.8.0",
    "@azure/identity": "^4.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2"
  }
}
```

## Installation

```bash
npm install
```

## Configuration

Set the Key Vault URL environment variable:

```bash
# Windows (PowerShell)
$env:KEY_VAULT_URL="https://your-keyvault-name.vault.azure.net/"

# Windows (CMD)
set KEY_VAULT_URL=https://your-keyvault-name.vault.azure.net/

# Linux/Mac
export KEY_VAULT_URL=https://your-keyvault-name.vault.azure.net/
```

## Usage

```bash
npm start
```

Or run directly with ts-node:

```bash
npx ts-node keyvault-crud.ts
```

## Operations Performed

1. **CREATE**: Creates a secret named "my-secret" with value "my-secret-value"
2. **READ**: Retrieves and displays the secret value
3. **UPDATE**: Updates the secret to "updated-value"
4. **DELETE**: Soft-deletes the secret, then purges it permanently

## Authentication Methods

DefaultAzureCredential tries the following authentication methods in order:

1. **Environment** - Service principal via environment variables
2. **Managed Identity** - When running on Azure
3. **Azure CLI** - Uses credentials from `az login`
4. **Azure PowerShell** - Uses credentials from Azure PowerShell
5. **Interactive Browser** - Opens browser for authentication

## Troubleshooting

### 401 Unauthorized
- Run `az login` to authenticate
- Verify your account has access to the Key Vault

### 403 Forbidden
- Check Key Vault access policies or RBAC roles
- Required permissions: Get, Set, Delete, Purge secrets
- Assign "Key Vault Secrets Officer" role for RBAC

### 404 Not Found
- Verify the KEY_VAULT_URL is correct
- Ensure the Key Vault exists and is accessible
