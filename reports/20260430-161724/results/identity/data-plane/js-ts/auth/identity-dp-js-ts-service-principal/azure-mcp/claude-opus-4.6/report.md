# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** azure-mcp/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 33.5s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | azure-mcp/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 33.5s |
| Timestamp | 2026-04-30T23:22:37Z |
| Files Generated | 0 |
| Event Count | 54 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 33.4s |
| **Total** | **33.5s** |

## Configuration

- **name:** azure-mcp/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=104371 out=1164 |
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

## Copilot Reasoning

The user wants a complete TypeScript example for Azure Service Principal authentication with client secret. This is a knowledge/documentation question - I can provide this directly with a code example.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating SP auth example"}
```

### 🔧 2. azure-documentation (via azure)

**Input:**

```json
{"intent":"Authenticate with Azure SDK for JavaScript using Service Principal client secret ClientSecretCredential","learn":true}
```

### 🔧 3. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"intent":"Best practices for authenticating with Azure Identity SDK in Node.js TypeScript using Service Principal ClientSecretCredential","learn":true}
```

## Copilot Response

Here's a complete TypeScript example for Azure Service Principal authentication:

---

### 1. Required npm packages

```bash
npm install @azure/identity @azure/keyvault-secrets
# Or any Azure SDK client, e.g.:
# npm install @azure/storage-blob @azure/arm-resources
```

### 2–5. Complete Example

```typescript
// azure-sp-auth.ts
import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// --- Best Practice: Load secrets from environment variables, never hardcode ---
function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  // 1. Read SP credentials from environment
  const tenantId = getRequiredEnv("AZURE_TENANT_ID");
  const clientId = getRequiredEnv("AZURE_CLIENT_ID");
  const clientSecret = getRequiredEnv("AZURE_CLIENT_SECRET");

  // 2. Create the credential
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

  // 3. Use it with any Azure SDK client (Key Vault example)
  const vaultUrl = getRequiredEnv("AZURE_KEYVAULT_URL"); // e.g. https://my-vault.vault.azure.net
  const secretClient = new SecretClient(vaultUrl, credential);

  try {
    // Example operation: list secrets
    for await (const secretProperties of secretClient.listPropertiesOfSecrets()) {
      console.log(`Secret: ${secretProperties.name}`);
    }
  } catch (err: unknown) {
    // 4. Handle authentication & authorization errors
    if (err instanceof Error) {
      if (err.name === "AuthenticationError" || err.name === "CredentialUnavailableError") {
        console.error("Authentication failed. Verify AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET.");
      } else if (err.message.includes("403")) {
        console.error("Authorization failed. The SP may lack the required RBAC role on this resource.");
      } else {
        console.error(`Azure operation failed: ${err.message}`);
      }
    }
    process.exit(1);
  }
}

main();
```

### Best Practices Summary

| Practice | Details |
|---|---|
| **Never hardcode secrets** | Use env vars or Azure Key Vault |
| **Use `.env` files locally** | With `dotenv`, add `.env` to `.gitignore` |
| **Prefer `DefaultAzureCredential`** | Falls back across Managed Identity → CLI → SP automatically |
| **Rotate secrets regularly** | Set expiration on SP credentials in Entra ID |
| **Least privilege** | Assign only the RBAC roles the SP actually needs |
| **Use Managed Identity in prod** | Eliminates secrets entirely on Azure-hosted workloads |

### `DefaultAzureCredential` alternative (recommended)

```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Automatically uses Managed Identity in Azure, 
// falls back to AZURE_TENANT_ID/CLIENT_ID/CLIENT_SECRET env vars,
// or az CLI login locally.
const credential = new DefaultAzureCredential();
```

This way the same code works locally (via SP env vars or `az login`) and in production (via Managed Identity) with zero code changes.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config azure-mcp/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
