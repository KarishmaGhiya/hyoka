# Quick Start Guide

## Prerequisites

1. **Azure Storage Account**: You need an Azure Storage account
2. **Authentication**: One of the following:
   - Azure CLI installed and logged in (`az login`)
   - Running in Azure with Managed Identity enabled
   - Other DefaultAzureCredential supported methods

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and update it with your settings:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
AZURE_STORAGE_ACCOUNT_ENDPOINT=https://yourstorageaccount.blob.core.windows.net
AZURE_STORAGE_CONTAINER_NAME=your-container-name
MAX_RETRIES=3
RETRY_DELAY_MS=1000
LOG_LEVEL=info
```

### 3. Authenticate with Azure

For local development, use Azure CLI:

```bash
az login
```

Verify your account has access to the storage account:

```bash
az storage account show --name yourstorageaccount
```

### 4. Build the Project

```bash
npm run build
```

### 5. Run the Demo

```bash
npm start
```

Or for development mode (with ts-node):

```bash
npm run dev
```

## Expected Output

The demo will:
1. Create a container (if it doesn't exist)
2. Upload a sample file with metadata and tags
3. List all blobs and display their properties
4. Download the file back
5. Acquire a lease and update the file
6. Verify the update
7. Delete the blob
8. Clean up temporary files

## Troubleshooting

### Authentication Issues

**Error**: `AZURE_STORAGE_ACCOUNT_ENDPOINT environment variable is required`
- Make sure you have a `.env` file with the correct values

**Error**: Authentication failed
- Run `az login` to authenticate with Azure CLI
- Verify your account has permissions on the storage account (Storage Blob Data Contributor role)

### Permission Issues

**Error**: This request is not authorized to perform this operation
- Your account needs the **Storage Blob Data Contributor** role
- Assign the role using:
  ```bash
  az role assignment create \
    --role "Storage Blob Data Contributor" \
    --assignee your-email@domain.com \
    --scope /subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.Storage/storageAccounts/{storage-account}
  ```

### Container Issues

**Error**: Container not found
- The container will be created automatically if it doesn't exist
- Ensure your account has permission to create containers

## Using in Your Own Project

```typescript
import { BlobStorageService } from './blob-service';

async function myApp() {
  const service = new BlobStorageService();
  
  // Upload
  await service.uploadFile('local.txt', 'remote.txt', {
    metadata: { key: 'value' },
    tags: { env: 'prod' }
  });
  
  // List
  const blobs = await service.listBlobs();
  
  // Download
  await service.downloadFile('remote.txt', 'local-copy.txt');
  
  // Delete
  await service.deleteBlob('remote.txt');
}
```

## Next Steps

- Explore the source code in `src/`
- Read the full documentation in `README.md`
- Customize the configuration for your needs
- Integrate into your own projects
