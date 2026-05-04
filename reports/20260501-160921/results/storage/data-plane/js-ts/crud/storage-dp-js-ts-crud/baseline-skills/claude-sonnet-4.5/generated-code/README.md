# Azure Blob Storage CRUD Operations

A TypeScript program demonstrating CRUD operations on Azure Blob Storage using the Azure SDK.

## Features

✅ Create BlobServiceClient with DefaultAzureCredential  
✅ Create container if it doesn't exist  
✅ Upload block blob with content  
✅ List all blobs in container  
✅ Download blob and print content  
✅ Delete blob and container  
✅ Comprehensive error handling with RestError  
✅ Full async/await implementation  

## Prerequisites

1. **Azure Storage Account**
   - Create one at [Azure Portal](https://portal.azure.com)
   - Note the storage account name

2. **Authentication** (one of the following):
   - Azure CLI: `az login`
   - Service Principal with environment variables
   - Managed Identity (when running on Azure)

3. **RBAC Permissions**
   - Role: **Storage Blob Data Contributor**
   - Scope: Storage account or container level

## Installation

```bash
npm install
```

This installs:
- `@azure/identity` - Authentication library
- `@azure/storage-blob` - Blob Storage SDK
- TypeScript and ts-node for development

## Configuration

Set the storage account name as an environment variable:

### Windows (PowerShell)
```powershell
$env:AZURE_STORAGE_ACCOUNT_NAME="mystorageaccount"
```

### Windows (Command Prompt)
```cmd
set AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount
```

### Linux/Mac
```bash
export AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount
```

## Usage

### Run with ts-node (Development)
```bash
npm run dev
```

### Build and Run (Production)
```bash
npm run build
npm start
```

### Run with TypeScript directly
```bash
npx ts-node blob-storage-crud.ts
```

## Expected Output

```
1. Creating BlobServiceClient...
   ✓ Connected to: https://mystorageaccount.blob.core.windows.net

2. Creating container...
   ✓ Container "my-container" created

3. Uploading blob...
   ✓ Uploaded "greeting.txt"
   ℹ ETag: "0x8DC..."
   ℹ Request ID: abc123...

4. Listing blobs in container...
   • greeting.txt
     - Size: 12 bytes
     - Content Type: text/plain
     - Last Modified: 2026-05-01T...
   ✓ Total blobs: 1

5. Downloading blob...
   ✓ Downloaded "greeting.txt"
   ℹ Content: "Hello Azure!"

6. Deleting blob...
   ✓ Deleted blob "greeting.txt"
   ℹ Request ID: def456...

7. Deleting container...
   ✓ Deleted container "my-container"
   ℹ Request ID: ghi789...

✅ All operations completed successfully!
```

## Authentication Methods

### Azure CLI (Recommended for Development)
```bash
az login
```

### Service Principal (Environment Variables)
```bash
export AZURE_TENANT_ID=<tenant-id>
export AZURE_CLIENT_ID=<client-id>
export AZURE_CLIENT_SECRET=<client-secret>
```

### Managed Identity (Azure Resources)
Automatically works on Azure VMs, App Service, Functions, etc.

## Error Handling

The program handles common Azure Storage errors:

- **AuthenticationFailed** - Invalid credentials
- **AuthorizationPermissionMismatch** - Missing RBAC permissions
- **ContainerNotFound** - Container doesn't exist
- **BlobNotFound** - Blob doesn't exist
- **AccountNotFound** - Invalid storage account name

Each error includes suggestions for resolution.

## Code Structure

```typescript
// 1. Authentication
const credential = new DefaultAzureCredential();
const blobServiceClient = new BlobServiceClient(accountUrl, credential);

// 2. Container operations
const containerClient = blobServiceClient.getContainerClient(containerName);
await containerClient.createIfNotExists();

// 3. Blob operations
const blockBlobClient = containerClient.getBlockBlobClient(blobName);
await blockBlobClient.upload(content, length);

// 4. Error handling
try {
  // operations...
} catch (error) {
  if (error instanceof RestError) {
    // Handle Azure-specific errors
  }
}
```

## Required NPM Packages

| Package | Version | Purpose |
|---------|---------|---------|
| @azure/identity | ^4.0.0 | Authentication with DefaultAzureCredential |
| @azure/storage-blob | ^12.17.0 | Blob Storage operations |
| typescript | ^5.3.0 | TypeScript compiler |
| ts-node | ^10.9.0 | Run TypeScript directly |
| @types/node | ^20.0.0 | Node.js type definitions |

## Learn More

- [Azure Blob Storage Documentation](https://learn.microsoft.com/azure/storage/blobs/)
- [Azure Identity SDK](https://learn.microsoft.com/javascript/api/@azure/identity)
- [Azure Storage Blob SDK](https://learn.microsoft.com/javascript/api/@azure/storage-blob)
- [Blob Service Error Codes](https://learn.microsoft.com/rest/api/storageservices/blob-service-error-codes)

## License

MIT
