# Azure Encrypted Blob Uploader

A TypeScript Node.js project that uploads files to Azure Blob Storage with client-side encryption, using Azure Key Vault for key management with envelope encryption.

## Features

- **Envelope Encryption**: Generates data encryption keys (DEK) locally, encrypts data with AES-256-GCM, and protects DEKs using Azure Key Vault
- **Key Security**: Raw DEKs never persisted; vault key material never leaves Key Vault
- **AES-GCM Encryption**: Uses authenticated encryption with separate IV and authentication tag
- **Managed Identity Support**: Authenticates with Azure using DefaultAzureCredential
- **Error Handling**: Comprehensive error handling for both Key Vault and Blob Storage operations
- **Metadata Storage**: Stores wrapped keys and crypto parameters in blob metadata for easy retrieval

## Architecture

### Key Management (`keyManagement.ts`)
- Generates random 256-bit data encryption keys (DEK)
- Wraps DEKs using Azure Key Vault's RSA-OAEP-256 key wrapping
- Unwraps DEKs for decryption operations
- Clears sensitive key material from memory after use

### Blob Uploader (`blobUploader.ts`)
- **Upload Flow**:
  1. Generate a fresh DEK
  2. Encrypt data locally with AES-256-GCM
  3. Wrap the DEK with Key Vault
  4. Upload ciphertext to Blob Storage
  5. Store wrapped DEK, IV, and auth tag in blob metadata

- **Download Flow**:
  1. Download blob and metadata
  2. Unwrap DEK using Key Vault
  3. Decrypt ciphertext locally
  4. Return plaintext

### Configuration (`config.ts`)
- Manages Azure SDK clients with shared credentials
- Reads configuration from environment variables
- Supports managed identity authentication

## Prerequisites

- Node.js 18+ and npm
- Azure subscription with:
  - Azure Storage Account
  - Azure Key Vault with an RSA key (2048-bit or higher)
  - Managed identity or service principal with appropriate permissions

## Required Azure Permissions

### Key Vault Permissions
The identity running this code needs the following Key Vault permissions:
- `keys/get` - Read key metadata
- `keys/wrapKey` - Wrap data encryption keys
- `keys/unwrapKey` - Unwrap data encryption keys

### Storage Account Permissions
- `Storage Blob Data Contributor` role or equivalent permissions to read/write blobs

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Configure your environment variables in `.env`:
```env
AZURE_STORAGE_ACCOUNT_URL=https://your-storage-account.blob.core.windows.net
AZURE_KEY_VAULT_URL=https://your-key-vault.vault.azure.net
AZURE_KEY_VAULT_KEY_NAME=your-key-name
```

3. For local development with Azure CLI authentication:
```bash
az login
```

4. For production, configure managed identity or set service principal credentials:
```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
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

Or run directly with ts-node:
```bash
npm run dev
```

### Demo Output
The demo script will:
1. Connect to Azure services
2. Display the Key Vault key ID being used
3. Encrypt and upload a sample message
4. Display the wrapped DEK (base64-encoded)
5. Download and decrypt the message
6. Verify the round-trip matches
7. Clean up the demo blob

Example output:
```
=== Azure Encrypted Blob Uploader Demo ===

Initializing Azure connections...
✓ Connected to Azure services

Using Key Vault Key: https://your-vault.vault.azure.net/keys/your-key/abc123

Original data: "Hello, Azure! This is a secret message..."

Encrypting and uploading data...
✓ Data encrypted and uploaded successfully
  Container: encrypted-data
  Blob: demo-1234567890.txt
  Key Vault Key ID: https://your-vault.vault.azure.net/keys/your-key/abc123
  Wrapped DEK (base64): ZXhhbXBsZXdyYXBwZWRrZXk...

Downloading and decrypting data...
✓ Data downloaded and decrypted successfully
  Decrypted data: "Hello, Azure! This is a secret message..."

✓ Round-trip verification PASSED: Original and decrypted data match!

=== Demo completed successfully ===
```

## Programmatic Usage

```typescript
import { AzureConfigManager } from './config';
import { KeyManagement } from './keyManagement';
import { EncryptedBlobUploader } from './blobUploader';

// Initialize
const config = AzureConfigManager.getConfig();
const keyManagement = new KeyManagement(config.keyClient, config.keyName);
const uploader = new EncryptedBlobUploader(config.blobServiceClient, keyManagement);

// Upload encrypted data
const result = await uploader.uploadEncrypted(
  'my-container',
  'my-file.txt',
  'Secret data'
);
console.log('Wrapped DEK:', result.wrappedDEK);

// Download and decrypt
const downloaded = await uploader.downloadDecrypted('my-container', 'my-file.txt');
console.log('Plaintext:', downloaded.plaintext.toString('utf-8'));
```

## Security Considerations

1. **Key Material**: Data encryption keys are generated using cryptographically secure random bytes and are cleared from memory after use
2. **Key Vault**: All key wrapping/unwrapping operations happen server-side in Key Vault; the master key never leaves the vault
3. **Encryption**: Uses AES-256-GCM, a modern authenticated encryption algorithm
4. **IV Management**: A fresh random IV is generated for each encryption operation
5. **Authentication Tag**: GCM authentication tags ensure ciphertext integrity
6. **Metadata**: While wrapped keys are stored in blob metadata, they're useless without access to the Key Vault

## Error Handling

The application handles various error scenarios:
- Key Vault key disabled or deleted
- Blob not found
- Invalid or missing metadata
- Decryption failures
- Network errors

All errors include descriptive messages to aid in troubleshooting.

## Project Structure

```
.
├── src/
│   ├── index.ts           # Main demo script
│   ├── config.ts          # Azure configuration management
│   ├── keyManagement.ts   # Key Vault envelope encryption
│   └── blobUploader.ts    # Blob Storage with encryption
├── dist/                  # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## License

MIT
