# Project Summary: Azure Encrypted Blob Uploader

## Overview
A complete TypeScript Node.js project implementing client-side encryption for Azure Blob Storage using Azure Key Vault envelope encryption.

## Architecture & Key Components

### 1. Key Management (`src/keyManagement.ts`)
**Purpose**: Implements envelope encryption with Azure Key Vault

**Key Features**:
- Generates 256-bit AES data encryption keys (DEK) locally using `crypto.randomBytes()`
- Uses Azure Key Vault's CryptographyClient to wrap/unwrap DEKs with RSA-OAEP-256
- Encrypts data with AES-256-GCM (authenticated encryption)
- Stores IV (12 bytes) and authentication tag separately as required by Node.js crypto
- Clears sensitive key material from memory after use with `buffer.fill(0)`

**Security Guarantees**:
- Raw DEKs never persisted to disk or metadata
- Vault's RSA key material never leaves Key Vault
- Each encryption operation uses a fresh DEK and IV
- Authentication tag provides integrity verification

### 2. Blob Uploader/Downloader (`src/blobUploader.ts`)
**Purpose**: Handles encrypted blob storage operations

**Upload Flow**:
1. Converts input to Buffer
2. Calls `keyManagement.encryptData()` to get ciphertext, IV, auth tag, and wrapped DEK
3. Creates/accesses container via `createIfNotExists()`
4. Stores ciphertext in blob
5. Stores wrapped DEK, IV, auth tag, and key ID in blob metadata

**Download Flow**:
1. Downloads blob and retrieves metadata
2. Validates metadata contains encryption parameters
3. Reconstructs EncryptedData object from blob and metadata
4. Calls `keyManagement.decryptData()` to unwrap DEK and decrypt
5. Returns plaintext Buffer

**Error Handling**:
- Blob not found errors
- Missing/invalid metadata
- Key Vault errors (key disabled/deleted)
- Decryption failures

### 3. Configuration (`src/config.ts`)
**Purpose**: Manages Azure SDK client initialization

**Features**:
- Singleton pattern for shared configuration
- Uses DefaultAzureCredential (supports managed identity, Azure CLI, service principal, etc.)
- Single credential instance shared across Blob Storage and Key Vault clients
- Reads from environment variables:
  - `AZURE_STORAGE_ACCOUNT_URL`
  - `AZURE_KEY_VAULT_URL`
  - `AZURE_KEY_VAULT_KEY_NAME`

### 4. Main Demo (`src/index.ts`)
**Purpose**: Demonstrates full round-trip encryption workflow

**Demo Steps**:
1. Initialize Azure connections
2. Display Key Vault key ID
3. Encrypt and upload sample data
4. Display wrapped DEK (base64)
5. Download and decrypt
6. Verify round-trip matches
7. Clean up demo blob

## Cryptographic Details

### Envelope Encryption Pattern
```
Plaintext → [Encrypt with DEK] → Ciphertext
DEK → [Wrap with Key Vault RSA key] → Wrapped DEK
Store: Ciphertext + Wrapped DEK + IV + Auth Tag
```

### AES-256-GCM Parameters
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key size**: 256 bits (32 bytes)
- **IV size**: 96 bits (12 bytes) - recommended for GCM
- **Auth tag size**: 128 bits (16 bytes) - default for GCM

### Key Vault Operations
- **Algorithm**: RSA-OAEP-256 (RSA with OAEP padding, SHA-256 hash)
- **Operations**: wrapKey, unwrapKey via CryptographyClient
- **Key requirements**: RSA key (2048-bit minimum, 4096-bit recommended)

## Blob Metadata Structure
```json
{
  "wrappedDEK": "base64-encoded-wrapped-key",
  "keyId": "https://vault.vault.azure.net/keys/key-name/version",
  "iv": "base64-encoded-iv",
  "authTag": "base64-encoded-auth-tag",
  "encrypted": "true"
}
```

## Dependencies
- **@azure/identity**: ^4.0.0 - Authentication via DefaultAzureCredential
- **@azure/keyvault-keys**: ^4.8.0 - Key Vault Keys service (KeyClient, CryptographyClient)
- **@azure/storage-blob**: ^12.17.0 - Blob Storage operations
- **Node.js crypto**: Built-in module for AES-GCM encryption

## Setup Requirements

### Azure Resources
1. **Storage Account**: General-purpose v2, any tier
2. **Key Vault**: Standard or Premium tier
3. **Key Vault Key**: RSA key (2048-bit or higher)

### Permissions
- **Key Vault**: 
  - `keys/get` (read key metadata)
  - `keys/wrapKey` (encrypt DEK)
  - `keys/unwrapKey` (decrypt DEK)
- **Storage Account**: 
  - `Storage Blob Data Contributor` role

### Environment Variables
```bash
AZURE_STORAGE_ACCOUNT_URL=https://youraccount.blob.core.windows.net
AZURE_KEY_VAULT_URL=https://yourvault.vault.azure.net
AZURE_KEY_VAULT_KEY_NAME=your-rsa-key-name
```

## Build & Run

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run demo (requires Azure credentials)
npm start

# Or run with ts-node
npm run dev
```

## Security Best Practices Implemented

✅ **No plaintext keys persisted**: DEKs cleared from memory after use
✅ **Fresh keys per operation**: New DEK and IV for each encryption
✅ **Authenticated encryption**: GCM provides both confidentiality and integrity
✅ **Key separation**: Data keys separated from key encryption keys
✅ **Server-side key protection**: Vault keys never leave Azure
✅ **Least privilege**: Uses managed identity with minimal required permissions
✅ **Error handling**: Graceful handling of vault/storage errors

## Testing the Project

To test the demo:
1. Set up Azure resources (Storage Account, Key Vault with RSA key)
2. Configure environment variables in `.env`
3. Authenticate with Azure (e.g., `az login` for local dev)
4. Run `npm start`

Expected output includes:
- Key Vault key ID
- Wrapped DEK (base64, ~512 characters for 2048-bit RSA)
- Round-trip verification pass
- Demo blob cleanup

## Files Created

```
├── src/
│   ├── config.ts          (376 lines) - Azure SDK configuration
│   ├── keyManagement.ts   (193 lines) - Envelope encryption implementation
│   ├── blobUploader.ts    (217 lines) - Encrypted blob operations
│   └── index.ts           (89 lines)  - Demo script
├── package.json           - NPM configuration with Azure SDKs
├── tsconfig.json          - TypeScript compiler settings
├── .env.example           - Environment variable template
├── .gitignore             - Excludes node_modules, dist, .env
└── README.md              - Complete documentation
```

## Production Considerations

For production use, consider:
1. **Key rotation**: Implement versioning for vault keys
2. **Logging**: Add structured logging for audit trails
3. **Monitoring**: Track encryption/decryption latency
4. **Retry logic**: Add exponential backoff for transient failures
5. **Blob lifecycle**: Implement retention policies
6. **Access control**: Use SAS tokens or RBAC for fine-grained access
7. **Large files**: Implement streaming for files > 100MB
8. **Compression**: Consider compressing before encrypting
