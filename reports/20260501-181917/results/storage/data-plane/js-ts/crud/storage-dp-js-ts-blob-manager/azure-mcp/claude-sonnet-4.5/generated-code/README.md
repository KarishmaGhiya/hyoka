# Azure Blob Storage Manager

A reusable TypeScript utility for managing Azure Blob Storage with advanced features including streaming uploads, lease-based concurrency control, and managed identity authentication.

## Features

- **Streaming Upload/Download**: Efficiently handles large files without loading entire content into memory
- **Managed Identity Authentication**: Secure authentication using Azure DefaultAzureCredential (no connection strings or keys)
- **Lease-Based Concurrency Control**: Prevents concurrent writers from overwriting each other's changes
- **Metadata & Index Tags**: Support for blob metadata and searchable index tags
- **Custom Retry Policy**: Configurable exponential backoff with retry limits
- **SDK Logging**: Configurable logging levels for debugging

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
AZURE_STORAGE_ACCOUNT_ENDPOINT=https://<your-storage-account>.blob.core.windows.net
AZURE_STORAGE_CONTAINER_NAME=demo-container
MAX_RETRIES=3
RETRY_DELAY_MS=1000
LOG_LEVEL=info
```

### Authentication

This project uses **Azure Managed Identity** (DefaultAzureCredential) for secure authentication:

- **Local Development**: Uses Azure CLI credentials (`az login`)
- **Azure Hosting**: Automatically uses the assigned Managed Identity

No connection strings or account keys are required!

## Usage

### Build the Project

```bash
npm run build
```

### Run the Demo

```bash
npm start
```

Or for development with ts-node:

```bash
npm run dev
```

### Using the Service in Your Code

```typescript
import { BlobStorageService } from './blob-service';

const blobService = new BlobStorageService();

// Upload with metadata and tags
await blobService.uploadFile('local-file.txt', 'remote-blob.txt', {
  metadata: { author: 'user123', category: 'docs' },
  tags: { environment: 'prod', project: 'myapp' },
  contentType: 'text/plain'
});

// List all blobs
const blobs = await blobService.listBlobs();
console.log(blobs);

// Download a blob
await blobService.downloadFile('remote-blob.txt', 'downloaded.txt');

// Acquire lease, update, and release
const leaseId = await blobService.acquireLease('remote-blob.txt', 30);
await blobService.uploadWithLease('updated.txt', 'remote-blob.txt', leaseId);
await blobService.releaseLease('remote-blob.txt', leaseId);

// Delete a blob
await blobService.deleteBlob('remote-blob.txt');
```

## Architecture

### Project Structure

```
├── src/
│   ├── config.ts          # Configuration and Azure SDK setup
│   ├── blob-service.ts    # Main blob storage service class
│   └── index.ts           # Demo script
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Key Components

#### Configuration Module (`config.ts`)
- Loads environment variables
- Sets up Azure SDK logging
- Creates BlobServiceClient with custom retry policy
- Uses DefaultAzureCredential for managed identity

#### Blob Service (`blob-service.ts`)
- `uploadFile()`: Streaming upload for memory efficiency
- `downloadFile()`: Streaming download
- `listBlobs()`: List with metadata and tags
- `deleteBlob()`: Remove blobs
- `acquireLease()`: Get exclusive write access
- `uploadWithLease()`: Update with concurrency protection
- `releaseLease()`: Release exclusive access

## Security Best Practices

✅ Uses managed identity (no secrets in code)
✅ DefaultAzureCredential for multiple auth methods
✅ Lease-based concurrency control
✅ Configurable retry policies
✅ No hardcoded credentials

## Requirements

- Node.js >= 18.0.0
- Azure Storage Account
- Managed Identity or Azure CLI authentication

## License

MIT
