# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** baseline/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 28.8s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | baseline/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 28.8s |
| Timestamp | 2026-04-30T23:22:13Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 28.7s |
| **Total** | **28.8s** |

## Configuration

- **name:** baseline/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=16458 out=1425 |
| Turn Count | 1 |

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

The user is asking for educational content about Azure Managed Identity with Node.js/TypeScript. This is a knowledge question, not a code task. I'll provide a comprehensive answer directly.

## Copilot Response

# Azure Managed Identity with Node.js/TypeScript

## 1. System-Assigned vs User-Assigned

| | System-Assigned | User-Assigned |
|---|---|---|
| **Lifecycle** | Tied to the Azure resource | Independent resource |
| **Scope** | One per resource | Shared across resources |
| **Use case** | Single-resource workloads | Multi-resource, shared identity |

---

## 2. Creating `ManagedIdentityCredential`

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned — no arguments needed
const systemCredential = new ManagedIdentityCredential();

// User-assigned — pass the client ID
const userCredential = new ManagedIdentityCredential({
  clientId: "YOUR_USER_ASSIGNED_MI_CLIENT_ID",
});
```

---

## 3. Using with Azure SDK Clients

```typescript
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";
import { ManagedIdentityCredential } from "@azure/identity";

const credential = new ManagedIdentityCredential(); // or pass clientId

// Storage
const blobClient = new BlobServiceClient(
  "https://myaccount.blob.core.windows.net",
  credential
);

// Key Vault
const secretClient = new SecretClient(
  "https://my-vault.vault.azure.net",
  credential
);

async function readSecret() {
  const secret = await secretClient.getSecret("my-secret");
  console.log(`Secret value: ${secret.value}`);
}
```

---

## 4. Local Development Fallback with `DefaultAzureCredential`

`ManagedIdentityCredential` only works in Azure. For local dev, use `DefaultAzureCredential` which chains multiple credential types:

```typescript
import { DefaultAzureCredential } from "@azure/identity";

// In Azure: uses Managed Identity
// Locally: falls back to Azure CLI, VS Code, env vars, etc.
const credential = new DefaultAzureCredential();

// If you need user-assigned MI in prod + CLI locally:
import {
  ChainedTokenCredential,
  ManagedIdentityCredential,
  AzureCliCredential,
} from "@azure/identity";

const credential = new ChainedTokenCredential(
  new ManagedIdentityCredential({ clientId: "YOUR_CLIENT_ID" }),
  new AzureCliCredential()
);
```

**`DefaultAzureCredential` chain order:**
1. Environment variables (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`)
2. Workload Identity
3. Managed Identity
4. Azure CLI (`az login`)
5. Azure PowerShell
6. Azure Developer CLI

---

## 5. Common Pitfalls & Error Handling

### Pitfall 1: Missing RBAC role assignments
```typescript
// The identity exists but has no permissions on the target resource
// Fix: Assign roles like "Storage Blob Data Reader" via Azure Portal/CLI
// az role assignment create --assignee <MI-principal-id> \
//   --role "Storage Blob Data Reader" --scope <storage-account-id>
```

### Pitfall 2: Timeout on local machine
```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// This will hang/timeout locally — MI endpoint doesn't exist
const cred = new ManagedIdentityCredential();
// Use DefaultAzureCredential instead for portability
```

### Pitfall 3: Wrong client ID for user-assigned
```typescript
// If you have multiple user-assigned MIs on one resource,
// you MUST specify which one:
const cred = new ManagedIdentityCredential({
  clientId: "correct-client-id-here", // not the object/principal ID!
});
```

### Robust error handling pattern
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
  } catch (err) {
    if (err instanceof RestError) {
      switch (err.statusCode) {
        case 401:
          console.error("Authentication failed — check MI role assignments");
          break;
        case 403:
          console.error("Forbidden — identity lacks required RBAC role");
          break;
        case 404:
          console.error(`Secret '${name}' not found`);
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

---

**Key takeaways:**
- Use `DefaultAzureCredential` for portability across environments
- Use `ManagedIdentityCredential` directly only when you need explicit control
- Always assign RBAC roles — identity alone grants no access
- Pass `clientId` (not object ID) for user-assigned identities
- Install: `npm install @azure/identity @azure/keyvault-secrets`

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config baseline/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
