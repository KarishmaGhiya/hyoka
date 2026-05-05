# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** baseline-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 28.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | baseline-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 28.7s |
| Timestamp | 2026-05-01T00:47:26Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 28.7s |
| **Total** | **28.7s** |

## Configuration

- **model:** claude-opus-4.6
- **name:** baseline-skills/claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=16491 out=1319 |
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

The user is asking for a tutorial/explanation about using Managed Identity with Azure SDK in Node.js/TypeScript. This is a knowledge question - I don't need to search a codebase or build anything. Let me provide a comprehensive answer directly.

## Copilot Response

## Managed Identity Authentication with Azure SDK (Node.js/TypeScript)

### 1. System-Assigned vs User-Assigned

| | System-Assigned | User-Assigned |
|---|---|---|
| **Lifecycle** | Tied to the Azure resource | Independent, shared across resources |
| **Creation** | Enable on the resource (e.g., App Service) | Create separately, then assign |
| **Use case** | Single-resource, simple scenarios | Multi-resource, granular control |

### 2. Creating ManagedIdentityCredential

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned — no arguments needed
const systemCredential = new ManagedIdentityCredential();

// User-assigned — pass the client ID
const userCredential = new ManagedIdentityCredential({
  clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
});

// Alternative: user-assigned via resource ID
const userCredentialByResourceId = new ManagedIdentityCredential({
  resourceId: "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.ManagedIdentity/userAssignedIdentities/<name>",
});
```

### 3. Using with Azure SDK Clients

```typescript
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";
import { ManagedIdentityCredential } from "@azure/identity";

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

// Example: list secrets
async function listSecrets() {
  for await (const secret of secretClient.listPropertiesOfSecrets()) {
    console.log(secret.name);
  }
}
```

### 4. Local Development Fallback with `DefaultAzureCredential`

`ManagedIdentityCredential` only works on Azure. Use `DefaultAzureCredential` for portability — it chains multiple credential types:

```typescript
import { DefaultAzureCredential, ChainedTokenCredential, ManagedIdentityCredential, AzureCLICredential } from "@azure/identity";

// Option A: DefaultAzureCredential (tries MI → env vars → CLI → etc.)
const credential = new DefaultAzureCredential();

// Option B: Explicit chain for more control
const credential2 = new ChainedTokenCredential(
  new ManagedIdentityCredential(),  // works on Azure
  new AzureCLICredential()          // works locally via `az login`
);

// Use either credential identically
const blobClient = new BlobServiceClient(
  "https://myaccount.blob.core.windows.net",
  credential
);
```

**Local dev options** (tried by `DefaultAzureCredential`):
- **Azure CLI** — run `az login` first
- **VS Code** — sign in via Azure extension
- **Environment variables** — set `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`

### 5. Common Pitfalls & Error Handling

```typescript
import { ManagedIdentityCredential, AuthenticationError } from "@azure/identity";
import { RestError } from "@azure/core-rest-pipeline";

async function getSecret(name: string): Promise<string> {
  const credential = new ManagedIdentityCredential();
  const secretClient = new SecretClient(
    "https://myvault.vault.azure.net",
    credential
  );

  try {
    const secret = await secretClient.getSecret(name);
    return secret.value!;
  } catch (err) {
    if (err instanceof AuthenticationError) {
      // Pitfall 1: MI not enabled or wrong identity
      console.error(`Auth failed (code ${err.statusCode}): ${err.message}`);
      throw err;
    }
    if (err instanceof RestError && err.statusCode === 403) {
      // Pitfall 2: Missing RBAC role assignment
      console.error("Identity lacks required role on the target resource.");
      throw err;
    }
    throw err;
  }
}
```

**Key pitfalls:**

| Pitfall | Fix |
|---|---|
| Forgetting to enable MI on the resource | Azure Portal → Identity → turn on System-assigned |
| Missing RBAC role | Assign role (e.g., "Key Vault Secrets User") to the identity's principal |
| Using `ManagedIdentityCredential` locally | Use `DefaultAzureCredential` or `ChainedTokenCredential` instead |
| Multiple user-assigned identities without specifying `clientId` | Always pass `clientId` when >1 user-assigned identity is attached |
| Key Vault using access policies instead of RBAC | Switch to Azure RBAC or add an access policy for the identity |

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config baseline-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
