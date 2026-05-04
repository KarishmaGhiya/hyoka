# Azure DefaultAzureCredential Example

This TypeScript program demonstrates how to authenticate an Azure SDK client using `DefaultAzureCredential` and retrieve a secret from Azure Key Vault.

## Features

- ✅ Uses `DefaultAzureCredential` for flexible authentication
- ✅ Creates a `SecretClient` to interact with Azure Key Vault
- ✅ Retrieves and displays secret values
- ✅ Comprehensive error handling for authentication failures
- ✅ Async/await throughout
- ✅ TypeScript with strict type checking

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **Azure Key Vault** with at least one secret
3. **Authentication** - One of the following:
   - Azure CLI installed and logged in (`az login`)
   - Service Principal credentials (environment variables)
   - Managed Identity (if running on Azure)

## Installation

```bash
npm install
```

## Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your Key Vault name:
   ```bash
   AZURE_KEYVAULT_NAME=your-keyvault-name
   SECRET_NAME=MySecret
   ```

3. Load environment variables (or use a tool like `dotenv`):
   ```bash
   # On Windows (PowerShell)
   $env:AZURE_KEYVAULT_NAME="your-keyvault-name"
   $env:SECRET_NAME="MySecret"
   
   # On Linux/Mac
   export AZURE_KEYVAULT_NAME="your-keyvault-name"
   export SECRET_NAME="MySecret"
   ```

## Authentication Setup

### Option 1: Azure CLI (Recommended for development)

```bash
az login
```

### Option 2: Service Principal

Set environment variables:

```bash
# Windows PowerShell
$env:AZURE_TENANT_ID="your-tenant-id"
$env:AZURE_CLIENT_ID="your-client-id"
$env:AZURE_CLIENT_SECRET="your-client-secret"

# Linux/Mac
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

### Option 3: Managed Identity

If running on Azure (VM, App Service, Functions, etc.), no additional configuration is needed.

## Permissions

Ensure your identity has the appropriate RBAC role on the Key Vault:

- **Key Vault Secrets User** - Read secret values
- **Key Vault Secrets Officer** - Full management of secrets

```bash
# Grant access using Azure CLI
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee <your-user-or-service-principal-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/<rg-name>/providers/Microsoft.KeyVault/vaults/<vault-name>
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

## How It Works

1. **Creates DefaultAzureCredential** - Automatically tries multiple authentication methods
2. **Initializes SecretClient** - Connects to your Key Vault
3. **Retrieves Secret** - Gets the secret value by name
4. **Displays Information** - Shows secret value, version, and metadata
5. **Handles Errors** - Catches authentication and access errors with helpful messages

## Error Handling

The program handles several types of errors:

- **AuthenticationError**: Credential failures (no valid authentication found)
- **404 Not Found**: Secret doesn't exist
- **403 Forbidden**: No permission to access the secret
- **401 Unauthorized**: Invalid or expired credentials
- **429 Too Many Requests**: Rate limiting

## DefaultAzureCredential Chain

The credential tries authentication methods in this order:

1. **EnvironmentCredential** - Service principal from environment variables
2. **WorkloadIdentityCredential** - Kubernetes workload identity
3. **ManagedIdentityCredential** - Azure managed identity
4. **VisualStudioCodeCredential** - VS Code Azure account
5. **AzureCliCredential** - Azure CLI (`az login`)
6. **AzurePowerShellCredential** - Azure PowerShell (`Connect-AzAccount`)
7. **AzureDeveloperCliCredential** - Azure Developer CLI (`azd auth login`)

## Example Output

```
Key Vault URL: https://my-vault.vault.azure.net

Creating DefaultAzureCredential...
Creating SecretClient...

Attempting to retrieve secret: MySecret

=== Secret Retrieved Successfully ===
Secret Name: MySecret
Secret Value: my-secret-value
Version: abc123def456...
Content Type: text/plain
Created On: 2024-01-15T10:30:00.000Z
Updated On: 2024-01-15T10:30:00.000Z
Enabled: true
```

## Troubleshooting

### "AZURE_KEYVAULT_NAME environment variable is not set"

Set the environment variable with your Key Vault name (without `.vault.azure.net`).

### "AuthenticationError"

- Run `az login` to authenticate with Azure CLI
- Or set service principal environment variables
- Ensure credentials have not expired

### "403 Forbidden"

- Check RBAC permissions on the Key Vault
- Grant "Key Vault Secrets User" role to your identity
- Verify Key Vault firewall settings allow your IP

### "404 Not Found"

- Verify the secret exists in your Key Vault
- Check the `SECRET_NAME` environment variable

## Dependencies

- `@azure/identity` - Azure authentication library
- `@azure/keyvault-secrets` - Key Vault Secrets SDK
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution

## License

MIT
