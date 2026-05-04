# Azure Blob Storage Client-Side Encryption with Key Vault

This TypeScript Node.js project demonstrates how to upload files to Azure Blob Storage with client-side encryption using envelope encryption, where the encryption key material is managed in Azure Key Vault.

## Architecture

The project implements **envelope encryption**:

1. **Data Encryption Key (DEK)**: A random 256-bit AES key is generated locally for each upload
2. **Key Encryption**: The DEK is wrapped (encrypted) using an RSA key stored in Azure Key Vault
3. **Data Encryption**: Data is encrypted locally using AES-256-GCM with the DEK
4. **Storage**: Encrypted data and the wrapped DEK are stored together in Blob Storage
5. **Decryption**: The process is reversed - wrapped DEK is unwrapped by Key Vault, then used to decrypt the data locally

**Security guarantees**:
- The raw DEK never leaves memory and is never persisted
- The Key Vault's RSA key material never leaves Key Vault
- All cryptographic operations use the Key Vault Keys API (not Secrets)

## Project Structure

```
src/
├── config.ts           # Azure client configuration with managed identity
├── keyManager.ts       # Key Vault interaction and envelope encryption
├── blobEncryption.ts   # Blob upload/download with encryption
└── index.ts            # Demo script
```

## Prerequisites

1. **Azure Key Vault** with an RSA key created
2. **Azure Storage Account** with a container
3. **Managed Identity** or Azure CLI authentication configured
4. Node.js 18+ and npm installed

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure:
   ```bash
   AZURE_KEYVAULT_URL=https://your-keyvault.vault.azure.net/
   AZURE_KEYVAULT_KEY_NAME=encryption-key
   AZURE_STORAGE_ACCOUNT_URL=https://yourstorageaccount.blob.core.windows.net/
   ```

3. Create an RSA key in Key Vault (if not already created):
   ```bash
   az keyvault key create --vault-name your-keyvault --name encryption-key --kty RSA --size 2048
   ```

4. Ensure your identity has the following permissions:
   - Key Vault: `Wrap Key`, `Unwrap Key`, `Get Key`
   - Storage Account: `Storage Blob Data Contributor`

## Usage

Build and run the demo:

```bash
npm run build
npm start
```

Or use the dev script:

```bash
npm run dev
```

## How It Works

### Upload (Encryption)

1. Generate a random 256-bit DEK locally
2. Generate a random 12-byte initialization vector (IV)
3. Encrypt data using AES-256-GCM with the DEK and IV
4. Extract the authentication tag from the cipher
5. Wrap the DEK using Key Vault's RSA key
6. Upload encrypted data to Blob Storage with metadata:
   - `wrappedkey`: Base64-encoded wrapped DEK
   - `keyid`: Key Vault key identifier
   - `iv`: Base64-encoded initialization vector
   - `authtag`: Base64-encoded authentication tag

### Download (Decryption)

1. Download blob and read metadata
2. Unwrap the DEK using Key Vault
3. Decrypt data using AES-256-GCM with the unwrapped DEK, IV, and auth tag
4. Verify authentication tag to ensure data integrity
5. Return decrypted data

## Error Handling

The implementation handles common error scenarios:

- Key Vault key not found or disabled
- Blob does not exist
- Missing or invalid encryption metadata
- Authentication failures
- Network errors

## Security Considerations

- **No plaintext DEK storage**: DEKs are generated in memory and discarded after wrapping
- **Key Vault HSM protection**: The RSA key can be HSM-backed for additional security
- **Authenticated encryption**: AES-GCM provides both confidentiality and integrity
- **Unique DEK per blob**: Each upload generates a new DEK
- **Managed Identity**: No credentials stored in code or config files

## Dependencies

- `@azure/identity`: Azure authentication with managed identity
- `@azure/keyvault-keys`: Key Vault Keys API client
- `@azure/storage-blob`: Blob Storage client
- `crypto` (Node.js built-in): AES-GCM encryption/decryption

## License

MIT
