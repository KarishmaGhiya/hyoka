# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** baseline-skills/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 16.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | baseline-skills/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 16.7s |
| Timestamp | 2026-04-30T23:23:11Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 16.6s |
| **Total** | **16.7s** |

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
| Token Usage | in=14421 out=1078 |
| Turn Count | 1 |

## Error

```
0 files generated — agent did not create any files
```

## Prompt Sent

```
Show me how to
authenticate to Azure using a Service Principal with client secret. I need:
1. Required npm packages
2. How to create a ClientSecretCredential with tenant ID, client ID, and secret
3. Using it with an Azure SDK client
4. Best practices for secret management in Node.js
5. Error handling for authentication failures

Provide a complete TypeScript example.
```

## Copilot Response

Use this pattern in Node.js/TypeScript with Azure SDK.

1. **Required npm packages**
```bash
npm install @azure/identity @azure/storage-blob dotenv
npm install -D typescript ts-node @types/node
```

2–5. **Complete TypeScript example** (ClientSecretCredential + SDK usage + secret handling + auth error handling)

```ts
// src/index.ts
import "dotenv/config";
import { ClientSecretCredential, AuthenticationError } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main(): Promise<void> {
  // Service Principal values (never hardcode these in source)
  const tenantId = requiredEnv("AZURE_TENANT_ID");
  const clientId = requiredEnv("AZURE_CLIENT_ID");
  const clientSecret = requiredEnv("AZURE_CLIENT_SECRET");

  // Azure resource settings
  const storageAccountName = requiredEnv("AZURE_STORAGE_ACCOUNT_NAME");
  const containerName = process.env.AZURE_STORAGE_CONTAINER ?? "sample-container";

  // 1) Create credential from tenant/client/secret
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

  // Optional preflight: verifies auth early
  await credential.getToken("https://storage.azure.com/.default");

  // 2) Use credential with Azure SDK client
  const serviceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential
  );

  const containerClient = serviceClient.getContainerClient(containerName);
  const exists = await containerClient.exists();
  console.log(`Container "${containerName}" exists: ${exists}`);
}

main().catch((err: unknown) => {
  // 3) Authentication failure handling
  if (err instanceof AuthenticationError || (err as any)?.name === "AuthenticationError") {
    console.error("Azure authentication failed. Check tenant/client/secret and app registration.");
    console.error((err as Error).message);
    process.exit(1);
  }

  // 4) Authorization/API failure handling (for valid token but insufficient permissions, etc.)
  const anyErr = err as any;
  if (anyErr?.statusCode === 401 || anyErr?.statusCode === 403) {
    console.error("Authenticated, but not authorized for this Azure resource/RBAC scope.");
    console.error(anyErr.message ?? anyErr);
    process.exit(1);
  }

  console.error("Unexpected error:", err);
  process.exit(1);
});
```

Create a `.env` (local only, never commit):
```env
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-client-secret
AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
AZURE_STORAGE_CONTAINER=sample-container
```

**Best practices for secrets in Node.js:** keep secrets in environment variables, use `.env` only for local dev, add `.env` to `.gitignore`, prefer Azure Key Vault or managed identity in hosted environments, rotate client secrets regularly, and grant least-privilege RBAC roles to the service principal.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config baseline-skills/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
