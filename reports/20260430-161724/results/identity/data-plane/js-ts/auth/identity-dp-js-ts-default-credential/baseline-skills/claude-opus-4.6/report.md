# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** baseline-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 33.8s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | baseline-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 33.8s |
| Timestamp | 2026-04-30T23:21:11Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 33.7s |
| **Total** | **33.8s** |

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
| Token Usage | in=16474 out=1221 |
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

The user is asking for an explanation of how to use DefaultAzureCredential from the Azure Identity SDK for JavaScript/TypeScript. This is a knowledge/documentation question, not a code change task. Let me provide a comprehensive answer.

## Copilot Response

## Authenticating Azure SDK Clients with `DefaultAzureCredential`

### 1. Required npm packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- **`@azure/identity`** — provides `DefaultAzureCredential` and other credential classes
- **`@azure/keyvault-secrets`** — (example) any Azure SDK client library you want to authenticate

### 2. Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// DefaultAzureCredential automatically discovers available credentials
const credential = new DefaultAzureCredential();

// Pass the credential to any Azure SDK client
const vaultUrl = "https://<your-vault-name>.vault.azure.net";
const client = new SecretClient(vaultUrl, credential);

async function main() {
  // Use the client — authentication happens automatically on first call
  const secret = await client.getSecret("my-secret-name");
  console.log(`Secret value: ${secret.value}`);
}

main().catch((err) => {
  console.error("Authentication or access error:", err.message);
});
```

No explicit tokens, passwords, or client secrets in code — `DefaultAzureCredential` handles it.

### 3. Credential Chain Order

`DefaultAzureCredential` tries these credentials **in order**, stopping at the first one that succeeds:

| Order | Credential | When it applies |
|-------|-----------|----------------|
| 1 | **EnvironmentCredential** | `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (or `AZURE_CLIENT_CERTIFICATE_PATH`) env vars are set |
| 2 | **WorkloadIdentityCredential** | Running in Kubernetes with workload identity configured |
| 3 | **ManagedIdentityCredential** | Running on Azure (App Service, VM, Functions, Container Apps, etc.) |
| 4 | **AzureDeveloperCliCredential** | `azd auth login` has been run |
| 5 | **AzureCliCredential** | `az login` has been run |
| 6 | **AzurePowerShellCredential** | `Connect-AzAccount` has been run |
| 7 | **VisualStudioCodeCredential** | Signed into the Azure Account VS Code extension *(may be disabled by default in newer versions)* |

### 4. Local Dev vs Azure-Hosted

**Local development:**
- **Azure CLI** — Run `az login`, then `DefaultAzureCredential` picks up your CLI session automatically (most common local approach)
- **VS Code** — Sign into the Azure Account extension; the credential reads the cached token
- **Environment variables** — Set `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_CLIENT_SECRET` for a service principal

**Azure-hosted environments (App Service, Functions, VMs, AKS):**
- **Managed Identity** is used automatically — no secrets to manage
- Enable system-assigned or user-assigned managed identity on the resource
- For user-assigned identity, pass the client ID:
  ```typescript
  const credential = new DefaultAzureCredential({
    managedIdentityClientId: "<user-assigned-client-id>"
  });
  ```

**Same code works everywhere** — the chain picks the right credential for the environment.

### 5. Troubleshooting Authentication Failures

**Enable logging** to see which credentials are tried and why they fail:

```typescript
import { setLogLevel } from "@azure/logger";
setLogLevel("info"); // use "verbose" for full detail
```

**Common issues:**

| Symptom | Fix |
|---------|-----|
| `CredentialUnavailableError` from all credentials | No credential is configured — run `az login` locally or enable managed identity in Azure |
| `AuthenticationError` with 403 | Credential works but lacks RBAC permissions — assign the right role (e.g., `Key Vault Secrets User`) |
| Wrong tenant | Set `AZURE_TENANT_ID` or pass `tenantId` in options |
| Slow startup in Azure | Disable unused credentials to skip unnecessary attempts: |

```typescript
const credential = new DefaultAzureCredential({
  // Skip credentials you know won't be available
  excludeAzureCliCredential: true,
  excludePowerShellCredential: true,
});
```

**Quick diagnostic checklist:**
1. `az account show` — confirm you're logged in to the right tenant/subscription
2. Check RBAC — the identity needs a role on the target resource
3. Check `setLogLevel("verbose")` output — tells you exactly which credential failed and why

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config baseline-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
