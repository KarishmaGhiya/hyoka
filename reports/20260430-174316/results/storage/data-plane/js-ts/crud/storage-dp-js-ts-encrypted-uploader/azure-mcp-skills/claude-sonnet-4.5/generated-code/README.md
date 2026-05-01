# Azure Encrypted Blob Storage Uploader

A TypeScript Node.js project that uploads files to Azure Blob Storage with client-side encryption, where encryption key material is managed in Azure Key Vault.

## Features

- **Envelope Encryption**: Uses a two-tier key hierarchy
  - Data Encryption Keys (DEK) generated locally for each upload
  - Key Encryption Key (KEK) stored securely in Azure Key Vault
- **Client-Side Encryption**: Data encrypted locally using AES-256-GCM before upload
- **Key Vault Integration**: Cryptographic operations (wrap/unwrap) performed by Key Vault
- **Secure Key Handling**: Raw DEKs never persisted; KEK material never leaves Key Vault
- **Authenticated Encryption**: AES-GCM provides confidentiality and integrity
- **Metadata Storage**: Cryptographic parameters stored as blob metadata

## Architecture

### Envelope Encryption Flow

**Upload (Encryption)**:
1. Generate random 256-bit DEK locally
2. Encrypt data with DEK using AES-256-GCM
3. Wrap (encrypt) DEK with KEK in Key Vault
4. Upload ciphertext to Blob Storage
5. Store wrapped DEK, IV, and auth tag in blob metadata
6. Securely erase DEK from memory

**Download (Decryption)**:
1. Download blob and read metadata
2. Unwrap (decrypt) DEK using Key Vault
3. Decrypt data locally with DEK
4. Securely erase DEK from memory

### Project Structure

```
src/
├── config.ts           # Azure service client configuration
├── keyManager.ts       # Key Vault integration and envelope encryption
├── blobStorage.ts      # Encrypted blob upload/download
└── index.ts            # Demo application
```

## Prerequisites

- Node.js 18+ and npm
- Azure subscription
- Azure Storage Account
- Azure Key Vault with a key (RSA 2048+ recommended)
- Appropriate permissions:
  - Storage Blob Data Contributor (for storage account)
  - Key Vault Crypto User (for key operations)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Azure Resources

```bash
# Create resource group
az group create --name rg-encrypted-storage --location eastus

# Create storage account
az storage account create \
  --name mystorageaccount \
  --resource-group rg-encrypted-storage \
  --sku Standard_LRS

# Create Key Vault
az keyvault create \
  --name mykeyvault \
  --resource-group rg-encrypted-storage \
  --location eastus

# Create a key in Key Vault
az keyvault key create \
  --vault-name mykeyvault \
  --name my-encryption-key \
  --kty RSA \
  --size 2048
```

### 3. Configure Authentication

For local development, authenticate with Azure CLI:

```bash
az login
```

For production (Azure-hosted), assign a managed identity to your resource and grant it permissions.

### 4. Set Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount
AZURE_KEY_VAULT_URL=https://mykeyvault.vault.azure.net/
AZURE_KEY_VAULT_KEY_NAME=my-encryption-key
```

### 5. Grant Permissions

```bash
# Get your current user principal ID
USER_PRINCIPAL_ID=$(az ad signed-in-user show --query id -o tsv)

# Grant Storage Blob Data Contributor
az role assignment create \
  --assignee $USER_PRINCIPAL_ID \
  --role "Storage Blob Data Contributor" \
  --scope /subscriptions/{subscription-id}/resourceGroups/rg-encrypted-storage/providers/Microsoft.Storage/storageAccounts/mystorageaccount

# Grant Key Vault Crypto User
az role assignment create \
  --assignee $USER_PRINCIPAL_ID \
  --role "Key Vault Crypto User" \
  --scope /subscriptions/{subscription-id}/resourceGroups/rg-encrypted-storage/providers/Microsoft.KeyVault/vaults/mykeyvault
```

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

### Expected Output

```
=== Azure Encrypted Blob Storage Demo ===

1. Initializing Azure clients...
✓ Configuration loaded

2. Setting up encryption services...
✓ Encryption services ready

3. Test data prepared:
   Container: encrypted-uploads
   Blob: test-1234567890.txt
   Content: "Hello, Azure! This is a secret message..."

4. Encrypting and uploading...
✓ Upload successful!
   Blob URL: https://mystorageaccount.blob.core.windows.net/...
   Key Vault Key ID: https://mykeyvault.vault.azure.net/keys/my-encryption-key/...
   Wrapped DEK (base64): ABC123...
   Wrapped DEK Length: 344 characters

5. Downloading and decrypting...
✓ Download and decryption successful!
   Decrypted content: "Hello, Azure! This is a secret message..."

6. Verifying round-trip...
✓ SUCCESS! Round-trip verified - original and decrypted data match.

=== Demo completed successfully! ===
```

## API Reference

### ConfigurationManager

```typescript
const configManager = new ConfigurationManager();
const config = configManager.getConfig();
```

### KeyManager

```typescript
const keyManager = new KeyManager(keyClient, keyName);

// Encrypt data with envelope encryption
const encrypted = await keyManager.encryptData(plaintext);

// Decrypt data
const plaintext = await keyManager.decryptData(encrypted);
```

### EncryptedBlobStorage

```typescript
const storage = new EncryptedBlobStorage(blobServiceClient, keyManager);

// Upload encrypted
const result = await storage.uploadEncrypted('container', 'blob.txt', 'data');

// Download and decrypt
const download = await storage.downloadDecrypted('container', 'blob.txt');
const plaintext = download.content.toString('utf-8');

// Delete blob
await storage.deleteBlob('container', 'blob.txt');
```

## Security Considerations

### What's Encrypted

- File contents are encrypted with AES-256-GCM
- Each file gets a unique DEK
- DEK is wrapped (encrypted) by Key Vault KEK

### What's Stored in Metadata (Unencrypted)

- Wrapped (encrypted) DEK
- Initialization Vector (IV)
- Authentication Tag
- Key Vault key ID
- Algorithm identifier

These parameters are safe to store unencrypted because:
- The wrapped DEK can only be unwrapped by Key Vault with proper authorization
- IV and auth tag are public parameters in authenticated encryption
- Key ID is a reference, not the key itself

### Key Rotation

To rotate keys:
1. Create a new key in Key Vault
2. Update `AZURE_KEY_VAULT_KEY_NAME` environment variable
3. Old blobs can still be decrypted using their stored `keyId` metadata
4. New uploads will use the new key

### Best Practices

- Use managed identity in production (no credentials in code)
- Enable Key Vault soft delete and purge protection
- Use Azure RBAC for Key Vault access (not access policies)
- Monitor Key Vault operations with Azure Monitor
- Implement key rotation strategy
- Use RSA 3072 or 4096 for enhanced security
- Consider using Azure Key Vault Managed HSM for FIPS 140-2 Level 3

## Error Handling

The implementation handles various failure scenarios:

- **Key Vault errors**: Key disabled, deleted, or insufficient permissions
- **Storage errors**: Container/blob not found, network issues
- **Encryption errors**: Invalid key size, auth tag verification failure
- **Configuration errors**: Missing environment variables

## Performance Considerations

- Encryption/decryption is CPU-bound (local operation)
- Key Vault wrap/unwrap adds ~100-200ms per operation
- Network transfer time depends on blob size
- Consider batch operations for multiple files

## License

MIT
