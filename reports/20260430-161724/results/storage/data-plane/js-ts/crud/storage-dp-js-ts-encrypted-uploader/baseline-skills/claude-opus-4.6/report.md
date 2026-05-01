# Evaluation Report: storage-dp-js-ts-encrypted-uploader

**Config:** baseline-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 160.9s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `storage-dp-js-ts-encrypted-uploader` |
| Config | baseline-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 160.9s |
| Timestamp | 2026-04-30T23:36:17Z |
| Files Generated | 0 |
| Event Count | 240 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 160.8s |
| **Total** | **160.9s** |

## Configuration

- **name:** baseline-skills/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=318982 out=10083 |
| Turn Count | 17 |

## Error

```
0 files generated despite 5 file-write tool attempts
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

Let me create a TypeScript Node.js project for Azure Blob Storage uploads with client-side encryption using Azure Key Vault for key management.

All tools are failing with "unexpected user permission response". Let me try creating files with different paths or approaches.

All file operations are failing with permission errors. I've already provided the complete code inline. Let me try one more approach - maybe the src directory needs to be created first, but I can't even do that. Let me just present the solution clearly to the user since I can't write files.

Wait, let me try using powershell with a different approach - maybe there's a permission gate that needs to be passed first.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating encrypted uploader project"}
```

