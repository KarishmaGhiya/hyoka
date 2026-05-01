# Azure Storage Account Management with TypeScript

This TypeScript program demonstrates how to manage Azure Storage Accounts using the Azure Management Plane SDK.

## Features

1. **Authentication**: Uses `DefaultAzureCredential` from `@azure/identity` for secure authentication
2. **Create Storage Account**: Creates a new storage account with Standard_LRS SKU in East US region
3. **List Storage Accounts**: Lists all storage accounts in a resource group using async iteration
4. **Get Properties**: Retrieves detailed properties of a storage account
5. **Update Account**: Updates the account to enable blob versioning
6. **Delete Account**: Removes the storage account

## Required Packages

```bash
npm install @azure/arm-storage @azure/identity
npm install --save-dev typescript @types/node ts-node
```

### Package Details

- **@azure/arm-storage**: Azure Storage Management Client SDK for managing storage accounts
- **@azure/identity**: Provides authentication capabilities via DefaultAzureCredential

## Prerequisites

Before running this program, ensure you have:

1. An Azure subscription
2. A resource group created in Azure
3. Appropriate Azure credentials configured (one of the following):
   - Azure CLI logged in (`az login`)
   - Environment variables set (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
   - Managed Identity (if running in Azure)
   - Visual Studio Code Azure Account extension

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_RESOURCE_GROUP="your-resource-group"
```

Or on Windows:
```powershell
$env:AZURE_SUBSCRIPTION_ID="your-subscription-id"
$env:AZURE_RESOURCE_GROUP="your-resource-group"
```

## Running the Program

### Using ts-node (development):
```bash
npm run dev
```

### Using compiled JavaScript:
```bash
npm run build
npm start
```

### Direct TypeScript execution:
```bash
npx ts-node azure-storage-management.ts
```

## Code Highlights

### Async/Await Patterns

The program demonstrates proper async/await usage:

```typescript
// Long-running operation with beginCreateAndWait
const createResult = await client.storageAccounts.beginCreateAndWait(
  resourceGroupName,
  storageAccountName,
  parameters
);

// Async iteration over paginated results
for await (const account of storageAccounts) {
  console.log(account.name);
}

// Standard async operations
const properties = await client.storageAccounts.getProperties(
  resourceGroupName,
  storageAccountName
);
```

### Error Handling

Comprehensive try-catch block with detailed error reporting:

```typescript
try {
  // Operations...
} catch (error) {
  console.error("❌ Error occurred:", error);
  if (error instanceof Error) {
    console.error("Message:", error.message);
  }
  process.exit(1);
}
```

## Expected Output

```
1. Authenticating with Azure...
2. Creating StorageManagementClient...
3. Creating Storage Account 'stgacct12345678'...
   ✓ Storage Account created: stgacct12345678
   - ID: /subscriptions/.../stgacct12345678
   - Location: eastus
   - SKU: Standard_LRS

4. Listing all Storage Accounts in resource group 'my-rg'...
   - stgacct12345678 (Standard_LRS) in eastus
   ✓ Total accounts found: 1

5. Getting properties of Storage Account 'stgacct12345678'...
   ✓ Account properties retrieved:
   - Name: stgacct12345678
   - Kind: StorageV2
   - Primary Location: eastus
   - Provisioning State: Succeeded
   - Access Tier: Hot
   - Blob Versioning Enabled: false

6. Updating Storage Account to enable blob versioning...
   ✓ Storage Account updated
   - Blob Versioning Enabled: true
   - Verified Blob Versioning: true

7. Deleting Storage Account 'stgacct12345678'...
   ✓ Storage Account deleted successfully

✅ All operations completed successfully!
```

## Notes

- Storage account names must be globally unique and between 3-24 characters
- The program generates a unique name using a timestamp
- All operations use proper error handling and async/await patterns
- The storage account is deleted at the end to clean up resources
