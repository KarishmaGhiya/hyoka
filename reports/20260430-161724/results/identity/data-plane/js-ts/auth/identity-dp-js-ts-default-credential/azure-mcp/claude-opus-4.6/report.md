# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** azure-mcp/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 50.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | azure-mcp/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 50.0s |
| Timestamp | 2026-04-30T23:20:26Z |
| Files Generated | 0 |
| Event Count | 80 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 49.8s |
| **Total** | **50.0s** |

## Configuration

- **name:** azure-mcp/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=185451 out=1819 |
| Turn Count | 5 |

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

The user is asking for documentation/explanation about Azure DefaultAzureCredential. Let me search Azure documentation for this.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Researching DefaultAzureCredential"}
```

### 🔧 2. azure-documentation (via azure)

**Input:**

```json
{"intent":"DefaultAzureCredential TypeScript JavaScript credential chain order troubleshooting","learn":true}
```

### 🔧 3. azure-documentation (via azure)

**Input:**

```json
{"command":"search","intent":"Search for DefaultAzureCredential JavaScript TypeScript npm packages credential chain","parameters":{"query":"DefaultAzureCredential JavaScript TypeScript @azure/identity credential chain order"}}
```

### 🔧 4. web_fetch

**Input:**

```json
{"max_length":15000,"url":"https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-node-latest"}
```

### 🔧 5. web_fetch

**Input:**

```json
{"max_length":10000,"start_index":15000,"url":"https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-node-latest"}
```

## Copilot Response

Here's a comprehensive guide to `DefaultAzureCredential`:

---

## 1. Required npm Packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- **`@azure/identity`** — provides `DefaultAzureCredential` and other credential classes
- **`@azure/keyvault-secrets`** — (example) the Key Vault secrets client; swap for whichever Azure SDK client you need

---

## 2. Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// Your Key Vault URL
const vaultUrl = "https://<your-vault-name>.vault.azure.net";

// DefaultAzureCredential tries multiple auth methods automatically
const credential = new DefaultAzureCredential();

// Pass the credential to any Azure SDK client
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

---

## 3. Credential Chain Order

`DefaultAzureCredential` tries these credentials **in order**, stopping at the first success:

| Order | Credential | When it's used |
|-------|-----------|----------------|
| 1 | **EnvironmentCredential** | `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (or `_CERTIFICATE_PATH`) env vars are set |
| 2 | **WorkloadIdentityCredential** | Running in Kubernetes with Workload Identity configured |
| 3 | **ManagedIdentityCredential** | Running on an Azure service with managed identity enabled (App Service, VMs, AKS, Functions, etc.) |
| 4 | **AzureDeveloperCliCredential** | Authenticated via `azd auth login` |
| 5 | **AzureCliCredential** | Authenticated via `az login` |
| 6 | **AzurePowerShellCredential** | Authenticated via `Connect-AzAccount` |

> **Note:** VS Code authentication requires installing the `@azure/identity-vscode` plugin and calling `useIdentityPlugin(vsCodePlugin)` before constructing the credential.

---

## 4. Local Dev vs Azure-Hosted Environments

### Local Development
- **Azure CLI**: Run `az login` — `AzureCliCredential` picks up your session
- **Azure Developer CLI**: Run `azd auth login` — `AzureDeveloperCliCredential` picks it up
- **Azure PowerShell**: Run `Connect-AzAccount`
- **VS Code**: Sign in via the Azure Resources extension + install `@azure/identity-vscode`
- Credentials 4–6 in the chain handle local dev automatically

### Azure-Hosted (Production)
- **Managed Identity** (credential #3) is the recommended approach — no secrets to manage
- Enable system-assigned or user-assigned managed identity on your Azure resource
- For user-assigned identity, pass the client ID:
  ```typescript
  const credential = new DefaultAzureCredential({
    managedIdentityClientId: "<your-managed-identity-client-id>",
  });
  ```
- **Environment variables** (credential #1) work for service principal auth in CI/CD or containers
- **Workload Identity** (credential #2) is the Kubernetes-native path on AKS

---

## 5. Troubleshooting Authentication Failures

### Enable logging
```typescript
import { setLogLevel } from "@azure/logger";
setLogLevel("info"); // use "verbose" for full detail
```

### Common issues

| Problem | Fix |
|---------|-----|
| `CredentialUnavailableError` from all credentials | Ensure at least one auth method is configured (run `az login`, set env vars, or enable managed identity) |
| `AZURE_TENANT_ID` / `AZURE_CLIENT_ID` not set | Set all required env vars for `EnvironmentCredential` |
| 403 Forbidden after successful auth | The identity lacks RBAC permissions on the target resource — assign the appropriate role (e.g., *Key Vault Secrets User*) |
| Managed identity not working locally | Managed identity only works on Azure-hosted resources; use CLI or env credentials locally |
| Slow startup in local dev | Credentials 1–3 fail before reaching CLI credential; use `excludeEnvironmentCredential: true` etc. to skip irrelevant ones |

### Skip unnecessary credentials to speed things up locally
```typescript
const credential = new DefaultAzureCredential({
  excludeManagedIdentityCredential: true,
  excludeWorkloadIdentityCredential: true,
});
```

### Check which credential succeeded
Enable `"verbose"` logging — the log output shows each credential attempt and which one provided the token.

---

**Key takeaway:** `DefaultAzureCredential` gives you a single line of code that works across local dev and production. In Azure it uses managed identity (zero secrets); locally it falls back to your CLI login.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config azure-mcp/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
