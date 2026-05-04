# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** baseline/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 27.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | baseline/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 27.7s |
| Timestamp | 2026-05-01T23:11:02Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 27.5s |
| **Total** | **27.7s** |

## Configuration

- **name:** baseline/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=16519 out=1188 |
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

The user is asking for an explanation of Azure SDK's DefaultAzureCredential in TypeScript/JavaScript. This is a knowledge question - I don't need to search a codebase or run code. Let me provide a comprehensive answer.

## Copilot Response

## Azure SDK Authentication with `DefaultAzureCredential`

### 1. Required npm packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- **`@azure/identity`** — provides `DefaultAzureCredential` and all credential classes
- **`@azure/keyvault-secrets`** — (example) the client library you want to authenticate

### 2. Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// DefaultAzureCredential automatically picks the best credential
// for the current environment — no code changes needed between
// local dev and production.
const credential = new DefaultAzureCredential();

const vaultUrl = "https://<your-vault-name>.vault.azure.net";
const client = new SecretClient(vaultUrl, credential);

async function main() {
  // Set a secret
  await client.setSecret("my-secret", "my-secret-value");

  // Get a secret
  const secret = await client.getSecret("my-secret");
  console.log(`Secret: ${secret.name} = ${secret.value}`);
}

main().catch((err) => {
  console.error("Authentication or Key Vault error:", err.message);
  process.exit(1);
});
```

### 3. Credential Chain Order

`DefaultAzureCredential` tries these credentials **in order**, stopping at the first success:

| # | Credential | When it applies |
|---|-----------|-----------------|
| 1 | **EnvironmentCredential** | `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (or `AZURE_CLIENT_CERTIFICATE_PATH`) env vars are set |
| 2 | **WorkloadIdentityCredential** | Kubernetes workload identity is configured |
| 3 | **ManagedIdentityCredential** | Running on Azure (App Service, VM, AKS, Functions, etc.) |
| 4 | **AzureCliCredential** | User is logged in via `az login` |
| 5 | **AzurePowerShellCredential** | User is logged in via `Connect-AzAccount` |
| 6 | **AzureDeveloperCliCredential** | User is logged in via `azd auth login` |
| 7 | **VisualStudioCodeCredential** | User is signed into VS Code Azure extension *(disabled by default in newer versions)* |

### 4. Local Dev vs Azure-Hosted

**Local development:**
- Most common: **Azure CLI** — run `az login` and `DefaultAzureCredential` picks it up automatically
- Alternative: set `AZURE_TENANT_ID` + `AZURE_CLIENT_ID` + `AZURE_CLIENT_SECRET` env vars for a service principal
- VS Code credential requires the Azure Account extension (often excluded by default now)

**Azure-hosted (App Service, Functions, VMs, AKS):**
- Uses **Managed Identity** — no secrets to manage
- Enable system-assigned or user-assigned managed identity in the Azure portal
- For user-assigned identity, pass the client ID:
  ```typescript
  const credential = new DefaultAzureCredential({
    managedIdentityClientId: "<user-assigned-client-id>"
  });
  ```

### 5. Troubleshooting Authentication Failures

**Enable logging** to see which credentials are tried and why they fail:

```typescript
import { setLogLevel } from "@azure/logger";
setLogLevel("info"); // or "verbose" for full detail
```

**Common issues:**

| Symptom | Fix |
|---------|-----|
| `CredentialUnavailableError` from all credentials | Run `az login` locally, or enable Managed Identity in Azure |
| `AADSTS700016: Application not found` | Check `AZURE_CLIENT_ID` is correct |
| `403 Forbidden` on the resource | Grant the identity an RBAC role (e.g., *Key Vault Secrets User*) on the resource |
| Timeout in local dev | The chain tries Managed Identity first — set `AZURE_CREDENTIAL_EXCLUDE_MANAGED_IDENTITY=true` to skip it |
| Wrong tenant | Set `AZURE_TENANT_ID` or pass `tenantId` in options |

**Skip credentials you don't need** to speed up fallback:

```typescript
const credential = new DefaultAzureCredential({
  excludeEnvironmentCredential: true,
  excludeManagedIdentityCredential: true, // skip when running locally
});
```

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config baseline/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
