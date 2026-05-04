# Quick Start Guide

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and set your Azure Storage Account endpoint
   ```

3. **Ensure Azure authentication:**
   
   **For local development:**
   ```bash
   az login
   ```
   
   **For Azure environments (App Service, Functions, VM, AKS):**
   - Enable managed identity (system-assigned or user-assigned)
   - Grant the identity "Storage Blob Data Contributor" role on your storage account

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Run the demo:**
   ```bash
   npm start
   ```

## Expected Demo Output

The demo script will:

1. ✅ Initialize Azure Blob Storage client with managed identity
2. ✅ Create/verify the container exists
3. ✅ Upload a sample file with metadata and index tags (streaming)
4. ✅ List all blobs in the container
5. ✅ Download the blob and display its content
6. ✅ Acquire a lease and overwrite the blob (concurrency control)
7. ✅ Verify the update
8. ✅ Delete the blob
9. ✅ Clean up local files

## Usage Examples

### Simple Upload
```typescript
import { BlobStorageConfigManager } from './config/blobConfig';
import { BlobStorageService } from './services/blobService';

const configManager = new BlobStorageConfigManager();
const blobService = new BlobStorageService(
  configManager.getBlobServiceClient()
);

// Upload a file
await blobService.uploadFile(
  'my-container',
  'my-file.txt',
  '/path/to/file.txt'
);
```

### Upload with Metadata and Tags
```typescript
await blobService.uploadFile(
  'my-container',
  'document.pdf',
  '/path/to/document.pdf',
  {
    metadata: {
      author: 'john-doe',
      department: 'engineering',
      version: '1.0',
    },
    tags: {
      project: 'alpha',
      status: 'approved',
      classification: 'internal',
    },
    contentType: 'application/pdf',
  }
);
```

### Large File Upload (Streaming)
```typescript
// Efficiently upload a 5GB file without loading into memory
await blobService.uploadFile(
  'my-container',
  'large-dataset.bin',
  '/path/to/5gb-file.bin',
  {
    blockSize: 8 * 1024 * 1024,  // 8 MB blocks
    concurrency: 10,              // 10 parallel uploads
  }
);
```

### Safe Concurrent Update with Lease
```typescript
// Prevent other clients from writing while you update
await blobService.uploadWithLease(
  'my-container',
  'shared-config.json',
  JSON.stringify(newConfig),
  30,  // 30-second lease
  {
    tags: { version: '2.0', updated: new Date().toISOString() }
  }
);
```

### Download Operations
```typescript
// Download to file
await blobService.downloadToFile(
  'my-container',
  'report.pdf',
  './downloads/report.pdf'
);

// Download to buffer (for processing in memory)
const buffer = await blobService.downloadToBuffer(
  'my-container',
  'data.json'
);
const data = JSON.parse(buffer.toString('utf-8'));
```

### List and Filter Blobs
```typescript
// List all blobs with metadata and tags
const blobs = await blobService.listBlobs('my-container', {
  includeMetadata: true,
  includeTags: true,
});

for (const blob of blobs) {
  console.log(blob.name, blob.properties.contentLength);
}

// List with prefix filter
const reportBlobs = await blobService.listBlobs('my-container', {
  prefix: 'reports/2024/',
});
```

### Delete Blobs
```typescript
await blobService.deleteBlob('my-container', 'old-file.txt');
```

## Troubleshooting

### Authentication Issues
```
Error: Missing configuration for Azure Storage
```
**Solution:** Set `AZURE_STORAGE_ACCOUNT_ENDPOINT` environment variable

```
Error: Azure authentication failed
```
**Solution:** 
- Local: Run `az login`
- Azure: Verify managed identity is enabled and has proper role assignment

### Lease Conflicts
```
Error: Blob is already leased by another client
```
**Solution:** Another process holds the lease. Wait for it to expire or ensure proper lease release in your code.

### Network/Retry Issues
**Solution:** Adjust retry policy in configuration:
```typescript
const configManager = new BlobStorageConfigManager({
  maxRetries: 5,
  maxRetryDelayMs: 8000,
});
```

## Best Practices

1. **Always use streaming for large files** - Prevents memory issues
2. **Use leases for concurrent access** - Prevents data corruption
3. **Set appropriate metadata and tags** - Makes blobs searchable
4. **Handle errors gracefully** - Network issues are common
5. **Clean up resources** - Delete temporary blobs when done
6. **Use managed identity** - Never use connection strings in production

## Integration Examples

### Express.js API
```typescript
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    await blobService.uploadFile(
      'user-uploads',
      req.file.filename,
      req.file.path,
      { metadata: { userId: req.user.id } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Azure Function
```typescript
import { AzureFunction, Context } from "@azure/functions";

const blobUploadFunction: AzureFunction = async (context: Context) => {
  const file = context.bindings.inputFile;
  
  await blobService.uploadContent(
    'processed-data',
    `${Date.now()}.json`,
    JSON.stringify(file),
    { tags: { processed: 'true' } }
  );
  
  context.res = { status: 200 };
};
```

## Performance Tips

- **Block size**: Larger blocks (8-16 MB) for high-bandwidth scenarios
- **Concurrency**: Higher concurrency (10-20) for multiple small files
- **Retry policy**: Adjust based on network reliability
- **Streaming**: Always use for files > 50 MB

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review Azure Blob Storage SDK documentation
- Verify managed identity permissions in Azure Portal
