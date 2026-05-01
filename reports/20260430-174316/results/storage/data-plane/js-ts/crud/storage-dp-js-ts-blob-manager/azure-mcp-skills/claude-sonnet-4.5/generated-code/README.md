# Azure Blob Storage Manager

A reusable TypeScript utility for managing Azure Blob Storage with enterprise features including streaming uploads, lease management, and managed identity authentication.

## Features

- **Streaming Uploads**: Efficiently upload large files without loading them entirely into memory
- **Managed Identity**: Secure authentication using Azure Managed Identity (no connection strings or keys)
- **Lease Management**: Prevent concurrent writes by acquiring blob leases before updates
- **Metadata & Tags**: Support for blob metadata and index tags for organization and querying
- **Custom Retry Policy**: Configurable exponential backoff retry logic
- **SDK Logging**: Configurable Azure SDK logging for debugging

## Project Structure

```
.
├── src/
│   ├── config.ts          # Configuration and Azure client setup
│   ├── blob-service.ts    # Core blob storage operations
│   └── index.ts           # Demo application
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Prerequisites

- Node.js 18+
- Azure Storage Account
- Azure Managed Identity configured (or Azure CLI logged in for local development)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   
   Copy `.env.example` to `.env` and update:
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   AZURE_STORAGE_ACCOUNT_ENDPOINT=https://<your-storage-account>.blob.core.windows.net
   AZURE_STORAGE_CONTAINER_NAME=demo-container
   RETRY_MAX_RETRIES=3
   RETRY_MAX_DELAY_MS=60000
   AZURE_LOG_LEVEL=info
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Run the demo**:
   ```bash
   npm start
   ```

## Usage

### BlobStorageService API

```typescript
import { BlobStorageService } from './blob-service';

const blobService = new BlobStorageService();

// Upload with metadata and tags
await blobService.upload('myfile.txt', './local-file.txt', {
  metadata: { author: 'john', version: '1.0' },
  tags: { project: 'demo', env: 'dev' }
});

// List blobs
const blobs = await blobService.listBlobs();

// Download
const buffer = await blobService.download('myfile.txt', './downloaded.txt');

// Acquire lease and upload (prevents concurrent writes)
const lease = await blobService.acquireLease('myfile.txt', 60);
await blobService.uploadWithLease(lease, './updated-file.txt');
await blobService.releaseLease(lease);

// Delete
await blobService.delete('myfile.txt');
```

## Authentication

This utility uses **Azure Managed Identity** via `DefaultAzureCredential`, which automatically handles:

- **In Azure**: Uses the managed identity assigned to the resource (VM, App Service, Function, etc.)
- **Local Development**: Falls back to Azure CLI credentials or other configured authentication methods

### Required Permissions

Assign the following role to the managed identity or user:
- **Storage Blob Data Contributor** (for read/write/delete operations)

## Configuration

### Retry Policy

Customize retry behavior in `.env`:
- `RETRY_MAX_RETRIES`: Maximum number of retry attempts (default: 3)
- `RETRY_MAX_DELAY_MS`: Maximum delay between retries in milliseconds (default: 60000)

### Logging

Set `AZURE_LOG_LEVEL` to control SDK logging verbosity:
- `verbose`: Detailed debugging information
- `info`: General informational messages
- `warning`: Warning messages only
- `error`: Error messages only

## Architecture Highlights

### Streaming for Large Files

The `upload()` method uses `uploadStream()` with:
- 4MB buffer size per chunk
- 5 concurrent upload operations
- No memory limit constraints

This allows uploading multi-gigabyte files efficiently.

### Lease-Based Concurrency Control

The lease mechanism ensures exclusive write access:

1. Acquire lease (locks the blob for specified duration)
2. Perform updates with lease ID
3. Release lease (unlocks the blob)

Attempts to modify a leased blob without the lease ID will fail, preventing race conditions.

## License

MIT
