# Azure Storage Account Management with TypeScript

This program demonstrates comprehensive Azure Storage Account management using the `@azure/arm-storage` management plane SDK.

## Features

1. **Authentication** - Uses `DefaultAzureCredential` from `@azure/identity`
2. **Create Storage Account** - Creates a new account with Standard_LRS SKU
3. **List Storage Accounts** - Iterates through accounts using async iteration
4. **Get Properties** - Retrieves detailed account configuration
5. **Update Account** - Enables blob versioning
6. **Delete Account** - Cleans up resources

## Prerequisites

- Node.js 18+ installed
- Azure subscription
- Azure CLI installed and authenticated (`az login`)
- A resource group created in your subscription

## Required NPM Packages

```json
{
  "@azure/arm-storage": "^18.2.0",
  "@azure/identity": "^4.5.0"
}
```

## Environment Variables

Set these variables before running:

```bash
# Required
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_RESOURCE_GROUP="your-resource-group-name"

# Optional (will use defaults if not set)
export STORAGE_ACCOUNT_NAME="mystorageaccount123"
```

### Authentication Methods

`DefaultAzureCredential` tries these in order:

1. **Environment Variables** (Service Principal)
   ```bash
   export AZURE_TENANT_ID="..."
   export AZURE_CLIENT_ID="..."
   export AZURE_CLIENT_SECRET="..."
   ```

2. **Workload Identity** (Kubernetes)
3. **Managed Identity** (Azure VMs, App Service, etc.)
4. **Azure CLI** (`az login`)
5. **Azure PowerShell** (`Connect-AzAccount`)
6. **Azure Developer CLI** (`azd auth login`)

## Installation

```bash
# Install dependencies
npm install

# For development with ts-node
npm install --save-dev ts-node @types/node typescript
```

## Usage

### Development Mode (with ts-node)

```bash
npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Run compiled JavaScript
npm start
```

### Direct Execution

```bash
# With ts-node
npx ts-node storage-account-management.ts

# After compilation
node dist/storage-account-management.js
```

## Program Flow

1. **Authenticate** - Creates credential using `DefaultAzureCredential()`
2. **Initialize Client** - Creates `StorageManagementClient` with credential and subscription
3. **Create Account** - Uses `beginCreate()` with long-running operation (LRO) pattern
4. **List Accounts** - Demonstrates async iteration with `for await...of`
5. **Get Properties** - Retrieves full account details including endpoints
6. **Update Account** - Enables versioning and updates tags
7. **Delete Account** - Cleans up the created resource

## Key Concepts

### Long-Running Operations (LRO)

```typescript
const createPoller = await client.storageAccounts.beginCreate(...);
const result = await createPoller.pollUntilDone();
```

### Async Iteration

```typescript
const accountsIterable = client.storageAccounts.listByResourceGroup(resourceGroupName);

for await (const account of accountsIterable) {
  console.log(account.name);
}
```

### Storage Account Configuration

- **SKU**: Standard_LRS (Locally Redundant Storage)
- **Kind**: StorageV2 (General Purpose v2)
- **Location**: eastus
- **TLS**: Minimum TLS 1.2
- **HTTPS Only**: Enabled
- **Public Access**: Disabled

## Error Handling

The program includes comprehensive error handling:

```typescript
try {
  // Operations
} catch (error) {
  if (error instanceof Error) {
    console.error(`Message: ${error.message}`);
    if ('statusCode' in error) {
      console.error(`Status Code: ${(error as any).statusCode}`);
    }
  }
}
```

## Common Issues

### Authentication Failures

```bash
# Login with Azure CLI
az login

# Set subscription
az account set --subscription "your-subscription-id"

# Verify
az account show
```

### Resource Group Not Found

```bash
# Create resource group if needed
az group create --name rg-storage-demo --location eastus
```

### Storage Account Name Rules

- Must be 3-24 characters
- Lowercase letters and numbers only
- Must be globally unique across Azure

## Output Example

```
=== Azure Storage Account Management Demo ===

1. Authenticating with DefaultAzureCredential...
✓ Authentication configured

2. Creating StorageManagementClient...
✓ Client created for subscription: abc123...

3. Creating Storage Account...
   Name: stgdemo123456
   Resource Group: rg-storage-demo
   Location: eastus
   SKU: Standard_LRS
   Waiting for storage account creation...
✓ Storage Account created: stgdemo123456
   ID: /subscriptions/.../stgdemo123456
   Provisioning State: Succeeded

4. Listing Storage Accounts in resource group...
   [1] stgdemo123456
       Location: eastus
       SKU: Standard_LRS
       Kind: StorageV2
       Status: available

✓ Found 1 storage account(s)

5. Getting Storage Account properties...
✓ Retrieved properties for: stgdemo123456
   Primary Location: eastus
   Status: available
   HTTPS Only: true
   Primary Endpoints:
     - Blob: https://stgdemo123456.blob.core.windows.net/

6. Updating Storage Account to enable blob versioning...
✓ Storage Account updated: stgdemo123456
   Versioning Enabled: true

7. Deleting Storage Account...
✓ Storage Account deleted successfully

=== Demo completed successfully ===
```

## Additional Resources

- [@azure/arm-storage Documentation](https://learn.microsoft.com/javascript/api/@azure/arm-storage)
- [@azure/identity Documentation](https://learn.microsoft.com/javascript/api/@azure/identity)
- [Azure Storage Account Overview](https://learn.microsoft.com/azure/storage/common/storage-account-overview)
- [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)

## License

MIT
