# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** baseline/gpt-5.4 | **Result:** ❌ FAILED | **Duration:** 34.2s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | baseline/gpt-5.4 |
| Result | ❌ FAILED |
| Duration | 34.2s |
| Timestamp | 2026-05-01T00:46:56Z |
| Files Generated | 0 |
| Event Count | 42 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 34.0s |
| **Total** | **34.2s** |

## Configuration

- **name:** baseline/gpt-5.4
- **model:** gpt-5.4

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.4 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=31713 out=2096 |
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

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Checking Azure docs"}
```

### 🔧 2. web_fetch

**Input:**

```json
{"max_length":8000,"url":"https://learn.microsoft.com/en-us/javascript/api/@azure/identity/managedidentitycredential?view=azure-node-latest"}
```

### 🔧 3. web_fetch

**Input:**

```json
{"max_length":8000,"url":"https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-node-latest"}
```

## Copilot Response

Use `ManagedIdentityCredential` in Azure-hosted code, and use `DefaultAzureCredential` or `ChainedTokenCredential` as a local-dev fallback. The main difference is simple: **system-assigned** uses the host’s identity automatically, while **user-assigned** requires you to tell Azure which identity to use.

```bash
npm install @azure/identity @azure/keyvault-secrets @azure/storage-blob
```

## 1. System-assigned vs user-assigned managed identity

| Type | What it is | How you select it |
|---|---|---|
| **System-assigned** | Identity tied to one Azure resource | No ID needed |
| **User-assigned** | Standalone identity reusable across resources | Pass `clientId` (most common), `resourceId`, or `objectId` |

## 2. Create `ManagedIdentityCredential` for each type

### System-assigned
```ts
import { ManagedIdentityCredential } from "@azure/identity";

const credential = new ManagedIdentityCredential();
```

### User-assigned by `clientId` recommended
```ts
import { ManagedIdentityCredential } from "@azure/identity";

const credential = new ManagedIdentityCredential({
  clientId: process.env.AZURE_CLIENT_ID!
});
```

### User-assigned by `resourceId`
```ts
import { ManagedIdentityCredential } from "@azure/identity";

const credential = new ManagedIdentityCredential({
  resourceId:
    "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.ManagedIdentity/userAssignedIdentities/<name>"
});
```

### User-assigned by `objectId`
```ts
import { ManagedIdentityCredential } from "@azure/identity";

const credential = new ManagedIdentityCredential({
  objectId: "<managed-identity-object-id>"
});
```

## 3. Use it with Azure SDK clients

### Example: system-assigned identity with Key Vault
```ts
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new ManagedIdentityCredential();
const client = new SecretClient("https://my-vault.vault.azure.net", credential);

async function main() {
  const secret = await client.getSecret("my-secret");
  console.log(secret.value);
}

main().catch(console.error);
```

### Example: user-assigned identity with Blob Storage
```ts
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

const credential = new ManagedIdentityCredential({
  clientId: process.env.AZURE_CLIENT_ID!
});

const blobServiceClient = new BlobServiceClient(
  "https://<account>.blob.core.windows.net",
  credential
);

async function main() {
  for await (const container of blobServiceClient.listContainers()) {
    console.log(container.name);
  }
}

main().catch(console.error);
```

## 4. Local development fallback strategies

### Best general option: `DefaultAzureCredential`
This is usually the cleanest approach: it uses managed identity in Azure, and local developer credentials on your machine.

### System-assigned deployment + local dev fallback
```ts
import { DefaultAzureCredential, ManagedIdentityCredential, TokenCredential } from "@azure/identity";

export function createCredential(): TokenCredential {
  if (process.env.NODE_ENV === "production") {
    return new ManagedIdentityCredential();
  }

  return new DefaultAzureCredential();
}
```

### User-assigned deployment + local dev fallback
`DefaultAzureCredential` can also target a user-assigned identity in Azure:

```ts
import { DefaultAzureCredential, TokenCredential } from "@azure/identity";

export function createCredential(): TokenCredential {
  return new DefaultAzureCredential({
    managedIdentityClientId: process.env.AZURE_CLIENT_ID
  });
}
```

### Explicit chain for local-first behavior
Useful when you want predictable fallback order.

```ts
import {
  AzureCliCredential,
  ChainedTokenCredential,
  ManagedIdentityCredential,
  VisualStudioCodeCredential,
  TokenCredential
} from "@azure/identity";

export function createCredential(): TokenCredential {
  const managedIdentity = process.env.AZURE_CLIENT_ID
    ? new ManagedIdentityCredential({ clientId: process.env.AZURE_CLIENT_ID })
    : new ManagedIdentityCredential();

  return new ChainedTokenCredential(
    managedIdentity,
    new AzureCliCredential(),
    new VisualStudioCodeCredential()
  );
}
```

## 5. Common pitfalls and error handling

### Pitfalls
1. **Trying managed identity locally**: `ManagedIdentityCredential` usually fails outside Azure-hosted environments.
2. **Wrong identity selected**: user-assigned identity requires `clientId`, `resourceId`, or `objectId`.
3. **Missing RBAC/data-plane permissions**: auth can succeed while the SDK call still gets `403`.
4. **Using the wrong resource/scope**: let Azure SDK clients request tokens for you; don’t manually call `getToken` unless needed.
5. **Propagation delays**: newly assigned roles can take time to become effective.
6. **Identity not enabled**: system-assigned identity must be enabled on the Azure resource first.

### Error handling example
```ts
import {
  AuthenticationError,
  CredentialUnavailableError,
  ManagedIdentityCredential
} from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new ManagedIdentityCredential({
  clientId: process.env.AZURE_CLIENT_ID
});

const client = new SecretClient("https://my-vault.vault.azure.net", credential);

async function main() {
  try {
    const secret = await client.getSecret("my-secret");
    console.log(secret.value);
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      console.error("Managed identity is unavailable in this environment.");
      return;
    }

    if (error instanceof AuthenticationError) {
      console.error("Authentication failed:", error.message);
      return;
    }

    console.error("Azure SDK call failed:", error);
  }
}

main().catch(console.error);
```

## Practical recommendation

For most apps, use:

- `ManagedIdentityCredential()` or `ManagedIdentityCredential({ clientId })` when you want **managed identity only**
- `DefaultAzureCredential()` or `DefaultAzureCredential({ managedIdentityClientId })` when you want **Azure + local dev fallback in one credential**

A compact production-friendly pattern is:

```ts
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new DefaultAzureCredential({
  managedIdentityClientId: process.env.AZURE_CLIENT_ID
});

const client = new SecretClient("https://my-vault.vault.azure.net", credential);
```

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config baseline/gpt-5.4
```

---

[← Back to Summary](../../../../../../summary.md)
