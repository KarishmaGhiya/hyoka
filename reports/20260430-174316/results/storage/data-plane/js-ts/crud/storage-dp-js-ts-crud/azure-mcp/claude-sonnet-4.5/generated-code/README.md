# Azure Blob Storage CRUD Operations Demo

A TypeScript program demonstrating Create, Read, Update, and Delete (CRUD) operations on Azure Blob Storage using the Azure SDK.

## Features

- ✅ Creates a BlobServiceClient using DefaultAzureCredential
- ✅ Creates a container if it doesn't exist
- ✅ Uploads a block blob
- ✅ Lists all blobs in the container
- ✅ Downloads and reads blob content
- ✅ Deletes blobs and containers
- ✅ Proper error handling with RestError
- ✅ Full async/await implementation

## Required npm Packages

```json
{
  "dependencies": {
    "@azure/storage-blob": "^12.17.0",
    "@azure/identity": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.2"
  }
}
```

## Prerequisites

1. An Azure Storage Account
2. Azure credentials configured (one of the following):
   - Azure CLI: `az login`
   - Managed Identity (when running on Azure)
   - Environment variables (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)
   - Visual Studio Code Azure Account extension

3. Set the storage account name:
   ```bash
   export AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
   ```

## Installation

```bash
npm install
```

## Usage

### Build and Run
```bash
npm run build
npm start
```

### Run with ts-node (development)
```bash
npm run dev
```

## Authentication with DefaultAzureCredential

The program uses `DefaultAzureCredential` which attempts authentication in the following order:

1. **Environment** - Environment variables
2. **Managed Identity** - If deployed to Azure
3. **Visual Studio Code** - VS Code Azure Account extension
4. **Azure CLI** - If logged in via `az login`
5. **Azure PowerShell** - If logged in via Azure PowerShell

## IAM Permissions Required

Your Azure identity needs the following RBAC role on the storage account:
- **Storage Blob Data Contributor** - For full CRUD operations

Or assign specific data plane permissions:
- `Microsoft.Storage/storageAccounts/blobServices/containers/write`
- `Microsoft.Storage/storageAccounts/blobServices/containers/delete`
- `Microsoft.Storage/storageAccounts/blobServices/containers/blobs/write`
- `Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read`
- `Microsoft.Storage/storageAccounts/blobServices/containers/blobs/delete`

## Error Handling

The program includes comprehensive error handling for:
- **RestError** - Azure Storage-specific errors with status codes
- **General Error** - Standard JavaScript errors
- Stream reading errors during blob download

Example error output:
```
❌ Error occurred during blob operations:
   Status Code: 404
   Error Code: ContainerNotFound
   Message: The specified container does not exist.
```

## Program Flow

1. Creates BlobServiceClient with DefaultAzureCredential
2. Creates container "my-container" (if not exists)
3. Uploads "Hello Azure!" as "greeting.txt"
4. Lists all blobs and logs their names
5. Downloads "greeting.txt" and prints content
6. Deletes the blob
7. Deletes the container

## License

MIT
