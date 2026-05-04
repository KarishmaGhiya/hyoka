# Azure Blob Storage Manager

A TypeScript Node.js utility for managing Azure Blob Storage operations with enterprise-grade features including streaming uploads, lease-based concurrency control, and managed identity authentication.

## Features

- **Streaming Upload**: Efficiently handle large files (multi-GB) without loading into memory
- **Lease-Based Concurrency Control**: Prevent concurrent writers from overwriting changes
- **Managed Identity Authentication**: Secure access without connection strings or account keys
- **Metadata & Index Tags**: Attach searchable metadata to blobs
- **Custom Retry Policy**: Configurable exponential backoff for resilience
- **SDK Logging**: Configurable logging levels for debugging

## Prerequisites

- Node.js 18+
- Azure Storage Account
- Azure Managed Identity (when running in Azure) or Azure CLI (for local development)

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
AZURE_STORAGE_ENDPOINT=https://yourstorageaccount.blob.core.windows.net
CONTAINER_NAME=demo-container
MAX_RETRIES=3
RETRY_DELAY_MS=4000
LOG_LEVEL=info
```

## Authentication

This utility uses **DefaultAzureCredential** which automatically handles authentication in multiple environments:

- **Azure (Production)**: Uses Managed Identity automatically
- **Local Development**: Uses Azure CLI credentials (run `az login` first)
- **CI/CD**: Uses Service Principal via environment variables

**No connection strings or account keys required!**

## Usage

### Build and Run

```bash
# Build TypeScript
npm run build

# Run demo
npm start
```

### Development

```bash
# Run with ts-node (no build step)
npm run dev
```

### Using the Service

```typescript
import { loadConfig, createBlobServiceClient } from './config';
import { BlobStorageService } from './blob-service';

// Initialize
const config = loadConfig();
const client = createBlobServiceClient(config);
const service = new BlobStorageService(client, config.containerName);

// Ensure container exists
await service.ensureContainer();

// Upload with streaming (memory efficient)
await service.uploadFile('myfile.txt', '/path/to/file.txt', {
  metadata: { author: 'user123' },
  tags: { project: 'demo', env: 'prod' },
});

// List blobs
const blobs = await service.listBlobs();

// Download
const content = await service.downloadBlob('myfile.txt');

// Safe update with lease
const lease = await service.acquireLease('myfile.txt', 60);
await service.uploadWithLease('myfile.txt', 'new content', lease);
await service.releaseLease(lease);

// Delete
await service.deleteBlob('myfile.txt');
```

## Project Structure

```
.
├── src/
│   ├── config.ts         # Configuration and client setup
│   ├── blob-service.ts   # Core blob operations service
│   └── index.ts          # Demo script
├── package.json
├── tsconfig.json
└── .env.example
```

## Key Components

### Configuration Module (`config.ts`)
- Loads settings from environment variables
- Creates BlobServiceClient with managed identity
- Configures custom retry policy with exponential backoff
- Sets up SDK logging

### Blob Storage Service (`blob-service.ts`)
- **uploadFile()**: Stream-based upload for large files
- **uploadStream()**: Upload from stream or buffer
- **downloadBlob()**: Download to buffer
- **downloadToFile()**: Stream download to file
- **listBlobs()**: List with metadata and tags
- **deleteBlob()**: Delete blob
- **acquireLease()**: Lock blob for safe updates
- **uploadWithLease()**: Update with lease protection
- **releaseLease()**: Release blob lock

### Demo Script (`index.ts`)
Demonstrates complete workflow:
1. Upload file with metadata and tags
2. List all blobs
3. Download and display content
4. Acquire lease and safely overwrite
5. Delete blob

## License

MIT
