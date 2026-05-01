# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** baseline-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 27.9s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | baseline-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 27.9s |
| Timestamp | 2026-04-30T23:22:09Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 27.9s |
| **Total** | **27.9s** |

## Configuration

- **name:** baseline-skills/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=16456 out=1152 |
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

# Managed Identity Authentication with Azure SDK (Node.js/TypeScript)

## 1. System-Assigned vs User-Assigned

| | System-Assigned | User-Assigned |
|---|---|---|
| **Lifecycle** | Tied to the Azure resource | Independent resource |
| **Scope** | 1:1 with resource | Shared across resources |
| **Setup** | Toggle on in resource settings | Create separately, then assign |
| **Identity** | No client ID needed | Requires `clientId` |

## 2. Creating ManagedIdentityCredential

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned — no arguments needed
const systemCredential = new ManagedIdentityCredential();

// User-assigned — pass the client ID
const userCredential = new ManagedIdentityCredential({
  clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
});
```

## 3. Using with Azure SDK Clients

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";

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
```

## 4. Local Development Fallback

Managed Identity only works in Azure. Use `DefaultAzureCredential` or `ChainedTokenCredential` for local dev:

```typescript
import {
  ManagedIdentityCredential,
  AzureDeveloperCliCredential,
  ChainedTokenCredential,
  DefaultAzureCredential,
} from "@azure/identity";

// Option A: DefaultAzureCredential (tries MI, then CLI, env vars, etc.)
const credentialA = new DefaultAzureCredential();

// Option B: Explicit chain — gives you control over order and which
// credential types to try
const credentialB = new ChainedTokenCredential(
  new ManagedIdentityCredential(),       // works in Azure
  new AzureDeveloperCliCredential()      // works locally via `azd auth login`
);

// Use either just like ManagedIdentityCredential
const secretClient = new SecretClient(
  "https://myvault.vault.azure.net",
  credentialB
);
```

## 5. Common Pitfalls & Error Handling

### RBAC not assigned
The identity must have the correct **role assignment** on the target resource (e.g., `Storage Blob Data Reader`). A 403 means the identity exists but lacks permissions.

### Timeout on local machine
`ManagedIdentityCredential` queries the IMDS endpoint (`169.254.169.254`), which hangs locally. Always use a fallback chain or catch the error:

```typescript
import { ManagedIdentityCredential, AuthenticationError } from "@azure/identity";

const credential = new ManagedIdentityCredential();

try {
  const token = await credential.getToken("https://storage.azure.com/.default");
  console.log("Token acquired, expires:", token.expiresOnTimestamp);
} catch (err) {
  if (err instanceof AuthenticationError) {
    console.error("Auth failed — is MI enabled? Does it have RBAC?", err.message);
  } else {
    // CredentialUnavailableError means MI endpoint unreachable (local dev)
    console.error("MI not available in this environment:", err);
  }
}
```

### Key gotchas

| Pitfall | Fix |
|---|---|
| Using `clientId` for system-assigned | Omit `clientId` — it's auto-resolved |
| Forgetting RBAC after enabling MI | Assign roles in Azure Portal / `az role assignment create` |
| Slow startup locally | Use `ChainedTokenCredential` with MI first; it fails fast when IMDS is unreachable |
| Wrong audience/scope string | Use `https://<service>.azure.com/.default` (note the `/.default` suffix) |
| Multiple user-assigned identities | You **must** specify `clientId` — the SDK can't pick one automatically |

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config baseline-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
