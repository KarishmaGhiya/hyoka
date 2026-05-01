# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** azure-mcp-skills/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 28.1s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | azure-mcp-skills/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 28.1s |
| Timestamp | 2026-04-30T23:20:28Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 28.0s |
| **Total** | **28.1s** |

## Configuration

- **name:** azure-mcp-skills/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=25690 out=1301 |
| Turn Count | 1 |

## Error

```
0 files generated — agent did not create any files
```

## Prompt Sent

```
Show me how to
authenticate an Azure SDK client using DefaultAzureCredential. Explain:
1. What npm packages are needed
2. How to create and use a DefaultAzureCredential instance
3. The credential chain order and which credentials are tried
4. How it works in local dev (VS Code, Azure CLI) vs Azure-hosted environments
5. How to troubleshoot authentication failures

Provide a complete TypeScript example that creates a SecretClient using
DefaultAzureCredential.
```

## Copilot Response

Use `DefaultAzureCredential` from `@azure/identity` and pass it directly to SDK clients like `SecretClient`. It will try multiple auth methods in order and use the first one that succeeds.

1. **npm packages**
   ```bash
   npm install @azure/identity @azure/keyvault-secrets
   # optional for local .env loading
   npm install dotenv
   ```
   (Plus your normal TypeScript runtime/tooling: `typescript`, `ts-node`, etc., if needed.)

2. **Create and use `DefaultAzureCredential`**
   ```ts
   import { DefaultAzureCredential } from "@azure/identity";
   const credential = new DefaultAzureCredential();
   // pass `credential` into any Azure SDK client constructor
   ```

3. **Credential chain order (Node.js, typical)**
   `DefaultAzureCredential` tries credentials in sequence until one works, commonly:
   1. `EnvironmentCredential`
   2. `WorkloadIdentityCredential`
   3. `ManagedIdentityCredential`
   4. `AzureCliCredential`
   5. `AzurePowerShellCredential`
   6. `AzureDeveloperCliCredential`
   
   (Exact chain can vary slightly by `@azure/identity` version/options.)

4. **Local dev vs Azure-hosted**
   - **Local dev**: usually succeeds via `AzureCliCredential` (`az login`) or `AzureDeveloperCliCredential` (`azd auth login`).  
   - **VS Code**: typically you still use CLI-based auth for `DefaultAzureCredential` in Node apps; sign in with `az login` from terminal.
   - **Azure-hosted (App Service, Functions, AKS, VM, Container Apps, etc.)**: it usually authenticates with **Managed Identity** automatically when enabled and granted RBAC/data-plane permissions.

5. **Troubleshooting auth failures**
   - Confirm tenant/subscription/account:
     ```bash
     az account show
     az login
     ```
   - Verify env vars if using service principal (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`).
   - Ensure managed identity is enabled in Azure-hosted env and has correct permissions.
   - For Key Vault, make sure the identity has `Key Vault Secrets User` (RBAC) or appropriate access policy.
   - Turn on verbose Azure Identity logs:
     ```bash
     set AZURE_LOG_LEVEL=verbose   # Windows cmd
     # or in PowerShell:
     $env:AZURE_LOG_LEVEL="verbose"
     ```

```ts
// index.ts
import "dotenv/config";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

async function main() {
  const vaultName = process.env.KEY_VAULT_NAME;
  if (!vaultName) {
    throw new Error("Set KEY_VAULT_NAME in environment (e.g., my-kv-name).");
  }

  const vaultUrl = `https://${vaultName}.vault.azure.net`;
  const credential = new DefaultAzureCredential();

  const client = new SecretClient(vaultUrl, credential);

  // Write a secret
  await client.setSecret("sample-secret", "hello-defaultazurecredential");

  // Read a secret
  const secret = await client.getSecret("sample-secret");
  console.log(`Secret value: ${secret.value}`);
}

main().catch((err) => {
  console.error("Authentication or Key Vault operation failed:", err);
  process.exit(1);
});
```

Example `.env`:
```env
KEY_VAULT_NAME=your-key-vault-name
```

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config azure-mcp-skills/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
