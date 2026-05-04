# Azure Storage Account Management Example

This TypeScript program demonstrates managing Azure Storage Accounts using the management plane SDK (`@azure/arm-storage`).

## Features

1. **Authentication** - Uses `DefaultAzureCredential` from `@azure/identity`
2. **Create Storage Account** - Creates a new account with Standard_LRS SKU
3. **List Storage Accounts** - Lists all accounts in a resource group using async iteration
4. **Get Properties** - Retrieves detailed properties of a storage account
5. **Update Account** - Enables blob versioning on the account
6. **Delete Account** - Removes the storage account

## Prerequisites

- Node.js 16+ and npm
- Azure subscription
- Resource group created in Azure
- Authentication configured (one of):
  - Azure CLI logged in (`az login`)
  - Environment variables set (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
  - Managed Identity (if running on Azure)

## Installation

```bash
npm install
```

## Configuration

Set the following environment variables:

```bash
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_RESOURCE_GROUP="your-resource-group"
```

Or update the values directly in `index.ts`.

## Running

```bash
npm start
```

Or compile and run:

```bash
npx tsc
node dist/index.js
```

## Key Dependencies

- `@azure/arm-storage` - Management plane SDK for Storage Accounts
- `@azure/identity` - Authentication library with DefaultAzureCredential

## Important Notes

- Storage account names must be globally unique, 3-24 characters, lowercase letters and numbers only
- The program generates a unique name using timestamp
- The create operation is long-running and uses a poller pattern
- The program cleans up by deleting the created storage account
- Async iteration is used for listing resources (standard pattern in Azure SDKs)

## Proper Async/Await Patterns

The code demonstrates:
- `await` for long-running operations (create, delete)
- `for await...of` for async iterators (list operations)
- `await` for standard async operations (get, update)
- Error handling with try/catch
- Proper cleanup in case of errors
