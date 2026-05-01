# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** baseline/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 26.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | baseline/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 26.7s |
| Timestamp | 2026-05-01T00:43:57Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 26.6s |
| **Total** | **26.7s** |

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
| Token Usage | in=16527 out=1135 |
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

The user is asking for an explanation/tutorial about Azure SDK's DefaultAzureCredential. This is a knowledge question, not a code change task. Let me provide a comprehensive answer.

## Copilot Response

## Azure SDK Authentication with `DefaultAzureCredential`

### 1. Required npm packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- **`@azure/identity`** — provides `DefaultAzureCredential` and all credential classes
- **`@azure/keyvault-secrets`** — (example) the Azure client you want to authenticate

### 2. Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

async function main() {
  // Creates a credential that automatically selects the best auth method
  const credential = new DefaultAzureCredential();

  const vaultUrl = "https://<your-vault-name>.vault.azure.net";
  const client = new SecretClient(vaultUrl, credential);

  // Use the authenticated client
  const secret = await client.getSecret("my-secret");
  console.log(`Secret value: ${secret.value}`);
}

main().catch((err) => {
  console.error("Authentication or Key Vault error:", err.message);
  process.exit(1);
});
```

### 3. Credential Chain Order

`DefaultAzureCredential` tries these credentials **in order**, stopping at the first success:

| Priority | Credential | When it's used |
|----------|-----------|----------------|
| 1 | `EnvironmentCredential` | `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (or `AZURE_CLIENT_CERTIFICATE_PATH`) env vars are set |
| 2 | `WorkloadIdentityCredential` | Kubernetes workload identity is configured |
| 3 | `ManagedIdentityCredential` | Running on Azure (App Service, VM, Functions, AKS, etc.) with managed identity enabled |
| 4 | `AzureDeveloperCliCredential` | Signed in via `azd auth login` |
| 5 | `AzureCliCredential` | Signed in via `az login` |
| 6 | `AzurePowerShellCredential` | Signed in via `Connect-AzAccount` |

### 4. Local Dev vs Azure-Hosted

**Local development:**
- Most commonly uses **Azure CLI** (`az login`) or **VS Code Azure Account extension**
- Just run `az login` in your terminal, then `DefaultAzureCredential` picks it up automatically
- Alternatively, set `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` env vars for service principal auth

**Azure-hosted environments (App Service, Functions, VMs, AKS):**
- Enable **Managed Identity** on the resource (system-assigned or user-assigned)
- `DefaultAzureCredential` detects it automatically — no secrets needed
- For user-assigned identity, pass the client ID:
  ```typescript
  new DefaultAzureCredential({ managedIdentityClientId: "<client-id>" });
  ```

### 5. Troubleshooting Authentication Failures

**Enable logging** to see which credentials are tried and why they fail:

```typescript
import { setLogLevel } from "@azure/logger";
setLogLevel("info"); // use "verbose" for full detail
```

**Common issues:**

| Symptom | Fix |
|---------|-----|
| `CredentialUnavailableError` from all credentials | No auth method configured — run `az login` or set env vars |
| `AZURE_TENANT_ID is not set` | Set all three env vars (`TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET`) |
| 403 Forbidden after auth succeeds | The identity lacks RBAC/access policy on the target resource — grant it in Azure Portal |
| Timeout on local dev | Managed Identity endpoint probe is timing out — set `IDENTITY_ENDPOINT` or exclude it: `new DefaultAzureCredential({ excludeManagedIdentityCredential: true })` |
| Wrong tenant | Pass `tenantId` explicitly: `new DefaultAzureCredential({ tenantId: "<id>" })` |

**Exclude credentials** you know won't work to speed up auth and get clearer errors:

```typescript
const credential = new DefaultAzureCredential({
  excludeEnvironmentCredential: true,
  excludeManagedIdentityCredential: true,
  // Now only CLI-based credentials are tried
});
```

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config baseline/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
