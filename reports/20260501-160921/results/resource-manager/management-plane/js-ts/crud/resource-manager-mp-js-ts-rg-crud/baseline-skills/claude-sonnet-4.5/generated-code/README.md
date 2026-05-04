# Azure Resource Group Manager - TypeScript

A comprehensive TypeScript application demonstrating Azure Resource Group management using the Azure SDK for JavaScript/TypeScript.

## Features

This application demonstrates the following operations:

1. **Authenticate** using `DefaultAzureCredential` from `@azure/identity`
2. **Create** a ResourceManagementClient with credential and subscription ID
3. **Create** a new resource group in the "eastus" region
4. **List** all resource groups in the subscription using async iteration
5. **Get** details of a specific resource group
6. **Update** a resource group by adding tags
7. **Delete** a resource group using `beginDeleteAndWait`

## Prerequisites

- Node.js 16+ and npm
- Azure subscription
- Azure CLI (for local development) or appropriate credentials configured

## Installation

1. Install dependencies:

```bash
npm install
```

2. Configure authentication:

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Azure subscription ID
# AZURE_SUBSCRIPTION_ID=your-subscription-id-here
```

## Authentication Methods

The application uses `DefaultAzureCredential`, which tries the following methods in order:

1. **Environment Variables** (Service Principal)
2. **Workload Identity** (Kubernetes)
3. **Managed Identity** (Azure services)
4. **Azure CLI** (Local development)
5. **Azure PowerShell**
6. **Azure Developer CLI**

### Local Development (Recommended)

Use Azure CLI:

```bash
az login
```

### Production (Service Principal)

Set environment variables:

```bash
export AZURE_TENANT_ID=your-tenant-id
export AZURE_CLIENT_ID=your-client-id
export AZURE_CLIENT_SECRET=your-client-secret
export AZURE_SUBSCRIPTION_ID=your-subscription-id
```

### Production (Managed Identity)

When running in Azure (VM, App Service, Container Apps, etc.), managed identity is automatically configured. Just set:

```bash
export AZURE_SUBSCRIPTION_ID=your-subscription-id
```

## Running the Application

### Development Mode (with ts-node)

```bash
npm run dev
```

### Production Mode

```bash
# Build the TypeScript code
npm run build

# Run the compiled JavaScript
npm start
```

## Required Packages

- **@azure/identity**: ^4.0.0 - Azure authentication library
- **@azure/arm-resources**: ^5.2.0 - Azure Resource Manager SDK for managing resources

## Code Structure

```
src/
  └── index.ts          # Main application with all CRUD operations

package.json           # NPM package configuration
tsconfig.json         # TypeScript compiler configuration
.env.example          # Environment variables template
README.md             # This file
```

## Key Concepts

### Async/Await Patterns

All Azure SDK operations are asynchronous and return Promises. The application uses modern async/await syntax:

```typescript
// Creating a resource group
const result = await client.resourceGroups.createOrUpdate(name, parameters);

// Listing with async iteration
for await (const rg of client.resourceGroups.list()) {
  console.log(rg.name);
}

// Long-running operation with wait
await client.resourceGroups.beginDeleteAndWait(name);
```

### DefaultAzureCredential

Provides a simplified authentication experience that works across different environments:

```typescript
import { DefaultAzureCredential } from "@azure/identity";
const credential = new DefaultAzureCredential();
```

### Resource Management Client

The main client for managing Azure resources:

```typescript
import { ResourceManagementClient } from "@azure/arm-resources";
const client = new ResourceManagementClient(credential, subscriptionId);
```

## Permissions Required

The service principal or managed identity must have the following permissions:

- `Microsoft.Resources/subscriptions/resourceGroups/read`
- `Microsoft.Resources/subscriptions/resourceGroups/write`
- `Microsoft.Resources/subscriptions/resourceGroups/delete`

Typically assigned via the **Contributor** or **Owner** role at the subscription or resource group level.

## Output Example

```
=== Azure Resource Group Management Demo ===

1. Authenticating with DefaultAzureCredential...
   ✓ Authentication configured

2. Creating ResourceManagementClient...
   ✓ Client created for subscription: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

3. Creating resource group: rg-demo-1714594565789...
   ✓ Resource group created successfully
   - Name: rg-demo-1714594565789
   - Location: eastus
   - Provisioning State: Succeeded

4. Listing all resource groups in the subscription...
   Resource Groups:
   - rg-demo-1714594565789 (eastus)
   - my-existing-rg (westus2)
   ✓ Total resource groups found: 2

5. Getting details of resource group: rg-demo-1714594565789...
   ✓ Resource group details retrieved:
   - ID: /subscriptions/.../resourceGroups/rg-demo-1714594565789
   - Name: rg-demo-1714594565789
   - Location: eastus
   - Provisioning State: Succeeded
   - Tags: {
       "environment": "demo",
       "createdBy": "typescript-sdk"
     }

6. Updating resource group with a new tag...
   ✓ Resource group updated successfully
   - Updated Tags: {
       "environment": "demo",
       "createdBy": "typescript-sdk",
       "status": "active",
       "lastModified": "2024-05-01T12:34:56.789Z"
     }

7. Deleting resource group: rg-demo-1714594565789...
   (This may take a few minutes...)
   ✓ Resource group deleted successfully

8. Verifying deletion...
   ✓ Resource group confirmed deleted

=== Demo completed successfully ===
```

## Error Handling

The application includes comprehensive error handling:

- Validates required environment variables
- Catches and logs Azure SDK errors
- Exits with appropriate error codes

## License

MIT
