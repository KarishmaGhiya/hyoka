# Quick Start Guide

## Prerequisites Setup

### 1. Create Azure Key Vault Key

```bash
# Using Azure CLI
az keyvault key create \
  --vault-name <your-keyvault-name> \
  --name encryption-key \
  --kty RSA \
  --size 2048 \
  --ops wrapKey unwrapKey
```

### 2. Assign Managed Identity Permissions

**Key Vault (using Azure RBAC or Access Policies):**

```bash
# Option A: Using RBAC (recommended)
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Key Vault Crypto User" \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault-name>

# Option B: Using Access Policies
az keyvault set-policy \
  --name <your-keyvault-name> \
  --object-id <managed-identity-principal-id> \
  --key-permissions get wrapKey unwrapKey
```

**Blob Storage:**

```bash
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Storage Blob Data Contributor" \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<storage-account>
```

## Configuration

Create a `.env` file (or set environment variables):

```bash
KEY_VAULT_URL=https://your-keyvault.vault.azure.net
KEY_VAULT_KEY_NAME=encryption-key
AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
CONTAINER_NAME=encrypted-files
```

## Usage Examples

### Basic Upload/Download

```typescript
import { AzureClientFactory } from "./config";
import { KeyManagementService } from "./keyManagement";
import { BlobEncryptorService } from "./blobEncryptor";

// Initialize
const clientFactory = new AzureClientFactory();
const keyManagement = new KeyManagementService(
  clientFactory.getKeyClient(),
  "encryption-key"
);
const blobEncryptor = new BlobEncryptorService(
  clientFactory.getBlobServiceClient(),
  keyManagement,
  "encrypted-files"
);

// Ensure container exists
await blobEncryptor.ensureContainer();

// Upload encrypted file
const secretData = "Confidential information";
await blobEncryptor.uploadEncrypted("secret.txt", secretData);

// Download and decrypt
const decrypted = await blobEncryptor.downloadDecrypted("secret.txt");
console.log(decrypted.toString("utf-8"));

// Check if blob exists
const exists = await blobEncryptor.blobExists("secret.txt");

// Delete blob
await blobEncryptor.deleteBlob("secret.txt");
```

### Upload Binary File

```typescript
import * as fs from "fs";

// Read file as buffer
const fileBuffer = fs.readFileSync("/path/to/file.pdf");

// Encrypt and upload
await blobEncryptor.uploadEncrypted("document.pdf", fileBuffer);

// Download and decrypt
const decryptedBuffer = await blobEncryptor.downloadDecrypted("document.pdf");

// Save to disk
fs.writeFileSync("/path/to/decrypted.pdf", decryptedBuffer);
```

### Custom Configuration

```typescript
const clientFactory = new AzureClientFactory({
  keyVaultUrl: "https://custom-vault.vault.azure.net",
  storageAccountName: "customstorage",
  keyName: "my-encryption-key",
  containerName: "my-container"
});
```

## Running the Demo

```bash
# Install dependencies
npm install

# Build project
npm run build

# Run demo (requires Azure environment with managed identity)
npm start
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Application                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BlobEncryptorService                     │
│  • Orchestrates encryption/decryption workflow              │
│  • Handles blob upload/download with metadata               │
└─────────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│ KeyManagementService     │      │  Node.js Crypto Module   │
│ • Wrap/Unwrap DEK        │      │  • AES-256-GCM encrypt   │
│ • Generate DEK           │      │  • Generate IV           │
└──────────────────────────┘      └──────────────────────────┘
           │                                    │
           ▼                                    ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│   Azure Key Vault        │      │   Azure Blob Storage     │
│   • RSA-OAEP wrap/unwrap │      │   • Store ciphertext     │
│   • Key never leaves HSM │      │   • Store metadata       │
└──────────────────────────┘      └──────────────────────────┘
```

## Encryption Flow Details

### Upload Flow

```
1. Generate 256-bit DEK (random bytes)
2. Generate 96-bit IV (random bytes)
3. Encrypt plaintext with AES-256-GCM(DEK, IV)
   → produces: ciphertext + auth tag
4. Wrap DEK with Key Vault RSA-OAEP(DEK)
   → produces: wrapped DEK
5. Upload to Blob Storage:
   - Body: ciphertext
   - Metadata: { iv, authTag, wrappedKey, keyId, algorithm }
6. Clear DEK from memory
```

### Download Flow

```
1. Download blob + metadata
2. Extract: iv, authTag, wrappedKey, keyId
3. Unwrap DEK with Key Vault RSA-OAEP(wrappedKey)
   → produces: DEK
4. Decrypt ciphertext with AES-256-GCM(DEK, IV, authTag)
   → produces: plaintext
5. Clear DEK from memory
6. Return plaintext
```

## Security Best Practices Implemented

✅ **Envelope Encryption**: Separates data encryption from key management  
✅ **Key Material Isolation**: Key Vault keys never leave the HSM  
✅ **Ephemeral DEK**: Data keys generated on-demand, never persisted  
✅ **Authenticated Encryption**: AES-GCM provides confidentiality + integrity  
✅ **Managed Identity**: No credentials in code or environment  
✅ **Key Rotation Ready**: Old blobs remain decryptable with old key versions  
✅ **Metadata Integrity**: All crypto parameters stored with blob

## Troubleshooting

### Error: "KEY_VAULT_URL environment variable is required"
Set the environment variables or create a `.env` file.

### Error: "Key Vault key 'encryption-key' not found"
Create the key in Azure Key Vault using `az keyvault key create`.

### Error: "Access denied to Key Vault key"
Ensure managed identity has `wrapKey` and `unwrapKey` permissions.

### Error: "Access denied to Blob Storage"
Ensure managed identity has `Storage Blob Data Contributor` role.

## Performance Considerations

- **Large Files**: The current implementation loads entire file into memory
  - For files > 100MB, consider streaming encryption in chunks
- **Batch Operations**: Wrap/unwrap operations have ~10-50ms latency per call
  - For bulk operations, consider caching the DEK briefly (with caution)
- **Key Vault Throttling**: 2000 requests per 10 seconds per region
  - Implement retry logic with exponential backoff for production

## Key Rotation

When rotating the Key Vault key:

1. **Automatic**: Azure Key Vault supports automatic key rotation
2. **Old Blobs**: Remain decryptable (metadata contains key version)
3. **New Uploads**: Automatically use latest key version
4. **No Code Changes**: The system handles key versions transparently

```bash
# Set automatic rotation policy
az keyvault key rotation-policy update \
  --vault-name <vault-name> \
  --name encryption-key \
  --value @rotation-policy.json
```

## Testing Without Azure

For local testing, you can:

1. Use [Azurite](https://github.com/Azure/Azurite) for local blob storage
2. Mock the Key Vault operations (wrap/unwrap)
3. Use connection strings for blob storage auth

**Note**: Managed Identity only works in Azure environments.
