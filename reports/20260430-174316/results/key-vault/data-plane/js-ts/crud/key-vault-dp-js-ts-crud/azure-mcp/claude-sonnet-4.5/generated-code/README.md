# Azure Key Vault CRUD Operations Demo

This TypeScript script demonstrates all four CRUD operations on Azure Key Vault secrets with proper error handling and authentication using DefaultAzureCredential.

## Features

- ✅ **Create** - Add a new secret to Key Vault
- ✅ **Read** - Retrieve and display secret value
- ✅ **Update** - Modify existing secret with new value
- ✅ **Delete** - Soft-delete the secret
- ✅ **Purge** - Permanently remove the deleted secret

## Prerequisites

1. **Azure Key Vault** - You need an existing Key Vault with soft-delete enabled
2. **Authentication** - One of the following:
   - Azure CLI logged in (`az login`)
   - Managed Identity (if running on Azure)
   - Environment variables (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)
3. **Permissions** - Your identity needs:
   - Key Vault Secrets Officer (RBAC) or
   - Access Policy with Get, Set, Delete, Purge permissions

## Required npm Packages

```json
{
  "@azure/identity": "^4.0.0",
  "@azure/keyvault-secrets": "^4.8.0"
}
```

### Dev Dependencies
```json
{
  "@types/node": "^20.11.0",
  "ts-node": "^10.9.2",
  "typescript": "^5.3.3"
}
```

## Installation

```bash
# Install dependencies
npm install

# Or with specific versions
npm install @azure/identity @azure/keyvault-secrets
npm install -D typescript ts-node @types/node
```

## Usage

1. Set your Key Vault name as an environment variable:

```bash
# Windows (PowerShell)
$env:KEY_VAULT_NAME="your-keyvault-name"

# Windows (CMD)
set KEY_VAULT_NAME=your-keyvault-name

# Linux/Mac
export KEY_VAULT_NAME="your-keyvault-name"
```

2. Run the script:

```bash
# Using ts-node
npm start

# Or directly
npx ts-node keyvault-crud.ts

# Or compile and run
npm run build
node dist/keyvault-crud.js
```

## What the Script Does

1. **Connects** to your Key Vault using DefaultAzureCredential
2. **Creates** a secret named "my-secret" with value "my-secret-value"
3. **Reads** the secret back and displays its value
4. **Updates** the secret to "updated-value" with tags
5. **Deletes** the secret (soft-delete)
6. **Purges** the secret permanently

## Error Handling

The script includes comprehensive error handling for:
- Missing environment variables
- Authentication failures (401/403)
- Vault not found errors
- Permission issues

## Example Output

```
============================================================
Azure Key Vault CRUD Operations Demo
============================================================
Key Vault URL: https://your-vault.vault.azure.net

1. CREATE - Creating secret...
   ✓ Secret 'my-secret' created successfully
   - Version: abc123...
   - Created: 2026-04-30T17:54:00.000Z

2. READ - Reading secret...
   ✓ Secret 'my-secret' retrieved successfully
   - Value: my-secret-value
   - Version: abc123...

3. UPDATE - Updating secret...
   ✓ Secret 'my-secret' updated successfully
   - New Value: updated-value
   - New Version: def456...

4. DELETE - Deleting secret (soft-delete)...
   ✓ Secret 'my-secret' deleted successfully

5. PURGE - Permanently removing secret...
   ✓ Secret 'my-secret' purged successfully

============================================================
✓ All CRUD operations completed successfully!
============================================================
```

## Authentication Methods (DefaultAzureCredential)

DefaultAzureCredential tries these methods in order:
1. Environment variables
2. Managed Identity
3. Azure CLI
4. Azure PowerShell
5. Interactive browser

## Security Notes

- Never hardcode secrets in your code
- Use environment variables or Azure Key Vault references
- Grant least-privilege permissions
- Enable soft-delete and purge protection in production

## Troubleshooting

**401/403 Errors**: Check your RBAC role assignment or access policies
**Vault Not Found**: Verify KEY_VAULT_NAME is correct
**Purge Fails**: Ensure soft-delete is enabled on the vault
