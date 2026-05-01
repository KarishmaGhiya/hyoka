# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** baseline/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 24.8s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | baseline/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 24.8s |
| Timestamp | 2026-04-30T23:21:06Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 24.6s |
| **Total** | **24.8s** |

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
| Token Usage | in=14430 out=1487 |
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

Use `DefaultAzureCredential` from `@azure/identity` and pass it directly to Azure SDK clients (like `SecretClient`). It automatically tries multiple auth methods in order.

1. **npm packages**
```bash
npm install @azure/identity @azure/keyvault-secrets
```
Optional for local `.env` loading:
```bash
npm install dotenv
```

2. **Create and use `DefaultAzureCredential`**
```ts
import "dotenv/config";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

async function main() {
  const keyVaultUrl = process.env.KEY_VAULT_URL;
  if (!keyVaultUrl) throw new Error("Set KEY_VAULT_URL, e.g. https://<vault-name>.vault.azure.net");

  const credential = new DefaultAzureCredential({
    // Optional for user-assigned managed identity in Azure-hosted environments:
    // managedIdentityClientId: process.env.AZURE_CLIENT_ID,
  });

  const client = new SecretClient(keyVaultUrl, credential);

  // Read secret
  const read = await client.getSecret("my-secret");
  console.log("Secret value:", read.value);

  // Write/update secret
  await client.setSecret("my-secret", "updated-value");
}

main().catch((err) => {
  console.error("Authentication or Key Vault call failed.");
  console.error(err);
  process.exit(1);
});
```

3. **Credential chain order (Node.js `DefaultAzureCredential`)**
`DefaultAzureCredential` tries credentials in this order:
1. `EnvironmentCredential`
2. `WorkloadIdentityCredential`
3. `ManagedIdentityCredential`
4. `AzureCliCredential`
5. `AzurePowerShellCredential`
6. `AzureDeveloperCliCredential`
7. `BrokerCredential` (if broker plugin is enabled)

4. **Local dev vs Azure-hosted**
- **Local dev**: usually succeeds via `az login` (Azure CLI), `azd auth login` (Azure Developer CLI), or PowerShell login.  
- **VS Code**: commonly you sign in in tooling, but for `DefaultAzureCredential` in Node, CLI-based logins are the most straightforward path unless broker-based auth is configured.
- **Azure-hosted** (App Service, Functions, Container Apps, VM, AKS, etc.): use Managed Identity (system-assigned or user-assigned). No secrets in code.

5. **Troubleshooting auth failures**
- Read the full `AggregateAuthenticationError`; it lists each credential attempt and why it failed.
- Ensure local login exists: `az login`, and correct subscription: `az account set --subscription "<id-or-name>"`.
- If using `EnvironmentCredential`, verify `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (or cert vars) are set correctly.
- If using Managed Identity, verify identity is enabled and has Key Vault permissions (RBAC role like **Key Vault Secrets User** or access policy).
- Verify `KEY_VAULT_URL` is correct and network/firewall rules allow access.
- Enable SDK logs when needed (for example with `AZURE_LOG_LEVEL=verbose`).



## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config baseline/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
