# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** azure-mcp-skills/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 28.6s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | azure-mcp-skills/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 28.6s |
| Timestamp | 2026-04-30T23:22:42Z |
| Files Generated | 0 |
| Event Count | 42 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 28.5s |
| **Total** | **28.6s** |

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
| Token Usage | in=51718 out=1575 |
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
{"intent":"Azure Node.js authentication with service principal","learn":true}
```

## Copilot Response

Use `ClientSecretCredential` from `@azure/identity` and pass it to any Azure SDK client. Here’s a complete TypeScript example with package setup, auth, SDK usage, and failure handling.

1. **Required npm packages**

```bash
npm install @azure/identity @azure/storage-blob dotenv
npm install -D typescript ts-node @types/node
```

2. **Create `ClientSecretCredential` + 3. Use with an Azure SDK client**

```ts
// src/index.ts
import "dotenv/config";
import {
  ClientSecretCredential,
  AuthenticationError,
  CredentialUnavailableError,
} from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function isAuthFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; code?: string; message?: string };
  return (
    e.name === "AuthenticationError" ||
    e.name === "CredentialUnavailableError" ||
    e.code === "AuthenticationFailed" ||
    e.message?.includes("AADSTS") === true
  );
}

async function main() {
  const tenantId = required("AZURE_TENANT_ID");
  const clientId = required("AZURE_CLIENT_ID");
  const clientSecret = required("AZURE_CLIENT_SECRET");
  const storageAccountName = required("AZURE_STORAGE_ACCOUNT_NAME");

  // Service Principal auth with client secret
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

  // Any Azure SDK client can use this credential
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential
  );

  // Example call: list container names
  for await (const container of blobServiceClient.listContainers()) {
    console.log(`Container: ${container.name}`);
  }
}

main().catch((error: unknown) => {
  if (error instanceof AuthenticationError || error instanceof CredentialUnavailableError || isAuthFailure(error)) {
    console.error("Azure authentication failed.");
    console.error(
      "Check AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, " +
      "Service Principal permissions, and whether the secret is expired."
    );
    process.exit(1);
  }

  console.error("Unexpected error:", error);
  process.exit(2);
});
```

Run it:

```bash
npx ts-node src/index.ts
```

`.env` example:

```env
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-client-secret
AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
```

4. **Best practices for secret management (Node.js)**  
- Keep secrets in environment variables or a secret store (prefer **Azure Key Vault**), never hardcoded.  
- Use `.env` only for local dev; add it to `.gitignore`.  
- Rotate client secrets regularly and set expiry reminders.  
- Use least-privilege RBAC for the Service Principal.  
- In Azure-hosted apps, prefer **Managed Identity** over client secrets when possible.

5. **Auth failure handling**  
Catch `AuthenticationError` / `CredentialUnavailableError`, log safe diagnostics (no secrets), return non-zero exit codes, and include actionable checks (tenant/client/secret validity, expiry, RBAC scope).

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config azure-mcp-skills/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
