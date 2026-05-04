# Azure Blob Storage Manager

A reusable TypeScript utility for managing Azure Blob Storage operations with streaming support, managed identity authentication, and lease-based concurrency control.

## Features

- **Streaming Upload**: Handle multi-gigabyte files without loading entire content into memory
- **Managed Identity Authentication**: Secure authentication using DefaultAzureCredential (no connection strings or keys)
- **Lease-Based Concurrency Control**: Prevent concurrent writers from overwriting changes
- **Blob Index Tags**: Tag blobs for efficient querying and organization
- **Custom Metadata**: Attach custom metadata to blobs
- **Custom Retry Policy**: Configurable exponential backoff retry logic
- **SDK Logging**: Configurable log levels for debugging
- **Complete CRUD Operations**: Upload, download, list, and delete blobs

## Prerequisites

- Node.js 18+ and npm
- Azure Storage Account with a blob container
- Azure authentication configured (one of):
  - Managed Identity (when running in Azure)
  - Azure CLI (`az login`)
  - Visual Studio Code Azure extension
  - Service Principal with environment variables

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file or set environment variables:

```bash
# Required
AZURE_STORAGE_ACCOUNT_ENDPOINT=https://<your-storage-account>.blob.core.windows.net

# Optional
AZURE_STORAGE_CONTAINER_NAME=demo-container  # Default: demo-container
MAX_RETRIES=3                                 # Default: 3
RETRY_DELAY_MS=1000                          # Default: 1000
LOG_LEVEL=info                               # Default: info (verbose, info, warning, error)
```

## Usage

### Build and Run

```bash
npm run build
npm start
```

### Using the Service in Your Code

```typescript
import { BlobStorageConfiguration } from "./config";
import { BlobStorageService } from "./blob-service";

// Initialize configuration
const config = BlobStorageConfiguration.fromEnvironment();
const service = new BlobStorageService(
  config.getServiceClient(),
  config.getContainerName()
);

// Ensure container exists
await service.ensureContainer();

// Upload a blob with streaming
const uploadResult = await service.uploadBlob(
  "my-file.txt",
  "./local-file.txt",
  {
    metadata: { uploadedBy: "user123" },
    tags: { category: "documents", status: "active" },
    contentType: "text/plain"
  }
);

// Upload with lease protection (prevents concurrent writes)
const leaseResult = await service.uploadBlobWithLease(
  "important-file.txt",
  "./important-data.txt",
  {
    metadata: { protected: "true" },
    tags: { critical: "yes" }
  }
);

// List blobs
const blobs = await service.listBlobs();
blobs.forEach(blob => console.log(blob.name));

// Download a blob
const downloadResult = await service.downloadBlob("my-file.txt");
console.log(downloadResult.content?.toString("utf-8"));

// Download to file
await service.downloadBlob("my-file.txt", { 
  filePath: "./downloaded-file.txt" 
});

// Delete a blob
await service.deleteBlob("my-file.txt");
```

## Architecture

### Configuration Module (`src/config.ts`)

- Uses `DefaultAzureCredential` for secure, passwordless authentication
- Configures exponential backoff retry policy
- Sets up Azure SDK logging
- Provides environment-based configuration loading

### Service Class (`src/blob-service.ts`)

- **`uploadBlob()`**: Streaming upload with metadata and index tags
- **`uploadBlobWithLease()`**: Upload with lease acquisition to prevent concurrent writes
- **`downloadBlob()`**: Download to buffer or file
- **`listBlobs()`**: List all blobs in container with optional prefix filter
- **`deleteBlob()`**: Delete a blob

### Demo Script (`src/index.ts`)

Demonstrates all operations:
1. Initialize configuration
2. Create service instance
3. Create sample file
4. Upload with metadata and tags
5. List blobs
6. Download and display content
7. Update with lease protection
8. Verify update
9. Delete blob
10. Verify deletion

## Authentication Flow

The utility uses `DefaultAzureCredential`, which tries credentials in this order:

1. Environment variables (Service Principal)
2. Workload Identity (Kubernetes)
3. Managed Identity (Azure VMs, App Service, Functions)
4. Visual Studio Code
5. Azure CLI
6. Azure PowerShell
7. Azure Developer CLI

This means the same code works:
- **Locally**: Uses your Azure CLI or VS Code credentials
- **In Azure**: Uses Managed Identity automatically

## Security Best Practices

✅ **What this project does:**
- Uses managed identity (no secrets in code)
- Implements lease-based concurrency control
- Configurable retry logic with exponential backoff
- Streaming to handle large files efficiently

❌ **What this project avoids:**
- Connection strings with account keys
- Hardcoded credentials
- Loading entire large files into memory
- Unprotected concurrent writes

## Performance Considerations

- **Streaming Upload**: Uses 4MB chunks with 20 concurrent uploads
- **Memory Efficient**: Large files are streamed, not loaded into memory
- **Retry Logic**: Exponential backoff with configurable delays
- **Concurrent Operations**: Multiple uploads can run in parallel

## Troubleshooting

### Authentication Issues

```bash
# Ensure you're logged in with Azure CLI
az login

# Verify your account
az account show

# List storage accounts
az storage account list
```

### Permission Issues

Ensure your identity has the appropriate RBAC roles:
- `Storage Blob Data Contributor` - Full read/write access
- `Storage Blob Data Reader` - Read-only access

```bash
# Assign role to your user
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee your-email@example.com \
  --scope /subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{account}
```

## License

MIT
