# Azure Key Vault CRUD Operations Demo

A TypeScript script demonstrating all four CRUD operations on Azure Key Vault secrets using the Azure SDK.

## Features

- ✅ **Create** a new secret
- ✅ **Read** the secret value
- ✅ **Update** the secret to a new value
- ✅ **Delete** and purge the secret
- 🔐 Uses `DefaultAzureCredential` for authentication
- 🛡️ Comprehensive error handling with helpful troubleshooting tips

## Prerequisites

1. **Azure Key Vault**: You need an existing Azure Key Vault with soft-delete enabled
2. **Azure Authentication**: One of the following:
   - Azure CLI: `az login`
   - Service Principal environment variables
   - Managed Identity (when running on Azure)
3. **Permissions**: Your identity needs these Key Vault permissions:
   - Get (secrets)
   - Set (secrets)
   - Delete (secrets)
   - Purge (secrets)

## Installation

```bash
npm install
```

## Required NPM Packages

```json
{
  "@azure/identity": "^4.0.0",
  "@azure/keyvault-secrets": "^4.8.0"
}
```

## Configuration

Set the `AZURE_KEYVAULT_URL` environment variable:

```bash
# Windows (PowerShell)
$env:AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net/"

# Windows (CMD)
set AZURE_KEYVAULT_URL=https://your-vault-name.vault.azure.net/

# Linux/Mac
export AZURE_KEYVAULT_URL=https://your-vault-name.vault.azure.net/
```

## Usage

### Development mode (with ts-node)
```bash
npm run dev
```

### Build and run
```bash
npm run build
npm start
```

## What the Script Does

1. **Create**: Creates a secret named "my-secret" with value "my-secret-value"
2. **Read**: Retrieves and displays the secret value
3. **Update**: Updates the secret to "updated-value" and verifies the change
4. **Delete**: Soft-deletes the secret, then permanently purges it

## Authentication Methods

`DefaultAzureCredential` attempts authentication in this order:

1. **Environment variables** (Service Principal)
   - AZURE_CLIENT_ID
   - AZURE_TENANT_ID
   - AZURE_CLIENT_SECRET

2. **Azure CLI** - If you've run `az login`

3. **Managed Identity** - When running on Azure (VM, App Service, etc.)

## Troubleshooting

### "Authentication failed"
Run `az login` to authenticate with Azure CLI.

### "Access denied" or 403 errors
Ensure your identity has the required Key Vault permissions:
```bash
az keyvault set-policy --name <vault-name> \
  --upn <your-email> \
  --secret-permissions get set delete purge
```

### "Vault not found" or 404 errors
Verify the AZURE_KEYVAULT_URL is correct and the vault exists.

## Example Output

```
Connecting to Key Vault: https://your-vault-name.vault.azure.net/

1. CREATE: Creating new secret...
   ✓ Secret created: my-secret
   Version: abc123...

2. READ: Reading secret...
   ✓ Secret retrieved: my-secret
   Value: my-secret-value
   Version: abc123...

3. UPDATE: Updating secret to new value...
   ✓ Secret updated: my-secret
   New version: def456...
   Verified new value: updated-value

4. DELETE: Deleting secret...
   ✓ Secret deleted: my-secret
   Recovery ID: https://...

   Purging secret (permanent deletion)...
   ✓ Secret purged permanently

All CRUD operations completed successfully! ✓
```
