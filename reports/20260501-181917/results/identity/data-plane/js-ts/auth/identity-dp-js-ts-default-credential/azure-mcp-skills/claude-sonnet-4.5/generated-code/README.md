# Azure Key Vault Authentication with DefaultAzureCredential

This TypeScript demo shows how to authenticate to Azure Key Vault using `DefaultAzureCredential` from the `@azure/identity` package.

## Features

- ✅ Uses `DefaultAzureCredential` for flexible authentication
- ✅ Retrieves secrets from Azure Key Vault
- ✅ Handles `AuthenticationError` with helpful troubleshooting
- ✅ Uses async/await throughout
- ✅ TypeScript with strict mode enabled
- ✅ Comprehensive error handling

## Prerequisites

1. **Azure Key Vault**: Create a Key Vault and add at least one secret
2. **Authentication**: Choose one option:
   - Azure CLI: Run `az login`
   - Service Principal: Set environment variables (see below)
   - Managed Identity: Deploy to Azure resource with MI enabled

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your values:
   ```bash
   KEY_VAULT_URL=https://your-vault-name.vault.azure.net
   SECRET_NAME=mySecret
   ```

3. (Optional) Set service principal credentials in `.env`:
   ```bash
   AZURE_TENANT_ID=<tenant-id>
   AZURE_CLIENT_ID=<client-id>
   AZURE_CLIENT_SECRET=<client-secret>
   ```

## Permissions

Ensure your identity has one of the following:

### Option 1: RBAC (Recommended)
- Role: **Key Vault Secrets User** (read-only)
- Or: **Key Vault Secrets Officer** (read/write)

### Option 2: Access Policy
- Permission: **Get** (under Secret permissions)

## Usage

### Development (with ts-node)

```bash
# Set environment variables
export KEY_VAULT_URL="https://your-vault-name.vault.azure.net"
export SECRET_NAME="mySecret"

# Run with ts-node
npm run dev
```

### Production (compiled)

```bash
# Build TypeScript
npm run build

# Set environment variables
export KEY_VAULT_URL="https://your-vault-name.vault.azure.net"
export SECRET_NAME="mySecret"

# Run compiled JavaScript
npm start
```

## DefaultAzureCredential Chain

`DefaultAzureCredential` tries credentials in this order:

1. **EnvironmentCredential** - Service principal from env vars
2. **WorkloadIdentityCredential** - Kubernetes workload identity
3. **ManagedIdentityCredential** - Azure resource managed identity
4. **VisualStudioCodeCredential** - VS Code Azure account
5. **AzureCliCredential** - `az login` session
6. **AzurePowerShellCredential** - `Connect-AzAccount` session
7. **AzureDeveloperCliCredential** - `azd auth login` session

## Error Handling

The program handles:

- ✅ **AuthenticationError**: Credential failures with troubleshooting tips
- ✅ **Missing environment variables**: Clear error messages
- ✅ **Permission errors**: RBAC/access policy guidance
- ✅ **Secret not found**: Helpful feedback

## Example Output

### Success

```
Initializing DefaultAzureCredential...
Creating SecretClient...
Retrieving secret: mySecret...

✓ Successfully retrieved secret!
Secret Name: mySecret
Secret Value: my-secret-value-123
Secret Properties:
  - Enabled: true
  - Created On: 2024-01-15T10:30:00.000Z
  - Updated On: 2024-01-20T14:45:00.000Z
```

### Authentication Error

```
✗ Authentication Failed!
Error Code: 401
Error Message: Authentication failed...

Troubleshooting:
1. Ensure you're logged in via Azure CLI: az login
2. Or set service principal environment variables:
   - AZURE_TENANT_ID
   - AZURE_CLIENT_ID
   - AZURE_CLIENT_SECRET
3. Verify you have 'Get' permission for secrets in the Key Vault
```

## Project Structure

```
.
├── src/
│   └── index.ts          # Main application code
├── dist/                 # Compiled JavaScript (after build)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variable template
└── README.md             # This file
```

## Learn More

- [Azure Identity SDK](https://www.npmjs.com/package/@azure/identity)
- [Azure Key Vault Secrets SDK](https://www.npmjs.com/package/@azure/keyvault-secrets)
- [DefaultAzureCredential Documentation](https://learn.microsoft.com/en-us/javascript/api/@azure/identity/defaultazurecredential)
