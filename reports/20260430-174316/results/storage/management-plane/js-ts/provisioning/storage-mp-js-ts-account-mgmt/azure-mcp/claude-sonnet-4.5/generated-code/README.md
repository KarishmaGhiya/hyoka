# Azure Storage Account Management - TypeScript

This program demonstrates how to manage Azure Storage Accounts using the Azure Management Plane SDK for JavaScript/TypeScript.

## Features

1. **Authentication** - Uses `DefaultAzureCredential` for flexible authentication
2. **Create Storage Account** - Creates a new account with Standard_LRS SKU
3. **List Accounts** - Lists all storage accounts in a resource group using async iteration
4. **Get Properties** - Retrieves detailed properties of a storage account
5. **Update Account** - Updates the account to enable blob versioning
6. **Delete Account** - Removes the storage account

## Prerequisites

- Node.js 18+ installed
- Azure subscription
- Resource group already created
- Azure CLI installed and logged in, OR environment variables set for authentication

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
# Windows PowerShell
$env:AZURE_SUBSCRIPTION_ID="your-subscription-id"
$env:RESOURCE_GROUP_NAME="your-resource-group"

# Linux/Mac
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export RESOURCE_GROUP_NAME="your-resource-group"
```

Or edit the values directly in `index.ts`.

## Authentication Options

`DefaultAzureCredential` tries multiple authentication methods in order:

1. **Environment variables** - AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
2. **Managed Identity** - If running on Azure (VM, App Service, etc.)
3. **Azure CLI** - If logged in via `az login`
4. **Visual Studio Code** - If Azure Account extension is signed in
5. **Interactive browser** - Fallback option

## Running the Program

```bash
# Using ts-node
npm start

# Or compile and run
npm run build
node dist/index.js
```

## Key Concepts

### Async/Await Patterns

The program uses modern async/await throughout:

```typescript
// Creating a storage account (with long-running operation)
const createPoller = await client.storageAccounts.beginCreateAndWait(
  resourceGroupName,
  storageAccountName,
  createParams
);

// Listing accounts with async iteration
for await (const account of client.storageAccounts.listByResourceGroup(resourceGroupName)) {
  console.log(account.name);
}

// Getting properties
const properties = await client.storageAccounts.getProperties(
  resourceGroupName,
  storageAccountName
);
```

### Storage Account Requirements

- **Name**: 3-24 characters, lowercase letters and numbers only
- **Globally unique**: Must be unique across all of Azure
- **SKU Options**: Standard_LRS, Standard_GRS, Standard_RAGRS, Standard_ZRS, Premium_LRS, etc.
- **Kind**: StorageV2 (recommended), BlobStorage, or Storage

## Important Notes

- Storage account names must be globally unique across Azure
- The program generates a unique name using timestamp
- Deletion is permanent and cannot be undone
- Standard_LRS provides locally redundant storage (3 copies in one region)
- Blob versioning helps protect against accidental deletion/modification

## Error Handling

The program includes comprehensive error handling:
- Try-catch blocks around all operations
- Detailed error messages with context
- Proper exit codes for CI/CD integration

## Next Steps

- Add error retry logic for transient failures
- Implement additional storage account configurations
- Add blob service property management
- Configure network rules and firewall settings
- Enable advanced threat protection
