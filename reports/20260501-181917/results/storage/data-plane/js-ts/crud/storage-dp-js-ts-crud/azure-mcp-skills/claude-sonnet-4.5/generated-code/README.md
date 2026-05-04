# Azure Blob Storage CRUD Operations - TypeScript

A complete TypeScript program demonstrating CRUD (Create, Read, Update, Delete) operations on Azure Blob Storage using the `@azure/storage-blob` SDK.

## Features

✅ Create a BlobServiceClient using DefaultAzureCredential  
✅ Create a container if it doesn't exist  
✅ Upload a string as a block blob  
✅ List all blobs in the container  
✅ Download blob content and print it  
✅ Delete blob and container  
✅ Proper error handling with RestError  
✅ Full async/await support  

## Prerequisites

- Node.js >= 18.0.0
- Azure Storage Account
- Azure authentication configured (Azure CLI, managed identity, or environment variables)

## Required NPM Packages

```bash
npm install @azure/storage-blob @azure/identity
npm install --save-dev typescript @types/node ts-node
```

## Environment Variables

Set the following environment variable before running:

```bash
# Windows (PowerShell)
$env:AZURE_STORAGE_ACCOUNT_NAME="your-storage-account-name"

# Windows (CMD)
set AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name

# Linux/macOS
export AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
```

## Authentication

The program uses `DefaultAzureCredential`, which attempts authentication in this order:

1. **Environment variables** (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`)
2. **Managed Identity** (if running in Azure)
3. **Azure CLI** (`az login`)
4. **Visual Studio Code** (Azure Account extension)
5. **Azure PowerShell** (`Connect-AzAccount`)

### For Local Development

The easiest way is to use Azure CLI:

```bash
az login
```

### Required Azure Permissions

Your account/identity needs the following RBAC role on the Storage Account:
- **Storage Blob Data Contributor** (or higher)

```bash
# Assign role (replace placeholders)
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee <your-email-or-principal-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.Storage/storageAccounts/<storage-account-name>
```

## Installation

```bash
npm install
```

## Usage

### Run with ts-node

```bash
npm start
```

### Compile and run

```bash
npm run build
node dist/blob-storage-crud.js
```

## Expected Output

```
1. Creating BlobServiceClient...
✓ BlobServiceClient created successfully

2. Creating container 'my-container'...
✓ Container created successfully

3. Uploading blob 'greeting.txt'...
✓ Uploaded 'greeting.txt' successfully

4. Listing all blobs in the container:
  - greeting.txt (12 bytes)
✓ Found 1 blob(s)

5. Downloading blob 'greeting.txt'...
✓ Downloaded content: "Hello Azure!"

6. Cleaning up resources...
✓ Deleted blob 'greeting.txt'
✓ Deleted container 'my-container'

✅ All CRUD operations completed successfully!
```

## Error Handling

The program includes comprehensive error handling for common scenarios:

- **403 Forbidden**: Missing permissions (needs Storage Blob Data Contributor role)
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource already exists or is being deleted
- **Other errors**: Network issues, invalid credentials, etc.

## Code Structure

```typescript
// 1. Initialize BlobServiceClient with DefaultAzureCredential
const credential = new DefaultAzureCredential();
const blobServiceClient = new BlobServiceClient(url, credential);

// 2. Create container (idempotent)
const containerClient = blobServiceClient.getContainerClient("my-container");
await containerClient.createIfNotExists();

// 3. Upload blob
const blockBlobClient = containerClient.getBlockBlobClient("greeting.txt");
await blockBlobClient.upload(content, content.length);

// 4. List blobs
for await (const blob of containerClient.listBlobsFlat()) {
  console.log(blob.name);
}

// 5. Download blob
const blobClient = containerClient.getBlobClient("greeting.txt");
const downloadResponse = await blobClient.download();
const content = await streamToText(downloadResponse.readableStreamBody);

// 6. Delete blob and container
await blobClient.delete();
await containerClient.delete();
```

## Troubleshooting

### "AZURE_STORAGE_ACCOUNT_NAME environment variable is required"
Set the environment variable with your storage account name.

### "403 Forbidden" or "AuthorizationPermissionMismatch"
Ensure your account has the **Storage Blob Data Contributor** role assigned.

### "DefaultAzureCredential failed to retrieve a token"
Run `az login` or configure another authentication method.

### "No readable stream" error
The blob might be empty or corrupted. Check the blob exists and has content.

## Resources

- [@azure/storage-blob Documentation](https://learn.microsoft.com/javascript/api/@azure/storage-blob)
- [@azure/identity Documentation](https://learn.microsoft.com/javascript/api/@azure/identity)
- [Azure Blob Storage Overview](https://learn.microsoft.com/azure/storage/blobs/storage-blobs-overview)
