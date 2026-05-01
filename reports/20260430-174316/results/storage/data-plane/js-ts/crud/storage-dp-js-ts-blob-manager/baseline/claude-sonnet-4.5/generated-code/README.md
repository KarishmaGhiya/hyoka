# Azure Blob Storage Manager

A reusable TypeScript utility for managing Azure Blob Storage with streaming support, managed identity authentication, and lease-based concurrency control.

## Features

- ✅ **Streaming uploads** - Efficiently handle multi-gigabyte files without loading them into memory
- ✅ **Managed Identity** - Secure authentication using Azure DefaultAzureCredential (no connection strings or keys)
- ✅ **Blob index tags** - Tag blobs for easy querying and organization
- ✅ **Lease-based concurrency** - Prevent concurrent writers from overwriting each other
- ✅ **Custom retry policy** - Exponential backoff with configurable max retries and delays
- ✅ **SDK logging** - Configurable log levels for debugging
- ✅ **Complete operations** - Upload, download, list, and delete with metadata support

## Prerequisites

- Node.js 18+ and npm
- Azure Storage Account
- Azure credentials configured (managed identity, Azure CLI, or environment variables)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
AZURE_STORAGE_CONTAINER_NAME=yourcontainer

# Optional: Retry Policy Configuration
MAX_RETRIES=3
RETRY_DELAY_MS=800

# Optional: SDK Logging Level (verbose, info, warning, error)
LOG_LEVEL=info
```

## Authentication

This project uses `DefaultAzureCredential` which attempts authentication in this order:

1. Environment variables (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
2. Managed Identity (when running in Azure)
3. Azure CLI credentials
4. Azure PowerShell credentials
5. Interactive browser authentication

For local development, authenticate using Azure CLI:

```bash
az login
```

## Usage

### Build the project

```bash
npm run build
```

### Run the demo

```bash
npm start
```

Or run in development mode:

```bash
npm run dev
```

## API Reference

### BlobStorageService

#### `uploadStream(blobName, stream, options?)`
Upload data from a readable stream with optional metadata and tags.

#### `uploadFile(blobName, filePath, options?)`
Upload a file from the local filesystem.

#### `uploadWithLease(blobName, stream, options?)`
Upload with lease acquisition to prevent concurrent overwrites.

#### `download(blobName)`
Download a blob as a Buffer.

#### `downloadToFile(blobName, destinationPath)`
Download a blob directly to a file.

#### `listBlobs(prefix?)`
List all blobs in the container with optional prefix filter.

#### `deleteBlob(blobName)`
Delete a blob.

#### `blobExists(blobName)`
Check if a blob exists.

## Project Structure

```
├── src/
│   ├── config.ts          # Configuration and Azure SDK setup
│   ├── blobService.ts     # Core blob storage operations
│   └── index.ts           # Demo script
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Security Best Practices

- ✅ Uses managed identity - no connection strings or keys in code
- ✅ Credentials loaded from environment variables
- ✅ Lease-based locking prevents concurrent modification conflicts
- ✅ Custom retry policy handles transient failures

## License

MIT