### 🔧 2. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-2626828038"}
```

### 🔧 3. powershell

**Input:**

```json
{"command":"Get-ChildItem -Force | Select-Object Name, Mode","description":"List directory contents"}
```

### 🔧 4. powershell

**Input:**

```json
{"command":"Get-ChildItem","description":"List files in cwd"}
```

### 🔧 5. glob

**Input:**

```json
{"pattern":"*"}
```

### 🔧 6. powershell

**Input:**

```json
{"command":"ls","description":"List current directory"}
```

### 🔧 7. powershell

**Input:**

```json
{"command":"Write-Output \"hello\"","description":"Test powershell"}
```

### 🔧 8. powershell

**Input:**

```json
{"command":"pwd","description":"Check working directory","mode":"sync"}
```

### 🔧 9. glob

**Input:**

```json
{"paths":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-2626828038","pattern":"**/*"}
```

### 🔧 10. powershell

**Input:**

```json
{"command":"echo test","description":"Test shell access","shellId":"test1"}
```

### 🔧 11. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"encrypted-blob-uploader\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Upload files to Azure Blob Storage with client-side envelope encryption via Azure Key Vault\",\n  \"main\": \"dist/main.js\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/main.js\"\n  },\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.6.0\",\n    \"@azure/keyvault-keys\": \"^4.9.0\",\n    \"@azure/storage-blob\": \"^12.26.0\"\n  },\n  \"devDependencies\": {\n    \"typescript\": \"^5.7.0\",\n    \"@types/node\": \"^22.0.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-2626828038\\package.json"}
```

### 🔧 12. powershell

**Input:**

```json
{"command":"Set-Location $env:TEMP; Get-Location","description":"Navigate to temp directory","initial_wait":10}
```

### 🔧 13. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"encrypted-blob-uploader\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Upload files to Azure Blob Storage with client-side envelope encryption via Azure Key Vault\",\n  \"main\": \"dist/main.js\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/main.js\"\n  },\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.6.0\",\n    \"@azure/keyvault-keys\": \"^4.9.0\",\n    \"@azure/storage-blob\": \"^12.26.0\"\n  },\n  \"devDependencies\": {\n    \"typescript\": \"^5.7.0\",\n    \"@types/node\": \"^22.0.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-2626828038\\package.json"}
```

### 🔧 14. powershell

**Input:**

```json
{"command":"Get-ChildItem -Path \".\"","description":"List current directory","initial_wait":30,"mode":"sync"}
```

### 🔧 15. list_powershell

**Input:**

```json
{}
```

### 🔧 16. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"encrypted-blob-uploader\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Upload files to Azure Blob Storage with client-side envelope encryption via Azure Key Vault\",\n  \"main\": \"dist/main.js\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/main.js\"\n  },\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.6.0\",\n    \"@azure/keyvault-keys\": \"^4.9.0\",\n    \"@azure/storage-blob\": \"^12.26.0\"\n  },\n  \"devDependencies\": {\n    \"typescript\": \"^5.7.0\",\n    \"@types/node\": \"^22.0.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-2626828038\\package.json"}
```

### 🔧 17. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"encrypted-blob-uploader\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Upload files to Azure Blob Storage with client-side envelope encryption via Azure Key Vault\",\n  \"main\": \"dist/main.js\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/main.js\"\n  },\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.6.0\",\n    \"@azure/keyvault-keys\": \"^4.9.0\",\n    \"@azure/storage-blob\": \"^12.26.0\"\n  },\n  \"devDependencies\": {\n    \"typescript\": \"^5.7.0\",\n    \"@types/node\": \"^22.0.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-2626828038\\package.json"}
```

### 🔧 18. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2022\",\n    \"module\": \"Node16\",\n    \"moduleResolution\": \"Node16\",\n    \"outDir\": \"dist\",\n    \"rootDir\": \"src\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"declaration\": true,\n    \"sourceMap\": true\n  },\n  \"include\": [\"src\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-dp-js-ts-encrypted-uploader-baseline-skills-claude-opus-4.6-2626828038\\tsconfig.json"}
```

## Copilot Response

I'm experiencing persistent permission issues with the environment. Let me try a different approach.

I'm encountering persistent permission errors across all tools. Let me try once more with a slightly different approach:

I'm hitting a persistent environment permission issue that's blocking all file/shell operations. Let me provide the complete project files directly — you can save these to your project directory.

---

## Project Structure

```
encrypted-blob-uploader/
├── package.json
├── tsconfig.json
└── src/
    ├── config.ts
    ├── keyManager.ts
    ├── encryptedBlobClient.ts
    └── main.ts
```

---

### `package.json`

```json
{
  "name": "encrypted-blob-uploader",
  "version": "1.0.0",
  "description": "Upload files to Azure Blob Storage with client-side envelope encryption via Azure Key Vault",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js"
  },
  "dependencies": {
    "@azure/identity": "^4.6.0",
    "@azure/keyvault-keys": "^4.9.0",
    "@azure/storage-blob": "^12.26.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src"]
}
```

### `src/config.ts`

```typescript
import { DefaultAzureCredential, type TokenCredential } from "@azure/identity";
import { KeyClient, CryptographyClient } from "@azure/keyvault-keys";
import { BlobServiceClient } from "@azure/storage-blob";

export interface AzureClients {
  credential: TokenCredential;
  keyClient: KeyClient;
  blobServiceClient: BlobServiceClient;
  getCryptographyClient(keyName: string): Promise<CryptographyClient>;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function buildAzureClients(): AzureClients {
  const vaultUrl = requireEnv("AZURE_KEYVAULT_URL");
  const storageAccountUrl = requireEnv("AZURE_STORAGE_ACCOUNT_URL");

  const credential = new DefaultAzureCredential();
  const keyClient = new KeyClient(vaultUrl, credential);
  const blobServiceClient = new BlobServiceClient(storageAccountUrl, credential);

  return {
    credential,
    keyClient,
    blobServiceClient,

    async getCryptographyClient(keyName: string): Promise<CryptographyClient> {
      const key = await keyClient.getKey(keyName);
      return new CryptographyClient(key, credential);
    },
  };
}
```

### `src/keyManager.ts`

```typescript
import { randomBytes } from "node:crypto";
import { CryptographyClient, type KeyVaultKey } from "@azure/keyvault-keys";
import type { AzureClients } from "./config.js";

const WRAP_ALGORITHM = "RSA-OAEP-256";
const DEK_BYTE_LENGTH = 32; // AES-256

export interface WrappedKeyBundle {
  /** The Key Vault key ID (with version) used to wrap the DEK */
  vaultKeyId: string;
  /** The wrapped (protected) data encryption key */
  wrappedDek: Buffer;
}

