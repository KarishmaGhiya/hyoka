# Azure Key Vault Secrets CRUD Demo

A complete TypeScript example demonstrating all CRUD operations for Azure Key Vault secrets.

## Features

- ✅ **Create** - Set a new secret with metadata
- ✅ **Read** - Retrieve secret value and properties
- ✅ **Update** - Modify secret value and tags
- ✅ **Delete** - Soft delete with recovery option
- ✅ **Purge** - Permanently remove deleted secret
- ✅ **Error Handling** - Comprehensive try/catch with specific error handling

## Prerequisites

1. **Azure Key Vault** with soft-delete enabled
2. **RBAC Permissions**: Key Vault Secrets Officer or similar role
3. **Authentication** configured via one of:
   - Azure CLI: `az login`
   - Managed Identity (in Azure)
   - Service Principal
   - Other DefaultAzureCredential options

## Installation

```bash
npm install
```

This installs:
- `@azure/identity` - Authentication with DefaultAzureCredential
- `@azure/keyvault-secrets` - Key Vault Secrets SDK

## Configuration

Set one of these environment variables:

```bash
# Option 1: Vault name only
export AZURE_KEYVAULT_NAME="your-keyvault-name"

# Option 2: Full vault URL
export KEY_VAULT_URL="https://your-keyvault-name.vault.azure.net"
```

## Usage

### Run with ts-node (development)

```bash
npm run dev
```

### Build and run (production)

```bash
npm run build
npm start
```

## Expected Output

```
=== Azure Key Vault Secrets CRUD Operations ===

Connecting to Key Vault: https://your-keyvault.vault.azure.net

1. CREATE - Creating secret...
✓ Secret created: my-secret
  Version: abc123...
  Created: 2026-05-01T18:37:22.000Z

2. READ - Reading secret...
✓ Secret retrieved: my-secret
  Value: my-secret-value
  Version: abc123...
  Content-Type: text/plain
  Tags: {"environment":"demo","purpose":"crud-example"}

3. UPDATE - Updating secret...
✓ Secret updated: my-secret
  New Version: def456...
  Updated: 2026-05-01T18:37:25.000Z
  New Value: updated-value

4. DELETE - Deleting secret (soft delete)...
✓ Secret deleted: my-secret
  Deleted On: 2026-05-01T18:37:27.000Z
  Recovery ID: https://...

5. PURGE - Purging deleted secret...
✓ Secret purged permanently: my-secret

=== All CRUD operations completed successfully! ===
```

## Error Handling

The script handles common errors:

- **SecretNotFound** - Secret doesn't exist
- **Forbidden (403)** - Insufficient RBAC permissions
- **Unauthorized (401)** - Authentication failed
- **General errors** - Other Azure/network issues

## RBAC Permissions Required

To run all operations, your identity needs:

- `Key Vault Secrets Officer` (recommended)
- Or custom role with:
  - `Microsoft.KeyVault/vaults/secrets/setSecret/action`
  - `Microsoft.KeyVault/vaults/secrets/getSecret/action`
  - `Microsoft.KeyVault/vaults/secrets/delete`
  - `Microsoft.KeyVault/vaults/secrets/purge/action`

## Soft Delete

This demo requires a Key Vault with **soft-delete enabled** (default for new vaults). Soft-delete allows:

- Recovery of accidentally deleted secrets
- 90-day retention period (configurable)
- Purge protection (optional) prevents permanent deletion

## Learn More

- [Azure Key Vault Secrets SDK](https://learn.microsoft.com/javascript/api/@azure/keyvault-secrets)
- [DefaultAzureCredential](https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential)
- [Key Vault RBAC Guide](https://learn.microsoft.com/azure/key-vault/general/rbac-guide)
