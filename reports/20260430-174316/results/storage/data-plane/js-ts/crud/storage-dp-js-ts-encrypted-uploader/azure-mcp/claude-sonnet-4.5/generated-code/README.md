# Azure Encrypted Blob Storage Uploader

A TypeScript Node.js project that uploads files to Azure Blob Storage with client-side encryption, using Azure Key Vault for key management.

## Features

- **Envelope Encryption**: Generates data encryption keys (DEK) locally, wraps them with Azure Key Vault
- **AES-256-GCM Encryption**: Strong authenticated encryption for data at rest
- **Secure Key Management**: Raw DEKs never persisted; Key Vault's key material never leaves the vault
- **Managed Identity Support**: Seamless authentication in Azure environments
- **Complete Metadata Storage**: IV, auth tag, and wrapped key stored as blob metadata
- **Error Handling**: Comprehensive error handling for both Blob Storage and Key Vault operations

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client    │────▶│  Key Management  │────▶│  Azure Key      │
│             │     │     Service      │     │    Vault        │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │                                              │
       │  1. Generate DEK locally                     │
       │  2. Encrypt data with DEK                    │
       │  3. Wrap DEK ────────────────────────────────┘
       │  4. Upload ciphertext + metadata
       │
       ▼
┌──────────────────────────────────────────┐
│         Azure Blob Storage               │
│  ┌────────────────────────────────────┐  │
│  │ Encrypted Data (Ciphertext)        │  │
│  ├────────────────────────────────────┤  │
│  │ Metadata:                          │  │
│  │  - Wrapped DEK                     │  │
│  │  - Key Vault Key ID                │  │
│  │  - Initialization Vector (IV)      │  │
│  │  - Authentication Tag              │  │
│  │  - Algorithm                       │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Prerequisites

- Node.js 18 or higher
- Azure subscription
- Azure Storage Account
- Azure Key Vault with an RSA key
- Appropriate RBAC permissions:
  - `Storage Blob Data Contributor` on the Storage Account
  - `Key Vault Crypto User` on the Key Vault

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
AZURE_STORAGE_ACCOUNT_URL=https://mystorageaccount.blob.core.windows.net
AZURE_KEYVAULT_URL=https://mykeyvault.vault.azure.net
AZURE_KEYVAULT_KEY_NAME=my-encryption-key
```

## Authentication

This project uses `DefaultAzureCredential` which supports:

- **Local Development**: Run `az login` before executing
- **Azure Environments**: Automatically uses Managed Identity

## Usage

### Build and Run

```bash
# Build TypeScript
npm run build

# Run the demo
npm start

# Or run directly with ts-node
npm run dev
```

### Programmatic Usage

```typescript
import { ConfigurationManager } from './config';
import { KeyManagementService } from './keyManagement';
import { EncryptedBlobService } from './blobStorage';

// Initialize services
const config = ConfigurationManager.getConfig();
const keyService = new KeyManagementService(config.keyClient, config.keyName);
const blobService = new EncryptedBlobService(
  config.blobServiceClient,
  keyService,
  'my-container'
);

// Encrypt and upload
await blobService.uploadEncrypted('myfile.txt', 'Secret data');

// Download and decrypt
const decrypted = await blobService.downloadDecrypted('myfile.txt');
console.log(decrypted.toString('utf-8'));
```

## Project Structure

```
├── src/
│   ├── config.ts           # Azure service configuration and authentication
│   ├── keyManagement.ts    # Key Vault operations (wrap/unwrap DEK)
│   ├── blobStorage.ts      # Encrypted blob upload/download
│   └── index.ts            # Demo application
├── package.json
├── tsconfig.json
└── README.md
```

## Security Considerations

1. **Key Material**: Raw data encryption keys are only held in memory during encryption/decryption operations and are immediately cleared afterward
2. **Key Vault Keys**: The Key Vault key material never leaves the vault; all wrap/unwrap operations are performed server-side
3. **Authenticated Encryption**: AES-GCM provides both confidentiality and authenticity
4. **Metadata Protection**: While metadata is not encrypted, it contains only cryptographic parameters (no sensitive data)

## Error Handling

The service handles common error scenarios:

- Key Vault key disabled or deleted
- Blob not found
- Authentication failures
- Corrupted or tampered ciphertext (auth tag verification)
- Network issues

## License

MIT
