# Azure Blob Storage CRUD Operations Example

This TypeScript program demonstrates complete CRUD operations on Azure Blob Storage using the Azure SDK.

## Features

- ✅ Create BlobServiceClient with DefaultAzureCredential
- ✅ Create container if it doesn't exist
- ✅ Upload string content as a block blob
- ✅ List all blobs in the container
- ✅ Download blob and read content
- ✅ Delete blob and container
- ✅ Comprehensive error handling with RestError
- ✅ Async/await throughout

## Required Packages

```json
{
  "@azure/storage-blob": "^12.17.0",
  "@azure/identity": "^4.0.0"
}
```

## Prerequisites

1. **Azure Storage Account**: You need an Azure Storage Account
2. **Authentication**: DefaultAzureCredential will try (in order):
   - Environment variables (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
   - Azure CLI authentication (`az login`)
   - Managed Identity (if running in Azure)

3. **Environment Variable**:
   ```bash
   export AZURE_STORAGE_ACCOUNT_NAME="yourstorageaccount"
   ```

4. **Permissions**: Your identity needs these RBAC roles:
   - `Storage Blob Data Contributor` (for CRUD operations)

## Installation

```bash
npm install
```

## Running the Program

### Development mode (with ts-node):
```bash
npm run dev
```

### Build and run:
```bash
npm run build
npm start
```

## Authentication Setup Examples

### Option 1: Azure CLI (easiest for local development)
```bash
az login
export AZURE_STORAGE_ACCOUNT_NAME="yourstorageaccount"
npm run dev
```

### Option 2: Service Principal (for automation)
```bash
export AZURE_CLIENT_ID="your-client-id"
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export AZURE_STORAGE_ACCOUNT_NAME="yourstorageaccount"
npm run dev
```

### Option 3: Managed Identity
When running in Azure (VM, App Service, Functions), no credentials needed:
```bash
export AZURE_STORAGE_ACCOUNT_NAME="yourstorageaccount"
npm start
```

## Expected Output

```
Step 1: Creating BlobServiceClient with DefaultAzureCredential...
✓ BlobServiceClient created successfully

Step 2: Creating container 'my-container' if it doesn't exist...
✓ Container 'my-container' created successfully

Step 3: Uploading blob 'greeting.txt'...
✓ Blob uploaded successfully
  Request ID: ...
  ETag: ...

Step 4: Listing all blobs in container 'my-container'...
Blobs in container:
  - greeting.txt (12 bytes)

Step 5: Downloading blob 'greeting.txt'...
✓ Blob downloaded successfully
  Content: "Hello Azure!"

Step 6a: Deleting blob 'greeting.txt'...
✓ Blob 'greeting.txt' deleted successfully

Step 6b: Deleting container 'my-container'...
✓ Container 'my-container' deleted successfully

🎉 All CRUD operations completed successfully!
```

## Error Handling

The program includes comprehensive error handling:
- Catches `RestError` from Azure SDK with detailed diagnostics
- Displays status codes, error codes, and request IDs
- Handles missing environment variables
- Proper stream error handling for downloads

## Key Concepts

1. **DefaultAzureCredential**: Automatically tries multiple authentication methods
2. **createIfNotExists()**: Idempotent container creation
3. **Stream handling**: Properly converts download stream to string
4. **RestError**: Azure-specific error type with detailed information
5. **Async/await**: Clean asynchronous code throughout
