# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** baseline/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 27.2s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | baseline/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 27.2s |
| Timestamp | 2026-05-01T23:11:26Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 27.1s |
| **Total** | **27.2s** |

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
| Token Usage | in=16507 out=1240 |
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

The user is asking for a tutorial/explanation about using Managed Identity with Azure SDK in Node.js/TypeScript. This is a knowledge question - I don't need to search a codebase or write files. Let me provide a comprehensive answer.

## Copilot Response

## Managed Identity Authentication with Azure SDK (Node.js/TypeScript)

### 1. System-Assigned vs User-Assigned

| | System-Assigned | User-Assigned |
|---|---|---|
| Lifecycle | Tied to the Azure resource | Independent, shared across resources |
| Creation | Enabled on the resource | Created as a standalone resource |
| Use case | Single-resource, 1:1 mapping | Multi-resource, shared identity |

### 2. Creating ManagedIdentityCredential

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned — no arguments needed
const systemCredential = new ManagedIdentityCredential();

// User-assigned — pass the client ID
const userCredential = new ManagedIdentityCredential({
  clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
});

// User-assigned — alternatively, use resource ID
const userCredentialByResourceId = new ManagedIdentityCredential({
  resourceId: "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.ManagedIdentity/userAssignedIdentities/<name>",
});
```

### 3. Using with Azure SDK Clients

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";
import { ServiceBusClient } from "@azure/service-bus";

const credential = new ManagedIdentityCredential(); // or pass clientId for user-assigned

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

// Service Bus
const sbClient = new ServiceBusClient(
  "mynamespace.servicebus.windows.net",
  credential
);
```

### 4. Local Development Fallback

`ManagedIdentityCredential` only works on Azure. Use `DefaultAzureCredential` or `ChainedTokenCredential` for local+cloud:

```typescript
import {
  DefaultAzureCredential,
  ChainedTokenCredential,
  ManagedIdentityCredential,
  AzureCLICredential,
  EnvironmentCredential,
} from "@azure/identity";

// Option A: DefaultAzureCredential (tries MI → env vars → CLI → etc.)
const credentialA = new DefaultAzureCredential();

// Option B: Explicit chain with controlled fallback order
const credentialB = new ChainedTokenCredential(
  new ManagedIdentityCredential(),       // works in Azure
  new AzureCLICredential(),              // works locally with `az login`
);

// Option C: User-assigned MI in prod, CLI locally
const credentialC = new ChainedTokenCredential(
  new ManagedIdentityCredential({
    clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  }),
  new AzureCLICredential(),
);
```

### 5. Common Pitfalls & Error Handling

```typescript
import { RestError } from "@azure/core-rest-pipeline";
import { AuthenticationError } from "@azure/identity";

async function getSecret(client: SecretClient, name: string) {
  try {
    return await client.getSecret(name);
  } catch (err) {
    if (err instanceof AuthenticationError) {
      // MI not available, wrong RBAC role, or wrong audience
      console.error(`Auth failed (${err.statusCode}): ${err.message}`);
    } else if (err instanceof RestError && err.statusCode === 403) {
      // Identity authenticated but lacks RBAC permission
      console.error("Missing RBAC role assignment on the target resource");
    }
    throw err;
  }
}
```

**Key pitfalls:**

| Pitfall | Fix |
|---|---|
| `ManagedIdentityCredential` fails locally | Use `ChainedTokenCredential` or `DefaultAzureCredential` |
| 403 after successful auth | Assign the correct RBAC role (e.g., *Storage Blob Data Reader*) — resource-level IAM, not just Contributor |
| Multiple user-assigned identities, no `clientId` | Always specify `clientId` when >1 user-assigned MI is attached |
| Token caching / stale tokens | The SDK handles caching; don't cache `TokenCredential` results manually |
| Slow first request (~1-2s) | MI token acquisition has cold-start latency; warm up at startup if latency-sensitive |

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config baseline/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
