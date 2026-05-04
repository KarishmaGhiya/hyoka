# Evaluation Report: storage-dp-js-ts-encrypted-uploader

**Config:** baseline-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 285.6s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `storage-dp-js-ts-encrypted-uploader` |
| Config | baseline-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Score | 38/10 |
| Duration | 285.6s |
| Timestamp | 2026-05-01T23:22:39Z |
| Files Generated | 7 |
| Event Count | 291 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 191.3s |
| Review | 94.3s |
| **Total** | **285.6s** |

## Configuration

- **name:** baseline-skills/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skill Directories | C:\code\hyoka\skills\generator\js-ts-azure-patterns |
| Skills Loaded | customize-cloud-agent |
| Skills Invoked | azure-identity-ts |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=382019 out=11108 |
| Turn Count | 14 |

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

Let me analyze this task and plan the implementation. I need to create a TypeScript Node.js project with:

1. Key management class (Azure Key Vault Keys)
2. Blob uploader/downloader with client-side encryption (AES-GCM)
3. Configuration module
4. Main demo script
5. package.json and tsconfig.json

Let me invoke the azure-identity-ts skill first for authentication patterns.

Let me explore the current working directory and then create the project files.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating encrypted uploader project"}
```

### 🔧 2. skill

**Input:**

```json
{"skill":"azure-identity-ts"}
```

### 🔧 3. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"encrypted-blob-uploader\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Upload files to Azure Blob Storage with client-side encryption using Azure Key Vault\",\n  \"main\": \"dist/main.js\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/main.js\"\n  },\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.6.0\",\n    \"@azure/keyvault-keys\": \"^4.9.0\",\n    \"@azure/storage-blob\": \"^12.26.0\"\n  },\n  \"devDependencies\": {\n    \"typescript\": \"^5.7.0\",\n    \"@types/node\": \"^22.0.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\package.json"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"dist\",\n    \"rootDir\": \"src\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true,\n    \"declaration\": true,\n    \"declarationMap\": true,\n    \"sourceMap\": true\n  },\n  \"include\": [\"src/**/*\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\tsconfig.json"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"import { DefaultAzureCredential } from \"@azure/identity\";\nimport { KeyClient, CryptographyClient } from \"@azure/keyvault-keys\";\nimport { BlobServiceClient } from \"@azure/storage-blob\";\nimport type { TokenCredential } from \"@azure/core-auth\";\n\nexport interface AzureConfig {\n  credential: TokenCredential;\n  keyClient: KeyClient;\n  blobServiceClient: BlobServiceClient;\n  keyVaultKeyName: string;\n}\n\n/**\n * Builds Azure connections from environment variables, sharing a single credential.\n *\n * Required env vars:\n *   KEY_VAULT_URL       – e.g. https://my-vault.vault.azure.net\n *   STORAGE_ACCOUNT_URL – e.g. https://myaccount.blob.core.windows.net\n *   KEY_VAULT_KEY_NAME  – name of the RSA key in Key Vault\n */\nexport function buildAzureConfig(): AzureConfig {\n  const keyVaultUrl = requireEnv(\"KEY_VAULT_URL\");\n  const storageAccountUrl = requireEnv(\"STORAGE_ACCOUNT_URL\");\n  const keyVaultKeyName = requireEnv(\"KEY_VAULT_KEY_NAME\");\n\n  const credential = new DefaultAzureCredential();\n\n  const keyClient = new KeyClient(keyVaultUrl, credential);\n  const blobServiceClient = new BlobServiceClient(storageAccountUrl, credential);\n\n  return { credential, keyClient, blobServiceClient, keyVaultKeyName };\n}\n\n/**\n * Creates a CryptographyClient for a specific key version.\n */\nexport function buildCryptographyClient(\n  keyId: string,\n  credential: TokenCredential\n): CryptographyClient {\n  return new CryptographyClient(keyId, credential);\n}\n\nfunction requireEnv(name: string): string {\n  const value = process.env[name];\n  if (!value) {\n    throw new Error(`Missing required environment variable: ${name}`);\n  }\n  return value;\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\src\\config.ts"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"import { KeyClient, CryptographyClient, KnownKeyWrapAlgorithm } from \"@azure/keyvault-keys\";\nimport type { TokenCredential } from \"@azure/core-auth\";\nimport * as crypto from \"crypto\";\nimport { buildCryptographyClient } from \"./config\";\n\n/** Material returned after generating and wrapping a data encryption key. */\nexport interface WrappedKeyMaterial {\n  /** The encrypted (wrapped) DEK – safe to persist. */\n  wrappedDek: Buffer;\n  /** The plaintext DEK – use immediately and discard. */\n  plaintextDek: Buffer;\n  /** Full Key Vault key ID (with version) used for wrapping. */\n  keyId: string;\n}\n\n/**\n * Envelope-encryption key manager backed by Azure Key Vault Keys.\n *\n * - Generates a random AES-256 data encryption key (DEK) locally.\n * - Uses Key Vault to wrap (protect) the DEK with an RSA key.\n * - For decryption, asks Key Vault to unwrap the DEK, then decrypts locally.\n * - The raw DEK is never persisted; the vault key material never leaves Key Vault.\n */\nexport class KeyManager {\n  private readonly keyClient: KeyClient;\n  private readonly credential: TokenCredential;\n  private readonly keyName: string;\n\n  constructor(keyClient: KeyClient, credential: TokenCredential, keyName: string) {\n    this.keyClient = keyClient;\n    this.credential = credential;\n    this.keyName = keyName;\n  }\n\n  /**\n   * Generate a random 256-bit DEK, wrap it with the Key Vault key, and return both.\n   */\n  async generateAndWrapKey(): Promise\u003cWrappedKeyMaterial\u003e {\n    const plaintextDek = crypto.randomBytes(32); // AES-256\n\n    const key = await this.keyClient.getKey(this.keyName);\n    if (!key.id) {\n      throw new Error(`Key Vault key \"${this.keyName}\" has no ID`);\n    }\n\n    const cryptoClient = buildCryptographyClient(key.id, this.credential);\n    const wrapResult = await cryptoClient.wrapKey(\n      KnownKeyWrapAlgorithm.RSAOaep256,\n      plaintextDek\n    );\n\n    return {\n      wrappedDek: Buffer.from(wrapResult.result),\n      plaintextDek,\n      keyId: key.id,\n    };\n  }\n\n  /**\n   * Unwrap a previously wrapped DEK using Key Vault.\n   *\n   * @param wrappedDek  The encrypted DEK (from blob metadata).\n   * @param keyId       The full Key Vault key ID that was used to wrap it.\n   * @returns           The recovered plaintext DEK.\n   */\n  async unwrapKey(wrappedDek: Buffer, keyId: string): Promise\u003cBuffer\u003e {\n    const cryptoClient = buildCryptographyClient(keyId, this.credential);\n    const unwrapResult = await cryptoClient.unwrapKey(\n      KnownKeyWrapAlgorithm.RSAOaep256,\n      wrappedDek\n    );\n    return Buffer.from(unwrapResult.result);\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\src\\keyManager.ts"}
```

### 🔧 8. create

**Input:**

```json
{"file_text":"import { BlobServiceClient } from \"@azure/storage-blob\";\nimport { RestError } from \"@azure/core-rest-pipeline\";\nimport * as crypto from \"crypto\";\nimport { KeyManager } from \"./keyManager\";\n\nconst AES_ALGORITHM = \"aes-256-gcm\";\nconst IV_BYTES = 12; // NIST-recommended for GCM\nconst AUTH_TAG_BYTES = 16;\n\n/**\n * Encrypts data locally with AES-256-GCM and uploads ciphertext to Azure Blob Storage.\n * The data encryption key is envelope-encrypted via Key Vault.\n *\n * Blob metadata stores:\n *   encryptionKeyId  – Key Vault key ID used for wrapping\n *   wrappedDek       – base-64 encoded wrapped DEK\n *   iv               – base-64 encoded initialization vector\n *   authTag          – base-64 encoded GCM authentication tag\n */\nexport class EncryptedBlobClient {\n  private readonly blobServiceClient: BlobServiceClient;\n  private readonly keyManager: KeyManager;\n\n  constructor(blobServiceClient: BlobServiceClient, keyManager: KeyManager) {\n    this.blobServiceClient = blobServiceClient;\n    this.keyManager = keyManager;\n  }\n\n  /**\n   * Encrypt and upload data to a blob.\n   *\n   * @returns The metadata stored alongside the blob (useful for verification).\n   */\n  async upload(\n    containerName: string,\n    blobName: string,\n    plaintext: Buffer\n  ): Promise\u003c{ keyId: string; wrappedDekBase64: string }\u003e {\n    // 1. Generate a DEK and wrap it with Key Vault\n    let keyMaterial;\n    try {\n      keyMaterial = await this.keyManager.generateAndWrapKey();\n    } catch (err) {\n      throw new Error(\n        `Key Vault operation failed while generating/wrapping DEK: ${messageFrom(err)}`\n      );\n    }\n\n    const { plaintextDek, wrappedDek, keyId } = keyMaterial;\n\n    // 2. Encrypt locally with AES-256-GCM\n    const iv = crypto.randomBytes(IV_BYTES);\n    const cipher = crypto.createCipheriv(AES_ALGORITHM, plaintextDek, iv, {\n      authTagLength: AUTH_TAG_BYTES,\n    });\n    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);\n    const authTag = cipher.getAuthTag();\n\n    // Zero out the plaintext DEK as soon as possible\n    plaintextDek.fill(0);\n\n    // 3. Upload ciphertext with metadata\n    const metadata: Record\u003cstring, string\u003e = {\n      encryptionkeyid: keyId,\n      wrappeddek: wrappedDek.toString(\"base64\"),\n      iv: iv.toString(\"base64\"),\n      authtag: authTag.toString(\"base64\"),\n    };\n\n    try {\n      const containerClient = this.blobServiceClient.getContainerClient(containerName);\n      await containerClient.createIfNotExists();\n      const blockBlobClient = containerClient.getBlockBlobClient(blobName);\n      await blockBlobClient.upload(ciphertext, ciphertext.length, { metadata });\n    } catch (err) {\n      throw new Error(\n        `Blob Storage upload failed: ${messageFrom(err)}`\n      );\n    }\n\n    return { keyId, wrappedDekBase64: wrappedDek.toString(\"base64\") };\n  }\n\n  /**\n   * Download and decrypt a blob.\n   */\n  async download(containerName: string, blobName: string): Promise\u003cBuffer\u003e {\n    // 1. Download blob and metadata\n    let ciphertext: Buffer;\n    let metadata: Record\u003cstring, string\u003e;\n\n    try {\n      const containerClient = this.blobServiceClient.getContainerClient(containerName);\n      const blobClient = containerClient.getBlockBlobClient(blobName);\n      const response = await blobClient.download(0);\n\n      metadata = (response.metadata ?? {}) as Record\u003cstring, string\u003e;\n      ciphertext = await streamToBuffer(response.readableStreamBody!);\n    } catch (err) {\n      if (err instanceof RestError \u0026\u0026 err.statusCode === 404) {\n        throw new Error(\n          `Blob not found: ${containerName}/${blobName}`\n        );\n      }\n      throw new Error(\n        `Blob Storage download failed: ${messageFrom(err)}`\n      );\n    }\n\n    // 2. Extract crypto parameters from metadata\n    const keyId = metadata.encryptionkeyid;\n    const wrappedDekB64 = metadata.wrappeddek;\n    const ivB64 = metadata.iv;\n    const authTagB64 = metadata.authtag;\n\n    if (!keyId || !wrappedDekB64 || !ivB64 || !authTagB64) {\n      throw new Error(\n        \"Blob metadata is missing required encryption fields \" +\n          \"(encryptionkeyid, wrappeddek, iv, authtag)\"\n      );\n    }\n\n    const wrappedDek = Buffer.from(wrappedDekB64, \"base64\");\n    const iv = Buffer.from(ivB64, \"base64\");\n    const authTag = Buffer.from(authTagB64, \"base64\");\n\n    // 3. Unwrap DEK via Key Vault\n    let plaintextDek: Buffer;\n    try {\n      plaintextDek = await this.keyManager.unwrapKey(wrappedDek, keyId);\n    } catch (err) {\n      throw new Error(\n        `Key Vault unwrap failed (key may be disabled or deleted): ${messageFrom(err)}`\n      );\n    }\n\n    // 4. Decrypt locally\n    try {\n      const decipher = crypto.createDecipheriv(AES_ALGORITHM, plaintextDek, iv, {\n        authTagLength: AUTH_TAG_BYTES,\n      });\n      decipher.setAuthTag(authTag);\n      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);\n      return decrypted;\n    } finally {\n      plaintextDek.fill(0);\n    }\n  }\n}\n\nasync function streamToBuffer(\n  stream: NodeJS.ReadableStream\n): Promise\u003cBuffer\u003e {\n  const chunks: Buffer[] = [];\n  for await (const chunk of stream) {\n    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));\n  }\n  return Buffer.concat(chunks);\n}\n\nfunction messageFrom(err: unknown): string {\n  return err instanceof Error ? err.message : String(err);\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\src\\encryptedBlobClient.ts"}
```

### 🔧 9. create

**Input:**

```json
{"file_text":"import { buildAzureConfig } from \"./config\";\nimport { KeyManager } from \"./keyManager\";\nimport { EncryptedBlobClient } from \"./encryptedBlobClient\";\n\nasync function main(): Promise\u003cvoid\u003e {\n  const containerName = process.env.CONTAINER_NAME ?? \"encrypted-uploads\";\n  const blobName = `sample-${Date.now()}.enc`;\n  const sampleText = \"Hello, encrypted world! This is a round-trip test.\";\n\n  console.log(\"=== Encrypted Blob Upload / Download Demo ===\\n\");\n  console.log(`  Container : ${containerName}`);\n  console.log(`  Blob      : ${blobName}`);\n  console.log(`  Plaintext : \"${sampleText}\"\\n`);\n\n  // Build shared config\n  const config = buildAzureConfig();\n  const keyManager = new KeyManager(\n    config.keyClient,\n    config.credential,\n    config.keyVaultKeyName\n  );\n  const encryptedBlobClient = new EncryptedBlobClient(\n    config.blobServiceClient,\n    keyManager\n  );\n\n  // Encrypt \u0026 upload\n  console.log(\"[1/2] Encrypting and uploading...\");\n  const { keyId, wrappedDekBase64 } = await encryptedBlobClient.upload(\n    containerName,\n    blobName,\n    Buffer.from(sampleText, \"utf-8\")\n  );\n\n  console.log(`  Vault key ID  : ${keyId}`);\n  console.log(`  Wrapped DEK   : ${wrappedDekBase64}`);\n\n  // Download \u0026 decrypt\n  console.log(\"\\n[2/2] Downloading and decrypting...\");\n  const decrypted = await encryptedBlobClient.download(containerName, blobName);\n  const decryptedText = decrypted.toString(\"utf-8\");\n\n  console.log(`  Decrypted     : \"${decryptedText}\"`);\n\n  // Verify round-trip\n  if (decryptedText === sampleText) {\n    console.log(\"\\n✓ Round-trip succeeded – plaintext matches.\");\n  } else {\n    console.error(\"\\n✗ Round-trip FAILED – plaintext does not match!\");\n    process.exitCode = 1;\n  }\n}\n\nmain().catch((err) =\u003e {\n  console.error(\"Fatal error:\", err);\n  process.exitCode = 1;\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\src\\main.ts"}
```

### 🔧 10. powershell

**Input:**

```json
{"command":"New-Item -ItemType Directory -Path \"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\src\" -Force","description":"Create src directory"}
```

### 🔧 11. create

**Input:**

```json
{"file_text":"import { DefaultAzureCredential } from \"@azure/identity\";\nimport { KeyClient, CryptographyClient } from \"@azure/keyvault-keys\";\nimport { BlobServiceClient } from \"@azure/storage-blob\";\nimport type { TokenCredential } from \"@azure/core-auth\";\n\nexport interface AzureConfig {\n  credential: TokenCredential;\n  keyClient: KeyClient;\n  blobServiceClient: BlobServiceClient;\n  keyVaultKeyName: string;\n}\n\n/**\n * Builds Azure connections from environment variables, sharing a single credential.\n *\n * Required env vars:\n *   KEY_VAULT_URL       – e.g. https://my-vault.vault.azure.net\n *   STORAGE_ACCOUNT_URL – e.g. https://myaccount.blob.core.windows.net\n *   KEY_VAULT_KEY_NAME  – name of the RSA key in Key Vault\n */\nexport function buildAzureConfig(): AzureConfig {\n  const keyVaultUrl = requireEnv(\"KEY_VAULT_URL\");\n  const storageAccountUrl = requireEnv(\"STORAGE_ACCOUNT_URL\");\n  const keyVaultKeyName = requireEnv(\"KEY_VAULT_KEY_NAME\");\n\n  const credential = new DefaultAzureCredential();\n\n  const keyClient = new KeyClient(keyVaultUrl, credential);\n  const blobServiceClient = new BlobServiceClient(storageAccountUrl, credential);\n\n  return { credential, keyClient, blobServiceClient, keyVaultKeyName };\n}\n\n/**\n * Creates a CryptographyClient for a specific key version.\n */\nexport function buildCryptographyClient(\n  keyId: string,\n  credential: TokenCredential\n): CryptographyClient {\n  return new CryptographyClient(keyId, credential);\n}\n\nfunction requireEnv(name: string): string {\n  const value = process.env[name];\n  if (!value) {\n    throw new Error(`Missing required environment variable: ${name}`);\n  }\n  return value;\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\src\\config.ts"}
```

### 🔧 12. create

**Input:**

```json
{"file_text":"import { KeyClient, CryptographyClient, KnownKeyWrapAlgorithm } from \"@azure/keyvault-keys\";\nimport type { TokenCredential } from \"@azure/core-auth\";\nimport * as crypto from \"crypto\";\nimport { buildCryptographyClient } from \"./config\";\n\n/** Material returned after generating and wrapping a data encryption key. */\nexport interface WrappedKeyMaterial {\n  /** The encrypted (wrapped) DEK – safe to persist. */\n  wrappedDek: Buffer;\n  /** The plaintext DEK – use immediately and discard. */\n  plaintextDek: Buffer;\n  /** Full Key Vault key ID (with version) used for wrapping. */\n  keyId: string;\n}\n\n/**\n * Envelope-encryption key manager backed by Azure Key Vault Keys.\n *\n * - Generates a random AES-256 data encryption key (DEK) locally.\n * - Uses Key Vault to wrap (protect) the DEK with an RSA key.\n * - For decryption, asks Key Vault to unwrap the DEK, then decrypts locally.\n * - The raw DEK is never persisted; the vault key material never leaves Key Vault.\n */\nexport class KeyManager {\n  private readonly keyClient: KeyClient;\n  private readonly credential: TokenCredential;\n  private readonly keyName: string;\n\n  constructor(keyClient: KeyClient, credential: TokenCredential, keyName: string) {\n    this.keyClient = keyClient;\n    this.credential = credential;\n    this.keyName = keyName;\n  }\n\n  /**\n   * Generate a random 256-bit DEK, wrap it with the Key Vault key, and return both.\n   */\n  async generateAndWrapKey(): Promise\u003cWrappedKeyMaterial\u003e {\n    const plaintextDek = crypto.randomBytes(32); // AES-256\n\n    const key = await this.keyClient.getKey(this.keyName);\n    if (!key.id) {\n      throw new Error(`Key Vault key \"${this.keyName}\" has no ID`);\n    }\n\n    const cryptoClient = buildCryptographyClient(key.id, this.credential);\n    const wrapResult = await cryptoClient.wrapKey(\n      KnownKeyWrapAlgorithm.RSAOaep256,\n      plaintextDek\n    );\n\n    return {\n      wrappedDek: Buffer.from(wrapResult.result),\n      plaintextDek,\n      keyId: key.id,\n    };\n  }\n\n  /**\n   * Unwrap a previously wrapped DEK using Key Vault.\n   *\n   * @param wrappedDek  The encrypted DEK (from blob metadata).\n   * @param keyId       The full Key Vault key ID that was used to wrap it.\n   * @returns           The recovered plaintext DEK.\n   */\n  async unwrapKey(wrappedDek: Buffer, keyId: string): Promise\u003cBuffer\u003e {\n    const cryptoClient = buildCryptographyClient(keyId, this.credential);\n    const unwrapResult = await cryptoClient.unwrapKey(\n      KnownKeyWrapAlgorithm.RSAOaep256,\n      wrappedDek\n    );\n    return Buffer.from(unwrapResult.result);\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\src\\keyManager.ts"}
```

### 🔧 13. create

**Input:**

```json
{"file_text":"import { BlobServiceClient } from \"@azure/storage-blob\";\nimport { RestError } from \"@azure/core-rest-pipeline\";\nimport * as crypto from \"crypto\";\nimport { KeyManager } from \"./keyManager\";\n\nconst AES_ALGORITHM = \"aes-256-gcm\";\nconst IV_BYTES = 12; // NIST-recommended for GCM\nconst AUTH_TAG_BYTES = 16;\n\n/**\n * Encrypts data locally with AES-256-GCM and uploads ciphertext to Azure Blob Storage.\n * The data encryption key is envelope-encrypted via Key Vault.\n *\n * Blob metadata stores:\n *   encryptionkeyid – Key Vault key ID used for wrapping\n *   wrappeddek      – base-64 encoded wrapped DEK\n *   iv              – base-64 encoded initialization vector\n *   authtag         – base-64 encoded GCM authentication tag\n */\nexport class EncryptedBlobClient {\n  private readonly blobServiceClient: BlobServiceClient;\n  private readonly keyManager: KeyManager;\n\n  constructor(blobServiceClient: BlobServiceClient, keyManager: KeyManager) {\n    this.blobServiceClient = blobServiceClient;\n    this.keyManager = keyManager;\n  }\n\n  /**\n   * Encrypt and upload data to a blob.\n   *\n   * @returns The metadata stored alongside the blob (useful for verification).\n   */\n  async upload(\n    containerName: string,\n    blobName: string,\n    plaintext: Buffer\n  ): Promise\u003c{ keyId: string; wrappedDekBase64: string }\u003e {\n    // 1. Generate a DEK and wrap it with Key Vault\n    let keyMaterial;\n    try {\n      keyMaterial = await this.keyManager.generateAndWrapKey();\n    } catch (err) {\n      throw new Error(\n        `Key Vault operation failed while generating/wrapping DEK: ${messageFrom(err)}`\n      );\n    }\n\n    const { plaintextDek, wrappedDek, keyId } = keyMaterial;\n\n    // 2. Encrypt locally with AES-256-GCM\n    const iv = crypto.randomBytes(IV_BYTES);\n    const cipher = crypto.createCipheriv(AES_ALGORITHM, plaintextDek, iv, {\n      authTagLength: AUTH_TAG_BYTES,\n    });\n    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);\n    const authTag = cipher.getAuthTag();\n\n    // Zero out the plaintext DEK as soon as possible\n    plaintextDek.fill(0);\n\n    // 3. Upload ciphertext with metadata\n    const metadata: Record\u003cstring, string\u003e = {\n      encryptionkeyid: keyId,\n      wrappeddek: wrappedDek.toString(\"base64\"),\n      iv: iv.toString(\"base64\"),\n      authtag: authTag.toString(\"base64\"),\n    };\n\n    try {\n      const containerClient = this.blobServiceClient.getContainerClient(containerName);\n      await containerClient.createIfNotExists();\n      const blockBlobClient = containerClient.getBlockBlobClient(blobName);\n      await blockBlobClient.upload(ciphertext, ciphertext.length, { metadata });\n    } catch (err) {\n      throw new Error(\n        `Blob Storage upload failed: ${messageFrom(err)}`\n      );\n    }\n\n    return { keyId, wrappedDekBase64: wrappedDek.toString(\"base64\") };\n  }\n\n  /**\n   * Download and decrypt a blob.\n   */\n  async download(containerName: string, blobName: string): Promise\u003cBuffer\u003e {\n    // 1. Download blob and metadata\n    let ciphertext: Buffer;\n    let metadata: Record\u003cstring, string\u003e;\n\n    try {\n      const containerClient = this.blobServiceClient.getContainerClient(containerName);\n      const blobClient = containerClient.getBlockBlobClient(blobName);\n      const response = await blobClient.download(0);\n\n      metadata = (response.metadata ?? {}) as Record\u003cstring, string\u003e;\n      ciphertext = await streamToBuffer(response.readableStreamBody!);\n    } catch (err) {\n      if (err instanceof RestError \u0026\u0026 err.statusCode === 404) {\n        throw new Error(\n          `Blob not found: ${containerName}/${blobName}`\n        );\n      }\n      throw new Error(\n        `Blob Storage download failed: ${messageFrom(err)}`\n      );\n    }\n\n    // 2. Extract crypto parameters from metadata\n    const keyId = metadata.encryptionkeyid;\n    const wrappedDekB64 = metadata.wrappeddek;\n    const ivB64 = metadata.iv;\n    const authTagB64 = metadata.authtag;\n\n    if (!keyId || !wrappedDekB64 || !ivB64 || !authTagB64) {\n      throw new Error(\n        \"Blob metadata is missing required encryption fields \" +\n          \"(encryptionkeyid, wrappeddek, iv, authtag)\"\n      );\n    }\n\n    const wrappedDek = Buffer.from(wrappedDekB64, \"base64\");\n    const iv = Buffer.from(ivB64, \"base64\");\n    const authTag = Buffer.from(authTagB64, \"base64\");\n\n    // 3. Unwrap DEK via Key Vault\n    let plaintextDek: Buffer;\n    try {\n      plaintextDek = await this.keyManager.unwrapKey(wrappedDek, keyId);\n    } catch (err) {\n      throw new Error(\n        `Key Vault unwrap failed (key may be disabled or deleted): ${messageFrom(err)}`\n      );\n    }\n\n    // 4. Decrypt locally\n    try {\n      const decipher = crypto.createDecipheriv(AES_ALGORITHM, plaintextDek, iv, {\n        authTagLength: AUTH_TAG_BYTES,\n      });\n      decipher.setAuthTag(authTag);\n      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);\n      return decrypted;\n    } finally {\n      plaintextDek.fill(0);\n    }\n  }\n}\n\nasync function streamToBuffer(\n  stream: NodeJS.ReadableStream\n): Promise\u003cBuffer\u003e {\n  const chunks: Buffer[] = [];\n  for await (const chunk of stream) {\n    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));\n  }\n  return Buffer.concat(chunks);\n}\n\nfunction messageFrom(err: unknown): string {\n  return err instanceof Error ? err.message : String(err);\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\src\\encryptedBlobClient.ts"}
```

### 🔧 14. create

**Input:**

```json
{"file_text":"import { buildAzureConfig } from \"./config\";\nimport { KeyManager } from \"./keyManager\";\nimport { EncryptedBlobClient } from \"./encryptedBlobClient\";\n\nasync function main(): Promise\u003cvoid\u003e {\n  const containerName = process.env.CONTAINER_NAME ?? \"encrypted-uploads\";\n  const blobName = `sample-${Date.now()}.enc`;\n  const sampleText = \"Hello, encrypted world! This is a round-trip test.\";\n\n  console.log(\"=== Encrypted Blob Upload / Download Demo ===\\n\");\n  console.log(`  Container : ${containerName}`);\n  console.log(`  Blob      : ${blobName}`);\n  console.log(`  Plaintext : \"${sampleText}\"\\n`);\n\n  // Build shared config\n  const config = buildAzureConfig();\n  const keyManager = new KeyManager(\n    config.keyClient,\n    config.credential,\n    config.keyVaultKeyName\n  );\n  const encryptedBlobClient = new EncryptedBlobClient(\n    config.blobServiceClient,\n    keyManager\n  );\n\n  // Encrypt \u0026 upload\n  console.log(\"[1/2] Encrypting and uploading...\");\n  const { keyId, wrappedDekBase64 } = await encryptedBlobClient.upload(\n    containerName,\n    blobName,\n    Buffer.from(sampleText, \"utf-8\")\n  );\n\n  console.log(`  Vault key ID  : ${keyId}`);\n  console.log(`  Wrapped DEK   : ${wrappedDekBase64}`);\n\n  // Download \u0026 decrypt\n  console.log(\"\\n[2/2] Downloading and decrypting...\");\n  const decrypted = await encryptedBlobClient.download(containerName, blobName);\n  const decryptedText = decrypted.toString(\"utf-8\");\n\n  console.log(`  Decrypted     : \"${decryptedText}\"`);\n\n  // Verify round-trip\n  if (decryptedText === sampleText) {\n    console.log(\"\\n✓ Round-trip succeeded – plaintext matches.\");\n  } else {\n    console.error(\"\\n✗ Round-trip FAILED – plaintext does not match!\");\n    process.exitCode = 1;\n  }\n}\n\nmain().catch((err) =\u003e {\n  console.error(\"Fatal error:\", err);\n  process.exitCode = 1;\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\src\\main.ts"}
```

### 🔧 15. report_intent

**Input:**

```json
{"intent":"Installing and building project"}
```

### 🔧 16. powershell

**Input:**

```json
{"command":"Set-Location \"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\"; npm install 2\u003e\u00261","description":"Install npm dependencies","initial_wait":60}
```

### 🔧 17. powershell

**Input:**

```json
{"command":"Set-Location \"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\"; npx tsc 2\u003e\u00261","description":"Compile TypeScript","initial_wait":30}
```

### 🔧 18. powershell

**Input:**

```json
{"command":"Set-Location \"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\"; node -e \"const kv = require('@azure/keyvault-keys'); console.log(Object.keys(kv).filter(k =\u003e k.toLowerCase().includes('wrap') || k.toLowerCase().includes('algorithm')).join('\\n'))\"","description":"Check available exports"}
```

### 🔧 19. powershell

**Input:**

```json
{"command":"Set-Location \"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\"; node -e \"const kv = require('@azure/keyvault-keys'); console.log(Object.keys(kv).filter(k =\u003e k.toLowerCase().includes('known')).join('\\n'))\"","description":"Check Known* exports"}
```

### 🔧 20. edit

**Input:**

```json
{"new_str":"import { KeyClient, CryptographyClient } from \"@azure/keyvault-keys\";\nimport type { KeyWrapAlgorithm } from \"@azure/keyvault-keys\";","old_str":"import { KeyClient, CryptographyClient, KnownKeyWrapAlgorithm } from \"@azure/keyvault-keys\";","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\src\\keyManager.ts"}
```

### 🔧 21. edit

**Input:**

```json
{"new_str":"import * as crypto from \"crypto\";\nimport { buildCryptographyClient } from \"./config\";\n\nconst WRAP_ALGORITHM: KeyWrapAlgorithm = \"RSA-OAEP-256\";","old_str":"import * as crypto from \"crypto\";\nimport { buildCryptographyClient } from \"./config\";","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\src\\keyManager.ts"}
```

### 🔧 22. edit

**Input:**

```json
{"new_str":"      WRAP_ALGORITHM,\n      plaintextDek","old_str":"      KnownKeyWrapAlgorithm.RSAOaep256,\n      plaintextDek","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\src\\keyManager.ts"}
```

### 🔧 23. edit

**Input:**

```json
{"new_str":"      WRAP_ALGORITHM,\n      wrappedDek","old_str":"      KnownKeyWrapAlgorithm.RSAOaep256,\n      wrappedDek","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\\src\\keyManager.ts"}
```

### 🔧 24. powershell

**Input:**

```json
{"command":"Set-Location \"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840\"; npx tsc 2\u003e\u00261","description":"Compile TypeScript","initial_wait":30}
```

### 🔧 25. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-889407840"}
```

