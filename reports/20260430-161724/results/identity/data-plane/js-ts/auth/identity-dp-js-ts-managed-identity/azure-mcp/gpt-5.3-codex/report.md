# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** azure-mcp/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 32.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | azure-mcp/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 32.7s |
| Timestamp | 2026-04-30T23:21:21Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 32.5s |
| **Total** | **32.7s** |

## Configuration

- **model:** gpt-5.3-codex
- **name:** azure-mcp/gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=25667 out=1709 |
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

## Copilot Response

Use `@azure/identity`’s `ManagedIdentityCredential` in Azure-hosted apps, and pair it with a local fallback for development.

## 1) System-assigned vs user-assigned managed identity

1. **System-assigned MI**
   - Lifecycle tied to one Azure resource (VM, App Service, Function, etc.).
   - Azure creates/deletes it with the resource.
   - Use when one app/resource needs its own identity.

2. **User-assigned MI**
   - Standalone Azure identity resource.
   - Can be attached to multiple compute resources.
   - Use when multiple apps/resources should share one identity.

---

## 2) Create `ManagedIdentityCredential` for each type

```ts
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned identity:
const systemAssigned = new ManagedIdentityCredential();

// User-assigned identity (by client ID):
const userAssignedClientId = process.env.AZURE_CLIENT_ID!;
const userAssigned = new ManagedIdentityCredential(userAssignedClientId);
```

---

## 3) Use it with Azure SDK clients

### Example A: System-assigned MI + Key Vault

```ts
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new ManagedIdentityCredential(); // system-assigned
const vaultUrl = `https://${process.env.KEY_VAULT_NAME}.vault.azure.net`;
const client = new SecretClient(vaultUrl, credential);

const secret = await client.getSecret("my-secret");
console.log(secret.value);
```

### Example B: User-assigned MI + Blob Storage

```ts
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

const credential = new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID); // user-assigned
const account = process.env.STORAGE_ACCOUNT_NAME!;
const blobServiceClient = new BlobServiceClient(
  `https://${account}.blob.core.windows.net`,
  credential
);

for await (const container of blobServiceClient.listContainers()) {
  console.log(container.name);
}
```

---

## 4) Local development fallback strategies

Use a credential factory:

```ts
import {
  ManagedIdentityCredential,
  DefaultAzureCredential,
  TokenCredential
} from "@azure/identity";

export function createCredential(): TokenCredential {
  const runningInAzure = !!process.env.WEBSITE_INSTANCE_ID || !!process.env.IDENTITY_ENDPOINT;

  if (runningInAzure) {
    // In Azure: force MI (user-assigned if AZURE_CLIENT_ID is set)
    return process.env.AZURE_CLIENT_ID
      ? new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID)
      : new ManagedIdentityCredential();
  }

  // Local: Azure CLI / VS Code / env creds via DefaultAzureCredential
  return new DefaultAzureCredential();
}
```

Practical shortcut: you can also use **only** `DefaultAzureCredential` everywhere; set `AZURE_CLIENT_ID` in Azure when you want user-assigned MI.

---

## 5) Common pitfalls and error handling

- Managed identity not enabled on the host resource.
- User-assigned identity created but not attached to the host.
- Wrong `AZURE_CLIENT_ID` (using object ID/principal ID by mistake).
- Missing RBAC role/data-plane permissions (Key Vault, Storage, etc.).
- RBAC propagation delay after role assignment.
- Expecting MI to work locally without fallback.

```ts
import {
  ManagedIdentityCredential,
  CredentialUnavailableError,
  AuthenticationError
} from "@azure/identity";

const credential = new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID);

try {
  // Example: explicit token request for diagnostics
  const token = await credential.getToken("https://storage.azure.com/.default");
  if (!token) throw new Error("No token received");
} catch (err: unknown) {
  if (err instanceof CredentialUnavailableError) {
    // Typically means MI endpoint not available (common in local dev)
    console.error("Managed Identity unavailable in this environment.");
  } else if (err instanceof AuthenticationError) {
    // MI endpoint reached but authentication failed
    console.error(`Authentication failed: ${err.message}`);
  } else {
    console.error("Unexpected auth error:", err);
  }
  throw err;
}
```



## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config azure-mcp/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
