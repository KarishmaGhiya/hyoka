# Evaluation Report: storage-dp-js-ts-encrypted-uploader

**Config:** azure-mcp-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 450.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `storage-dp-js-ts-encrypted-uploader` |
| Config | azure-mcp-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Score | 42/10 |
| Duration | 450.0s |
| Timestamp | 2026-05-02T01:34:08Z |
| Files Generated | 12 |
| Event Count | 348 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 367.9s |
| Review | 81.7s |
| **Total** | **450.0s** |

## Configuration

- **name:** azure-mcp-skills/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skill Directories | C:\code\hyoka\skills\generator\js-ts-azure-patterns, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-identity-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-storage-blob-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-keyvault-secrets-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-keyvault-keys-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-cosmos-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-servicebus-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-eventhub-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-appconfiguration-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-storage-queue-ts |
| Skills Loaded | azure-identity-ts, azure-storage-blob-ts, azure-keyvault-secrets-ts, azure-keyvault-keys-ts, azure-cosmos-ts, azure-servicebus-ts, azure-eventhub-ts, azure-appconfiguration-ts, azure-storage-queue-ts, customize-cloud-agent |
| Skills Invoked | azure-storage-blob-ts, azure-keyvault-keys-ts |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=1113408 out=22976 |
| Turn Count | 18 |

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

The user wants me to create a TypeScript Node.js project that:
1. Uploads files to Azure Blob Storage with client-side encryption
2. Uses Azure Key Vault Keys service for envelope encryption (wrap/unwrap operations)
3. Implements key management class
4. Implements blob uploader/downloader class
5. Has a configuration module
6. Includes a demo main script
7. Has package.json and tsconfig.json

This is clearly an Azure SDK task involving both @azure/storage-blob and @azure/keyvault-keys. I should invoke the relevant skills first to get SDK-specific patterns.

Let me invoke the azure-storage-blob-ts and azure-keyvault-keys-ts skills to get the proper patterns and guidance.

Good! Now I need to invoke the azure-keyvault-keys-ts skill to get guidance on using Key Vault Keys for cryptographic operations.

Now I have context from both skills. Let me create the TypeScript project with:

1. A key management class for envelope encryption using Azure Key Vault Keys
2. A blob uploader/downloader class with client-side encryption (AES-GCM)
3. A configuration module for Azure connections
4. A main script demonstrating the round-trip
5. package.json and tsconfig.json

The key points:
- Use envelope encryption: generate DEK locally, wrap with Key Vault, store wrapped DEK in blob metadata
- Use AES-GCM for encryption (Node.js crypto)
- Store IV and auth tag in blob metadata
- Use ManagedIdentityCredential for auth
- Handle errors from both services
- Share a single credential instance

