# Azure Blob Storage CRUD Operations

A TypeScript program demonstrating CRUD operations on Azure Blob Storage using DefaultAzureCredential.

## Required npm Packages

- **@azure/storage-blob** (^12.17.0) - Azure Storage Blob client library
- **@azure/identity** (^4.0.0) - Azure Identity library for DefaultAzureCredential

## Prerequisites

1. An Azure Storage Account
2. Azure credentials configured (one of):
   - Azure CLI: Run `az login`
   - Environment variables: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
   - Managed Identity (if running on Azure)
3. Set the `AZURE_STORAGE_ACCOUNT_NAME` environment variable

## Installation

```bash
npm install
```

## Usage

```bash
# Set your storage account name
export AZURE_STORAGE_ACCOUNT_NAME="your-storage-account-name"

# Run the program
npm start
```

## What It Does

1. ✓ Creates a BlobServiceClient using DefaultAzureCredential
2. ✓ Creates a container named "my-container" (if it doesn't exist)
3. ✓ Uploads "Hello Azure!" as "greeting.txt"
4. ✓ Lists all blobs in the container
5. ✓ Downloads the blob and prints its content
6. ✓ Deletes the blob and container

## Error Handling

The program includes comprehensive error handling:
- RestError for Azure-specific errors with status codes
- Generic Error handling for other exceptions
- Graceful handling of container already exists (409 conflict)
