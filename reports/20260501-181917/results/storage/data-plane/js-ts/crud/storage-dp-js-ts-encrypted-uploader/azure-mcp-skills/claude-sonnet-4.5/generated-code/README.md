# Azure Encrypted Blob Storage with Envelope Encryption

A TypeScript/Node.js project demonstrating client-side encryption for Azure Blob Storage using envelope encryption with Azure Key Vault.

## Features

- **Envelope Encryption Pattern**: Data encryption keys (DEK) are generated locally, used to encrypt data, then wrapped (protected) by Azure Key Vault's key encryption key (KEK)
- **Client-Side Encryption**: Data is encrypted with AES-256-GCM before upload, ensuring Azure never sees plaintext
- **Key Management**: Azure Key Vault manages the KEK; raw DEKs never persist anywhere
- **Metadata Storage**: Wrapped DEK, IV, and authentication tag stored as blob metadata
- **Error Handling**: Comprehensive error handling for both Key Vault and Blob Storage operations
- **Managed Identity**: Uses Azure Managed Identity for authentication (no credentials in code)

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ├─── Generate DEK (32-byte random)
       │
       ├─── Encrypt data with DEK (AES-256-GCM)
       │    └─── IV (12 bytes)
       │    └─── Ciphertext
       │    └─── Auth Tag (16 bytes)
       │
       ├─── Wrap DEK with Key Vault
       │    ┌──────────────────┐
       │    │  Azure Key Vault │
       │    │   (RSA-2048 KEK) │
       │    └──────────────────┘
       │         │
       │         └─── Wrapped DEK
       │
       └─── Upload to Blob Storage
            ┌────────────────────────┐
            │  Azure Blob Storage    │
            │  ┌──────────────────┐  │
            │  │   Ciphertext     │  │
            │  └──────────────────┘  │
            │  Metadata:             │
            │  - wrapped_key         │
            │  - key_id              │
            │  - iv                  │
            │  - auth_tag            │
            └────────────────────────┘
```

## Security Guarantees

1. **DEK Never Persisted**: Raw data encryption keys exist only in memory during encryption/decryption
2. **KEK Never Leaves Key Vault**: Key material always remains in Azure Key Vault (or HSM)
3. **Authenticated Encryption**: AES-GCM provides both confidentiality and integrity
4. **Key Rotation Support**: Each blob stores the Key Vault key ID used, supporting key rotation
5. **Tamper Detection**: GCM authentication tag ensures data hasn't been modified

## Prerequisites

- Node.js >= 18.0.0
- Azure Storage Account with a blob container
- Azure Key Vault with an RSA key
- Managed Identity with appropriate permissions:
  - **Key Vault**: `Key Vault Crypto User` role (for wrap/unwrap operations)
  - **Storage Account**: `Storage Blob Data Contributor` role (for blob read/write)

## Environment Variables

Create a `.env` file or set these environment variables:

```bash
AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount
AZURE_KEYVAULT_NAME=mykeyvault
AZURE_KEY_NAME=my-encryption-key
AZURE_CONTAINER_NAME=encrypted-files
```

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Run

```bash
npm start
```

## Usage

### Key Management

```typescript
import { KeyManagement } from "./keyManagement.js";

const keyMgmt = new KeyManagement(keyClient, keyName, getCryptoClient);

// Generate a data encryption key
const dek = keyMgmt.generateDataKey();

// Wrap the DEK for storage
const { wrappedKey, keyId } = await keyMgmt.wrapDataKey(dek);

// Unwrap to recover the DEK
const recoveredDek = await keyMgmt.unwrapDataKey(wrappedKey, keyId);
```

### Encrypted Blob Storage

```typescript
import { EncryptedBlobStorage } from "./encryptedBlobStorage.js";

const storage = new EncryptedBlobStorage(containerClient, keyManagement);

// Upload encrypted data
await storage.uploadEncrypted("secret.txt", "My secret data");

// Download and decrypt
const decrypted = await storage.downloadDecrypted("secret.txt");
console.log(decrypted.toString());
```

## Project Structure

```
src/
├── config.ts                 # Azure connections and configuration
├── keyManagement.ts          # Envelope encryption with Key Vault
├── encryptedBlobStorage.ts   # Encrypted blob upload/download
└── index.ts                  # Demo script
```

## Error Handling

The project handles common failure scenarios:

- **Key Vault Errors**:
  - Key not found (404)
  - Key disabled
  - Access denied (403) - check RBAC permissions
  
- **Blob Storage Errors**:
  - Container not found (404)
  - Blob not found (404)
  - Access denied (403) - check RBAC permissions
  
- **Decryption Errors**:
  - Missing or invalid metadata
  - Authentication tag mismatch (tampered data)
  - Key rotation issues (old key ID no longer accessible)

## Best Practices

1. **Use HSM-backed keys** for production workloads (`hsm: true` when creating keys)
2. **Enable Key Vault soft-delete and purge protection** in production
3. **Implement key rotation policies** in Key Vault
4. **Use appropriate blob tiers** (Hot/Cool/Archive) based on access patterns
5. **Consider Azure Private Link** to keep traffic off the public internet
6. **Audit access** using Azure Monitor and Key Vault logging

## Limitations

- **Performance**: Each upload/download requires a Key Vault operation (wrap/unwrap)
- **Large Files**: For files > 100MB, consider chunked encryption with multiple DEKs
- **Cross-Region**: Key Vault and Storage should be in the same region for latency
- **Browser**: This implementation uses Node.js crypto APIs and is not browser-compatible

## License

MIT

## References

- [Azure Key Vault Keys SDK](https://www.npmjs.com/package/@azure/keyvault-keys)
- [Azure Blob Storage SDK](https://www.npmjs.com/package/@azure/storage-blob)
- [Envelope Encryption Pattern](https://learn.microsoft.com/azure/key-vault/keys/about-keys)