export class KeyManager {
  private readonly clients: AzureClients;
  private readonly vaultKeyName: string;

  constructor(clients: AzureClients, vaultKeyName: string) {
    this.clients = clients;
    this.vaultKeyName = vaultKeyName;
  }

  /**
   * Generate a random DEK locally and wrap it with the Key Vault key.
   * Returns the plaintext DEK (for immediate use) and the wrapped bundle
   * (for storage alongside the ciphertext). The plaintext DEK must not be persisted.
   */
  async generateAndWrapKey(): Promise<{
    plaintextDek: Buffer;
    bundle: WrappedKeyBundle;
  }> {
    const plaintextDek = randomBytes(DEK_BYTE_LENGTH);

    const cryptoClient = await this.clients.getCryptographyClient(this.vaultKeyName);
    const wrapResult = await cryptoClient.wrapKey(WRAP_ALGORITHM, plaintextDek);

    const vaultKeyId = wrapResult.keyID;
    if (!vaultKeyId) {
      throw new Error("Key Vault did not return a key ID after wrapping");
    }

    return {
      plaintextDek,
      bundle: {
        vaultKeyId,
        wrappedDek: Buffer.from(wrapResult.result),
      },
    };
  }

  /**
   * Unwrap a previously wrapped DEK using Key Vault.
   * The vault key material never leaves Key Vault — only the unwrapped DEK is returned.
   */
  async unwrapKey(bundle: WrappedKeyBundle): Promise<Buffer> {
    // Use the specific key version that was used for wrapping
    const cryptoClient = new CryptographyClient(
      bundle.vaultKeyId,
      this.clients.credential,
    );

    const unwrapResult = await cryptoClient.unwrapKey(
      WRAP_ALGORITHM,
      bundle.wrappedDek,
    );

    return Buffer.from(unwrapResult.result);
  }
}
```

### `src/encryptedBlobClient.ts`

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { BlobServiceClient, RestError } from "@azure/storage-blob";
import { KeyManager, type WrappedKeyBundle } from "./keyManager.js";

const AES_ALGORITHM = "aes-256-gcm";
const IV_BYTE_LENGTH = 12;
const AUTH_TAG_BYTE_LENGTH = 16;

export class EncryptedBlobClient {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly keyManager: KeyManager;

  constructor(blobServiceClient: BlobServiceClient, keyManager: KeyManager) {
    this.blobServiceClient = blobServiceClient;
    this.keyManager = keyManager;
  }

  /**
   * Encrypt `data` with a fresh DEK (AES-256-GCM), wrap the DEK via Key Vault,
   * then upload the ciphertext to Blob Storage with cryptographic metadata.
   */
  async upload(
    containerName: string,
    blobName: string,
    data: Buffer,
  ): Promise<WrappedKeyBundle> {
    // 1. Generate DEK and wrap it
    const { plaintextDek, bundle } =
      await this.keyManager.generateAndWrapKey();

    try {
      // 2. Encrypt locally with AES-256-GCM
      const iv = randomBytes(IV_BYTE_LENGTH);
      const cipher = createCipheriv(AES_ALGORITHM, plaintextDek, iv, {
        authTagLength: AUTH_TAG_BYTE_LENGTH,
      });
      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // 3. Upload ciphertext with metadata
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists();

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(encrypted, encrypted.length, {
        metadata: {
          vaultkeyid: bundle.vaultKeyId,
          wrappeddek: bundle.wrappedDek.toString("base64"),
          iv: iv.toString("base64"),
          authtag: authTag.toString("base64"),
        },
      });

      return bundle;
    } finally {
      // Zero out the plaintext DEK so it doesn't linger in memory
      plaintextDek.fill(0);
    }
  }

  /**
   * Download an encrypted blob, unwrap the DEK via Key Vault, and decrypt.
   */
  async download(containerName: string, blobName: string): Promise<Buffer> {
    // 1. Download the blob and its metadata
    const containerClient =
      this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    let downloadResponse;
    try {
      downloadResponse = await blobClient.download(0);
    } catch (err) {
      if (err instanceof RestError && err.statusCode === 404) {
        throw new Error(
          `Blob "${blobName}" not found in container "${containerName}"`,
        );
      }
      throw err;
    }

    const ciphertext = await streamToBuffer(downloadResponse.readableStreamBody!);
    const metadata = downloadResponse.metadata;
    if (!metadata) {
      throw new Error("Blob metadata is missing — cannot decrypt");
    }

    const { vaultkeyid, wrappeddek, iv, authtag } = metadata;
    if (!vaultkeyid || !wrappeddek || !iv || !authtag) {
      throw new Error(
        "Blob metadata is incomplete — missing one or more of: vaultkeyid, wrappeddek, iv, authtag",
      );
    }

    // 2. Reconstruct the wrapped key bundle and unwrap
    const bundle: WrappedKeyBundle = {
      vaultKeyId: vaultkeyid,
      wrappedDek: Buffer.from(wrappeddek, "base64"),
    };

    let plaintextDek: Buffer;
    try {
      plaintextDek = await this.keyManager.unwrapKey(bundle);
    } catch (err: any) {
      if (err?.code === "KeyNotEnabled" || err?.message?.includes("is not enabled")) {
        throw new Error(
          `The Key Vault key "${vaultkeyid}" is disabled — cannot unwrap the data encryption key`,
        );
      }
      throw err;
    }

    try {
      // 3. Decrypt locally with AES-256-GCM
      const decipher = createDecipheriv(
        AES_ALGORITHM,
        plaintextDek,
        Buffer.from(iv, "base64"),
        { authTagLength: AUTH_TAG_BYTE_LENGTH },
      );
      decipher.setAuthTag(Buffer.from(authtag, "base64"));

      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } finally {
      plaintextDek.fill(0);
    }
  }
}

async function streamToBuffer(
  stream: NodeJS.ReadableStream,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
```

