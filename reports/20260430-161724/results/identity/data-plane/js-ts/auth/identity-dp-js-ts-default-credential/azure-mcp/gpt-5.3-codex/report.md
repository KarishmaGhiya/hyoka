# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** azure-mcp/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 46.9s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | azure-mcp/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 46.9s |
| Timestamp | 2026-04-30T23:17:24Z |
| Files Generated | 0 |
| Event Count | 46 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 46.8s |
| **Total** | **46.9s** |

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
| Token Usage | in=32367 out=1314 |
| Turn Count | 2 |

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

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Checking Azure auth docs"}
```

### 🔧 2. web_fetch

**Input:**

```json
{"max_length":12000,"url":"https://learn.microsoft.com/en-us/javascript/api/%40azure/identity/defaultazurecredential?view=azure-node-latest"}
```

### 🔧 3. web_fetch

**Input:**

```json
{"max_length":12000,"url":"https://learn.microsoft.com/en-us/azure/developer/javascript/sdk/authentication/credential-chains"}
```

## Copilot Response

Use `DefaultAzureCredential` from `@azure/identity` and pass it directly into Azure SDK clients.

1. **npm packages needed**

```bash
npm install @azure/identity @azure/keyvault-secrets
```

Optional for local env files/logging:
```bash
npm install -D typescript ts-node
npm install dotenv @azure/logger
```

2. **Create and use a `DefaultAzureCredential`**

```ts
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();
// pass credential to any Azure SDK client constructor
```

3. **Default credential chain order (JavaScript/TypeScript)**

`DefaultAzureCredential` tries, in order:

1. `EnvironmentCredential`
2. `WorkloadIdentityCredential`
3. `ManagedIdentityCredential`
4. `VisualStudioCodeCredential`
5. `AzureCliCredential`
6. `AzurePowerShellCredential`
7. `AzureDeveloperCliCredential`
8. Broker credential (requires `@azure/identity-broker`)

It stops at the first credential that returns a token.

4. **Local dev vs Azure-hosted**

- **Local dev**: usually succeeds via VS Code sign-in, `az login`, PowerShell login, or `azd auth login`.
- **Azure-hosted**: usually succeeds via **Managed Identity** (or Workload Identity on AKS/federated setups), without storing secrets in code.
- You can also force service-principal auth anywhere with environment variables (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`).

5. **Troubleshooting auth failures**

- Turn on identity logs:
  - `setLogLevel("verbose")` from `@azure/logger`, or set `AZURE_LOG_LEVEL=verbose`.
- Read the aggregated error: it lists each credential attempt and why it failed.
- Verify:
  - Correct Key Vault URL and secret name.
  - Correct RBAC/access policy permissions (`Key Vault Secrets User` / `Secrets Officer`, etc.).
  - Local login state (`az account show`, VS Code Azure sign-in).
  - Environment variables are set exactly and not stale.
  - For managed identity, ensure identity is enabled and assigned permissions on the target resource.

```ts
// index.ts
import "dotenv/config";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { setLogLevel } from "@azure/logger";

async function main(): Promise<void> {
  // Optional: verbose identity logging while troubleshooting
  // setLogLevel("verbose");

  const keyVaultName = process.env.KEY_VAULT_NAME;
  const secretName = process.env.SECRET_NAME ?? "my-secret";

  if (!keyVaultName) {
    throw new Error("Missing KEY_VAULT_NAME environment variable.");
  }

  const vaultUrl = `https://${keyVaultName}.vault.azure.net`;
  const credential = new DefaultAzureCredential();

  const client = new SecretClient(vaultUrl, credential);

  // Example write + read
  await client.setSecret(secretName, "hello-from-defaultazurecredential");
  const secret = await client.getSecret(secretName);

  console.log(`Secret '${secretName}' value: ${secret.value}`);
}

main().catch((err) => {
  console.error("Authentication or Key Vault operation failed.");
  console.error(err);
  process.exit(1);
});
```

Required env vars for this sample:
- `KEY_VAULT_NAME=<your-vault-name>`
- `SECRET_NAME=<optional-secret-name>`

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config azure-mcp/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
