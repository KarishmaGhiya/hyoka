# Azure Blob Storage CRUD Operations

This TypeScript program demonstrates complete CRUD operations on Azure Blob Storage using the Azure SDK.

## Required npm Packages

```json
{
  "@azure/storage-blob": "^12.17.0",
  "@azure/identity": "^4.0.0"
}
```

## Features

✅ **Create**: BlobServiceClient with DefaultAzureCredential  
✅ **Create**: Container if it doesn't exist  
✅ **Upload**: String content as a block blob  
✅ **Read**: List all blobs in the container  
✅ **Download**: Blob content as a string  
✅ **Delete**: Blob and container cleanup  
✅ **Error Handling**: Proper RestError handling throughout  
✅ **Async/Await**: Modern async patterns  

## Prerequisites

1. An Azure Storage Account
2. Azure credentials configured (one of the following):
   - Azure CLI: `az login`
   - Environment variables (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)
   - Managed Identity (when running in Azure)

3. Set the storage account name:
   ```bash
   export AZURE_STORAGE_ACCOUNT_NAME="your-storage-account-name"
   ```

## Installation

```bash
npm install
```

## Build and Run

```bash
# Compile TypeScript
npm run build

# Run the program
npm start
```

## What the Program Does

1. **Creates BlobServiceClient** using DefaultAzureCredential for authentication
2. **Creates container** named "my-container" (if it doesn't already exist)
3. **Uploads** a string "Hello Azure!" as a blob named "greeting.txt"
4. **Lists** all blobs in the container with their metadata
5. **Downloads** the blob and prints its content
6. **Deletes** the blob and then the container to clean up

## Error Handling

The program includes comprehensive error handling:
- Catches `RestError` exceptions from Azure SDK
- Logs status codes, error codes, and detailed messages
- Exits with appropriate error codes
- Validates required environment variables

## Authentication with DefaultAzureCredential

`DefaultAzureCredential` tries multiple authentication methods in order:
1. Environment variables
2. Managed Identity
3. Azure CLI
4. Azure PowerShell
5. Interactive browser login

This makes the code work seamlessly across development and production environments.
