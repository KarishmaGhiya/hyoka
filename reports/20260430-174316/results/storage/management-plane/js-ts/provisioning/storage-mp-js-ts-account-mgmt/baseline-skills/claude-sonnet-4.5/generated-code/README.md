# Azure Storage Account Management Demo

This TypeScript program demonstrates how to manage Azure Storage Accounts using the Azure Management Plane SDK.

## Features

1. **Authentication** - Uses `DefaultAzureCredential` from `@azure/identity`
2. **Client Creation** - Creates a `StorageManagementClient` with credentials and subscription ID
3. **Create Storage Account** - Creates a new storage account with Standard_LRS SKU in eastus region
4. **List Storage Accounts** - Lists all storage accounts in a resource group using async iteration
5. **Get Properties** - Retrieves detailed properties of a storage account
6. **Update Account** - Updates the account to enable blob versioning and retention policies
7. **Delete Account** - Cleans up by deleting the storage account

## Prerequisites

- Node.js 16 or higher
- Azure subscription
- Appropriate Azure permissions to manage storage accounts
- Azure CLI installed and logged in, OR environment variables set for authentication

## Required Packages

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

Set the following environment variables before running:

```bash
# Required
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_RESOURCE_GROUP="your-resource-group-name"

# For authentication (choose one method)
# Option 1: Azure CLI (automatic if logged in via 'az login')

# Option 2: Service Principal
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export AZURE_TENANT_ID="your-tenant-id"

# Option 3: Managed Identity (automatic in Azure environments)
```

## Usage

### Development (with ts-node)

```bash
npm run dev
```

### Production (compile and run)

```bash
npm run build
npm start
```

## Key Concepts

### DefaultAzureCredential

The `DefaultAzureCredential` tries multiple authentication methods in order:
1. Environment variables
2. Managed Identity
3. Azure CLI
4. Azure PowerShell
5. Interactive browser

### Async/Await Patterns

The program demonstrates several async patterns:

```typescript
// Long-running operations with polling
const createPoller = await client.storageAccounts.beginCreate(...);
const result = await createPoller.pollUntilDone();

// Async iteration
for await (const account of client.storageAccounts.listByResourceGroup(...)) {
  // Process each account
}

// Direct async operations
const properties = await client.storageAccounts.getProperties(...);
```

### Storage Account Naming

Storage account names must:
- Be between 3-24 characters
- Contain only lowercase letters and numbers
- Be globally unique across Azure

## API Operations

### Create Storage Account

Uses a Long-Running Operation (LRO) pattern with polling:

```typescript
const poller = await client.storageAccounts.beginCreate(
  resourceGroup,
  accountName,
  parameters
);
const account = await poller.pollUntilDone();
```

### List Storage Accounts

Uses async iteration for paginated results:

```typescript
for await (const account of client.storageAccounts.listByResourceGroup(resourceGroup)) {
  console.log(account.name);
}
```

### Update Blob Service Properties

Updates sub-resource properties like versioning:

```typescript
await client.blobServices.setServiceProperties(
  resourceGroup,
  accountName,
  "default",
  { isVersioningEnabled: true }
);
```

## Error Handling

The program includes comprehensive error handling:

```typescript
try {
  // Operations
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
}
```

## Output Example

```
Azure Storage Account Management Demo
=====================================

Step 1: Authenticating with DefaultAzureCredential...
✓ Credential created

Step 2: Creating StorageManagementClient...
✓ Client created

Step 3: Creating Storage Account 'mystorageacct12345678'...
✓ Storage Account created: mystorageacct12345678
  - ID: /subscriptions/.../mystorageacct12345678
  - Location: eastus
  - SKU: Standard_LRS
  - Provisioning State: Succeeded

...

Demo completed successfully!
```

## Cleanup

The program automatically deletes the created storage account at the end. If the program is interrupted, you may need to manually delete the resource using:

```bash
az storage account delete --name <account-name> --resource-group <resource-group>
```

## References

- [Azure Storage Management SDK](https://www.npmjs.com/package/@azure/arm-storage)
- [Azure Identity SDK](https://www.npmjs.com/package/@azure/identity)
- [Azure Storage Documentation](https://docs.microsoft.com/azure/storage/)
