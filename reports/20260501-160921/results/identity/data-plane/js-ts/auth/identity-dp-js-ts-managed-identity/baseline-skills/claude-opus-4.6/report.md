# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** baseline-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 51.5s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | baseline-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 51.5s |
| Timestamp | 2026-05-01T23:11:17Z |
| Files Generated | 0 |
| Event Count | 78 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 51.4s |
| **Total** | **51.5s** |

## Configuration

- **name:** baseline-skills/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skill Directories | C:\code\hyoka\skills\generator\js-ts-azure-patterns |
| Skills Loaded | customize-cloud-agent |
| Skills Invoked | find-skills |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=73263 out=2060 |
| Turn Count | 4 |

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

The user is asking about using Managed Identity with Azure SDK in Node.js/TypeScript. Let me invoke the relevant skill first.

The user wants to know about Managed Identity with Azure SDK in Node.js/TypeScript. Let me search for relevant skills first, and also check if there are any existing reference files in the workspace.

The directory is empty. Let me search for any skills related to Azure identity or managed identity, and also check the skills leaderboard.

There's an `azure-identity-ts` skill. Let me check it, but with only 76 installs it's low. Let me just provide a comprehensive answer based on my knowledge of the Azure SDK for JavaScript/TypeScript, particularly `@azure/identity`.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Invoking identity skill"}
```

### 🔧 2. skill

**Input:**

```json
{"skill":"find-skills"}
```

### 🔧 3. report_intent

**Input:**

```json
{"intent":"Researching managed identity patterns"}
```

### 🔧 4. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-baseline-skills-claude-opus-4.6-4154990478"}
```

### 🔧 5. powershell

**Input:**

```json
{"command":"npx skills find \"azure identity managed identity\" 2\u003e\u00261 | Select-Object -First 40","description":"Search for Azure identity skills","initial_wait":30}
```

## Copilot Response

No highly-trusted skills found for this (all under 100 installs). I'll provide a comprehensive guide directly based on Azure SDK best practices.

---

## Managed Identity Authentication with Azure SDK for Node.js/TypeScript

### Install Dependencies

```bash
npm install @azure/identity @azure/keyvault-secrets @azure/storage-blob
```

### 1. System-Assigned vs User-Assigned Managed Identity

| Feature | System-Assigned | User-Assigned |
|---|---|---|
| Lifecycle | Tied to the Azure resource | Independent resource |
| Sharing | One per resource | Can be shared across resources |
| Use case | Single-resource workloads | Multi-resource or shared workloads |
| Config | Enable on the resource | Create separately, then assign |

---

### 2. Creating `ManagedIdentityCredential`

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned: no arguments needed
const systemCredential = new ManagedIdentityCredential();

// User-assigned: pass the client ID of the managed identity
const userCredential = new ManagedIdentityCredential({
  clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
});

// Alternative: user-assigned by resource ID
const userCredentialByResourceId = new ManagedIdentityCredential({
  resourceId:
    "/subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.ManagedIdentity/userAssignedIdentities/<identity-name>",
});
```

---

### 3. Using with Azure SDK Clients

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { BlobServiceClient } from "@azure/storage-blob";

// --- Key Vault example ---
const credential = new ManagedIdentityCredential();
const vaultUrl = "https://my-vault.vault.azure.net";
const secretClient = new SecretClient(vaultUrl, credential);

const secret = await secretClient.getSecret("my-secret");
console.log(`Secret value: ${secret.value}`);

// --- Blob Storage example ---
const blobServiceClient = new BlobServiceClient(
  "https://mystorageaccount.blob.core.windows.net",
  credential
);

const containerClient = blobServiceClient.getContainerClient("my-container");
for await (const blob of containerClient.listBlobsFlat()) {
  console.log(`Blob: ${blob.name}`);
}
```

---

### 4. Local Development Fallback Strategies

Managed Identity only works on Azure. Use `DefaultAzureCredential` or `ChainedTokenCredential` for local fallback:

#### Option A: `DefaultAzureCredential` (recommended)

```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Automatically tries (in order):
//   EnvironmentCredential → WorkloadIdentityCredential →
//   ManagedIdentityCredential → AzureCliCredential →
//   AzurePowerShellCredential → AzureDeveloperCliCredential
const credential = new DefaultAzureCredential();

// Use the same credential everywhere — it picks the right one
const secretClient = new SecretClient(vaultUrl, credential);
```

To target a specific user-assigned identity in production:

```typescript
const credential = new DefaultAzureCredential({
  managedIdentityClientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
});
```

#### Option B: `ChainedTokenCredential` (explicit control)

```typescript
import {
  ChainedTokenCredential,
  ManagedIdentityCredential,
  AzureCliCredential,
} from "@azure/identity";

// Try managed identity first, fall back to Azure CLI locally
const credential = new ChainedTokenCredential(
  new ManagedIdentityCredential(),
  new AzureCliCredential()
);
```

---

### 5. Common Pitfalls and Error Handling

```typescript
import { ManagedIdentityCredential, AuthenticationError } from "@azure/identity";
import { RestError } from "@azure/core-rest-pipeline";

async function getSecretSafely(): Promise<string | undefined> {
  const credential = new ManagedIdentityCredential();
  const client = new SecretClient(vaultUrl, credential);

  try {
    const secret = await client.getSecret("my-secret");
    return secret.value;
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) {
      // Common causes:
      // - Managed identity not enabled on the resource
      // - Missing role assignment (e.g., "Key Vault Secrets User")
      // - Wrong client ID for user-assigned identity
      console.error(`Auth failed (status ${error.statusCode}): ${error.message}`);
    } else if (error instanceof RestError) {
      // Network/service errors
      console.error(`Service error: ${error.code} - ${error.message}`);
    }
    throw error;
  }
}
```

#### Key pitfalls to avoid:

| Pitfall | Fix |
|---|---|
| **Missing RBAC role** | Assign the identity a role (e.g., `Key Vault Secrets User`) on the target resource — Key Vault access policies alone aren't enough if using RBAC mode |
| **Using connection strings** | Replace with `TokenCredential`-based constructors (no secrets to rotate!) |
| **Wrong identity on multi-assigned VMs** | Always specify `clientId` when multiple user-assigned identities are attached |
| **Token caching confusion** | `ManagedIdentityCredential` caches tokens automatically — don't create new instances per request |
| **Local testing fails** | Use `DefaultAzureCredential` so it falls back to CLI/env credentials locally |
| **Timeout on non-Azure environments** | `ManagedIdentityCredential` probes the IMDS endpoint and will timeout if not on Azure — prefer `DefaultAzureCredential` which handles this gracefully |

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config baseline-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
