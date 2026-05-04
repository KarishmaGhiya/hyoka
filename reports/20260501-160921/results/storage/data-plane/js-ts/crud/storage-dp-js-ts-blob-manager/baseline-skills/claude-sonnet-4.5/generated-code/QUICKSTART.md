# Quick Start Guide

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy `.env.example` to `.env` and set your storage account endpoint:
   ```bash
   AZURE_STORAGE_ACCOUNT_ENDPOINT=https://<your-storage-account>.blob.core.windows.net
   AZURE_STORAGE_CONTAINER_NAME=demo-container
   ```

3. **Authenticate with Azure:**
   
   For local development, use Azure CLI:
   ```bash
   az login
   ```
   
   For production, the app will automatically use Managed Identity.

4. **Grant permissions:**
   
   Ensure your identity has the `Storage Blob Data Contributor` role:
   ```bash
   az role assignment create \
     --role "Storage Blob Data Contributor" \
     --assignee <your-email@example.com> \
     --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<account>
   ```

## Build and Run

```bash
# Build the project
npm run build

# Run the demo
npm start
```

## Project Structure

```
├── src/
│   ├── config.ts           # Configuration with managed identity & retry policy
│   ├── blob-service.ts     # Main service class with all blob operations
│   └── index.ts            # Demo script
├── dist/                   # Compiled JavaScript output
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── .env.example            # Environment variable template
└── README.md               # Full documentation
```

## Key Features Implemented

### ✅ Service Class (`blob-service.ts`)
- **Streaming Upload**: Handles large files efficiently with `uploadStream()`
- **Metadata & Tags**: Attach custom metadata and blob index tags
- **Lease-Based Concurrency**: `uploadBlobWithLease()` prevents concurrent overwrites
- **Download**: To buffer or file with streaming
- **List**: Enumerate all blobs in container
- **Delete**: Remove blobs

### ✅ Configuration Module (`config.ts`)
- **Managed Identity**: Uses `DefaultAzureCredential` (no keys/connection strings)
- **Custom Retry Policy**: Exponential backoff with configurable max retries & delay
- **SDK Logging**: Configurable log levels (verbose, info, warning, error)
- **Environment-Based**: Load configuration from environment variables

### ✅ Demo Script (`index.ts`)
Demonstrates complete workflow:
1. Initialize configuration
2. Create service and ensure container exists
3. Upload file with metadata and index tags
4. List all blobs
5. Download and display content
6. Overwrite with lease protection
7. Verify update
8. Delete blob
9. Verify deletion

## Usage Examples

### Basic Upload
```typescript
import { BlobStorageConfiguration } from "./config";
import { BlobStorageService } from "./blob-service";

const config = BlobStorageConfiguration.fromEnvironment();
const service = new BlobStorageService(
  config.getServiceClient(),
  config.getContainerName()
);

await service.uploadBlob("my-file.txt", "./local-file.txt", {
  metadata: { uploadedBy: "user123" },
  tags: { category: "documents" },
  contentType: "text/plain"
});
```

### Upload with Lease Protection
```typescript
// Prevents concurrent writes - acquires lease before uploading
await service.uploadBlobWithLease("important.txt", "./data.txt", {
  metadata: { protected: "true" },
  tags: { critical: "yes" }
});
```

### Download to Buffer
```typescript
const result = await service.downloadBlob("my-file.txt");
console.log(result.content?.toString("utf-8"));
console.log("Metadata:", result.metadata);
console.log("Tags:", result.tags);
```

### Download to File
```typescript
await service.downloadBlob("my-file.txt", { 
  filePath: "./downloaded.txt" 
});
```

### List Blobs
```typescript
const blobs = await service.listBlobs();
blobs.forEach(blob => {
  console.log(`${blob.name} - ${blob.size} bytes`);
});
```

### Delete Blob
```typescript
await service.deleteBlob("my-file.txt");
```

## Authentication Methods

The project uses `DefaultAzureCredential`, which tries these methods in order:

1. **Environment Variables** (Service Principal)
2. **Workload Identity** (Kubernetes)
3. **Managed Identity** (Azure VMs, App Service, Functions)
4. **Visual Studio Code**
5. **Azure CLI** (`az login`)
6. **Azure PowerShell** (`Connect-AzAccount`)
7. **Azure Developer CLI** (`azd auth login`)

This means the same code works locally (using your Azure CLI credentials) and in production (using Managed Identity).

## Testing Without Azure

To test the code structure without Azure:
1. Review the TypeScript files in `src/`
2. Check the compiled output in `dist/`
3. Review interfaces and types for API design

## Next Steps

1. **Customize** the service for your specific needs
2. **Add** error handling and validation
3. **Extend** with additional operations (copy, snapshot, etc.)
4. **Integrate** into your application
5. **Deploy** to Azure with Managed Identity

## Troubleshooting

**Authentication Error:**
- Run `az login` for local development
- Verify RBAC role assignment in Azure

**Container Not Found:**
- The service auto-creates containers if they don't exist
- Ensure you have permission to create containers

**Lease Conflicts:**
- Leases auto-release after timeout (15 seconds minimum)
- Use `uploadBlobWithLease()` for concurrent write protection

## Security Best Practices

✅ Uses managed identity (no secrets in code)
✅ Implements lease-based concurrency control
✅ Configurable retry logic with exponential backoff
✅ Streaming for memory-efficient large file handling
❌ No connection strings or account keys
❌ No hardcoded credentials
