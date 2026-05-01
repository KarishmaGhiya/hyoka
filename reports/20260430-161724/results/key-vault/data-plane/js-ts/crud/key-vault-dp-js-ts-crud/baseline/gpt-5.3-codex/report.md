# Evaluation Report: key-vault-dp-js-ts-crud

**Config:** baseline/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 15.1s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `key-vault-dp-js-ts-crud` |
| Config | baseline/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 15.1s |
| Timestamp | 2026-04-30T23:25:26Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 15.1s |
| **Total** | **15.1s** |

## Configuration

- **name:** baseline/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=14431 out=779 |
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

```ts
// file: keyvault-crud.ts
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

async function main() {
  const keyVaultUrl = process.env.KEY_VAULT_URL; // e.g. https://<your-vault-name>.vault.azure.net
  if (!keyVaultUrl) {
    throw new Error("Missing KEY_VAULT_URL environment variable.");
  }

  const credential = new DefaultAzureCredential();
  const client = new SecretClient(keyVaultUrl, credential);

  const secretName = "my-secret";

  try {
    // 1) Create
    await client.setSecret(secretName, "my-secret-value");
    console.log(`Created secret: ${secretName}`);

    // 2) Read
    const readResult = await client.getSecret(secretName);
    console.log(`Read secret value: ${readResult.value}`);

    // 3) Update
    await client.setSecret(secretName, "updated-value");
    console.log(`Updated secret: ${secretName}`);

    // 4) Delete + purge
    const deletePoller = await client.beginDeleteSecret(secretName);
    await deletePoller.pollUntilDone();
    console.log(`Deleted secret: ${secretName}`);

    await client.purgeDeletedSecret(secretName);
    console.log(`Purged secret: ${secretName}`);
  } catch (err: any) {
    console.error("Key Vault CRUD operation failed.");
    console.error(`Message: ${err?.message ?? "Unknown error"}`);
    if (err?.statusCode) {
      console.error(`StatusCode: ${err.statusCode}`);
    }
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
```

**Required npm packages**
```bash
npm install @azure/identity @azure/keyvault-secrets
npm install -D typescript ts-node @types/node
```

**Run**
```bash
# set env var first
# Windows PowerShell:
$env:KEY_VAULT_URL="https://<your-vault-name>.vault.azure.net"

npx ts-node keyvault-crud.ts
```

## Re-run Command

```bash
hyoka run --prompt-id key-vault-dp-js-ts-crud --config baseline/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
