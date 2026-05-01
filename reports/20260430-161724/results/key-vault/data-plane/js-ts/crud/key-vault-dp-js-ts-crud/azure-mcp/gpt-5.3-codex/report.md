# Evaluation Report: key-vault-dp-js-ts-crud

**Config:** azure-mcp/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 25.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `key-vault-dp-js-ts-crud` |
| Config | azure-mcp/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 25.0s |
| Timestamp | 2026-04-30T23:23:51Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 24.9s |
| **Total** | **25.0s** |

## Configuration

- **name:** azure-mcp/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=25717 out=1310 |
| Turn Count | 1 |

## Error

```
0 files generated — agent did not create any files
```

## Prompt Sent

```
Write a Node.js script
(TypeScript preferred) that performs all four CRUD operations on Azure Key Vault secrets:
1. Create a new secret called "my-secret" with value "my-secret-value"
2. Read the secret back and print its value
3. Update the secret to a new value "updated-value"
4. Delete the secret and purge it (soft-delete enabled vault)

Use DefaultAzureCredential for authentication. Show required npm packages
and include proper error handling with try/catch.
```

## Copilot Response

Here’s a TypeScript script that does all 4 secret CRUD operations (create, read, update, delete+purge) using `DefaultAzureCredential` with `try/catch` error handling.

```ts
// keyvault-crud.ts
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const secretName = "my-secret";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function purgeWithRetry(client: SecretClient, name: string) {
  // Deletion in Key Vault can be eventually consistent before purge is allowed.
  const maxAttempts = 15;
  const delayMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await client.purgeDeletedSecret(name);
      console.log(`Purged secret "${name}".`);
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (attempt === maxAttempts) {
        throw new Error(`Failed to purge secret after ${maxAttempts} attempts: ${message}`);
      }
      console.warn(`Purge attempt ${attempt} failed, retrying in ${delayMs}ms... (${message})`);
      await sleep(delayMs);
    }
  }
}

async function main() {
  const vaultUrl = process.env.KEY_VAULT_URL;
  if (!vaultUrl) {
    throw new Error("Missing KEY_VAULT_URL environment variable (e.g. https://<your-vault-name>.vault.azure.net)");
  }

  const credential = new DefaultAzureCredential();
  const client = new SecretClient(vaultUrl, credential);

  try {
    // 1) Create
    await client.setSecret(secretName, "my-secret-value");
    console.log(`Created secret "${secretName}".`);

    // 2) Read
    const readSecret = await client.getSecret(secretName);
    console.log(`Read secret value: ${readSecret.value}`);

    // 3) Update
    await client.setSecret(secretName, "updated-value");
    const updatedSecret = await client.getSecret(secretName);
    console.log(`Updated secret value: ${updatedSecret.value}`);

    // 4) Delete + Purge
    const deletePoller = await client.beginDeleteSecret(secretName);
    await deletePoller.pollUntilDone();
    console.log(`Deleted secret "${secretName}" (soft-delete).`);

    await purgeWithRetry(client, secretName);
  } catch (err: unknown) {
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("Key Vault CRUD operation failed:", message);
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  console.error("Unexpected failure:", message);
  process.exitCode = 1;
});
```

Required npm packages:

```bash
npm install @azure/identity @azure/keyvault-secrets
npm install -D typescript ts-node @types/node
```

Run it (PowerShell example):

```powershell
$env:KEY_VAULT_URL="https://<your-vault-name>.vault.azure.net"
npx ts-node keyvault-crud.ts
```

## Re-run Command

```bash
hyoka run --prompt-id key-vault-dp-js-ts-crud --config azure-mcp/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
