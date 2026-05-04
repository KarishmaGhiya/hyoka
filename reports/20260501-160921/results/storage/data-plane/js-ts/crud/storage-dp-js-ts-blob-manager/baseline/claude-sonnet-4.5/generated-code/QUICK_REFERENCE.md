# Quick Reference - Azure Blob Storage Manager

## Key Features Implemented

### 1. Streaming Upload (Memory Efficient)
```typescript
// Handles multi-GB files without loading into memory
await blobService.uploadFile('large-file.bin', '/path/to/file', {
  metadata: { version: '1.0' },
  tags: { env: 'prod' },
  contentType: 'application/octet-stream'
});
```

**Implementation Details:**
- Uses `fs.createReadStream()` for file reading
- 4MB buffer size with 5 concurrent upload streams
- Works via `BlockBlobClient.uploadStream()`

### 2. Lease-Based Concurrency Control
```typescript
// Prevent concurrent writes with lease
const lease = await blobService.acquireLease('myblob.txt', 60);
await blobService.uploadWithLease('myblob.txt', newContent, lease, options);
await blobService.releaseLease(lease);
```

**Why Leases?**
- Ensures only one writer can modify a blob at a time
- Prevents race conditions in distributed systems
- Essential for safe updates in concurrent environments

### 3. Managed Identity Authentication
```typescript
// No connection strings or keys needed!
const credential = new DefaultAzureCredential();
const client = new BlobServiceClient(endpoint, credential, options);
```

**Authentication Flow:**
1. **In Azure**: Uses Managed Identity automatically
2. **Locally**: Uses Azure CLI credentials (`az login`)
3. **CI/CD**: Uses Service Principal from environment

### 4. Custom Retry Policy
```typescript
const retryOptions: StorageRetryOptions = {
  retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
  maxTries: 3,
  retryDelayInMs: 4000,
  maxRetryDelayInMs: 32000, // Grows exponentially
};
```

**Benefits:**
- Handles transient failures automatically
- Exponential backoff prevents overwhelming services
- Configurable via environment variables

### 5. Blob Index Tags for Querying
```typescript
// Tags are indexed and queryable across containers
await blobService.uploadFile('file.txt', path, {
  tags: {
    project: 'myproject',
    env: 'production',
    owner: 'team-a'
  }
});

// Later: Query blobs by tags (via Azure portal or SDK)
// e.g., Find all blobs where env='production' AND project='myproject'
```

## Environment Variables

```env
# Required
AZURE_STORAGE_ENDPOINT=https://youraccount.blob.core.windows.net
CONTAINER_NAME=your-container

# Optional (with defaults)
MAX_RETRIES=3
RETRY_DELAY_MS=4000
LOG_LEVEL=info  # verbose | info | warning | error
```

## Service Methods

| Method | Purpose | Key Feature |
|--------|---------|-------------|
| `uploadFile()` | Upload from file path | Streaming (memory efficient) |
| `uploadStream()` | Upload from stream/buffer | Flexible input |
| `downloadBlob()` | Download to buffer | Returns Buffer |
| `downloadToFile()` | Download to file path | Streaming |
| `listBlobs()` | List container contents | Includes metadata & tags |
| `deleteBlob()` | Remove blob | Simple deletion |
| `acquireLease()` | Lock blob for updates | Concurrency control |
| `uploadWithLease()` | Safe overwrite | Uses lease for safety |
| `releaseLease()` | Unlock blob | Release lock |

## Running the Demo

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Set up environment (copy .env.example to .env and configure)
cp .env.example .env

# Run demo (requires Azure credentials)
npm start

# Or run with ts-node for development
npm run dev
```

## Demo Flow

The included demo (`src/index.ts`) demonstrates:

1. ✓ Initialize with managed identity
2. ✓ Create container if needed
3. ✓ Upload file with metadata + tags
4. ✓ List all blobs (shows metadata & tags)
5. ✓ Download and display content
6. ✓ Acquire lease for safe update
7. ✓ Overwrite with lease protection
8. ✓ Release lease
9. ✓ Verify update
10. ✓ Delete blob and cleanup

## Security Best Practices

✅ **What's Implemented:**
- Managed identity authentication (no secrets)
- Environment-based configuration
- SDK logging for debugging
- Lease-based concurrency control

❌ **Never Do This:**
- Don't commit connection strings to git
- Don't use account keys in code
- Don't share credentials in logs

## Architecture

```
┌─────────────────┐
│   Main Script   │ (index.ts)
└────────┬────────┘
         │
         ├──> ┌──────────────────┐
         │    │  Configuration   │ (config.ts)
         │    │  - Load env vars │
         │    │  - Setup client  │
         │    │  - Retry policy  │
         │    └──────────────────┘
         │
         └──> ┌──────────────────┐
              │  Blob Service    │ (blob-service.ts)
              │  - Upload        │
              │  - Download      │
              │  - List          │
              │  - Delete        │
              │  - Lease mgmt    │
              └──────────────────┘
                     │
                     ▼
              ┌──────────────────┐
              │  Azure SDK       │
              │  @azure/storage  │
              │  @azure/identity │
              └──────────────────┘
```

## Extending the Project

### Add Container Operations
```typescript
// In BlobStorageService class
async deleteContainer(): Promise<void> {
  await this.containerClient.delete();
}

async getContainerProperties() {
  return await this.containerClient.getProperties();
}
```

### Add Blob Snapshots
```typescript
async createSnapshot(blobName: string) {
  const blobClient = this.containerClient.getBlobClient(blobName);
  return await blobClient.createSnapshot();
}
```

### Add SAS Token Generation
```typescript
import { generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';

// Generate read-only SAS token (requires account key or user delegation key)
```

## Troubleshooting

**Error: "AZURE_STORAGE_ENDPOINT environment variable is required"**
- Copy `.env.example` to `.env` and configure your endpoint

**Error: "ManagedIdentityCredential authentication failed"**
- Locally: Run `az login` first
- In Azure: Ensure managed identity is assigned to the resource

**Error: "LeaseIdMissing"**
- Acquire lease before attempting upload with lease
- Ensure lease hasn't expired (default 60 seconds)

**Large files taking too long?**
- Increase buffer size and concurrent streams in `uploadFile()`
- Current: 4MB buffer, 5 streams = ~20MB parallelism
