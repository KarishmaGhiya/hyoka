# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** azure-mcp/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 51.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | azure-mcp/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 51.0s |
| Timestamp | 2026-04-30T23:21:29Z |
| Files Generated | 0 |
| Event Count | 67 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 50.9s |
| **Total** | **51.0s** |

## Configuration

- **name:** azure-mcp/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=143434 out=2171 |
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

## Copilot Reasoning

The user is asking for educational content about using Managed Identity with Azure SDK in Node.js/TypeScript. This is a knowledge question - I should provide a comprehensive answer with code examples. Let me also check Azure documentation for the most accurate guidance.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Researching Managed Identity docs"}
```

### 🔧 2. azure-documentation (via azure)

**Input:**

```json
{"intent":"Azure Managed Identity with Node.js TypeScript SDK ManagedIdentityCredential DefaultAzureCredential","learn":true}
```

### 🔧 3. azure-documentation (via azure)

**Input:**

```json
{"command":"search","intent":"Search Azure documentation for managed identity Node.js SDK authentication","parameters":{"query":"managed identity ManagedIdentityCredential DefaultAzureCredential Node.js TypeScript @azure/identity"}}
```

### 🔧 4. web_fetch

**Input:**

```json
{"max_length":15000,"url":"https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-node-latest"}
```

## Copilot Response

Here's a comprehensive guide to using **Managed Identity** with Azure SDK clients in Node.js/TypeScript:

---

## 1. System-Assigned vs User-Assigned Managed Identity

| | System-Assigned | User-Assigned |
|---|---|---|
| **Lifecycle** | Tied to the Azure resource | Independent resource |
| **Scope** | 1:1 with resource | Can be shared across resources |
| **Cleanup** | Deleted when resource is deleted | Must be deleted separately |
| **Use case** | Single-resource workloads | Shared identity across services |

---

## 2. Install the Package

```bash
npm install @azure/identity @azure/keyvault-secrets @azure/storage-blob
```

---

## 3. Creating `ManagedIdentityCredential`

### System-Assigned (no arguments needed)

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned: the VM/App Service/Container has exactly one identity
const credential = new ManagedIdentityCredential();
```

### User-Assigned (pass the client ID or resource ID)

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// Option A: by client ID
const credential = new ManagedIdentityCredential({
  clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
});

// Option B: by resource ID (useful when client ID is ambiguous)
const credential = new ManagedIdentityCredential({
  resourceId:
    "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.ManagedIdentity/userAssignedIdentities/<name>",
});
```

---

## 4. Using with Azure SDK Clients

Every Azure SDK client accepts a `TokenCredential`. Both `ManagedIdentityCredential` and `DefaultAzureCredential` implement it:

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { BlobServiceClient } from "@azure/storage-blob";

const credential = new ManagedIdentityCredential(); // system-assigned

// Key Vault
const secretClient = new SecretClient(
  "https://my-vault.vault.azure.net",
  credential
);
const secret = await secretClient.getSecret("my-secret");

// Blob Storage
const blobClient = new BlobServiceClient(
  "https://mystorage.blob.core.windows.net",
  credential
);
const containers = blobClient.listContainers();
for await (const container of containers) {
  console.log(container.name);
}
```

---

## 5. Local Development Fallback Strategies

`ManagedIdentityCredential` **only works on Azure**. For local dev, use `DefaultAzureCredential` or `ChainedTokenCredential`:

### Strategy A: `DefaultAzureCredential` (recommended)

It automatically tries, in order: environment vars → workload identity → managed identity → Azure CLI → Azure PowerShell → Azure Developer CLI.

```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Works in Azure (managed identity) AND locally (Azure CLI/PS)
const credential = new DefaultAzureCredential();

// For user-assigned identity in production, set env var or pass options:
const credentialUA = new DefaultAzureCredential({
  managedIdentityClientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
});
```

### Strategy B: `ChainedTokenCredential` (explicit control)

```typescript
import {
  ChainedTokenCredential,
  ManagedIdentityCredential,
  AzureCliCredential,
} from "@azure/identity";

// Try managed identity first, fall back to Azure CLI for local dev
const credential = new ChainedTokenCredential(
  new ManagedIdentityCredential(),
  new AzureCliCredential()
);
```

### Strategy C: Environment-based switching

```typescript
import {
  ManagedIdentityCredential,
  AzureCliCredential,
  TokenCredential,
} from "@azure/identity";

function getCredential(): TokenCredential {
  if (process.env.AZURE_CLIENT_ID || process.env.WEBSITE_INSTANCE_ID) {
    // Running in Azure
    return new ManagedIdentityCredential();
  }
  // Local development
  return new AzureCliCredential();
}
```

---

## 6. Common Pitfalls & Error Handling

### Pitfall 1: Forgetting RBAC role assignments
Managed identity must have the right role on the target resource (e.g., "Key Vault Secrets User", "Storage Blob Data Reader").

### Pitfall 2: Using `ManagedIdentityCredential` locally
It will fail with a connection error. Always use `DefaultAzureCredential` or a chain.

### Pitfall 3: Not handling token errors gracefully

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { RestError } from "@azure/core-rest-pipeline";

async function getSecret(name: string): Promise<string | undefined> {
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(
    "https://my-vault.vault.azure.net",
    credential
  );

  try {
    const secret = await client.getSecret(name);
    return secret.value;
  } catch (err: unknown) {
    if (err instanceof RestError) {
      switch (err.statusCode) {
        case 401:
          console.error("Authentication failed. Check RBAC assignments.");
          break;
        case 403:
          console.error("Forbidden. Identity lacks required permissions.");
          break;
        case 404:
          console.error(`Secret '${name}' not found.`);
          break;
        default:
          console.error(`Azure error ${err.statusCode}: ${err.message}`);
      }
    } else {
      console.error("Unexpected error:", err);
    }
    return undefined;
  }
}
```

### Pitfall 4: Token caching & cold starts
The first token acquisition can take 1-2 seconds on cold start. SDK clients cache tokens automatically, but be aware of this in latency-sensitive paths.

### Pitfall 5: Multiple user-assigned identities without specifying which one

```typescript
// BAD: ambiguous when multiple user-assigned identities are attached
const cred = new ManagedIdentityCredential();

// GOOD: always specify the client ID
const cred2 = new ManagedIdentityCredential({
  clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
});
```

---

**TL;DR:** Use `DefaultAzureCredential` for most cases — it handles both Azure and local dev. Only use `ManagedIdentityCredential` directly when you need explicit control. Always assign RBAC roles to your identity on the target resource.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config azure-mcp/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
