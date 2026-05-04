# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** baseline-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 34.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | baseline-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 34.7s |
| Timestamp | 2026-05-01T23:10:55Z |
| Files Generated | 0 |
| Event Count | 40 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 34.5s |
| **Total** | **34.7s** |

## Configuration

- **name:** baseline-skills/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skill Directories | C:\code\hyoka\skills\generator\js-ts-azure-patterns |
| Skills Loaded | customize-cloud-agent |
| Skills Invoked | find-skills |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=34853 out=1351 |
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

## Copilot Reasoning

The user is asking about Azure SDK authentication with DefaultAzureCredential. Let me invoke the relevant skill first.

The user is asking about Azure SDK DefaultAzureCredential. This is a knowledge/explanation question, not really about finding a skill to install. Let me just answer it directly with my knowledge of the Azure Identity SDK.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Explaining DefaultAzureCredential"}
```

### 🔧 2. skill

**Input:**

```json
{"skill":"find-skills"}
```

## Copilot Response

Here's a complete guide to authenticating Azure SDK clients with `DefaultAzureCredential`:

---

## 1. Required npm Packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- **`@azure/identity`** — provides `DefaultAzureCredential` and all credential classes
- **`@azure/keyvault-secrets`** — (example client) Key Vault secrets access

## 2. Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// DefaultAzureCredential automatically selects the best credential
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
  console.log(`Secret value: ${secret.value}`);
}

main().catch((err) => {
  console.error("Authentication or Key Vault error:", err.message);
  process.exit(1);
});
```

## 3. Credential Chain Order

`DefaultAzureCredential` tries these credentials **in order**, stopping at the first success:

| #  | Credential                       | When it activates                          |
|----|----------------------------------|--------------------------------------------|
| 1  | `EnvironmentCredential`          | `AZURE_CLIENT_ID` + `AZURE_CLIENT_SECRET` + `AZURE_TENANT_ID` env vars set |
| 2  | `WorkloadIdentityCredential`     | Running in Kubernetes with workload identity configured |
| 3  | `ManagedIdentityCredential`      | Running on Azure (App Service, VMs, AKS, Functions, etc.) |
| 4  | `AzureDeveloperCliCredential`    | Signed in via `azd auth login`             |
| 5  | `AzurePipelinesCredential`       | Running in Azure Pipelines with service connection (opt-in) |
| 6  | `AzureCliCredential`            | Signed in via `az login`                   |
| 7  | `AzurePowerShellCredential`     | Signed in via `Connect-AzAccount`          |
| 8  | `VisualStudioCodeCredential`    | Signed into VS Code Azure Account extension (deprecated — prefer Azure CLI) |

## 4. Local Dev vs Azure-Hosted

**Local development:**
- **Azure CLI (recommended):** Run `az login`, then `DefaultAzureCredential` picks it up automatically via `AzureCliCredential`
- **VS Code:** Sign into the Azure Account extension — `VisualStudioCodeCredential` activates (note: this is being deprecated in favor of CLI-based auth)
- **Environment variables:** Set `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID` for service principal auth

**Azure-hosted environments:**
- **Managed Identity** is used automatically — no secrets to manage
- Enable system-assigned or user-assigned managed identity on your resource
- For user-assigned identity, pass the client ID:
  ```typescript
  const credential = new DefaultAzureCredential({
    managedIdentityClientId: "<user-assigned-client-id>"
  });
  ```

## 5. Troubleshooting Authentication Failures

**Enable logging** to see which credentials are tried and why they fail:

```typescript
import { setLogLevel } from "@azure/logger";
setLogLevel("info"); // Use "verbose" for full detail
```

**Common issues:**

| Problem | Fix |
|---|---|
| `CredentialUnavailableError` from all credentials | Ensure at least one auth method is configured (run `az login` locally, or enable managed identity on Azure) |
| Wrong tenant | Set `AZURE_TENANT_ID` or pass `tenantId` in options |
| 403 Forbidden (after auth succeeds) | The identity is authenticated but lacks RBAC permissions — assign the appropriate role (e.g., "Key Vault Secrets User") |
| Managed Identity timeout | Ensure MI is enabled on the Azure resource; check the IMDS endpoint is reachable |

**Exclude credentials** you know won't apply to speed up failure detection:

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