## Generated Files

- `package-lock.json`
- `package.json`
- `src\config.ts`
- `src\encryptedBlobClient.ts`
- `src\keyManager.ts`
- `src\main.ts`
- `tsconfig.json`

## Copilot Response

Empty directory. Let me create all the project files.

Now let me install dependencies and build:

The SDK uses string literal type `KeyWrapAlgorithm` instead. Let me fix:

Build succeeds. Let me verify the final structure:

Project created and compiles cleanly. Here's the structure:

```
src/
  config.ts            – Builds shared DefaultAzureCredential + Key Vault & Blob clients
  keyManager.ts        – Envelope encryption: generate DEK locally, wrap/unwrap via Key Vault
  encryptedBlobClient.ts – AES-256-GCM encrypt/decrypt + Blob Storage upload/download
  main.ts              – Demo round-trip script
```

**Key design points:**
- **Single credential** (`DefaultAzureCredential`) shared across Key Vault and Blob Storage
- **Envelope encryption**: random 256-bit DEK encrypted locally; Key Vault only wraps/unwraps (RSA-OAEP-256) — vault key material never leaves Key Vault
- **AES-256-GCM** with 12-byte IV; the auth tag and IV are stored as blob metadata (lowercase keys for Azure compatibility)
- **Plaintext DEK zeroed** immediately after use
- **Error handling** for missing blobs (404), disabled vault keys, and missing metadata

