# Azure Storage Account Management with TypeScript

This example demonstrates how to manage Azure Storage Accounts using the Azure Management Plane SDK for JavaScript/TypeScript.

## Features

1. **Authentication** - Uses `DefaultAzureCredential` for flexible authentication
2. **Create Storage Account** - Creates a new storage account with Standard_LRS SKU
3. **List Storage Accounts** - Lists all storage accounts in a resource group using async iteration
4. **Get Properties** - Retrieves detailed properties of a storage account
5. **Update Account** - Enables blob versioning on the storage account
6. **Delete Account** - Demonstrates how to delete a storage account

## Prerequisites

- Node.js 16.x or higher
- An Azure subscription
- Azure CLI installed and authenticated (`az login`) OR service principal credentials

## Installation

```bash
npm install
```

This will install the required packages:
- `@azure/arm-storage` - Azure Storage Management SDK
- `@azure/identity` - Azure authentication library

## Configuration

### Option 1: Azure CLI Authentication (Recommended for development)

```bash
az login
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
```

### Option 2: Service Principal Authentication

Set the following environment variables:

```bash
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

### Resource Group

The example assumes a resource group named `rg-storage-demo` exists. Create it with:

```bash
az group create --name rg-storage-demo --location eastus
```

## Running the Example

```bash
# Using ts-node
npm start

# Or compile and run
npm run build
node dist/azure-storage-management.js
```

## Code Structure

The program follows these steps:

1. **Authenticate** - Creates a `DefaultAzureCredential` instance
2. **Create Client** - Initializes `StorageManagementClient` with credential and subscription ID
3. **Create Account** - Creates a new storage account with:
   - Standard_LRS SKU (locally redundant storage)
   - StorageV2 kind (general-purpose v2)
   - Hot access tier
   - HTTPS-only traffic
   - TLS 1.2 minimum version
   - Public blob access disabled
4. **List Accounts** - Uses async iteration (`for await`) to list all accounts
5. **Get Properties** - Retrieves and displays detailed account properties
6. **Update Account** - Enables blob versioning and updates tags
7. **Delete Account** - Shows how to delete (commented out for safety)

## Key Concepts

### DefaultAzureCredential

`DefaultAzureCredential` attempts authentication through multiple methods in order:
1. Environment variables (service principal)
2. Managed identity
3. Azure CLI
4. Azure PowerShell
5. Visual Studio Code

### Async Patterns

The example uses modern async/await patterns:

```typescript
// Long-running operations (LRO)
const poller = await client.storageAccounts.beginCreateAndWait(...);

// Async iteration
for await (const account of client.storageAccounts.list(...)) {
  console.log(account.name);
}

// Standard async operations
const account = await client.storageAccounts.getProperties(...);
```

### Management vs Data Plane

This example uses the **Management Plane** SDK (`@azure/arm-storage`):
- Creates/updates/deletes storage accounts
- Manages account configuration
- Lists resources

For working with blobs, queues, tables (data operations), use the **Data Plane** SDKs:
- `@azure/storage-blob`
- `@azure/storage-queue`
- `@azure/storage-file-share`

## Safety Notes

- The delete operation is commented out by default to prevent accidental deletion
- Storage account names must be globally unique (3-24 lowercase alphanumeric characters)
- The example generates a unique name using timestamp
- Always verify the resource group exists before running

## Cleanup

To delete the storage account and resource group:

```bash
az storage account delete --name <storage-account-name> --resource-group rg-storage-demo
az group delete --name rg-storage-demo --yes
```

## References

- [Azure Storage Management SDK Documentation](https://learn.microsoft.com/javascript/api/@azure/arm-storage)
- [Azure Identity SDK Documentation](https://learn.microsoft.com/javascript/api/@azure/identity)
- [Azure Storage Documentation](https://learn.microsoft.com/azure/storage/)
