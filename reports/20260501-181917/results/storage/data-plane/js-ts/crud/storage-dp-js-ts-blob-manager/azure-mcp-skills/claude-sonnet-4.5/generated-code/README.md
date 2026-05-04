# Azure Blob Storage Manager

A production-ready TypeScript utility for managing Azure Blob Storage operations with streaming support, managed identity authentication, and concurrency control.

## Features

- ✅ **Streaming uploads/downloads** - Memory-efficient handling of large files (multi-gigabyte files won't crash your app)
- ✅ **Managed Identity** - Secure authentication without connection strings or account keys
- ✅ **Blob index tags** - Add queryable metadata to blobs
- ✅ **Lease-based concurrency control** - Prevent race conditions when multiple writers access the same blob
- ✅ **Custom retry policy** - Exponential backoff with configurable retries and delays
- ✅ **SDK logging** - Configurable logging for debugging
- ✅ **TypeScript** - Full type safety and IntelliSense support

## Prerequisites

- Node.js 18 or later
- Azure Storage Account
- Azure credentials (one of):
  - Managed Identity (when running in Azure)
  - Azure CLI (`az login` for local development)
  - Service Principal (environment variables)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and set your storage account name:

```env
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
AZURE_CONTAINER_NAME=demo-container
RETRY_MAX_RETRIES=3
RETRY_DELAY_MS=1000
AZURE_LOG_LEVEL=info
```

### Authentication

This project uses **DefaultAzureCredential** from `@azure/identity`, which automatically tries multiple authentication methods in order:

1. **Environment Variables** - `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`
2. **Managed Identity** - When running in Azure (App Service, Functions, VM, etc.)
3. **Azure CLI** - For local development (run `az login` first)
4. **Visual Studio Code** - Uses VS Code Azure Account extension
5. **Azure PowerShell** - Uses PowerShell Azure context

For local development, the easiest approach is:

```bash
az login
```

For production in Azure, assign a managed identity to your resource and grant it the **Storage Blob Data Contributor** role on your storage account.

## Usage

### Build and Run

```bash
# Build TypeScript
npm run build

# Run the demo
npm start
```

### Development Mode

```bash
# Run with ts-node (no build step)
npm run dev
```

## Project Structure

```
azure-blob-storage-manager/
├── src/
│   ├── config/
│   │   └── storage-config.ts      # Configuration and client factory
│   ├── services/
│   │   └── blob-storage.service.ts # Core blob storage operations
│   └── index.ts                    # Demo script
├── dist/                           # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## API Reference

### `StorageClientFactory`

Factory for creating configured `BlobServiceClient` instances.

```typescript
import { StorageClientFactory } from './config/storage-config';

// Load config from environment
const config = StorageClientFactory.loadConfigFromEnv();

// Get client with retry policy and logging
const client = StorageClientFactory.getClient(config);
```

### `BlobStorageService`

Main service class for blob operations.

#### Constructor

```typescript
const service = new BlobStorageService(blobServiceClient, 'container-name');
```

#### Methods

**`uploadFile(blobName: string, filePath: string, options?: UploadOptions): Promise<void>`**

Uploads a file with streaming (memory efficient for large files).

```typescript
await service.uploadFile('data.txt', '/path/to/local/file.txt', {
  metadata: { author: 'john' },
  tags: { department: 'engineering' },
  contentType: 'text/plain'
});
```

**`uploadContent(blobName: string, content: Buffer | string, options?: UploadOptions): Promise<void>`**

Uploads buffer or string content.

```typescript
await service.uploadContent('message.txt', 'Hello, World!', {
  contentType: 'text/plain'
});
```

**`downloadFile(blobName: string, destinationPath: string): Promise<void>`**

Downloads a blob to a local file with streaming.

```typescript
await service.downloadFile('data.txt', '/path/to/destination.txt');
```

**`downloadToBuffer(blobName: string): Promise<Buffer>`**

Downloads blob content to a Buffer.

```typescript
const buffer = await service.downloadToBuffer('data.txt');
console.log(buffer.toString('utf-8'));
```

**`listBlobs(prefix?: string): Promise<BlobMetadata[]>`**

Lists all blobs in the container with metadata.

```typescript
const blobs = await service.listBlobs();
blobs.forEach(blob => {
  console.log(blob.name, blob.size, blob.tags);
});
```

**`deleteBlob(blobName: string): Promise<void>`**

Deletes a blob.

```typescript
await service.deleteBlob('data.txt');
```

**`acquireLease(blobName: string, leaseDurationSeconds?: number): Promise<string>`**

Acquires a lease on a blob to prevent concurrent writes. Returns lease ID.

```typescript
const leaseId = await service.acquireLease('data.txt', 30);
// Now only operations with this leaseId can modify the blob
```

**`releaseLease(blobName: string, leaseId: string): Promise<void>`**

Releases a lease.

```typescript
await service.releaseLease('data.txt', leaseId);
```

**`uploadWithLease(blobName: string, content: Buffer | string, leaseId: string, options?: UploadOptions): Promise<void>`**

Uploads content with an active lease (prevents concurrent writes).

```typescript
const leaseId = await service.acquireLease('data.txt');
await service.uploadWithLease('data.txt', 'Updated content', leaseId);
await service.releaseLease('data.txt', leaseId);
```

**`getBlobProperties(blobName: string): Promise<BlobMetadata>`**

Gets blob properties including metadata and tags.

```typescript
const props = await service.getBlobProperties('data.txt');
console.log(props.metadata, props.tags);
```

## Demo Script

The `src/index.ts` demo script showcases all operations:

1. **Upload** - Uploads a sample file with metadata and tags using streaming
2. **List** - Lists all blobs in the container
3. **Download** - Downloads the blob and prints its content
4. **Lease & Update** - Acquires a lease, overwrites the blob, and releases the lease
5. **Delete** - Deletes the blob
6. **Cleanup** - Removes local temporary files

## Why Streaming?

Traditional upload methods load the entire file into memory:

```typescript
// ❌ Bad: Loads entire 5GB file into memory
const buffer = fs.readFileSync('large-video.mp4');
await blobClient.upload(buffer, buffer.length);
```

Streaming uploads read and upload chunks progressively:

```typescript
// ✅ Good: Uses ~20MB memory for any file size
const stream = fs.createReadStream('large-video.mp4');
await blobClient.uploadStream(stream, 4 * 1024 * 1024, 5);
```

## Concurrency Control with Leases

Without leases, concurrent writes can cause race conditions:

```typescript
// ❌ Race condition: Two processes might overwrite each other
const content = await downloadBlob();
const updated = processContent(content);
await uploadBlob(updated); // Might overwrite another process's changes
```

With leases, you have exclusive write access:

```typescript
// ✅ Safe: Lease ensures no other process can modify the blob
const leaseId = await service.acquireLease('config.json', 30);
try {
  const content = await service.downloadToBuffer('config.json');
  const updated = processContent(content);
  await service.uploadWithLease('config.json', updated, leaseId);
} finally {
  await service.releaseLease('config.json', leaseId);
}
```

## Security Best Practices

1. **Never use connection strings in production** - Use managed identity instead
2. **Never commit `.env` files** - Add to `.gitignore`
3. **Use least privilege** - Grant only necessary RBAC roles (e.g., Storage Blob Data Contributor)
4. **Enable HTTPS only** - Azure Storage uses HTTPS by default
5. **Use blob index tags** - For queryable metadata without downloading blobs
6. **Set appropriate retention policies** - Enable soft delete for data recovery

## Required Azure RBAC Role

Your identity needs the following role on the storage account:

- **Storage Blob Data Contributor** - Allows read, write, and delete access to blob data

To assign the role:

```bash
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee <your-principal-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/<rg-name>/providers/Microsoft.Storage/storageAccounts/<storage-account-name>
```

For managed identity:

```bash
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee-object-id <managed-identity-object-id> \
  --assignee-principal-type ServicePrincipal \
  --scope /subscriptions/<subscription-id>/resourceGroups/<rg-name>/providers/Microsoft.Storage/storageAccounts/<storage-account-name>
```

## Troubleshooting

### "AZURE_STORAGE_ACCOUNT_NAME environment variable is required"

Set the environment variable in `.env` or export it:

```bash
export AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount
```

### "No credential available"

Make sure you're authenticated:

- **Local development**: Run `az login`
- **Production**: Assign a managed identity to your Azure resource

### "403 Forbidden"

Your identity doesn't have sufficient permissions. Assign the **Storage Blob Data Contributor** role.

### "Connection timeout"

- Check if the storage account firewall allows your IP
- Increase retry settings in `.env`

## License

MIT

---

Built with ❤️ using Azure SDK for JavaScript and TypeScript
