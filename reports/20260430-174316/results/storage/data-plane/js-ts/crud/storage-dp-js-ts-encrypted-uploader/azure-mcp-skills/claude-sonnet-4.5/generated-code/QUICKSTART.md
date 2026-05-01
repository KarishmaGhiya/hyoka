# Quick Start Guide

## Overview

This project implements client-side encryption for Azure Blob Storage using envelope encryption with Azure Key Vault.

## Architecture

### Envelope Encryption Pattern

```
Upload:
1. Generate DEK (256-bit AES key) locally
2. Encrypt data with DEK using AES-256-GCM → Ciphertext + IV + Auth Tag
3. Wrap DEK with KEK in Key Vault → Wrapped DEK
4. Upload ciphertext to Blob Storage
5. Store metadata: Wrapped DEK, IV, Auth Tag, Key ID
6. Erase DEK from memory

Download:
1. Download ciphertext and metadata
2. Unwrap DEK using Key Vault
3. Decrypt ciphertext with DEK
4. Erase DEK from memory
```

## Project Structure

```
├── src/
│   ├── config.ts         - Azure client configuration
│   ├── keyManager.ts     - Key Vault integration & envelope encryption
│   ├── blobStorage.ts    - Encrypted blob upload/download
│   └── index.ts          - Demo application
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Azure Resources

```bash
# Resource group
az group create --name rg-encrypted-storage --location eastus

# Storage account
az storage account create \
  --name <your-storage-account> \
  --resource-group rg-encrypted-storage \
  --sku Standard_LRS

# Key Vault
az keyvault create \
  --name <your-keyvault> \
  --resource-group rg-encrypted-storage \
  --location eastus

# Create encryption key
az keyvault key create \
  --vault-name <your-keyvault> \
  --name encryption-key \
  --kty RSA \
  --size 2048
```

### 3. Configure Environment

Copy `.env.example` to `.env`:

```bash
AZURE_STORAGE_ACCOUNT_NAME=<your-storage-account>
AZURE_KEY_VAULT_URL=https://<your-keyvault>.vault.azure.net/
AZURE_KEY_VAULT_KEY_NAME=encryption-key
```

### 4. Assign Permissions

```bash
USER_PRINCIPAL_ID=$(az ad signed-in-user show --query id -o tsv)

# Storage Blob Data Contributor
az role assignment create \
  --assignee $USER_PRINCIPAL_ID \
  --role "Storage Blob Data Contributor" \
  --scope /subscriptions/<subscription-id>/resourceGroups/rg-encrypted-storage/providers/Microsoft.Storage/storageAccounts/<your-storage-account>

# Key Vault Crypto User
az role assignment create \
  --assignee $USER_PRINCIPAL_ID \
  --role "Key Vault Crypto User" \
  --scope /subscriptions/<subscription-id>/resourceGroups/rg-encrypted-storage/providers/Microsoft.KeyVault/vaults/<your-keyvault>
```

### 5. Authenticate

```bash
az login
```

### 6. Run the Demo

```bash
# Build
npm run build

# Run
npm start

# Or with ts-node
npm run dev
```

## Usage Examples

### Basic Upload/Download

```typescript
import { ConfigurationManager } from './config';
import { KeyManager } from './keyManager';
import { EncryptedBlobStorage } from './blobStorage';

// Initialize
const configManager = new ConfigurationManager();
const config = configManager.getConfig();
const keyManager = new KeyManager(
  config.keyClient,
  config.keyName,
  config.credential,
  config.keyVaultUrl
);
const storage = new EncryptedBlobStorage(config.blobServiceClient, keyManager);

// Upload encrypted
const result = await storage.uploadEncrypted(
  'my-container',
  'secret.txt',
  'Confidential data'
);

console.log(`Uploaded to: ${result.url}`);
console.log(`Key ID: ${result.keyId}`);
console.log(`Wrapped DEK: ${result.wrappedKey}`);

// Download and decrypt
const download = await storage.downloadDecrypted('my-container', 'secret.txt');
const plaintext = download.content.toString('utf-8');
console.log(`Decrypted: ${plaintext}`);

