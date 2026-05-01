# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** azure-mcp/gpt-5.4 | **Result:** ❌ FAILED | **Duration:** 69.1s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | azure-mcp/gpt-5.4 |
| Result | ❌ FAILED |
| Duration | 69.1s |
| Timestamp | 2026-05-01T00:44:57Z |
| Files Generated | 0 |
| Event Count | 116 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 68.8s |
| **Total** | **69.1s** |

## Configuration

- **name:** azure-mcp/gpt-5.4
- **model:** gpt-5.4

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.4 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=183960 out=3637 |
| Turn Count | 5 |

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
{"intent":"Get best practices for Azure SDK managed identity authentication in Node.js/TypeScript examples","learn":true}
```

### 🔧 3. azure-documentation (via azure)

**Input:**

```json
{"intent":"Find official Microsoft documentation for using ManagedIdentityCredential in Node.js/TypeScript with Azure SDK","learn":true}
```

### 🔧 4. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"command":"get_azure_bestpractices_get","intent":"Get best practices for Azure SDK managed identity authentication in Node.js/TypeScript examples","parameters":{"action":"code-generation","resource":"general"}}
```

### 🔧 5. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_search","intent":"Search Microsoft docs for ManagedIdentityCredential Node.js TypeScript Azure SDK","parameters":{"query":"ManagedIdentityCredential Azure SDK for JavaScript TypeScript managed identity system-assigned user-assigned authentication"}}
```

### 🔧 6. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_code_sample_search","intent":"Search official TypeScript code samples for ManagedIdentityCredential","parameters":{"language":"typescript","query":"ManagedIdentityCredential Azure SDK JavaScript TypeScript managed identity user-assigned system-assigned"}}
```

### 🔧 7. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\1777596322841-copilot-tool-output-jjt3my.txt","view_range":[1,120]}
```

### 🔧 8. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_fetch","intent":"Fetch official best practices for Azure SDK authentication in JavaScript","parameters":{"url":"https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/best-practices"}}
```

### 🔧 9. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_fetch","intent":"Fetch official system-assigned managed identity doc for JavaScript","parameters":{"url":"https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/system-assigned-managed-identity"}}
```

### 🔧 10. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_fetch","intent":"Fetch official user-assigned managed identity doc for JavaScript","parameters":{"url":"https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/user-assigned-managed-identity"}}
```

### 🔧 11. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_code_sample_search","intent":"Search official TypeScript code samples for ManagedIdentityCredential resourceId objectId constructors","parameters":{"language":"typescript","query":"ManagedIdentityCredential resourceId objectId TypeScript @azure/identity"}}
```

### 🔧 12. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_search","intent":"Search Microsoft docs for CredentialUnavailableError AuthenticationError ManagedIdentityCredential JavaScript","parameters":{"query":"CredentialUnavailableError AuthenticationError ManagedIdentityCredential JavaScript Azure Identity"}}
```

### 🔧 13. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\1777596328439-copilot-tool-output-j165y7.txt","view_range":[1,140]}
```

## Copilot Response

I’m pulling the official guidance and sample patterns so the examples match current Azure SDK behavior in TypeScript.

I’ve got the current guidance. I’m checking the latest constructor shapes so the user-assigned examples use the right TypeScript form.

Use **`ManagedIdentityCredential` in Azure-hosted code**, and use a **separate local-dev credential path** instead of relying on `DefaultAzureCredential` in production. For managed identity, the only code difference between system-assigned and user-assigned is **how you construct the credential**.

## 1. System-assigned vs user-assigned

| Type | What it is | When to use | Code shape |
| --- | --- | --- | --- |
| **System-assigned** | Identity lives on one Azure resource | One app/resource needs its own identity | `new ManagedIdentityCredential()` |
| **User-assigned** | Standalone identity resource you attach to one or more Azure resources | Multiple apps/resources should share the same identity/permissions | `new ManagedIdentityCredential({ clientId })` |

**Operationally:** after enabling/attaching the identity, you still need to grant it the right **RBAC role** on the target resource.

## 2. Create `ManagedIdentityCredential` for each type

### System-assigned
```ts
import { ManagedIdentityCredential } from "@azure/identity";

const credential = new ManagedIdentityCredential();
```

### User-assigned
Most common: use the **client ID** of the managed identity.

```ts
import { ManagedIdentityCredential } from "@azure/identity";

const clientId = process.env.AZURE_CLIENT_ID;
if (!clientId) {
  throw new Error("AZURE_CLIENT_ID is required for user-assigned managed identity.");
}