**Env vars needed:** `KEY_VAULT_URL`, `STORAGE_ACCOUNT_URL`, `KEY_VAULT_KEY_NAME` (and optionally `CONTAINER_NAME`).

## Code Review (LLM-as-Judge)

**Score: 38/40 criteria passed**

### Criteria Results

| Criterion | Result | Reason |
|-----------|--------|--------|
| Code Builds | ✅ | TypeScript code is syntactically correct with proper types, imports, and structure. Compiles without errors. |
| Latest Package Versions | ✅ | Dependencies resolve to current versions: @azure/identity 4.13.1, @azure/keyvault-keys 4.10.0, @azure/storage-blob 12.31.0. |
| Best Practices | ✅ | Uses DefaultAzureCredential, async/await throughout, proper separation of concerns, zeros out sensitive data (plaintextDek.fill(0)). |
| Error Handling | ✅ | Has try-catch blocks with meaningful error messages, handles blob not found (404), wraps Key Vault errors appropriately. |
| Code Quality | ✅ | Clean modular structure, clear separation between config/keyManager/encryptedBlobClient, meaningful names, helpful comments. |
| Correct @azure/ Scoped Packages | ✅ | All dependencies use @azure/ scope: @azure/storage-blob, @azure/keyvault-keys, @azure/identity. No deprecated packages. |
| @azure/identity for Authentication | ✅ | Uses DefaultAzureCredential shared across all clients. Acceptable for demo code per criteria. |
| Client Constructor with Endpoint and Credential | ✅ | All clients constructed correctly: new KeyClient(url, credential), new BlobServiceClient(url, credential), new CryptographyClient(keyId, credential). |
| Async/Await Pattern | ✅ | All async operations use async/await. No .then()/.catch() chains. Top-level async main() with .catch() handler. |
| Pagination with for-await-of | ✅ | No list/query operations in this code. Criterion not applicable, no violations. |
| LRO Pattern (beginXxx + pollUntilDone) | ✅ | No long-running operations in this code. Criterion not applicable, no violations. |
| RestError Exception Handling | ✅ | Catches RestError with statusCode inspection: 'if (err instanceof RestError && err.statusCode === 404)' for blob not found. |
| No Deprecated Packages | ✅ | Only modern @azure/* packages used. No azure-storage, azure-arm-*, ms-rest-*, or other deprecated packages. |
| Logging via @azure/logger | ❌ | No use of @azure/logger or setLogLevel() for SDK diagnostic logging. Missing entirely. |
| package.json with Correct Dependencies | ✅ | Valid package.json with all required @azure/* dependencies, TypeScript 5.7.0, @types/node, and proper tsconfig.json. |
| Uses @azure/keyvault-keys (NOT Secrets) | ✅ | Correctly uses @azure/keyvault-keys package. No @azure/keyvault-secrets dependency. |
| Uses Node.js built-in crypto module | ✅ | Imports and uses Node.js crypto module: 'import * as crypto from "crypto"' for AES-GCM operations. |
| Uses KeyClient and CryptographyClient (NOT SecretClient) | ✅ | Correctly imports and uses KeyClient and CryptographyClient. No SecretClient usage. |
| Constructs CryptographyClient with key ID | ✅ | CryptographyClient constructed with key ID: 'new CryptographyClient(keyId, credential)' in buildCryptographyClient(). |
| Uses CryptographyClient for wrapKey() and unwrapKey() | ✅ | Both operations present: cryptoClient.wrapKey(WRAP_ALGORITHM, plaintextDek) and cryptoClient.unwrapKey(WRAP_ALGORITHM, wrappedDek). |
| Specifies RSA key wrap algorithm | ✅ | Uses 'RSA-OAEP-256' algorithm constant for both wrap and unwrap operations. |
| Key material never leaves Key Vault | ✅ | Wrap/unwrap operations are server-side. Only wrapped DEK is returned and stored. Vault key material remains in Key Vault. |
| Generates random AES-256 DEK locally (32 bytes) | ✅ | Correctly generates DEK: 'crypto.randomBytes(32)' for AES-256. |
| Encrypts data with AES-GCM locally using DEK | ✅ | Uses 'crypto.createCipheriv("aes-256-gcm", plaintextDek, iv)' for local encryption. |
| Wraps DEK via Key Vault wrapKey() | ✅ | Calls cryptoClient.wrapKey(WRAP_ALGORITHM, plaintextDek) to protect DEK. |
| Stores wrapped DEK in blob metadata (base64) | ✅ | Metadata includes 'wrappeddek: wrappedDek.toString("base64")' stored with blob. |
| Stores IV in blob metadata (base64) | ✅ | Metadata includes 'iv: iv.toString("base64")' stored with blob. |
| Stores GCM auth tag in blob metadata (base64) | ✅ | Metadata includes 'authtag: authTag.toString("base64")' - critical for Node.js GCM where auth tag is separate. |
| Stores vault key identifier in blob metadata | ✅ | Metadata includes 'encryptionkeyid: keyId' with full Key Vault key ID including version. |
| Decryption flow: retrieve, unwrap, set auth tag, decrypt | ✅ | Complete flow implemented: reads metadata, unwraps DEK via Key Vault, calls decipher.setAuthTag(), then decrypts locally. |
| Uses AES-GCM (not CBC/ECB) | ✅ | Explicitly uses 'aes-256-gcm' algorithm for both encryption and decryption. |
| Generates random IV for each encryption | ✅ | Generates fresh IV per encryption: 'crypto.randomBytes(IV_BYTES)' where IV_BYTES = 12 (NIST-recommended for GCM). |
| Retrieves auth tag via cipher.getAuthTag() | ✅ | Correctly calls 'cipher.getAuthTag()' after encryption finalize to extract GCM authentication tag. |
| Sets auth tag via decipher.setAuthTag() | ✅ | Correctly calls 'decipher.setAuthTag(authTag)' before decryption finalize - required for GCM verification. |
| Handles Key Vault errors (key disabled, not found) via RestError | ❌ | Key Vault operations have try-catch with descriptive messages, but don't explicitly catch RestError type or check statusCode. Uses generic Error catch. |
| Handles Storage errors (blob not found) via RestError with statusCode | ✅ | Explicitly catches 'if (err instanceof RestError && err.statusCode === 404)' for blob not found scenario. |
| NOT using SecretClient instead of KeyClient/CryptographyClient | ✅ | Correctly uses Keys service, not Secrets service. No SecretClient usage. |
| NOT encrypting data directly with vault key | ✅ | Implements proper envelope encryption pattern. Data encrypted locally with DEK, not directly with vault key. |
| NOT storing raw DEK in plaintext | ✅ | Raw DEK never persisted. Immediately wrapped via Key Vault, then zeroed: 'plaintextDek.fill(0)' in finally blocks. |
| NOT omitting GCM auth tag from blob metadata | ✅ | Auth tag correctly stored in metadata as 'authtag' field. Decryption would fail without it. |

### Summary

Excellent implementation of client-side encryption with Azure Key Vault envelope encryption. The code demonstrates strong understanding of cryptographic patterns: proper AES-256-GCM usage with separate auth tag handling (Node.js-specific), correct Key Vault Keys service usage (not Secrets), complete envelope encryption flow, and appropriate security practices (zeroing sensitive data). Architecture is clean with proper separation of concerns. Minor gaps: missing @azure/logger integration for SDK diagnostics, and Key Vault error handling doesn't explicitly catch RestError type.

### Strengths

- Perfect envelope encryption implementation with proper DEK generation, wrapping, and local AES-GCM encryption
- Correct usage of @azure/keyvault-keys with CryptographyClient for wrap/unwrap operations (not Secrets service)
- Proper Node.js AES-GCM handling: separate auth tag storage/retrieval via getAuthTag()/setAuthTag()
- All critical cryptographic parameters stored in blob metadata (wrapped DEK, IV, auth tag, key ID)
- Security best practices: raw DEK never persisted and zeroed after use with plaintextDek.fill(0)
- Clean modular architecture with separation between config, key management, and blob operations
- Correct Azure SDK patterns: @azure/ scoped packages, endpoint+credential construction, async/await throughout
- Complete round-trip demo that verifies encrypt-upload-download-decrypt flow
- Appropriate error handling for blob not found (RestError with statusCode 404 check)
- Uses latest Azure SDK package versions with proper TypeScript configuration

### Issues

- No @azure/logger usage for SDK diagnostic logging (should implement setLogLevel() or AZURE_LOG_LEVEL environment variable)
- Key Vault error handling catches generic Error instead of explicitly checking for RestError with statusCode inspection

## Grader Results

| Grader | Type | Score | Summary |
|--------|------|-------|----------|
| `claude-sonnet-4.5` | review | 38/40 | Excellent implementation of client-side encryption with Azure Key Vault envelope… |
| 🏆 `claude-sonnet-4.5` | review | 38/40 | Excellent implementation of client-side encryption with Azure Key Vault envelope… |

## Re-run Command

```bash
hyoka run --prompt-id storage-dp-js-ts-encrypted-uploader --config baseline-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
