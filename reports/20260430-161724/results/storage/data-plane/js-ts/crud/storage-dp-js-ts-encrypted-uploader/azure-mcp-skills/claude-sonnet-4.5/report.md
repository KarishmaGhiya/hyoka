# Evaluation Report: storage-dp-js-ts-encrypted-uploader

**Config:** azure-mcp-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 167.3s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `storage-dp-js-ts-encrypted-uploader` |
| Config | azure-mcp-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 167.3s |
| Timestamp | 2026-04-30T23:35:23Z |
| Files Generated | 0 |
| Event Count | 120 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 167.2s |
| **Total** | **167.3s** |

## Configuration

- **name:** azure-mcp-skills/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=220893 out=14364 |
| Turn Count | 5 |

## Error

```
0 files generated despite 9 file-write tool attempts
```

## Prompt Sent

```
Create a TypeScript Node.js project that uploads files to Azure Blob Storage with client-side encryption, where the encryption key material is managed in Azure Key Vault.

The project needs:

- A **key management class** that interacts with Azure Key Vault's Keys service (not Secrets) to perform cryptographic operations. It should implement envelope encryption: generate a data encryption key locally, use Key Vault to protect (wrap) it, and store the protected key alongside the encrypted blob. For decryption, have Key Vault recover (unwrap) the data key, then decrypt locally. The raw data key should never be persisted anywhere, and the vault's key material should never leave Key Vault.

- A **blob uploader/downloader class** that handles the actual encryption and storage. For upload: generate a data key, encrypt the data locally using AES-GCM, protect the data key via Key Vault, then upload the ciphertext to Blob Storage with the protected key and any necessary cryptographic parameters stored as blob metadata (including the initialization vector and the authentication tag, which in Node.js is separate from the ciphertext). For download: read the blob and its metadata, recover the data key via Key Vault, and decrypt. Should handle errors from both services (e.g., the vault key may have been disabled, or the blob may not exist).

- A **configuration module** that builds the necessary Azure connections for both Blob Storage and Key Vault. It should read endpoints from environment variables and authenticate with managed identity. All connections should share a single credential instance.

- A **main script** that demos the full encrypt-upload-download-decrypt round-trip: encrypts and uploads a sample string, then downloads and decrypts it back. Print the vault key ID used, the wrapped DEK (base64), and the decrypted output to verify the round-trip.

Include a complete `package.json` with the necessary Azure SDK dependencies and a `tsconfig.json`.
```

## Copilot Reasoning

The user wants me to create a TypeScript Node.js project that implements client-side encryption for Azure Blob Storage uploads, with encryption keys managed by Azure Key Vault. Let me break down the requirements:

1. **Key Management Class**: 
   - Uses Azure Key Vault's Keys service (cryptographic operations)
   - Implements envelope encryption
   - Generate data encryption key (DEK) locally
   - Use Key Vault to wrap/unwrap the DEK
   - Store wrapped DEK with the blob
   - Raw DEK never persisted
   - Vault key material never leaves Key Vault

2. **Blob Uploader/Downloader Class**:
   - Upload: generate DEK, encrypt with AES-GCM, wrap DEK, upload ciphertext + metadata
   - Metadata includes: wrapped DEK, IV, auth tag
   - Download: read blob + metadata, unwrap DEK, decrypt
   - Error handling for both services

3. **Configuration Module**:
   - Builds Azure connections for Blob Storage and Key Vault
   - Reads endpoints from environment variables
   - Uses managed identity authentication
   - Single credential instance

4. **Main Script**:
   - Demo encrypt-upload-download-decrypt round-trip
   - Print vault key ID, wrapped DEK (base64), decrypted output

5. **Project Setup**:
   - package.json with Azure SDK dependencies
   - tsconfig.json

I'll need to create multiple files:
- `package.json`
- `tsconfig.json`
- `src/config.ts` - configuration module
- `src/keyManager.ts` - key management class
- `src/blobUploader.ts` - blob uploader/downloader class
- `src/index.ts` - main script
- Maybe a `.env.example` for documentation

Let me start by reporting my intent and creating these files.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating encrypted blob uploader project"}
```

### 🔧 2. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-encrypted-blob-uploader\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Upload files to Azure Blob Storage with client-side encryption using Key Vault\",\n  \"main\": \"dist/index.js\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/index.js\",\n    \"dev\": \"ts-node src/index.ts\"\n  },\n  \"keywords\": [\n    \"azure\",\n    \"blob-storage\",\n    \"encryption\",\n    \"key-vault\"\n  ],\n  \"author\": \"\",\n  \"license\": \"MIT\",\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.0.0\",\n    \"@azure/keyvault-keys\": \"^4.8.0\",\n    \"@azure/storage-blob\": \"^12.17.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.10.0\",\n    \"ts-node\": \"^10.9.2\",\n    \"typescript\": \"^5.3.3\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1351866255\\package.json"}
```

