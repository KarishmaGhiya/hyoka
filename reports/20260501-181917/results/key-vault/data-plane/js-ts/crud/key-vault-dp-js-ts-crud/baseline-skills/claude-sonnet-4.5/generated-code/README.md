# Azure Key Vault Secrets CRUD Operations

A TypeScript script demonstrating all four CRUD operations on Azure Key Vault secrets using the `@azure/keyvault-secrets` SDK.

## Features

✅ **CREATE** - Create a new secret with metadata (tags, content type)  
✅ **READ** - Retrieve and display secret value  
✅ **UPDATE** - Update secret to a new value (creates new version)  
✅ **DELETE** - Soft-delete and permanently purge the secret  

## Prerequisites

1. **Azure Key Vault** with soft-delete enabled
2. **Azure Authentication** - One of:
   - Azure CLI: `az login`
   - Managed Identity (when running in Azure)
   - Service Principal with environment variables
   - Visual Studio/VS Code credentials

3. **RBAC Permissions** - Your identity needs these roles on the Key Vault:
   - `Key Vault Secrets Officer` (for full CRUD + purge), or
   - Custom role with: Get, Set, Delete, and Purge secrets permissions

## Installation

```bash
# Install dependencies
npm install

# Or using yarn
yarn install
```

## Required NPM Packages

```json
{
  "dependencies": {
    "@azure/keyvault-secrets": "^4.9.0",
    "@azure/identity": "^4.5.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0",
    "ts-node": "^10.9.2"
  }
}
```

## Configuration

Set your Key Vault name as an environment variable:

### Windows (PowerShell)
```powershell
$env:KEY_VAULT_NAME="your-keyvault-name"
```

### Windows (Command Prompt)
```cmd
set KEY_VAULT_NAME=your-keyvault-name
```

### Linux/macOS
```bash
export KEY_VAULT_NAME="your-keyvault-name"
```

Alternatively, set the full URL:
```powershell
$env:KEY_VAULT_URL="https://your-keyvault-name.vault.azure.net"
```

## Usage

### Run with ts-node (development)
```bash
npm start
```

### Compile and run
```bash
npm run build
node dist/keyvault-crud.js
```

## Expected Output

```
Connecting to Key Vault: https://your-vault.vault.azure.net

=== 1. CREATE SECRET ===
✓ Created secret: my-secret
  Version: abc123...
  Created on: 2024-01-15T10:30:00.000Z
  Content Type: text/plain
  Tags: {"purpose":"demo","environment":"development"}

=== 2. READ SECRET ===
✓ Retrieved secret: my-secret
  Value: my-secret-value
  Version: abc123...
  Enabled: true
  Content Type: text/plain

=== 3. UPDATE SECRET ===
✓ Updated secret: my-secret
  New value: updated-value
  New version: def456...
  Updated on: 2024-01-15T10:30:05.000Z
  Verified value: updated-value

=== 4. DELETE SECRET ===
  Step 1: Soft-deleting secret...
✓ Soft-deleted secret: my-secret
  Deleted on: 2024-01-15T10:30:10.000Z
  Scheduled purge date: 2024-04-15T10:30:10.000Z
  Recovery ID: https://your-vault.vault.azure.net/deletedsecrets/my-secret

  Step 2: Purging secret (permanent deletion)...
✓ Permanently purged secret: my-secret
  Note: This operation is IRREVERSIBLE

=== CRUD OPERATIONS COMPLETED SUCCESSFULLY ===
```

## Error Handling

The script includes comprehensive error handling for common scenarios:

- **403 Forbidden**: Missing RBAC permissions
- **404 Not Found**: Secret doesn't exist
- **409 Conflict**: Secret exists in deleted state
- Authentication failures
- Network errors

## Key Concepts

### Secret Versioning
Each time you set a secret with an existing name, Azure Key Vault creates a **new version**. Previous versions remain accessible:

```typescript
const v1 = await secretClient.setSecret("my-secret", "value-1");
const v2 = await secretClient.setSecret("my-secret", "value-2"); // New version

// Get latest version
const latest = await secretClient.getSecret("my-secret");

// Get specific version
const oldVersion = await secretClient.getSecret("my-secret", {
  version: v1.properties.version
});
```

### Soft Delete
When you delete a secret, it enters a **soft-deleted** state for the retention period (default: 90 days). During this time:
- ✅ You can recover the secret with `beginRecoverDeletedSecret()`
- ✅ You can permanently delete with `purgeDeletedSecret()`
- ❌ You cannot create a new secret with the same name

### Purge Protection
If your vault has **purge protection** enabled, you CANNOT purge secrets during the retention period. This prevents accidental permanent deletion.

## Authentication Methods

The script uses `DefaultAzureCredential`, which tries these methods in order:

1. Environment variables (Service Principal)
2. Managed Identity (when running in Azure)
3. Visual Studio Code
4. Azure CLI (`az login`)
5. Azure PowerShell
6. Interactive browser

## Best Practices

1. ✅ **Enable soft-delete** on your Key Vault (required for production)
2. ✅ **Enable purge protection** to prevent accidental permanent deletion
3. ✅ **Set expiration dates** on secrets to enforce rotation
4. ✅ **Use content types** to help consumers understand the format
5. ✅ **Tag secrets** for organization and tracking
6. ✅ **Use Managed Identity** in production (avoid credentials)
7. ✅ **Monitor secret expiration** and set up alerts
8. ✅ **Use least privilege** RBAC permissions

## Troubleshooting

### "Operation returned an invalid status 'Forbidden'"
- Check RBAC permissions on the Key Vault
- Ensure you have: Get, Set, Delete, and Purge permissions

### "Secret not found"
- Verify the KEY_VAULT_NAME environment variable
- Check if the secret exists: `az keyvault secret list --vault-name <name>`

### "Authentication failed"
- Run `az login` to authenticate with Azure CLI
- Or set up service principal environment variables

### "Cannot purge a secret while recovery is pending"
- Wait for the delete operation to complete (can take a few seconds)
- Check if purge protection is enabled (prevents immediate purge)

## Resources

- [Azure Key Vault Secrets SDK Documentation](https://learn.microsoft.com/javascript/api/@azure/keyvault-secrets)
- [Azure Identity SDK Documentation](https://learn.microsoft.com/javascript/api/@azure/identity)
- [Azure Key Vault Best Practices](https://learn.microsoft.com/azure/key-vault/general/best-practices)

## License

MIT