// Clean up
await storage.deleteBlob('my-container', 'secret.txt');
```

### Direct Encryption (without storage)

```typescript
import { KeyManager } from './keyManager';

const keyManager = new KeyManager(keyClient, keyName, credential, keyVaultUrl);

// Encrypt
const plaintext = Buffer.from('Secret message', 'utf-8');
const encrypted = await keyManager.encryptData(plaintext);

console.log('Ciphertext:', encrypted.ciphertext.toString('base64'));
console.log('IV:', encrypted.iv);
console.log('Auth Tag:', encrypted.authTag);
console.log('Wrapped DEK:', encrypted.wrappedKey.wrappedKey);

// Decrypt
const decrypted = await keyManager.decryptData(encrypted);
console.log('Plaintext:', decrypted.toString('utf-8'));
```

## Security Features

✓ **Local Encryption** - Data encrypted with AES-256-GCM before leaving your system
✓ **Envelope Encryption** - DEK wrapped by Key Vault KEK
✓ **No Key Persistence** - Raw DEKs erased from memory after use
✓ **KEK Protection** - Key material never leaves Key Vault
✓ **Authenticated Encryption** - GCM mode provides integrity verification
✓ **Unique Keys** - Each upload gets a fresh DEK
✓ **Metadata Storage** - All parameters stored securely in blob metadata

## What's Stored Where

### Blob Storage (Encrypted)
- Ciphertext (encrypted data)

### Blob Metadata (Unencrypted but Safe)
- Wrapped DEK (can only be unwrapped by authorized Key Vault access)
- Initialization Vector (IV)
- Authentication Tag
- Key Vault Key ID
- Algorithm identifier

### Key Vault
- Key Encryption Key (KEK) - never leaves Key Vault
- Wrap/unwrap operations performed within Key Vault

### Memory (Temporary)
- Data Encryption Key (DEK) - erased immediately after use

## Common Issues

### Authentication Errors
- Ensure you're logged in: `az login`
- Verify you have the correct roles assigned

### Key Vault Access Denied
- Check that Key Vault key exists and is enabled
- Verify "Key Vault Crypto User" role is assigned
- Ensure Key Vault has RBAC authorization mode (not access policies)

### Storage Access Denied
- Verify "Storage Blob Data Contributor" role is assigned
- Check that storage account name is correct

### Environment Variables Not Found
- Copy `.env.example` to `.env` and configure
- Load environment variables before running

## Performance Notes

- Encryption/decryption is CPU-bound (happens locally)
- Key wrap/unwrap adds ~100-200ms per operation
- Network transfer time depends on blob size
- Consider caching CryptographyClient for repeated operations

## Production Considerations

1. **Key Rotation**: Store key ID in metadata to support multiple key versions
2. **Monitoring**: Enable Azure Monitor for Key Vault operations
3. **Managed Identity**: Use system/user-assigned identity in Azure environments
4. **Key Size**: Consider RSA 3072 or 4096 for enhanced security
5. **HSM**: Use Azure Key Vault Managed HSM for FIPS 140-2 Level 3 compliance
6. **Soft Delete**: Enable Key Vault soft delete and purge protection
7. **Access Control**: Use Azure RBAC for fine-grained permissions

## API Reference

### KeyManager

```typescript
new KeyManager(keyClient, keyName, credential, keyVaultUrl)
await keyManager.encryptData(plaintext: Buffer): Promise<EncryptedData>
await keyManager.decryptData(encrypted: EncryptedData): Promise<Buffer>
```

### EncryptedBlobStorage

```typescript
new EncryptedBlobStorage(blobServiceClient, keyManager)
await storage.uploadEncrypted(container, blobName, data): Promise<UploadResult>
await storage.downloadDecrypted(container, blobName): Promise<DownloadResult>
await storage.deleteBlob(container, blobName): Promise<void>
```

### ConfigurationManager

```typescript
new ConfigurationManager()
configManager.getConfig(): AzureConfig
```

## License

MIT
