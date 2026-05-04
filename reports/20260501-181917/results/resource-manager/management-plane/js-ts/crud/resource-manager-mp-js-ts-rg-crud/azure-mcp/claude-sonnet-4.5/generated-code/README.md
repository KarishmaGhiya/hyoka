# Azure Resource Group Manager

A TypeScript demonstration of Azure Resource Group management using the Management Plane SDK.

## Features

This program demonstrates the following operations:

1. **Authentication** - Uses `DefaultAzureCredential` from `@azure/identity`
2. **Client Creation** - Creates a `ResourceManagementClient` with credentials and subscription ID
3. **Create Resource Group** - Creates a new resource group in the "eastus" region with tags
4. **List Resource Groups** - Iterates through all resource groups in the subscription
5. **Get Resource Group** - Retrieves detailed information about a specific resource group
6. **Update Resource Group** - Updates the resource group by adding new tags
7. **Delete Resource Group** - Deletes the resource group using `beginDeleteAndWait`

## Prerequisites

- Node.js 16+ installed
- Azure subscription
- Azure CLI installed and authenticated, OR appropriate environment variables set

## Required NPM Packages

```json
{
  "dependencies": {
    "@azure/arm-resources": "^5.2.0",
    "@azure/identity": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.0"
  }
}
```

## Installation

```bash
npm install
```

## Authentication

The program uses `DefaultAzureCredential`, which attempts authentication through multiple methods in this order:

1. **Environment variables** (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
2. **Managed Identity** (if running in Azure)
3. **Azure CLI** (if logged in with `az login`)
4. **Azure PowerShell** (if logged in)
5. **Interactive browser** (as fallback)

## Environment Variables

Set the following environment variable:

```bash
# Windows PowerShell
$env:AZURE_SUBSCRIPTION_ID="your-subscription-id"

# Windows CMD
set AZURE_SUBSCRIPTION_ID=your-subscription-id

# Linux/Mac
export AZURE_SUBSCRIPTION_ID=your-subscription-id
```

## Running the Program

### Using ts-node (recommended for development)

```bash
npm start
```

### Compile and run

```bash
npm run build
node dist/index.js
```

## Code Highlights

### Async/Await Patterns

The program uses proper async/await patterns throughout:

```typescript
// Create operation
const createResult = await client.resourceGroups.createOrUpdate(name, params);

// List operation with async iteration
for await (const rg of client.resourceGroups.list()) {
  // Process each resource group
}

// Long-running delete operation
await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
```

### Error Handling

Comprehensive try-catch block with detailed error information:

```typescript
try {
  // Operations
} catch (error) {
  if (error instanceof Error) {
    console.error(`Message: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
  }
  process.exit(1);
}
```

### Resource Cleanup

The program creates a uniquely named resource group and automatically deletes it at the end to avoid leaving resources in your subscription.

## Expected Output

```
============================================================
Azure Resource Group Management Demo
============================================================

Step 1: Authenticating with DefaultAzureCredential...
✓ Authentication configured

Step 2: Creating ResourceManagementClient...
✓ Client created for subscription: your-subscription-id

Step 3: Creating resource group...
  Name: rg-demo-1234567890
  Location: eastus
✓ Resource group created successfully
  ID: /subscriptions/.../resourceGroups/rg-demo-1234567890
  Provisioning State: Succeeded

Step 4: Listing all resource groups...
✓ Found X resource group(s):
  1. rg-demo-1234567890 (eastus)
     Tags: {"environment":"demo","purpose":"sdk-example"}

Step 5: Getting resource group details...
✓ Resource group details:
  Name: rg-demo-1234567890
  Location: eastus
  ...

Step 6: Updating resource group tags...
✓ Resource group updated successfully
  Updated Tags: {
    "environment": "demo",
    "purpose": "sdk-example",
    "updated": "true",
    "timestamp": "2026-05-01T..."
  }

Step 7: Deleting resource group...
  This operation may take a few minutes...
✓ Resource group "rg-demo-1234567890" deleted successfully

============================================================
Demo completed successfully!
============================================================
```

## Important Notes

- The resource group name includes a timestamp to ensure uniqueness
- The delete operation may take several minutes to complete
- The program uses `beginDeleteAndWait` which blocks until deletion is complete
- All operations include proper error handling
- Tags can be used to organize and track Azure resources

## License

MIT
