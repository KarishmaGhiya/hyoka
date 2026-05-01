# Quick Start Guide

## Prerequisites

1. **Azure Storage Account** with blob storage enabled
2. **Authentication** set up (one of):
   - Azure CLI: Run `az login` for local development
   - Managed Identity: Enable on your Azure resource (App Service, VM, etc.)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   
   Create a `.env` file (or set environment variables):
   ```bash
   AZURE_STORAGE_ENDPOINT=https://yourstorageaccount.blob.core.windows.net
   AZURE_STORAGE_CONTAINER=demo-container
   AZURE_STORAGE_LOG_LEVEL=info
   ```

   Replace `yourstorageaccount` with your actual storage account name.

3. **Grant permissions** (if using Managed Identity):
   
   Assign the "Storage Blob Data Contributor" role to your managed identity:
   ```bash
   az role assignment create \
     --assignee <managed-identity-principal-id> \
     --role "Storage Blob Data Contributor" \
     --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<storage-account>
   ```

## Running the Demo

### Development mode (with ts-node):
```bash
npm run dev
```

### Production mode (compiled):
```bash
npm run build
npm start
```

## What the Demo Does

The demo script (`src/index.ts`) performs the following operations:

1. ✅ Initializes storage configuration with managed identity
2. ✅ Creates/verifies container exists
3. ✅ Generates a sample file (~200 KB)
4. ✅ Uploads file with metadata and blob index tags
5. ✅ Lists all blobs in the container
6. ✅ Queries blobs by index tags
7. ✅ Downloads the blob and displays content preview
8. ✅ Acquires a 60-second lease on the blob
9. ✅ Updates blob while holding the lease (prevents concurrent writes)
10. ✅ Releases the lease
11. ✅ Verifies the update by downloading again
12. ✅ Deletes the blob and cleans up local files

## Using the Library in Your Code

```typescript
import { createStorageConfigFromEnv } from './config';
import { BlobStorageService } from './blobService';

// Initialize
const config = createStorageConfigFromEnv();
const service = new BlobStorageService(
  config.getBlobServiceClient(),
  'my-container'
);

// Ensure container exists
await service.ensureContainer();

// Upload a file
await service.uploadFile('myfile.txt', './local-file.txt', {
  metadata: { source: 'upload-script' },
  tags: { env: 'prod', version: '1.0' }
});

// List blobs
const blobs = await service.listBlobs();

// Download
await service.downloadToFile('myfile.txt', './downloaded.txt');

// Safe concurrent update with lease
const lease = await service.acquireLease('myfile.txt', 60);
await service.uploadFileWithLease('myfile.txt', './updated.txt', lease.leaseId);
await service.releaseLease('myfile.txt', lease.leaseId);

// Delete
await service.deleteBlob('myfile.txt');
```

## Troubleshooting

### Authentication Errors
- **Local development**: Run `az login` and ensure you have access to the storage account
- **Azure**: Verify Managed Identity is enabled and has the correct RBAC role

### Container Not Found
- The container will be created automatically if it doesn't exist
- Ensure your identity has "Storage Blob Data Contributor" role (not just "Reader")

### Blob Index Tag Query Errors
- Blob index tags require the feature to be enabled on your storage account
- Not all storage account types support blob index tags

### Memory Issues with Large Files
- The service uses streaming by default - files are not loaded entirely into memory
- Adjust the buffer size in `uploadStream()` if needed (default: 4MB)

## Next Steps

- Customize the retry policy in `.env` (max retries, delay)
- Adjust SDK logging level for debugging
- Implement error handling for production use
- Add your own business logic around blob operations