### 🔧 3. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./src\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"moduleResolution\": \"node\",\n    \"resolveJsonModule\": true,\n    \"declaration\": true,\n    \"declarationMap\": true,\n    \"sourceMap\": true\n  },\n  \"include\": [\"src/**/*\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1351866255\\tsconfig.json"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"# Azure Key Vault configuration\nKEY_VAULT_URL=https://your-keyvault.vault.azure.net/\nKEY_VAULT_KEY_NAME=your-encryption-key\n\n# Azure Blob Storage configuration\nSTORAGE_ACCOUNT_NAME=yourstorageaccount\nSTORAGE_CONTAINER_NAME=encrypted-files\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1351866255\\.env.example"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"import { DefaultAzureCredential } from '@azure/identity';\nimport { BlobServiceClient } from '@azure/storage-blob';\nimport { CryptographyClient, KeyClient } from '@azure/keyvault-keys';\n\nexport interface AzureConfig {\n  keyVaultUrl: string;\n  keyVaultKeyName: string;\n  storageAccountName: string;\n  containerName: string;\n}\n\nexport class AzureConnectionManager {\n  private credential: DefaultAzureCredential;\n  private config: AzureConfig;\n\n  constructor() {\n    this.credential = new DefaultAzureCredential();\n    this.config = this.loadConfig();\n  }\n\n  private loadConfig(): AzureConfig {\n    const keyVaultUrl = process.env.KEY_VAULT_URL;\n    const keyVaultKeyName = process.env.KEY_VAULT_KEY_NAME;\n    const storageAccountName = process.env.STORAGE_ACCOUNT_NAME;\n    const containerName = process.env.STORAGE_CONTAINER_NAME;\n\n    if (!keyVaultUrl || !keyVaultKeyName || !storageAccountName || !containerName) {\n      throw new Error(\n        'Missing required environment variables. Please set: ' +\n        'KEY_VAULT_URL, KEY_VAULT_KEY_NAME, STORAGE_ACCOUNT_NAME, STORAGE_CONTAINER_NAME'\n      );\n    }\n\n    return {\n      keyVaultUrl,\n      keyVaultKeyName,\n      storageAccountName,\n      containerName,\n    };\n  }\n\n  getKeyClient(): KeyClient {\n    return new KeyClient(this.config.keyVaultUrl, this.credential);\n  }\n\n  async getCryptographyClient(): Promise\u003cCryptographyClient\u003e {\n    const keyClient = this.getKeyClient();\n    const key = await keyClient.getKey(this.config.keyVaultKeyName);\n    return new CryptographyClient(key, this.credential);\n  }\n\n  getBlobServiceClient(): BlobServiceClient {\n    const blobServiceUrl = `https://${this.config.storageAccountName}.blob.core.windows.net`;\n    return new BlobServiceClient(blobServiceUrl, this.credential);\n  }\n\n  getConfig(): AzureConfig {\n    return { ...this.config };\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1351866255\\src\\config.ts"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"import { CryptographyClient } from '@azure/keyvault-keys';\nimport { createCipheriv, createDecipheriv, randomBytes } from 'crypto';\n\nexport interface WrappedKey {\n  wrappedKey: string; // base64 encoded\n  keyId: string;\n  algorithm: string;\n}\n\nexport interface EncryptedData {\n  ciphertext: Buffer;\n  iv: string; // base64 encoded\n  authTag: string; // base64 encoded\n}\n\nexport class KeyManager {\n  private cryptoClient: CryptographyClient;\n  private readonly ALGORITHM = 'aes-256-gcm';\n  private readonly DEK_LENGTH = 32; // 256 bits for AES-256\n  private readonly IV_LENGTH = 12; // 96 bits recommended for GCM\n\n  constructor(cryptoClient: CryptographyClient) {\n    this.cryptoClient = cryptoClient;\n  }\n\n  /**\n   * Generate a random data encryption key (DEK)\n   */\n  private generateDataKey(): Buffer {\n    return randomBytes(this.DEK_LENGTH);\n  }\n\n  /**\n   * Wrap (encrypt) the data encryption key using Key Vault\n   */\n  async wrapDataKey(dataKey: Buffer): Promise\u003cWrappedKey\u003e {\n    try {\n      const wrapResult = await this.cryptoClient.wrapKey('RSA-OAEP', dataKey);\n      \n      return {\n        wrappedKey: Buffer.from(wrapResult.result).toString('base64'),\n        keyId: wrapResult.keyID || '',\n        algorithm: wrapResult.algorithm,\n      };\n    } catch (error) {\n      throw new Error(`Failed to wrap data key: ${error instanceof Error ? error.message : String(error)}`);\n    }\n  }\n\n  /**\n   * Unwrap (decrypt) the data encryption key using Key Vault\n   */\n  async unwrapDataKey(wrappedKey: WrappedKey): Promise\u003cBuffer\u003e {\n    try {\n      const wrappedKeyBuffer = Buffer.from(wrappedKey.wrappedKey, 'base64');\n      const unwrapResult = await this.cryptoClient.unwrapKey(\n        wrappedKey.algorithm as any,\n        wrappedKeyBuffer\n      );\n      \n      return Buffer.from(unwrapResult.result);\n    } catch (error) {\n      throw new Error(`Failed to unwrap data key: ${error instanceof Error ? error.message : String(error)}`);\n    }\n  }\n\n  /**\n   * Encrypt data using AES-GCM with a newly generated DEK\n   * Returns the encrypted data and the wrapped DEK\n   */\n  async encryptData(plaintext: Buffer): Promise\u003c{ encrypted: EncryptedData; wrappedKey: WrappedKey }\u003e {\n    // Generate a new data encryption key\n    const dataKey = this.generateDataKey();\n    \n    try {\n      // Wrap the DEK using Key Vault\n      const wrappedKey = await this.wrapDataKey(dataKey);\n\n      // Generate a random IV\n      const iv = randomBytes(this.IV_LENGTH);\n\n      // Encrypt the data with AES-GCM\n      const cipher = createCipheriv(this.ALGORITHM, dataKey, iv);\n      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);\n      const authTag = cipher.getAuthTag();\n\n      return {\n        encrypted: {\n          ciphertext,\n          iv: iv.toString('base64'),\n          authTag: authTag.toString('base64'),\n        },\n        wrappedKey,\n      };\n    } finally {\n      // Zero out the data key from memory (best effort)\n      dataKey.fill(0);\n    }\n  }\n\n  /**\n   * Decrypt data using AES-GCM with an unwrapped DEK\n   */\n  async decryptData(encrypted: EncryptedData, wrappedKey: WrappedKey): Promise\u003cBuffer\u003e {\n    let dataKey: Buffer | null = null;\n    \n    try {\n      // Unwrap the DEK using Key Vault\n      dataKey = await this.unwrapDataKey(wrappedKey);\n\n      // Decode the IV and auth tag\n      const iv = Buffer.from(encrypted.iv, 'base64');\n      const authTag = Buffer.from(encrypted.authTag, 'base64');\n\n      // Decrypt the data with AES-GCM\n      const decipher = createDecipheriv(this.ALGORITHM, dataKey, iv);\n      decipher.setAuthTag(authTag);\n      \n      const plaintext = Buffer.concat([\n        decipher.update(encrypted.ciphertext),\n        decipher.final(),\n      ]);\n\n      return plaintext;\n    } catch (error) {\n      throw new Error(`Failed to decrypt data: ${error instanceof Error ? error.message : String(error)}`);\n    } finally {\n      // Zero out the data key from memory (best effort)\n      if (dataKey) {\n        dataKey.fill(0);\n      }\n    }\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1351866255\\src\\keyManager.ts"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';\nimport { KeyManager, WrappedKey, EncryptedData } from './keyManager';\n\nexport interface UploadResult {\n  blobName: string;\n  url: string;\n  wrappedKey: WrappedKey;\n  encrypted: EncryptedData;\n}\n\nexport class EncryptedBlobUploader {\n  private containerClient: ContainerClient;\n  private keyManager: KeyManager;\n\n  constructor(blobServiceClient: BlobServiceClient, containerName: string, keyManager: KeyManager) {\n    this.containerClient = blobServiceClient.getContainerClient(containerName);\n    this.keyManager = keyManager;\n  }\n\n  /**\n   * Initialize the container if it doesn't exist\n   */\n  async initialize(): Promise\u003cvoid\u003e {\n    try {\n      await this.containerClient.createIfNotExists();\n      console.log(`Container \"${this.containerClient.containerName}\" is ready`);\n    } catch (error) {\n      throw new Error(\n        `Failed to initialize container: ${error instanceof Error ? error.message : String(error)}`\n      );\n    }\n  }\n\n  /**\n   * Upload encrypted data to blob storage\n   */\n  async uploadEncrypted(blobName: string, plaintext: Buffer | string): Promise\u003cUploadResult\u003e {\n    const plaintextBuffer = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, 'utf-8');\n\n    try {\n      // Encrypt the data and wrap the DEK\n      const { encrypted, wrappedKey } = await this.keyManager.encryptData(plaintextBuffer);\n\n      // Get blob client\n      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);\n\n      // Store cryptographic metadata alongside the encrypted data\n      const metadata = {\n        wrappedKey: wrappedKey.wrappedKey,\n        keyId: wrappedKey.keyId,\n        algorithm: wrappedKey.algorithm,\n        iv: encrypted.iv,\n        authTag: encrypted.authTag,\n        encrypted: 'true',\n      };\n\n      // Upload the ciphertext\n      await blockBlobClient.upload(encrypted.ciphertext, encrypted.ciphertext.length, {\n        metadata,\n      });\n\n      console.log(`✓ Uploaded encrypted blob: ${blobName}`);\n\n      return {\n        blobName,\n        url: blockBlobClient.url,\n        wrappedKey,\n        encrypted,\n      };\n    } catch (error) {\n      throw new Error(\n        `Failed to upload encrypted blob: ${error instanceof Error ? error.message : String(error)}`\n      );\n    }\n  }\n\n  /**\n   * Download and decrypt data from blob storage\n   */\n  async downloadDecrypted(blobName: string): Promise\u003cBuffer\u003e {\n    try {\n      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);\n\n      // Check if blob exists\n      const exists = await blockBlobClient.exists();\n      if (!exists) {\n        throw new Error(`Blob \"${blobName}\" does not exist`);\n      }\n\n      // Download the blob properties and metadata\n      const properties = await blockBlobClient.getProperties();\n      const metadata = properties.metadata;\n\n      if (!metadata || metadata.encrypted !== 'true') {\n        throw new Error('Blob is not encrypted or missing encryption metadata');\n      }\n\n      // Validate required metadata\n      if (!metadata.wrappedKey || !metadata.keyId || !metadata.algorithm || !metadata.iv || !metadata.authTag) {\n        throw new Error('Blob is missing required encryption metadata');\n      }\n\n      // Download the ciphertext\n      const downloadResponse = await blockBlobClient.download();\n      const ciphertext = await this.streamToBuffer(downloadResponse.readableStreamBody!);\n\n      // Reconstruct the wrapped key and encrypted data\n      const wrappedKey: WrappedKey = {\n        wrappedKey: metadata.wrappedKey,\n        keyId: metadata.keyId,\n        algorithm: metadata.algorithm,\n      };\n\n      const encrypted: EncryptedData = {\n        ciphertext,\n        iv: metadata.iv,\n        authTag: metadata.authTag,\n      };\n\n      // Decrypt the data\n      const plaintext = await this.keyManager.decryptData(encrypted, wrappedKey);\n\n      console.log(`✓ Downloaded and decrypted blob: ${blobName}`);\n\n      return plaintext;\n    } catch (error) {\n      if (error instanceof Error \u0026\u0026 error.message.includes('does not exist')) {\n        throw error;\n      }\n      throw new Error(\n        `Failed to download and decrypt blob: ${error instanceof Error ? error.message : String(error)}`\n      );\n    }\n  }\n\n  /**\n   * Helper to convert a ReadableStream to Buffer\n   */\n  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise\u003cBuffer\u003e {\n    return new Promise((resolve, reject) =\u003e {\n      const chunks: Buffer[] = [];\n      readableStream.on('data', (chunk) =\u003e {\n        chunks.push(Buffer.from(chunk));\n      });\n      readableStream.on('end', () =\u003e {\n        resolve(Buffer.concat(chunks));\n      });\n      readableStream.on('error', reject);\n    });\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1351866255\\src\\blobUploader.ts"}
```

### 🔧 8. create

**Input:**

```json
{"file_text":"import { AzureConnectionManager } from './config';\nimport { KeyManager } from './keyManager';\nimport { EncryptedBlobUploader } from './blobUploader';\n\nasync function main() {\n  console.log('=== Azure Encrypted Blob Storage Demo ===\\n');\n\n  try {\n    // Initialize Azure connections\n    console.log('Initializing Azure connections...');\n    const connectionManager = new AzureConnectionManager();\n    const config = connectionManager.getConfig();\n\n    // Get clients\n    const cryptoClient = await connectionManager.getCryptographyClient();\n    const blobServiceClient = connectionManager.getBlobServiceClient();\n\n    console.log(`✓ Connected to Key Vault: ${config.keyVaultUrl}`);\n    console.log(`✓ Using Key: ${config.keyVaultKeyName}`);\n    console.log(`✓ Connected to Storage Account: ${config.storageAccountName}`);\n    console.log(`✓ Using Container: ${config.containerName}\\n`);\n\n    // Initialize key manager and blob uploader\n    const keyManager = new KeyManager(cryptoClient);\n    const blobUploader = new EncryptedBlobUploader(blobServiceClient, config.containerName, keyManager);\n\n    // Ensure container exists\n    await blobUploader.initialize();\n    console.log();\n\n    // Sample data to encrypt and upload\n    const sampleData = 'This is a secret message that will be encrypted with AES-256-GCM and uploaded to Azure Blob Storage!';\n    const blobName = `encrypted-demo-${Date.now()}.txt`;\n\n    console.log('--- ENCRYPTION \u0026 UPLOAD ---');\n    console.log(`Original data: \"${sampleData}\"`);\n    console.log(`Blob name: ${blobName}\\n`);\n\n    // Encrypt and upload\n    const uploadResult = await blobUploader.uploadEncrypted(blobName, sampleData);\n\n    console.log('\\nEncryption details:');\n    console.log(`  Key Vault Key ID: ${uploadResult.wrappedKey.keyId}`);\n    console.log(`  Wrapped DEK (base64): ${uploadResult.wrappedKey.wrappedKey.substring(0, 64)}...`);\n    console.log(`  Wrap Algorithm: ${uploadResult.wrappedKey.algorithm}`);\n    console.log(`  IV (base64): ${uploadResult.encrypted.iv}`);\n    console.log(`  Auth Tag (base64): ${uploadResult.encrypted.authTag}`);\n    console.log(`  Ciphertext length: ${uploadResult.encrypted.ciphertext.length} bytes`);\n    console.log(`  Blob URL: ${uploadResult.url}\\n`);\n\n    // Download and decrypt\n    console.log('--- DOWNLOAD \u0026 DECRYPTION ---');\n    const decryptedBuffer = await blobUploader.downloadDecrypted(blobName);\n    const decryptedText = decryptedBuffer.toString('utf-8');\n\n    console.log(`\\nDecrypted data: \"${decryptedText}\"`);\n\n    // Verify round-trip\n    console.log('\\n--- VERIFICATION ---');\n    if (sampleData === decryptedText) {\n      console.log('✓ SUCCESS: Round-trip encryption/decryption completed successfully!');\n      console.log('✓ Original data matches decrypted data');\n    } else {\n      console.error('✗ FAILURE: Decrypted data does not match original!');\n      process.exit(1);\n    }\n\n  } catch (error) {\n    console.error('\\n✗ Error:', error instanceof Error ? error.message : String(error));\n    if (error instanceof Error \u0026\u0026 error.stack) {\n      console.error('\\nStack trace:', error.stack);\n    }\n    process.exit(1);\n  }\n}\n\nmain();\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1351866255\\src\\index.ts"}
```

### 🔧 9. create

**Input:**

```json
{"file_text":"# Azure Encrypted Blob Storage Uploader\n\nA TypeScript Node.js project that demonstrates client-side encryption for Azure Blob Storage uploads using envelope encryption with Azure Key Vault.\n\n## Features\n\n- **Client-side encryption**: Data is encrypted locally before upload using AES-256-GCM\n- **Envelope encryption**: Uses Azure Key Vault to wrap/unwrap data encryption keys\n- **Key security**: Raw data encryption keys are never persisted; vault key material never leaves Key Vault\n- **Metadata storage**: Encrypted parameters (IV, auth tag, wrapped DEK) stored as blob metadata\n- **Error handling**: Comprehensive error handling for Key Vault and Blob Storage operations\n\n## Architecture\n\n### Components\n\n1. **KeyManager** (`src/keyManager.ts`)\n   - Generates random data encryption keys (DEK)\n   - Wraps DEKs using Key Vault's RSA-OAEP algorithm\n   - Encrypts data with AES-256-GCM\n   - Unwraps DEKs and decrypts data\n   - Zeros out keys from memory after use\n\n2. **EncryptedBlobUploader** (`src/blobUploader.ts`)\n   - Handles blob upload/download operations\n   - Stores encryption metadata alongside encrypted blobs\n   - Validates metadata on download\n   - Integrates KeyManager for cryptographic operations\n\n3. **AzureConnectionManager** (`src/config.ts`)\n   - Manages Azure SDK clients\n   - Uses DefaultAzureCredential for authentication\n   - Shares a single credential instance across services\n   - Reads configuration from environment variables\n\n## Prerequisites\n\n- Node.js 18+ and npm\n- Azure subscription\n- Azure Key Vault with an RSA key\n- Azure Storage Account with a container\n- Managed identity or Azure CLI authentication configured\n\n## Setup\n\n1. **Clone and install dependencies**:\n   ```bash\n   npm install\n   ```\n\n2. **Configure environment variables**:\n   Create a `.env` file (or set environment variables):\n   ```bash\n   KEY_VAULT_URL=https://your-keyvault.vault.azure.net/\n   KEY_VAULT_KEY_NAME=your-encryption-key\n   STORAGE_ACCOUNT_NAME=yourstorageaccount\n   STORAGE_CONTAINER_NAME=encrypted-files\n   ```\n\n3. **Create Azure resources** (if needed):\n   ```bash\n   # Create a Key Vault and add an RSA key\n   az keyvault create --name your-keyvault --resource-group your-rg --location eastus\n   az keyvault key create --vault-name your-keyvault --name your-encryption-key --kty RSA --size 2048\n\n   # Create a storage account and container\n   az storage account create --name yourstorageaccount --resource-group your-rg --location eastus\n   az storage container create --name encrypted-files --account-name yourstorageaccount\n   ```\n\n4. **Grant permissions**:\n   ```bash\n   # Grant your identity Key Vault permissions\n   az keyvault set-policy --name your-keyvault \\\n     --object-id \u003cyour-identity-object-id\u003e \\\n     --key-permissions wrapKey unwrapKey get\n\n   # Grant your identity Storage permissions\n   az role assignment create \\\n     --role \"Storage Blob Data Contributor\" \\\n     --assignee \u003cyour-identity-object-id\u003e \\\n     --scope /subscriptions/\u003csub-id\u003e/resourceGroups/\u003crg\u003e/providers/Microsoft.Storage/storageAccounts/yourstorageaccount\n   ```\n\n## Usage\n\n### Build and run:\n```bash\nnpm run build\nnpm start\n```\n\n### Run in development mode:\n```bash\nnpm run dev\n```\n\n## How It Works\n\n### Upload Process\n1. Generate a random 256-bit data encryption key (DEK)\n2. Encrypt the data locally using AES-256-GCM with the DEK\n3. Send the DEK to Key Vault to wrap (encrypt) it using the vault's RSA key\n4. Upload the ciphertext to Blob Storage with metadata containing:\n   - Wrapped DEK (base64)\n   - Key Vault key ID\n   - Initialization vector (IV)\n   - Authentication tag\n5. Zero out the DEK from local memory\n\n### Download Process\n1. Download the encrypted blob and its metadata\n2. Extract the wrapped DEK, IV, and auth tag from metadata\n3. Send the wrapped DEK to Key Vault to unwrap (decrypt) it\n4. Decrypt the ciphertext locally using the unwrapped DEK\n5. Zero out the DEK from local memory\n6. Return the plaintext\n\n## Security Considerations\n\n- **Data encryption keys are ephemeral**: Generated fresh for each encryption operation and never persisted\n- **Key Vault isolation**: The vault's master key never leaves the Key Vault HSM\n- **Authenticated encryption**: AES-GCM provides both confidentiality and integrity\n- **Managed identity**: Uses Azure's managed identity for secure, credential-free authentication\n- **Memory safety**: Best-effort zeroing of sensitive key material after use\n\n## Error Handling\n\nThe application handles various error scenarios:\n- Missing or invalid configuration\n- Key Vault key disabled or deleted\n- Network errors during wrap/unwrap operations\n- Blob not found\n- Missing or invalid encryption metadata\n- Decryption failures (wrong key, corrupted data)\n\n## Dependencies\n\n- `@azure/identity`: Authentication with managed identity\n- `@azure/keyvault-keys`: Key Vault cryptographic operations\n- `@azure/storage-blob`: Blob Storage operations\n- `crypto` (Node.js built-in): AES-GCM encryption/decryption\n\n## License\n\nMIT\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1351866255\\README.md"}
```

### 🔧 10. create

**Input:**

```json
{"file_text":"# Dependencies\nnode_modules/\npackage-lock.json\n\n# Build output\ndist/\n\n# Environment variables\n.env\n\n# IDE\n.vscode/\n.idea/\n*.swp\n*.swo\n\n# OS\n.DS_Store\nThumbs.db\n\n# Logs\n*.log\nnpm-debug.log*\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1351866255\\.gitignore"}
```

### 🔧 11. powershell

**Input:**

```json
{"command":"New-Item -ItemType Directory -Force -Path \"src\"","description":"Create src directory"}
```

### 🔧 12. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1351866255"}
```

