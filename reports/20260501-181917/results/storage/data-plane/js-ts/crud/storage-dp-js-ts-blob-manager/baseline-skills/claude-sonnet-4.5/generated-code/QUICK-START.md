# Quick Start Guide

## Prerequisites

1. **Azure Storage Account** with a container
2. **Authentication** (one of):
   - Local dev: `az login` (Azure CLI)
   - Production: Managed Identity enabled
3. **RBAC Role**: Assign "Storage Blob Data Contributor" to your identity

## Setup (1 minute)

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set AZURE_STORAGE_ACCOUNT_NAME

# Build
npm run build

# Run demo
npm start
```

## Quick Examples

### Upload Large File with Streaming
```typescript
import { createStorageConfig } from "./config.js";
import { BlobStorageService } from "./blob-storage.service.js";

const config = createStorageConfig();
const service = new BlobStorageService(config.getClient(), "my-container");
await service.initialize();

// Handles multi-GB files efficiently (streams in 4MB chunks)
await service.uploadFile("video.mp4", "./local/video.mp4", {
  contentType: "video/mp4",
  metadata: { uploadedBy: "user123" },
  tags: { category: "media", quality: "hd" },
  onProgress: (bytes) => console.log(`Uploaded: ${bytes} bytes`)
});
```

### Safe Concurrent Update with Lease
```typescript
// Prevents other writers from modifying during update
await service.uploadWithLease("config.json", JSON.stringify(newConfig), {
  contentType: "application/json",
  metadata: { version: "2.0" }
});
```

### List All Blobs
```typescript
const blobs = await service.listBlobs();
for (const blob of blobs) {
  console.log(`${blob.name}: ${blob.size} bytes`);
  console.log("Tags:", blob.tags);
}
```

### Download
```typescript
// To file
await service.downloadToFile("data.csv", "./local/data.csv");

// To string
const content = await service.downloadToString("readme.txt");

// To buffer
const buffer = await service.downloadToBuffer("image.png");
```

### Delete
```typescript
await service.deleteBlob("old-file.txt");
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_STORAGE_ACCOUNT_NAME` | ✅ Yes | - | Storage account name |
| `AZURE_STORAGE_CONTAINER_NAME` | No | demo-container | Container name |
| `MAX_RETRIES` | No | 3 | Max retry attempts |
| `RETRY_DELAY_MS` | No | 1000 | Initial retry delay |
| `MAX_RETRY_DELAY_MS` | No | 30000 | Max retry delay |
| `AZURE_LOG_LEVEL` | No | info | verbose, info, warning, error |

## Common Issues

### "AZURE_STORAGE_ACCOUNT_NAME environment variable is required"
**Fix**: Set `AZURE_STORAGE_ACCOUNT_NAME` in your `.env` file

### Authentication errors
**Local Dev**: Run `az login`  
**Production**: Enable Managed Identity and assign "Storage Blob Data Contributor" role

### Lease conflicts
**Cause**: Another process holds a lease  
**Fix**: Wait 30 seconds (lease expires) or use different blob name

## Production Deployment

### Azure App Service
1. Enable System-Assigned Managed Identity
2. Set environment variables in Configuration
3. Assign RBAC role to the managed identity
4. Deploy app

### Azure Container Apps
```bash
az containerapp create \
  --name myapp \
  --resource-group mygroup \
  --environment myenv \
  --image myregistry.azurecr.io/myapp:latest \
  --env-vars AZURE_STORAGE_ACCOUNT_NAME=mystorage \
  --system-assigned
```

### Azure Kubernetes (AKS)
Use Azure AD Workload Identity:
1. Create managed identity
2. Configure federated credentials
3. Set environment variables
4. Deploy with service account

## Performance Tips

- **Large files**: Streaming is automatic with `uploadFile()`, handles GB+ files
- **Concurrency**: Default is 5 parallel uploads per file (4MB chunks)
- **Retry policy**: Exponential backoff prevents overwhelming the service
- **Lease duration**: 30 seconds is optimal for most scenarios

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [PROJECT-SUMMARY.md](PROJECT-SUMMARY.md) for implementation details
- Review source code in `src/` for advanced usage patterns
- Explore Azure SDK samples: https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob/samples
