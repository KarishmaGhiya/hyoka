# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** baseline/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 24.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | baseline/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 24.7s |
| Timestamp | 2026-04-30T23:23:13Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 24.6s |
| **Total** | **24.7s** |

## Configuration

- **model:** gpt-5.3-codex
- **name:** baseline/gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=14422 out=1853 |
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

Use `@azure/identity` with `ClientSecretCredential`, then pass that credential into any Azure SDK client (example below uses `@azure/arm-resources`).

1. **Required npm packages**

```bash
npm install @azure/identity @azure/arm-resources dotenv
npm install -D typescript tsx @types/node
```

2. **Create `ClientSecretCredential`**

Use `tenantId`, `clientId`, and `clientSecret` from environment variables (not hardcoded).

3. **Use it with an Azure SDK client**

Pass the credential to `ResourceManagementClient` (or any other Azure SDK client that accepts `TokenCredential`).

4. **Best practices for secret management (Node.js)**

1. Store secrets in environment variables, not source code.
2. Use `.env` only for local dev; add it to `.gitignore`.
3. In production, prefer **Managed Identity** or pull secrets from **Azure Key Vault**.
4. Rotate client secrets regularly and use least-privilege app permissions.
5. Never log secrets or full token responses.

5. **Error handling for authentication failures**

Handle token acquisition errors separately from API call errors (401/403, AADSTS codes, RBAC issues).

```ts
// src/main.ts
import "dotenv/config";
import { ClientSecretCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";
import { RestError } from "@azure/core-rest-pipeline";

type Config = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
};

function getRequiredEnv(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function loadConfig(): Config {
  return {
    tenantId: getRequiredEnv("AZURE_TENANT_ID"),
    clientId: getRequiredEnv("AZURE_CLIENT_ID"),
    clientSecret: getRequiredEnv("AZURE_CLIENT_SECRET"),
    subscriptionId: getRequiredEnv("AZURE_SUBSCRIPTION_ID"),
  };
}

function handleAuthError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("AADSTS7000215")) {
    throw new Error("Authentication failed: invalid client secret.");
  }
  if (message.includes("AADSTS700016")) {
    throw new Error("Authentication failed: invalid client ID (application not found).");
  }
  if (message.includes("AADSTS7000218")) {
    throw new Error("Authentication failed: tenant or app configuration issue.");
  }

  throw new Error(`Authentication failed: ${message}`);
}

async function main(): Promise<void> {
  const cfg = loadConfig();

  const credential = new ClientSecretCredential(
    cfg.tenantId,
    cfg.clientId,
    cfg.clientSecret
  );

  // Optional but useful: fail fast on auth before making SDK calls
  try {
    await credential.getToken("https://management.azure.com/.default");
  } catch (err) {
    handleAuthError(err);
  }

  const client = new ResourceManagementClient(credential, cfg.subscriptionId);

  try {
    console.log("Resource groups:");
    for await (const rg of client.resourceGroups.list()) {
      console.log(`- ${rg.name} (${rg.location})`);
    }
  } catch (err) {
    if (err instanceof RestError) {
      if (err.statusCode === 401) {
        throw new Error("API call failed: unauthorized (token invalid or expired).");
      }
      if (err.statusCode === 403) {
        throw new Error("API call failed: forbidden (service principal lacks RBAC permissions).");
      }
      throw new Error(`Azure API error ${err.statusCode}: ${err.message}`);
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
```

`.env` example (local dev only):
```env
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-secret
AZURE_SUBSCRIPTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config baseline/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