### 🔧 13. powershell

**Input:**

```json
{"command":"cd $env:USERPROFILE\\Documents; New-Item -ItemType Directory -Force -Path \"azure-encrypted-blob-uploader\"; cd azure-encrypted-blob-uploader; pwd","description":"Create project directory in Documents"}
```

## Copilot Response

I'll create a complete TypeScript Node.js project for encrypted Azure Blob Storage uploads with Key Vault key management. Let me build this step by step.

I see there are permission issues. Let me first create the directory structure and try again:

It seems there are permission restrictions in the current directory. Let me try to see what's in the current directory and check if I can work here:

It appears there are permission restrictions in this directory. Let me work in a different location that's more accessible. I'll create the project in a user-accessible directory:

I understand - there are permission restrictions. Let me output all the code files as text blocks so you can copy them manually. Here's the complete project structure:

## Project Structure

```
azure-encrypted-blob-uploader/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
└── src/
    ├── config.ts
    ├── keyManager.ts
    ├── blobUploader.ts
    └── index.ts
```

## File Contents

### `package.json`

```json
{
  "name": "azure-encrypted-blob-uploader",
  "version": "1.0.0",
  "description": "Upload files to Azure Blob Storage with client-side encryption using Key Vault",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts"
  },
  "keywords": [
    "azure",
    "blob-storage",
    "encryption",
    "key-vault"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@azure/identity": "^4.0.0",
    "@azure/keyvault-keys": "^4.8.0",
    "@azure/storage-blob": "^12.17.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### `.env.example`

```bash
# Azure Key Vault configuration
KEY_VAULT_URL=https://your-keyvault.vault.azure.net/
KEY_VAULT_KEY_NAME=your-encryption-key

