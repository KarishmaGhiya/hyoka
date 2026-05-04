# Azure Encrypted Blob Storage Uploader

A TypeScript Node.js project that uploads files to Azure Blob Storage with client-side encryption, where the encryption key material is managed in Azure Key Vault.

## Features

- **Client-side encryption**: Data is encrypted locally before upload, ensuring zero-trust security
- **Envelope encryption**: Uses a two-tier key hierarchy with data encryption keys (DEK) and key encryption keys (KEK)
- **Azure Key Vault integration**: KEK managed in Azure Key Vault's Keys service (not Secrets)
- **AES-256-GCM encryption**: Provides both confidentiality and authenticity
- **Managed identity support**: Works seamlessly in Azure with no credential management
- **Metadata storage**: All cryptographic parameters stored as blob metadata for seamless decryption

## Architecture

### Encryption Flow

1. **Generate DEK**: A 256-bit AES data encryption key is generated locally
2. **Encrypt data**: Data is encrypted using AES-256-GCM with the DEK
3. **Wrap DEK**: The DEK is protected by Key Vault using RSA-OAEP
4. **Upload**: Ciphertext and wrapped DEK (plus IV and auth tag) are uploaded to Blob Storage

### Decryption Flow

1. **Download**: Blob and metadata are retrieved from Blob Storage
2. **Unwrap DEK**: Key Vault recovers the DEK from the wrapped key
3. **Decrypt data**: Data is decrypted locally using the DEK
4. **Clear DEK**: The DEK is cleared from memory

### Security Properties

- ✅ Raw DEK never persisted anywhere
- ✅ Key Vault's key material never leaves the vault
- ✅ Zero-trust: Data encrypted before leaving your application
- ✅ AES-GCM provides authenticated encryption (tamper detection)
- ✅ Each blob gets a unique DEK (key isolation)

## Prerequisites

- Node.js 18+ and npm
- An Azure subscription
- Azure Blob Storage account
- Azure Key Vault with an RSA key created
- Permissions to access both services (Storage Blob Data Contributor + Key Vault Crypto User)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount
AZURE_STORAGE_CONTAINER_NAME=encrypted-blobs
AZURE_KEY_VAULT_URL=https://myvault.vault.azure.net
AZURE_KEY_VAULT_KEY_NAME=my-encryption-key
```

### 3. Create Azure resources

#### Create Key Vault key

```bash
az keyvault key create \
  --vault-name myvault \
  --name my-encryption-key \
  --kty RSA \
  --size 2048 \
  --ops wrapKey unwrapKey
```

#### Create Storage Container

```bash
az storage container create \
  --name encrypted-blobs \
  --account-name mystorageaccount \
  --auth-mode login
```

### 4. Grant permissions

For local development (using Azure CLI):

```bash
# Login to Azure CLI
az login

# Grant yourself access to Key Vault
az keyvault set-policy \
  --name myvault \
  --upn your-email@domain.com \
  --key-permissions wrapKey unwrapKey get

# Grant yourself access to Storage
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee your-email@domain.com \
  --scope /subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{account}
```

For production (using managed identity):

```bash
# Assign managed identity to your service (VM, App Service, etc.)
# Then grant it permissions:

az keyvault set-policy \
  --name myvault \
  --object-id {managed-identity-object-id} \
  --key-permissions wrapKey unwrapKey get

az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee {managed-identity-object-id} \
  --scope /subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{account}
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

The demo script will:
1. Encrypt a sample string locally
2. Upload the encrypted data to Blob Storage
3. Download and decrypt the data
4. Verify the round-trip succeeded

### Expected output

```
=== Azure Encrypted Blob Storage Demo ===

1. Initializing Azure clients...
   - Key Vault URL: https://myvault.vault.azure.net
   - Key Name: my-encryption-key
   - Storage Account: https://mystorageaccount.blob.core.windows.net
   - Container: encrypted-blobs

2. Setting up encryption services...
   - Container ready

3. Using Key Vault key: https://myvault.vault.azure.net/keys/my-encryption-key/abc123

4. Encrypting and uploading data...
   - Blob name: encrypted-demo-1234567890.txt
   - Original data: "Hello, Azure! This is a secret message..."
   - Data size: 99 bytes

5. Upload complete! Encryption metadata:
   - Algorithm: AES-256-GCM
   - Key ID: https://myvault.vault.azure.net/keys/my-encryption-key/abc123
   - Wrapped DEK (base64): aBcDeFgHiJkLmNoPqRsTuVwXyZ...
   - IV (base64): 1234567890abcdef
   - Auth Tag (base64): fedcba0987654321

6. Downloading and decrypting...
   - Decrypted data: "Hello, Azure! This is a secret message..."
   - Decrypted size: 99 bytes

7. Verifying round-trip...
   ✓ SUCCESS! Decrypted data matches original data

=== Demo Complete ===
```

## Project Structure

```
.
├── src/
│   ├── config.ts          # Azure client configuration
│   ├── keyManager.ts      # Key Vault envelope encryption
│   ├── blobUploader.ts    # Encrypted blob upload/download
│   └── index.ts           # Demo script
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## API Reference

### AzureConfig

Manages Azure client configuration and authentication.

```typescript
const credential = AzureConfig.getCredential();
const blobClient = AzureConfig.createBlobServiceClient();
const keyClient = AzureConfig.createKeyClient();
const keyName = AzureConfig.getKeyName();
```

### KeyManager

Implements envelope encryption using Azure Key Vault.

```typescript
const keyManager = new KeyManager(keyClient, keyName);

// Generate a local data encryption key
const dek = keyManager.generateDataEncryptionKey();

// Wrap (protect) the DEK using Key Vault
const { wrappedKey, keyId } = await keyManager.wrapKey(dek);

// Unwrap (recover) the DEK using Key Vault
const unwrappedDek = await keyManager.unwrapKey(wrappedKey);
```

### EncryptedBlobUploader

Handles client-side encryption and blob storage.

```typescript
const uploader = new EncryptedBlobUploader(blobServiceClient, containerName, keyManager);

// Ensure container exists
await uploader.ensureContainer();

// Encrypt and upload
const metadata = await uploader.uploadEncrypted("myfile.txt", "secret data");

// Download and decrypt
const plaintext = await uploader.downloadDecrypted("myfile.txt");

// Delete
await uploader.deleteBlob("myfile.txt");
```

## Security Considerations

1. **Key rotation**: Periodically rotate your Key Vault key. Old encrypted blobs can still be decrypted using key versions.

2. **Access control**: Follow the principle of least privilege. Only grant necessary permissions.

3. **Audit logging**: Enable diagnostic logs on both Key Vault and Storage Account to track access.

4. **Network isolation**: Use private endpoints to keep traffic within Azure's network.

5. **Memory safety**: DEKs are cleared from memory after use, but consider using secure memory practices for highly sensitive data.

## Troubleshooting

### "AZURE_*_NAME environment variable is required"
Ensure all required environment variables are set in `.env` or your environment.

### "Key 'my-key' not found in Key Vault"
Verify the key exists and the key name matches exactly (case-sensitive).

### "Failed to wrap key: Forbidden"
Check that your identity has `wrapKey` and `unwrapKey` permissions on the Key Vault key.

### "Failed to upload encrypted blob: Forbidden"
Ensure your identity has the `Storage Blob Data Contributor` role on the storage account.

### "Key 'my-key' is disabled in Key Vault"
Enable the key in the Azure Portal or with: `az keyvault key set-attributes --vault-name myvault --name my-key --enabled true`

## License

MIT