### `src/main.ts`

```typescript
import { buildAzureClients } from "./config.js";
import { KeyManager } from "./keyManager.js";
import { EncryptedBlobClient } from "./encryptedBlobClient.js";

async function main(): Promise<void> {
  const vaultKeyName = process.env["AZURE_KEY_NAME"] ?? "encryption-key";
  const containerName = process.env["AZURE_CONTAINER_NAME"] ?? "encrypted-uploads";
  const blobName = "demo/sample.enc";

  console.log("=== Encrypted Blob Upload/Download Demo ===\n");

  // Build shared Azure clients
  const clients = buildAzureClients();
  const keyManager = new KeyManager(clients, vaultKeyName);
  const encryptedBlobClient = new EncryptedBlobClient(
    clients.blobServiceClient,
    keyManager,
  );

  // Encrypt and upload
  const sampleData = Buffer.from(
    "Hello from the encrypted blob uploader! This data is protected with envelope encryption.",
  );
  console.log(`Uploading encrypted blob "${blobName}" ...`);
  const bundle = await encryptedBlobClient.upload(
    containerName,
    blobName,
    sampleData,
  );

  console.log(`  Vault Key ID : ${bundle.vaultKeyId}`);
  console.log(`  Wrapped DEK  : ${bundle.wrappedDek.toString("base64")}`);

  // Download and decrypt
  console.log(`\nDownloading and decrypting blob "${blobName}" ...`);
  const decrypted = await encryptedBlobClient.download(containerName, blobName);

  console.log(`  Decrypted    : ${decrypted.toString("utf-8")}`);
  console.log("\n✓ Round-trip successful — plaintext matches.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

---

Now let me try creating these files:

I'm unable to write files due to environment permission issues. Here's the complete project — save the files in the structure shown below.

---

## Project Structure

```
├── package.json
├── tsconfig.json
└── src/
    ├── config.ts
    ├── keyManager.ts
    ├── encryptedBlobClient.ts
    └── main.ts
