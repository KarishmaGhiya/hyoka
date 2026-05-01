# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** baseline-skills/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 25.6s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | baseline-skills/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 25.6s |
| Timestamp | 2026-04-30T23:21:48Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 25.6s |
| **Total** | **25.6s** |

## Configuration

- **name:** baseline-skills/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=14407 out=1368 |
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

Use `ManagedIdentityCredential` directly when you want to force Managed Identity auth, and pass that credential into any Azure SDK client.

### 1) System-assigned vs user-assigned managed identity

- **System-assigned MI**: tied to a single Azure resource lifecycle (VM/App Service/Function/etc). No identity ID to manage.
- **User-assigned MI**: standalone Azure identity resource you can attach to multiple Azure resources. You must specify which identity to use (usually by `clientId`).

### 2) Create `ManagedIdentityCredential` for each type

```ts
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned
const systemAssignedCredential = new ManagedIdentityCredential();

// User-assigned (client ID recommended)
const userAssignedCredential = new ManagedIdentityCredential(
  process.env.AZURE_USER_ASSIGNED_CLIENT_ID
);
```

> For user-assigned identity, make sure the `clientId` matches the identity attached to the host resource.

### 3) Use with Azure SDK clients

#### System-assigned example (Key Vault)

```ts
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new ManagedIdentityCredential();
const kvUrl = "https://<your-keyvault>.vault.azure.net";

const client = new SecretClient(kvUrl, credential);

async function run() {
  const secret = await client.getSecret("my-secret");
  console.log(secret.value);
}

run().catch(console.error);
```

#### User-assigned example (Blob Storage)

```ts
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const userAssignedClientId = process.env.AZURE_USER_ASSIGNED_CLIENT_ID!;

const credential = new ManagedIdentityCredential(userAssignedClientId);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  credential
);

async function run() {
  for await (const container of blobServiceClient.listContainers()) {
    console.log(container.name);
  }
}

run().catch(console.error);
```

### 4) Local development fallback strategies

Use a chain: try MI first, then local dev credentials (CLI/VS Code).

```ts
import {
  ManagedIdentityCredential,
  AzureCliCredential,
  VisualStudioCodeCredential,
  ChainedTokenCredential
} from "@azure/identity";

const credential = new ChainedTokenCredential(
  // In Azure host this succeeds
  new ManagedIdentityCredential(process.env.AZURE_USER_ASSIGNED_CLIENT_ID),
  // Local fallback(s)
  new AzureCliCredential(),
  new VisualStudioCodeCredential()
);
```

(Alternative: `DefaultAzureCredential` is easiest when you want automatic environment-aware behavior.)

### 5) Common pitfalls + error handling

```ts
import {
  ManagedIdentityCredential,
  CredentialUnavailableError
} from "@azure/identity";

const credential = new ManagedIdentityCredential(
  process.env.AZURE_USER_ASSIGNED_CLIENT_ID
);

async function safeCall() {
  try {
    // Optional preflight token check
    await credential.getToken("https://storage.azure.com/.default");
    // then call SDK client methods...
  } catch (err: unknown) {
    if (err instanceof CredentialUnavailableError) {
      console.error("Managed Identity endpoint unavailable (likely local/non-Azure host).");
      // switch to fallback credential path
      return;
    }

    console.error("Authentication failed. Check MI assignment, clientId, and RBAC roles.", err);
    throw err;
  }
}
```

Most frequent issues:
1. Identity enabled but **RBAC role not assigned** (or propagation delay).
2. Wrong `clientId` for user-assigned MI.
3. Multiple user-assigned identities attached but none explicitly selected.
4. Testing locally with MI-only credential (no IMDS endpoint available).
5. Wrong resource scope (e.g., using Key Vault scope for Storage).

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config baseline-skills/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
