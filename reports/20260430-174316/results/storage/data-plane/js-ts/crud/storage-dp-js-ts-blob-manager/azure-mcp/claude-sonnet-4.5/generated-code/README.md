# Azure Blob Storage Manager

A reusable TypeScript utility for managing Azure Blob Storage operations with support for managed identity authentication, streaming uploads, lease-based concurrency control, and blob index tags.

## Features

### 🔐 Secure Authentication
- Uses **Managed Identity** (DefaultAzureCredential) - no connection strings or account keys
- Suitable for production deployment in Azure (App Service, Functions, VMs, AKS, etc.)

### 📤 Efficient Upload/Download
- **Streaming uploads** - handles multi-gigabyte files without loading into memory
- Configurable buffer size and concurrent uploads
- Support for metadata and blob index tags
- Content type configuration

### 🔒 Concurrency Control
- **Lease-based locking** prevents concurrent writers from overwriting each other
- Acquire lease → modify blob → release lease workflow

### 🔄 Retry & Resilience
- Custom exponential backoff retry policy
- Configurable max retries and delay
- Built-in SDK logging for debugging

### 🏷️ Blob Organization
- Metadata support for arbitrary key-value pairs
- Blob index tags for efficient querying
- List and filter blobs by tags

## Installation

```bash
npm install
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
AZURE_STORAGE_ENDPOINT=https://yourstorageaccount.blob.core.windows.net

# Optional
AZURE_STORAGE_CONTAINER=demo-container
AZURE_STORAGE_MAX_RETRIES=3
AZURE_STORAGE_RETRY_DELAY_MS=1000
AZURE_STORAGE_LOG_LEVEL=info
```

### Managed Identity Setup

For local development, authenticate via Azure CLI:
```bash
az login
```

For Azure-hosted apps (App Service, Functions, VMs):
1. Enable Managed Identity on your resource
2. Grant the identity "Storage Blob Data Contributor" role on your storage account
3. No additional configuration needed - DefaultAzureCredential handles it automatically

## Usage

### Build

```bash
npm run build
```

### Run Demo

```bash
npm run dev
```

Or with compiled code:
```bash
npm run build
npm start
```

### Using the Service Class

```typescript
import { createStorageConfigFromEnv } from './config';
import { BlobStorageService } from './blobService';

// Initialize
const storageConfig = createStorageConfigFromEnv();
const blobService = new BlobStorageService(
  storageConfig.getBlobServiceClient(),
  'my-container'
);

// Ensure container exists
await blobService.ensureContainer();

// Upload with tags and metadata
await blobService.uploadFile('myfile.txt', './local/path.txt', {
  metadata: { uploadedBy: 'user123' },
  tags: { environment: 'production', version: '1.0' },
  contentType: 'text/plain'
});

// List blobs
const blobs = await blobService.listBlobs();

// Query by tags
const matches = await blobService.queryBlobsByTags("environment='production'");

// Download
await blobService.downloadToFile('myfile.txt', './output.txt');

// Lease-based update (prevents concurrent modifications)
const lease = await blobService.acquireLease('myfile.txt', 60);
await blobService.uploadFileWithLease('myfile.txt', './updated.txt', lease.leaseId);
await blobService.releaseLease('myfile.txt', lease.leaseId);

// Delete
await blobService.deleteBlob('myfile.txt');
```

## Architecture

### `src/config.ts`
- Configures BlobServiceClient with managed identity
- Sets up exponential backoff retry policy
- Configures SDK logging

### `src/blobService.ts`
- Core service class wrapping blob operations
- Streaming upload/download for memory efficiency
- Lease management for concurrency control
- Blob listing and tag-based querying

### `src/index.ts`
- Demo script showcasing all operations
- End-to-end workflow example

## API Reference

### BlobStorageService

#### `uploadFile(blobName, filePath, options?)`
Upload a file using streaming. Memory-efficient for large files.

#### `uploadStream(blobName, stream, options?)`
Upload from a readable stream.

#### `downloadToFile(blobName, destinationPath)`
Download blob to a file.

#### `downloadToBuffer(blobName)`
Download blob content to memory as Buffer.

#### `listBlobs()`
List all blobs with metadata and tags.

#### `deleteBlob(blobName)`
Delete a blob.

#### `acquireLease(blobName, durationSeconds?)`
Acquire an exclusive lease on a blob (default 60 seconds).

#### `releaseLease(blobName, leaseId)`
Release an acquired lease.

#### `uploadFileWithLease(blobName, filePath, leaseId, options?)`
Upload while holding a lease - prevents concurrent modifications.

#### `queryBlobsByTags(tagQuery)`
Find blobs matching a tag query (e.g., `"category='demo' AND version='1.0'"`).

## Requirements

- Node.js 16+
- TypeScript 5+
- Azure Storage Account with Blob service
- Managed Identity or Azure CLI authentication

## License

MIT