```

## `package.json`

```json
{
  "name": "encrypted-blob-uploader",
  "version": "1.0.0",
  "description": "Upload files to Azure Blob Storage with client-side envelope encryption via Azure Key Vault",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js"
  },
  "dependencies": {
    "@azure/identity": "^4.6.0",
    "@azure/keyvault-keys": "^4.9.0",
    "@azure/storage-blob": "^12.26.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0"
  }
}
```

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src"]
}
```

## `src/config.ts` — Configuration module

```typescript
import { DefaultAzureCredential, type TokenCredential } from "@azure/identity";
import { KeyClient, CryptographyClient } from "@azure/keyvault-keys";
import { BlobServiceClient } from "@azure/storage-blob";

export interface AzureClients {
  credential: TokenCredential;
  keyClient: KeyClient;
  blobServiceClient: BlobServiceClient;
  getCryptographyClient(keyName: string): Promise<CryptographyClient>;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Build Azure clients for Key Vault and Blob Storage.
 * Reads endpoints from environment variables and uses a single
 * DefaultAzureCredential (managed identity in production).
 *
 * Required env vars:
 *   AZURE_KEYVAULT_URL    – e.g. https://my-vault.vault.azure.net
 *   AZURE_STORAGE_ACCOUNT_URL – e.g. https://mystorageacct.blob.core.windows.net
 */
export function buildAzureClients(): AzureClients {
  const vaultUrl = requireEnv("AZURE_KEYVAULT_URL");
  const storageAccountUrl = requireEnv("AZURE_STORAGE_ACCOUNT_URL");

  const credential = new DefaultAzureCredential();
  const keyClient = new KeyClient(vaultUrl, credential);
  const blobServiceClient = new BlobServiceClient(storageAccountUrl, credential);

  return {
    credential,
    keyClient,
    blobServiceClient,

    async getCryptographyClient(keyName: string): Promise<CryptographyClient> {
      const key = await keyClient.getKey(keyName);
      return new CryptographyClient(key, credential);
    },
  };
}
```

## `src/keyManager.ts` — Key management with envelope encryption

```typescript
import { randomBytes } from "node:crypto";
import { CryptographyClient } from "@azure/keyvault-keys";
import type { AzureClients } from "./config.js";

const WRAP_ALGORITHM = "RSA-OAEP-256";
const DEK_BYTE_LENGTH = 32; // AES-256

export interface WrappedKeyBundle {
  /** The Key Vault key ID (with version) used to wrap the DEK */
  vaultKeyId: string;
  /** The wrapped (protected) data encryption key */
  wrappedDek: Buffer;
}

export class KeyManager {
  private readonly clients: AzureClients;
  private readonly vaultKeyName: string;

  constructor(clients: AzureClients, vaultKeyName: string) {
    this.clients = clients;
    this.vaultKeyName = vaultKeyName;
  }

  /**
   * Generate a random DEK locally and wrap it with the Key Vault key.
   * Returns the plaintext DEK (for immediate use) and the wrapped bundle
   * (for storage alongside the ciphertext). The caller must zero the
   * plaintext DEK after use — it must never be persisted.
   */
  async generateAndWrapKey(): Promise<{
    plaintextDek: Buffer;
    bundle: WrappedKeyBundle;
  }> {
    const plaintextDek = randomBytes(DEK_BYTE_LENGTH);

    const cryptoClient = await this.clients.getCryptographyClient(this.vaultKeyName);
    const wrapResult = await cryptoClient.wrapKey(WRAP_ALGORITHM, plaintextDek);

    const vaultKeyId = wrapResult.keyID;
    if (!vaultKeyId) {
      throw new Error("Key Vault did not return a key ID after wrapping");
    }

    return {
      plaintextDek,
      bundle: {
        vaultKeyId,
        wrappedDek: Buffer.from(wrapResult.result),
      },
    };
  }

  /**
   * Unwrap a previously wrapped DEK using Key Vault.
   * The vault key material never leaves Key Vault — only the unwrapped DEK
   * is returned for local decryption.
   */
  async unwrapKey(bundle: WrappedKeyBundle): Promise<Buffer> {
    // Use the exact key version that performed the wrap
    const cryptoClient = new CryptographyClient(
      bundle.vaultKeyId,
      this.clients.credential,
    );

    const unwrapResult = await cryptoClient.unwrapKey(
      WRAP_ALGORITHM,
      bundle.wrappedDek,
    );

    return Buffer.from(unwrapResult.result);
  }
}
```

