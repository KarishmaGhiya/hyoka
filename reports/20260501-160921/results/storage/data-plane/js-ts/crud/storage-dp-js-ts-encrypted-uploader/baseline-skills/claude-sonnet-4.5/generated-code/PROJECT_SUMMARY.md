# Project Summary

## TypeScript Azure Encrypted Blob Storage Uploader

This project demonstrates **client-side encryption** for Azure Blob Storage using **envelope encryption** with Azure Key Vault.

## Key Components

### 1. **config.ts** - Azure Configuration Module
- Manages authentication using `DefaultAzureCredential` (works with managed identity + dev credentials)
- Creates BlobServiceClient and KeyClient from environment variables
- Uses a singleton pattern for the credential instance (shared across all clients)

### 2. **keyManager.ts** - Key Management with Envelope Encryption
- Generates 256-bit AES data encryption keys (DEK) locally
- Wraps DEKs using Azure Key Vault's RSA-OAEP algorithm
- Unwraps DEKs for decryption
- **Security**: Raw DEKs never leave memory; Key Vault's key material never leaves the vault

### 3. **blobUploader.ts** - Encrypted Blob Operations
- **Upload Flow**:
  1. Generate DEK locally
  2. Encrypt data with AES-256-GCM
  3. Wrap DEK via Key Vault
  4. Upload ciphertext + metadata to Blob Storage
  
- **Download Flow**:
  1. Download blob and metadata
  2. Unwrap DEK via Key Vault
  3. Decrypt data locally
  
- **Metadata Stored**: algorithm, wrapped key (base64), IV (base64), auth tag (base64), key ID

### 4. **index.ts** - Demo Script
- Full round-trip demonstration
- Encrypts sample text, uploads, downloads, and decrypts
- Prints detailed output including wrapped DEK and verification

## Security Features

✅ **Zero-trust encryption**: Data encrypted before leaving your application  
✅ **Envelope encryption**: Unique DEK per blob, protected by Key Vault  
✅ **AES-256-GCM**: Provides confidentiality AND authenticity (tamper detection)  
✅ **Separation of duties**: In Node.js, auth tag is separate from ciphertext (properly handled)  
✅ **No key persistence**: DEKs cleared from memory after use  
✅ **Key rotation ready**: Key Vault key versions supported  

## Environment Variables Required

```
AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount
AZURE_STORAGE_CONTAINER_NAME=encrypted-blobs
AZURE_KEY_VAULT_URL=https://myvault.vault.azure.net
AZURE_KEY_VAULT_KEY_NAME=my-encryption-key
```

## Usage

```bash
# Install dependencies
npm install

# Set environment variables (see .env.example)

# Build and run
npm run build
npm start
```

## Prerequisites

1. Azure Storage Account
2. Azure Key Vault with an RSA key (2048+ bits)
3. Permissions:
   - Storage Blob Data Contributor
   - Key Vault Crypto User (wrapKey, unwrapKey, get)

## Technical Highlights

- Uses latest Azure SDK v4 for TypeScript
- Proper TypeScript types throughout
- Comprehensive error handling for both services
- Metadata-driven decryption (no manual key management needed)
- AES-GCM auth tag properly separated in Node.js (critical detail)
- DefaultAzureCredential for seamless dev-to-prod experience
