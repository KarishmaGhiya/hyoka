# Azure Resource Group Management with TypeScript

This project demonstrates how to manage Azure Resource Groups using the Azure SDK for JavaScript/TypeScript with the management plane SDK.

## Features

This program demonstrates:
1. ✅ Authentication using `DefaultAzureCredential` from `@azure/identity`
2. ✅ Creating a `ResourceManagementClient` with credential and subscription ID
3. ✅ Creating a new resource group in "eastus" region
4. ✅ Listing all resource groups using async iteration
5. ✅ Getting details of a specific resource group
6. ✅ Updating resource group tags
7. ✅ Deleting a resource group using `beginDeleteAndWait`

## Prerequisites

- Node.js 18+ or 20+
- Azure subscription
- Azure CLI installed (for `az login`) OR service principal credentials

## Installation

```bash
npm install
```

## Required Packages

- `@azure/identity` (^4.0.0) - Authentication with DefaultAzureCredential
- `@azure/arm-resources` (^5.2.0) - Azure Resource Management SDK

## Configuration

### Option 1: Azure CLI (Recommended for Development)

```bash
az login
```

Then set your subscription ID:

```bash
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
```

Or on Windows:

```powershell
$env:AZURE_SUBSCRIPTION_ID="your-subscription-id"
```

### Option 2: Service Principal (Recommended for Production)

Create a `.env` file (copy from `.env.example`):

```bash
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### Option 3: Managed Identity

When running in Azure (VM, App Service, Container Apps, etc.), no configuration is needed. The `DefaultAzureCredential` will automatically use the managed identity.

## Usage

### Build the project

```bash
npm run build
```

### Run the compiled code

```bash
npm start
```

### Run in development mode

```bash
npm run dev
```

## Code Structure

```
src/
└── index.ts          # Main program with all resource group operations

Key sections in index.ts:
- DefaultAzureCredential setup
- ResourceManagementClient initialization
- Resource group creation with tags
- Async iteration for listing
- Get operation for details
- Update operation for tags
- Long-running delete operation with beginDeleteAndWait
```

## Key Concepts

### DefaultAzureCredential

The `DefaultAzureCredential` tries multiple authentication methods in order:
1. Environment variables (service principal)
2. Workload identity (Kubernetes)
3. Managed identity
4. Visual Studio Code
5. Azure CLI
6. Azure PowerShell
7. Azure Developer CLI

This makes the code work seamlessly in both development and production environments.

### Async/Await Patterns

The program uses modern async/await throughout:

```typescript
// Create (simple promise)
const result = await client.resourceGroups.createOrUpdate(name, params);

// List (async iteration)
for await (const rg of client.resourceGroups.list()) {
  console.log(rg.name);
}

// Delete (long-running operation)
await client.resourceGroups.beginDeleteAndWait(name);
```

### Long-Running Operations (LRO)

The `beginDeleteAndWait` method handles long-running operations automatically:
- Starts the delete operation
- Polls for completion
- Returns when the operation completes

For more control, use `beginDelete()` which returns a poller:

```typescript
const poller = await client.resourceGroups.beginDelete(name);
const result = await poller.pollUntilDone();
```

## Expected Output

```
============================================================
Azure Resource Group Management Demo
============================================================

🔐 Step 1: Authenticating with DefaultAzureCredential...
✅ Credential created successfully

🔧 Step 2: Creating ResourceManagementClient...
✅ Client created successfully
   Subscription ID: your-sub-id

📦 Step 3: Creating resource group...
   Name: rg-demo-1234567890
   Location: eastus
✅ Resource group created successfully
   ID: /subscriptions/.../resourceGroups/rg-demo-1234567890
   Provisioning State: Succeeded

📋 Step 4: Listing all resource groups in subscription...
   - rg-demo-1234567890 (eastus)
     Tags: environment=demo, createdBy=typescript-sdk
   - other-rg (westus)
✅ Found 2 resource group(s)

🔍 Step 5: Getting details of created resource group...
✅ Resource group details:
   Name: rg-demo-1234567890
   Location: eastus
   Tags:
     - environment: demo
     - createdBy: typescript-sdk

🏷️  Step 6: Updating resource group tags...
✅ Resource group updated successfully
   Updated tags:
     - environment: demo
     - createdBy: typescript-sdk
     - updated: true
     - lastModified: 2026-05-01T18:26:59.000Z

🗑️  Step 7: Deleting resource group...
   This operation may take several minutes...
✅ Resource group deleted successfully

✔️  Verifying deletion...
✅ Confirmed: Resource group no longer exists

============================================================
Demo completed successfully! 🎉
============================================================
```

## Error Handling

The program includes comprehensive error handling:
- Validates required environment variables
- Catches and displays API errors with status codes
- Verifies deletion with 404 check

## Best Practices Demonstrated

1. ✅ Use `DefaultAzureCredential` for flexible authentication
2. ✅ Use environment variables for configuration
3. ✅ Use async/await for clean asynchronous code
4. ✅ Use async iteration for paginated results
5. ✅ Use `beginDeleteAndWait` for long-running operations
6. ✅ Include proper error handling
7. ✅ Add informative logging and progress indicators
8. ✅ Verify operations (e.g., deletion confirmation)

## Cleanup

The program automatically deletes the resource group it creates. If the program is interrupted, you can manually delete the resource group:

```bash
az group delete --name rg-demo-<timestamp> --yes --no-wait
```

## License

MIT
