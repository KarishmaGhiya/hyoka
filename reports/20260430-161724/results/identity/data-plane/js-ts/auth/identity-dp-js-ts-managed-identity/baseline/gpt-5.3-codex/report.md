# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** baseline/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 28.4s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | baseline/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 28.4s |
| Timestamp | 2026-04-30T23:21:54Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 28.2s |
| **Total** | **28.4s** |

## Configuration

- **name:** baseline/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=14405 out=1728 |
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

Use `ManagedIdentityCredential` directly in Azure, then layer a local fallback for developer machines.

## 1) System-assigned vs user-assigned managed identity

- **System-assigned**: identity is tied to a single Azure resource (VM, App Service, Function, etc.). Lifecycle is the same as the resource.
- **User-assigned**: standalone identity resource you can attach to multiple Azure resources. Better for reuse and controlled rotation/permissions.

## 2) Create `ManagedIdentityCredential` for each type (TypeScript)

```ts
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned MI
const systemAssignedCredential = new ManagedIdentityCredential();

// User-assigned MI (client ID of the user-assigned identity)
const userAssignedClientId = process.env.AZURE_CLIENT_ID!;
const userAssignedCredential = new ManagedIdentityCredential(userAssignedClientId);
```

## 3) Use with Azure SDK clients

```ts
import { SecretClient } from "@azure/keyvault-secrets";
import { BlobServiceClient } from "@azure/storage-blob";
import { ManagedIdentityCredential } from "@azure/identity";

// Example A: System-assigned identity
const systemCred = new ManagedIdentityCredential();
const kvClientA = new SecretClient(`https://${process.env.KEYVAULT_NAME}.vault.azure.net`, systemCred);

// Example B: User-assigned identity
const userCred = new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID!);
const blobClientB = new BlobServiceClient(
  `https://${process.env.STORAGE_ACCOUNT}.blob.core.windows.net`,
  userCred
);

// Calls
const secret = await kvClientA.getSecret("my-secret");
const containers = blobClientB.listContainers();
for await (const c of containers) {
  console.log(c.name);
}
```

## 4) Local development fallback strategies

Use `DefaultAzureCredential` locally (CLI/VS Code/Azure Developer CLI), and MI in Azure runtime:

```ts
import {
  DefaultAzureCredential,
  ManagedIdentityCredential,
  TokenCredential
} from "@azure/identity";

function getCredential(): TokenCredential {
  const inAzure = !!(process.env.IDENTITY_ENDPOINT || process.env.MSI_ENDPOINT || process.env.WEBSITE_INSTANCE_ID);
  const userAssignedClientId = process.env.AZURE_CLIENT_ID;

  if (inAzure) {
    return userAssignedClientId
      ? new ManagedIdentityCredential(userAssignedClientId)
      : new ManagedIdentityCredential();
  }

  // Local fallback chain (CLI, azd, VS Code, env creds, etc.)
  return new DefaultAzureCredential({
    managedIdentityClientId: userAssignedClientId
  });
}
```

## 5) Common pitfalls and error handling

```ts
import { CredentialUnavailableError } from "@azure/identity";
import { isRestError } from "@azure/core-rest-pipeline";

try {
  const credential = getCredential();
  const client = new SecretClient(`https://${process.env.KEYVAULT_NAME}.vault.azure.net`, credential);
  const value = await client.getSecret("my-secret");
  console.log(value.value);
} catch (err: unknown) {
  if (err instanceof CredentialUnavailableError) {
    throw new Error("No managed identity endpoint (expected locally). Sign in with Azure CLI/azd.");
  }

  if (isRestError(err) && err.statusCode === 403) {
    throw new Error("Authenticated, but not authorized. Check RBAC/access policies for this identity.");
  }

  throw err;
}
```

**Frequent issues**: wrong `AZURE_CLIENT_ID` for user-assigned MI, MI not enabled on the host resource, missing RBAC role assignment, role propagation delay, wrong service URL/audience, and trying MI-only auth on local machines without fallback.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config baseline/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
