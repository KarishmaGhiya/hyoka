# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** baseline-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 23.1s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | baseline-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 23.1s |
| Timestamp | 2026-04-30T23:23:28Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 23.0s |
| **Total** | **23.1s** |

## Configuration

- **model:** claude-opus-4.6
- **name:** baseline-skills/claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=16454 out=1061 |
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

The user wants a complete TypeScript example for Azure Service Principal authentication with client secret. This is a knowledge/documentation question - I can answer directly without needing to search the codebase.

## Copilot Response

Here's a complete TypeScript example for Azure Service Principal authentication:

## Required npm packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

## Complete Example

```typescript
import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// --- 1. Load config from environment variables (never hardcode secrets) ---
interface ServicePrincipalConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

function loadConfig(): ServicePrincipalConfig {
  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;

  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    throw new Error(
      "Missing required env vars: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
    );
  }

  return {
    tenantId: AZURE_TENANT_ID,
    clientId: AZURE_CLIENT_ID,
    clientSecret: AZURE_CLIENT_SECRET,
  };
}

// --- 2. Create the credential ---
function createCredential(config: ServicePrincipalConfig): ClientSecretCredential {
  return new ClientSecretCredential(
    config.tenantId,
    config.clientId,
    config.clientSecret,
    {
      // Optional: restrict to specific authority host
      authorityHost: "https://login.microsoftonline.com",
    }
  );
}

// --- 3. Use it with an Azure SDK client ---
async function main(): Promise<void> {
  const config = loadConfig();
  const credential = createCredential(config);

  // Example: Key Vault client
  const vaultUrl = process.env.AZURE_VAULT_URL ?? "https://my-vault.vault.azure.net";
  const secretClient = new SecretClient(vaultUrl, credential);

  try {
    // Verify authentication by fetching a secret
    const secret = await secretClient.getSecret("my-secret-name");
    console.log(`Secret retrieved: ${secret.name}`);
  } catch (err: unknown) {
    handleAuthError(err);
  }
}

// --- 4. Error handling for auth failures ---
function handleAuthError(err: unknown): never {
  if (!(err instanceof Error)) throw err;

  const msg = err.message;

  if (msg.includes("AADSTS7000215")) {
    throw new Error("Invalid client secret. Rotate it in Azure AD → App registrations.");
  }
  if (msg.includes("AADSTS700016")) {
    throw new Error("Application not found. Verify AZURE_CLIENT_ID.");
  }
  if (msg.includes("AADSTS90002")) {
    throw new Error("Tenant not found. Verify AZURE_TENANT_ID.");
  }

  throw new Error(`Azure auth failed: ${msg}`);
}

main().catch(console.error);
```

## Best Practices for Secret Management

| Practice | Details |
|---|---|
| **Never hardcode secrets** | Use env vars or a secrets manager |
| **Use `.env` files locally** | With `dotenv`, add `.env` to `.gitignore` |
| **Prefer Managed Identity in Azure** | Use `DefaultAzureCredential` — it tries managed identity first, then falls back to SP |
| **Rotate secrets regularly** | Set expiry policies in Azure AD |
| **Least privilege** | Grant only required RBAC roles to the SP |
| **Use Key Vault** | Store app secrets in Key Vault, not in config files |

### `DefaultAzureCredential` (recommended for production)

```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Automatically uses Managed Identity in Azure, env-based SP locally
const credential = new DefaultAzureCredential();
```

This tries (in order): environment variables → managed identity → Azure CLI → and more, so the same code works locally and in production without changes.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config baseline-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
