# Azure Identity & Key Vault Demo (TypeScript)

This TypeScript program demonstrates how to authenticate to Azure services using `DefaultAzureCredential` and retrieve secrets from Azure Key Vault.

## Features

- ✅ Uses `DefaultAzureCredential` for flexible authentication
- ✅ Retrieves secrets from Azure Key Vault
- ✅ Comprehensive error handling with `AuthenticationError` detection
- ✅ Full async/await support
- ✅ TypeScript with strict type checking
- ✅ Works in multiple environments (local dev, CI/CD, Azure services)

## Prerequisites

- Node.js 18+ installed
- An Azure subscription
- An Azure Key Vault with at least one secret
- Authentication set up (see Authentication section below)

## Installation

```bash
npm install
```

This installs:
- `@azure/identity` - Azure authentication library
- `@azure/keyvault-secrets` - Azure Key Vault client
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your Key Vault name:
   ```bash
   AZURE_KEYVAULT_NAME=your-keyvault-name
   AZURE_SECRET_NAME=your-secret-name
   ```

3. Load environment variables (or use a package like `dotenv`):
   ```bash
   # PowerShell
   Get-Content .env | ForEach-Object { 
     if ($_ -match '^([^=]+)=(.*)$') { 
       [Environment]::SetEnvironmentVariable($matches[1], $matches[2]) 
     } 
   }
   
   # Bash
   export $(cat .env | xargs)
   ```

## Authentication

`DefaultAzureCredential` tries multiple authentication methods in order:

### 1. **Local Development (Recommended)**

Use Azure CLI:
```bash
az login
```

Or Azure Developer CLI:
```bash
azd auth login
```

### 2. **Service Principal (CI/CD)**

Set environment variables:
```bash
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

### 3. **Managed Identity (Azure Resources)**

Enable managed identity on your Azure resource (VM, App Service, Container App, etc.). No additional configuration needed!

### 4. **Certificate-Based Authentication**

```bash
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_CERTIFICATE_PATH="/path/to/cert.pem"
```

## Permissions

Your authenticated identity needs access to the Key Vault:

### Option 1: Azure RBAC (Recommended)

Assign the "Key Vault Secrets User" role:
```bash
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee <user-or-service-principal-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault-name>
```

### Option 2: Access Policies (Classic)

Add an access policy:
```bash
az keyvault set-policy \
  --name <vault-name> \
  --object-id <user-or-service-principal-object-id> \
  --secret-permissions get list
```

## Build and Run

```bash
# Build TypeScript
npm run build

# Run the program
npm start

# Or do both in one command
npm run dev
```

## Expected Output

```
🔐 Azure Identity & Key Vault Demo
==================================================
Key Vault URL: https://my-keyvault.vault.azure.net
Secret Name: my-secret

Creating DefaultAzureCredential...
✓ DefaultAzureCredential created successfully

Creating SecretClient...
✓ SecretClient created successfully

Retrieving secret 'my-secret'...
✓ Secret retrieved successfully

==================================================
Secret Details:
  Name: my-secret
  Value: secret-value-here
  Enabled: true
  Created: 2024-01-15T10:30:00.000Z
  Updated: 2024-01-15T10:30:00.000Z
==================================================
```

## Error Handling

The program includes comprehensive error handling:

### AuthenticationError
When credentials fail, you'll see helpful troubleshooting steps:
```
❌ Authentication Failed
==================================================
An authentication error occurred. This typically means:
  • No valid credentials were found
  • The credentials don't have permission to access the Key Vault
  • Azure CLI/PowerShell/Developer CLI is not logged in

To fix this, try one of the following:
[... helpful instructions ...]
```

### Key Vault Errors
- **ResourceNotFound**: Key Vault or secret doesn't exist
- **Forbidden (403)**: Missing permissions (add Key Vault Secrets User role)

## DefaultAzureCredential Chain

The credential tries these methods in order until one succeeds:

1. **EnvironmentCredential** - Service principal via env vars
2. **WorkloadIdentityCredential** - Kubernetes workload identity
3. **ManagedIdentityCredential** - Azure managed identity
4. **VisualStudioCodeCredential** - VS Code Azure Account extension
5. **AzureCliCredential** - `az login`
6. **AzurePowerShellCredential** - `Connect-AzAccount`
7. **AzureDeveloperCliCredential** - `azd auth login`

## Project Structure

```
.
├── src/
│   └── index.ts          # Main program
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variables template
└── README.md            # This file
```

## Troubleshooting

### "AZURE_KEYVAULT_NAME environment variable is required"
Set the `AZURE_KEYVAULT_NAME` environment variable to your Key Vault name.

### "Authentication Failed"
1. Run `az login` or `azd auth login`
2. Verify you're logged in: `az account show`
3. Or set service principal environment variables

### "Forbidden" or "403"
Your identity doesn't have permission. Add "Key Vault Secrets User" role:
```bash
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $(az ad signed-in-user show --query id -o tsv) \
  --scope $(az keyvault show --name <vault-name> --query id -o tsv)
```

### "ResourceNotFound"
- Check the Key Vault name is correct
- Verify the secret exists: `az keyvault secret list --vault-name <name>`
- Check you have the right Azure subscription: `az account show`

## Learn More

- [Azure Identity SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/identity/identity)
- [Azure Key Vault Secrets SDK](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/keyvault/keyvault-secrets)
- [DefaultAzureCredential Overview](https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/overview)
- [Azure Key Vault Best Practices](https://learn.microsoft.com/azure/key-vault/general/best-practices)

## License

MIT
