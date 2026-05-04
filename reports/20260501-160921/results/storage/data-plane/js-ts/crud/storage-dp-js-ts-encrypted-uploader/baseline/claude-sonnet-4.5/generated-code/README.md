# Azure Encrypted Blob Storage with Key Vault

A TypeScript Node.js project that demonstrates client-side encryption for Azure Blob Storage using envelope encryption with Azure Key Vault.

## Features

- **Client-side encryption**: Data is encrypted locally before uploading to Azure Blob Storage
- **Envelope encryption**: Uses a locally generated data encryption key (DEK) protected by Azure Key Vault
- **AES-256-GCM encryption**: Strong authenticated encryption for data
- **Key Vault integration**: RSA key wrapping/unwrapping operations via Azure Key Vault Keys service
- **Managed identity support**: Secure authentication using Azure managed identities
- **Zero key persistence**: Raw data encryption keys never leave memory and are never stored

## Architecture

### Envelope Encryption Flow

**Upload:**
1. Generate a random 256-bit AES data encryption key (DEK)
2. Encrypt the plaintext locally using AES-256-GCM with the DEK
3. Wrap (encrypt) the DEK using Azure Key Vault's RSA key
4. Upload the ciphertext to Blob Storage with metadata containing:
   - Wrapped DEK (base64)
   - Key Vault key ID
   - Initialization vector (IV)
   - Authentication tag
5. Securely wipe the DEK from memory

**Download:**
1. Download the blob and read its metadata
2. Extract the wrapped DEK, IV, and authentication tag
3. Unwrap (decrypt) the DEK using Azure Key Vault
4. Decrypt the ciphertext locally using the unwrapped DEK
5. Securely wipe the DEK from memory

### Security Properties

- Data encryption keys are generated client-side and never stored in plain text
- Azure Key Vault keys never leave the Key Vault (HSM-backed operations)
- AES-GCM provides both confidentiality and authenticity
- Each blob uses a unique DEK and IV
- Cryptographic operations are performed using Azure Key Vault's cryptographic service

## Prerequisites

- Node.js 18+ and npm
- Azure subscription
- Azure Storage Account
- Azure Key Vault with an RSA key
- Appropriate Azure permissions:
  - Storage Blob Data Contributor on the storage account
  - Key Vault Crypto User on the Key Vault

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
  --location eastus \
  --sku Standard_LRS

# Create Key Vault
az keyvault create \
  --name mykeyvault \
  --resource-group rg-encrypted-storage \
  --location eastus

# Create RSA key for encryption
az keyvault key create \
  --vault-name mykeyvault \
  --name encryption-key \
  --kty RSA \
  --size 2048 \
  --ops wrapKey unwrapKey
```

### 3. Configure Authentication

**For local development:**
```bash
az login
```

**For Azure services (VM, App Service, Functions):**
- Enable managed identity on your resource
- Grant the managed identity appropriate permissions

### 4. Set Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount
AZURE_KEY_VAULT_URL=https://mykeyvault.vault.azure.net/
AZURE_KEY_VAULT_KEY_NAME=encryption-key
AZURE_STORAGE_CONTAINER_NAME=encrypted-files
```

### 5. Assign Permissions

```bash
# Get your user or managed identity principal ID
PRINCIPAL_ID=$(az ad signed-in-user show --query id -o tsv)

# Grant Storage Blob Data Contributor
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee $PRINCIPAL_ID \
  --scope /subscriptions/{subscription-id}/resourceGroups/rg-encrypted-storage/providers/Microsoft.Storage/storageAccounts/mystorageaccount

# Grant Key Vault Crypto User
az role assignment create \
  --role "Key Vault Crypto User" \
  --assignee $PRINCIPAL_ID \
  --scope /subscriptions/{subscription-id}/resourceGroups/rg-encrypted-storage/providers/Microsoft.KeyVault/vaults/mykeyvault
```

## Usage

### Build the Project

```bash
npm run build
```

### Run the Demo

```bash
npm start
```

The demo will:
1. Initialize connections to Azure Storage and Key Vault
2. Encrypt a sample string using envelope encryption
3. Upload the encrypted data to Blob Storage with metadata
4. Download the encrypted blob
5. Decrypt the data using Key Vault to unwrap the DEK
6. Verify the round-trip by comparing original and decrypted data

### Expected Output

```
=== Azure Encrypted Blob Storage Demo ===

1. Initializing Azure services...
   - Storage Account: mystorageaccount
   - Container: encrypted-files
   - Key Vault Key: encryption-key

2. Encrypting and uploading data...
   - Original data: "Hello, Azure! This is a secret message..."
   - Blob name: test-encrypted-1234567890.txt

3. Upload completed:
   - Blob URL: https://mystorageaccount.blob.core.windows.net/...
   - Key Vault Key ID: https://mykeyvault.vault.azure.net/keys/encryption-key/...
   - Wrapped DEK (base64): eyJhbGciOiJSU0EtT0FFUC0yNTYiLCJlbmMiOiJBMjU2R0...

4. Downloading and decrypting data...

5. Decryption completed:
   - Decrypted data: "Hello, Azure! This is a secret message..."

6. Verification:
   ✓ SUCCESS: Decrypted data matches original!

=== Demo completed successfully ===
```

## Project Structure

```
.
├── src/
│   ├── config.ts           # Azure service configuration and credential management
│   ├── keyManagement.ts    # Envelope encryption implementation with Key Vault
│   ├── blobStorage.ts      # Encrypted blob upload/download operations
│   └── index.ts            # Demo application
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## API Reference

### KeyManagementService

Handles envelope encryption using Azure Key Vault.

```typescript
const keyManagement = new KeyManagementService(keyClient, keyName);

// Encrypt data (generates DEK, encrypts, wraps DEK)
const result = await keyManagement.encryptData(Buffer.from('secret'));

// Decrypt data (unwraps DEK, decrypts)
const plaintext = await keyManagement.decryptData(
  result.ciphertext,
  result.iv,
  result.authTag,
  result.wrappedKey
);
```

### EncryptedBlobStorage

Manages encrypted blob storage operations.

```typescript
const storage = new EncryptedBlobStorage(blobServiceClient, keyManagement, containerName);

// Upload encrypted
const uploadResult = await storage.uploadEncrypted('myfile.txt', 'secret data');

// Download and decrypt
const decryptedData = await storage.downloadDecrypted('myfile.txt');
```

## Security Considerations

1. **Key Rotation**: Implement key rotation by creating new Key Vault key versions
2. **Access Control**: Use Azure RBAC to control who can access blobs and perform crypto operations
3. **Audit Logging**: Enable diagnostic logging on Key Vault and Storage Account
4. **Network Security**: Consider using private endpoints for Key Vault and Storage
5. **Key Backup**: Ensure Key Vault keys are backed up and recoverable

## Error Handling

The implementation handles common error scenarios:
- Key Vault key disabled or deleted
- Blob not found
- Missing or corrupted encryption metadata
- Authentication failures
- Network issues

## License

MIT
