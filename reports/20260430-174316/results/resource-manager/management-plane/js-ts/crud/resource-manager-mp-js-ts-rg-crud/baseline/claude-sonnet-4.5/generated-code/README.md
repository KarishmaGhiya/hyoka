# Azure Resource Group Manager

A TypeScript program demonstrating Azure Resource Group management using the management plane SDK.

## Features

This program demonstrates:
1. **Authentication** using DefaultAzureCredential from @azure/identity
2. **Client Creation** with ResourceManagementClient
3. **Create** a new resource group in "eastus" region
4. **List** all resource groups using async iteration
5. **Get** details of a specific resource group
6. **Update** resource group by adding tags
7. **Delete** resource group using beginDeleteAndWait

## Required Packages

```json
{
  "@azure/arm-resources": "^5.2.0",
  "@azure/identity": "^4.0.0"
}
```

## Prerequisites

1. **Azure Subscription**: You need an active Azure subscription
2. **Authentication**: Set up one of the following:
   - Azure CLI: Run `az login`
   - Service Principal: Set environment variables:
     - `AZURE_TENANT_ID`
     - `AZURE_CLIENT_ID`
     - `AZURE_CLIENT_SECRET`
   - Managed Identity: If running on Azure resources

3. **Subscription ID**: Set the environment variable:
   ```bash
   export AZURE_SUBSCRIPTION_ID="your-subscription-id"
   ```

## Installation

```bash
npm install
```

## Usage

### Run with ts-node (development)
```bash
npm run dev
```

### Build and run (production)
```bash
npm run build
npm start
```

## Environment Variables

- `AZURE_SUBSCRIPTION_ID` (required): Your Azure subscription ID

## How It Works

### 1. Authentication
```typescript
const credential = new DefaultAzureCredential();
```
DefaultAzureCredential automatically tries multiple authentication methods in order.

### 2. Create Client
```typescript
const client = new ResourceManagementClient(credential, subscriptionId);
```

### 3. Create Resource Group
```typescript
const createParams: ResourceGroup = {
  location: "eastus",
  tags: { environment: "demo" }
};
await client.resourceGroups.createOrUpdate(resourceGroupName, createParams);
```

### 4. List Resource Groups
```typescript
for await (const resourceGroup of client.resourceGroups.list()) {
  console.log(resourceGroup.name);
}
```

### 5. Get Resource Group
```typescript
const rg = await client.resourceGroups.get(resourceGroupName);
```

### 6. Update Resource Group
```typescript
const updateParams: ResourceGroup = {
  location: rg.location,
  tags: { ...rg.tags, newTag: "value" }
};
await client.resourceGroups.createOrUpdate(resourceGroupName, updateParams);
```

### 7. Delete Resource Group
```typescript
await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
```

## Output Example

```
============================================================
Azure Resource Group Management Demo
============================================================
Authenticating with DefaultAzureCredential...
Creating ResourceManagementClient for subscription: xxxxx

Creating resource group: rg-demo-1234567890 in eastus...
Resource group created successfully:
  Name: rg-demo-1234567890
  Location: eastus
  ID: /subscriptions/.../resourceGroups/rg-demo-1234567890

Listing all resource groups in subscription...
  1. rg-demo-1234567890 (eastus)
  2. another-rg (westus)
Total resource groups: 2

Getting details of resource group: rg-demo-1234567890...
Resource group details:
  Name: rg-demo-1234567890
  Location: eastus
  Provisioning State: Succeeded
  Tags: { environment: 'demo', purpose: 'testing' }

Updating resource group with additional tag...
Resource group updated successfully
  Updated tags: { environment: 'demo', purpose: 'testing', updatedAt: '...', status: 'modified' }

Deleting resource group: rg-demo-1234567890...
This may take a few moments...
Resource group deleted successfully

Verifying deletion...
Confirmed: Resource group no longer exists

✅ All operations completed successfully!
```

## Error Handling

The program includes comprehensive error handling:
- Checks for required environment variables
- Catches and logs authentication errors
- Handles API errors with detailed messages
- Verifies operations completed successfully

## Notes

- The program creates a resource group with a timestamp in the name to avoid conflicts
- The deletion operation may take several minutes to complete
- Ensure you have proper permissions in your Azure subscription
- The `beginDeleteAndWait` method blocks until deletion is complete