const credential = new ManagedIdentityCredential({ clientId });
```

User-assigned also supports identifying by **resourceId** or **objectId**:

```ts
const byResourceId = new ManagedIdentityCredential({
  resourceId: process.env.AZURE_RESOURCE_ID!,
});

const byObjectId = new ManagedIdentityCredential({
  objectId: process.env.AZURE_OBJECT_ID!,
});
```

## 3. Using it with Azure SDK clients

### Example: system-assigned MI with Blob Storage
```ts
import { ManagedIdentityCredential, CredentialUnavailableError } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const accountName = requireEnv("AZURE_STORAGE_ACCOUNT_NAME");
const credential = new ManagedIdentityCredential();

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  credential,
);

async function main(): Promise<void> {
  try {
    const containerClient = blobServiceClient.getContainerClient("my-container");
    const properties = await containerClient.getProperties();
    console.log(properties);
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      console.error("Managed identity isn't available in this environment.");
    } else {
      console.error("Azure SDK call failed:", error);
    }
    throw error;
  }
}

void main();
```

### Example: user-assigned MI with Key Vault
```ts
import {
  ManagedIdentityCredential,
  CredentialUnavailableError,
} from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const vaultUrl = requireEnv("KEY_VAULT_URL");
const clientId = requireEnv("AZURE_CLIENT_ID");

const credential = new ManagedIdentityCredential({
  clientId,
  retryOptions: {
    maxRetries: 3,
    retryDelayInMs: 500,
    maxRetryDelayInMs: 5000,
  },
});

const secretClient = new SecretClient(vaultUrl, credential);

async function main(): Promise<void> {
  try {
    const secret = await secretClient.getSecret("app-config");
    console.log(secret.value);
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      console.error("User-assigned managed identity is unavailable or not attached.");
    } else {
      console.error("Key Vault call failed:", error);
    }
    throw error;
  }
}

void main();
```

## 4. Local development fallback strategies

**Best practice:** be deterministic.

- **Production/Azure:** `ManagedIdentityCredential` only
- **Local dev:** `AzureCliCredential`, `AzureDeveloperCliCredential`, or a small `ChainedTokenCredential`

```ts
import {
  AzureCliCredential,
  AzureDeveloperCliCredential,
  ChainedTokenCredential,
  ManagedIdentityCredential,
  TokenCredential,
} from "@azure/identity";

export function createCredential(): TokenCredential {
  if (process.env.NODE_ENV === "production") {
    return process.env.AZURE_CLIENT_ID
      ? new ManagedIdentityCredential({ clientId: process.env.AZURE_CLIENT_ID })
      : new ManagedIdentityCredential();
  }

  return new ChainedTokenCredential(
    new AzureCliCredential(),
    new AzureDeveloperCliCredential(),
  );
}
```

Avoid `DefaultAzureCredential` in production because it can silently fall through to another credential source if managed identity stops working.

## 5. Common pitfalls and error handling

1. **Identity enabled but no RBAC**: authentication succeeds, service call gets **403**.
2. **User-assigned identity not attached**: token acquisition fails even if the identity exists.
3. **Wrong identifier**: using the wrong `clientId`, `resourceId`, or `objectId`.
4. **Using managed identity locally**: it usually won’t exist on your laptop.
5. **Using `DefaultAzureCredential` in production**: can unexpectedly authenticate with Azure CLI or another source.
6. **Creating many credential instances**: reuse one credential instance per app when possible.
7. **Transient IMDS/endpoint issues**: use retry options on `ManagedIdentityCredential` for resilience.

A practical catch pattern:

```ts
import {
  AuthenticationError,
  CredentialUnavailableError,
} from "@azure/identity";

try {
  // Azure SDK call
} catch (error) {
  if (error instanceof CredentialUnavailableError) {
    console.error("No managed identity endpoint/identity available.");
  } else if (error instanceof AuthenticationError) {
    console.error("Token request reached Entra ID but authentication failed.");
  } else {
    console.error("Service call or authorization failure:", error);
  }
  throw error;
}
```

**References**
- https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/system-assigned-managed-identity
- https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/user-assigned-managed-identity
- https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/best-practices
- https://learn.microsoft.com/javascript/api/@azure/identity/managedidentitycredential?view=azure-node-latest
- https://learn.microsoft.com/javascript/api/@azure/identity/credentialunavailableerror?view=azure-node-latest

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config azure-mcp/gpt-5.4
```

---

[← Back to Summary](../../../../../../summary.md)
