# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** baseline-skills/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 22.9s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | baseline-skills/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 22.9s |
| Timestamp | 2026-04-30T23:20:56Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 22.7s |
| **Total** | **22.9s** |

## Configuration

- **name:** baseline-skills/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=14429 out=1476 |
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

Use `DefaultAzureCredential` from `@azure/identity` and pass it directly to SDK clients (like Key Vault’s `SecretClient`).

1. **npm packages**
   ```bash
   npm install @azure/identity @azure/keyvault-secrets
   ```
   Optional for richer local sign-in support:
   ```bash
   npm install @azure/identity-vscode
   ```

2. **Create and use `DefaultAzureCredential`**
   ```ts
   import { DefaultAzureCredential } from "@azure/identity";

   const credential = new DefaultAzureCredential();
   // pass `credential` into any Azure SDK client constructor
   ```

3. **Credential chain order (Node.js)**
   `DefaultAzureCredential` tries multiple credential types in order until one returns a token. Typical order is:
   1. Environment credential (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` / cert)
   2. Workload identity credential (Kubernetes/OIDC federation)
   3. Managed identity credential (Azure-hosted identity)
   4. Developer credentials (VS Code, Azure CLI, Azure PowerShell, Azure Developer CLI, depending on setup/package support)

   If one is unavailable, it moves to the next; if all fail, it throws.

4. **Local dev vs Azure-hosted**
   - **Local dev:** usually authenticates through your developer login (Azure CLI `az login`, VS Code account, Azure Developer CLI, etc.).
   - **Azure-hosted (App Service, Functions, VM, AKS, Container Apps):** usually authenticates with **Managed Identity** or workload identity, without storing secrets.

5. **Troubleshooting failures**
   - Check the exact error details (it lists each attempted credential and why it failed).
   - Verify tenant/subscription/account context:
     - `az login`
     - `az account show`
   - If using environment creds, confirm all required vars are set correctly.
   - If using managed identity, ensure identity is enabled and has RBAC/data-plane access.
   - Enable SDK auth logs:
     - `set AZURE_LOG_LEVEL=info` (Windows CMD) or `$env:AZURE_LOG_LEVEL="info"` (PowerShell).

```ts
// index.ts
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

async function main(): Promise<void> {
  const keyVaultUrl = process.env.KEY_VAULT_URL;
  if (!keyVaultUrl) {
    throw new Error("Missing KEY_VAULT_URL. Example: https://<your-vault-name>.vault.azure.net");
  }

  const credential = new DefaultAzureCredential({
    // Optional: pin tenant for developer-tool credentials
    // tenantId: process.env.AZURE_TENANT_ID,
  });

  const client = new SecretClient(keyVaultUrl, credential);

  // Example operation
  const secretName = "my-secret";
  const response = await client.getSecret(secretName);
  console.log(`Secret '${secretName}' value: ${response.value}`);
}

main().catch((err) => {
  console.error("Authentication or Key Vault call failed.");
  console.error(err);
  process.exit(1);
});
```

Example run (PowerShell):
```powershell
$env:KEY_VAULT_URL="https://<your-vault-name>.vault.azure.net"
az login
npx ts-node index.ts
```

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config baseline-skills/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
