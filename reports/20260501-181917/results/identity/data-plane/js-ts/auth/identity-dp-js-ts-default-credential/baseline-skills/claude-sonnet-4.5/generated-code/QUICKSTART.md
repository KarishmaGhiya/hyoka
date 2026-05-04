# Quick Start Guide

## Project Structure

```
.
├── src/
│   └── index.ts          # Main TypeScript program
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variable template
├── .gitignore           # Git ignore rules
└── README.md            # Full documentation
```

## Quick Setup (3 Steps)

### 1. Install dependencies (already done)
```bash
npm install
```

### 2. Set environment variables
```powershell
# Windows PowerShell
$env:AZURE_KEYVAULT_NAME = "your-keyvault-name"
$env:SECRET_NAME = "MySecret"
```

```bash
# Linux/Mac
export AZURE_KEYVAULT_NAME="your-keyvault-name"
export SECRET_NAME="MySecret"
```

### 3. Authenticate and run
```bash
# Login with Azure CLI
az login

# Run the program
npm run dev
```

## What the Program Does

1. ✅ Creates a `DefaultAzureCredential` instance
2. ✅ Uses it to create a `SecretClient` for Key Vault
3. ✅ Retrieves a secret by name
4. ✅ Prints the secret value and metadata
5. ✅ Handles `AuthenticationError` for credential failures
6. ✅ Uses async/await throughout

## Key Features

### DefaultAzureCredential Chain
Automatically tries these authentication methods:
1. Environment variables (Service Principal)
2. Workload Identity (Kubernetes)
3. Managed Identity (Azure VMs/App Services)
4. Visual Studio Code
5. **Azure CLI** ← Most common for development
6. Azure PowerShell
7. Azure Developer CLI

### Error Handling
- ✅ AuthenticationError / CredentialUnavailableError
- ✅ 404 Not Found (secret doesn't exist)
- ✅ 403 Forbidden (no permissions)
- ✅ 401 Unauthorized (invalid credentials)
- ✅ 429 Rate Limited

### Required RBAC Permission
Your identity needs one of these roles on the Key Vault:
- **Key Vault Secrets User** (read-only)
- **Key Vault Secrets Officer** (full access)

```bash
# Grant permission
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee <your-email@example.com> \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault-name>
```

## Testing Without Azure Resources

If you don't have a Key Vault, the program will:
1. Attempt authentication (which will succeed if you ran `az login`)
2. Fail when trying to connect to the Key Vault (404/403 error)
3. Show clear error messages with solutions

## Example Output

### Success
```
Key Vault URL: https://my-vault.vault.azure.net

Creating DefaultAzureCredential...
Creating SecretClient...

Attempting to retrieve secret: MySecret

=== Secret Retrieved Successfully ===
Secret Name: MySecret
Secret Value: my-secret-value-here
Version: 7c9f6b9d4e3a2f1b...
Content Type: text/plain
Created On: 2024-01-15T10:30:00.000Z
Updated On: 2024-01-15T10:30:00.000Z
Enabled: true
```

### Authentication Error
```
=== Error Occurred ===
❌ AUTHENTICATION ERROR
Message: DefaultAzureCredential failed to retrieve a token...

Possible solutions:
1. Run 'az login' to authenticate with Azure CLI
2. Set service principal environment variables:
   - AZURE_TENANT_ID
   - AZURE_CLIENT_ID
   - AZURE_CLIENT_SECRET
3. Use managed identity if running on Azure resources
4. Ensure you have the correct permissions to access the Key Vault
```

## Commands Reference

```bash
# Development (with ts-node)
npm run dev

# Build TypeScript
npm run build

# Run compiled JavaScript
npm start

# Install dependencies
npm install

# Check TypeScript compilation
npx tsc --noEmit
```

## Packages Installed

- **@azure/identity** (^4.0.0) - Authentication
- **@azure/keyvault-secrets** (^4.8.0) - Key Vault SDK
- **typescript** (^5.0.0) - TypeScript compiler
- **ts-node** (^10.9.0) - Run TypeScript directly
- **@types/node** (^20.0.0) - Node.js type definitions

## Next Steps

1. **Try different credentials**: Test with service principal, managed identity
2. **Add more operations**: List secrets, create secrets, update metadata
3. **Error scenarios**: Test with invalid vault names, missing permissions
4. **Other Azure SDKs**: Use the same credential with Blob Storage, Cosmos DB, etc.

## Related Documentation

- [Azure Identity SDK](https://learn.microsoft.com/javascript/api/@azure/identity)
- [Key Vault Secrets SDK](https://learn.microsoft.com/javascript/api/@azure/keyvault-secrets)
- [DefaultAzureCredential](https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential)
