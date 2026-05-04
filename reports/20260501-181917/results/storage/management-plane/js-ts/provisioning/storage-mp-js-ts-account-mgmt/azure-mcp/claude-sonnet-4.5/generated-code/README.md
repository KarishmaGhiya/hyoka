# Azure Storage Account Management Demo

This TypeScript program demonstrates how to manage Azure Storage Accounts using the Azure Management Plane SDK (`@azure/arm-storage`).

## Features

1. **Authentication** - Uses `DefaultAzureCredential` from `@azure/identity`
2. **Create Storage Account** - Creates a new account with Standard_LRS SKU
3. **List Storage Accounts** - Uses async iteration to list accounts in a resource group
4. **Get Properties** - Retrieves detailed properties of a storage account
5. **Update Account** - Enables blob versioning on an existing account
6. **Delete Account** - Demonstrates how to delete a storage account (commented out by default)

## Prerequisites

- Node.js 18 or higher
- Azure subscription
- Azure CLI installed and logged in, or environment variables configured
- A resource group created in Azure

## Installation

```bash
npm install
```

## Configuration

Set the following environment variables:

```bash
# Required
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export RESOURCE_GROUP_NAME="your-resource-group-name"

# Optional (will generate a unique name if not provided)
export STORAGE_ACCOUNT_NAME="yourstorageaccount"
```

### Authentication Options

`DefaultAzureCredential` will attempt to authenticate using these methods in order:
1. **Environment variables** - `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`
2. **Managed Identity** - If running on Azure (VM, App Service, etc.)
3. **Azure CLI** - If logged in via `az login`
4. **Azure PowerShell** - If logged in via `Connect-AzAccount`
5. **Interactive browser** - As a fallback

For local development, the easiest method is Azure CLI:

```bash
az login
az account set --subscription "your-subscription-id"
```

## Usage

Run the TypeScript program directly:

```bash
npm start
```

Or compile and run:

```bash
npm run build
node dist/index.js
```

## Required NPM Packages

- **@azure/arm-storage** (^18.2.0) - Azure Storage management client library
- **@azure/identity** (^4.0.0) - Azure authentication library with DefaultAzureCredential

## Code Structure

The program follows these steps:

1. **Authenticate** - Creates a `DefaultAzureCredential` instance
2. **Create Client** - Initializes `StorageManagementClient` with credential and subscription
3. **Create Account** - Uses `beginCreateAndWait()` for long-running operation
4. **List Accounts** - Demonstrates async iteration over paged results
5. **Get Properties** - Retrieves full account details including endpoints
6. **Update Account** - Modifies account properties (blob versioning)
7. **Delete Account** - Shows deletion API (commented out for safety)

## Important Notes

- Storage account names must be globally unique
- Names must be 3-24 characters, lowercase letters and numbers only
- The deletion step is commented out by default to prevent accidental data loss
- All operations use proper async/await patterns
- Error handling is implemented throughout

## Storage Account SKU Options

- `Standard_LRS` - Locally Redundant Storage (used in this demo)
- `Standard_GRS` - Geo-Redundant Storage
- `Standard_RAGRS` - Read-Access Geo-Redundant Storage
- `Standard_ZRS` - Zone-Redundant Storage
- `Premium_LRS` - Premium Locally Redundant Storage

## Clean Up

To delete the created storage account, uncomment the deletion code in Step 7 of `index.ts`:

```typescript
await client.storageAccounts.delete(RESOURCE_GROUP_NAME, STORAGE_ACCOUNT_NAME);
console.log(`✓ Storage Account deleted successfully\n`);
```

## Resources

- [Azure Storage Management SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/@azure/arm-storage)
- [Azure Identity SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/@azure/identity)
- [DefaultAzureCredential Guide](https://learn.microsoft.com/en-us/javascript/api/@azure/identity/defaultazurecredential)