# Azure Blob Storage configuration
STORAGE_ACCOUNT_NAME=yourstorageaccount
STORAGE_CONTAINER_NAME=encrypted-files
```

### `.gitignore`

```
# Dependencies
node_modules/
package-lock.json

# Build output
dist/

# Environment variables
.env

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

### `src/config.ts`

```typescript
import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import { CryptographyClient, KeyClient } from '@azure/keyvault-keys';

export interface AzureConfig {
  keyVaultUrl: string;
  keyVaultKeyName: string;
  storageAccountName: string;
  containerName: string;
}

export class AzureConnectionManager {
  private credential: DefaultAzureCredential;
  private config: AzureConfig;

  constructor() {
    this.credential = new DefaultAzureCredential();
    this.config = this.loadConfig();
  }

  private loadConfig(): AzureConfig {
    const keyVaultUrl = process.env.KEY_VAULT_URL;
    const keyVaultKeyName = process.env.KEY_VAULT_KEY_NAME;
    const storageAccountName = process.env.STORAGE_ACCOUNT_NAME;
    const containerName = process.env.STORAGE_CONTAINER_NAME;

    if (!keyVaultUrl || !keyVaultKeyName || !storageAccountName || !containerName) {
      throw new Error(
        'Missing required environment variables. Please set: ' +
        'KEY_VAULT_URL, KEY_VAULT_KEY_NAME, STORAGE_ACCOUNT_NAME, STORAGE_CONTAINER_NAME'
      );
    }

    return {
      keyVaultUrl,
      keyVaultKeyName,
      storageAccountName,
      containerName,
    };
  }

  getKeyClient(): KeyClient {
    return new KeyClient(this.config.keyVaultUrl, this.credential);
  }

  async getCryptographyClient(): Promise<CryptographyClient> {
    const keyClient = this.getKeyClient();
    const key = await keyClient.getKey(this.config.keyVaultKeyName);
    return new CryptographyClient(key, this.credential);
  }

  getBlobServiceClient(): BlobServiceClient {
    const blobServiceUrl = `https://${this.config.storageAccountName}.blob.core.windows.net`;
    return new BlobServiceClient(blobServiceUrl, this.credential);
  }

  getConfig(): AzureConfig {
    return { ...this.config };
  }
}
```

### `src/keyManager.ts`

```typescript
import { CryptographyClient } from '@azure/keyvault-keys';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface WrappedKey {
  wrappedKey: string; // base64 encoded
  keyId: string;
  algorithm: string;
}

