# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** azure-mcp-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 38.1s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | azure-mcp-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 38.1s |
| Timestamp | 2026-04-30T23:22:52Z |
| Files Generated | 0 |
| Event Count | 54 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 38.0s |
| **Total** | **38.1s** |

## Configuration

- **name:** azure-mcp-skills/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=104374 out=1299 |
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

The user wants a TypeScript example for Azure Service Principal authentication with client secret. This is a knowledge/documentation question. Let me provide a complete example.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating SP auth example"}
```

### 🔧 2. azure-documentation (via azure)

**Input:**

```json
{"intent":"Authenticate with Azure SDK for JavaScript using service principal client secret ClientSecretCredential","learn":true}
```

### 🔧 3. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"intent":"Best practices for Azure Identity SDK service principal authentication in Node.js TypeScript with ClientSecretCredential","learn":true}
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

// ── Best Practice: Load secrets from environment variables, never hardcode ──
interface ServicePrincipalConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

function loadConfig(): ServicePrincipalConfig {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing required environment variables: " +
        "AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
    );
  }

  return { tenantId, clientId, clientSecret };
}

// ── Create the credential and use it with an SDK client ──
async function main(): Promise<void> {
  const { tenantId, clientId, clientSecret } = loadConfig();

  // 2. Create ClientSecretCredential
  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
  );

  // 3. Use with any Azure SDK client (Key Vault example)
  const vaultUrl = process.env.AZURE_KEYVAULT_URL ?? "https://my-vault.vault.azure.net";
  const secretClient = new SecretClient(vaultUrl, credential);

  try {
    // Example operation: list secrets
    for await (const secretProperties of secretClient.listPropertiesOfSecrets()) {
      console.log(`Secret: ${secretProperties.name}`);
    }
  } catch (error: unknown) {
    // 5. Error handling for auth failures
    handleAuthError(error);
  }
}

function handleAuthError(error: unknown): void {
  if (!(error instanceof Error)) {
    console.error("Unknown error:", error);
    process.exit(1);
  }

  const msg = error.message;

  if (msg.includes("AADSTS7000215")) {
    console.error("Invalid client secret. Rotate it in Azure Portal → App registrations.");
  } else if (msg.includes("AADSTS700016")) {
    console.error("Application not found. Verify AZURE_CLIENT_ID.");
  } else if (msg.includes("AADSTS90002")) {
    console.error("Tenant not found. Verify AZURE_TENANT_ID.");
  } else if (msg.includes("AuthorizationFailed")) {
    console.error("SP lacks required RBAC role on the target resource.");
  } else {
    console.error("Authentication error:", msg);
  }

  process.exit(1);
}

main();
```

### Best Practices Summary

| Practice | Why |
|---|---|
| **Use env vars** (`AZURE_TENANT_ID`, etc.) | Keeps secrets out of code and source control |
| **Prefer `DefaultAzureCredential`** in prod | Auto-chains managed identity → env vars → CLI; avoids secret management entirely when possible |
| **Rotate secrets** on a schedule | Limits blast radius of leaked credentials |
| **Use Key Vault** or a secret manager | Never store secrets in config files or `.env` committed to git |
| **Scope RBAC narrowly** | Grant least-privilege roles to the SP |
| **Add `.env` to `.gitignore`** | Prevents accidental secret commits |

> **Tip:** If running on Azure (App Service, AKS, Functions), prefer **Managed Identity** with `DefaultAzureCredential` — it eliminates client secrets entirely. Use `ClientSecretCredential` mainly for local dev or external CI/CD.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config azure-mcp-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
