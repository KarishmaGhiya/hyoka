# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** azure-mcp-skills/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 39.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | azure-mcp-skills/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 39.0s |
| Timestamp | 2026-04-30T23:21:30Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 38.9s |
| **Total** | **39.0s** |

## Configuration

- **name:** azure-mcp-skills/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=25684 out=2012 |
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

Use `ManagedIdentityCredential` directly in Azure-hosted runtimes, and use a credential chain (or `DefaultAzureCredential`) for local/dev fallback.

### 1) System-assigned vs user-assigned managed identity

- **System-assigned**: lifecycle is tied to one Azure resource (App Service, VM, Function, etc.).  
- **User-assigned**: standalone identity resource you can attach to multiple Azure resources; you must select it explicitly when multiple identities exist.

### 2) Create `ManagedIdentityCredential` for each type

```ts
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned MI
const systemAssignedCred = new ManagedIdentityCredential();

// User-assigned MI (client ID of the user-assigned identity)
const userAssignedClientId = process.env.AZURE_CLIENT_ID!;
const userAssignedCred = new ManagedIdentityCredential(userAssignedClientId);
```

### 3) Use it with Azure SDK clients

```ts
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// System-assigned example: Key Vault
const credential = new ManagedIdentityCredential();
const client = new SecretClient("https://<your-vault-name>.vault.azure.net", credential);

const secret = await client.getSecret("my-secret");
console.log(secret.value);
```

```ts
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

// User-assigned example: Storage
const credential = new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID!);
const blobServiceClient = new BlobServiceClient(
  "https://<your-storage-account>.blob.core.windows.net",
  credential
);

const containers = blobServiceClient.listContainers();
for await (const c of containers) {
  console.log(c.name);
}
```

### 4) Local development fallback strategies

```ts
import {
  ManagedIdentityCredential,
  ChainedTokenCredential,
  AzureCliCredential,
  EnvironmentCredential,
  VisualStudioCodeCredential,
  TokenCredential
} from "@azure/identity";

export function createCredential(userAssignedClientId?: string): TokenCredential {
  const managedIdentity = userAssignedClientId
    ? new ManagedIdentityCredential(userAssignedClientId)
    : new ManagedIdentityCredential();

  // Works in Azure (MI) and locally (env/CLI/VS Code)
  return new ChainedTokenCredential(
    managedIdentity,
    new EnvironmentCredential(),
    new AzureCliCredential(),
    new VisualStudioCodeCredential()
  );
}
```

Common alternative: `DefaultAzureCredential` (often simplest), plus `AZURE_CLIENT_ID` when targeting a user-assigned identity.

### 5) Common pitfalls + error handling

```ts
import { CredentialUnavailableError } from "@azure/identity";
import { RestError } from "@azure/core-rest-pipeline";

try {
  // call Azure SDK client operation
} catch (err: unknown) {
  if (err instanceof CredentialUnavailableError) {
    // MI unavailable (often local machine / wrong host config)
    console.error("No managed identity endpoint available:", err.message);
  } else if (err instanceof RestError && err.statusCode === 403) {
    // Auth succeeded but RBAC/data-plane permissions missing
    console.error("Identity lacks required role/permissions:", err.message);
  } else {
    console.error("Unexpected Azure auth/client error:", err);
  }
  throw err;
}
```

Top pitfalls:
1. Using **user-assigned MI** without setting the correct `AZURE_CLIENT_ID` (or equivalent explicit client ID).  
2. Missing RBAC/data-plane role assignments (403 after successful token acquisition).  
3. Testing `ManagedIdentityCredential` locally without fallback credentials.  
4. Multiple user-assigned identities attached but no explicit identity selected.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config azure-mcp-skills/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
