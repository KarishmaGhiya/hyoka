# Azure Encrypted Blob Storage Uploader

A TypeScript Node.js project that demonstrates client-side encryption for Azure Blob Storage using envelope encryption with Azure Key Vault.

## Features

- **Envelope Encryption**: Uses industry-standard envelope encryption pattern
- **AES-256-GCM**: Strong authenticated encryption for data
- **Azure Key Vault Integration**: Key material never leaves Key Vault
- **Zero Key Persistence**: Data encryption keys are generated locally and never persisted in plaintext
- **Managed Identity Support**: Seamless authentication using Azure Managed Identity
- **Type Safety**: Full TypeScript implementation with strict type checking

## Architecture

### Envelope Encryption Flow

**Upload (Encryption):**
1. Generate a random 256-bit Data Encryption Key (DEK) locally
2. Encrypt the data using AES-256-GCM with the DEK
3. Wrap (encrypt) the DEK using Azure Key Vault's RSA key
4. Upload the ciphertext to Blob Storage
5. Store the wrapped DEK, IV, and auth tag as blob metadata
6. Securely clear the DEK from memory

**Download (Decryption):**
1. Download the blob and its metadata
2. Unwrap (decrypt) the DEK using Azure Key Vault
3. Decrypt the data locally using AES-256-GCM with the unwrapped DEK
4. Securely clear the DEK from memory
5. Return the plaintext

### Security Properties

- **Data encryption keys never leave the local system in plaintext**
- **Key Vault's master key material never leaves Key Vault**
- **Each file is encrypted with a unique DEK**
- **Authentication tags ensure data integrity**
- **All cryptographic operations use recommended parameters (12-byte IV for GCM)**

## Project Structure

```
├── src/
│   ├── config.ts           # Azure connection manager
│   ├── keyManagement.ts    # Envelope encryption implementation
│   ├── blobUploader.ts     # Encrypted blob upload/download
│   └── index.ts            # Demo application
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- Azure subscription
- Azure Key Vault with an RSA key
- Azure Storage Account with a container
- Appropriate Azure permissions:
  - **Key Vault Crypto User** role on the Key Vault
  - **Storage Blob Data Contributor** role on the Storage Account

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Azure Resources

**Create a Key Vault and RSA Key:**

```bash
# Create Key Vault
az keyvault create \
  --name <your-keyvault-name> \
  --resource-group <your-resource-group> \
  --location eastus

# Create an RSA key for wrapping/unwrapping
az keyvault key create \
  --vault-name <your-keyvault-name> \
  --name <your-key-name> \
  --kty RSA \
  --size 2048
```

**Create a Storage Account and Container:**

```bash
# Create storage account
az storage account create \
  --name <your-storage-account> \
  --resource-group <your-resource-group> \
  --location eastus \
  --sku Standard_LRS

# Create container
az storage container create \
  --name encrypted-files \
  --account-name <your-storage-account>
```

### 3. Configure Permissions

**For Managed Identity (recommended for production):**

```bash
# Assign Key Vault Crypto User role
az role assignment create \
  --role "Key Vault Crypto User" \
  --assignee <managed-identity-principal-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault-name>

# Assign Storage Blob Data Contributor role
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee <managed-identity-principal-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<storage-account>
```

**For local development (Azure CLI):**

```bash
# Login with Azure CLI
az login

# Assign roles to your user account (use the same commands as above with your user principal ID)
```

### 4. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your Azure resource details:

```env
KEY_VAULT_URL=https://your-keyvault-name.vault.azure.net/
KEY_VAULT_KEY_NAME=your-encryption-key-name
STORAGE_ACCOUNT_URL=https://yourstorageaccount.blob.core.windows.net/
STORAGE_CONTAINER_NAME=encrypted-files
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

Or run directly with ts-node:

```bash
npm run dev
```

### Expected Output

```
=== Azure Encrypted Blob Storage Demo ===

1. Initializing Azure connections...
   Key Vault URL: https://your-vault.vault.azure.net/
   Key Name: encryption-key
   Storage Account: https://yourstorage.blob.core.windows.net/
   Container: encrypted-files

2. Sample data to encrypt:
   "Hello, Azure! This is a secret message encrypted with envelope encryption using Azure Key Vault and AES-256-GCM."

3. Encrypting and uploading to Blob Storage...
✓ Uploaded encrypted blob: demo-encrypted-1234567890.txt

4. Retrieving blob metadata...
   Vault Key ID: https://your-vault.vault.azure.net/keys/encryption-key/abc123
   Wrapped DEK (base64): bXlzdXBlcnNlY3JldHdyYXBwZWRrZXlkYXRh...
   IV (base64): cmFuZG9taXZkYXRh
   Auth Tag (base64): YXV0aHRhZ2RhdGE=
   Encryption Algorithm: AES-256-GCM

5. Downloading and decrypting...
✓ Downloaded and decrypted blob: demo-encrypted-1234567890.txt

6. Decrypted data:
   "Hello, Azure! This is a secret message encrypted with envelope encryption using Azure Key Vault and AES-256-GCM."

✅ SUCCESS: Round-trip encryption/decryption verified!
   Original and decrypted data match perfectly.

7. Cleaning up...
✓ Deleted blob: demo-encrypted-1234567890.txt

=== Demo Complete ===
```

## API Reference

### AzureConnectionManager

Manages Azure service connections with a shared credential.

```typescript
const manager = new AzureConnectionManager();
const keyClient = manager.getKeyClient();
const containerClient = manager.getContainerClient();
```

### KeyManagementService

Handles envelope encryption operations.

```typescript
const keyManagement = new KeyManagementService(keyClient, keyName);

// Encrypt data
const result = await keyManagement.encryptData(Buffer.from('data'));

// Decrypt data
const plaintext = await keyManagement.decryptData(
  result.ciphertext,
  result.iv,
  result.authTag,
  result.wrappedKey
);
```

### EncryptedBlobUploader

Manages encrypted blob uploads and downloads.

```typescript
const uploader = new EncryptedBlobUploader(containerClient, keyManagement);

// Upload encrypted data
await uploader.uploadEncrypted('myfile.txt', 'secret data');

// Download and decrypt
const data = await uploader.downloadDecrypted('myfile.txt');

// List blobs
const blobs = await uploader.listBlobs();

// Delete blob
await uploader.deleteBlob('myfile.txt');
```

## Security Considerations

1. **Key Rotation**: When rotating Key Vault keys, old blobs can still be decrypted if the old key version is retained
2. **Access Control**: Use Azure RBAC to control who can access Key Vault and Storage
3. **Audit Logging**: Enable Azure Monitor to track key usage and blob access
4. **Network Security**: Consider using Private Endpoints for Key Vault and Storage Account
5. **Memory Safety**: DEKs are cleared from memory after use (best effort in JavaScript/TypeScript)

## Troubleshooting

### Authentication Errors

- Ensure you're logged in with `az login` for local development
- Verify managed identity has the correct role assignments
- Check that the Key Vault access policy allows your identity

### Key Vault Errors

- Verify the Key Vault URL and key name are correct
- Ensure the key is RSA type (required for wrap/unwrap operations)
- Check that the key is enabled (not disabled or deleted)

### Storage Errors

- Verify the storage account URL and container name are correct
- Ensure the container exists or the code can create it
- Check that your identity has Storage Blob Data Contributor role

## License

MIT
