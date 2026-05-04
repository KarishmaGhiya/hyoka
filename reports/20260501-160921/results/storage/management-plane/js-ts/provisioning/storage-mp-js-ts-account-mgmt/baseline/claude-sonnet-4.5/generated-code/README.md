# Azure Storage Account Manager

A comprehensive TypeScript example demonstrating Azure Storage Account management using the Azure Management Plane SDK.

## Features

This program demonstrates:

1. **Authentication** - Using DefaultAzureCredential from @azure/identity
2. **Client Creation** - Creating StorageManagementClient with credentials
3. **Create Account** - Creating a Storage Account with Standard_LRS SKU in eastus
4. **List Accounts** - Listing all Storage Accounts in a resource group using async iteration
5. **Get Properties** - Retrieving properties of a Storage Account
6. **Update Account** - Enabling blob versioning on the Storage Account
7. **Delete Account** - Deleting the Storage Account

## Prerequisites

- Node.js 18+ installed
- Azure subscription
- Azure CLI installed (for authentication) OR environment variables set
- A resource group already created in Azure

## Installation

```bash
npm install
```

This installs:
- `@azure/arm-storage` - Azure Storage management client library
- `@azure/identity` - Azure authentication library
- TypeScript and related dev dependencies

## Configuration

Set the following environment variables:

```bash
# Required
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_RESOURCE_GROUP="your-resource-group-name"

# Optional (will use generated name if not provided)
export AZURE_STORAGE_ACCOUNT="mystorageaccount"

# Optional (set to true to skip deletion step)
export SKIP_DELETE="false"
```

### Authentication Methods

`DefaultAzureCredential` attempts authentication in this order:

1. **Environment Variables** - Service Principal credentials
   ```bash
   export AZURE_TENANT_ID="your-tenant-id"
   export AZURE_CLIENT_ID="your-client-id"
   export AZURE_CLIENT_SECRET="your-client-secret"
   ```

2. **Managed Identity** - When running in Azure (VM, App Service, etc.)

3. **Azure CLI** - If logged in via `az login`

4. **Azure PowerShell** - If logged in via PowerShell

5. **Interactive Browser** - Prompts for login

## Usage

### Run with ts-node (Development)

```bash
npm run dev
```

### Build and Run (Production)

```bash
npm run build
npm start
```

## Output Example

```
=== Azure Storage Account Management ===

Step 1: Authenticating with Azure...
✓ Authentication successful

Step 2: Creating StorageManagementClient...
✓ Client created

Step 3: Creating Storage Account 'mystorageacct1234567890'...
✓ Storage Account created: mystorageacct1234567890
  - Location: eastus
  - SKU: Standard_LRS
  - Kind: StorageV2

Step 4: Listing all Storage Accounts in 'myResourceGroup'...
  - mystorageacct1234567890 (eastus, Standard_LRS)
✓ Found 1 storage account(s)

Step 5: Getting properties of 'mystorageacct1234567890'...
✓ Account Properties:
  - Provisioning State: Succeeded
  - Primary Location: eastus
  - Status of Primary: available
  - HTTPS Only: true
  - Minimum TLS Version: TLS1_2
  - Blob Versioning Enabled: false

Step 6: Updating 'mystorageacct1234567890' to enable blob versioning...
  - Current versioning state: false
✓ Blob versioning enabled: true
  - Delete retention: 7 days
  - Container delete retention: 7 days

Step 7: Deleting Storage Account 'mystorageacct1234567890'...
✓ Storage Account 'mystorageacct1234567890' deleted successfully

=== All operations completed successfully ===
```

## Key Concepts

### Async/Await Patterns

The program uses modern async/await throughout:

```typescript
// Long-running operations use pollers
const createPoller = await storageClient.storageAccounts.beginCreate(...);
const result = await createPoller.pollUntilDone();

// Async iteration for listing
for await (const account of storageAccounts) {
  console.log(account.name);
}

// Simple async operations
const properties = await storageClient.storageAccounts.getProperties(...);
```

### Error Handling

Comprehensive try-catch blocks ensure proper error reporting:

```typescript
try {
  // Operations
} catch (error) {
  console.error("Error occurred:", error);
  process.exit(1);
}
```

## Important Notes

- **Storage Account Names**: Must be globally unique, 3-24 characters, lowercase letters and numbers only
- **Resource Group**: Must exist before running the program
- **Permissions**: Your Azure identity needs Contributor or Storage Account Contributor role
- **Cleanup**: The program deletes the created Storage Account by default (set `SKIP_DELETE=true` to prevent)

## Troubleshooting

### Authentication Fails
- Run `az login` to authenticate with Azure CLI
- Verify environment variables are set correctly
- Check you have appropriate permissions

### Storage Account Name Already Exists
- Storage account names must be globally unique
- Change the `AZURE_STORAGE_ACCOUNT` environment variable

### Resource Group Not Found
- Ensure the resource group exists: `az group create -n myResourceGroup -l eastus`
- Verify the `AZURE_RESOURCE_GROUP` environment variable

## References

- [Azure Storage Management SDK](https://www.npmjs.com/package/@azure/arm-storage)
- [Azure Identity SDK](https://www.npmjs.com/package/@azure/identity)
- [Azure Storage Documentation](https://docs.microsoft.com/azure/storage/)
