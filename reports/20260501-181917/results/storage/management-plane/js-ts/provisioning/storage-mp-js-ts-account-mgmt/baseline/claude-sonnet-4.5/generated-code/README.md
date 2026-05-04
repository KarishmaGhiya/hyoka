# Azure Storage Account Management

This TypeScript program demonstrates how to manage Azure Storage Accounts using the Azure Management Plane SDK (`@azure/arm-storage`).

## Features

1. **Authentication** - Uses `DefaultAzureCredential` from `@azure/identity`
2. **Create Storage Account** - Creates a new account with Standard_LRS SKU
3. **List Storage Accounts** - Lists all accounts in a resource group using async iteration
4. **Get Properties** - Retrieves detailed properties of a storage account
5. **Update Account** - Updates the account to enable blob versioning
6. **Delete Account** - Deletes the storage account (commented out for safety)

## Prerequisites

- Node.js 18 or higher
- Azure subscription
- Azure CLI installed and authenticated, OR
- Service Principal credentials configured

## Required NPM Packages

```json
{
  "@azure/arm-storage": "^18.2.0",
  "@azure/identity": "^4.0.0"
}
```

## Installation

```bash
npm install
```

## Configuration

Set the following environment variables:

```bash
# Required
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_RESOURCE_GROUP="your-resource-group"

# Optional - a unique name will be generated if not provided
export AZURE_STORAGE_ACCOUNT_NAME="mystorageaccount"

# For DefaultAzureCredential authentication, use one of:
# - Azure CLI (az login)
# - Environment variables (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
# - Managed Identity (when running in Azure)
# - Visual Studio Code
# - Azure PowerShell
```

## Usage

Run with ts-node:
```bash
npm start
```

Or compile and run:
```bash
npm run build
node dist/azure-storage-management.js
```

## Authentication Methods

The `DefaultAzureCredential` tries multiple authentication methods in order:

1. **Environment** - Service principal via environment variables
2. **Managed Identity** - When running in Azure (VM, App Service, etc.)
3. **Azure CLI** - Uses `az login` credentials
4. **Azure PowerShell** - Uses `Connect-AzAccount` credentials
5. **Visual Studio Code** - Uses VS Code Azure extension credentials

## Storage Account Details

The program creates a StorageV2 (general-purpose v2) account with:
- **SKU**: Standard_LRS (Locally Redundant Storage)
- **Location**: East US
- **TLS Version**: 1.2 minimum
- **HTTPS Only**: Enabled
- **Public Access**: Disabled for security

## Important Notes

- The delete operation is **commented out** by default to prevent accidental deletion
- Storage account names must be globally unique and 3-24 characters long
- The program demonstrates proper async/await patterns with Azure SDK
- Uses async iteration for listing resources (recommended approach)
- Includes proper error handling and logging

## Code Structure

The program follows best practices:
- Async/await for all asynchronous operations
- Proper error handling with try/catch
- Long-running operations use pollers (beginCreate + pollUntilDone)
- Async iteration for paginated results
- Type-safe TypeScript with proper interfaces

## Troubleshooting

**Authentication Failed**: Ensure you're logged in via Azure CLI (`az login`) or have service principal credentials configured.

**Resource Group Not Found**: Create the resource group first:
```bash
az group create --name your-resource-group --location eastus
```

**Storage Account Name Conflict**: Storage account names must be globally unique. The program generates a unique name using timestamp by default.

## License

MIT
