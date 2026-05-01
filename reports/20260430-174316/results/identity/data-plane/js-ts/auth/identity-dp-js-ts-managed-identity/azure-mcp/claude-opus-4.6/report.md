# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** azure-mcp/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 50.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | azure-mcp/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 50.7s |
| Timestamp | 2026-05-01T00:44:57Z |
| Files Generated | 0 |
| Event Count | 56 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 50.6s |
| **Total** | **50.7s** |

## Configuration

- **model:** claude-opus-4.6
- **name:** azure-mcp/claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=115651 out=2115 |
| Turn Count | 3 |

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

## Copilot Reasoning

The user is asking for educational content about using Managed Identity with Azure SDK in Node.js/TypeScript. This is a knowledge question, not a code task. Let me provide a comprehensive answer.

Let me check if there's relevant Azure documentation I can reference.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Researching managed identity"}
```

### 🔧 2. azure-documentation (via azure)

**Input:**

```json
{"intent":"Managed Identity authentication Azure SDK Node.js TypeScript ManagedIdentityCredential","learn":true}
```

### 🔧 3. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_search","intent":"Search for managed identity Node.js TypeScript documentation","parameters":{"query":"ManagedIdentityCredential Node.js TypeScript Azure SDK system-assigned user-assigned"}}
```

### 🔧 4. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_code_sample_search","intent":"Search for code samples for managed identity in TypeScript","parameters":{"language":"typescript","query":"ManagedIdentityCredential DefaultAzureCredential TypeScript Node.js"}}
```

## Copilot Response

Here's a comprehensive guide to using Managed Identity with Azure SDK in Node.js/TypeScript.

---

## Managed Identity Authentication with Azure SDK (Node.js/TypeScript)

### Install

```bash
npm install @azure/identity @azure/keyvault-secrets @azure/storage-blob
```

---

### 1. System-Assigned vs User-Assigned Managed Identity

| | System-Assigned | User-Assigned |
|---|---|---|
| **Lifecycle** | Tied to the Azure resource | Independent resource |
| **Sharing** | One per resource | Can be shared across resources |
| **Deletion** | Deleted with the resource | Must be deleted separately |
| **Use case** | Single-resource, simple scenarios | Multi-resource, shared identity |

---

### 2. Creating `ManagedIdentityCredential`

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// ── System-assigned ── no arguments needed
const systemCredential = new ManagedIdentityCredential();

// ── User-assigned ── provide ONE identifier:

// Option A: by client ID
const byClientId = new ManagedIdentityCredential({
  clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
});

// Option B: by resource ID (full ARM path)
const byResourceId = new ManagedIdentityCredential({
  resourceId:
    "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.ManagedIdentity/userAssignedIdentities/<name>",
});

// Option C: by object (principal) ID
const byObjectId = new ManagedIdentityCredential({
  objectId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
});
```

---

### 3. Using with Azure SDK Clients

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { BlobServiceClient } from "@azure/storage-blob";

// Create ONE credential, reuse across clients (best practice)
const credential = new ManagedIdentityCredential({
  clientId: process.env.AZURE_CLIENT_ID!,
});

// Key Vault
const secretClient = new SecretClient(
  "https://my-vault.vault.azure.net",
  credential
);
const secret = await secretClient.getSecret("my-secret");

// Blob Storage
const blobClient = new BlobServiceClient(
  "https://myaccount.blob.core.windows.net",
  credential
);
for await (const container of blobClient.listContainers()) {
  console.log(container.name);
}
```

---

### 4. Local Development Fallback

Managed Identity only works on Azure. Use environment detection to switch credentials:

```typescript
import {
  DefaultAzureCredential,
  ManagedIdentityCredential,
  ChainedTokenCredential,
  AzureCliCredential,
  type TokenCredential,
} from "@azure/identity";

// ── Strategy A: Environment-based switch (recommended)
function getCredential(): TokenCredential {
  if (process.env.NODE_ENV === "production") {
    return new ManagedIdentityCredential({
      clientId: process.env.AZURE_CLIENT_ID!,
    });
  }
  // Falls back through: EnvCredential → CLI → VS Code → etc.
  return new DefaultAzureCredential();
}

// ── Strategy B: ChainedTokenCredential (explicit fallback order)
const credential = new ChainedTokenCredential(
  new ManagedIdentityCredential({ clientId: process.env.AZURE_CLIENT_ID! }),
  new AzureCliCredential() // fallback for local dev
);

// ── Strategy C: DefaultAzureCredential with managed identity hint
//    Works in both local and Azure (tries MI first when available)
const credential2 = new DefaultAzureCredential({
  managedIdentityClientId: process.env.AZURE_CLIENT_ID,
});
```

> **Tip:** For local dev, run `az login` first so `AzureCliCredential` / `DefaultAzureCredential` can pick up your session.

---

### 5. Common Pitfalls & Error Handling

```typescript
import { ManagedIdentityCredential, AuthenticationError } from "@azure/identity";
import { RestError } from "@azure/core-rest-pipeline";

async function accessSecret(): Promise<string> {
  const credential = new ManagedIdentityCredential();
  const secretClient = new SecretClient(
    "https://my-vault.vault.azure.net",
    credential
  );

  try {
    const secret = await secretClient.getSecret("my-secret");
    return secret.value!;
  } catch (err) {
    if (err instanceof AuthenticationError) {
      // ❌ Pitfall 1: RBAC not configured
      //    Fix: Assign the identity a role (e.g., "Key Vault Secrets User")
      console.error("Auth failed — check RBAC role assignments:", err.message);
    } else if (err instanceof RestError && err.statusCode === 403) {
      // ❌ Pitfall 2: Access policy missing (Key Vault access-policy mode)
      console.error("Forbidden — add an access policy for this identity");
    } else if (
      err instanceof Error &&
      err.message.includes("ManagedIdentityCredential")
    ) {
      // ❌ Pitfall 3: Not running on Azure (no IMDS endpoint)
      console.error("Managed Identity unavailable — are you running locally?");
    }
    throw err;
  }
}
```

**Common pitfalls checklist:**

| Pitfall | Fix |
|---|---|
| Forgot to assign RBAC role to the identity | Use `az role assignment create` for each target resource |
| Using MI locally (no IMDS endpoint) | Use `DefaultAzureCredential` or env-based switching |
| Creating multiple credential instances | Create **one** and reuse across all SDK clients |
| User-assigned MI without specifying `clientId` | Always pass `clientId`, `resourceId`, or `objectId` |
| Wrong audience/scope | Ensure the resource URL matches the service (e.g., `https://storage.azure.com/.default`) |

---

**Docs:**
- [System-assigned MI (TS)](https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/system-assigned-managed-identity)
- [User-assigned MI (TS)](https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/user-assigned-managed-identity)
- [Best practices](https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/best-practices)

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config azure-mcp/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
