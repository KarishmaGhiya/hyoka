# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** baseline/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 19.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | baseline/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 19.7s |
| Timestamp | 2026-04-30T23:23:30Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 19.7s |
| **Total** | **19.7s** |

## Configuration

- **name:** baseline/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=16455 out=822 |
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

## Copilot Reasoning

The user wants a TypeScript example for Azure Service Principal authentication with client secret. This is a knowledge/documentation question - I can answer directly without needing to explore any codebase.

## Copilot Response

Here's a complete guide to Azure Service Principal authentication in TypeScript:

## Required Packages

```bash
npm install @azure/identity @azure/keyvault-secrets
# Or any Azure SDK client library you need
```

## Complete TypeScript Example

```typescript
import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// 1. Load credentials from environment variables (best practice)
const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;

if (!tenantId || !clientId || !clientSecret) {
  throw new Error(
    "Missing required env vars: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
  );
}

// 2. Create the credential
const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

// 3. Use it with any Azure SDK client
const vaultUrl = "https://my-keyvault.vault.azure.net";
const secretClient = new SecretClient(vaultUrl, credential);

async function main() {
  try {
    // Example: list secrets from Key Vault
    for await (const secretProperties of secretClient.listPropertiesOfSecrets()) {
      console.log(`Secret: ${secretProperties.name}`);
    }
  } catch (err: unknown) {
    // 4. Handle authentication errors specifically
    if (err instanceof Error) {
      if (err.name === "AuthenticationError" || err.name === "CredentialUnavailableError") {
        console.error("Authentication failed — check tenant/client/secret values:", err.message);
      } else if (err.name === "RestError") {
        console.error("Azure service error:", err.message);
      } else {
        console.error("Unexpected error:", err.message);
      }
    }
    process.exit(1);
  }
}

main();
```

## Best Practices

| Practice | Details |
|---|---|
| **Never hardcode secrets** | Use env vars, `.env` files (with `dotenv`), or Azure Key Vault |
| **Use `DefaultAzureCredential`** | Falls back through multiple auth methods — ideal for code that runs both locally and in Azure |
| **Rotate secrets regularly** | Set expiration on app registrations; use certificate credentials when possible |
| **Least privilege** | Assign only needed RBAC roles to the service principal |
| **`.gitignore` your `.env`** | Prevent accidental secret commits |

## `DefaultAzureCredential` Alternative (Recommended)

```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Automatically picks up AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
// from env vars — and also works with managed identity, Azure CLI, etc.
const credential = new DefaultAzureCredential();
```

Use `ClientSecretCredential` when you need explicit control; use `DefaultAzureCredential` for portability across environments.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config baseline/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