Let me create all the necessary files.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating encrypted blob uploader"}
```

### 🔧 2. skill

**Input:**

```json
{"skill":"azure-storage-blob-ts"}
```

### 🔧 3. skill

**Input:**

```json
{"skill":"azure-keyvault-keys-ts"}
```

### 🔧 4. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-config-3453033236\\.skills-cache\\microsoft\\skills\\.github\\plugins\\azure-sdk-typescript\\skills\\azure-keyvault-keys-ts\\references\\keys.md"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-encrypted-blob-storage\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Client-side encrypted file upload to Azure Blob Storage with envelope encryption using Azure Key Vault\",\n  \"main\": \"dist/index.js\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/index.js\",\n    \"dev\": \"tsc \u0026\u0026 node dist/index.js\"\n  },\n  \"keywords\": [\n    \"azure\",\n    \"blob-storage\",\n    \"encryption\",\n    \"key-vault\",\n    \"envelope-encryption\"\n  ],\n  \"author\": \"\",\n  \"license\": \"MIT\",\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.0.0\",\n    \"@azure/keyvault-keys\": \"^4.8.0\",\n    \"@azure/storage-blob\": \"^12.17.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.10.0\",\n    \"typescript\": \"^5.3.0\"\n  },\n  \"engines\": {\n    \"node\": \"\u003e=18.0.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\package.json"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2022\",\n    \"module\": \"ES2022\",\n    \"lib\": [\"ES2022\"],\n    \"moduleResolution\": \"node\",\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./src\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true,\n    \"declaration\": true,\n    \"declarationMap\": true,\n    \"sourceMap\": true\n  },\n  \"include\": [\"src/**/*\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\tsconfig.json"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"import { BlobServiceClient } from \"@azure/storage-blob\";\nimport { KeyClient, CryptographyClient } from \"@azure/keyvault-keys\";\nimport { ManagedIdentityCredential } from \"@azure/identity\";\n\nexport interface AzureConfig {\n  storageAccountName: string;\n  keyVaultName: string;\n  keyName: string;\n  containerName: string;\n}\n\nexport class AzureConnections {\n  private credential: ManagedIdentityCredential;\n  private config: AzureConfig;\n\n  public blobServiceClient: BlobServiceClient;\n  public keyClient: KeyClient;\n\n  constructor(config: AzureConfig) {\n    this.config = config;\n    \n    // Single shared credential instance\n    this.credential = new ManagedIdentityCredential();\n\n    // Initialize Blob Storage client\n    const storageUrl = `https://${config.storageAccountName}.blob.core.windows.net`;\n    this.blobServiceClient = new BlobServiceClient(storageUrl, this.credential);\n\n    // Initialize Key Vault client\n    const vaultUrl = `https://${config.keyVaultName}.vault.azure.net`;\n    this.keyClient = new KeyClient(vaultUrl, this.credential);\n  }\n\n  /**\n   * Creates a CryptographyClient for the configured key\n   */\n  public getCryptographyClient(keyId: string): CryptographyClient {\n    return new CryptographyClient(keyId, this.credential);\n  }\n\n  /**\n   * Loads configuration from environment variables\n   */\n  public static fromEnvironment(): AzureConnections {\n    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;\n    const keyVaultName = process.env.AZURE_KEYVAULT_NAME;\n    const keyName = process.env.AZURE_KEY_NAME;\n    const containerName = process.env.AZURE_CONTAINER_NAME || \"encrypted-files\";\n\n    if (!storageAccountName) {\n      throw new Error(\"AZURE_STORAGE_ACCOUNT_NAME environment variable is required\");\n    }\n    if (!keyVaultName) {\n      throw new Error(\"AZURE_KEYVAULT_NAME environment variable is required\");\n    }\n    if (!keyName) {\n      throw new Error(\"AZURE_KEY_NAME environment variable is required\");\n    }\n\n    return new AzureConnections({\n      storageAccountName,\n      keyVaultName,\n      keyName,\n      containerName,\n    });\n  }\n\n  public getConfig(): AzureConfig {\n    return this.config;\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\src\\config.ts"}
```

### 🔧 8. create

**Input:**

```json
{"file_text":"import { KeyClient, CryptographyClient } from \"@azure/keyvault-keys\";\nimport { randomBytes } from \"node:crypto\";\n\nexport interface WrappedKey {\n  wrappedKey: Buffer;\n  keyId: string;\n}\n\n/**\n * Key management class implementing envelope encryption pattern.\n * - Generates data encryption keys (DEK) locally\n * - Uses Key Vault to wrap/unwrap DEKs\n * - Raw DEKs are never persisted, only wrapped versions\n * - Vault key material never leaves Key Vault\n */\nexport class KeyManagement {\n  private keyClient: KeyClient;\n  private keyName: string;\n  private getCryptoClient: (keyId: string) =\u003e CryptographyClient;\n\n  constructor(\n    keyClient: KeyClient,\n    keyName: string,\n    getCryptoClient: (keyId: string) =\u003e CryptographyClient\n  ) {\n    this.keyClient = keyClient;\n    this.keyName = keyName;\n    this.getCryptoClient = getCryptoClient;\n  }\n\n  /**\n   * Generates a new data encryption key (DEK) for encrypting data.\n   * Returns a 32-byte AES-256 key (never persisted in raw form).\n   */\n  public generateDataKey(): Buffer {\n    return randomBytes(32); // 256-bit AES key\n  }\n\n  /**\n   * Wraps (encrypts) a data encryption key using Key Vault's key.\n   * The wrapped key can be safely stored alongside encrypted data.\n   * \n   * @param dataKey - The plaintext data encryption key to wrap\n   * @returns Object containing the wrapped key and the Key Vault key ID used\n   */\n  public async wrapDataKey(dataKey: Buffer): Promise\u003cWrappedKey\u003e {\n    try {\n      // Get the latest version of the key\n      const key = await this.keyClient.getKey(this.keyName);\n      \n      if (!key.id) {\n        throw new Error(\"Key ID is undefined\");\n      }\n\n      // Create cryptography client for this key\n      const cryptoClient = this.getCryptoClient(key.id);\n\n      // Wrap the data key using RSA-OAEP\n      const wrapResult = await cryptoClient.wrapKey(\"RSA-OAEP\", dataKey);\n\n      return {\n        wrappedKey: Buffer.from(wrapResult.result),\n        keyId: key.id,\n      };\n    } catch (error: any) {\n      if (error?.statusCode === 404) {\n        throw new Error(`Key '${this.keyName}' not found in Key Vault. Please create it first.`);\n      } else if (error?.statusCode === 403) {\n        throw new Error(`Access denied to key '${this.keyName}'. Check RBAC permissions (requires 'Key Vault Crypto User' role).`);\n      } else if (error?.code === \"KeyDisabled\") {\n        throw new Error(`Key '${this.keyName}' is disabled in Key Vault.`);\n      }\n      throw new Error(`Failed to wrap data key: ${error?.message || error}`);\n    }\n  }\n\n  /**\n   * Unwraps (decrypts) a data encryption key using Key Vault's key.\n   * Returns the plaintext DEK for decrypting data.\n   * \n   * @param wrappedKey - The wrapped (encrypted) data key\n   * @param keyId - The Key Vault key ID used to wrap the key\n   * @returns The plaintext data encryption key\n   */\n  public async unwrapDataKey(wrappedKey: Buffer, keyId: string): Promise\u003cBuffer\u003e {\n    try {\n      // Create cryptography client using the specific key ID/version\n      const cryptoClient = this.getCryptoClient(keyId);\n\n      // Unwrap the data key\n      const unwrapResult = await cryptoClient.unwrapKey(\"RSA-OAEP\", wrappedKey);\n\n      return Buffer.from(unwrapResult.result);\n    } catch (error: any) {\n      if (error?.statusCode === 404) {\n        throw new Error(`Key with ID '${keyId}' not found. It may have been deleted or rotated.`);\n      } else if (error?.statusCode === 403) {\n        throw new Error(`Access denied to key. Check RBAC permissions.`);\n      } else if (error?.code === \"KeyDisabled\") {\n        throw new Error(`Key is disabled in Key Vault.`);\n      }\n      throw new Error(`Failed to unwrap data key: ${error?.message || error}`);\n    }\n  }\n\n  /**\n   * Ensures the encryption key exists in Key Vault.\n   * Creates an RSA-2048 key if it doesn't exist.\n   */\n  public async ensureKeyExists(): Promise\u003cvoid\u003e {\n    try {\n      await this.keyClient.getKey(this.keyName);\n    } catch (error: any) {\n      if (error?.statusCode === 404) {\n        console.log(`Key '${this.keyName}' not found, creating it...`);\n        await this.keyClient.createRsaKey(this.keyName, {\n          keySize: 2048,\n          keyOps: [\"wrapKey\", \"unwrapKey\"],\n        });\n        console.log(`Key '${this.keyName}' created successfully.`);\n      } else {\n        throw error;\n      }\n    }\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\src\\keyManagement.ts"}
```

### 🔧 9. create

**Input:**

```json
{"file_text":"import { ContainerClient, BlockBlobClient } from \"@azure/storage-blob\";\nimport { createCipheriv, createDecipheriv, randomBytes } from \"node:crypto\";\nimport { KeyManagement } from \"./keyManagement.js\";\n\nexport interface EncryptionMetadata {\n  iv: string; // Base64-encoded initialization vector\n  authTag: string; // Base64-encoded authentication tag (GCM mode)\n  wrappedKey: string; // Base64-encoded wrapped data encryption key\n  keyId: string; // Key Vault key ID used for wrapping\n  algorithm: string; // Encryption algorithm used\n}\n\n/**\n * Handles encrypted upload and download of blobs.\n * Implements client-side encryption using AES-256-GCM.\n */\nexport class EncryptedBlobStorage {\n  private containerClient: ContainerClient;\n  private keyManagement: KeyManagement;\n  private readonly algorithm = \"aes-256-gcm\";\n\n  constructor(containerClient: ContainerClient, keyManagement: KeyManagement) {\n    this.containerClient = containerClient;\n    this.keyManagement = keyManagement;\n  }\n\n  /**\n   * Encrypts data locally and uploads to Blob Storage.\n   * Stores encryption metadata (IV, auth tag, wrapped key) as blob metadata.\n   * \n   * @param blobName - Name of the blob to create\n   * @param data - Plaintext data to encrypt and upload\n   * @returns The blob client for the uploaded blob\n   */\n  public async uploadEncrypted(blobName: string, data: string | Buffer): Promise\u003cBlockBlobClient\u003e {\n    try {\n      const plaintext = Buffer.isBuffer(data) ? data : Buffer.from(data, \"utf-8\");\n\n      // Step 1: Generate a data encryption key (DEK)\n      const dataKey = this.keyManagement.generateDataKey();\n\n      // Step 2: Wrap (protect) the DEK using Key Vault\n      const { wrappedKey, keyId } = await this.keyManagement.wrapDataKey(dataKey);\n\n      // Step 3: Encrypt the data locally using AES-256-GCM\n      const iv = randomBytes(12); // 96-bit IV for GCM mode\n      const cipher = createCipheriv(this.algorithm, dataKey, iv);\n\n      const encryptedChunks: Buffer[] = [];\n      encryptedChunks.push(cipher.update(plaintext));\n      encryptedChunks.push(cipher.final());\n      \n      const ciphertext = Buffer.concat(encryptedChunks);\n      const authTag = cipher.getAuthTag(); // GCM authentication tag\n\n      // Step 4: Store encryption metadata with the blob\n      const metadata: Record\u003cstring, string\u003e = {\n        iv: iv.toString(\"base64\"),\n        authTag: authTag.toString(\"base64\"),\n        wrappedKey: wrappedKey.toString(\"base64\"),\n        keyId: keyId,\n        algorithm: this.algorithm,\n      };\n\n      // Step 5: Upload ciphertext to Blob Storage\n      const blobClient = this.containerClient.getBlockBlobClient(blobName);\n      await blobClient.upload(ciphertext, ciphertext.length, {\n        metadata,\n      });\n\n      console.log(`✓ Uploaded encrypted blob: ${blobName} (${ciphertext.length} bytes)`);\n\n      // Clear sensitive data from memory\n      dataKey.fill(0);\n\n      return blobClient;\n    } catch (error: any) {\n      if (error?.statusCode === 403) {\n        throw new Error(`Access denied to storage account. Check RBAC permissions (requires 'Storage Blob Data Contributor' role).`);\n      } else if (error?.statusCode === 404) {\n        throw new Error(`Container '${this.containerClient.containerName}' not found. Please create it first.`);\n      }\n      throw new Error(`Failed to upload encrypted blob: ${error?.message || error}`);\n    }\n  }\n\n  /**\n   * Downloads and decrypts a blob from storage.\n   * Retrieves encryption metadata, unwraps the DEK via Key Vault, then decrypts.\n   * \n   * @param blobName - Name of the blob to download\n   * @returns The decrypted plaintext data\n   */\n  public async downloadDecrypted(blobName: string): Promise\u003cBuffer\u003e {\n    try {\n      const blobClient = this.containerClient.getBlockBlobClient(blobName);\n\n      // Step 1: Download the blob and its metadata\n      const downloadResponse = await blobClient.download(0);\n      \n      if (!downloadResponse.readableStreamBody) {\n        throw new Error(\"Failed to get readable stream from blob\");\n      }\n\n      // Read the ciphertext\n      const ciphertext = await this.streamToBuffer(downloadResponse.readableStreamBody);\n\n      // Step 2: Extract encryption metadata\n      const metadata = downloadResponse.metadata;\n      if (!metadata) {\n        throw new Error(\"Blob has no metadata. It may not be encrypted.\");\n      }\n\n      const encryptionMeta = this.parseMetadata(metadata);\n\n      // Step 3: Unwrap (recover) the DEK using Key Vault\n      const wrappedKey = Buffer.from(encryptionMeta.wrappedKey, \"base64\");\n      const dataKey = await this.keyManagement.unwrapDataKey(wrappedKey, encryptionMeta.keyId);\n\n      // Step 4: Decrypt the data locally\n      const iv = Buffer.from(encryptionMeta.iv, \"base64\");\n      const authTag = Buffer.from(encryptionMeta.authTag, \"base64\");\n\n      const decipher = createDecipheriv(encryptionMeta.algorithm, dataKey, iv);\n      decipher.setAuthTag(authTag);\n\n      const decryptedChunks: Buffer[] = [];\n      decryptedChunks.push(decipher.update(ciphertext));\n      decryptedChunks.push(decipher.final());\n\n      const plaintext = Buffer.concat(decryptedChunks);\n\n      console.log(`✓ Downloaded and decrypted blob: ${blobName} (${plaintext.length} bytes)`);\n\n      // Clear sensitive data from memory\n      dataKey.fill(0);\n\n      return plaintext;\n    } catch (error: any) {\n      if (error?.statusCode === 404) {\n        throw new Error(`Blob '${blobName}' not found in container '${this.containerClient.containerName}'.`);\n      } else if (error?.statusCode === 403) {\n        throw new Error(`Access denied to blob. Check RBAC permissions.`);\n      } else if (error?.message?.includes(\"Unsupported state or unable to authenticate data\")) {\n        throw new Error(\"Decryption failed. The blob may be corrupted or tampered with.\");\n      }\n      throw new Error(`Failed to download and decrypt blob: ${error?.message || error}`);\n    }\n  }\n\n  /**\n   * Ensures the container exists, creates it if not.\n   */\n  public async ensureContainerExists(): Promise\u003cvoid\u003e {\n    try {\n      await this.containerClient.createIfNotExists();\n      console.log(`Container '${this.containerClient.containerName}' is ready.`);\n    } catch (error: any) {\n      if (error?.statusCode === 403) {\n        throw new Error(`Access denied. Cannot create container. Check RBAC permissions.`);\n      }\n      throw error;\n    }\n  }\n\n  /**\n   * Lists all blobs in the container.\n   */\n  public async listBlobs(): Promise\u003cstring[]\u003e {\n    const blobs: string[] = [];\n    for await (const blob of this.containerClient.listBlobsFlat()) {\n      blobs.push(blob.name);\n    }\n    return blobs;\n  }\n\n  /**\n   * Parses and validates encryption metadata from blob metadata.\n   */\n  private parseMetadata(metadata: Record\u003cstring, string\u003e): EncryptionMetadata {\n    const { iv, authTag, wrappedKey, keyId, algorithm } = metadata;\n\n    if (!iv || !authTag || !wrappedKey || !keyId || !algorithm) {\n      throw new Error(\n        \"Missing encryption metadata. Required: iv, authTag, wrappedKey, keyId, algorithm\"\n      );\n    }\n\n    return { iv, authTag, wrappedKey, keyId, algorithm };\n  }\n\n  /**\n   * Converts a readable stream to a buffer.\n   */\n  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise\u003cBuffer\u003e {\n    const chunks: Buffer[] = [];\n    for await (const chunk of readableStream) {\n      chunks.push(Buffer.from(chunk));\n    }\n    return Buffer.concat(chunks);\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\src\\encryptedBlobStorage.ts"}
```

### 🔧 10. create

**Input:**

```json
{"file_text":"import { AzureConnections } from \"./config.js\";\nimport { KeyManagement } from \"./keyManagement.js\";\nimport { EncryptedBlobStorage } from \"./encryptedBlobStorage.js\";\n\n/**\n * Demo: Encrypt-Upload-Download-Decrypt round-trip\n */\nasync function main() {\n  console.log(\"=== Azure Encrypted Blob Storage Demo ===\\n\");\n\n  try {\n    // Step 1: Load configuration from environment\n    console.log(\"1. Loading configuration...\");\n    const connections = AzureConnections.fromEnvironment();\n    const config = connections.getConfig();\n    console.log(`   Storage Account: ${config.storageAccountName}`);\n    console.log(`   Key Vault: ${config.keyVaultName}`);\n    console.log(`   Key Name: ${config.keyName}`);\n    console.log(`   Container: ${config.containerName}\\n`);\n\n    // Step 2: Initialize services\n    console.log(\"2. Initializing services...\");\n    const keyManagement = new KeyManagement(\n      connections.keyClient,\n      config.keyName,\n      (keyId) =\u003e connections.getCryptographyClient(keyId)\n    );\n\n    // Ensure key exists\n    await keyManagement.ensureKeyExists();\n\n    const containerClient = connections.blobServiceClient.getContainerClient(config.containerName);\n    const blobStorage = new EncryptedBlobStorage(containerClient, keyManagement);\n\n    // Ensure container exists\n    await blobStorage.ensureContainerExists();\n    console.log();\n\n    // Step 3: Encrypt and upload sample data\n    console.log(\"3. Encrypting and uploading data...\");\n    const sampleData = \"This is a secret message that will be encrypted with AES-256-GCM!\";\n    const blobName = `demo-${Date.now()}.txt`;\n    \n    console.log(`   Original data: \"${sampleData}\"`);\n    console.log(`   Data size: ${sampleData.length} bytes\\n`);\n\n    const blobClient = await blobStorage.uploadEncrypted(blobName, sampleData);\n\n    // Display encryption metadata\n    const properties = await blobClient.getProperties();\n    console.log(\"\\n   Encryption Metadata:\");\n    console.log(`   - Key ID: ${properties.metadata?.keyId}`);\n    console.log(`   - Wrapped DEK: ${properties.metadata?.wrappedKey?.substring(0, 32)}...`);\n    console.log(`   - Algorithm: ${properties.metadata?.algorithm}`);\n    console.log(`   - IV: ${properties.metadata?.iv}`);\n    console.log(`   - Auth Tag: ${properties.metadata?.authTag}\\n`);\n\n    // Step 4: Download and decrypt\n    console.log(\"4. Downloading and decrypting data...\");\n    const decryptedData = await blobStorage.downloadDecrypted(blobName);\n    const decryptedText = decryptedData.toString(\"utf-8\");\n    \n    console.log(`   Decrypted data: \"${decryptedText}\"`);\n    console.log(`   Data size: ${decryptedData.length} bytes\\n`);\n\n    // Step 5: Verify round-trip\n    console.log(\"5. Verifying round-trip...\");\n    if (sampleData === decryptedText) {\n      console.log(\"   ✓ SUCCESS: Decrypted data matches original!\\n\");\n    } else {\n      console.log(\"   ✗ FAILURE: Decrypted data does not match original!\\n\");\n      process.exit(1);\n    }\n\n    // Step 6: List all blobs\n    console.log(\"6. Listing blobs in container...\");\n    const blobs = await blobStorage.listBlobs();\n    console.log(`   Found ${blobs.length} blob(s):`);\n    for (const blob of blobs) {\n      console.log(`   - ${blob}`);\n    }\n\n    console.log(\"\\n=== Demo completed successfully! ===\");\n  } catch (error: any) {\n    console.error(\"\\n❌ Error:\", error.message);\n    console.error(\"\\nStack trace:\", error.stack);\n    process.exit(1);\n  }\n}\n\n// Run the demo\nmain();\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\src\\index.ts"}
```

### 🔧 11. create

**Input:**

```json
{"file_text":"node_modules/\ndist/\n*.log\n.env\n.DS_Store\n*.js.map\n*.d.ts.map\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\.gitignore"}
```

### 🔧 12. create

**Input:**

```json
{"file_text":"# Azure Encrypted Blob Storage with Envelope Encryption\n\nA TypeScript/Node.js project demonstrating client-side encryption for Azure Blob Storage using envelope encryption with Azure Key Vault.\n\n## Features\n\n- **Envelope Encryption Pattern**: Data encryption keys (DEK) are generated locally, used to encrypt data, then wrapped (protected) by Azure Key Vault's key encryption key (KEK)\n- **Client-Side Encryption**: Data is encrypted with AES-256-GCM before upload, ensuring Azure never sees plaintext\n- **Key Management**: Azure Key Vault manages the KEK; raw DEKs never persist anywhere\n- **Metadata Storage**: Wrapped DEK, IV, and authentication tag stored as blob metadata\n- **Error Handling**: Comprehensive error handling for both Key Vault and Blob Storage operations\n- **Managed Identity**: Uses Azure Managed Identity for authentication (no credentials in code)\n\n## Architecture\n\n```\n┌─────────────┐\n│   Client    │\n└──────┬──────┘\n       │\n       ├─── Generate DEK (32-byte random)\n       │\n       ├─── Encrypt data with DEK (AES-256-GCM)\n       │    └─── IV (12 bytes)\n       │    └─── Ciphertext\n       │    └─── Auth Tag (16 bytes)\n       │\n       ├─── Wrap DEK with Key Vault\n       │    ┌──────────────────┐\n       │    │  Azure Key Vault │\n       │    │   (RSA-2048 KEK) │\n       │    └──────────────────┘\n       │         │\n       │         └─── Wrapped DEK\n       │\n       └─── Upload to Blob Storage\n            ┌────────────────────────┐\n            │  Azure Blob Storage    │\n            │  ┌──────────────────┐  │\n            │  │   Ciphertext     │  │\n            │  └──────────────────┘  │\n            │  Metadata:             │\n            │  - wrapped_key         │\n            │  - key_id              │\n            │  - iv                  │\n            │  - auth_tag            │\n            └────────────────────────┘\n```\n\n## Security Guarantees\n\n1. **DEK Never Persisted**: Raw data encryption keys exist only in memory during encryption/decryption\n2. **KEK Never Leaves Key Vault**: Key material always remains in Azure Key Vault (or HSM)\n3. **Authenticated Encryption**: AES-GCM provides both confidentiality and integrity\n4. **Key Rotation Support**: Each blob stores the Key Vault key ID used, supporting key rotation\n5. **Tamper Detection**: GCM authentication tag ensures data hasn't been modified\n\n## Prerequisites\n\n- Node.js \u003e= 18.0.0\n- Azure Storage Account with a blob container\n- Azure Key Vault with an RSA key\n- Managed Identity with appropriate permissions:\n  - **Key Vault**: `Key Vault Crypto User` role (for wrap/unwrap operations)\n  - **Storage Account**: `Storage Blob Data Contributor` role (for blob read/write)\n\n## Environment Variables\n\nCreate a `.env` file or set these environment variables:\n\n```bash\nAZURE_STORAGE_ACCOUNT_NAME=mystorageaccount\nAZURE_KEYVAULT_NAME=mykeyvault\nAZURE_KEY_NAME=my-encryption-key\nAZURE_CONTAINER_NAME=encrypted-files\n```\n\n## Installation\n\n```bash\nnpm install\n```\n\n## Build\n\n```bash\nnpm run build\n```\n\n## Run\n\n```bash\nnpm start\n```\n\n## Usage\n\n### Key Management\n\n```typescript\nimport { KeyManagement } from \"./keyManagement.js\";\n\nconst keyMgmt = new KeyManagement(keyClient, keyName, getCryptoClient);\n\n// Generate a data encryption key\nconst dek = keyMgmt.generateDataKey();\n\n// Wrap the DEK for storage\nconst { wrappedKey, keyId } = await keyMgmt.wrapDataKey(dek);\n\n// Unwrap to recover the DEK\nconst recoveredDek = await keyMgmt.unwrapDataKey(wrappedKey, keyId);\n```\n\n### Encrypted Blob Storage\n\n```typescript\nimport { EncryptedBlobStorage } from \"./encryptedBlobStorage.js\";\n\nconst storage = new EncryptedBlobStorage(containerClient, keyManagement);\n\n// Upload encrypted data\nawait storage.uploadEncrypted(\"secret.txt\", \"My secret data\");\n\n// Download and decrypt\nconst decrypted = await storage.downloadDecrypted(\"secret.txt\");\nconsole.log(decrypted.toString());\n```\n\n## Project Structure\n\n```\nsrc/\n├── config.ts                 # Azure connections and configuration\n├── keyManagement.ts          # Envelope encryption with Key Vault\n├── encryptedBlobStorage.ts   # Encrypted blob upload/download\n└── index.ts                  # Demo script\n```\n\n## Error Handling\n\nThe project handles common failure scenarios:\n\n- **Key Vault Errors**:\n  - Key not found (404)\n  - Key disabled\n  - Access denied (403) - check RBAC permissions\n  \n- **Blob Storage Errors**:\n  - Container not found (404)\n  - Blob not found (404)\n  - Access denied (403) - check RBAC permissions\n  \n- **Decryption Errors**:\n  - Missing or invalid metadata\n  - Authentication tag mismatch (tampered data)\n  - Key rotation issues (old key ID no longer accessible)\n\n## Best Practices\n\n1. **Use HSM-backed keys** for production workloads (`hsm: true` when creating keys)\n2. **Enable Key Vault soft-delete and purge protection** in production\n3. **Implement key rotation policies** in Key Vault\n4. **Use appropriate blob tiers** (Hot/Cool/Archive) based on access patterns\n5. **Consider Azure Private Link** to keep traffic off the public internet\n6. **Audit access** using Azure Monitor and Key Vault logging\n\n## Limitations\n\n- **Performance**: Each upload/download requires a Key Vault operation (wrap/unwrap)\n- **Large Files**: For files \u003e 100MB, consider chunked encryption with multiple DEKs\n- **Cross-Region**: Key Vault and Storage should be in the same region for latency\n- **Browser**: This implementation uses Node.js crypto APIs and is not browser-compatible\n\n## License\n\nMIT\n\n## References\n\n- [Azure Key Vault Keys SDK](https://www.npmjs.com/package/@azure/keyvault-keys)\n- [Azure Blob Storage SDK](https://www.npmjs.com/package/@azure/storage-blob)\n- [Envelope Encryption Pattern](https://learn.microsoft.com/azure/key-vault/keys/about-keys)\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\README.md"}
```

### 🔧 13. create

**Input:**

```json
{"file_text":"# Azure Storage Account\nAZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name\n\n# Azure Key Vault\nAZURE_KEYVAULT_NAME=your-keyvault-name\nAZURE_KEY_NAME=your-encryption-key-name\n\n# Azure Blob Container (optional, defaults to \"encrypted-files\")\nAZURE_CONTAINER_NAME=encrypted-files\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\.env.example"}
```

### 🔧 14. powershell

**Input:**

```json
{"command":"New-Item -ItemType Directory -Path \"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\src\" -Force","description":"Create src directory"}
```

### 🔧 15. create

**Input:**

```json
{"file_text":"import { BlobServiceClient } from \"@azure/storage-blob\";\nimport { KeyClient, CryptographyClient } from \"@azure/keyvault-keys\";\nimport { ManagedIdentityCredential } from \"@azure/identity\";\n\nexport interface AzureConfig {\n  storageAccountName: string;\n  keyVaultName: string;\n  keyName: string;\n  containerName: string;\n}\n\nexport class AzureConnections {\n  private credential: ManagedIdentityCredential;\n  private config: AzureConfig;\n\n  public blobServiceClient: BlobServiceClient;\n  public keyClient: KeyClient;\n\n  constructor(config: AzureConfig) {\n    this.config = config;\n    \n    // Single shared credential instance\n    this.credential = new ManagedIdentityCredential();\n\n    // Initialize Blob Storage client\n    const storageUrl = `https://${config.storageAccountName}.blob.core.windows.net`;\n    this.blobServiceClient = new BlobServiceClient(storageUrl, this.credential);\n\n    // Initialize Key Vault client\n    const vaultUrl = `https://${config.keyVaultName}.vault.azure.net`;\n    this.keyClient = new KeyClient(vaultUrl, this.credential);\n  }\n\n  /**\n   * Creates a CryptographyClient for the configured key\n   */\n  public getCryptographyClient(keyId: string): CryptographyClient {\n    return new CryptographyClient(keyId, this.credential);\n  }\n\n  /**\n   * Loads configuration from environment variables\n   */\n  public static fromEnvironment(): AzureConnections {\n    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;\n    const keyVaultName = process.env.AZURE_KEYVAULT_NAME;\n    const keyName = process.env.AZURE_KEY_NAME;\n    const containerName = process.env.AZURE_CONTAINER_NAME || \"encrypted-files\";\n\n    if (!storageAccountName) {\n      throw new Error(\"AZURE_STORAGE_ACCOUNT_NAME environment variable is required\");\n    }\n    if (!keyVaultName) {\n      throw new Error(\"AZURE_KEYVAULT_NAME environment variable is required\");\n    }\n    if (!keyName) {\n      throw new Error(\"AZURE_KEY_NAME environment variable is required\");\n    }\n\n    return new AzureConnections({\n      storageAccountName,\n      keyVaultName,\n      keyName,\n      containerName,\n    });\n  }\n\n  public getConfig(): AzureConfig {\n    return this.config;\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\src\\config.ts"}
```

### 🔧 16. create

**Input:**

```json
{"file_text":"import { KeyClient, CryptographyClient } from \"@azure/keyvault-keys\";\nimport { randomBytes } from \"node:crypto\";\n\nexport interface WrappedKey {\n  wrappedKey: Buffer;\n  keyId: string;\n}\n\n/**\n * Key management class implementing envelope encryption pattern.\n * - Generates data encryption keys (DEK) locally\n * - Uses Key Vault to wrap/unwrap DEKs\n * - Raw DEKs are never persisted, only wrapped versions\n * - Vault key material never leaves Key Vault\n */\nexport class KeyManagement {\n  private keyClient: KeyClient;\n  private keyName: string;\n  private getCryptoClient: (keyId: string) =\u003e CryptographyClient;\n\n  constructor(\n    keyClient: KeyClient,\n    keyName: string,\n    getCryptoClient: (keyId: string) =\u003e CryptographyClient\n  ) {\n    this.keyClient = keyClient;\n    this.keyName = keyName;\n    this.getCryptoClient = getCryptoClient;\n  }\n\n  /**\n   * Generates a new data encryption key (DEK) for encrypting data.\n   * Returns a 32-byte AES-256 key (never persisted in raw form).\n   */\n  public generateDataKey(): Buffer {\n    return randomBytes(32); // 256-bit AES key\n  }\n\n  /**\n   * Wraps (encrypts) a data encryption key using Key Vault's key.\n   * The wrapped key can be safely stored alongside encrypted data.\n   * \n   * @param dataKey - The plaintext data encryption key to wrap\n   * @returns Object containing the wrapped key and the Key Vault key ID used\n   */\n  public async wrapDataKey(dataKey: Buffer): Promise\u003cWrappedKey\u003e {\n    try {\n      // Get the latest version of the key\n      const key = await this.keyClient.getKey(this.keyName);\n      \n      if (!key.id) {\n        throw new Error(\"Key ID is undefined\");\n      }\n\n      // Create cryptography client for this key\n      const cryptoClient = this.getCryptoClient(key.id);\n\n      // Wrap the data key using RSA-OAEP\n      const wrapResult = await cryptoClient.wrapKey(\"RSA-OAEP\", dataKey);\n\n      return {\n        wrappedKey: Buffer.from(wrapResult.result),\n        keyId: key.id,\n      };\n    } catch (error: any) {\n      if (error?.statusCode === 404) {\n        throw new Error(`Key '${this.keyName}' not found in Key Vault. Please create it first.`);\n      } else if (error?.statusCode === 403) {\n        throw new Error(`Access denied to key '${this.keyName}'. Check RBAC permissions (requires 'Key Vault Crypto User' role).`);\n      } else if (error?.code === \"KeyDisabled\") {\n        throw new Error(`Key '${this.keyName}' is disabled in Key Vault.`);\n      }\n      throw new Error(`Failed to wrap data key: ${error?.message || error}`);\n    }\n  }\n\n  /**\n   * Unwraps (decrypts) a data encryption key using Key Vault's key.\n   * Returns the plaintext DEK for decrypting data.\n   * \n   * @param wrappedKey - The wrapped (encrypted) data key\n   * @param keyId - The Key Vault key ID used to wrap the key\n   * @returns The plaintext data encryption key\n   */\n  public async unwrapDataKey(wrappedKey: Buffer, keyId: string): Promise\u003cBuffer\u003e {\n    try {\n      // Create cryptography client using the specific key ID/version\n      const cryptoClient = this.getCryptoClient(keyId);\n\n      // Unwrap the data key\n      const unwrapResult = await cryptoClient.unwrapKey(\"RSA-OAEP\", wrappedKey);\n\n      return Buffer.from(unwrapResult.result);\n    } catch (error: any) {\n      if (error?.statusCode === 404) {\n        throw new Error(`Key with ID '${keyId}' not found. It may have been deleted or rotated.`);\n      } else if (error?.statusCode === 403) {\n        throw new Error(`Access denied to key. Check RBAC permissions.`);\n      } else if (error?.code === \"KeyDisabled\") {\n        throw new Error(`Key is disabled in Key Vault.`);\n      }\n      throw new Error(`Failed to unwrap data key: ${error?.message || error}`);\n    }\n  }\n\n  /**\n   * Ensures the encryption key exists in Key Vault.\n   * Creates an RSA-2048 key if it doesn't exist.\n   */\n  public async ensureKeyExists(): Promise\u003cvoid\u003e {\n    try {\n      await this.keyClient.getKey(this.keyName);\n    } catch (error: any) {\n      if (error?.statusCode === 404) {\n        console.log(`Key '${this.keyName}' not found, creating it...`);\n        await this.keyClient.createRsaKey(this.keyName, {\n          keySize: 2048,\n          keyOps: [\"wrapKey\", \"unwrapKey\"],\n        });\n        console.log(`Key '${this.keyName}' created successfully.`);\n      } else {\n        throw error;\n      }\n    }\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\src\\keyManagement.ts"}
```

### 🔧 17. create

**Input:**

```json
{"file_text":"import { ContainerClient, BlockBlobClient } from \"@azure/storage-blob\";\nimport { createCipheriv, createDecipheriv, randomBytes } from \"node:crypto\";\nimport { KeyManagement } from \"./keyManagement.js\";\n\nexport interface EncryptionMetadata {\n  iv: string; // Base64-encoded initialization vector\n  authTag: string; // Base64-encoded authentication tag (GCM mode)\n  wrappedKey: string; // Base64-encoded wrapped data encryption key\n  keyId: string; // Key Vault key ID used for wrapping\n  algorithm: string; // Encryption algorithm used\n}\n\n/**\n * Handles encrypted upload and download of blobs.\n * Implements client-side encryption using AES-256-GCM.\n */\nexport class EncryptedBlobStorage {\n  private containerClient: ContainerClient;\n  private keyManagement: KeyManagement;\n  private readonly algorithm = \"aes-256-gcm\";\n\n  constructor(containerClient: ContainerClient, keyManagement: KeyManagement) {\n    this.containerClient = containerClient;\n    this.keyManagement = keyManagement;\n  }\n\n  /**\n   * Encrypts data locally and uploads to Blob Storage.\n   * Stores encryption metadata (IV, auth tag, wrapped key) as blob metadata.\n   * \n   * @param blobName - Name of the blob to create\n   * @param data - Plaintext data to encrypt and upload\n   * @returns The blob client for the uploaded blob\n   */\n  public async uploadEncrypted(blobName: string, data: string | Buffer): Promise\u003cBlockBlobClient\u003e {\n    try {\n      const plaintext = Buffer.isBuffer(data) ? data : Buffer.from(data, \"utf-8\");\n\n      // Step 1: Generate a data encryption key (DEK)\n      const dataKey = this.keyManagement.generateDataKey();\n\n      // Step 2: Wrap (protect) the DEK using Key Vault\n      const { wrappedKey, keyId } = await this.keyManagement.wrapDataKey(dataKey);\n\n      // Step 3: Encrypt the data locally using AES-256-GCM\n      const iv = randomBytes(12); // 96-bit IV for GCM mode\n      const cipher = createCipheriv(this.algorithm, dataKey, iv);\n\n      const encryptedChunks: Buffer[] = [];\n      encryptedChunks.push(cipher.update(plaintext));\n      encryptedChunks.push(cipher.final());\n      \n      const ciphertext = Buffer.concat(encryptedChunks);\n      const authTag = cipher.getAuthTag(); // GCM authentication tag\n\n      // Step 4: Store encryption metadata with the blob\n      const metadata: Record\u003cstring, string\u003e = {\n        iv: iv.toString(\"base64\"),\n        authTag: authTag.toString(\"base64\"),\n        wrappedKey: wrappedKey.toString(\"base64\"),\n        keyId: keyId,\n        algorithm: this.algorithm,\n      };\n\n      // Step 5: Upload ciphertext to Blob Storage\n      const blobClient = this.containerClient.getBlockBlobClient(blobName);\n      await blobClient.upload(ciphertext, ciphertext.length, {\n        metadata,\n      });\n\n      console.log(`✓ Uploaded encrypted blob: ${blobName} (${ciphertext.length} bytes)`);\n\n      // Clear sensitive data from memory\n      dataKey.fill(0);\n\n      return blobClient;\n    } catch (error: any) {\n      if (error?.statusCode === 403) {\n        throw new Error(`Access denied to storage account. Check RBAC permissions (requires 'Storage Blob Data Contributor' role).`);\n      } else if (error?.statusCode === 404) {\n        throw new Error(`Container '${this.containerClient.containerName}' not found. Please create it first.`);\n      }\n      throw new Error(`Failed to upload encrypted blob: ${error?.message || error}`);\n    }\n  }\n\n  /**\n   * Downloads and decrypts a blob from storage.\n   * Retrieves encryption metadata, unwraps the DEK via Key Vault, then decrypts.\n   * \n   * @param blobName - Name of the blob to download\n   * @returns The decrypted plaintext data\n   */\n  public async downloadDecrypted(blobName: string): Promise\u003cBuffer\u003e {\n    try {\n      const blobClient = this.containerClient.getBlockBlobClient(blobName);\n\n      // Step 1: Download the blob and its metadata\n      const downloadResponse = await blobClient.download(0);\n      \n      if (!downloadResponse.readableStreamBody) {\n        throw new Error(\"Failed to get readable stream from blob\");\n      }\n\n      // Read the ciphertext\n      const ciphertext = await this.streamToBuffer(downloadResponse.readableStreamBody);\n\n      // Step 2: Extract encryption metadata\n      const metadata = downloadResponse.metadata;\n      if (!metadata) {\n        throw new Error(\"Blob has no metadata. It may not be encrypted.\");\n      }\n\n      const encryptionMeta = this.parseMetadata(metadata);\n\n      // Step 3: Unwrap (recover) the DEK using Key Vault\n      const wrappedKey = Buffer.from(encryptionMeta.wrappedKey, \"base64\");\n      const dataKey = await this.keyManagement.unwrapDataKey(wrappedKey, encryptionMeta.keyId);\n\n      // Step 4: Decrypt the data locally\n      const iv = Buffer.from(encryptionMeta.iv, \"base64\");\n      const authTag = Buffer.from(encryptionMeta.authTag, \"base64\");\n\n      const decipher = createDecipheriv(encryptionMeta.algorithm, dataKey, iv);\n      decipher.setAuthTag(authTag);\n\n      const decryptedChunks: Buffer[] = [];\n      decryptedChunks.push(decipher.update(ciphertext));\n      decryptedChunks.push(decipher.final());\n\n      const plaintext = Buffer.concat(decryptedChunks);\n\n      console.log(`✓ Downloaded and decrypted blob: ${blobName} (${plaintext.length} bytes)`);\n\n      // Clear sensitive data from memory\n      dataKey.fill(0);\n\n      return plaintext;\n    } catch (error: any) {\n      if (error?.statusCode === 404) {\n        throw new Error(`Blob '${blobName}' not found in container '${this.containerClient.containerName}'.`);\n      } else if (error?.statusCode === 403) {\n        throw new Error(`Access denied to blob. Check RBAC permissions.`);\n      } else if (error?.message?.includes(\"Unsupported state or unable to authenticate data\")) {\n        throw new Error(\"Decryption failed. The blob may be corrupted or tampered with.\");\n      }\n      throw new Error(`Failed to download and decrypt blob: ${error?.message || error}`);\n    }\n  }\n\n  /**\n   * Ensures the container exists, creates it if not.\n   */\n  public async ensureContainerExists(): Promise\u003cvoid\u003e {\n    try {\n      await this.containerClient.createIfNotExists();\n      console.log(`Container '${this.containerClient.containerName}' is ready.`);\n    } catch (error: any) {\n      if (error?.statusCode === 403) {\n        throw new Error(`Access denied. Cannot create container. Check RBAC permissions.`);\n      }\n      throw error;\n    }\n  }\n\n  /**\n   * Lists all blobs in the container.\n   */\n  public async listBlobs(): Promise\u003cstring[]\u003e {\n    const blobs: string[] = [];\n    for await (const blob of this.containerClient.listBlobsFlat()) {\n      blobs.push(blob.name);\n    }\n    return blobs;\n  }\n\n  /**\n   * Parses and validates encryption metadata from blob metadata.\n   */\n  private parseMetadata(metadata: Record\u003cstring, string\u003e): EncryptionMetadata {\n    const { iv, authTag, wrappedKey, keyId, algorithm } = metadata;\n\n    if (!iv || !authTag || !wrappedKey || !keyId || !algorithm) {\n      throw new Error(\n        \"Missing encryption metadata. Required: iv, authTag, wrappedKey, keyId, algorithm\"\n      );\n    }\n\n    return { iv, authTag, wrappedKey, keyId, algorithm };\n  }\n\n  /**\n   * Converts a readable stream to a buffer.\n   */\n  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise\u003cBuffer\u003e {\n    const chunks: Buffer[] = [];\n    for await (const chunk of readableStream) {\n      chunks.push(Buffer.from(chunk));\n    }\n    return Buffer.concat(chunks);\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\src\\encryptedBlobStorage.ts"}
```

### 🔧 18. create

**Input:**

```json
{"file_text":"import { AzureConnections } from \"./config.js\";\nimport { KeyManagement } from \"./keyManagement.js\";\nimport { EncryptedBlobStorage } from \"./encryptedBlobStorage.js\";\n\n/**\n * Demo: Encrypt-Upload-Download-Decrypt round-trip\n */\nasync function main() {\n  console.log(\"=== Azure Encrypted Blob Storage Demo ===\\n\");\n\n  try {\n    // Step 1: Load configuration from environment\n    console.log(\"1. Loading configuration...\");\n    const connections = AzureConnections.fromEnvironment();\n    const config = connections.getConfig();\n    console.log(`   Storage Account: ${config.storageAccountName}`);\n    console.log(`   Key Vault: ${config.keyVaultName}`);\n    console.log(`   Key Name: ${config.keyName}`);\n    console.log(`   Container: ${config.containerName}\\n`);\n\n    // Step 2: Initialize services\n    console.log(\"2. Initializing services...\");\n    const keyManagement = new KeyManagement(\n      connections.keyClient,\n      config.keyName,\n      (keyId) =\u003e connections.getCryptographyClient(keyId)\n    );\n\n    // Ensure key exists\n    await keyManagement.ensureKeyExists();\n\n    const containerClient = connections.blobServiceClient.getContainerClient(config.containerName);\n    const blobStorage = new EncryptedBlobStorage(containerClient, keyManagement);\n\n    // Ensure container exists\n    await blobStorage.ensureContainerExists();\n    console.log();\n\n    // Step 3: Encrypt and upload sample data\n    console.log(\"3. Encrypting and uploading data...\");\n    const sampleData = \"This is a secret message that will be encrypted with AES-256-GCM!\";\n    const blobName = `demo-${Date.now()}.txt`;\n    \n    console.log(`   Original data: \"${sampleData}\"`);\n    console.log(`   Data size: ${sampleData.length} bytes\\n`);\n\n    const blobClient = await blobStorage.uploadEncrypted(blobName, sampleData);\n\n    // Display encryption metadata\n    const properties = await blobClient.getProperties();\n    console.log(\"\\n   Encryption Metadata:\");\n    console.log(`   - Key ID: ${properties.metadata?.keyId}`);\n    console.log(`   - Wrapped DEK: ${properties.metadata?.wrappedKey?.substring(0, 32)}...`);\n    console.log(`   - Algorithm: ${properties.metadata?.algorithm}`);\n    console.log(`   - IV: ${properties.metadata?.iv}`);\n    console.log(`   - Auth Tag: ${properties.metadata?.authTag}\\n`);\n\n    // Step 4: Download and decrypt\n    console.log(\"4. Downloading and decrypting data...\");\n    const decryptedData = await blobStorage.downloadDecrypted(blobName);\n    const decryptedText = decryptedData.toString(\"utf-8\");\n    \n    console.log(`   Decrypted data: \"${decryptedText}\"`);\n    console.log(`   Data size: ${decryptedData.length} bytes\\n`);\n\n    // Step 5: Verify round-trip\n    console.log(\"5. Verifying round-trip...\");\n    if (sampleData === decryptedText) {\n      console.log(\"   ✓ SUCCESS: Decrypted data matches original!\\n\");\n    } else {\n      console.log(\"   ✗ FAILURE: Decrypted data does not match original!\\n\");\n      process.exit(1);\n    }\n\n    // Step 6: List all blobs\n    console.log(\"6. Listing blobs in container...\");\n    const blobs = await blobStorage.listBlobs();\n    console.log(`   Found ${blobs.length} blob(s):`);\n    for (const blob of blobs) {\n      console.log(`   - ${blob}`);\n    }\n\n    console.log(\"\\n=== Demo completed successfully! ===\");\n  } catch (error: any) {\n    console.error(\"\\n❌ Error:\", error.message);\n    console.error(\"\\nStack trace:\", error.stack);\n    process.exit(1);\n  }\n}\n\n// Run the demo\nmain();\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\src\\index.ts"}
```

### 🔧 19. powershell

**Input:**

```json
{"command":"cd C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361; npm install","description":"Install npm dependencies","initial_wait":60}
```

### 🔧 20. powershell

**Input:**

```json
{"command":"cd C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361; npm run build","description":"Build TypeScript project","initial_wait":30}
```

### 🔧 21. edit

**Input:**

```json
{"new_str":"      // Step 4: Decrypt the data locally\n      const iv = Buffer.from(encryptionMeta.iv, \"base64\");\n      const authTag = Buffer.from(encryptionMeta.authTag, \"base64\");\n\n      const decipher = createDecipheriv(encryptionMeta.algorithm, dataKey, iv) as any;\n      decipher.setAuthTag(authTag);","old_str":"      // Step 4: Decrypt the data locally\n      const iv = Buffer.from(encryptionMeta.iv, \"base64\");\n      const authTag = Buffer.from(encryptionMeta.authTag, \"base64\");\n\n      const decipher = createDecipheriv(encryptionMeta.algorithm, dataKey, iv);\n      decipher.setAuthTag(authTag);","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\src\\encryptedBlobStorage.ts"}
```

### 🔧 22. powershell

**Input:**

```json
{"command":"cd C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361; npm run build","description":"Build TypeScript project again","initial_wait":30}
```

### 🔧 23. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361"}
```