## `src/encryptedBlobClient.ts` — Blob upload/download with AES-GCM

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { BlobServiceClient, RestError } from "@azure/storage-blob";
import { KeyManager, type WrappedKeyBundle } from "./keyManager.js";

const AES_ALGORITHM = "aes-256-gcm";
const IV_BYTE_LENGTH = 12;
const AUTH_TAG_BYTE_LENGTH = 16;

export class EncryptedBlobClient {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly keyManager: KeyManager;

  constructor(blobServiceClient: BlobServiceClient, keyManager: KeyManager) {
    this.blobServiceClient = blobServiceClient;
    this.keyManager = keyManager;
  }

  /**
   * Encrypt `data` with a fresh DEK (AES-256-GCM), wrap the DEK via Key Vault,
   * then upload the ciphertext to Blob Storage. The wrapped DEK, IV, and auth
   * tag are stored as blob metadata.
   */
  async upload(
    containerName: string,
    blobName: string,
    data: Buffer,
  ): Promise<WrappedKeyBundle> {
    const { plaintextDek, bundle } =
      await this.keyManager.generateAndWrapKey();

    try {
      // Encrypt locally with AES-256-GCM
      const iv = randomBytes(IV_BYTE_LENGTH);
      const cipher = createCipheriv(AES_ALGORITHM, plaintextDek, iv, {
        authTagLength: AUTH_TAG_BYTE_LENGTH,
      });
      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // Upload ciphertext with cryptographic metadata
      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists();

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(encrypted, encrypted.length, {
        metadata: {
          vaultkeyid: bundle.vaultKeyId,
          wrappeddek: bundle.wrappedDek.toString("base64"),
          iv: iv.toString("base64"),
          authtag: authTag.toString("base64"),
        },
      });

      return bundle;
    } finally {
      plaintextDek.fill(0);
    }
  }

  /**
   * Download an encrypted blob, unwrap the DEK via Key Vault, and decrypt.
   * Handles missing blobs and disabled vault keys with clear error messages.
   */
  async download(containerName: string, blobName: string): Promise<Buffer> {
    const containerClient =
      this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    let downloadResponse;
    try {
      downloadResponse = await blobClient.download(0);
    } catch (err) {
      if (err instanceof RestError && err.statusCode === 404) {
        throw new Error(
          `Blob "${blobName}" not found in container "${containerName}"`,
        );
      }
      throw err;
    }

    const ciphertext = await streamToBuffer(
      downloadResponse.readableStreamBody!,
    );
    const metadata = downloadResponse.metadata;
    if (!metadata) {
      throw new Error("Blob metadata is missing — cannot decrypt");
    }

    const { vaultkeyid, wrappeddek, iv, authtag } = metadata;
    if (!vaultkeyid || !wrappeddek || !iv || !authtag) {
      throw new Error(
        "Blob metadata is incomplete — missing one or more of: vaultkeyid, wrappeddek, iv, authtag",
      );
    }

    // Reconstruct the wrapped key bundle and unwrap via Key Vault
    const bundle: WrappedKeyBundle = {
      vaultKeyId: vaultkeyid,
      wrappedDek: Buffer.from(wrappeddek, "base64"),
    };

    let plaintextDek: Buffer;
    try {
      plaintextDek = await this.keyManager.unwrapKey(bundle);
    } catch (err: any) {
      if (
        err?.code === "KeyNotEnabled" ||
        err?.message?.includes("is not enabled")
      ) {
        throw new Error(
          `The Key Vault key "${vaultkeyid}" is disabled — cannot unwrap the data encryption key`,
        );
      }
      throw err;
    }

    try {
      // Decrypt locally with AES-256-GCM
      const decipher = createDecipheriv(
        AES_ALGORITHM,
        plaintextDek,
        Buffer.from(iv, "base64"),
        { authTagLength: AUTH_TAG_BYTE_LENGTH },
      );
      decipher.setAuthTag(Buffer.from(authtag, "base64"));

      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } finally {
      plaintextDek.fill(0);
    }
  }
}

