# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** baseline/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 24.6s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | baseline/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 24.6s |
| Timestamp | 2026-05-01T00:49:32Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 24.5s |
| **Total** | **24.6s** |

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
| Token Usage | in=16509 out=1197 |
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

The user wants a TypeScript example for Azure Service Principal authentication with client secret. This is a knowledge/documentation question - I can answer directly without needing to explore a codebase.

## Copilot Response

Here's a complete TypeScript example for Azure Service Principal authentication:

## Required packages

```bash
npm install @azure/identity @azure/keyvault-secrets dotenv
npm install -D typescript @types/node
```

## Complete Example

```typescript
// src/azure-auth.ts
import { ClientSecretCredential, AuthenticationError } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import "dotenv/config";

// 1. Load config from environment variables (never hardcode secrets)
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

// 2. Create the credential
function createCredential(config: ServicePrincipalConfig): ClientSecretCredential {
  return new ClientSecretCredential(
    config.tenantId,
    config.clientId,
    config.clientSecret,
    {
      // Optional: restrict to specific cloud
      authorityHost: "https://login.microsoftonline.com",
    }
  );
}

// 3. Use with an Azure SDK client (Key Vault example)
async function main(): Promise<void> {
  const config = loadConfig();
  const credential = createCredential(config);

  const vaultUrl = process.env.AZURE_VAULT_URL ?? "https://my-vault.vault.azure.net";
  const client = new SecretClient(vaultUrl, credential);

  try {
    // Test the credential by listing secrets
    for await (const secretProperties of client.listPropertiesOfSecrets()) {
      console.log(`Secret: ${secretProperties.name}`);
    }

    // Get a specific secret
    const secret = await client.getSecret("my-secret");
    console.log(`Retrieved secret, expires: ${secret.properties.expiresOn}`);
  } catch (err: unknown) {
    handleAuthError(err);
  }
}

// 4. Error handling for authentication failures
function handleAuthError(err: unknown): never {
  if (err instanceof AuthenticationError) {
    switch (err.statusCode) {
      case 401:
        console.error("Invalid credentials — check client ID/secret");
        break;
      case 403:
        console.error("Insufficient permissions — check RBAC role assignments");
        break;
      case 404:
        console.error("Tenant not found — verify AZURE_TENANT_ID");
        break;
      default:
        console.error(`Auth failed (${err.statusCode}): ${err.message}`);
    }
  } else if (err instanceof Error) {
    console.error(`Unexpected error: ${err.message}`);
  }
  process.exit(1);
}

main();
```

## `.env` file (never commit this)

```
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_VAULT_URL=https://my-vault.vault.azure.net
```

## Best Practices

| Practice | Details |
|---|---|
| **Never hardcode secrets** | Use env vars, `.env` files (gitignored), or a vault |
| **Use `DefaultAzureCredential`** in production | It chains multiple auth methods (managed identity → env vars → CLI) automatically |
| **Rotate secrets** | Set expiration on SP credentials; automate rotation |
| **Least privilege** | Assign narrow RBAC roles, not Contributor/Owner |
| **Add `.env` to `.gitignore`** | Prevents accidental secret commits |
| **Prefer Managed Identity** | On Azure-hosted compute, eliminates secrets entirely |

> **Tip:** `DefaultAzureCredential` from `@azure/identity` automatically picks up `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` env vars — no explicit `ClientSecretCredential` needed. Use `ClientSecretCredential` only when you need explicit control.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config baseline/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