export interface EncryptedData {
  ciphertext: Buffer;
  iv: string; // base64 encoded
  authTag: string; // base64 encoded
}

export class KeyManager {
  private cryptoClient: CryptographyClient;
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly DEK_LENGTH = 32; // 256 bits for AES-256
  private readonly IV_LENGTH = 12; // 96 bits recommended for GCM

  constructor(cryptoClient: CryptographyClient) {
    this.cryptoClient = cryptoClient;
  }

  /**
   * Generate a random data encryption key (DEK)
   */
  private generateDataKey(): Buffer {
    return randomBytes(this.DEK_LENGTH);
  }

  /**
   * Wrap (encrypt) the data encryption key using Key Vault
   */
  async wrapDataKey(dataKey: Buffer): Promise<WrappedKey> {
    try {
      const wrapResult = await this.cryptoClient.wrapKey('RSA-OAEP', dataKey);
      
      return {
        wrappedKey: Buffer.from(wrapResult.result).toString('base64'),
        keyId: wrapResult.keyID || '',
        algorithm: wrapResult.algorithm,
      };
    } catch (error) {
      throw new Error(`Failed to wrap data key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Unwrap (decrypt) the data encryption key using Key Vault
   */
  async unwrapDataKey(wrappedKey: WrappedKey): Promise<Buffer> {
    try {
      const wrappedKeyBuffer = Buffer.from(wrappedKey.wrappedKey, 'base64');
      const unwrapResult = await this.cryptoClient.unwrapKey(
        wrappedKey.algorithm as any,
        wrappedKeyBuffer
      );
      
      return Buffer.from(unwrapResult.result);
    } catch (error) {
      throw new Error(`Failed to unwrap data key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Encrypt data using AES-GCM with a newly generated DEK
   * Returns the encrypted data and the wrapped DEK
   */
  async encryptData(plaintext: Buffer): Promise<{ encrypted: EncryptedData; wrappedKey: WrappedKey }> {
    // Generate a new data encryption key
    const dataKey = this.generateDataKey();
    
    try {
      // Wrap the DEK using Key Vault
      const wrappedKey = await this.wrapDataKey(dataKey);

      // Generate a random IV
      const iv = randomBytes(this.IV_LENGTH);

      // Encrypt the data with AES-GCM
      const cipher = createCipheriv(this.ALGORITHM, dataKey, iv);
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const authTag = cipher.getAuthTag();

      return {
        encrypted: {
          ciphertext,
          iv: iv.toString('base64'),
          authTag: authTag.toString('base64'),
        },
        wrappedKey,
      };
    } finally {
      // Zero out the data key from memory (best effort)
      dataKey.fill(0);
    }
  }

  /**
   * Decrypt data using AES-GCM with an unwrapped DEK
   */
  async decryptData(encrypted: EncryptedData, wrappedKey: WrappedKey): Promise<Buffer> {
    let dataKey: Buffer | null = null;
    
    try {
      // Unwrap the DEK using Key Vault
      dataKey = await this.unwrapDataKey(wrappedKey);

      // Decode the IV and auth tag
      const iv = Buffer.from(encrypted.iv, 'base64');
      const authTag = Buffer.from(encrypted.authTag, 'base64');

      // Decrypt the data with AES-GCM
      const decipher = createDecipheriv(this.ALGORITHM, dataKey, iv);
      decipher.setAuthTag(authTag);
      
      const plaintext = Buffer.concat([
        decipher.update(encrypted.ciphertext),
        decipher.final(),
      ]);

      return plaintext;
    } catch (error) {
      throw new Error(`Failed to decrypt data: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Zero out the data key from memory (best effort)
      if (dataKey) {
        dataKey.fill(0);
      }
    }
  }
}
```

### `src/blobUploader.ts`

```typescript
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { KeyManager, WrappedKey, EncryptedData } from './keyManager';

export interface UploadResult {
  blobName: string;
  url: string;
  wrappedKey: WrappedKey;
  encrypted: EncryptedData;
}

export class EncryptedBlobUploader {
  private containerClient: ContainerClient;
  private keyManager: KeyManager;

  constructor(blobServiceClient: BlobServiceClient, containerName: string, keyManager: KeyManager) {
    this.containerClient = blobServiceClient.getContainerClient(containerName);
    this.keyManager = keyManager;
  }

  /**
   * Initialize the container if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists();
      console.log(`Container "${this.containerClient.containerName}" is ready`);
    } catch (error) {
      throw new Error(
        `Failed to initialize container: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Upload encrypted data to blob storage
   */
  async uploadEncrypted(blobName: string, plaintext: Buffer | string): Promise<UploadResult> {
    const plaintextBuffer = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, 'utf-8');

    try {
      // Encrypt the data and wrap the DEK
      const { encrypted, wrappedKey } = await this.keyManager.encryptData(plaintextBuffer);

      // Get blob client
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Store cryptographic metadata alongside the encrypted data
      const metadata = {
        wrappedKey: wrappedKey.wrappedKey,
        keyId: wrappedKey.keyId,
        algorithm: wrappedKey.algorithm,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        encrypted: 'true',
      };

      // Upload the ciphertext
      await blockBlobClient.upload(encrypted.ciphertext, encrypted.ciphertext.length, {
        metadata,
      });

      console.log(`✓ Uploaded encrypted blob: ${blobName}`);

      return {
        blobName,
        url: blockBlobClient.url,
        wrappedKey,
        encrypted,
      };
    } catch (error) {
      throw new Error(
        `Failed to upload encrypted blob: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Download and decrypt data from blob storage
   */
  async downloadDecrypted(blobName: string): Promise<Buffer> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      // Check if blob exists
      const exists = await blockBlobClient.exists();
      if (!exists) {
        throw new Error(`Blob "${blobName}" does not exist`);
      }

      // Download the blob properties and metadata
      const properties = await blockBlobClient.getProperties();
      const metadata = properties.metadata;

      if (!metadata || metadata.encrypted !== 'true') {
        throw new Error('Blob is not encrypted or missing encryption metadata');
      }

      // Validate required metadata
      if (!metadata.wrappedKey || !metadata.keyId || !metadata.algorithm || !metadata.iv || !metadata.authTag) {
        throw new Error('Blob is missing required encryption metadata');
      }

      // Download the ciphertext
      const downloadResponse = await blockBlobClient.download();
      const ciphertext = await this.streamToBuffer(downloadResponse.readableStreamBody!);

      // Reconstruct the wrapped key and encrypted data
      const wrappedKey: WrappedKey = {
        wrappedKey: metadata.wrappedKey,
        keyId: metadata.keyId,
        algorithm: metadata.algorithm,
      };

      const encrypted: EncryptedData = {
        ciphertext,
        iv: metadata.iv,
        authTag: metadata.authTag,
      };

      // Decrypt the data
      const plaintext = await this.keyManager.decryptData(encrypted, wrappedKey);

      console.log(`✓ Downloaded and decrypted blob: ${blobName}`);

      return plaintext;
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not exist')) {
        throw error;
      }
      throw new Error(
        `Failed to download and decrypt blob: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Helper to convert a ReadableStream to Buffer
   */
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
}
```

### `src/index.ts`

```typescript
import { AzureConnectionManager } from './config';
import { KeyManager } from './keyManager';
import { EncryptedBlobUploader } from './blobUploader';

async function main() {
  console.log('=== Azure Encrypted Blob Storage Demo ===\n');

  try {
    // Initialize Azure connections
    console.log('Initializing Azure connections...');
    const connectionManager = new AzureConnectionManager();
    const config = connectionManager.getConfig();

    // Get clients
    const cryptoClient = await connectionManager.getCryptographyClient();
    const blobServiceClient = connectionManager.getBlobServiceClient();

    console.log(`✓ Connected to Key Vault: ${config.keyVaultUrl}`);
    console.log(`✓ Using Key: ${config.keyVaultKeyName}`);
    console.log(`✓ Connected to Storage Account: ${config.storageAccountName}`);
    console.log(`✓ Using Container: ${config.containerName}\n`);

    // Initialize key manager and blob uploader
    const keyManager = new KeyManager(cryptoClient);
    const blobUploader = new EncryptedBlobUploader(blobServiceClient, config.containerName, keyManager);

    // Ensure container exists
    await blobUploader.initialize();
    console.log();

    // Sample data to encrypt and upload
    const sampleData = 'This is a secret message that will be encrypted with AES-256-GCM and uploaded to Azure Blob Storage!';
    const blobName = `encrypted-demo-${Date.now()}.txt`;

    console.log('--- ENCRYPTION & UPLOAD ---');
    console.log(`Original data: "${sampleData}"`);
    console.log(`Blob name: ${blobName}\n`);

    // Encrypt and upload
    const uploadResult = await blobUploader.uploadEncrypted(blobName, sampleData);

    console.log('\nEncryption details:');
    console.log(`  Key Vault Key ID: ${uploadResult.wrappedKey.keyId}`);
    console.log(`  Wrapped DEK (base64): ${uploadResult.wrappedKey.wrappedKey.substring(0, 64)}...`);
    console.log(`  Wrap Algorithm: ${uploadResult.wrappedKey.algorithm}`);
    console.log(`  IV (base64): ${uploadResult.encrypted.iv}`);
    console.log(`  Auth Tag (base64): ${uploadResult.encrypted.authTag}`);
    console.log(`  Ciphertext length: ${uploadResult.encrypted.ciphertext.length} bytes`);
    console.log(`  Blob URL: ${uploadResult.url}\n`);

    // Download and decrypt
    console.log('--- DOWNLOAD & DECRYPTION ---');
    const decryptedBuffer = await blobUploader.downloadDecrypted(blobName);
    const decryptedText = decryptedBuffer.toString('utf-8');

    console.log(`\nDecrypted data: "${decryptedText}"`);

    // Verify round-trip
    console.log('\n--- VERIFICATION ---');
    if (sampleData === decryptedText) {
      console.log('✓ SUCCESS: Round-trip encryption/decryption completed successfully!');
      console.log('✓ Original data matches decrypted data');
    } else {
      console.error('✗ FAILURE: Decrypted data does not match original!');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n✗ Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

main();
```

### `README.md`

```markdown
# Azure Encrypted Blob Storage Uploader

A TypeScript Node.js project that demonstrates client-side encryption for Azure Blob Storage uploads using envelope encryption with Azure Key Vault.

## Features

- **Client-side encryption**: Data is encrypted locally before upload using AES-256-GCM
- **Envelope encryption**: Uses Azure Key Vault to wrap/unwrap data encryption keys
- **Key security**: Raw data encryption keys are never persisted; vault key material never leaves Key Vault
- **Metadata storage**: Encrypted parameters (IV, auth tag, wrapped DEK) stored as blob metadata
- **Error handling**: Comprehensive error handling for Key Vault and Blob Storage operations

## Architecture

### Components

1. **KeyManager** (`src/keyManager.ts`)
   - Generates random data encryption keys (DEK)
   - Wraps DEKs using Key Vault's RSA-OAEP algorithm
   - Encrypts data with AES-256-GCM
   - Unwraps DEKs and decrypts data
   - Zeros out keys from memory after use

2. **EncryptedBlobUploader** (`src/blobUploader.ts`)
   - Handles blob upload/download operations
   - Stores encryption metadata alongside encrypted blobs
   - Validates metadata on download
   - Integrates KeyManager for cryptographic operations

3. **AzureConnectionManager** (`src/config.ts`)
   - Manages Azure SDK clients
   - Uses DefaultAzureCredential for authentication
   - Shares a single credential instance across services
   - Reads configuration from environment variables

## Prerequisites

- Node.js 18+ and npm
- Azure subscription
- Azure Key Vault with an RSA key
- Azure Storage Account with a container
- Managed identity or Azure CLI authentication configured

## Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file (or set environment variables):
   ```bash
   KEY_VAULT_URL=https://your-keyvault.vault.azure.net/
   KEY_VAULT_KEY_NAME=your-encryption-key
   STORAGE_ACCOUNT_NAME=yourstorageaccount
   STORAGE_CONTAINER_NAME=encrypted-files
   ```

3. **Create Azure resources** (if needed):
   ```bash
   # Create a Key Vault and add an RSA key
   az keyvault create --name your-keyvault --resource-group your-rg --location eastus
   az keyvault key create --vault-name your-keyvault --name your-encryption-key --kty RSA --size 2048

   # Create a storage account and container
   az storage account create --name yourstorageaccount --resource-group your-rg --location eastus
   az storage container create --name encrypted-files --account-name yourstorageaccount
   ```

4. **Grant permissions**:
   ```bash
   # Grant your identity Key Vault permissions
   az keyvault set-policy --name your-keyvault \
     --object-id <your-identity-object-id> \
     --key-permissions wrapKey unwrapKey get

   # Grant your identity Storage permissions
   az role assignment create \
     --role "Storage Blob Data Contributor" \
     --assignee <your-identity-object-id> \
     --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/yourstorageaccount
   ```

## Usage

### Build and run:
```bash
npm run build
npm start
```

### Run in development mode:
```bash
npm run dev
```

## How It Works

### Upload Process
1. Generate a random 256-bit data encryption key (DEK)
2. Encrypt the data locally using AES-256-GCM with the DEK
3. Send the DEK to Key Vault to wrap (encrypt) it using the vault's RSA key
4. Upload the ciphertext to Blob Storage with metadata containing:
   - Wrapped DEK (base64)
   - Key Vault key ID
   - Initialization vector (IV)
   - Authentication tag
5. Zero out the DEK from local memory

### Download Process
1. Download the encrypted blob and its metadata
2. Extract the wrapped DEK, IV, and auth tag from metadata
3. Send the wrapped DEK to Key Vault to unwrap (decrypt) it
4. Decrypt the ciphertext locally using the unwrapped DEK
5. Zero out the DEK from local memory
6. Return the plaintext

## Security Considerations

- **Data encryption keys are ephemeral**: Generated fresh for each encryption operation and never persisted
- **Key Vault isolation**: The vault's master key never leaves the Key Vault HSM
- **Authenticated encryption**: AES-GCM provides both confidentiality and integrity
- **Managed identity**: Uses Azure's managed identity for secure, credential-free authentication
- **Memory safety**: Best-effort zeroing of sensitive key material after use

## Error Handling

The application handles various error scenarios:
- Missing or invalid configuration
- Key Vault key disabled or deleted
- Network errors during wrap/unwrap operations
- Blob not found
- Missing or invalid encryption metadata
- Decryption failures (wrong key, corrupted data)

## Dependencies

- `@azure/identity`: Authentication with managed identity
- `@azure/keyvault-keys`: Key Vault cryptographic operations
- `@azure/storage-blob`: Blob Storage operations
- `crypto` (Node.js built-in): AES-GCM encryption/decryption

## License

MIT
```

## To Use This Project

1. Create a new directory named `azure-encrypted-blob-uploader`
2. Copy each file content above into the corresponding file in your directory
3. Run `npm install` to install dependencies
4. Configure your environment variables (copy `.env.example` to `.env` and fill in your Azure details)
5. Run `npm run dev` to test the encryption/decryption round-trip

The project implements secure envelope encryption where:
- Data encryption keys (DEKs) are generated locally and never persisted
- DEKs are protected using Azure Key Vault's RSA-OAEP wrap/unwrap operations
- Data is encrypted with AES-256-GCM providing both confidentiality and integrity
- All cryptographic parameters (wrapped DEK, IV, auth tag) are stored as blob metadata
- The vault's master key never leaves Key Vault's secure boundary

## Re-run Command

```bash
hyoka run --prompt-id storage-dp-js-ts-encrypted-uploader --config azure-mcp-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