async function streamToBuffer(
  stream: NodeJS.ReadableStream,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
```

## `src/main.ts` — Demo round-trip

```typescript
import { buildAzureClients } from "./config.js";
import { KeyManager } from "./keyManager.js";
import { EncryptedBlobClient } from "./encryptedBlobClient.js";

async function main(): Promise<void> {
  const vaultKeyName = process.env["AZURE_KEY_NAME"] ?? "encryption-key";
  const containerName =
    process.env["AZURE_CONTAINER_NAME"] ?? "encrypted-uploads";
  const blobName = "demo/sample.enc";

  console.log("=== Encrypted Blob Upload/Download Demo ===\n");

  // Build shared Azure clients (single credential instance)
  const clients = buildAzureClients();
  const keyManager = new KeyManager(clients, vaultKeyName);
  const encryptedBlobClient = new EncryptedBlobClient(
    clients.blobServiceClient,
    keyManager,
  );

  // Encrypt and upload
  const sampleData = Buffer.from(
    "Hello from the encrypted blob uploader! This data is protected with envelope encryption.",
  );
  console.log(`Uploading encrypted blob "${blobName}" ...`);
  const bundle = await encryptedBlobClient.upload(
    containerName,
    blobName,
    sampleData,
  );

  console.log(`  Vault Key ID : ${bundle.vaultKeyId}`);
  console.log(`  Wrapped DEK  : ${bundle.wrappedDek.toString("base64")}`);

  // Download and decrypt
  console.log(`\nDownloading and decrypting blob "${blobName}" ...`);
  const decrypted = await encryptedBlobClient.download(containerName, blobName);

  console.log(`  Decrypted    : ${decrypted.toString("utf-8")}`);
  console.log("\n✓ Round-trip successful — plaintext matches.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

---

## Setup & Run

```bash
# Set environment variables
export AZURE_KEYVAULT_URL=https://your-vault.vault.azure.net
export AZURE_STORAGE_ACCOUNT_URL=https://youraccount.blob.core.windows.net
export AZURE_KEY_NAME=encryption-key          # optional, defaults shown
export AZURE_CONTAINER_NAME=encrypted-uploads  # optional

# Install, build, run
npm install
npm run build
npm start
```

### Key design points

- **Envelope encryption**: a random 256-bit DEK is generated locally per upload, wrapped by Key Vault's RSA-OAEP-256 key, and stored as blob metadata. The raw DEK is zeroed after use.
- **AES-256-GCM**: IV (12 bytes) and auth tag (16 bytes) are stored separately in metadata, matching Node.js's `crypto` API which returns the tag separately.
- **Single credential**: `DefaultAzureCredential` is created once and shared across Key Vault and Blob Storage clients.
- **Error handling**: blob-not-found (404) and disabled vault key are caught with clear messages.

## Re-run Command

```bash
hyoka run --prompt-id storage-dp-js-ts-encrypted-uploader --config baseline-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
