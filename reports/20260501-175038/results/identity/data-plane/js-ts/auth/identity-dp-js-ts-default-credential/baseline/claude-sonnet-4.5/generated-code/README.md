# Azure Key Vault Authentication with DefaultAzureCredential

This TypeScript program demonstrates how to authenticate to Azure Key Vault using `DefaultAzureCredential` from the `@azure/identity` package.

## Features

- ✅ Uses `DefaultAzureCredential` for flexible authentication
- ✅ Retrieves secrets from Azure Key Vault
- ✅ Handles `AuthenticationError` with helpful error messages
- ✅ Uses async/await throughout
- ✅ Full TypeScript type safety

## Prerequisites

- Node.js 18+ installed
- An Azure subscription
- An Azure Key Vault with at least one secret
- Authentication method (one of the following):
  - Azure CLI: Run `az login`
  - Service Principal credentials (environment variables)
  - Managed Identity (if running on Azure)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

3. Edit `.env` with your Key Vault details:

```env
KEY_VAULT_URL=https://your-keyvault-name.vault.azure.net/
SECRET_NAME=my-secret-name
```

## Authentication Methods

`DefaultAzureCredential` tries these methods in order:

1. **EnvironmentCredential** - Service Principal via environment variables
2. **WorkloadIdentityCredential** - Kubernetes workload identity
3. **ManagedIdentityCredential** - Azure managed identity
4. **VisualStudioCodeCredential** - VS Code Azure Account extension
5. **AzureCliCredential** - Azure CLI (`az login`)
6. **AzurePowerShellCredential** - Azure PowerShell
7. **AzureDeveloperCliCredential** - Azure Developer CLI (`azd auth login`)

### Option 1: Azure CLI (Recommended for Development)

```bash
az login
```

### Option 2: Service Principal

Set these environment variables in `.env`:

```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### Option 3: Managed Identity

No configuration needed when running on Azure resources (VM, App Service, etc.)

## Usage

1. Build the TypeScript code:

```bash
npm run build
```

2. Run the program:

```bash
npm start
```

Or run both steps together:

```bash
npm run dev
```

## Granting Key Vault Access

Ensure your identity has permissions to read secrets:

```bash
# For your user account (Azure CLI)
az keyvault set-policy --name your-keyvault-name \
  --upn user@example.com \
  --secret-permissions get list

# For a Service Principal
az keyvault set-policy --name your-keyvault-name \
  --spn your-client-id \
  --secret-permissions get list
```

## Example Output

Success:
```
Initializing Azure authentication...
Key Vault URL: https://my-keyvault.vault.azure.net/
Secret Name: database-password

Attempting to retrieve secret...

✓ Authentication successful!
Secret Name: database-password
Secret Value: MySecretPassword123!
Created On: 2026-04-15T10:30:00.000Z
Updated On: 2026-04-20T14:45:00.000Z
```

Authentication failure:
```
✗ Authentication failed!
Error: DefaultAzureCredential failed to retrieve a token from the included credentials.

Possible solutions:
1. Run 'az login' to authenticate via Azure CLI
2. Set environment variables for Service Principal:
   - AZURE_TENANT_ID
   - AZURE_CLIENT_ID
   - AZURE_CLIENT_SECRET
3. Use Managed Identity if running on Azure resources
4. Ensure you have proper permissions to access Key Vault
```

## Project Structure

```
.
├── src/
│   └── index.ts          # Main application code
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variable template
└── README.md            # This file
```

## Error Handling

The program handles two types of errors:

1. **AuthenticationError**: Credential failures with helpful troubleshooting tips
2. **General Errors**: Key Vault or secret not found, permission issues, etc.

## Best Practices

- ✅ Never hardcode credentials in source code
- ✅ Use `DefaultAzureCredential` for flexibility across environments
- ✅ Use Managed Identity in production (Azure resources)
- ✅ Use Azure CLI for local development
- ✅ Grant minimal required permissions (principle of least privilege)

## Learn More

- [Azure Identity SDK](https://www.npmjs.com/package/@azure/identity)
- [Azure Key Vault Secrets SDK](https://www.npmjs.com/package/@azure/keyvault-secrets)
- [DefaultAzureCredential Documentation](https://learn.microsoft.com/en-us/javascript/api/@azure/identity/defaultazurecredential)
