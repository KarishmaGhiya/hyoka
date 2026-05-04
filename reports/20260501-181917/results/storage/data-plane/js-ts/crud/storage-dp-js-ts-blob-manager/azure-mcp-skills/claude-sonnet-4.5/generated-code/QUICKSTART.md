# Quick Start Guide

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and set your storage account name
   # AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
   ```

3. **Authenticate (for local development):**
   ```bash
   # Login with Azure CLI
   az login
   
   # Optional: Set your default subscription if you have multiple
   az account set --subscription "Your-Subscription-Name"
   ```

4. **Grant permissions:**
   
   Your identity needs the **Storage Blob Data Contributor** role on the storage account:
   
   ```bash
   # Get your user principal ID
   USER_ID=$(az ad signed-in-user show --query id -o tsv)
   
   # Assign role
   az role assignment create \
     --role "Storage Blob Data Contributor" \
     --assignee $USER_ID \
     --scope /subscriptions/<subscription-id>/resourceGroups/<rg-name>/providers/Microsoft.Storage/storageAccounts/<storage-account>
   ```

## Run the Demo

```bash
# Build and run
npm start

# Or run in development mode (with ts-node)
npm run dev
```

## What the Demo Does

The demo script (`src/index.ts`) demonstrates:

1. ✅ **Upload** - Uploads a ~26KB sample file with streaming (scales to GB files)
2. ✅ **Metadata & Tags** - Adds metadata and queryable blob index tags
3. ✅ **List** - Lists all blobs with their properties
4. ✅ **Download** - Downloads the blob and prints content
5. ✅ **Lease** - Acquires a lease, updates blob, releases lease (prevents race conditions)
6. ✅ **Delete** - Cleans up the blob

## Project Structure

```
.
├── src/
│   ├── config/
│   │   └── storage-config.ts      # Managed identity auth + retry policy
│   ├── services/
│   │   └── blob-storage.service.ts # All blob operations
│   └── index.ts                    # Demo script
├── package.json
├── tsconfig.json
├── .env.example
└── README.md                       # Full documentation
```

## Using in Your Own Code

### Basic Usage

```typescript
import { StorageClientFactory } from './config/storage-config';
import { BlobStorageService } from './services/blob-storage.service';

// Load config and create client
const config = StorageClientFactory.loadConfigFromEnv();
const client = StorageClientFactory.getClient(config);

// Create service
const service = new BlobStorageService(client, 'my-container');
await service.ensureContainerExists();

// Upload a file
await service.uploadFile('report.pdf', './local-report.pdf', {
  metadata: { author: 'john' },
  tags: { type: 'report', year: '2026' }
});

// Download
await service.downloadFile('report.pdf', './downloaded-report.pdf');

// List
const blobs = await service.listBlobs();
console.log(`Found ${blobs.length} blobs`);
```

### Safe Concurrent Updates

```typescript
// Acquire lease before modifying
const leaseId = await service.acquireLease('config.json', 30);

try {
  // Read current content
  const current = await service.downloadToBuffer('config.json');
  const config = JSON.parse(current.toString());
  
  // Modify
  config.updated = new Date().toISOString();
  
  // Write with lease (prevents other writers)
  await service.uploadWithLease(
    'config.json',
    JSON.stringify(config, null, 2),
    leaseId
  );
} finally {
  await service.releaseLease('config.json', leaseId);
}
```

## Deployment to Azure

### Azure App Service / Functions

Your app will automatically use managed identity:

1. Enable managed identity on your resource
2. Assign **Storage Blob Data Contributor** role to the identity
3. Deploy - no code changes needed!

### Azure VM / Container Apps

Same process - enable managed identity and assign the role.

## Troubleshooting

**"AZURE_STORAGE_ACCOUNT_NAME environment variable is required"**
- Set it in `.env` file or export it: `export AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount`

**"No credential available"**
- Run `az login` for local development
- Enable managed identity in Azure for production

**"403 Forbidden"**
- Assign **Storage Blob Data Contributor** role to your identity

## Next Steps

- Read the full [README.md](README.md) for complete API documentation
- Modify `src/index.ts` to test your own scenarios
- Integrate the service classes into your application
- Deploy to Azure with managed identity

---

Built with Azure SDK for JavaScript (@azure/storage-blob v12.x)
