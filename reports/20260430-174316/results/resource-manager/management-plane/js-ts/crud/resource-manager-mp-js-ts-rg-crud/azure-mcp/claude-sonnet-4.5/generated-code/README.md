# Azure Resource Group Manager

A TypeScript program demonstrating Azure Resource Group management using the Azure Management Plane SDK (`@azure/arm-resources`).

## Features

This program demonstrates:
1. **Authentication** using `DefaultAzureCredential` from `@azure/identity`
2. **Create** a ResourceManagementClient with credential and subscription ID
3. **Create** a new resource group in the "eastus" region
4. **List** all resource groups in the subscription using async iteration
5. **Get** details of the created resource group
6. **Update** the resource group by adding tags
7. **Delete** the resource group using `beginDeleteAndWait` pattern

## Prerequisites

- Node.js 18+ and npm
- Azure subscription
- Azure CLI installed and authenticated (`az login`) OR service principal credentials

## Required Packages

```json
{
  "dependencies": {
    "@azure/arm-resources": "^5.2.0",
    "@azure/identity": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.2"
  }
}
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up authentication:**
   
   Copy `.env.example` to `.env` and set your subscription ID:
   ```bash
   AZURE_SUBSCRIPTION_ID=your-subscription-id-here
   ```

3. **Authenticate with Azure:**
   
   The easiest way is using Azure CLI:
   ```bash
   az login
   ```

   Alternatively, use service principal environment variables:
   ```bash
   export AZURE_TENANT_ID=your-tenant-id
   export AZURE_CLIENT_ID=your-client-id
   export AZURE_CLIENT_SECRET=your-client-secret
   ```

## Running the Program

### Development mode (with ts-node):
```bash
npm run dev
```

### Build and run:
```bash
npm run build
npm start
```

### Direct TypeScript execution:
```bash
npx ts-node src/index.ts
```

## Code Structure

### Authentication Pattern
```typescript
const credential = new DefaultAzureCredential();
const client = new ResourceManagementClient(credential, subscriptionId);
```

### Async/Await Patterns

**Create:**
```typescript
const result = await client.resourceGroups.createOrUpdate(name, {
  location: "eastus",
  tags: { environment: "demo" }
});
```

**List (async iteration):**
```typescript
for await (const resourceGroup of client.resourceGroups.list()) {
  console.log(resourceGroup.name);
}
```

**Get:**
```typescript
const rg = await client.resourceGroups.get(name);
```

**Update:**
```typescript
const updated = await client.resourceGroups.update(name, {
  tags: { ...existingTags, newTag: "value" }
});
```

**Delete (long-running operation):**
```typescript
const poller = await client.resourceGroups.beginDelete(name);
await poller.pollUntilDone();
```

## Expected Output

```
============================================================
Azure Resource Group Management Demo
============================================================
Subscription ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Resource Group Name: rg-demo-1234567890
Location: eastus

Step 1: Authenticating with DefaultAzureCredential...
✓ Authentication successful

Step 2: Creating ResourceManagementClient...
✓ Client created successfully

Step 3: Creating resource group...
✓ Resource group created successfully
  Name: rg-demo-1234567890
  Location: eastus
  ID: /subscriptions/.../resourceGroups/rg-demo-1234567890
  Provisioning State: Succeeded

Step 4: Listing all resource groups...
  [1] rg-demo-1234567890 (eastus)
  [2] rg-production (westus)
  ...
✓ Total resource groups: X

Step 5: Getting resource group details...
✓ Resource group details retrieved
  Name: rg-demo-1234567890
  Location: eastus
  Tags: {
    "environment": "demo",
    "purpose": "testing"
  }

Step 6: Updating resource group with new tag...
✓ Resource group updated successfully
  Updated Tags: {
    "environment": "demo",
    "purpose": "testing",
    "updatedAt": "2026-04-30T...",
    "status": "modified"
  }

Step 7: Deleting resource group...
  This may take a few minutes...
✓ Resource group deleted successfully

Verifying deletion...
✓ Confirmed: Resource group no longer exists

============================================================
Demo completed successfully!
============================================================
```

## Key Concepts

### DefaultAzureCredential
Provides a simplified authentication experience by trying multiple credential types in sequence:
1. Environment variables
2. Managed Identity
3. Azure CLI
4. Azure PowerShell
5. Interactive browser

### Long-Running Operations (LROs)
The delete operation uses the LRO pattern:
- `beginDelete()` starts the operation and returns a poller
- `pollUntilDone()` waits until the operation completes
- This is Azure's recommended pattern for operations that take time

### Async Iteration
The `list()` method returns an async iterable, allowing efficient pagination:
```typescript
for await (const item of client.resourceGroups.list()) {
  // Process each item
}
```

## Error Handling

The program includes comprehensive error handling:
- Environment variable validation
- Try-catch blocks for all operations
- Verification of deletion success
- Detailed error messages

## License

MIT
