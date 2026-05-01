# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** baseline-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 30.2s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | baseline-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 30.2s |
| Timestamp | 2026-05-01T00:43:54Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 30.1s |
| **Total** | **30.2s** |

## Configuration

- **name:** baseline-skills/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=16517 out=1227 |
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

## Copilot Reasoning

The user is asking for an explanation of Azure SDK's DefaultAzureCredential. This is a knowledge/documentation question, not a code task. Let me provide a comprehensive answer.

## Copilot Response

## Azure SDK Authentication with `DefaultAzureCredential`

### 1. Required npm packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- **`@azure/identity`** — provides `DefaultAzureCredential` and all credential classes
- **`@azure/keyvault-secrets`** — (example) the specific Azure service client you're using

### 2. Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

async function main() {
  // Creates a credential that automatically selects the best available auth method
  const credential = new DefaultAzureCredential();

  // Pass it to any Azure SDK client
  const vaultUrl = "https://<your-vault-name>.vault.azure.net";
  const client = new SecretClient(vaultUrl, credential);

  // Use the client — authentication happens transparently
  const secret = await client.getSecret("my-secret");
  console.log(`Secret value: ${secret.value}`);
}

main().catch((err) => {
  console.error("Authentication failed:", err.message);
  process.exit(1);
});
```

That's it — no tokens, no client secrets hardcoded, no environment-specific branches.

### 3. Credential Chain Order

`DefaultAzureCredential` tries these credentials **in order**, stopping at the first one that succeeds:

| # | Credential | When it's used |
|---|-----------|---------------|
| 1 | **EnvironmentCredential** | `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` (or cert/password vars) are set |
| 2 | **WorkloadIdentityCredential** | Kubernetes workload identity is configured |
| 3 | **ManagedIdentityCredential** | Running on Azure (App Service, VM, Functions, AKS, etc.) with managed identity enabled |
| 4 | **AzureDeveloperCliCredential** | `azd auth login` session is active |
| 5 | **AzurePowerShellCredential** | Authenticated via `Connect-AzAccount` in PowerShell |
| 6 | **AzureCliCredential** | Authenticated via `az login` in Azure CLI |
| 7 | **VisualStudioCodeCredential** | Signed into the VS Code Azure Account extension |

### 4. Local Dev vs Azure-Hosted

**Local development:**
- Most commonly uses **AzureCliCredential** — just run `az login` first
- VS Code users can sign in via the Azure Account extension
- You can set `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_CLIENT_SECRET` env vars to use a service principal locally
- To restrict which credentials are tried (faster failures):

```typescript
import { AzureCliCredential } from "@azure/identity";
// Use a specific credential in dev for faster, predictable auth
const credential = new AzureCliCredential();
```

**Azure-hosted environments (App Service, Functions, VMs, AKS):**
- **ManagedIdentityCredential** is picked up automatically — no secrets to manage
- Enable system-assigned or user-assigned managed identity on your resource
- For user-assigned identity, pass the client ID:

```typescript
const credential = new DefaultAzureCredential({
  managedIdentityClientId: "<your-user-assigned-identity-client-id>",
});
```

### 5. Troubleshooting Authentication Failures

**Enable logging** to see which credentials are tried and why they fail:

```typescript
import { setLogLevel } from "@azure/logger";
setLogLevel("info"); // or "verbose" for maximum detail
```

**Common issues and fixes:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| `CredentialUnavailableError` from all credentials | No valid credential in the chain | Run `az login`, set env vars, or enable managed identity |
| `AuthenticationError` with 403 | Credential works but lacks permissions | Assign the correct RBAC role (e.g., "Key Vault Secrets User") |
| Slow startup locally | Chain tries all credentials before finding one | Use a specific credential class directly, or set `AZURE_TENANT_ID` |
| Managed identity not found | Identity not enabled on the Azure resource | Enable managed identity in the Azure portal |
| `AADSTS70011: Invalid scope` | Wrong audience/resource URL | Verify the vault URL or service endpoint |

**Exclude credentials you don't need** to speed up failures and reduce noise:

```typescript
const credential = new DefaultAzureCredential({
  excludeVisualStudioCodeCredential: true,
  excludePowerShellCredential: true,
});
```

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config baseline-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
