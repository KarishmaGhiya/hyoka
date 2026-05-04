# Azure Resource Group Manager

A TypeScript program demonstrating CRUD operations on Azure Resource Groups using the Azure Management Plane SDK.

## Features

This program demonstrates:
1. **Authentication** - Using DefaultAzureCredential from @azure/identity
2. **Create** - Creating a new resource group in the eastus region
3. **List** - Iterating through all resource groups in the subscription
4. **Read** - Getting details of a specific resource group
5. **Update** - Adding tags to an existing resource group
6. **Delete** - Deleting a resource group using beginDeleteAndWait

## Prerequisites

- Node.js 16 or higher
- Azure subscription
- Azure CLI or appropriate credentials configured for DefaultAzureCredential

## Required NPM Packages

```json
{
  "@azure/arm-resources": "^5.2.0",
  "@azure/identity": "^4.0.0"
}
```

## Installation

```bash
npm install
```

## Configuration

Set your Azure subscription ID as an environment variable:

```bash
# Windows (PowerShell)
$env:AZURE_SUBSCRIPTION_ID="your-subscription-id"

# Windows (Command Prompt)
set AZURE_SUBSCRIPTION_ID=your-subscription-id

# Linux/macOS
export AZURE_SUBSCRIPTION_ID=your-subscription-id
```

## Authentication

The program uses `DefaultAzureCredential`, which attempts to authenticate via multiple methods in order:
1. Environment variables
2. Managed Identity
3. Visual Studio Code
4. Azure CLI
5. Azure PowerShell
6. Interactive browser

Ensure you're logged in using one of these methods (e.g., `az login` for Azure CLI).

## Usage

### Development mode (with ts-node)
```bash
npm run dev
```

### Build and run
```bash
npm run build
npm start
```

## Program Flow

1. Authenticates using DefaultAzureCredential
2. Creates a ResourceManagementClient with your subscription ID
3. Creates a new resource group with initial tags
4. Lists all resource groups in the subscription
5. Retrieves and displays details of the created resource group
6. Updates the resource group by adding additional tags
7. Deletes the resource group and verifies deletion

## Key Features Demonstrated

- **Async/await patterns** - All operations use proper async/await syntax
- **Error handling** - Comprehensive try-catch with detailed error messages
- **Pagination** - Uses for-await-of for listing resource groups
- **Long-running operations** - Uses beginDeleteAndWait for deletion
- **Resource management** - Creates unique names to avoid conflicts

## Output Example

```
Step 1: Authenticating with DefaultAzureCredential...
Step 2: Creating ResourceManagementClient...
✓ Client created successfully

Step 3: Creating resource group...
  Name: rg-demo-1234567890
  Location: eastus
✓ Resource group created
  ID: /subscriptions/.../resourceGroups/rg-demo-1234567890
  ...

[Additional steps output]

=== Demo completed successfully! ===
```

## Notes

- The program generates a unique resource group name using timestamp
- The delete operation may take several minutes to complete
- All operations include proper error handling and status reporting
