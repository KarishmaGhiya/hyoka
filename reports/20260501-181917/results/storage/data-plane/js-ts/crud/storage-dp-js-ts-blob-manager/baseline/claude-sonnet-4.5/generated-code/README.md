# Azure Blob Storage Manager

A production-ready TypeScript utility for managing Azure Blob Storage operations with streaming support, lease-based concurrency control, and managed identity authentication.

## Features

### 🚀 Core Capabilities
- **Streaming uploads** - Handle multi-gigabyte files efficiently without loading into memory
- **Lease-based concurrency control** - Prevent concurrent overwrites using blob leases
- **Managed Identity authentication** - Secure authentication without connection strings or account keys
- **Custom retry policies** - Exponential backoff with configurable parameters
- **Metadata and Index Tags** - Organize and query blobs effectively
- **Configurable logging** - Azure SDK logging at multiple levels

### 📦 Operations Supported
- Upload files (streaming) with metadata and tags
- Upload content from buffers/strings
- Download blobs to files or buffers
- List blobs with filtering
- Delete blobs
- Lease acquisition for safe concurrent access

## Prerequisites

- Node.js 18 or higher
- Azure Storage Account
- Managed Identity configured (when running in Azure)
- For local development: Azure CLI or environment variables for authentication

## Installation

```bash
npm install
```

## Configuration

### Environment Variables

Create a `.env` file or set the following environment variables:

```bash
# Required
AZURE_STORAGE_ACCOUNT_ENDPOINT=https://youraccount.blob.core.windows.net

# Optional
AZURE_CONTAINER_NAME=demo-container
AZURE_LOG_LEVEL=info  # verbose | info | warning | error
```

### Managed Identity Setup

This utility uses `DefaultAzureCredential` from `@azure/identity`, which automatically handles authentication in Azure environments:

- **Azure App Service / Functions**: Automatically uses managed identity
- **Azure VM / AKS**: Uses system-assigned or user-assigned managed identity
- **Local Development**: Falls back to Azure CLI credentials or environment variables

Ensure your managed identity has the following permissions on the Storage Account:
- `Storage Blob Data Contributor` or
- `Storage Blob Data Owner`

## Usage

### Build the Project

```bash
npm run build
```

### Run the Demo

```bash
npm start
```

Or for development:

```bash
npm run dev
```

### Using in Your Code

```typescript
import { BlobStorageConfigManager } from './config/blobConfig';
import { BlobStorageService } from './services/blobService';

// Initialize
const configManager = new BlobStorageConfigManager({
  accountEndpoint: 'https://youraccount.blob.core.windows.net',
  maxRetries: 3,
  maxRetryDelayMs: 4000,
  logLevel: 'info',
});

const blobServiceClient = configManager.getBlobServiceClient();
const blobService = new BlobStorageService(blobServiceClient);

// Upload a file with streaming (efficient for large files)
await blobService.uploadFile(
  'my-container',
  'my-blob.txt',
  '/path/to/file.txt',
  {
    metadata: { author: 'john-doe', version: '1.0' },
    tags: { environment: 'production', type: 'data' },
    contentType: 'text/plain',
  }
);

// Upload with lease (prevent concurrent writes)
await blobService.uploadWithLease(
  'my-container',
  'my-blob.txt',
  'Updated content',
  15, // 15-second lease
  { metadata: { updated: 'true' } }
);

// Download to buffer
const content = await blobService.downloadToBuffer('my-container', 'my-blob.txt');
console.log(content.toString('utf-8'));

// List blobs
const blobs = await blobService.listBlobs('my-container', {
  includeMetadata: true,
  includeTags: true,
});

// Delete blob
await blobService.deleteBlob('my-container', 'my-blob.txt');
```

## Architecture

### Configuration Module (`src/config/blobConfig.ts`)
- Manages Azure SDK configuration
- Sets up `DefaultAzureCredential` for managed identity
- Configures exponential backoff retry policy
- Enables SDK logging at specified levels

### Service Module (`src/services/blobService.ts`)
- Wraps Azure Blob Storage operations
- Provides streaming upload for large files
- Implements lease-based concurrency control
- Handles metadata and index tags
- Offers both file and buffer-based operations

### Main Script (`src/index.ts`)
- Demonstrates all core operations
- Shows best practices for error handling
- Provides a working example of the complete workflow

## Streaming Upload Details

The service uses `uploadStream()` for file uploads, which:
- Reads files in chunks (default: 4 MB blocks)
- Uploads blocks in parallel (default: 5 concurrent uploads)
- Never loads the entire file into memory
- Efficiently handles files of any size (including multi-gigabyte files)

```typescript
// Example: Upload a 10 GB file with custom block size
await blobService.uploadFile(
  'my-container',
  'large-file.bin',
  '/path/to/10gb-file.bin',
  {
    blockSize: 8 * 1024 * 1024,  // 8 MB blocks
    concurrency: 10,              // 10 parallel uploads
  }
);
```

## Lease-Based Concurrency Control

Leases prevent multiple clients from overwriting the same blob simultaneously:

```typescript
// This will acquire a 15-second lease before writing
// If another client holds the lease, the operation will fail
await blobService.uploadWithLease(
  'my-container',
  'shared-blob.txt',
  'New content',
  15  // Lease duration in seconds (15-60, or -1 for infinite)
);
```

## Retry Policy

The utility configures exponential backoff with:
- Configurable max retries (default: 3)
- Configurable max delay (default: 4000ms)
- Initial delay: 800ms
- Automatic retry on transient failures

## Error Handling

The service throws descriptive errors for common scenarios:
- Missing configuration
- Lease conflicts (409 status)
- Network failures
- Authentication issues

Always wrap operations in try-catch blocks:

```typescript
try {
  await blobService.uploadFile('container', 'blob', 'file.txt');
} catch (error) {
  if (error.statusCode === 409) {
    console.error('Blob is leased by another client');
  } else {
    console.error('Upload failed:', error.message);
  }
}
```

## Development

### Project Structure
```
.
├── src/
│   ├── config/
│   │   └── blobConfig.ts       # Configuration and client setup
│   ├── services/
│   │   └── blobService.ts      # Blob operations service
│   └── index.ts                # Demo script
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled demo
- `npm run dev` - Run with ts-node (development)
- `npm run clean` - Remove dist folder

## Security Best Practices

✅ **DO:**
- Use managed identity in Azure environments
- Use `DefaultAzureCredential` for authentication
- Store account endpoints in environment variables
- Use leases for concurrent access control
- Validate file sizes before upload

❌ **DON'T:**
- Store connection strings or account keys in code
- Commit credentials to source control
- Use account key authentication in production
- Upload files without size validation

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
- TypeScript strict mode compliance
- Comprehensive error handling
- Documentation for public APIs
- Tests for new features
