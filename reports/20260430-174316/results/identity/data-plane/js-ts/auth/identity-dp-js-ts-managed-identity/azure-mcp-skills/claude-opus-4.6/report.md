# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** azure-mcp-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 47.2s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | azure-mcp-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 47.2s |
| Timestamp | 2026-05-01T00:45:48Z |
| Files Generated | 0 |
| Event Count | 56 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 47.0s |
| **Total** | **47.2s** |

## Configuration

- **name:** azure-mcp-skills/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=110707 out=2106 |
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

The user is asking for educational content about using Managed Identity with Azure SDK in Node.js/TypeScript. This is a knowledge question, not a code change task. Let me provide a comprehensive answer.

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
{"intent":"Managed Identity authentication with Azure SDK for JavaScript Node.js TypeScript ManagedIdentityCredential","learn":true}
```

### 🔧 3. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_search","intent":"Search for Managed Identity credential Azure SDK JavaScript TypeScript documentation","parameters":{"query":"ManagedIdentityCredential Azure SDK JavaScript TypeScript system-assigned user-assigned DefaultAzureCredential"}}
```

### 🔧 4. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_code_sample_search","intent":"Search for code samples for ManagedIdentityCredential in TypeScript","parameters":{"language":"typescript","query":"ManagedIdentityCredential DefaultAzureCredential Azure Identity"}}
```

## Copilot Response

Here's a comprehensive guide to using Managed Identity with Azure SDK in Node.js/TypeScript:

---

## Managed Identity Authentication in Node.js/TypeScript

### Install

```bash
npm install @azure/identity @azure/storage-blob @azure/keyvault-secrets
```

---

### 1. System-Assigned vs User-Assigned

| | System-Assigned | User-Assigned |
|---|---|---|
| **Lifecycle** | Tied to the Azure resource (e.g., VM, App Service) | Independent — can be shared across resources |
| **Creation** | Enable on the resource | Create separately, then attach |
| **Constructor** | No arguments needed | Requires `clientId` or `resourceId` |

---

### 2. Creating ManagedIdentityCredential

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// ── System-assigned: no arguments ──
const systemCredential = new ManagedIdentityCredential();

// ── User-assigned: pass clientId ──
const userCredential = new ManagedIdentityCredential({
  clientId: process.env.AZURE_CLIENT_ID!,
});

// ── User-assigned: alternatively pass resourceId ──
const userCredentialByResource = new ManagedIdentityCredential({
  resourceId: process.env.AZURE_RESOURCE_ID!,
});
```

---

### 3. Using with Azure SDK Clients

```typescript
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";
import { ManagedIdentityCredential } from "@azure/identity";

function createCredential(): ManagedIdentityCredential {
  // User-assigned (pass clientId) or system-assigned (no args)
  return process.env.AZURE_CLIENT_ID
    ? new ManagedIdentityCredential({ clientId: process.env.AZURE_CLIENT_ID })
    : new ManagedIdentityCredential();
}

const credential = createCredential();

// Reuse the SAME credential instance across clients
const blobClient = new BlobServiceClient(
  `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  credential
);

const secretClient = new SecretClient(
  `https://${process.env.KEY_VAULT_NAME}.vault.azure.net`,
  credential
);
```

---

### 4. Local Development Fallback Strategies

**Option A — Environment-based switching (recommended):**

```typescript
import {
  ManagedIdentityCredential,
  AzureCliCredential,
  AzureDeveloperCliCredential,
  ChainedTokenCredential,
  type TokenCredential,
} from "@azure/identity";

function getCredential(): TokenCredential {
  if (process.env.NODE_ENV === "production") {
    // In production, use managed identity only (deterministic)
    return new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID!);
  }

  // In development, chain local credentials
  return new ChainedTokenCredential(
    new AzureCliCredential(),
    new AzureDeveloperCliCredential()
  );
}
```

**Option B — `DefaultAzureCredential` (simpler but less deterministic):**

```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Tries managed identity, env vars, CLI, etc. in order.
// Convenient but slower in production due to fallback probing.
const credential = new DefaultAzureCredential();
```

> **Best practice:** Use `ManagedIdentityCredential` explicitly in production
> and `ChainedTokenCredential` locally. Avoid `DefaultAzureCredential` in
> production — it probes multiple credential sources, adding latency and
> making failures harder to debug.

---

### 5. Common Pitfalls & Error Handling

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

async function main(): Promise<void> {
  // ✅ Pitfall 1: Configure retries for transient IMDS failures
  const credential = new ManagedIdentityCredential(
    process.env.AZURE_CLIENT_ID!,
    {
      retryOptions: {
        maxRetries: 3,
        retryDelayInMs: 500,
        maxRetryDelayInMs: 5000,
      },
    }
  );

  // ✅ Pitfall 2: Reuse credential instances (don't create per-request)
  const blobClient = new BlobServiceClient(
    `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    credential
  );

  try {
    const containerClient = blobClient.getContainerClient("my-container");
    const props = await containerClient.getProperties();
    console.log("Container:", props);
  } catch (err: unknown) {
    if (err instanceof Error) {
      // ✅ Pitfall 3: Check for common error patterns
      if (err.message.includes("IDENTITY_NOT_FOUND")) {
        console.error(
          "Managed identity not enabled on this resource. " +
          "Enable it in the Azure portal under Identity settings."
        );
      } else if (err.message.includes("authorization")) {
        console.error(
          "Identity lacks required RBAC role. " +
          "Assign e.g. 'Storage Blob Data Reader' to the identity."
        );
      } else {
        console.error("Unexpected error:", err.message);
      }
    }
    throw err;
  }
}
```

**Key pitfalls to avoid:**

| Pitfall | Fix |
|---|---|
| Creating a new credential per request | Reuse a single instance — reduces token requests |
| Using `DefaultAzureCredential` in production | Use `ManagedIdentityCredential` directly for speed & clarity |
| Forgetting RBAC role assignments | Assign data-plane roles (e.g., `Storage Blob Data Contributor`) to the identity |
| Not handling IMDS timeouts | Configure `retryOptions` — the metadata endpoint can be slow on cold start |
| Confusing system vs user-assigned args | System-assigned = no args; User-assigned = must pass `clientId` or `resourceId` |

---

**Docs:** [Authentication best practices](https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/best-practices) · [User-assigned MI guide](https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/user-assigned-managed-identity)

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config azure-mcp-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
