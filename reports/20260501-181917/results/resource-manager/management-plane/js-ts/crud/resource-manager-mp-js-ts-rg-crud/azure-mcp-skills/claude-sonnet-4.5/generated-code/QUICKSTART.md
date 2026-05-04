# Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

This installs:
- `@azure/identity` - Authentication library
- `@azure/arm-resources` - Resource Management SDK

## 2. Configure Authentication

### Option A: Azure CLI (Easiest for Development)

```bash
# Login to Azure
az login

# Set subscription (Windows PowerShell)
$env:AZURE_SUBSCRIPTION_ID="your-subscription-id-here"

# Set subscription (Windows CMD)
set AZURE_SUBSCRIPTION_ID=your-subscription-id-here

# Set subscription (Linux/Mac)
export AZURE_SUBSCRIPTION_ID="your-subscription-id-here"
```

### Option B: Service Principal

Set environment variables:

**Windows PowerShell:**
```powershell
$env:AZURE_SUBSCRIPTION_ID="your-subscription-id"
$env:AZURE_TENANT_ID="your-tenant-id"
$env:AZURE_CLIENT_ID="your-client-id"
$env:AZURE_CLIENT_SECRET="your-client-secret"
```

**Linux/Mac:**
```bash
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

## 3. Run the Program

### Build and Run
```bash
npm run build
npm start
```

### Or Run Directly (Development)
```bash
npm run dev
```

## Key Features Demonstrated

✅ **DefaultAzureCredential** - Automatic authentication  
✅ **ResourceManagementClient** - Management plane SDK client  
✅ **createOrUpdate()** - Create resource group with tags  
✅ **Async Iteration** - List all resource groups efficiently  
✅ **get()** - Retrieve specific resource group details  
✅ **update()** - Update resource group tags  
✅ **beginDeleteAndWait()** - Delete with automatic polling  

## Code Highlights

### 1. Authentication
```typescript
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();
```

### 2. Create Client
```typescript
import { ResourceManagementClient } from "@azure/arm-resources";

const client = new ResourceManagementClient(
  credential, 
  subscriptionId
);
```

### 3. Create Resource Group
```typescript
const result = await client.resourceGroups.createOrUpdate(
  "my-rg",
  {
    location: "eastus",
    tags: { env: "demo" }
  }
);
```

### 4. List with Async Iteration
```typescript
for await (const rg of client.resourceGroups.list()) {
  console.log(rg.name);
}
```

### 5. Get Details
```typescript
const rg = await client.resourceGroups.get("my-rg");
console.log(rg.properties?.provisioningState);
```

### 6. Update Tags
```typescript
await client.resourceGroups.update("my-rg", {
  tags: { updated: "true" }
});
```

### 7. Delete (Long-Running Operation)
```typescript
await client.resourceGroups.beginDeleteAndWait("my-rg");
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

📦 Step 3: Creating resource group...
✅ Resource group created successfully

📋 Step 4: Listing all resource groups in subscription...
✅ Found X resource group(s)

🔍 Step 5: Getting details of created resource group...
✅ Resource group details: [details shown]

🏷️  Step 6: Updating resource group tags...
✅ Resource group updated successfully

🗑️  Step 7: Deleting resource group...
✅ Resource group deleted successfully

✔️  Verifying deletion...
✅ Confirmed: Resource group no longer exists

============================================================
Demo completed successfully! 🎉
============================================================
```

## Troubleshooting

### Error: AZURE_SUBSCRIPTION_ID is required
- Set the environment variable before running
- Use `az account show` to get your subscription ID

### Error: Authentication failed
- Run `az login` if using Azure CLI
- Verify service principal credentials if using environment variables
- Check that your account has permissions to manage resource groups

### Error: Permission denied
- Ensure you have "Contributor" or "Owner" role on the subscription
- Or at least "Resource Group Contributor" role

## Learn More

- [Azure Identity Documentation](https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/)
- [Azure Resource Management SDK](https://learn.microsoft.com/javascript/api/@azure/arm-resources/)
- [DefaultAzureCredential](https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential)
