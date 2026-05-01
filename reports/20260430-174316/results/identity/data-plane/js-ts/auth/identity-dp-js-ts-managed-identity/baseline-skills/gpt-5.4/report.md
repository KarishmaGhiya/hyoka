# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** baseline-skills/gpt-5.4 | **Result:** ❌ FAILED | **Duration:** 50.3s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | baseline-skills/gpt-5.4 |
| Result | ❌ FAILED |
| Duration | 50.3s |
| Timestamp | 2026-05-01T00:46:35Z |
| Files Generated | 0 |
| Event Count | 62 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 50.2s |
| **Total** | **50.3s** |

## Configuration

- **name:** baseline-skills/gpt-5.4
- **model:** gpt-5.4

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.4 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=57705 out=3145 |
| Turn Count | 3 |

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
{"intent":"Gathering Azure guidance"}
```

### 🔧 2. web_fetch

**Input:**

```json
{"max_length":12000,"url":"https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-node-latest"}
```

### 🔧 3. web_fetch

**Input:**

```json
{"max_length":12000,"url":"https://learn.microsoft.com/en-us/azure/developer/javascript/sdk/authentication/system-assigned-managed-identity"}
```

### 🔧 4. report_intent

**Input:**

```json
{"intent":"Checking identity details"}
```

### 🔧 5. web_fetch

**Input:**

```json
{"max_length":12000,"url":"https://learn.microsoft.com/en-us/azure/developer/javascript/sdk/authentication/user-assigned-managed-identity"}
```

### 🔧 6. web_fetch

**Input:**

```json
{"max_length":12000,"url":"https://learn.microsoft.com/en-us/javascript/api/%40azure/identity/managedidentitycredential?view=azure-node-latest"}
```

## Copilot Response

I’ve got the current Azure guidance; I’m pulling the user-assigned specifics so the constructor examples and caveats line up cleanly.

Use `ManagedIdentityCredential` for Azure-hosted code and pass it directly to Azure SDK clients. **System-assigned** uses no identity ID; **user-assigned** must specify which managed identity to use, usually by `clientId`.

```bash
npm install @azure/identity @azure/storage-blob @azure/keyvault-secrets
```

## 1. System-assigned vs user-assigned

- **System-assigned managed identity**: enabled on one Azure resource, tied to that resource’s lifecycle.
- **User-assigned managed identity**: standalone Azure resource, reusable across multiple apps/resources.

## 2. Create `ManagedIdentityCredential` for each type

### System-assigned
```ts
import { ManagedIdentityCredential } from "@azure/identity";

const credential = new ManagedIdentityCredential();
```

### User-assigned
```ts
import { ManagedIdentityCredential } from "@azure/identity";

const clientId = process.env.AZURE_CLIENT_ID;
if (!clientId) {
  throw new Error("AZURE_CLIENT_ID is required for a user-assigned managed identity.");
}

const credential = new ManagedIdentityCredential({ clientId });
// Also valid: new ManagedIdentityCredential(clientId)
```

## 3. Use it with Azure SDK clients

Most Azure SDK clients accept a `TokenCredential`.

### Example: system-assigned identity with Blob Storage
```ts
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

export function createBlobClient(): BlobServiceClient {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  if (!accountName) {
    throw new Error("AZURE_STORAGE_ACCOUNT_NAME is required.");
  }

  const accountUrl = `https://${accountName}.blob.core.windows.net`;
  const credential = new ManagedIdentityCredential(); // system-assigned

  return new BlobServiceClient(accountUrl, credential);
}
```

### Example: user-assigned identity with Key Vault
```ts
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export function createSecretClient(): SecretClient {
  const vaultUrl = process.env.KEY_VAULT_URL;
  const clientId = process.env.AZURE_CLIENT_ID;

  if (!vaultUrl) {
    throw new Error("KEY_VAULT_URL is required.");
  }

  if (!clientId) {
    throw new Error("AZURE_CLIENT_ID is required for user-assigned managed identity.");
  }

  const credential = new ManagedIdentityCredential({ clientId });

  return new SecretClient(vaultUrl, credential);
}
```

## 4. Local development fallback strategies

**Managed identity does not work on your laptop** unless you’re actually running in an Azure host that exposes it. Common patterns:

### Strategy A: explicit Azure-hosted vs local split
Use managed identity in Azure, `DefaultAzureCredential` locally.

```ts
import {
  DefaultAzureCredential,
  ManagedIdentityCredential,
  TokenCredential,
} from "@azure/identity";

function isAzureHosted(): boolean {
  return Boolean(
    process.env.IDENTITY_ENDPOINT ||
    process.env.MSI_ENDPOINT ||
    process.env.WEBSITE_INSTANCE_ID
  );
}

export function createCredential(): TokenCredential {
  if (isAzureHosted()) {
    return new ManagedIdentityCredential();
  }

  return new DefaultAzureCredential({
    excludeManagedIdentityCredential: true,
  });
}
```

### Strategy B: local-only dev credentials
If you want predictable local behavior, use one dev credential explicitly:

```ts
import { AzureCliCredential } from "@azure/identity";

const credential = new AzureCliCredential(); // requires az login
```

Good local options:
- `DefaultAzureCredential`
- `AzureCliCredential`
- `AzureDeveloperCliCredential`

## 5. Common pitfalls and error handling

### Pitfalls
- **Identity enabled != authorized**: you still need RBAC roles on the target resource.
- **User-assigned identity must be attached** to the host resource and you must pass the correct `clientId`.
- **Role assignments can take a few minutes** to propagate.
- **Don’t use `DefaultAzureCredential` in production by accident** if you want only managed identity; it may mask configuration issues in some environments.
- **Wrong endpoint/resource URL** is common, especially for Storage and Key Vault.

### Error handling
```ts
import {
  AuthenticationError,
  CredentialUnavailableError,
  ManagedIdentityCredential,
} from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

async function readSecret() {
  const vaultUrl = process.env.KEY_VAULT_URL!;
  const credential = new ManagedIdentityCredential();
  const client = new SecretClient(vaultUrl, credential);

  try {
    const secret = await client.getSecret("my-secret");
    return secret.value;
  } catch (error: unknown) {
    if (error instanceof CredentialUnavailableError) {
      throw new Error(
        "Managed identity is unavailable. Confirm the app is running on Azure with managed identity enabled."
      );
    }

    if (error instanceof AuthenticationError) {
      throw new Error(
        `Authentication failed. Check managed identity assignment and RBAC permissions. ${error.message}`
      );
    }

    throw error;
  }
}
```

**Rule of thumb:**  
- **Azure-hosted app**: `ManagedIdentityCredential`
- **Local development**: `DefaultAzureCredential` or `AzureCliCredential`

If you want one reusable factory for both system-assigned and user-assigned identities, use:

```ts
import { ManagedIdentityCredential } from "@azure/identity";

export function createManagedIdentityCredential(): ManagedIdentityCredential {
  const clientId = process.env.AZURE_CLIENT_ID;

  return clientId
    ? new ManagedIdentityCredential({ clientId }) // user-assigned
    : new ManagedIdentityCredential();            // system-assigned
}
```

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config baseline-skills/gpt-5.4
```

---

[← Back to Summary](../../../../../../summary.md)
