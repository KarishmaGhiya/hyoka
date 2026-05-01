# Azure Resource Group Manager

A TypeScript program demonstrating Azure Resource Group management using the Azure Management Plane SDK.

## Features

This program demonstrates:
1. **Authentication** - Using DefaultAzureCredential from @azure/identity
2. **Create** - Creating a new resource group in "eastus" region
3. **List** - Iterating through all resource groups in the subscription
4. **Get** - Retrieving details of a specific resource group
5. **Update** - Adding tags to an existing resource group
6. **Delete** - Deleting a resource group using beginDeleteAndWait

## Required Packages

```bash
npm install @azure/arm-resources @azure/identity
npm install -D typescript ts-node @types/node
```

## Prerequisites

1. **Azure Subscription** - You need an active Azure subscription
2. **Authentication** - DefaultAzureCredential supports multiple authentication methods:
   - Azure CLI: `az login`
   - Environment variables: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
   - Managed Identity (when running in Azure)
   - Visual Studio Code Azure Account extension

3. **Set Subscription ID**:
   ```bash
   # Windows PowerShell
   $env:AZURE_SUBSCRIPTION_ID="your-subscription-id"
   
   # Linux/Mac
   export AZURE_SUBSCRIPTION_ID="your-subscription-id"
   ```

## Installation

```bash
npm install
```

## Usage

```bash
# Run with ts-node
npm start

# Or compile and run
npm run build
node dist/index.js
```

## How It Works

### 1. Authentication
```typescript
const credential = new DefaultAzureCredential();
```
DefaultAzureCredential automatically tries multiple authentication methods in order.

### 2. Client Creation
```typescript
const client = new ResourceManagementClient(credential, subscriptionId);
```

### 3. Create Resource Group
```typescript
await client.resourceGroups.createOrUpdate(resourceGroupName, {
  location: "eastus",
  tags: { environment: "demo" }
});
```

### 4. List Resource Groups
```typescript
for await (const rg of client.resourceGroups.list()) {
  console.log(rg.name);
}
```

### 5. Get Resource Group
```typescript
const rgDetails = await client.resourceGroups.get(resourceGroupName);
```

### 6. Update Resource Group
```typescript
await client.resourceGroups.update(resourceGroupName, {
  tags: { ...existingTags, newTag: "value" }
});
```

### 7. Delete Resource Group
```typescript
await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
```

## Async/Await Patterns

The program uses proper async/await patterns:
- All Azure SDK calls are awaited
- Async iterators (`for await...of`) for paginated results
- Error handling with try/catch
- Long-running operations use `beginDeleteAndWait` for automatic polling

## Important Notes

- The program creates a resource group named `rg-demo-typescript`
- The resource group is deleted at the end of the program
- Delete operations can take several minutes to complete
- Proper error handling is included for all operations

## Cleanup

The program automatically deletes the created resource group. If the program is interrupted, you may need to manually delete the resource group:

```bash
az group delete --name rg-demo-typescript --yes --no-wait
```
