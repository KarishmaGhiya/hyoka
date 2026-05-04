# Project Summary: Azure Encrypted Blob Storage

## Overview
This TypeScript/Node.js project demonstrates **client-side encryption** for Azure Blob Storage using the **envelope encryption pattern** with Azure Key Vault.

## Key Features Implemented

### 1. **Envelope Encryption Pattern**
- **Data Encryption Key (DEK)**: Generated locally (32-byte AES-256 key)
- **Key Encryption Key (KEK)**: Managed in Azure Key Vault (RSA-2048)
- **Process**: DEK encrypts data → KEK wraps DEK → Store wrapped DEK with encrypted blob

### 2. **Security Guarantees**
- ✅ Raw DEK never persisted (only in memory during encryption/decryption)
- ✅ KEK never leaves Key Vault (all wrap/unwrap operations happen server-side)
- ✅ AES-256-GCM provides both confidentiality and integrity
- ✅ Authentication tag prevents tampering
- ✅ Unique IV for each encryption operation

### 3. **Project Structure**

```
src/
├── config.ts                 # Azure connections with shared credential
├── keyManagement.ts          # Key Vault operations (wrap/unwrap DEKs)
├── encryptedBlobStorage.ts   # Blob encryption/decryption logic
└── index.ts                  # Demo script showing full round-trip
```

### 4. **Key Classes**

#### `AzureConnections` (config.ts)
- Initializes BlobServiceClient and KeyClient
- Uses ManagedIdentityCredential (single shared instance)
- Loads configuration from environment variables
- Creates CryptographyClient instances on demand

#### `KeyManagement` (keyManagement.ts)
- `generateDataKey()`: Creates 32-byte random AES key
- `wrapDataKey()`: Protects DEK using Key Vault (RSA-OAEP)
- `unwrapDataKey()`: Recovers DEK using Key Vault
- `ensureKeyExists()`: Creates RSA key if missing
- Comprehensive error handling for Key Vault operations

#### `EncryptedBlobStorage` (encryptedBlobStorage.ts)
- `uploadEncrypted()`: 
  1. Generate DEK
  2. Encrypt data with AES-256-GCM
  3. Wrap DEK via Key Vault
  4. Upload ciphertext + metadata
- `downloadDecrypted()`:
  1. Download blob + metadata
  2. Unwrap DEK via Key Vault
  3. Decrypt using recovered DEK
  4. Verify authentication tag
- Stores IV, auth tag, wrapped DEK, and key ID as blob metadata

### 5. **Demo Script** (index.ts)
Demonstrates complete round-trip:
1. Load configuration
2. Initialize Key Vault and Blob Storage clients
3. Encrypt sample string and upload
4. Download and decrypt
5. Verify decrypted data matches original
6. Display encryption metadata (Key ID, wrapped DEK, IV, auth tag)

### 6. **Error Handling**
- Key Vault: 404 (not found), 403 (access denied), key disabled
- Blob Storage: 404 (blob/container not found), 403 (access denied)
- Decryption: Invalid metadata, tampered data, key rotation issues

### 7. **Environment Variables Required**
```bash
AZURE_STORAGE_ACCOUNT_NAME=<your-storage-account>
AZURE_KEYVAULT_NAME=<your-keyvault>
AZURE_KEY_NAME=<your-encryption-key>
AZURE_CONTAINER_NAME=encrypted-files  # Optional, defaults to "encrypted-files"
```

### 8. **Azure RBAC Permissions Required**
- **Key Vault**: `Key Vault Crypto User` role
- **Storage Account**: `Storage Blob Data Contributor` role

## Build and Run

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run demo (requires environment variables set)
npm start
```

## Files Generated
- ✅ `package.json` - Dependencies and scripts
- ✅ `tsconfig.json` - TypeScript configuration (ES2022, strict mode)
- ✅ `src/config.ts` - Azure service configuration
- ✅ `src/keyManagement.ts` - Envelope encryption implementation
- ✅ `src/encryptedBlobStorage.ts` - Encrypted blob operations
- ✅ `src/index.ts` - Demo script
- ✅ `README.md` - Complete documentation
- ✅ `.env.example` - Example environment variables
- ✅ `.gitignore` - Ignore node_modules, dist, etc.

## Verification
- ✅ All TypeScript files compile without errors
- ✅ Output files generated in `dist/` directory
- ✅ Dependencies installed successfully
- ✅ Code follows Azure SDK best practices per skill guidance
