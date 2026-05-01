# Azure Resource Group Manager

A TypeScript program demonstrating Azure Resource Group management using the Azure Management Plane SDK.

## Features

This program demonstrates:
1. **Authentication** - Using DefaultAzureCredential from @azure/identity
2. **Client Creation** - Creating ResourceManagementClient with credentials
3. **Create** - Creating a new resource group in "eastus" region
4. **List** - Iterating through all resource groups in the subscription
5. **Read** - Getting details of a specific resource group
6. **Update** - Adding tags to an existing resource group
7. **Delete** - Deleting a resource group using beginDeleteAndWait

## Required Packages

```json
{
  "@azure/arm-resources": "^5.2.0",
  "@azure/identity": "^4.0.0"
}
```

## Prerequisites

1. Azure subscription
2. Node.js 18+ and npm
3. Azure credentials configured (one of the following):
   - Azure CLI (`az login`)
   - Service Principal environment variables
   - Managed Identity (when running in Azure)

## Environment Variables

Set the following environment variable:

```bash
# Windows (PowerShell)
$env:AZURE_SUBSCRIPTION_ID="your-subscription-id"

# Linux/macOS
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
```

## Installation

```bash
npm install
```

## Running the Program

```bash
# Using ts-node
npm start

# Or compile and run
npm run build
node dist/index.js
```

## Authentication Methods

`DefaultAzureCredential` tries the following authentication methods in order:
1. **EnvironmentCredential** - Service principal via environment variables
2. **WorkloadIdentityCredential** - Azure Kubernetes workload identity
3. **ManagedIdentityCredential** - Managed identity in Azure
4. **AzureCliCredential** - Azure CLI logged-in user
5. **AzurePowerShellCredential** - Azure PowerShell logged-in user

## Code Highlights

### Async/Await Pattern
All Azure SDK operations use async/await for clean asynchronous code:

```typescript
const createdRg = await client.resourceGroups.createOrUpdate(
  resourceGroupName,
  createParams
);
```

### Iteration Pattern
List operations return async iterables using `for await...of`:

```typescript
for await (const rg of client.resourceGroups.list()) {
  console.log(rg.name);
}
```

### Long-Running Operations
Delete operations use `beginDeleteAndWait` for automatic polling:

```typescript
await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
```

## Sample Output

```
=== Azure Resource Group Management Demo ===

1. Authenticating with DefaultAzureCredential...
   Subscription ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

2. Creating ResourceManagementClient...
   Client created successfully

3. Creating resource group: rg-demo-1234567890
   ✓ Resource group created: rg-demo-1234567890
   Location: eastus
   Provisioning State: Succeeded

4. Listing all resource groups in subscription:
   - rg-demo-1234567890 (eastus)
   - other-rg (westus)
   Total resource groups: 2

5. Getting details of resource group: rg-demo-1234567890
   Name: rg-demo-1234567890
   Location: eastus
   ID: /subscriptions/.../resourceGroups/rg-demo-1234567890
   Provisioning State: Succeeded
   Tags: { environment: 'demo', createdBy: 'typescript-sdk' }

6. Updating resource group with additional tag...
   ✓ Resource group updated
   Updated tags: { environment: 'demo', createdBy: 'typescript-sdk', lastModified: '...', status: 'updated' }

7. Deleting resource group: rg-demo-1234567890
   This operation may take a few minutes...
   ✓ Resource group deleted successfully

=== Demo completed successfully ===
```

## Error Handling

The program includes comprehensive error handling:
- Checks for required environment variables
- Catches and logs Azure SDK errors
- Exits with appropriate error codes

## Learn More

- [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)
- [@azure/arm-resources Documentation](https://www.npmjs.com/package/@azure/arm-resources)
- [@azure/identity Documentation](https://www.npmjs.com/package/@azure/identity)
