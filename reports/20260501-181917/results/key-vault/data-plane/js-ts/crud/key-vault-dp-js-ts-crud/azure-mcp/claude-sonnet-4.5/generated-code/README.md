# Azure Key Vault CRUD Operations Demo

This TypeScript script demonstrates all four CRUD operations on Azure Key Vault secrets using the Azure SDK for JavaScript.

## Required NPM Packages

```json
{
  "dependencies": {
    "@azure/identity": "^4.0.0",
    "@azure/keyvault-secrets": "^4.8.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0"
  }
}
```

## Prerequisites

1. **Azure Key Vault**: Create a Key Vault with soft-delete enabled
   ```bash
   az keyvault create --name <your-vault-name> --resource-group <your-rg> --location <location>
   ```

2. **Authentication**: Configure DefaultAzureCredential (one of):
   - Azure CLI: `az login`
   - Managed Identity (for Azure resources)
   - Environment variables (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
   - Visual Studio Code authentication

3. **Permissions**: Ensure your account has these Key Vault permissions:
   - Get
   - Set
   - Delete
   - Purge

   Assign via Access Policy or RBAC:
   ```bash
   # Using Access Policy
   az keyvault set-policy --name <your-vault-name> --upn <your-email> \
     --secret-permissions get set delete purge

   # Using RBAC (recommended)
   az role assignment create --role "Key Vault Secrets Officer" \
     --assignee <your-email> \
     --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault-name>
   ```

## Installation

```bash
npm install
```

## Usage

1. Set the Key Vault name environment variable:
   ```bash
   # Windows (PowerShell)
   $env:KEY_VAULT_NAME="your-vault-name"

   # Windows (CMD)
   set KEY_VAULT_NAME=your-vault-name

   # Linux/Mac
   export KEY_VAULT_NAME=your-vault-name
   ```

2. Run the script:
   ```bash
   # Development mode (with ts-node)
   npm run dev

   # Production mode (compile first)
   npm run build
   npm start
   ```

## What the Script Does

1. **CREATE**: Creates a secret named "my-secret" with value "my-secret-value"
2. **READ**: Retrieves and displays the secret value
3. **UPDATE**: Updates the secret to "updated-value"
4. **DELETE**: Soft-deletes the secret
5. **PURGE**: Permanently deletes the secret (requires soft-delete enabled vault)

## Expected Output

```
Connecting to Key Vault: https://your-vault-name.vault.azure.net

📝 CREATE: Setting secret...
✅ Created secret: my-secret
   Version: abc123...
   Value: my-secret-value

📖 READ: Getting secret...
✅ Retrieved secret: my-secret
   Version: abc123...
   Value: my-secret-value
   Created on: 2026-05-01T18:37:27.000Z

🔄 UPDATE: Updating secret...
✅ Updated secret: my-secret
   New version: def456...
   New value: updated-value

📖 Verifying update...
✅ Verified secret value: updated-value

🗑️  DELETE: Deleting secret...
✅ Deleted secret: my-secret
   Scheduled purge date: 2026-05-31T18:37:27.000Z
   Recovery ID: https://...

🧹 PURGE: Purging deleted secret...
✅ Purged secret: my-secret
   Secret has been permanently deleted

✨ All CRUD operations completed successfully!
```

## Error Handling

The script includes comprehensive error handling:
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Invalid Key Vault name
- **Network errors**: Connection issues
- **Authentication errors**: Credential problems

## Security Notes

- Never hardcode secrets in your code
- Use managed identities in production
- Implement proper RBAC permissions
- Enable soft-delete and purge protection in production vaults
- Monitor Key Vault access logs
