# Quick Start Guide

## Prerequisites

1. **Azure Resources Required**:
   - Azure Storage Account
   - Azure Key Vault
   - Managed Identity with permissions:
     - Key Vault: `Key Vault Crypto User` role
     - Storage: `Storage Blob Data Contributor` role

2. **Local Requirements**:
   - Node.js >= 18.0.0
   - npm or yarn

## Setup Steps

### 1. Clone/Copy Project
```bash
cd azure-encrypted-blob-storage
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Copy `.env.example` to `.env` and fill in your values:
```bash
AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount
AZURE_KEYVAULT_NAME=mykeyvault
AZURE_KEY_NAME=my-encryption-key
AZURE_CONTAINER_NAME=encrypted-files
```

### 4. Build TypeScript
```bash
npm run build
```

### 5. Run Demo
```bash
npm start
```

## Project Files

```
azure-encrypted-blob-storage/
├── src/
│   ├── config.ts                   # Azure connections & config
│   ├── keyManagement.ts            # Key Vault envelope encryption
│   ├── encryptedBlobStorage.ts     # Encrypted blob operations
│   └── index.ts                    # Demo script
├── dist/                           # Compiled JavaScript (generated)
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── README.md                       # Full documentation
├── PROJECT_SUMMARY.md              # Implementation summary
├── ENCRYPTION_FLOW.md              # Visual flow diagrams
├── EXAMPLE_OUTPUT.md               # Sample output
├── .env.example                    # Environment template
└── .gitignore                      # Git ignore rules
```

## Using in Your Own Project

### Import Classes
```typescript
import { AzureConnections } from "./config.js";
import { KeyManagement } from "./keyManagement.js";
import { EncryptedBlobStorage } from "./encryptedBlobStorage.js";
```

### Initialize
```typescript
const connections = AzureConnections.fromEnvironment();
const keyMgmt = new KeyManagement(
  connections.keyClient,
  "my-key-name",
  (keyId) => connections.getCryptographyClient(keyId)
);

await keyMgmt.ensureKeyExists();

const containerClient = connections.blobServiceClient.getContainerClient("my-container");
const storage = new EncryptedBlobStorage(containerClient, keyMgmt);
await storage.ensureContainerExists();
```

### Upload Encrypted Data
```typescript
await storage.uploadEncrypted("secret.txt", "My secret data");
```

### Download and Decrypt
```typescript
const decrypted = await storage.downloadDecrypted("secret.txt");
console.log(decrypted.toString());
```

## Common Issues

### Issue: "AZURE_STORAGE_ACCOUNT_NAME environment variable is required"
**Solution**: Set all required environment variables

### Issue: "Access denied to key"
**Solution**: Assign `Key Vault Crypto User` role to your managed identity

### Issue: "Access denied to storage account"
**Solution**: Assign `Storage Blob Data Contributor` role to your managed identity

### Issue: "Key 'my-key' not found"
**Solution**: The code auto-creates the key. Ensure you have Key Vault permissions.

### Issue: "Container not found"
**Solution**: The code auto-creates the container. Ensure you have Storage permissions.

## Architecture Highlights

- **Client-side encryption**: Data never reaches Azure in plaintext
- **Envelope encryption**: DEK encrypts data, KEK (in Key Vault) wraps DEK
- **AES-256-GCM**: Authenticated encryption (confidentiality + integrity)
- **Key rotation support**: Each blob stores the key ID used
- **Managed Identity**: No credentials in code

## Security Best Practices

✅ **DO**:
- Use managed identity for authentication
- Enable Key Vault soft-delete and purge protection
- Use HSM-backed keys for production (`hsm: true`)
- Set key expiration and rotation policies
- Keep Key Vault and Storage in the same region

❌ **DON'T**:
- Store DEKs in plaintext anywhere
- Hard-code credentials
- Disable authentication tag verification
- Re-use IVs (each encryption generates new IV)
- Share wrapped keys across different KEKs

## API Reference

### KeyManagement

| Method | Description |
|--------|-------------|
| `generateDataKey()` | Generate 32-byte AES-256 key |
| `wrapDataKey(dek)` | Wrap DEK with Key Vault |
| `unwrapDataKey(wrapped, keyId)` | Unwrap DEK with Key Vault |
| `ensureKeyExists()` | Create RSA key if missing |

### EncryptedBlobStorage

| Method | Description |
|--------|-------------|
| `uploadEncrypted(name, data)` | Encrypt and upload blob |
| `downloadDecrypted(name)` | Download and decrypt blob |
| `ensureContainerExists()` | Create container if missing |
| `listBlobs()` | List all blobs in container |

### AzureConnections

| Method | Description |
|--------|-------------|
| `fromEnvironment()` | Load config from env vars |
| `getCryptographyClient(keyId)` | Get crypto client for key |
| `getConfig()` | Get current configuration |

## Further Reading

- [Azure Key Vault Keys SDK](https://www.npmjs.com/package/@azure/keyvault-keys)
- [Azure Blob Storage SDK](https://www.npmjs.com/package/@azure/storage-blob)
- [Azure Identity SDK](https://www.npmjs.com/package/@azure/identity)
- [Envelope Encryption Pattern](https://learn.microsoft.com/azure/key-vault/keys/about-keys)
- [AES-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
