# Azure Key Vault CRUD Operations

This TypeScript script demonstrates all four CRUD operations on Azure Key Vault secrets.

## Prerequisites

1. **Azure Key Vault** with soft-delete enabled
2. **Azure Authentication** - one of:
   - Azure CLI: `az login`
   - Managed Identity (if running on Azure)
   - Service Principal credentials in environment variables
   - Visual Studio Code Azure extension

3. **Permissions** - Your identity needs:
   - Key Vault Secrets Officer role, OR
   - Individual permissions: Get, Set, Delete, Purge secrets

## Installation

```bash
npm install
```

This installs:
- `@azure/keyvault-secrets` - Key Vault secrets SDK
- `@azure/identity` - Authentication library with DefaultAzureCredential
- `typescript`, `ts-node` - TypeScript runtime

## Configuration

Set your Key Vault URL as an environment variable:

```bash
# Windows (PowerShell)
$env:AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net/"

# Linux/macOS
export AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net/"
```

## Usage

Run the script:

```bash
npm start
```

Or with ts-node directly:

```bash
npx ts-node keyvault-crud.ts
```

## What It Does

1. **CREATE** - Creates a secret named "my-secret" with value "my-secret-value"
2. **READ** - Retrieves and displays the secret value
3. **UPDATE** - Updates the secret to "updated-value"
4. **DELETE** - Soft-deletes the secret
5. **PURGE** - Permanently removes the secret

## Authentication Flow

DefaultAzureCredential tries these methods in order:
1. Environment variables (service principal)
2. Managed identity
3. Visual Studio Code
4. Azure CLI
5. Azure PowerShell

## Error Handling

The script includes comprehensive error handling for:
- Missing Key Vault URL
- Authentication failures
- Permission issues (403 Forbidden)
- Network connectivity problems
- Invalid vault URLs

## Common Issues

**403 Forbidden**: Add Key Vault Secrets Officer role:
```bash
az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee <your-email-or-object-id> \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault-name>
```

**Authentication Failed**: Run `az login` first

**Purge Failed**: Ensure soft-delete is enabled on your Key Vault
