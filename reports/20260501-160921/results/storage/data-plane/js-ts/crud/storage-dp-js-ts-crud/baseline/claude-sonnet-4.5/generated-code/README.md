# Azure Blob Storage CRUD Operations

This TypeScript program demonstrates complete CRUD operations on Azure Blob Storage using the Azure SDK.

## Required npm Packages

```json
{
  "@azure/storage-blob": "^12.17.0",
  "@azure/identity": "^4.0.0"
}
```

## Installation

```bash
npm install
```

## Prerequisites

1. **Azure Storage Account**: You need an Azure Storage Account
2. **Authentication**: The program uses `DefaultAzureCredential` which supports multiple authentication methods:
   - Azure CLI (`az login`)
   - Environment variables
   - Managed Identity (when running in Azure)
   - Visual Studio Code
   - Azure PowerShell

3. **Environment Variable**: Set your storage account name:
   ```bash
   # Windows (PowerShell)
   $env:AZURE_STORAGE_ACCOUNT_NAME="yourstorageaccount"
   
   # Linux/Mac
   export AZURE_STORAGE_ACCOUNT_NAME="yourstorageaccount"
   ```

4. **Permissions**: Your Azure identity needs these RBAC roles:
   - Storage Blob Data Contributor (or Owner)

## Running the Program

```bash
# Using ts-node
npm start

# Or compile and run
npm run build
node dist/azure-blob-crud.js
```

## What the Program Does

1. ✅ Creates a `BlobServiceClient` using `DefaultAzureCredential`
2. ✅ Creates a container named "my-container" (if it doesn't exist)
3. ✅ Uploads "Hello Azure!" as a blob named "greeting.txt"
4. ✅ Lists all blobs in the container
5. ✅ Downloads the blob and prints its content
6. ✅ Deletes the blob
7. ✅ Deletes the container

## Error Handling

The program includes comprehensive error handling:
- Catches `RestError` from Azure SDK with status codes and error details
- Handles generic errors with stack traces
- Validates required environment variables
- Provides clear error messages

## Authentication Setup (Azure CLI)

The easiest way to authenticate locally:

```bash
az login
az account set --subscription "Your Subscription Name"
```

Then run the program.
