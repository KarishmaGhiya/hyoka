# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** azure-mcp-skills/gpt-5.4 | **Result:** ❌ FAILED | **Duration:** 51.5s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | azure-mcp-skills/gpt-5.4 |
| Result | ❌ FAILED |
| Duration | 51.5s |
| Timestamp | 2026-05-01T00:45:38Z |
| Files Generated | 0 |
| Event Count | 94 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 51.4s |
| **Total** | **51.5s** |

## Configuration

- **model:** gpt-5.4
- **name:** azure-mcp-skills/gpt-5.4

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.4 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=132860 out=2861 |
| Turn Count | 4 |

## Error

```
0 files generated — agent did not create any files
```

## Prompt Sent

```
Show me how to
use Managed Identity to authenticate Azure SDK clients in Node.js. Cover:
1. System-assigned vs user-assigned managed identity
2. How to create a ManagedIdentityCredential for each type
3. Using it with Azure SDK clients
4. Local development fallback strategies
5. Common pitfalls and error handling

Provide TypeScript examples for both identity types.
```

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Researching Azure auth"}
```

### 🔧 2. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"intent":"Provide TypeScript examples and guidance for using Managed Identity with Azure SDK clients in Node.js","learn":true}
```

### 🔧 3. azure-documentation (via azure)

**Input:**

```json
{"intent":"Find official documentation for using ManagedIdentityCredential with Azure SDK clients in Node.js/TypeScript","learn":true}
```

### 🔧 4. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"command":"get_azure_bestpractices_get","intent":"Get Azure code generation best practices for TypeScript Azure SDK authentication examples","parameters":{"action":"code-generation","resource":"general"}}
```

### 🔧 5. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_search","intent":"Search docs for ManagedIdentityCredential Node.js Azure SDK usage","parameters":{"query":"ManagedIdentityCredential Node.js TypeScript Azure SDK managed identity system-assigned user-assigned"}}
```

### 🔧 6. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_code_sample_search","intent":"Search official code samples for ManagedIdentityCredential in TypeScript","parameters":{"language":"typescript","query":"ManagedIdentityCredential Azure SDK client TypeScript user assigned managed identity clientId"}}
```

### 🔧 7. report_intent

**Input:**

```json
{"intent":"Reviewing Azure docs"}
```

### 🔧 8. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_fetch","intent":"Fetch JavaScript SDK auth best practices page","parameters":{"url":"https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/best-practices"}}
```

### 🔧 9. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_fetch","intent":"Fetch system-assigned managed identity guidance for JavaScript","parameters":{"url":"https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/system-assigned-managed-identity"}}
```

### 🔧 10. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_fetch","intent":"Fetch user-assigned managed identity guidance for JavaScript","parameters":{"url":"https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/user-assigned-managed-identity"}}
```

## Copilot Response

I’m pulling the official Azure guidance and current samples so the examples line up with the SDK’s supported patterns.

Use **`ManagedIdentityCredential` directly in Azure-hosted production code** and keep local auth explicit. For **system-assigned**, create it with **no identity selector**; for **user-assigned**, pass the **managed identity client ID**. Avoid `DefaultAzureCredential` in production because Azure recommends deterministic credentials there.

## 1. System-assigned vs user-assigned

| Type | What it is | When to use |
|---|---|---|
| **System-assigned** | Identity is attached to one Azure resource and deleted with it | One app, one identity |
| **User-assigned** | Standalone identity resource you attach to one or more Azure resources | Shared identity across multiple apps/resources |

## 2. Create `ManagedIdentityCredential`

### System-assigned
```ts
import { ManagedIdentityCredential } from "@azure/identity";

const credential = new ManagedIdentityCredential();
```

### User-assigned
```ts
import { ManagedIdentityCredential } from "@azure/identity";

const clientId = process.env.AZURE_CLIENT_ID;
if (!clientId) {
  throw new Error("AZURE_CLIENT_ID is required for a user-assigned managed identity.");
}

const credential = new ManagedIdentityCredential(clientId);
```

## 3. Use it with Azure SDK clients

### Example: system-assigned identity with Blob Storage
```ts
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const accountName = required("AZURE_STORAGE_ACCOUNT_NAME");
const credential = new ManagedIdentityCredential();

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  credential
);

async function listContainers(): Promise<void> {
  try {
    for await (const container of blobServiceClient.listContainers()) {
      console.log(container.name);
    }
  } catch (error) {
    const err = error as Error & { statusCode?: number; code?: string };
    console.error("Blob operation failed.", {
      name: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
    });
    throw error;
  }
}

void listContainers();
```

### Example: user-assigned identity with Key Vault
```ts
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const vaultName = required("KEY_VAULT_NAME");
const clientId = required("AZURE_CLIENT_ID");

const credential = new ManagedIdentityCredential(clientId);
const secretClient = new SecretClient(
  `https://${vaultName}.vault.azure.net`,
  credential
);

async function readSecret(secretName: string): Promise<void> {
  try {
    const secret = await secretClient.getSecret(secretName);
    console.log(`Secret "${secret.name}" loaded.`);
  } catch (error) {
    const err = error as Error & { statusCode?: number; code?: string };
    console.error("Key Vault operation failed.", {
      name: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
    });
    throw error;
  }
}

void readSecret("my-secret");
```

## 4. Local development fallback strategies

**Best practice:** use **managed identity only in Azure**, and a separate dev credential locally.

### Explicit local fallback
```ts
import {
  AzureCliCredential,
  AzureDeveloperCliCredential,
  ChainedTokenCredential,
  ManagedIdentityCredential,
  TokenCredential,
} from "@azure/identity";

function createCredential(): TokenCredential {
  if (process.env.NODE_ENV === "production") {
    return process.env.AZURE_CLIENT_ID
      ? new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID)
      : new ManagedIdentityCredential();
  }

  return new ChainedTokenCredential(
    new AzureCliCredential(),
    new AzureDeveloperCliCredential()
  );
}
```

### Simpler local option
If you want convenience locally, `DefaultAzureCredential` is fine **for local development only**.

## 5. Common pitfalls and error handling

1. **No RBAC/data-plane permissions**: the identity exists, but it still needs roles like `Storage Blob Data Reader` or `Key Vault Secrets User`.
2. **Wrong identity on a resource with multiple user-assigned identities**: pass `AZURE_CLIENT_ID`.
3. **Using `DefaultAzureCredential` in production**: it can fall through to Azure CLI or other creds and authenticate as the wrong principal.
4. **Trying managed identity locally**: it usually won’t work outside Azure-hosted environments.
5. **Role assignment propagation delay**: new permissions can take a few minutes.
6. **Creating new credentials per request**: reuse one credential instance to avoid extra token requests and throttling.

A small fail-fast startup check helps:
```ts
import { ManagedIdentityCredential } from "@azure/identity";

async function verifyManagedIdentity(): Promise<void> {
  const credential = process.env.AZURE_CLIENT_ID
    ? new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID)
    : new ManagedIdentityCredential();

  await credential.getToken("https://management.azure.com/.default");
}
```

**Install**
```bash
npm install @azure/identity @azure/storage-blob @azure/keyvault-secrets
```

**References**
- https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/best-practices
- https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/system-assigned-managed-identity
- https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/user-assigned-managed-identity
- https://learn.microsoft.com/javascript/api/@azure/identity/managedidentitycredential?view=azure-node-latest

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config azure-mcp-skills/gpt-5.4
```

---

[← Back to Summary](../../../../../../summary.md)
