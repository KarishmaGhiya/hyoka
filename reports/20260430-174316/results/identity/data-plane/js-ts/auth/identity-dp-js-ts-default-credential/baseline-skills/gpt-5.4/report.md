# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** baseline-skills/gpt-5.4 | **Result:** ❌ FAILED | **Duration:** 40.4s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | baseline-skills/gpt-5.4 |
| Result | ❌ FAILED |
| Duration | 40.4s |
| Timestamp | 2026-05-01T00:43:16Z |
| Files Generated | 0 |
| Event Count | 66 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 40.3s |
| **Total** | **40.4s** |

## Configuration

- **name:** baseline-skills/gpt-5.4
- **model:** gpt-5.4

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.4 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=59426 out=2311 |
| Turn Count | 3 |

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
{"intent":"Researching Azure auth"}
```

### 🔧 2. web_fetch

**Input:**

```json
{"max_length":12000,"url":"https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-node-latest"}
```

### 🔧 3. web_fetch

**Input:**

```json
{"max_length":12000,"url":"https://learn.microsoft.com/en-us/azure/developer/javascript/sdk/authentication/credential-chains"}
```

### 🔧 4. report_intent

**Input:**

```json
{"intent":"Checking auth details"}
```

### 🔧 5. web_fetch

**Input:**

```json
{"max_length":12000,"start_index":12000,"url":"https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-node-latest"}
```

### 🔧 6. web_fetch

**Input:**

```json
{"max_length":12000,"start_index":12000,"url":"https://learn.microsoft.com/en-us/azure/developer/javascript/sdk/authentication/credential-chains"}
```

### 🔧 7. web_fetch

**Input:**

```json
{"max_length":8000,"url":"https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-vscode-readme?view=azure-node-latest"}
```

## Copilot Response

I’m pulling the current Azure Identity details so the chain order and VS Code behavior match the latest JS SDK.

Use `DefaultAzureCredential` from `@azure/identity` and pass it directly to the Azure SDK client. For a Key Vault `SecretClient`, the core packages are `@azure/identity` and `@azure/keyvault-secrets`.

## 1. npm packages

**Required**
```bash
npm install @azure/identity @azure/keyvault-secrets
```

**Optional**
```bash
npm install @azure/logger
npm install -D @azure/identity-vscode
```

- `@azure/identity`: provides `DefaultAzureCredential`
- `@azure/keyvault-secrets`: provides `SecretClient`
- `@azure/logger`: useful for auth troubleshooting
- `@azure/identity-vscode`: enables VS Code sign-in support in Node.js

## 2. Create and use `DefaultAzureCredential`

```ts
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new DefaultAzureCredential();
const client = new SecretClient("https://<your-key-vault-name>.vault.azure.net", credential);
```

The client asks the credential for tokens as needed; you usually create one credential instance and reuse it.

## 3. Credential chain order

Current JavaScript `DefaultAzureCredential` tries credentials in this order:

1. `EnvironmentCredential`
2. `WorkloadIdentityCredential`
3. `ManagedIdentityCredential`
4. `VisualStudioCodeCredential`
5. `AzureCliCredential`
6. `AzurePowerShellCredential`
7. `AzureDeveloperCliCredential`
8. Broker-based OS account credential

Two important behaviors:

- **Hosted/deployed credentials** (`Environment`, `WorkloadIdentity`, `ManagedIdentity`) are tried first.
- **Developer credentials** continue down the chain until one works.

## 4. Local dev vs Azure-hosted

**Local development**
- **VS Code**: sign in through the Azure extension, install `@azure/identity-vscode`, and register the plugin.
- **Azure CLI**: run `az login`
- **Azure PowerShell**: run `Connect-AzAccount`
- **Azure Developer CLI**: run `azd auth login`

In local dev, `DefaultAzureCredential` usually succeeds through VS Code, Azure CLI, PowerShell, or `azd`.

**Azure-hosted**
- Prefer **Managed Identity** on App Service, Functions, VMs, Container Apps, etc.
- Prefer **Workload Identity** for AKS/Kubernetes scenarios.
- In hosted environments, no developer login is needed; the app gets tokens from the platform identity.

## 5. Troubleshooting auth failures

Start with these:

1. **Turn on logs**
   ```ts
   import { setLogLevel } from "@azure/logger";
   setLogLevel("verbose");
   ```
   Or set:
   ```bash
   set AZURE_LOG_LEVEL=verbose
   ```

2. **Read the chained error**
   `DefaultAzureCredential` usually reports which credentials failed and why.

3. **Check local sign-in**
   - Azure CLI: `az login`
   - Subscription: `az account show`
   - Switch subscription if needed: `az account set --subscription "<name-or-id>"`

4. **Check Key Vault permissions**
   Your identity needs access to secrets, typically via RBAC like **Key Vault Secrets User** or an access policy with `get`/`list`.

5. **Check env vars if using service principal**
   Usually:
   - `AZURE_TENANT_ID`
   - `AZURE_CLIENT_ID`
   - `AZURE_CLIENT_SECRET`

6. **Check managed identity**
   Make sure the Azure resource has managed identity enabled and that identity has access to the target resource.

7. **If VS Code auth is expected**
   Ensure `@azure/identity-vscode` is installed and `useIdentityPlugin(vsCodePlugin)` is called before creating the credential.

8. **Reduce the chain when debugging**
   You can force one credential:
   ```bash
   set AZURE_TOKEN_CREDENTIALS=AzureCliCredential
   ```

## Complete TypeScript example: `SecretClient` with `DefaultAzureCredential`

```ts
import { DefaultAzureCredential, useIdentityPlugin } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
// Optional: only needed if you want VS Code auth in local Node.js development
// import { vsCodePlugin } from "@azure/identity-vscode";

// Optional: enable this if using VS Code authentication
// useIdentityPlugin(vsCodePlugin);

async function main(): Promise<void> {
  const keyVaultName = process.env.KEY_VAULT_NAME;
  if (!keyVaultName) {
    throw new Error("Missing KEY_VAULT_NAME environment variable.");
  }

  const vaultUrl = `https://${keyVaultName}.vault.azure.net`;

  const credential = new DefaultAzureCredential({
    // If you use a user-assigned managed identity in Azure, set AZURE_CLIENT_ID
    // or pass managedIdentityClientId here.
    managedIdentityClientId: process.env.AZURE_CLIENT_ID,
  });

  const client = new SecretClient(vaultUrl, credential);

  const secretName = "my-secret";
  const secret = await client.getSecret(secretName);

  console.log(`Secret "${secretName}" value: ${secret.value}`);
}

main().catch((err) => {
  console.error("Authentication or Key Vault call failed.");
  console.error(err);
  process.exit(1);
});
```

**Typical local run**
```bash
az login
set KEY_VAULT_NAME=<your-key-vault-name>
node dist\index.js
```

**Typical Azure-hosted setup**
- Enable managed identity on the app
- Grant that identity access to the Key Vault
- Deploy the same code without changing the authentication logic

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config baseline-skills/gpt-5.4
```

---

[← Back to Summary](../../../../../../summary.md)
