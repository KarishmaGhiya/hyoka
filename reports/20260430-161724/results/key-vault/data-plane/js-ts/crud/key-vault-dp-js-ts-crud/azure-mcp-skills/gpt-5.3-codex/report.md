# Evaluation Report: key-vault-dp-js-ts-crud

**Config:** azure-mcp-skills/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 29.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `key-vault-dp-js-ts-crud` |
| Config | azure-mcp-skills/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 29.7s |
| Timestamp | 2026-04-30T23:24:45Z |
| Files Generated | 0 |
| Event Count | 42 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 29.6s |
| **Total** | **29.7s** |

## Configuration

- **model:** gpt-5.3-codex
- **name:** azure-mcp-skills/gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=51769 out=1371 |
| Turn Count | 2 |

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

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Drafting Azure script"}
```

### 🔧 2. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"intent":"Generate Node.js TypeScript script for Azure Key Vault CRUD with DefaultAzureCredential and error handling","learn":true}
```

## Copilot Response

Use this **TypeScript** script:

```ts
// keyvault-crud.ts
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const vaultUrl = process.env.KEY_VAULT_URL; // e.g. https://<your-vault-name>.vault.azure.net
const secretName = "my-secret";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function purgeWithRetry(
  client: SecretClient,
  name: string,
  maxAttempts = 10,
  delayMs = 3000
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await client.purgeDeletedSecret(name);
      console.log(`Purged secret "${name}".`);
      return;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        console.log(`Purge not ready yet (attempt ${attempt}/${maxAttempts}), retrying...`);
        await sleep(delayMs);
      }
    }
  }

  throw new Error(`Failed to purge secret "${name}" after ${maxAttempts} attempts. Last error: ${String(lastError)}`);
}

async function main(): Promise<void> {
  if (!vaultUrl) {
    throw new Error("Missing KEY_VAULT_URL environment variable.");
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
    console.log(`Updated secret "${secretName}".`);

    // 4) Delete + Purge (soft-delete enabled vault)
    const deletePoller = await client.beginDeleteSecret(secretName);
    await deletePoller.pollUntilDone();
    console.log(`Deleted secret "${secretName}".`);

    await purgeWithRetry(client, secretName);
  } catch (err) {
    console.error("Key Vault CRUD operation failed.");
    console.error(err);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
```

Required npm packages:

```bash
npm install @azure/identity @azure/keyvault-secrets
npm install -D typescript ts-node @types/node
```

Run:

```bash
# PowerShell
$env:KEY_VAULT_URL="https://<your-vault-name>.vault.azure.net"
npx ts-node keyvault-crud.ts
```

## Re-run Command

```bash
hyoka run --prompt-id key-vault-dp-js-ts-crud --config azure-mcp-skills/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
