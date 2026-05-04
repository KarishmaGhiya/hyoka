# Azure Resource Group Manager - TypeScript Demo

This TypeScript program demonstrates complete CRUD operations on Azure Resource Groups using the Azure Management Plane SDK.

## Features

✅ **Authentication** - Uses `DefaultAzureCredential` for flexible authentication  
✅ **Create** - Creates a new resource group with tags  
✅ **Read** - Lists all resource groups and retrieves specific details  
✅ **Update** - Updates resource group tags  
✅ **Delete** - Deletes resource group with `beginDeleteAndWait`  

## Required Packages

```json
{
  "@azure/arm-resources": "^5.2.0",
  "@azure/identity": "^4.0.0"
}
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

The program requires an Azure subscription ID:

```bash
# Windows (PowerShell)
$env:AZURE_SUBSCRIPTION_ID="your-subscription-id"

# Windows (Command Prompt)
set AZURE_SUBSCRIPTION_ID=your-subscription-id

# Linux/macOS
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
```

### 3. Configure Authentication

`DefaultAzureCredential` attempts authentication in this order:

1. **Environment variables** (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`)
2. **Managed Identity** (if running on Azure)
3. **Azure CLI** (`az login`)
4. **Azure PowerShell** (`Connect-AzAccount`)
5. **Interactive browser** (fallback)

**Recommended for local development:**
```bash
az login
```

## Usage

### Run with ts-node (Development)

```bash
npm start
# or
npm run dev
```

### Build and Run (Production)

```bash
npm run build
node dist/azure-rg-manager.js
```

## What the Program Does

1. **Authenticates** using `DefaultAzureCredential`
2. **Creates** a ResourceManagementClient with your subscription
3. **Creates** a new resource group in the "eastus" region with initial tags
4. **Lists** all resource groups in the subscription using async iteration
5. **Gets** detailed information about the created resource group
6. **Updates** the resource group by adding new tags
7. **Deletes** the resource group using `beginDeleteAndWait` (long-running operation)

## Code Highlights

### Async Iteration for Listing
```typescript
for await (const resourceGroup of client.resourceGroups.list()) {
  console.log(resourceGroup.name);
}
```

### Long-Running Operation with Wait
```typescript
await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
```

### Tag Management
```typescript
await client.resourceGroups.update(resourceGroupName, {
  tags: {
    ...existingTags,
    newTag: "newValue"
  }
});
```

## Important Notes

- The program creates a resource group with a timestamp-based name
- By default, the resource group is **deleted** at the end of the demo
- Comment out the deletion section if you want to keep the resource group
- Deletion is a long-running operation and may take several minutes
- Ensure you have proper Azure permissions to create/delete resource groups

## Required Azure Permissions

Your Azure account needs these permissions:
- `Microsoft.Resources/subscriptions/resourceGroups/write`
- `Microsoft.Resources/subscriptions/resourceGroups/read`
- `Microsoft.Resources/subscriptions/resourceGroups/delete`

Typically provided by the **Contributor** or **Owner** role at the subscription level.

## Troubleshooting

### "AZURE_SUBSCRIPTION_ID environment variable is not set"
Set the `AZURE_SUBSCRIPTION_ID` environment variable with your Azure subscription ID.

### Authentication Errors
Run `az login` to authenticate with Azure CLI, which is the easiest method for local development.

### Permission Denied
Ensure your Azure account has sufficient permissions to manage resource groups.

## Learn More

- [Azure SDK for JavaScript/TypeScript](https://github.com/Azure/azure-sdk-for-js)
- [@azure/arm-resources documentation](https://www.npmjs.com/package/@azure/arm-resources)
- [@azure/identity documentation](https://www.npmjs.com/package/@azure/identity)
- [DefaultAzureCredential Guide](https://learn.microsoft.com/en-us/javascript/api/@azure/identity/defaultazurecredential)
