# Project Summary: Azure Encrypted Blob Storage Uploader

## Overview
This TypeScript Node.js project implements client-side encryption for Azure Blob Storage using envelope encryption with Azure Key Vault. The implementation ensures that data encryption keys never leave the local system in plaintext, and Key Vault's master key material never leaves Azure.

## Project Structure

```
azure-encrypted-blob-uploader/
├── src/
│   ├── config.ts              # Azure connection manager with shared credentials
│   ├── keyManagement.ts       # Envelope encryption implementation
│   ├── blobUploader.ts        # Encrypted blob upload/download operations
│   └── index.ts               # Demo application showing full round-trip
├── dist/                      # Compiled JavaScript output
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
├── .env.example               # Environment variable template
├── .gitignore                 # Git ignore rules
└── README.md                  # Complete documentation

```

## Key Components

### 1. Configuration Module (config.ts)
- **AzureConnectionManager** class
- Manages connections to Azure Key Vault and Blob Storage
- Uses a single shared `DefaultAzureCredential` instance for authentication
- Reads configuration from environment variables
- Provides factory methods for KeyClient, BlobServiceClient, and KeyManagementService

### 2. Key Management Service (keyManagement.ts)
- **KeyManagementService** class
- Implements envelope encryption pattern
- **Data Encryption Key (DEK) generation**: Creates random 256-bit AES keys locally
- **Key Wrapping**: Protects DEKs using Azure Key Vault's RSA key (RSA-OAEP algorithm)
- **Key Unwrapping**: Recovers DEKs from wrapped format via Key Vault
- **Local Encryption**: Uses AES-256-GCM for authenticated encryption
- **Security**: DEKs are never persisted and are cleared from memory after use

Key Methods:
- `encryptData(plaintext)`: Returns ciphertext, IV, auth tag, and wrapped key
- `decryptData(ciphertext, iv, authTag, wrappedKey)`: Returns plaintext

### 3. Blob Uploader/Downloader (blobUploader.ts)
- **EncryptedBlobUploader** class
- Orchestrates encryption and storage operations

Upload Flow:
1. Generate DEK and encrypt data locally with AES-256-GCM
2. Wrap DEK using Key Vault
3. Upload ciphertext to Blob Storage
4. Store cryptographic metadata (IV, auth tag, wrapped DEK) as blob metadata

Download Flow:
1. Download blob and retrieve metadata
2. Unwrap DEK using Key Vault
3. Decrypt data locally using AES-256-GCM
4. Return plaintext

Additional Features:
- Container creation if it doesn't exist
- Comprehensive error handling for both Azure services
- Blob listing and deletion operations

### 4. Demo Application (index.ts)
Demonstrates complete round-trip:
1. Initialize Azure connections
2. Encrypt and upload sample data
3. Display encryption metadata (Key ID, wrapped DEK, IV, auth tag)
4. Download and decrypt data
5. Verify round-trip success
6. Clean up test blob

## Security Features

### Envelope Encryption
- Each file encrypted with unique DEK (never reused)
- DEKs protected by Key Vault's master key
- Master key material never leaves Azure Key Vault

### Cryptographic Parameters
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 96 bits (12 bytes, recommended for GCM)
- **Key Wrapping**: RSA-OAEP via Azure Key Vault

### Authentication
- Uses Azure Managed Identity (DefaultAzureCredential)
- Supports Azure CLI, Managed Identity, Environment Variables
- Single credential instance shared across all services

### Memory Safety
- DEKs cleared from memory after use (best effort in Node.js)
- No plaintext DEKs stored or logged

## Azure Dependencies

```json
{
  "@azure/identity": "^4.0.0",        // Authentication
  "@azure/keyvault-keys": "^4.8.0",   // Key Vault operations
  "@azure/storage-blob": "^12.17.0",  // Blob Storage operations
  "dotenv": "^16.3.1"                 // Environment configuration
}
```

## Required Azure Permissions

### Key Vault
- **Key Vault Crypto User** role
- Permissions: wrapKey, unwrapKey

### Storage Account
- **Storage Blob Data Contributor** role
- Permissions: read, write, delete blobs

## Environment Variables

```env
KEY_VAULT_URL=https://your-keyvault-name.vault.azure.net/
KEY_VAULT_KEY_NAME=your-encryption-key-name
STORAGE_ACCOUNT_URL=https://yourstorageaccount.blob.core.windows.net/
STORAGE_CONTAINER_NAME=encrypted-files
```

## Usage

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run demo
npm start

# Or run with ts-node
npm run dev
```

## Key Design Decisions

1. **Envelope Encryption**: Separates data encryption (local, fast) from key protection (remote, secure)
2. **AES-256-GCM**: Provides both encryption and authentication in a single operation
3. **Blob Metadata**: Stores encryption parameters with the blob for self-describing encrypted data
4. **Shared Credential**: Single DefaultAzureCredential instance reduces authentication overhead
5. **TypeScript**: Provides type safety and better developer experience
6. **Error Handling**: Comprehensive error messages for common failure scenarios

## Testing the Demo

The demo will:
- ✓ Encrypt sample text locally
- ✓ Upload to Blob Storage
- ✓ Display encryption metadata
- ✓ Download and decrypt
- ✓ Verify data integrity
- ✓ Clean up test data

Example output:
```
=== Azure Encrypted Blob Storage Demo ===

1. Initializing Azure connections...
   Key Vault URL: https://your-vault.vault.azure.net/
   Key Name: encryption-key
   Storage Account: https://yourstorage.blob.core.windows.net/
   Container: encrypted-files

2. Sample data to encrypt:
   "Hello, Azure! This is a secret message..."

3. Encrypting and uploading to Blob Storage...
✓ Uploaded encrypted blob: demo-encrypted-1234567890.txt

4. Retrieving blob metadata...
   Vault Key ID: https://your-vault.vault.azure.net/keys/encryption-key/abc123
   Wrapped DEK (base64): bXlzdXBlcnNlY3JldHdyYXBwZWRrZXk...
   IV (base64): cmFuZG9taXZkYXRh
   Auth Tag (base64): YXV0aHRhZ2RhdGE=
   Encryption Algorithm: AES-256-GCM

5. Downloading and decrypting...
✓ Downloaded and decrypted blob: demo-encrypted-1234567890.txt

6. Decrypted data:
   "Hello, Azure! This is a secret message..."

✅ SUCCESS: Round-trip encryption/decryption verified!

7. Cleaning up...
✓ Deleted blob: demo-encrypted-1234567890.txt

=== Demo Complete ===
```

## Next Steps

To use in production:
1. Set up Azure resources (Key Vault with RSA key, Storage Account)
2. Configure managed identity with appropriate permissions
3. Set environment variables
4. Integrate EncryptedBlobUploader class into your application
5. Consider adding key rotation support
6. Enable Azure Monitor for auditing
7. Consider using Private Endpoints for enhanced security
