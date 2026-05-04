# Azure Blob Storage Manager

A reusable TypeScript utility for managing Azure Blob Storage operations with streaming support, lease-based concurrency control, and enterprise-grade configuration.

## Features

- **Streaming Uploads**: Efficiently handle large files (multi-gigabyte) without loading into memory
- **Lease-Based Concurrency**: Prevent concurrent writers from overwriting changes
- **Metadata & Tags**: Support for blob metadata and index tags for querying
- **Managed Identity**: Secure authentication without connection strings or account keys
- **Custom Retry Policy**: Configurable exponential backoff with retry limits
- **SDK Logging**: Configurable Azure SDK logging levels for debugging
- **TypeScript**: Full type safety and IntelliSense support

## Prerequisites

- Node.js >= 18.0.0
- Azure Storage Account
- One of the following authentication methods:
  - **Local Development**: Azure CLI (`az login`)
  - **Production**: Azure Managed Identity (App Service, VM, Container Apps, AKS, etc.)
  - **Alternative**: Service Principal credentials

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configure the following environment variables:

```bash
# Required
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name

# Optional
AZURE_STORAGE_CONTAINER_NAME=demo-container
MAX_RETRIES=3
RETRY_DELAY_MS=1000
MAX_RETRY_DELAY_MS=30000
AZURE_LOG_LEVEL=info
```

## Authentication

This project uses **Azure Managed Identity** via `DefaultAzureCredential`. No connection strings or account keys are required.

### Local Development

1. Install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli
2. Log in: `az login`
3. Run the application

### Production (Azure)

Deploy to any Azure service with Managed Identity:

- **App Service**: Enable System-Assigned or User-Assigned Managed Identity
- **Container Apps**: Configure managed identity in container settings
- **Virtual Machine**: Enable managed identity in VM settings
- **AKS**: Use Azure AD Workload Identity

Assign the Managed Identity the **Storage Blob Data Contributor** role on your storage account:

```bash
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee <managed-identity-principal-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<account>
```

## Build and Run

```bash
# Build TypeScript
npm run build

# Run the demo
npm start

# Build and run in one command
npm run dev
```

## Usage

### Configuration Module

```typescript
import { createStorageConfig } from "./config.js";

const config = createStorageConfig();
const blobServiceClient = config.getClient();
```

### Service Class

```typescript
import { BlobStorageService } from "./blob-storage.service.js";

const blobService = new BlobStorageService(
  blobServiceClient,
  "my-container"
);

await blobService.initialize();

// Upload with metadata and tags
await blobService.uploadFile("myfile.txt", "./local/path.txt", {
  metadata: { author: "user1", version: "1.0" },
  tags: { project: "demo", status: "active" },
  contentType: "text/plain",
  onProgress: (bytes) => console.log(`Uploaded: ${bytes} bytes`)
});

// Download
await blobService.downloadToFile("myfile.txt", "./downloads/myfile.txt");

// List blobs
const blobs = await blobService.listBlobs();
for (const blob of blobs) {
  console.log(`${blob.name} - ${blob.size} bytes`);
}

// Update with lease protection
await blobService.uploadWithLease("myfile.txt", "Updated content", {
  metadata: { updated: "true" }
});

// Delete
await blobService.deleteBlob("myfile.txt");
```

## Demo Script

The `main.ts` demonstrates:

1. ✅ Upload a file with metadata and tags
2. ✅ List all blobs in the container
3. ✅ Download and display content
4. ✅ Acquire lease and safely update blob
5. ✅ Verify updated content
6. ✅ Get blob properties
7. ✅ Delete blob
8. ✅ Verify deletion

## API Reference

### BlobStorageService

#### `uploadFile(blobName, filePath, options?)`
Upload a file with streaming support (efficient for large files).

#### `uploadWithLease(blobName, content, options?)`
Upload with lease-based concurrency control to prevent overwriting.

#### `downloadToFile(blobName, destinationPath)`
Download a blob to a local file.

#### `downloadToString(blobName)`
Download blob content as a string.

#### `listBlobs(prefix?)`
List all blobs in the container with metadata and tags.

#### `deleteBlob(blobName)`
Delete a blob.

#### `blobExists(blobName)`
Check if a blob exists.

#### `getBlobProperties(blobName)`
Get blob metadata, tags, and properties.

## Retry Policy

The SDK is configured with exponential backoff:

- **Default Max Retries**: 3
- **Initial Delay**: 1 second
- **Max Delay**: 30 seconds
- **Type**: Exponential

Configure via environment variables:
```bash
MAX_RETRIES=5
RETRY_DELAY_MS=2000
MAX_RETRY_DELAY_MS=60000
```

## Logging

Set the Azure SDK log level:

```bash
AZURE_LOG_LEVEL=verbose  # verbose, info, warning, error
```

Logs include timestamps and are prefixed with `[Azure SDK]`.

## Security Best Practices

✅ **DO**: Use Managed Identity in production  
✅ **DO**: Use Azure CLI for local development  
✅ **DO**: Assign least-privilege RBAC roles  
✅ **DO**: Use blob leases for concurrent writes  

❌ **DON'T**: Commit connection strings or keys to source control  
❌ **DON'T**: Use account keys in production  
❌ **DON'T**: Share credentials across environments  

## Troubleshooting

### "AZURE_STORAGE_ACCOUNT_NAME environment variable is required"
Set the `AZURE_STORAGE_ACCOUNT_NAME` in your `.env` file or environment.

### Authentication errors
- **Local**: Run `az login` and ensure you have access to the storage account
- **Azure**: Verify Managed Identity is enabled and has "Storage Blob Data Contributor" role

### Lease conflicts
If you see lease errors, ensure no other process is holding a lease on the blob. Leases expire after 30 seconds.

## License

MIT
