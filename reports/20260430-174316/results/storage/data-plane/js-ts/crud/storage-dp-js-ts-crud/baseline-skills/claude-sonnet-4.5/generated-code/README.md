# Azure Blob Storage CRUD Operations (TypeScript)

This TypeScript program demonstrates complete CRUD operations on Azure Blob Storage using the Azure SDK.

## Features

1. ✓ Creates a BlobServiceClient using DefaultAzureCredential
2. ✓ Creates a container named "my-container" if it doesn't exist
3. ✓ Uploads a string "Hello Azure!" as a block blob named "greeting.txt"
4. ✓ Lists all blobs in the container and logs their names
5. ✓ Downloads the blob and prints its content as a string
6. ✓ Deletes the blob and then deletes the container
7. ✓ Proper error handling with RestError
8. ✓ Async/await throughout

## Required NPM Packages

```json
{
  "@azure/storage-blob": "^12.17.0",
  "@azure/identity": "^4.0.0"
}
```

## Prerequisites

1. **Azure Storage Account**: You need an Azure Storage Account
2. **Authentication**: DefaultAzureCredential supports multiple authentication methods:
   - Azure CLI (`az login`)
   - Environment variables (client ID, tenant ID, client secret)
   - Managed Identity (when running in Azure)
   - Visual Studio Code Azure extension

3. **Environment Variable**: Set your storage account name:
   ```bash
   # Windows (PowerShell)
   $env:AZURE_STORAGE_ACCOUNT_NAME="yourstorageaccount"
   
   # Windows (CMD)
   set AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
   
   # Linux/macOS
   export AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
   ```

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Run

```bash
npm start
```

Or run directly with ts-node:
```bash
npx ts-node index.ts
```

## Error Handling

The program properly catches and handles `RestError` exceptions from the Azure SDK:
- Displays error messages
- Shows error codes and status codes
- Includes request IDs for debugging
- Exits with appropriate error code

## Output Example

```
1. Creating BlobServiceClient with DefaultAzureCredential...
   ✓ BlobServiceClient created successfully

2. Creating container 'my-container' if it doesn't exist...
   ✓ Container 'my-container' created successfully

3. Uploading 'Hello Azure!' to blob 'greeting.txt'...
   ✓ Blob uploaded successfully
   Request ID: xxx-xxx-xxx
   ETag: "0x8DC..."

4. Listing all blobs in container 'my-container'...
   - greeting.txt
     Size: 12 bytes
     Last Modified: 2026-04-30T...
   ✓ Found 1 blob(s)

5. Downloading blob 'greeting.txt'...
   ✓ Blob downloaded successfully
   Content: "Hello Azure!"
   Content Type: application/octet-stream
   Content Length: 12 bytes

6. Deleting blob 'greeting.txt'...
   ✓ Blob deleted successfully
   Request ID: xxx-xxx-xxx

7. Deleting container 'my-container'...
   ✓ Container deleted successfully
   Request ID: xxx-xxx-xxx

✓ All CRUD operations completed successfully!
```

## Permission Requirements

Your Azure identity needs the following permissions on the storage account:
- `Storage Blob Data Contributor` or
- `Storage Blob Data Owner`

You can assign these via Azure Portal, Azure CLI, or Infrastructure as Code.
