# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** baseline/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 31.1s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | baseline/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 31.1s |
| Timestamp | 2026-05-01T00:47:26Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 31.0s |
| **Total** | **31.1s** |

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
| Token Usage | in=16486 out=1436 |
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

The user is asking for a tutorial/explanation about using Managed Identity with Azure SDK in Node.js/TypeScript. This is a knowledge question - I don't need to search a codebase or create files. Let me provide a comprehensive answer.

## Copilot Response

# Managed Identity Authentication with Azure SDK (Node.js/TypeScript)

## 1. System-Assigned vs User-Assigned

| | System-Assigned | User-Assigned |
|---|---|---|
| **Lifecycle** | Tied to the Azure resource | Independent resource |
| **Scope** | One per resource | Shared across resources |
| **Use case** | Single-resource workloads | Multi-resource, shared identity |

## 2. Creating ManagedIdentityCredential

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned: no arguments needed
const systemCredential = new ManagedIdentityCredential();

// User-assigned: pass the client ID
const userCredential = new ManagedIdentityCredential({
  clientId: "YOUR_USER_ASSIGNED_MANAGED_IDENTITY_CLIENT_ID",
});

// Alternative: user-assigned by resource ID
const userCredentialByResourceId = new ManagedIdentityCredential({
  resourceId:
    "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}",
});
```

## 3. Using with Azure SDK Clients

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";
import { EventHubProducerClient } from "@azure/event-hubs";

// Works with any Azure SDK client that accepts TokenCredential
const credential = new ManagedIdentityCredential();

// Storage
const blobClient = new BlobServiceClient(
  "https://myaccount.blob.core.windows.net",
  credential
);

// Key Vault
const secretClient = new SecretClient(
  "https://myvault.vault.azure.net",
  credential
);

// Event Hubs
const eventHubClient = new EventHubProducerClient(
  "mynamespace.servicebus.windows.net",
  "my-event-hub",
  credential
);
```

## 4. Local Development Fallback with `DefaultAzureCredential`

`ManagedIdentityCredential` only works on Azure. Use `DefaultAzureCredential` for portability:

```typescript
import {
  DefaultAzureCredential,
  ChainedTokenCredential,
  ManagedIdentityCredential,
  AzureCliCredential,
  EnvironmentCredential,
} from "@azure/identity";

// Option A: DefaultAzureCredential (tries MI → env vars → CLI → etc.)
const credential = new DefaultAzureCredential();

// Option B: Explicit chain for control over fallback order
const credential2 = new ChainedTokenCredential(
  new ManagedIdentityCredential(),   // First: try MI (works on Azure)
  new AzureCliCredential(),          // Fallback: use `az login` locally
);

// Option C: User-assigned MI in prod, CLI locally
const credential3 = new ChainedTokenCredential(
  new ManagedIdentityCredential({
    clientId: "YOUR_CLIENT_ID",
  }),
  new EnvironmentCredential(),       // Uses AZURE_CLIENT_ID/SECRET/TENANT_ID
  new AzureCliCredential(),
);
```

## 5. Common Pitfalls & Error Handling

```typescript
import { ManagedIdentityCredential, AuthenticationError } from "@azure/identity";
import { RestError } from "@azure/core-rest-pipeline";
import { SecretClient } from "@azure/keyvault-secrets";

async function getSecret(name: string): Promise<string> {
  const credential = new ManagedIdentityCredential();
  const client = new SecretClient(
    "https://myvault.vault.azure.net",
    credential
  );

  try {
    const secret = await client.getSecret(name);
    return secret.value!;
  } catch (err) {
    if (err instanceof AuthenticationError) {
      // Pitfall 1: Missing RBAC role assignment
      // MI exists but lacks permission on the target resource.
      // Fix: assign a role like "Key Vault Secrets User" to the identity.
      console.error(`Auth failed (${err.statusCode}): ${err.message}`);
      throw err;
    }
    if (err instanceof RestError && err.statusCode === 403) {
      // Pitfall 2: Firewall / network rules blocking access
      // Fix: add the resource's VNet/subnet to the target's firewall allow list.
      console.error("Access denied — check network/firewall rules");
      throw err;
    }
    throw err;
  }
}
```

### Key pitfalls to remember

| Pitfall | Fix |
|---|---|
| **Forgot RBAC role assignment** | Assign a role (e.g., `Storage Blob Data Contributor`) to the managed identity on the target resource |
| **Using MI locally** | MI only works on Azure infra — use `DefaultAzureCredential` or `ChainedTokenCredential` for local dev |
| **Multiple user-assigned MIs** | You **must** specify `clientId` — otherwise the SDK can't pick one |
| **Token caching / cold start** | First token fetch can take 1-2s; the SDK caches tokens automatically after that |
| **Key Vault access policies vs RBAC** | If using access policies (legacy), MI won't work with RBAC-based code — migrate to Azure RBAC |

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config baseline/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
