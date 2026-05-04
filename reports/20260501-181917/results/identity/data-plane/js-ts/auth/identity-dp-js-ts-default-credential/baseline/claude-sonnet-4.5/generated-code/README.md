# Azure Key Vault Authentication with DefaultAzureCredential

This TypeScript program demonstrates how to authenticate with Azure Key Vault using DefaultAzureCredential from the Azure Identity SDK.

## Features

- ✅ Uses DefaultAzureCredential for flexible authentication
- ✅ Creates a SecretClient for Azure Key Vault
- ✅ Retrieves and displays secrets
- ✅ Handles AuthenticationError specifically
- ✅ Provides detailed error messages and troubleshooting tips
- ✅ Full TypeScript with async/await

## Prerequisites

- Node.js (v16 or higher)
- An Azure subscription
- An Azure Key Vault with at least one secret
- Authentication configured (one of the following):
  - Azure CLI installed and logged in (`az login`)
  - Service principal credentials as environment variables
  - Managed identity (when running on Azure)

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Set your Key Vault URL:
   ```
   AZURE_KEYVAULT_URL=https://your-vault-name.vault.azure.net
   SECRET_NAME=my-secret
   ```

3. Authenticate using one of these methods:

   **Option A: Azure CLI (recommended for local development)**
   ```bash
   az login
   ```

   **Option B: Service Principal (for CI/CD)**
   ```bash
   export AZURE_TENANT_ID=your-tenant-id
   export AZURE_CLIENT_ID=your-client-id
   export AZURE_CLIENT_SECRET=your-client-secret
   ```

## Usage

### Build and run:

```bash
npm run build
npm start
```

### Development mode (with ts-node):

```bash
npm run dev
```

## How It Works

The program uses **DefaultAzureCredential**, which attempts authentication in this order:

1. **EnvironmentCredential** - Service principal from environment variables
2. **WorkloadIdentityCredential** - Kubernetes workload identity
3. **ManagedIdentityCredential** - Azure managed identity
4. **VisualStudioCodeCredential** - VS Code Azure Account extension
5. **AzureCliCredential** - Azure CLI login
6. **AzurePowerShellCredential** - Azure PowerShell
7. **AzureDeveloperCliCredential** - Azure Developer CLI

The first successful authentication method is used to access the Key Vault.

## Error Handling

The program specifically handles:

- **AuthenticationError** - Credential failures with troubleshooting guidance
- **SecretNotFound** - When the secret doesn't exist
- **Forbidden** - When permissions are insufficient
- **ResourceNotFound** - When the Key Vault doesn't exist

## Required Permissions

Your Azure identity needs the following RBAC role on the Key Vault:

- **Key Vault Secrets User** (for reading secrets)

Or a Key Vault access policy with GET permission for secrets.

## Example Output

```
Initializing Azure authentication...
Key Vault URL: https://my-vault.vault.azure.net
Secret Name: my-secret

Creating SecretClient...
Retrieving secret "my-secret" from Key Vault...

✓ Successfully retrieved secret!
Secret Name: my-secret
Secret Value: super-secret-value
Secret Version: abc123def456
Created On: 2026-05-01T18:00:00.000Z
Updated On: 2026-05-01T18:00:00.000Z
```

## Dependencies

- `@azure/identity` - Azure authentication library
- `@azure/keyvault-secrets` - Azure Key Vault client
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions

## License

MIT
