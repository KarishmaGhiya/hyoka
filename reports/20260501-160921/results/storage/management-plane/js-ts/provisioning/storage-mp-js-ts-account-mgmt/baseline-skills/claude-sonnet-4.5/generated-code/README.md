# Azure Storage Account Manager

A TypeScript application demonstrating Azure Storage Account management using the Azure Management Plane SDK.

## Features

This program demonstrates:

1. **Authentication** - Using `DefaultAzureCredential` from `@azure/identity`
2. **Create Storage Account** - Creates a new storage account with Standard_LRS SKU
3. **List Storage Accounts** - Lists all storage accounts in a resource group using async iteration
4. **Get Properties** - Retrieves detailed properties of a storage account
5. **Update Account** - Updates storage account settings (enables blob versioning)
6. **Delete Account** - Deletes the storage account

## Prerequisites

- Node.js 18.x or later
- Azure subscription
- Azure CLI (for local development authentication) or service principal credentials
- An existing Azure resource group

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

## Authentication

The program uses `DefaultAzureCredential`, which tries the following authentication methods in order:

1. **Environment variables** (Service Principal)
   ```bash
   export AZURE_TENANT_ID="<tenant-id>"
   export AZURE_CLIENT_ID="<client-id>"
   export AZURE_CLIENT_SECRET="<client-secret>"
   ```

2. **Managed Identity** (when running in Azure)

3. **Azure CLI** (for local development)
   ```bash
   az login
   ```

4. **Azure PowerShell** (alternative for local development)
   ```bash
   Connect-AzAccount
   ```

## Configuration

Set the following environment variables before running:

```bash
# Required
export AZURE_SUBSCRIPTION_ID="<your-subscription-id>"
export AZURE_RESOURCE_GROUP="<your-resource-group>"

# Optional (will generate unique name if not provided)
export STORAGE_ACCOUNT_NAME="mystorageaccount123"
```

**Important**: Storage account names must be:
- 3-24 characters long
- Lowercase letters and numbers only
- Globally unique across Azure

## Running the Program

### Using ts-node (Development)

```bash
npm start
```

### Using TypeScript compiler

```bash
npm run build
node dist/storage-account-manager.js
```

### Using ts-node-dev (Auto-reload)

```bash
npm run dev
```

## Expected Output

```
=== Azure Storage Account Management Demo ===

Step 1: Authenticating with DefaultAzureCredential...
Step 2: Creating StorageManagementClient...
✓ Client created successfully

Step 3: Creating Storage Account...
  Name: storage1234567890
  Resource Group: myResourceGroup
  Location: eastus
  SKU: Standard_LRS

✓ Storage Account created successfully
  ID: /subscriptions/.../storageAccounts/storage1234567890
  Provisioning State: Succeeded

Step 4: Listing all Storage Accounts in resource group...
  [1] storage1234567890
      Location: eastus
      SKU: Standard_LRS
      Kind: StorageV2
✓ Found 1 storage account(s)

Step 5: Getting Storage Account properties...
  Name: storage1234567890
  Location: eastus
  SKU: Standard_LRS
  Kind: StorageV2
  Creation Time: 2026-05-01T...
  Primary Location: eastus
  Status of Primary: available
  Access Tier: Hot
  HTTPS Only: true
  Minimum TLS Version: TLS1_2
  Blob Versioning Enabled: false

Step 6: Updating Storage Account to enable blob versioning...
✓ Storage Account updated successfully
  Blob Versioning Enabled: true

  Verified - Blob Versioning: true

Step 7: Deleting Storage Account...
  Deleting: storage1234567890...
✓ Storage Account deleted successfully

Verifying deletion...
✓ Confirmed: Storage Account no longer exists

=== Demo completed successfully! ===
```

## Key Concepts

### Async/Await Patterns

The program uses modern async/await patterns throughout:

```typescript
// Long-running operation with poller
const createPoller = await client.storageAccounts.beginCreate(...);
const account = await createPoller.pollUntilDone();

// Async iteration
for await (const account of client.storageAccounts.listByResourceGroup(...)) {
  console.log(account.name);
}

// Direct async operations
const properties = await client.storageAccounts.getProperties(...);
```

### Error Handling

All operations are wrapped in try-catch blocks with detailed error information:

```typescript
catch (error: any) {
  console.error(`Message: ${error.message}`);
  console.error(`Status Code: ${error.statusCode}`);
  console.error(`Error Code: ${error.code}`);
}
```

### Storage Account Configuration

The example creates a storage account with:
- **SKU**: `Standard_LRS` (Locally Redundant Storage)
- **Kind**: `StorageV2` (General-purpose v2)
- **Access Tier**: Hot
- **Security**: HTTPS only, TLS 1.2 minimum, no public blob access
- **Versioning**: Enabled via update operation

## Troubleshooting

### Authentication Errors

If you see authentication errors:
1. Ensure you're logged in: `az login`
2. Check your subscription: `az account show`
3. Set the correct subscription: `az account set --subscription <subscription-id>`

### Resource Group Not Found

Create a resource group first:
```bash
az group create --name myResourceGroup --location eastus
```

### Storage Account Name Conflict

If the name is already taken, change the `STORAGE_ACCOUNT_NAME` environment variable to a unique value.

### Permission Errors

Ensure your account has the `Storage Account Contributor` role:
```bash
az role assignment create \
  --assignee <user-or-service-principal> \
  --role "Storage Account Contributor" \
  --scope /subscriptions/<subscription-id>/resourceGroups/<resource-group>
```

## Resources

- [Azure Storage Management SDK Documentation](https://learn.microsoft.com/javascript/api/@azure/arm-storage)
- [Azure Identity SDK Documentation](https://learn.microsoft.com/javascript/api/@azure/identity)
- [Storage Account REST API Reference](https://learn.microsoft.com/rest/api/storagerp)
- [DefaultAzureCredential Documentation](https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential)

## License

MIT
