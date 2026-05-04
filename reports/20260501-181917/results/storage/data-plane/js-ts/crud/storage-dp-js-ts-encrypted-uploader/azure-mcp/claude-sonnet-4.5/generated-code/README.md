# Azure Blob Storage Client-Side Encryption with Key Vault

A TypeScript Node.js project that demonstrates secure file uploads to Azure Blob Storage with client-side encryption using envelope encryption and Azure Key Vault for key management.

## Architecture

This project implements **envelope encryption** with the following security properties:

- **Data Encryption Keys (DEK)** are generated locally and used for AES-256-GCM encryption
- **Key Encryption Keys (KEK)** remain in Azure Key Vault and never leave the service
- Raw DEKs are never persisted; only wrapped (encrypted) versions are stored
- Each blob gets a unique DEK (crypto-shredding support)
- AES-GCM provides authenticated encryption with additional data integrity

### Workflow

**Upload (Encryption):**
1. Generate a random 256-bit data encryption key (DEK)
2. Encrypt data locally using AES-256-GCM with the DEK
3. Wrap (encrypt) the DEK using a Key Vault key
4. Upload ciphertext to Blob Storage with metadata (wrapped DEK, IV, auth tag)
5. Securely erase the plaintext DEK from memory

**Download (Decryption):**
1. Download blob and read encryption metadata
2. Unwrap (decrypt) the DEK using Key Vault
3. Decrypt ciphertext locally using the recovered DEK
4. Securely erase the plaintext DEK from memory

## Project Structure

```
├── src/
│   ├── config.ts           # Azure client configuration and connection management
│   ├── keyManager.ts       # Envelope encryption implementation with Key Vault
│   ├── blobUploader.ts     # Blob Storage operations with encryption
│   └── index.ts            # Demo script
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

1. **Azure Resources:**
   - Azure Storage Account with a blob container
   - Azure Key Vault with an RSA key (2048-bit or higher)
   - Managed Identity or Service Principal with appropriate permissions

2. **Required Permissions:**
   - Storage Account: `Storage Blob Data Contributor` role
   - Key Vault: `Key Vault Crypto User` role (for wrap/unwrap operations)

3. **Node.js:** Version 18 or higher

## Installation

```bash
npm install
```

## Configuration

Set the following environment variables:

```bash
# Azure Key Vault configuration
export AZURE_KEYVAULT_URL="https://your-keyvault.vault.azure.net/"
export AZURE_KEYVAULT_KEY_NAME="your-encryption-key"

# Azure Storage configuration
export AZURE_STORAGE_ACCOUNT_URL="https://yourstorageaccount.blob.core.windows.net/"
export AZURE_STORAGE_CONTAINER_NAME="encrypted-files"  # Optional, defaults to "encrypted-files"

# Authentication (if not using managed identity)
# export AZURE_TENANT_ID="your-tenant-id"
# export AZURE_CLIENT_ID="your-client-id"
# export AZURE_CLIENT_SECRET="your-client-secret"
```

### Creating the Key Vault Key

If you need to create a new key:

```bash
# Using Azure CLI
az keyvault key create \
  --vault-name your-keyvault \
  --name your-encryption-key \
  --kty RSA \
  --size 2048 \
  --ops wrapKey unwrapKey
```

## Usage

### Build the project

```bash
npm run build
```

### Run the demo

```bash
npm start
```

Or for development:

```bash
npm run dev
```

### Using in your own code

```typescript
import { AzureConfig } from './config';
import { KeyManager } from './keyManager';
import { BlobUploader } from './blobUploader';

// Initialize
const keyClient = AzureConfig.getKeyClient();
const blobServiceClient = AzureConfig.getBlobServiceClient();
const keyManager = new KeyManager(keyClient, 'your-key-name');
const uploader = new BlobUploader(blobServiceClient, keyManager, 'container-name');

// Encrypt and upload
const data = Buffer.from('Secret message', 'utf-8');
await uploader.uploadEncrypted('my-file.txt', data);

// Download and decrypt
const decrypted = await uploader.downloadDecrypted('my-file.txt');
console.log(decrypted.toString('utf-8'));
```

## Security Considerations

1. **Key Management:**
   - The KEK in Key Vault should have appropriate access policies
   - Enable key rotation in Key Vault for long-term deployments
   - Consider using Key Vault's "soft delete" and "purge protection" features

2. **Data Protection:**
   - Each blob uses a unique DEK (no key reuse)
   - AES-GCM provides authenticated encryption (detects tampering)
   - Plaintext DEKs are never written to disk

3. **Access Control:**
   - Use Azure RBAC for fine-grained access control
   - Separate permissions for encryption (Key Vault) and storage (Blob Storage)
   - Consider using SAS tokens with limited permissions for blob access

4. **Compliance:**
   - Key Vault keys can be HSM-backed (Premium tier) for FIPS 140-2 compliance
   - Audit logs available in Azure Monitor for both Key Vault and Storage

## Error Handling

The implementation handles various error scenarios:

- **Key Vault errors:** Key disabled, access denied, key not found
- **Storage errors:** Blob not found, access denied, network issues
- **Decryption errors:** Corrupted data, authentication tag mismatch, wrong key

## Performance Considerations

- Encryption/decryption happens locally (fast)
- Key wrap/unwrap requires Key Vault round-trip (network latency)
- Consider caching Key Vault cryptography clients for better performance
- For large files, consider streaming encryption (requires modifications)

## License

MIT
