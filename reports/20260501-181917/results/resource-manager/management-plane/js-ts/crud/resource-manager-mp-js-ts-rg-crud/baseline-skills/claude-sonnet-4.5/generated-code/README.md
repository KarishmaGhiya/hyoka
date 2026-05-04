# Azure Resource Group Manager

A TypeScript program demonstrating Azure Resource Group management using the management plane SDK.

## Features

This program demonstrates:
1. **Authentication** - Using DefaultAzureCredential from @azure/identity
2. **Client Creation** - Creating ResourceManagementClient with credential and subscription ID
3. **Create** - Creating a new resource group in "eastus" region with tags
4. **List** - Iterating through all resource groups in the subscription
5. **Get** - Retrieving details of a specific resource group
6. **Update** - Adding/modifying tags on a resource group
7. **Delete** - Deleting a resource group using beginDeleteAndWait for long-running operations

## Required Packages

```json
{
  "@azure/identity": "^4.0.0",
  "@azure/arm-resources": "^5.0.0"
}
```

## Prerequisites

1. Azure subscription
2. Appropriate permissions to create/manage resource groups
3. Azure credentials configured (one of):
   - Azure CLI login (`az login`)
   - Environment variables (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
   - Managed Identity (when running in Azure)
   - Visual Studio Code Azure Account extension

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your subscription ID:
   ```bash
   # Windows PowerShell
   $env:AZURE_SUBSCRIPTION_ID="your-subscription-id"

   # Windows CMD
   set AZURE_SUBSCRIPTION_ID=your-subscription-id

   # Linux/Mac
   export AZURE_SUBSCRIPTION_ID=your-subscription-id
   ```

3. Run the program:
   ```bash
   npm start
   ```

## How It Works

### Authentication
```typescript
const credential = new DefaultAzureCredential();
```
DefaultAzureCredential automatically tries multiple authentication methods in order.

### Resource Management Client
```typescript
const client = new ResourceManagementClient(credential, subscriptionId);
```

### Create Resource Group
```typescript
const createdRg = await client.resourceGroups.createOrUpdate(
  resourceGroupName,
  { location: "eastus", tags: { ... } }
);
```

### List Resource Groups (Async Iteration)
```typescript
for await (const rg of client.resourceGroups.list()) {
  console.log(rg.name);
}
```

### Get Resource Group Details
```typescript
const rg = await client.resourceGroups.get(resourceGroupName);
```

### Update Resource Group
```typescript
const updatedRg = await client.resourceGroups.update(
  resourceGroupName,
  { tags: { ... } }
);
```

### Delete Resource Group (Long-Running Operation)
```typescript
const deletePoller = await client.resourceGroups.beginDelete(resourceGroupName);
await deletePoller.pollUntilDone();
```

## Async/Await Patterns

The program demonstrates proper async/await usage:
- All Azure SDK calls return Promises and are awaited
- Long-running operations (LROs) use pollers with `pollUntilDone()`
- Async iteration with `for await...of` for paging through results
- Error handling with try/catch blocks
- Cleanup in error scenarios

## Notes

- The resource group name includes a timestamp to ensure uniqueness
- The program automatically cleans up by deleting the created resource group
- Delete operations can take several minutes to complete
- Proper error handling ensures cleanup even if operations fail
