# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** azure-mcp/gpt-5.4 | **Result:** ❌ FAILED | **Duration:** 43.3s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | azure-mcp/gpt-5.4 |
| Result | ❌ FAILED |
| Duration | 43.3s |
| Timestamp | 2026-05-01T00:47:30Z |
| Files Generated | 0 |
| Event Count | 71 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 43.2s |
| **Total** | **43.3s** |

## Configuration

- **name:** azure-mcp/gpt-5.4
- **model:** gpt-5.4

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.4 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=88849 out=2093 |
| Turn Count | 3 |

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
{"intent":"Provide best practices for authenticating to Azure in Node.js using a service principal with client secret","learn":true}
```

### 🔧 3. azure-documentation (via azure)

**Input:**

```json
{"intent":"Find official docs for Azure Identity ClientSecretCredential in JavaScript/TypeScript and Azure SDK authentication best practices","learn":true}
```

### 🔧 4. report_intent

**Input:**

```json
{"intent":"Collecting Azure references"}
```

### 🔧 5. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"command":"get_azure_bestpractices_get","intent":"Get best practices for Azure code generation in Node.js/TypeScript authentication example","parameters":{"action":"code-generation","resource":"general"}}
```

### 🔧 6. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_search","intent":"Search Microsoft docs for ClientSecretCredential JavaScript TypeScript and Azure SDK client usage","parameters":{"query":"ClientSecretCredential JavaScript TypeScript Azure SDK authenticate service principal client secret"}}
```

### 🔧 7. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_code_sample_search","intent":"Search official TypeScript code samples for ClientSecretCredential and Azure SDK clients","parameters":{"language":"typescript","query":"ClientSecretCredential Azure SDK JavaScript TypeScript service principal client secret"}}
```

## Copilot Response

I’m pulling the official Azure guidance and SDK patterns, then I’ll condense it into a complete TypeScript example.

Use `@azure/identity` with `ClientSecretCredential`, then pass that credential into the Azure SDK client you need. For a Node.js daemon, worker, or CI job, this is the standard service principal + client secret pattern.

**npm packages**

```bash
npm install @azure/identity @azure/storage-blob
npm install -D dotenv
```

- `@azure/identity`: creates the credential
- `@azure/storage-blob`: example Azure SDK client
- `dotenv`: optional for local development only

**Complete TypeScript example**

```ts
// src/index.ts
import "dotenv/config";
import { ClientSecretCredential, CredentialUnavailableError } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const tenantId = getRequiredEnv("AZURE_TENANT_ID");
  const clientId = getRequiredEnv("AZURE_CLIENT_ID");
  const clientSecret = getRequiredEnv("AZURE_CLIENT_SECRET");
  const storageAccountName = getRequiredEnv("AZURE_STORAGE_ACCOUNT_NAME");
  const containerName = getRequiredEnv("AZURE_STORAGE_CONTAINER_NAME");

  // 1. Create the credential from tenant ID, client ID, and client secret
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

  // Optional: fail fast and prove auth works before creating service clients
  await credential.getToken("https://storage.azure.com/.default");

  // 2. Use the credential with an Azure SDK client
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential,
  );

  const containerClient = blobServiceClient.getContainerClient(containerName);

  console.log(`Listing blobs in container: ${containerName}`);
  for await (const blob of containerClient.listBlobsFlat()) {
    console.log(`- ${blob.name}`);
  }
}

main().catch((error: unknown) => {
  if (error instanceof CredentialUnavailableError) {
    console.error("Azure credential is unavailable:", error.message);
    process.exit(1);
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("unauthorized") ||
      message.includes("invalid_client") ||
      message.includes("invalid secret") ||
      message.includes("aadsts")
    ) {
      console.error("Azure authentication failed. Check tenant ID, client ID, client secret, and app permissions.");
      console.error(error.message);
      process.exit(1);
    }

    console.error("Application failed:", error.message);
    process.exit(1);
  }

  console.error("Application failed with an unknown error.");
  process.exit(1);
});
```

**`.env` for local development**

```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-service-principal-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
AZURE_STORAGE_CONTAINER_NAME=your-container-name
```

**Best practices for secret management in Node.js**

1. **Do not hardcode secrets** in source files.
2. **Use environment variables** for local/dev and CI.
3. **Use Azure Key Vault** for production secret storage and rotation.
4. **Prefer Managed Identity** instead of client secrets when the app runs on Azure.
5. **Grant least privilege** to the service principal.
6. **Rotate secrets regularly** and avoid logging them.
7. **Keep `.env` out of git** by adding it to `.gitignore`.

**Notes on authentication failures**

- Common causes: wrong tenant ID, wrong client ID, expired secret, wrong secret value, or missing RBAC/data-plane permissions.
- `getToken()` is useful as an early auth check before making service calls.
- A valid token is not enough by itself; the service principal also needs permission on the target resource.

**References**

- https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/on-premises-apps#authenticate-to-azure-services-from-your-app
- https://learn.microsoft.com/javascript/api/@azure/identity/clientsecretcredential?view=azure-node-latest

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config azure-mcp/gpt-5.4
```

---

[← Back to Summary](../../../../../../summary.md)
