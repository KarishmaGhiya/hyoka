# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** baseline-skills/gpt-5.4 | **Result:** ❌ FAILED | **Duration:** 23.5s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | baseline-skills/gpt-5.4 |
| Result | ❌ FAILED |
| Duration | 23.5s |
| Timestamp | 2026-05-01T00:49:09Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 23.4s |
| **Total** | **23.5s** |

## Configuration

- **model:** gpt-5.4
- **name:** baseline-skills/gpt-5.4

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.4 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=14439 out=1354 |
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

Use `@azure/identity` to create a `ClientSecretCredential`, then pass that credential into any Azure SDK client that accepts a `TokenCredential`.

**Packages**
```bash
npm install @azure/identity @azure/keyvault-secrets dotenv
npm install -D typescript ts-node @types/node
```

**Complete TypeScript example**
```ts
// src/index.ts
import "dotenv/config";
import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

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
  const keyVaultUrl = getRequiredEnv("AZURE_KEYVAULT_URL");

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
  );

  try {
    // Optional: fail fast and validate auth before creating/using other clients.
    await credential.getToken("https://vault.azure.net/.default");

    // Example Azure SDK client using the credential.
    const secretClient = new SecretClient(keyVaultUrl, credential);

    const secret = await secretClient.getSecret("my-secret");

    console.log("Authenticated successfully.");
    console.log(`Secret name: ${secret.name}`);
    console.log(`Secret value: ${secret.value ?? "<empty>"}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Azure authentication or SDK call failed.");
      console.error(`Name: ${error.name}`);
      console.error(`Message: ${error.message}`);
    } else {
      console.error("Unknown authentication error:", error);
    }

    process.exitCode = 1;
  }
}

void main();
```

**Example `.env`**
```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-service-principal-client-id
AZURE_CLIENT_SECRET=your-service-principal-client-secret
AZURE_KEYVAULT_URL=https://your-key-vault-name.vault.azure.net/
```

**How it works**
1. `ClientSecretCredential` authenticates with **tenant ID**, **client ID**, and **client secret**.
2. That credential is passed to an Azure SDK client, here `SecretClient`.
3. The same pattern works for many SDKs that accept `TokenCredential`.

**Using it with another Azure SDK client**
```ts
import { ClientSecretCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
const blobServiceClient = new BlobServiceClient(
  "https://<storage-account>.blob.core.windows.net",
  credential
);
```

**Best practices for secret management**
- **Do not hardcode secrets** in source files.
- Use **environment variables** for local development.
- Use `.env` only for local/dev, and keep it in `.gitignore`.
- In production, store secrets in **Azure Key Vault**, GitHub Actions secrets, or your platform’s secret manager.
- Prefer **Managed Identity** over client secrets when running in Azure.
- Rotate client secrets regularly and use least-privilege RBAC.

**Authentication failure handling**
- Validate required env vars up front.
- Catch errors around both `getToken(...)` and SDK calls.
- Log the error `name` and `message`, but **never log the secret**.
- Return a non-zero exit code for automation/CI.

If you want a version using a different Azure SDK client like Storage, Graph, or Resource Manager, swap the client import and constructor while keeping the same `ClientSecretCredential` pattern.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config baseline-skills/gpt-5.4
```

---

[← Back to Summary](../../../../../../summary.md)
