# Azure Blob Storage CRUD Operations in TypeScript

This program demonstrates complete CRUD (Create, Read, Update, Delete) operations on Azure Blob Storage using TypeScript with proper error handling.

## Features

- ✅ Creates BlobServiceClient using DefaultAzureCredential (Azure Identity)
- ✅ Creates a container if it doesn't exist
- ✅ Uploads a text blob
- ✅ Lists all blobs in the container
- ✅ Downloads and displays blob content
- ✅ Deletes blob and container
- ✅ Comprehensive error handling with RestError
- ✅ Uses async/await throughout

## Required NPM Packages

```bash
npm install @azure/storage-blob @azure/identity
npm install --save-dev typescript @types/node ts-node ts-node-dev
```

## Prerequisites

1. **Azure Storage Account**: You need an Azure Storage Account
2. **Authentication**: Set up one of the following:
   - Azure CLI: Run `az login`
   - Managed Identity: If running in Azure (VM, App Service, etc.)
   - Environment variables for Service Principal
   - Visual Studio Code Azure Account extension

3. **Environment Variable**: Set your storage account name:
   ```bash
   # Windows (PowerShell)
   $env:AZURE_STORAGE_ACCOUNT_NAME="yourstorageaccount"
   
   # Windows (CMD)
   set AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
   
   # Linux/Mac
   export AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
   ```

## Installation

```bash
npm install
```

## Usage

Run with ts-node:
```bash
npm start
```

Or compile and run:
```bash
npm run build
node dist/azure-blob-crud.js
```

For development with auto-reload:
```bash
npm run dev
```

## Required Permissions

Your Azure identity needs the following RBAC role on the storage account:
- **Storage Blob Data Contributor** (for full CRUD operations)

Or assign via Azure CLI:
```bash
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee <your-user-or-service-principal-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/<rg-name>/providers/Microsoft.Storage/storageAccounts/<storage-account-name>
```

## Error Handling

The program includes comprehensive error handling:
- Catches `RestError` from Azure SDK operations
- Logs error messages, codes, and status codes
- Handles 404 errors gracefully during cleanup
- Validates required environment variables
- Proper exit codes for CI/CD integration

## Sample Output

```
Creating BlobServiceClient...
✓ BlobServiceClient created successfully

Creating container "my-container"...
✓ Container created successfully

Uploading blob "greeting.txt"...
✓ Blob uploaded successfully. Request ID: xxx

Listing blobs in container "my-container"...
  - greeting.txt
✓ Found 1 blob(s)

Downloading blob "greeting.txt"...
✓ Blob downloaded successfully
Content: "Hello Azure!"

Deleting blob "greeting.txt"...
✓ Blob deleted successfully. Request ID: xxx

Deleting container "my-container"...
✓ Container deleted successfully. Request ID: xxx

✅ All operations completed successfully!
```
