# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** azure-mcp-skills/gpt-5.4 | **Result:** ❌ FAILED | **Duration:** 82.4s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | azure-mcp-skills/gpt-5.4 |
| Result | ❌ FAILED |
| Duration | 82.4s |
| Timestamp | 2026-05-01T00:47:57Z |
| Files Generated | 0 |
| Event Count | 91 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 82.3s |
| **Total** | **82.4s** |

## Configuration

- **name:** azure-mcp-skills/gpt-5.4
- **model:** gpt-5.4

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.4 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=115372 out=4891 |
| Turn Count | 4 |

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
{"intent":"Get best practices for authenticating to Azure from Node.js using a service principal with client secret and using Azure SDK clients in TypeScript","learn":true}
```

### 🔧 3. azure-documentation (via azure)

**Input:**

```json
{"intent":"Find official Microsoft documentation for authenticating to Azure from Node.js using ClientSecretCredential and service principals in TypeScript","learn":true}
```

### 🔧 4. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"command":"get_azure_bestpractices_get","intent":"Get code generation best practices for Azure authentication in Node.js/TypeScript using a service principal with client secret and Azure SDK clients"}
```

### 🔧 5. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_search","intent":"Search Microsoft docs for ClientSecretCredential service principal authentication in TypeScript and using Azure SDK clients in Node.js"}
```

### 🔧 6. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_code_sample_search","intent":"Search Microsoft code samples for ClientSecretCredential with TypeScript and Azure SDK clients"}
```

### 🔧 7. report_intent

**Input:**

```json
{"intent":"Fetching Azure docs"}
```

### 🔧 8. web_fetch

**Input:**

```json
{"max_length":7000,"url":"https://learn.microsoft.com/en-us/javascript/api/@azure/identity/clientsecretcredential?view=azure-node-latest"}
```

### 🔧 9. web_fetch

**Input:**

```json
{"max_length":7000,"url":"https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-node-latest"}
```

### 🔧 10. web_fetch

**Input:**

```json
{"max_length":7000,"url":"https://learn.microsoft.com/en-us/azure/developer/javascript/sdk/authentication/overview"}
```

## Copilot Response

I’m pulling the official Azure guidance and sample patterns so the TypeScript example matches current SDK usage.

Use `@azure/identity` for the credential and pass it into the Azure SDK client you actually want to call. For a complete TypeScript example, this uses **Azure Key Vault Secrets**, but the same pattern works for other SDK clients.

1. **Required packages**
   ```bash
   npm install @azure/identity @azure/keyvault-secrets dotenv
   npm install -D typescript tsx @types/node
   ```

2. **Create `ClientSecretCredential`**
   ```ts
   const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
   ```

3. **Use it with an Azure SDK client**
   ```ts
   const client = new SecretClient(keyVaultUrl, credential);
   ```

4. **Best practices**
   - Prefer **managed identity** when running in Azure; use client secrets only when necessary.
   - Store secrets in **environment variables** or a secret store like **Azure Key Vault**; never hardcode them.
   - Use `.env` only for local development, and keep it out of source control.
   - Give the service principal **least privilege** on the target resource.
   - Rotate secrets and avoid logging secret values.

5. **Authentication error handling**
   - Validate required env vars at startup.
   - Distinguish bad credentials from authorization/resource errors.
   - Surface useful messages without printing secrets.

```dotenv
# .env (local development only)
AZURE_TENANT_ID=00000000-0000-0000-0000-000000000000
AZURE_CLIENT_ID=11111111-1111-1111-1111-111111111111
AZURE_CLIENT_SECRET=your-client-secret
KEY_VAULT_URL=https://your-vault-name.vault.azure.net/
SECRET_NAME=example-secret
```

```ts
// index.ts
import "dotenv/config";
import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

type AzureErrorLike = Error & {
  statusCode?: number;
  code?: string;
};

function asAzureError(error: unknown): AzureErrorLike | undefined {
  return error instanceof Error ? (error as AzureErrorLike) : undefined;
}

function handleAzureError(error: unknown): void {
  const err = asAzureError(error);

  if (!err) {
    console.error("Unknown error:", error);
    return;
  }

  const message = err.message ?? "";

  const isAuthFailure =
    err.name === "AuthenticationError" ||
    err.name === "CredentialUnavailableError" ||
    /AADSTS|invalid_client|unauthorized_client|invalid_tenant|invalid_client_secret/i.test(message);

  if (isAuthFailure) {
    console.error("Azure authentication failed.");
    console.error("Check AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET.");
    console.error(message);
    return;
  }

  if (err.statusCode === 403) {
    console.error("Authenticated, but not authorized for this resource.");
    console.error("Grant the service principal the required role or access policy.");
    console.error(message);
    return;
  }

  if (err.statusCode === 404) {
    console.error("Resource not found.");
    console.error(message);
    return;
  }

  console.error(`Azure request failed${err.statusCode ? ` (${err.statusCode})` : ""}.`);
  console.error(message);
}

async function main(): Promise<void> {
  const tenantId = requiredEnv("AZURE_TENANT_ID");
  const clientId = requiredEnv("AZURE_CLIENT_ID");
  const clientSecret = requiredEnv("AZURE_CLIENT_SECRET");
  const keyVaultUrl = requiredEnv("KEY_VAULT_URL");
  const secretName = requiredEnv("SECRET_NAME");

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret,
  );

  // Optional preflight auth check. For Key Vault, this is the correct scope.
  await credential.getToken("https://vault.azure.net/.default");

  const client = new SecretClient(keyVaultUrl, credential);

  const secret = await client.getSecret(secretName);

  console.log(`Connected to Key Vault: ${keyVaultUrl}`);
  console.log(`Retrieved secret metadata for: ${secret.name}`);
  console.log(`Secret version: ${secret.properties.version ?? "latest"}`);
  // Intentionally do not print secret.value
}

main().catch((error: unknown) => {
  handleAzureError(error);
  process.exitCode = 1;
});
```

Run it with:

```bash
npx tsx index.ts
```

**Notes:** the service principal must already have access to the target resource. For Key Vault, that usually means an RBAC role such as **Key Vault Secrets User** or an equivalent access policy.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config azure-mcp-skills/gpt-5.4
```

---

[← Back to Summary](../../../../../../summary.md)