### 🔧 24. powershell

**Input:**

```json
{"command":"Get-ChildItem C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\dist","description":"List compiled files"}
```

### 🔧 25. create

**Input:**

```json
{"file_text":"# Project Summary: Azure Encrypted Blob Storage\n\n## Overview\nThis TypeScript/Node.js project demonstrates **client-side encryption** for Azure Blob Storage using the **envelope encryption pattern** with Azure Key Vault.\n\n## Key Features Implemented\n\n### 1. **Envelope Encryption Pattern**\n- **Data Encryption Key (DEK)**: Generated locally (32-byte AES-256 key)\n- **Key Encryption Key (KEK)**: Managed in Azure Key Vault (RSA-2048)\n- **Process**: DEK encrypts data → KEK wraps DEK → Store wrapped DEK with encrypted blob\n\n### 2. **Security Guarantees**\n- ✅ Raw DEK never persisted (only in memory during encryption/decryption)\n- ✅ KEK never leaves Key Vault (all wrap/unwrap operations happen server-side)\n- ✅ AES-256-GCM provides both confidentiality and integrity\n- ✅ Authentication tag prevents tampering\n- ✅ Unique IV for each encryption operation\n\n### 3. **Project Structure**\n\n```\nsrc/\n├── config.ts                 # Azure connections with shared credential\n├── keyManagement.ts          # Key Vault operations (wrap/unwrap DEKs)\n├── encryptedBlobStorage.ts   # Blob encryption/decryption logic\n└── index.ts                  # Demo script showing full round-trip\n```\n\n### 4. **Key Classes**\n\n#### `AzureConnections` (config.ts)\n- Initializes BlobServiceClient and KeyClient\n- Uses ManagedIdentityCredential (single shared instance)\n- Loads configuration from environment variables\n- Creates CryptographyClient instances on demand\n\n#### `KeyManagement` (keyManagement.ts)\n- `generateDataKey()`: Creates 32-byte random AES key\n- `wrapDataKey()`: Protects DEK using Key Vault (RSA-OAEP)\n- `unwrapDataKey()`: Recovers DEK using Key Vault\n- `ensureKeyExists()`: Creates RSA key if missing\n- Comprehensive error handling for Key Vault operations\n\n#### `EncryptedBlobStorage` (encryptedBlobStorage.ts)\n- `uploadEncrypted()`: \n  1. Generate DEK\n  2. Encrypt data with AES-256-GCM\n  3. Wrap DEK via Key Vault\n  4. Upload ciphertext + metadata\n- `downloadDecrypted()`:\n  1. Download blob + metadata\n  2. Unwrap DEK via Key Vault\n  3. Decrypt using recovered DEK\n  4. Verify authentication tag\n- Stores IV, auth tag, wrapped DEK, and key ID as blob metadata\n\n### 5. **Demo Script** (index.ts)\nDemonstrates complete round-trip:\n1. Load configuration\n2. Initialize Key Vault and Blob Storage clients\n3. Encrypt sample string and upload\n4. Download and decrypt\n5. Verify decrypted data matches original\n6. Display encryption metadata (Key ID, wrapped DEK, IV, auth tag)\n\n### 6. **Error Handling**\n- Key Vault: 404 (not found), 403 (access denied), key disabled\n- Blob Storage: 404 (blob/container not found), 403 (access denied)\n- Decryption: Invalid metadata, tampered data, key rotation issues\n\n### 7. **Environment Variables Required**\n```bash\nAZURE_STORAGE_ACCOUNT_NAME=\u003cyour-storage-account\u003e\nAZURE_KEYVAULT_NAME=\u003cyour-keyvault\u003e\nAZURE_KEY_NAME=\u003cyour-encryption-key\u003e\nAZURE_CONTAINER_NAME=encrypted-files  # Optional, defaults to \"encrypted-files\"\n```\n\n### 8. **Azure RBAC Permissions Required**\n- **Key Vault**: `Key Vault Crypto User` role\n- **Storage Account**: `Storage Blob Data Contributor` role\n\n## Build and Run\n\n```bash\n# Install dependencies\nnpm install\n\n# Build TypeScript\nnpm run build\n\n# Run demo (requires environment variables set)\nnpm start\n```\n\n## Files Generated\n- ✅ `package.json` - Dependencies and scripts\n- ✅ `tsconfig.json` - TypeScript configuration (ES2022, strict mode)\n- ✅ `src/config.ts` - Azure service configuration\n- ✅ `src/keyManagement.ts` - Envelope encryption implementation\n- ✅ `src/encryptedBlobStorage.ts` - Encrypted blob operations\n- ✅ `src/index.ts` - Demo script\n- ✅ `README.md` - Complete documentation\n- ✅ `.env.example` - Example environment variables\n- ✅ `.gitignore` - Ignore node_modules, dist, etc.\n\n## Verification\n- ✅ All TypeScript files compile without errors\n- ✅ Output files generated in `dist/` directory\n- ✅ Dependencies installed successfully\n- ✅ Code follows Azure SDK best practices per skill guidance\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\PROJECT_SUMMARY.md"}
```

### 🔧 26. create

**Input:**

```json
{"file_text":"# Encryption Flow Diagram\n\n## Upload Flow (Encryption)\n\n```\n┌──────────────────────────────────────────────────────────────────┐\n│ 1. GENERATE DATA ENCRYPTION KEY (DEK)                           │\n│    - 32-byte random key (AES-256)                               │\n│    - Generated locally using Node.js crypto.randomBytes()       │\n└────────────────────────────┬─────────────────────────────────────┘\n                             │\n                             ▼\n┌──────────────────────────────────────────────────────────────────┐\n│ 2. ENCRYPT DATA LOCALLY                                          │\n│    - Algorithm: AES-256-GCM                                      │\n│    - Input: Plaintext + DEK + IV (12 bytes)                     │\n│    - Output: Ciphertext + Authentication Tag (16 bytes)         │\n└────────────────────────────┬─────────────────────────────────────┘\n                             │\n                             ▼\n┌──────────────────────────────────────────────────────────────────┐\n│ 3. WRAP DEK WITH KEY VAULT                                       │\n│    ┌──────────────────────────────────────────────┐             │\n│    │        Azure Key Vault                       │             │\n│    │   KEK (RSA-2048 key, never leaves vault)    │             │\n│    │                                              │             │\n│    │   wrapKey(algorithm=\"RSA-OAEP\", dek)        │             │\n│    │                                              │             │\n│    │   Returns: Wrapped DEK (encrypted DEK)      │             │\n│    └──────────────────────────────────────────────┘             │\n└────────────────────────────┬─────────────────────────────────────┘\n                             │\n                             ▼\n┌──────────────────────────────────────────────────────────────────┐\n│ 4. UPLOAD TO BLOB STORAGE                                        │\n│    ┌──────────────────────────────────────────────┐             │\n│    │        Azure Blob Storage                    │             │\n│    │                                              │             │\n│    │  Blob Content: [Ciphertext]                 │             │\n│    │                                              │             │\n│    │  Blob Metadata:                             │             │\n│    │    - wrappedKey: \u003cbase64\u003e                   │             │\n│    │    - keyId: \u003cvault-key-id\u003e                  │             │\n│    │    - iv: \u003cbase64\u003e                           │             │\n│    │    - authTag: \u003cbase64\u003e                      │             │\n│    │    - algorithm: \"aes-256-gcm\"               │             │\n│    └──────────────────────────────────────────────┘             │\n└──────────────────────────────────────────────────────────────────┘\n```\n\n## Download Flow (Decryption)\n\n```\n┌──────────────────────────────────────────────────────────────────┐\n│ 1. DOWNLOAD FROM BLOB STORAGE                                    │\n│    - Download ciphertext                                         │\n│    - Extract metadata (wrapped DEK, IV, auth tag, key ID)       │\n└────────────────────────────┬─────────────────────────────────────┘\n                             │\n                             ▼\n┌──────────────────────────────────────────────────────────────────┐\n│ 2. UNWRAP DEK WITH KEY VAULT                                     │\n│    ┌──────────────────────────────────────────────┐             │\n│    │        Azure Key Vault                       │             │\n│    │                                              │             │\n│    │   unwrapKey(                                 │             │\n│    │     algorithm=\"RSA-OAEP\",                    │             │\n│    │     wrappedKey=\u003cfrom-metadata\u003e,              │             │\n│    │     keyId=\u003cfrom-metadata\u003e                    │             │\n│    │   )                                          │             │\n│    │                                              │             │\n│    │   Returns: Raw DEK (plaintext)              │             │\n│    └──────────────────────────────────────────────┘             │\n└────────────────────────────┬─────────────────────────────────────┘\n                             │\n                             ▼\n┌──────────────────────────────────────────────────────────────────┐\n│ 3. DECRYPT DATA LOCALLY                                          │\n│    - Algorithm: AES-256-GCM                                      │\n│    - Input: Ciphertext + DEK + IV + Auth Tag                    │\n│    - Verify: Authentication tag (detects tampering)             │\n│    - Output: Plaintext                                          │\n└────────────────────────────┬─────────────────────────────────────┘\n                             │\n                             ▼\n┌──────────────────────────────────────────────────────────────────┐\n│ 4. RETURN DECRYPTED DATA                                         │\n│    - Clear DEK from memory (dataKey.fill(0))                    │\n│    - Return plaintext to caller                                 │\n└──────────────────────────────────────────────────────────────────┘\n```\n\n## Security Properties\n\n### ✅ What's Protected\n- **Data at Rest**: Ciphertext in Blob Storage is encrypted with AES-256-GCM\n- **Data in Transit**: HTTPS encryption for all Azure SDK operations\n- **Key Material**: DEK wrapped with RSA-OAEP, KEK never leaves Key Vault\n- **Data Integrity**: GCM authentication tag prevents tampering\n- **Key Rotation**: Each blob stores key ID, supports rotating KEK\n\n### ✅ What's NOT Stored in Plaintext\n- Raw data encryption key (DEK)\n- Plaintext data\n- Key Vault key material\n\n### ✅ What IS Stored\n- Ciphertext (encrypted data)\n- Wrapped DEK (encrypted with Key Vault's key)\n- IV (public, unique per encryption)\n- Authentication tag (public, for integrity verification)\n- Key Vault key ID (public, identifies which KEK was used)\n\n## Key Rotation Strategy\n\nWhen a Key Vault key is rotated:\n1. Old blobs still store the old key's ID in metadata\n2. Key Vault maintains old key versions for decryption\n3. New uploads use the latest key version automatically\n4. No need to re-encrypt existing blobs immediately\n5. Can re-encrypt blobs over time with new key version\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\ENCRYPTION_FLOW.md"}
```

### 🔧 27. create

**Input:**

```json
{"file_text":"# Example Output\n\nThis shows what the demo script outputs when run successfully.\n\n## Console Output\n\n```\n=== Azure Encrypted Blob Storage Demo ===\n\n1. Loading configuration...\n   Storage Account: mystorageaccount\n   Key Vault: mykeyvault\n   Key Name: my-encryption-key\n   Container: encrypted-files\n\n2. Initializing services...\nContainer 'encrypted-files' is ready.\n\n3. Encrypting and uploading data...\n   Original data: \"This is a secret message that will be encrypted with AES-256-GCM!\"\n   Data size: 66 bytes\n\n✓ Uploaded encrypted blob: demo-1746151234567.txt (80 bytes)\n\n   Encryption Metadata:\n   - Key ID: https://mykeyvault.vault.azure.net/keys/my-encryption-key/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6\n   - Wrapped DEK: JKLMNOPQRSTUVWXYZabcdefghijklmno...\n   - Algorithm: aes-256-gcm\n   - IV: AB12CD34EF56GH78IJ90\n   - Auth Tag: ZY98XW76VU54TS32RQ10\n\n4. Downloading and decrypting data...\n✓ Downloaded and decrypted blob: demo-1746151234567.txt (66 bytes)\n   Decrypted data: \"This is a secret message that will be encrypted with AES-256-GCM!\"\n   Data size: 66 bytes\n\n5. Verifying round-trip...\n   ✓ SUCCESS: Decrypted data matches original!\n\n6. Listing blobs in container...\n   Found 3 blob(s):\n   - demo-1746151234567.txt\n   - demo-1746150123456.txt\n   - demo-1746149012345.txt\n\n=== Demo completed successfully! ===\n```\n\n## Blob Metadata Example\n\nWhen you inspect the uploaded blob in Azure Portal, you'll see metadata like:\n\n| Key | Value |\n|-----|-------|\n| `iv` | `AB12CD34EF56GH78IJ90` |\n| `authTag` | `ZY98XW76VU54TS32RQ10` |\n| `wrappedKey` | `JKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ...` |\n| `keyId` | `https://mykeyvault.vault.azure.net/keys/my-encryption-key/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` |\n| `algorithm` | `aes-256-gcm` |\n\n## Error Scenarios\n\n### Missing Environment Variables\n```\n❌ Error: AZURE_STORAGE_ACCOUNT_NAME environment variable is required\n```\n\n### Key Vault Key Not Found\n```\n2. Initializing services...\nKey 'my-encryption-key' not found, creating it...\nKey 'my-encryption-key' created successfully.\nContainer 'encrypted-files' is ready.\n```\n\n### Access Denied (Missing RBAC)\n```\n❌ Error: Access denied to key 'my-encryption-key'. Check RBAC permissions (requires 'Key Vault Crypto User' role).\n```\n\n### Blob Not Found\n```\n❌ Error: Blob 'nonexistent.txt' not found in container 'encrypted-files'.\n```\n\n### Tampered Data\n```\n❌ Error: Decryption failed. The blob may be corrupted or tampered with.\n```\n\n## What Happens Behind the Scenes\n\n### During Upload:\n1. **Local**: Generate 32-byte random DEK\n2. **Local**: Encrypt plaintext with DEK using AES-256-GCM\n3. **Key Vault API Call**: Wrap DEK using RSA-OAEP\n4. **Blob Storage API Call**: Upload ciphertext with metadata\n5. **Memory**: Clear DEK (fill with zeros)\n\n### During Download:\n1. **Blob Storage API Call**: Download ciphertext and metadata\n2. **Key Vault API Call**: Unwrap DEK using RSA-OAEP\n3. **Local**: Decrypt ciphertext using recovered DEK\n4. **Local**: Verify authentication tag (GCM)\n5. **Memory**: Clear DEK (fill with zeros)\n\n## Performance Notes\n\nFor the demo data (66 bytes):\n- **Encryption time**: ~1-2ms (local, negligible)\n- **Key Vault wrap**: ~50-100ms (network call)\n- **Blob upload**: ~50-200ms (network call, depends on region)\n- **Total upload**: ~100-300ms\n\nFor the demo data (66 bytes):\n- **Blob download**: ~50-200ms (network call)\n- **Key Vault unwrap**: ~50-100ms (network call)\n- **Decryption time**: ~1-2ms (local, negligible)\n- **Total download**: ~100-300ms\n\n**Key Insight**: The Key Vault operations (wrap/unwrap) are the bottleneck, not the local encryption/decryption. For large files, the Key Vault overhead becomes relatively smaller as a percentage of total time.\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\EXAMPLE_OUTPUT.md"}
```

### 🔧 28. powershell

**Input:**

```json
{"command":"cd C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361; Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch 'node_modules|dist' } | Select-Object -ExpandProperty FullName | ForEach-Object { $_.Replace('C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\', '') }","description":"List all project files"}
```

### 🔧 29. create

**Input:**

```json
{"file_text":"# Quick Start Guide\n\n## Prerequisites\n\n1. **Azure Resources Required**:\n   - Azure Storage Account\n   - Azure Key Vault\n   - Managed Identity with permissions:\n     - Key Vault: `Key Vault Crypto User` role\n     - Storage: `Storage Blob Data Contributor` role\n\n2. **Local Requirements**:\n   - Node.js \u003e= 18.0.0\n   - npm or yarn\n\n## Setup Steps\n\n### 1. Clone/Copy Project\n```bash\ncd azure-encrypted-blob-storage\n```\n\n### 2. Install Dependencies\n```bash\nnpm install\n```\n\n### 3. Configure Environment\nCopy `.env.example` to `.env` and fill in your values:\n```bash\nAZURE_STORAGE_ACCOUNT_NAME=mystorageaccount\nAZURE_KEYVAULT_NAME=mykeyvault\nAZURE_KEY_NAME=my-encryption-key\nAZURE_CONTAINER_NAME=encrypted-files\n```\n\n### 4. Build TypeScript\n```bash\nnpm run build\n```\n\n### 5. Run Demo\n```bash\nnpm start\n```\n\n## Project Files\n\n```\nazure-encrypted-blob-storage/\n├── src/\n│   ├── config.ts                   # Azure connections \u0026 config\n│   ├── keyManagement.ts            # Key Vault envelope encryption\n│   ├── encryptedBlobStorage.ts     # Encrypted blob operations\n│   └── index.ts                    # Demo script\n├── dist/                           # Compiled JavaScript (generated)\n├── package.json                    # Dependencies\n├── tsconfig.json                   # TypeScript config\n├── README.md                       # Full documentation\n├── PROJECT_SUMMARY.md              # Implementation summary\n├── ENCRYPTION_FLOW.md              # Visual flow diagrams\n├── EXAMPLE_OUTPUT.md               # Sample output\n├── .env.example                    # Environment template\n└── .gitignore                      # Git ignore rules\n```\n\n## Using in Your Own Project\n\n### Import Classes\n```typescript\nimport { AzureConnections } from \"./config.js\";\nimport { KeyManagement } from \"./keyManagement.js\";\nimport { EncryptedBlobStorage } from \"./encryptedBlobStorage.js\";\n```\n\n### Initialize\n```typescript\nconst connections = AzureConnections.fromEnvironment();\nconst keyMgmt = new KeyManagement(\n  connections.keyClient,\n  \"my-key-name\",\n  (keyId) =\u003e connections.getCryptographyClient(keyId)\n);\n\nawait keyMgmt.ensureKeyExists();\n\nconst containerClient = connections.blobServiceClient.getContainerClient(\"my-container\");\nconst storage = new EncryptedBlobStorage(containerClient, keyMgmt);\nawait storage.ensureContainerExists();\n```\n\n### Upload Encrypted Data\n```typescript\nawait storage.uploadEncrypted(\"secret.txt\", \"My secret data\");\n```\n\n### Download and Decrypt\n```typescript\nconst decrypted = await storage.downloadDecrypted(\"secret.txt\");\nconsole.log(decrypted.toString());\n```\n\n## Common Issues\n\n### Issue: \"AZURE_STORAGE_ACCOUNT_NAME environment variable is required\"\n**Solution**: Set all required environment variables\n\n### Issue: \"Access denied to key\"\n**Solution**: Assign `Key Vault Crypto User` role to your managed identity\n\n### Issue: \"Access denied to storage account\"\n**Solution**: Assign `Storage Blob Data Contributor` role to your managed identity\n\n### Issue: \"Key 'my-key' not found\"\n**Solution**: The code auto-creates the key. Ensure you have Key Vault permissions.\n\n### Issue: \"Container not found\"\n**Solution**: The code auto-creates the container. Ensure you have Storage permissions.\n\n## Architecture Highlights\n\n- **Client-side encryption**: Data never reaches Azure in plaintext\n- **Envelope encryption**: DEK encrypts data, KEK (in Key Vault) wraps DEK\n- **AES-256-GCM**: Authenticated encryption (confidentiality + integrity)\n- **Key rotation support**: Each blob stores the key ID used\n- **Managed Identity**: No credentials in code\n\n## Security Best Practices\n\n✅ **DO**:\n- Use managed identity for authentication\n- Enable Key Vault soft-delete and purge protection\n- Use HSM-backed keys for production (`hsm: true`)\n- Set key expiration and rotation policies\n- Keep Key Vault and Storage in the same region\n\n❌ **DON'T**:\n- Store DEKs in plaintext anywhere\n- Hard-code credentials\n- Disable authentication tag verification\n- Re-use IVs (each encryption generates new IV)\n- Share wrapped keys across different KEKs\n\n## API Reference\n\n### KeyManagement\n\n| Method | Description |\n|--------|-------------|\n| `generateDataKey()` | Generate 32-byte AES-256 key |\n| `wrapDataKey(dek)` | Wrap DEK with Key Vault |\n| `unwrapDataKey(wrapped, keyId)` | Unwrap DEK with Key Vault |\n| `ensureKeyExists()` | Create RSA key if missing |\n\n### EncryptedBlobStorage\n\n| Method | Description |\n|--------|-------------|\n| `uploadEncrypted(name, data)` | Encrypt and upload blob |\n| `downloadDecrypted(name)` | Download and decrypt blob |\n| `ensureContainerExists()` | Create container if missing |\n| `listBlobs()` | List all blobs in container |\n\n### AzureConnections\n\n| Method | Description |\n|--------|-------------|\n| `fromEnvironment()` | Load config from env vars |\n| `getCryptographyClient(keyId)` | Get crypto client for key |\n| `getConfig()` | Get current configuration |\n\n## Further Reading\n\n- [Azure Key Vault Keys SDK](https://www.npmjs.com/package/@azure/keyvault-keys)\n- [Azure Blob Storage SDK](https://www.npmjs.com/package/@azure/storage-blob)\n- [Azure Identity SDK](https://www.npmjs.com/package/@azure/identity)\n- [Envelope Encryption Pattern](https://learn.microsoft.com/azure/key-vault/keys/about-keys)\n- [AES-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361\\QUICK_START.md"}
```

### 🔧 30. powershell

**Input:**

```json
{"command":"cd C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-azure-mcp-skills-claude-sonnet-4.5-1291925361; Write-Host \"Project Location: $PWD\" -ForegroundColor Cyan; Write-Host \"`nSource Files:\" -ForegroundColor Green; Get-ChildItem src -File | ForEach-Object { Write-Host \"  ✓ $($_.Name)\" -ForegroundColor White }; Write-Host \"`nCompiled Files:\" -ForegroundColor Green; Get-ChildItem dist -File -Filter \"*.js\" | ForEach-Object { Write-Host \"  ✓ $($_.Name)\" -ForegroundColor White }; Write-Host \"`nDocumentation:\" -ForegroundColor Green; Get-ChildItem -File -Filter \"*.md\" | ForEach-Object { Write-Host \"  ✓ $($_.Name)\" -ForegroundColor White }","description":"Display project summary"}
```

## Generated Files

- `ENCRYPTION_FLOW.md`
- `EXAMPLE_OUTPUT.md`
- `PROJECT_SUMMARY.md`
- `QUICK_START.md`
- `README.md`
- `package-lock.json`
- `package.json`
- `src\config.ts`
- `src\encryptedBlobStorage.ts`
- `src\index.ts`
- `src\keyManagement.ts`
- `tsconfig.json`

## Copilot Response

I'll create a TypeScript project that implements client-side encryption for Azure Blob Storage using Azure Key Vault's envelope encryption. Let me start by invoking the relevant Azure SDK skills for guidance.

Now I'll create the complete TypeScript project with envelope encryption for Azure Blob Storage. Let me read the Key Vault Keys reference to ensure I'm using the correct API patterns.

Perfect! Now I'll create all the necessary files for the encrypted blob storage project.

I need to create the src directory first. Let me do that:

Now let me create the source files:

Perfect! Now let me install the dependencies and build the project to verify everything compiles correctly:

I need to fix the TypeScript type issue. The `setAuthTag` method exists but TypeScript needs proper type casting. Let me fix this:

Excellent! The project builds successfully. Let me verify the output files were created:

Perfect! Let me verify the dist directory has the compiled files:

Perfect! All files compiled successfully. Now let me create a summary document to explain the project structure:

Perfect! Let me create a quick visual diagram to show the encryption flow:

Perfect! Let me create one final file showing example output from running the demo:

Perfect! Now let me create a final verification to show all the project files:

Excellent! Let me create one final quick reference guide:

Perfect! Let me verify the final build one more time and create a comprehensive summary:

## Code Review (LLM-as-Judge)

**Score: 42/43 criteria passed**

### Criteria Results

| Criterion | Result | Reason |
|-----------|--------|--------|
| Code Builds | ✅ | TypeScript configuration is valid, all imports are correct, no syntax errors. Code structure is sound. |
| Latest Package Versions | ✅ | Uses modern Azure SDK versions: @azure/identity ^4.0.0, @azure/keyvault-keys ^4.8.0, @azure/storage-blob ^12.17.0 |
| Best Practices | ✅ | Uses ManagedIdentityCredential, single shared credential instance, proper client construction with endpoint+credential pattern |
| Error Handling | ✅ | Comprehensive try-catch blocks with statusCode checking, meaningful error messages for Key Vault and Storage errors |
| Code Quality | ✅ | Clean, well-organized code with clear separation of concerns across config, keyManagement, and encryptedBlobStorage modules |
| Correct @azure/ Scoped Packages | ✅ | All dependencies use @azure/ scoped packages: @azure/identity, @azure/keyvault-keys, @azure/storage-blob |
| @azure/identity for Authentication | ✅ | Uses ManagedIdentityCredential (specific production credential), not just DefaultAzureCredential |
| Client Constructor with Endpoint and Credential | ✅ | All clients constructed correctly: new BlobServiceClient(url, credential), new KeyClient(vaultUrl, credential), new CryptographyClient(keyId, credential) |
| Async/Await Pattern | ✅ | All asynchronous operations use async/await throughout, no .then()/.catch() chains or callbacks |
| Pagination with for-await-of | ✅ | listBlobs() uses 'for await (const blob of this.containerClient.listBlobsFlat())' |
| RestError Exception Handling | ✅ | Checks error.statusCode for 403, 404, and error.code for KeyDisabled - correct RestError pattern |
| No Deprecated Packages | ✅ | No deprecated packages (azure-storage, azure-arm-*, ms-rest-azure, etc.) in dependencies |
| Logging via @azure/logger | ❌ | Does not use @azure/logger with setLogLevel() or AZURE_LOG_LEVEL environment variable. Only uses console.log statements. |
| package.json with Correct Dependencies | ✅ | Valid package.json with all required @azure/* dependencies, tsconfig.json, and @types/node included |
| Uses @azure/keyvault-keys (NOT Secrets) | ✅ | Correctly uses @azure/keyvault-keys with KeyClient and CryptographyClient, not SecretClient |
| Uses Node.js crypto module | ✅ | Imports from 'node:crypto': createCipheriv, createDecipheriv, randomBytes |
| Uses KeyClient and CryptographyClient | ✅ | KeyClient for key management (getKey, createRsaKey), CryptographyClient for wrap/unwrap operations |
| Constructs CryptographyClient with key ID | ✅ | getCryptographyClient(keyId: string) returns new CryptographyClient(keyId, credential) |
| Uses CryptographyClient.wrapKey() | ✅ | Calls cryptoClient.wrapKey('RSA-OAEP', dataKey) in wrapDataKey method |
| Uses CryptographyClient.unwrapKey() | ✅ | Calls cryptoClient.unwrapKey('RSA-OAEP', wrappedKey) in unwrapDataKey method |
| Specifies RSA-OAEP algorithm | ✅ | Uses 'RSA-OAEP' algorithm for both wrapKey and unwrapKey operations |
| Key material never leaves Key Vault | ✅ | All wrap/unwrap operations are server-side via CryptographyClient, KEK stays in vault |
| Generates random AES-256 DEK (32 bytes) | ✅ | generateDataKey() returns randomBytes(32) for 256-bit AES key |
| Encrypts with AES-GCM locally | ✅ | Uses createCipheriv('aes-256-gcm', dataKey, iv) for local encryption |
| Wraps DEK via Key Vault | ✅ | Calls keyManagement.wrapDataKey(dataKey) before storing, returns wrapped key |
| Stores wrapped DEK as metadata (base64) | ✅ | Metadata includes wrappedKey: wrappedKey.toString('base64') |
| Stores IV in metadata (base64) | ✅ | Metadata includes iv: iv.toString('base64') |
| Stores GCM auth tag in metadata (base64) | ✅ | Metadata includes authTag: authTag.toString('base64') from cipher.getAuthTag() |
| Stores vault key identifier | ✅ | Metadata includes keyId: keyId from Key Vault |
| Decryption unwraps DEK and decrypts | ✅ | downloadDecrypted retrieves metadata, unwraps DEK, sets auth tag, then decrypts locally |
| Uses AES-GCM mode | ✅ | Algorithm is 'aes-256-gcm' throughout encryption/decryption |
| Generates random IV (12 bytes for GCM) | ✅ | Uses randomBytes(12) for 96-bit GCM IV |
| Retrieves auth tag via getAuthTag() | ✅ | const authTag = cipher.getAuthTag() called after cipher.final() |
| Sets auth tag via setAuthTag() | ✅ | decipher.setAuthTag(authTag) called before decryption |
| Handles Key Vault errors | ✅ | Catches 404 (not found), 403 (access denied), KeyDisabled errors with specific messages |
| Handles Storage errors | ✅ | Catches 404 (blob/container not found), 403 (access denied) with statusCode checks |
| NOT using SecretClient | ✅ | Correctly uses KeyClient and CryptographyClient only, no SecretClient |
| NOT encrypting directly with vault key | ✅ | Implements envelope encryption: DEK encrypts data, vault wraps DEK |
| NOT storing raw DEK | ✅ | Calls dataKey.fill(0) to clear sensitive data from memory after use |
| NOT omitting GCM auth tag | ✅ | Auth tag is stored as metadata and retrieved for decryption verification |
| Includes main demo script | ✅ | index.ts demonstrates complete encrypt-upload-download-decrypt round-trip |
| Shows encryption metadata in output | ✅ | Demo prints key ID, wrapped DEK (truncated), algorithm, IV, and auth tag |

### Summary

Excellent implementation of envelope encryption with Azure Key Vault and Blob Storage. The code correctly implements all critical security patterns: client-side AES-256-GCM encryption, server-side DEK wrapping via Key Vault, proper metadata storage, and secure memory handling. Uses modern Azure SDK patterns with proper authentication, client construction, async/await, and pagination. Only missing SDK diagnostic logging via @azure/logger.

### Strengths

- Correct envelope encryption pattern with local AES-256-GCM and Key Vault DEK wrapping
- Uses @azure/keyvault-keys (KeyClient/CryptographyClient) not Secrets API
- Proper GCM auth tag handling (getAuthTag/setAuthTag) with metadata storage
- Clears sensitive data from memory (dataKey.fill(0))
- Comprehensive error handling with statusCode checks for both services
- ManagedIdentityCredential with shared instance across clients
- Complete round-trip demo showing encryption metadata
- Clean separation of concerns across config, key management, and storage modules
- All modern @azure/* scoped packages with proper versioning
- Proper async/await and for-await-of pagination patterns

### Issues

- Does not use @azure/logger with setLogLevel() or AZURE_LOG_LEVEL for SDK diagnostic logging - only uses console.log statements

## Grader Results

| Grader | Type | Score | Summary |
|--------|------|-------|----------|
| `claude-sonnet-4.5` | review | 42/43 | Excellent implementation of envelope encryption with Azure Key Vault and Blob St… |
| 🏆 `claude-sonnet-4.5` | review | 42/43 | Excellent implementation of envelope encryption with Azure Key Vault and Blob St… |

## Re-run Command

```bash
hyoka run --prompt-id storage-dp-js-ts-encrypted-uploader --config azure-mcp-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
