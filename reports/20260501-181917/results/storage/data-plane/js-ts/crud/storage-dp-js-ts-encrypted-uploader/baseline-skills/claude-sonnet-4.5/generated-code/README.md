# Azure Blob Storage Client-Side Encryption with Key Vault

This TypeScript Node.js project demonstrates how to upload files to Azure Blob Storage with **client-side encryption** using **envelope encryption**, where the encryption key material is managed in Azure Key Vault.

## Architecture

### Envelope Encryption Flow

**Upload (Encryption):**
1. Generate a 256-bit Data Encryption Key (DEK) locally using Node.js crypto
2. Encrypt the data locally using AES-256-GCM with the DEK
3. Wrap (encrypt) the DEK using Azure Key Vault's RSA key
4. Upload the ciphertext to Blob Storage with metadata containing:
   - Wrapped DEK (base64)
   - Initialization Vector (IV, base64)
   - Authentication Tag (base64)
   - Key Vault key ID and algorithm

**Download (Decryption):**
1. Download the encrypted blob and its metadata from Blob Storage
2. Unwrap (decrypt) the DEK using Azure Key Vault
3. Decrypt the data locally using AES-256-GCM with the recovered DEK
4. Return the plaintext data

### Security Guarantees

- ✅ **Raw DEK never persisted** - Generated in memory, used once, then cleared
- ✅ **Key material never leaves Key Vault** - Only wrap/unwrap operations performed
- ✅ **Authenticated encryption** - AES-GCM provides confidentiality and integrity
- ✅ **Managed Identity authentication** - No credentials in code

## Project Structure

```
src/
├── config.ts           # Azure client configuration and factory
├── keyManagement.ts    # Key Vault operations (wrap/unwrap DEK)
├── blobEncryptor.ts    # Blob encryption/decryption service
└── index.ts            # Demo main script
```

## Prerequisites

1. **Azure Key Vault** with an RSA key created (e.g., "encryption-key")
2. **Azure Storage Account** with Blob Storage enabled
3. **Managed Identity** with permissions:
   - Key Vault: `Get`, `Wrap Key`, `Unwrap Key`
   - Storage: `Storage Blob Data Contributor` role
4. **Node.js** >= 18.0.0

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
KEY_VAULT_URL=https://your-keyvault.vault.azure.net
KEY_VAULT_KEY_NAME=encryption-key
AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
CONTAINER_NAME=encrypted-files
```

## Usage

### Build

```bash
npm run build
```

### Run Demo

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

## How It Works

### 1. Key Management Service (`keyManagement.ts`)

Handles all Key Vault interactions:

```typescript
const keyManagement = new KeyManagementService(keyClient, "encryption-key");

// Generate DEK locally (never persisted)
const dataKey = keyManagement.generateDataEncryptionKey(); // 256-bit random

// Wrap DEK with Key Vault
const wrappedKey = await keyManagement.wrapDataKey(dataKey);
// Returns: { wrappedKey: "base64...", keyId: "vault-key-id", algorithm: "RSA-OAEP" }

// Unwrap DEK when needed
const recoveredKey = await keyManagement.unwrapDataKey(wrappedKey);
```

### 2. Blob Encryptor Service (`blobEncryptor.ts`)

Orchestrates encryption and storage:

```typescript
const blobEncryptor = new BlobEncryptorService(
  blobServiceClient,
  keyManagement,
  "encrypted-files"
);

// Encrypt and upload
await blobEncryptor.uploadEncrypted("secret.txt", "confidential data");

// Download and decrypt
const decrypted = await blobEncryptor.downloadDecrypted("secret.txt");
console.log(decrypted.toString("utf-8"));
```

### 3. Main Demo (`index.ts`)

Demonstrates full round-trip:
- Encrypts a sample message
- Uploads to Blob Storage
- Downloads and decrypts
- Verifies the decrypted data matches the original
- Displays cryptographic parameters

## Cryptographic Details

### Algorithms Used

- **Data Encryption**: AES-256-GCM (Galois/Counter Mode)
  - 256-bit key
  - 96-bit IV (recommended for GCM)
  - Provides authenticated encryption
- **Key Wrapping**: RSA-OAEP (via Azure Key Vault)
  - Key material never leaves Key Vault HSM

### Metadata Stored with Each Blob

```json
{
  "iv": "base64-encoded-initialization-vector",
  "authTag": "base64-encoded-authentication-tag",
  "wrappedKey": "base64-encoded-wrapped-dek",
  "keyId": "https://vault.azure.net/keys/encryption-key/version",
  "algorithm": "RSA-OAEP",
  "encryptionAlgorithm": "aes-256-gcm"
}
```

## Error Handling

The project handles common errors from both services:

- **Key Vault Errors**:
  - Key not found (404)
  - Access denied (403)
  - Key disabled
  
- **Blob Storage Errors**:
  - Container not found (404)
  - Access denied (403)
  - Blob not found

## Best Practices Implemented

1. ✅ **Managed Identity** for authentication (no credentials in code)
2. ✅ **Envelope encryption** for performance and key rotation flexibility
3. ✅ **AES-GCM** for authenticated encryption
4. ✅ **Secure memory handling** (clear sensitive data after use)
5. ✅ **Comprehensive error handling** for both Azure services
6. ✅ **Metadata-based crypto parameters** (IV, tag, wrapped key)

## Key Rotation

To rotate the Key Vault key:

1. Create a new key version in Key Vault (automatic with rotation policy)
2. Old blobs remain decryptable (metadata contains the key version)
3. New uploads automatically use the latest key version
4. No code changes required

## License

MIT
