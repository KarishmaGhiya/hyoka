# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** azure-mcp/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 29.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | azure-mcp/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 29.7s |
| Timestamp | 2026-04-30T23:22:22Z |
| Files Generated | 0 |
| Event Count | 42 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 29.6s |
| **Total** | **29.7s** |

## Configuration

- **name:** azure-mcp/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=51717 out=1522 |
| Turn Count | 2 |

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

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Gathering Azure guidance"}
```

### 🔧 2. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"intent":"Get best practices for Azure SDK authentication in Node.js with Service Principal client secret","learn":true}
```

## Copilot Response

Use `ClientSecretCredential` from `@azure/identity`, then pass it directly to any Azure SDK client constructor that accepts a `TokenCredential`.

```bash
# 1) Required npm packages
npm install @azure/identity @azure/storage-blob dotenv
npm install -D typescript tsx @types/node
```

```ts
// 2, 3, 5) Complete TypeScript example: Service Principal auth + SDK usage + error handling
// File: src/index.ts
import "dotenv/config";
import { ClientSecretCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isAuthError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: string; message?: string };
  return (
    e.name?.includes("Authentication") === true ||
    e.name?.includes("Credential") === true ||
    e.code === "Unauthorized" ||
    e.message?.toLowerCase().includes("invalid_client") === true ||
    e.message?.toLowerCase().includes("unauthorized") === true
  );
}

async function main(): Promise<void> {
  const tenantId = getRequiredEnv("AZURE_TENANT_ID");
  const clientId = getRequiredEnv("AZURE_CLIENT_ID");
  const clientSecret = getRequiredEnv("AZURE_CLIENT_SECRET");
  const storageAccountName = getRequiredEnv("AZURE_STORAGE_ACCOUNT_NAME");

  // Create credential from Service Principal + client secret
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

  // Optional fail-fast token request to isolate auth issues early
  await credential.getToken("https://storage.azure.com/.default");

  // Use credential with an Azure SDK client
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential
  );

  // Example call
  console.log("Containers:");
  for await (const container of blobServiceClient.listContainers()) {
    console.log(`- ${container.name}`);
  }
}

main().catch((err: unknown) => {
  if (isAuthError(err)) {
    console.error("Azure authentication failed. Check tenant/client/secret and app permissions.");
    process.exitCode = 1;
    return;
  }

  console.error("Unhandled error:", err);
  process.exitCode = 1;
});
```

`.env` example:
```env
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-client-secret
AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
```

**4) Secret management best practices (Node.js):** keep secrets in environment variables (never hardcode), use Azure Key Vault or CI/CD secret stores, rotate client secrets regularly, use least-privilege RBAC on the service principal, avoid logging secret values, and prefer Managed Identity over client secrets when running in Azure.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config azure-mcp/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
