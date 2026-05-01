# Azure Blob Storage Manager

A reusable TypeScript utility for managing Azure Blob Storage with enterprise features including streaming uploads, lease-based concurrency control, managed identity authentication, and custom retry policies.

## Features

### 🚀 **BlobStorageService** - Core Operations
- **Streaming Upload**: Efficiently upload large files (multi-GB) without loading into memory
- **Metadata & Index Tags**: Attach searchable metadata and tags to blobs
- **Download**: Stream or buffer-based downloads with file output support
- **List Blobs**: Enumerate blobs with metadata and tags
- **Delete**: Remove blobs from storage
- **Lease Management**: Acquire/release leases to prevent concurrent write conflicts

### 🔐 **Secure Configuration**
- **Managed Identity**: Uses `DefaultAzureCredential` - no connection strings or keys needed
- **Custom Retry Policy**: Exponential backoff with configurable max retries and delays
- **SDK Logging**: Configurable log levels for debugging (verbose/info/warning/error)

### 📦 **Production Ready**
- Full TypeScript support with type definitions
- Environment-based configuration
- Comprehensive error handling
- Memory-efficient streaming for large files

## Installation

```bash
npm install
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required: Your storage account endpoint
AZURE_STORAGE_ACCOUNT_ENDPOINT=https://mystorageaccount.blob.core.windows.net

# Optional: Container name (default: demo-container)
AZURE_CONTAINER_NAME=my-container

# Optional: Retry configuration
AZURE_STORAGE_MAX_RETRIES=3
AZURE_STORAGE_MAX_RETRY_DELAY_MS=60000

# Optional: Log level
AZURE_LOG_LEVEL=info
```

### Authentication

This project uses **DefaultAzureCredential** which tries multiple authentication methods:

**Local Development:**
```bash
az login
```

**Azure Deployment:**
Enable Managed Identity on your Azure resource (App Service, Function App, VM, etc.)

**Service Principal (CI/CD):**
Set environment variables:
```bash
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_ID=<client-id>
AZURE_CLIENT_SECRET=<client-secret>
```

## Usage

### Build and Run

```bash
# Build TypeScript
npm run build

# Run the demo
npm start

# Or run directly with ts-node
npm run dev
```

### Demo Script

The included demo (`src/index.ts`) showcases all features:
1. Initialize client with managed identity
2. Ensure container exists
3. Upload file with metadata and index tags
4. List all blobs with details
5. Download and display blob content
6. Acquire lease and safely overwrite blob
7. Delete blob
8. Cleanup

### Using the Service

```typescript
import { createBlobStorageConfig } from './config';
import { BlobStorageService } from './blob-service';

// Initialize
const config = createBlobStorageConfig();
const containerClient = config.getContainerClient('my-container');
const blobService = new BlobStorageService(containerClient);

// Upload with streaming (memory-efficient for large files)
await blobService.uploadBlob('large-file.dat', './local-file.dat', {
  metadata: { owner: 'system' },
  tags: { project: 'data-pipeline', env: 'prod' },
  contentType: 'application/octet-stream',
});

// List blobs
const blobs = await blobService.listBlobs();
console.log(`Found ${blobs.length} blobs`);

// Download to buffer
const buffer = await blobService.downloadBlobToBuffer('large-file.dat');

// Acquire lease for safe concurrent updates
const leaseId = await blobService.acquireLease('important-file.dat', 60);
try {
  await blobService.uploadBlobWithLease(
    'important-file.dat',
    updatedStream,
    leaseId
  );
} finally {
  await blobService.releaseLease('important-file.dat', leaseId);
}

// Delete
await blobService.deleteBlob('large-file.dat');
```

## Architecture

```
src/
├── config.ts          # Azure client configuration with managed identity & retry policy
├── blob-service.ts    # Core service class with all blob operations
└── index.ts           # Demo script showcasing all features
```

### Key Design Decisions

1. **Streaming for Large Files**: Uses `uploadStream()` with 4MB buffers and 20 concurrent operations to handle multi-gigabyte files efficiently

2. **Lease-Based Concurrency Control**: Provides `acquireLease()` and `uploadBlobWithLease()` to prevent concurrent overwrites using Azure's lease mechanism

3. **No Secrets in Code**: Uses `DefaultAzureCredential` to support managed identity, Azure CLI, environment variables, and other secure auth methods

4. **Configurable Retry**: Exponential backoff with customizable max retries and delays for resilient operations

5. **Metadata + Tags**: Supports both blob metadata (key-value pairs) and index tags (queryable via Azure's blob index service)

## API Reference

### BlobStorageService

#### `uploadBlob(blobName, filePathOrStream, options?)`
Upload a file with streaming support.
- **Parameters:**
  - `blobName`: Name for the blob
  - `filePathOrStream`: File path or Readable stream
  - `options`: `{ metadata?, tags?, contentType? }`
- **Returns:** `Promise<BlobUploadCommonResponse>`

#### `downloadBlob(blobName)`
Download blob as a stream.
- **Returns:** `Promise<BlobDownloadResponseParsed>`

#### `downloadBlobToBuffer(blobName)`
Download entire blob to memory.
- **Returns:** `Promise<Buffer>`

#### `listBlobs(prefix?)`
List all blobs with metadata and tags.
- **Returns:** `Promise<BlobListItem[]>`

#### `deleteBlob(blobName)`
Delete a blob.

#### `acquireLease(blobName, leaseDurationSeconds?)`
Acquire a lease on a blob (15-60 seconds, or -1 for infinite).
- **Returns:** `Promise<string>` (lease ID)

#### `releaseLease(blobName, leaseId)`
Release an acquired lease.

#### `uploadBlobWithLease(blobName, filePathOrStream, leaseId, options?)`
Upload while holding a lease (prevents concurrent writes).

## Requirements

- Node.js 18+
- TypeScript 5+
- Azure Storage Account
- Azure authentication (managed identity, Azure CLI, or service principal)

## License

MIT

## Contributing

Contributions welcome! This utility is designed to be reusable across projects.
