# Azure Key Vault CRUD Operations - TypeScript Demo

This script demonstrates all four CRUD operations (Create, Read, Update, Delete) on Azure Key Vault secrets using TypeScript and the Azure SDK.

## Prerequisites

1. **Azure Key Vault**: You need an Azure Key Vault with soft-delete enabled
2. **Permissions**: Your Azure identity needs appropriate permissions (e.g., "Key Vault Secrets Officer" role)
3. **Azure Credentials**: Configure one of the following:
   - Azure CLI: `az login`
   - Service Principal: Set environment variables `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`
   - Managed Identity: If running on Azure resources

## Required NPM Packages

The script uses the following Azure SDK packages:

- **@azure/keyvault-secrets** (^4.8.0): Key Vault secrets client
- **@azure/identity** (^4.0.0): Authentication using DefaultAzureCredential

Dev dependencies:
- **typescript** (^5.3.0): TypeScript compiler
- **ts-node** (^10.9.2): Run TypeScript directly
- **@types/node** (^20.11.0): Node.js type definitions

## Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

## Configuration

Set the `KEY_VAULT_URL` environment variable to your Key Vault URL:

```bash
# Windows (PowerShell)
$env:KEY_VAULT_URL="https://your-keyvault-name.vault.azure.net/"

# Windows (CMD)
set KEY_VAULT_URL=https://your-keyvault-name.vault.azure.net/

# Linux/macOS
export KEY_VAULT_URL="https://your-keyvault-name.vault.azure.net/"
```

## Usage

### Run with ts-node (Development)

```bash
npm run dev
```

### Build and Run (Production)

```bash
# Compile TypeScript to JavaScript
npm run build

# Run the compiled JavaScript
npm start
```

## What the Script Does

1. **CREATE**: Creates a new secret named "my-secret" with value "my-secret-value"
2. **READ**: Retrieves the secret and displays its value
3. **UPDATE**: Updates the secret to a new value "updated-value"
4. **DELETE**: Soft-deletes the secret (moves it to deleted state)
5. **PURGE**: Permanently removes the secret from the Key Vault

## Error Handling

The script includes comprehensive error handling for common scenarios:

- **403 Forbidden**: Missing permissions
- **401 Unauthorized**: Authentication issues
- **404 Not Found**: Secret doesn't exist
- Generic error handling with detailed error messages

## Authentication Methods

`DefaultAzureCredential` tries the following authentication methods in order:

1. Environment variables (Service Principal)
2. Managed Identity
3. Visual Studio Code
4. Azure CLI
5. Azure PowerShell
6. Interactive browser

## Notes

- The script requires a Key Vault with **soft-delete enabled** for the purge operation
- After soft-delete, secrets can be recovered unless purged
- Purging permanently removes secrets and cannot be undone
- Each secret update creates a new version (versioned secrets)

## Troubleshooting

**Access Denied (403)**:
- Ensure your identity has the "Key Vault Secrets Officer" role or equivalent
- Check the Key Vault's access policies or RBAC settings

**Authentication Failed (401)**:
- Run `az login` if using Azure CLI
- Verify environment variables if using Service Principal

**Key Vault Not Found**:
- Verify the KEY_VAULT_URL is correct
- Ensure the Key Vault exists and you have network access to it
