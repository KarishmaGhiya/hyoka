# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** baseline/gpt-5.4 | **Result:** ❌ FAILED | **Duration:** 21.4s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | baseline/gpt-5.4 |
| Result | ❌ FAILED |
| Duration | 21.4s |
| Timestamp | 2026-05-01T00:49:17Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 21.4s |
| **Total** | **21.4s** |

## Configuration

- **name:** baseline/gpt-5.4
- **model:** gpt-5.4

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.4 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=14428 out=1261 |
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

Use `@azure/identity` to create a `ClientSecretCredential`, then pass it to any Azure SDK client. Here’s a complete TypeScript example using **Azure Key Vault**.

**Required packages**

```bash
npm install @azure/identity @azure/keyvault-secrets dotenv
npm install -D typescript ts-node @types/node
```

**TypeScript example**

```ts
// src/index.ts
import "dotenv/config";
import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const tenantId = required("AZURE_TENANT_ID");
  const clientId = required("AZURE_CLIENT_ID");
  const clientSecret = required("AZURE_CLIENT_SECRET");
  const keyVaultUrl = required("AZURE_KEY_VAULT_URL");

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
  );

  try {
    // Optional: explicitly verify auth early
    await credential.getToken("https://vault.azure.net/.default");

    const client = new SecretClient(keyVaultUrl, credential);

    const secretName = "my-secret";
    const secret = await client.getSecret(secretName);

    console.log(`Secret "${secretName}" value:`, secret.value);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Azure authentication or client call failed.");
      console.error(error.message);
    } else {
      console.error("Unknown Azure error:", error);
    }

    process.exitCode = 1;
  }
}

void main();
```

**Example `.env`**

```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-app-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_KEY_VAULT_URL=https://your-vault-name.vault.azure.net
```

**How the credential is created**

```ts
const credential = new ClientSecretCredential(
  tenantId,
  clientId,
  clientSecret
);
```

**Using it with an Azure SDK client**

Any Azure SDK client that accepts a `TokenCredential` works similarly:

```ts
const client = new SecretClient(keyVaultUrl, credential);
```

**Best practices for secret management in Node.js**

1. **Never hardcode secrets** in source code.
2. **Use environment variables** for local development.
3. **Store secrets in Azure Key Vault** or your platform’s secret store in shared environments.
4. **Prefer Managed Identity** in Azure-hosted production apps instead of client secrets when possible.
5. **Rotate secrets regularly** and keep app registrations scoped to the minimum required permissions.
6. **Do not log secrets** or full connection details.

**Authentication failure handling**

Common causes:
- wrong tenant ID, client ID, or client secret
- expired secret
- service principal lacks permissions on the target resource
- wrong resource scope or endpoint

A useful pattern is the explicit token check before creating or using the client:

```ts
await credential.getToken("https://vault.azure.net/.default");
```

That makes auth failures show up immediately instead of later during the SDK call.

If you want the same pattern with a different Azure SDK client, swap `SecretClient` for the client you need and keep the same `credential`.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config baseline/gpt-5.4
```

---

[← Back to Summary](../../../../../../summary.md)
