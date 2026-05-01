# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** azure-mcp-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 43.9s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | azure-mcp-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 43.9s |
| Timestamp | 2026-04-30T23:21:37Z |
| Files Generated | 0 |
| Event Count | 41 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 43.8s |
| **Total** | **43.9s** |

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
| Token Usage | in=69443 out=1830 |
| Turn Count | 2 |

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

The user is asking for a tutorial/explanation about using Managed Identity with Azure SDK in Node.js/TypeScript. This is a knowledge question - I can answer it directly without needing to search the codebase or use tools. Let me provide a comprehensive answer.

Actually, let me check if there's relevant Azure documentation I can reference to make sure my answer is accurate and up-to-date.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Explaining Managed Identity usage"}
```

### 🔧 2. azure-documentation (via azure)

**Input:**

```json
{"intent":"Search for documentation on using ManagedIdentityCredential with Azure SDK for JavaScript/TypeScript Node.js","learn":true}
```

## Copilot Response

Here's a comprehensive guide to using Managed Identity with Azure SDK in TypeScript:

---

## 1. System-Assigned vs User-Assigned Managed Identity

| | System-Assigned | User-Assigned |
|---|---|---|
| **Lifecycle** | Tied to the Azure resource | Independent resource |
| **Scope** | One per resource | Can be shared across resources |
| **Use case** | Single-resource workloads | Multi-resource or shared identity scenarios |

---

## 2. Creating `ManagedIdentityCredential`

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// ── System-assigned: no arguments needed ──
const systemAssignedCredential = new ManagedIdentityCredential();

// ── User-assigned: pass the client ID ──
const userAssignedCredential = new ManagedIdentityCredential({
  clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // your UA-MI client ID
});

// Alternative: identify by resource ID instead of client ID
const byResourceId = new ManagedIdentityCredential({
  resourceId:
    "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.ManagedIdentity/userAssignedIdentities/<name>",
});
```

---

## 3. Using with Azure SDK Clients

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";
import { CosmosClient } from "@azure/cosmos";

// Pick credential type based on your setup
const credential = new ManagedIdentityCredential(); // system-assigned

// ── Storage ──
const blobService = new BlobServiceClient(
  "https://<account>.blob.core.windows.net",
  credential
);

// ── Key Vault ──
const secretClient = new SecretClient(
  "https://<vault-name>.vault.azure.net",
  credential
);
const secret = await secretClient.getSecret("my-secret");

// ── Cosmos DB (AAD auth) ──
const cosmos = new CosmosClient({
  endpoint: "https://<account>.documents.azure.com:443/",
  aadCredentials: credential,
});
```

---

## 4. Local Development Fallback with `DefaultAzureCredential`

Managed Identity only works on Azure. For local dev, use `DefaultAzureCredential` which tries credentials in order:

```typescript
import {
  DefaultAzureCredential,
  ManagedIdentityCredential,
  AzureCliCredential,
  ChainedTokenCredential,
} from "@azure/identity";

// ── Option A: DefaultAzureCredential (simplest) ──
// Tries: Environment → Workload Identity → Managed Identity → Azure CLI → etc.
const credential = new DefaultAzureCredential();

// ── Option B: Explicit chain (more control, better error messages) ──
const credential2 = new ChainedTokenCredential(
  new ManagedIdentityCredential(),   // works on Azure
  new AzureCliCredential()           // works locally via `az login`
);

// ── Option C: User-assigned MI + local fallback ──
const credential3 = new ChainedTokenCredential(
  new ManagedIdentityCredential({
    clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  }),
  new AzureCliCredential()
);

// Use it the same way regardless of environment
const secretClient = new SecretClient(
  "https://<vault>.vault.azure.net",
  credential
);
```

> **Tip:** For `DefaultAzureCredential` with a user-assigned MI, pass the client ID:
> ```typescript
> new DefaultAzureCredential({
>   managedIdentityClientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
> });
> ```

---

## 5. Common Pitfalls & Error Handling

```typescript
import { AuthenticationError } from "@azure/identity";
import { RestError } from "@azure/core-rest-pipeline";

async function getSecretSafely() {
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(
    "https://<vault>.vault.azure.net",
    credential
  );

  try {
    return await client.getSecret("my-secret");
  } catch (err) {
    if (err instanceof AuthenticationError) {
      // ❌ Pitfall 1: Missing RBAC role assignment
      // Fix: Assign "Key Vault Secrets User" role to the MI
      console.error(`Auth failed (${err.statusCode}): ${err.message}`);
    } else if (err instanceof RestError && err.statusCode === 403) {
      // ❌ Pitfall 2: Using Key Vault access policies instead of RBAC
      // Fix: Switch vault to RBAC mode or add an access policy for the MI
      console.error("Forbidden – check RBAC or access policy");
    }
    throw err;
  }
}
```

### Common pitfalls at a glance

| Pitfall | Symptom | Fix |
|---|---|---|
| No role assignment | `AuthenticationError` 401/403 | Assign the correct RBAC role to the MI principal |
| Wrong client ID for UA-MI | `CredentialUnavailableError` | Verify `clientId` matches the user-assigned identity |
| Using MI locally | `CredentialUnavailableError` | Use `DefaultAzureCredential` or `ChainedTokenCredential` |
| IMDS timeout | Hangs for ~5s then fails | MI endpoint unreachable — not running on Azure |
| Multiple UA-MIs, none specified | Ambiguous identity error | Explicitly pass `clientId` to disambiguate |
| Vault using access policies | 403 even with RBAC role | Switch vault permission model to "Azure RBAC" |

---

**Install the packages:**

```bash
npm install @azure/identity @azure/keyvault-secrets @azure/storage-blob
```

**Key takeaway:** Use `DefaultAzureCredential` (or an explicit `ChainedTokenCredential`) so the same code works both on Azure (via MI) and locally (via CLI/environment). Always assign the correct RBAC roles to your managed identity's principal.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config azure-mcp-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
