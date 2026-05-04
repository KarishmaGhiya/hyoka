# Azure Blob Storage CRUD Demo

This TypeScript program demonstrates complete CRUD operations on Azure Blob Storage using the `@azure/storage-blob` SDK.

## Features

1. ✅ Creates a BlobServiceClient using DefaultAzureCredential
2. ✅ Creates a container named "my-container" if it doesn't exist
3. ✅ Uploads a string "Hello Azure!" as a block blob named "greeting.txt"
4. ✅ Lists all blobs in the container and logs their names
5. ✅ Downloads the blob and prints its content as a string
6. ✅ Deletes the blob and then deletes the container

## Required Packages

```bash
npm install @azure/storage-blob @azure/identity
npm install --save-dev typescript ts-node @types/node
```

## Prerequisites

- Node.js >= 18.0.0
- Azure Storage Account
- Proper authentication configured (see below)

## Environment Variables

Set the following environment variable:

```bash
export AZURE_STORAGE_ACCOUNT_NAME=<your-storage-account-name>
```

## Authentication

This demo uses `DefaultAzureCredential` which supports multiple authentication methods in order:

1. **Environment variables** (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
2. **Managed Identity** (when deployed to Azure)
3. **Azure CLI** (run `az login` first)
4. **Visual Studio Code** (sign in to Azure extension)
5. **Azure PowerShell** (run `Connect-AzAccount`)

For local development, the easiest method is using Azure CLI:

```bash
az login
```

## Running the Demo

```bash
# Install dependencies
npm install

# Run with ts-node
npm start

# Or compile and run
npm run build
node dist/blob-crud-demo.js
```

## Error Handling

The program includes comprehensive error handling for:
- **403 Forbidden**: Authentication or permission issues
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource already exists
- Other RestError status codes with detailed messages

## Expected Output

```
1. Creating BlobServiceClient...
✓ BlobServiceClient created successfully

2. Creating container 'my-container'...
✓ Container created successfully

3. Uploading blob 'greeting.txt'...
✓ Uploaded blob 'greeting.txt' with content: "Hello Azure!"

4. Listing all blobs in container...
   - greeting.txt (12 bytes)
✓ Found 1 blob(s)

5. Downloading blob 'greeting.txt'...
✓ Downloaded content: "Hello Azure!"

6. Cleaning up resources...
   Deleting blob 'greeting.txt'...
   ✓ Blob 'greeting.txt' deleted
   Deleting container 'my-container'...
   ✓ Container 'my-container' deleted

🎉 All CRUD operations completed successfully!
```

## Required Azure Permissions

Your Azure identity needs the following roles on the storage account:
- **Storage Blob Data Contributor** (for read/write/delete operations)
- **Storage Blob Data Owner** (for container creation/deletion)

Or use a SAS token with appropriate permissions.
