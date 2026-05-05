# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** azure-mcp-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 49.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | azure-mcp-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 49.0s |
| Timestamp | 2026-05-01T01:52:16Z |
| Files Generated | 0 |
| Event Count | 68 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 48.8s |
| **Total** | **49.0s** |

## Configuration

- **model:** claude-opus-4.6
- **name:** azure-mcp-skills/claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=155167 out=1789 |
| Turn Count | 4 |

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

The user wants documentation/explanation about DefaultAzureCredential in Azure SDK for JavaScript/TypeScript. Let me search Azure documentation for this.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Researching DefaultAzureCredential"}
```

### 🔧 2. azure-documentation (via azure)

**Input:**

```json
{"intent":"DefaultAzureCredential TypeScript JavaScript npm packages credential chain order","learn":true}
```

### 🔧 3. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_search","intent":"Search for DefaultAzureCredential documentation","parameters":{"query":"DefaultAzureCredential JavaScript TypeScript @azure/identity credential chain order troubleshoot"}}
```

### 🔧 4. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_code_sample_search","intent":"Search for DefaultAzureCredential code samples","parameters":{"language":"typescript","query":"DefaultAzureCredential SecretClient KeyVault @azure/identity"}}
```

### 🔧 5. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_fetch","intent":"Fetch DefaultAzureCredential credential chain details","parameters":{"url":"https://learn.microsoft.com/en-us/javascript/api/@azure/identity/defaultazurecredential"}}
```

## Copilot Response

Here's a comprehensive guide to **DefaultAzureCredential** in the Azure SDK for JavaScript/TypeScript.

---

## 1. Required npm Packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- **`@azure/identity`** — provides `DefaultAzureCredential` and other credential classes
- **`@azure/keyvault-secrets`** — (or any Azure SDK client library you need)

---

## 2. Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

async function main(): Promise<void> {
  // One credential instance, reusable across all SDK clients
  const credential = new DefaultAzureCredential();

  const vaultName = process.env.KEY_VAULT_NAME;
  if (!vaultName) throw new Error("Set KEY_VAULT_NAME env var");

  const url = `https://${vaultName}.vault.azure.net`;
  const client = new SecretClient(url, credential);

  // Set a secret
  const result = await client.setSecret("my-secret", "s3cret!");
  console.log("Created:", result.name);

  // Read it back
  const secret = await client.getSecret("my-secret");
  console.log("Value:", secret.value);

  // Clean up
  const poller = await client.beginDeleteSecret("my-secret");
  await poller.pollUntilDone();
  console.log("Deleted.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

---

## 3. Credential Chain Order

`DefaultAzureCredential` tries these credentials **in order**, stopping at the first success:

| # | Credential | When it activates |
|---|---|---|
| 1 | **EnvironmentCredential** | `AZURE_CLIENT_ID` + `AZURE_TENANT_ID` + `AZURE_CLIENT_SECRET` (or cert/federated) env vars set |
| 2 | **WorkloadIdentityCredential** | Kubernetes workload identity configured |
| 3 | **ManagedIdentityCredential** | Running on Azure (VM, App Service, Functions, ACA, etc.) |
| 4 | **VisualStudioCodeCredential** | Signed into Azure in VS Code |
| 5 | **AzureCliCredential** | Logged in via `az login` |
| 6 | **AzurePowerShellCredential** | Logged in via `Connect-AzAccount` |
| 7 | **AzureDeveloperCliCredential** | Logged in via `azd auth login` |

---

## 4. Local Dev vs Azure-Hosted

**Local development:**
- Typically authenticates via **AzureCliCredential** (`az login`) or **VisualStudioCodeCredential**
- You can also set `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` env vars to use a service principal via **EnvironmentCredential**

**Azure-hosted (App Service, Functions, VMs, AKS, Container Apps):**
- **ManagedIdentityCredential** kicks in automatically — no secrets needed
- For **user-assigned** managed identity, pass the client ID:
  ```typescript
  new DefaultAzureCredential({ managedIdentityClientId: "<client-id>" });
  ```

**Best practice for production:** Use `ManagedIdentityCredential` directly (or a narrow `ChainedTokenCredential`) instead of `DefaultAzureCredential` to avoid the overhead of trying unnecessary credentials:

```typescript
const credential = process.env.NODE_ENV === "production"
  ? new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID!)
  : new DefaultAzureCredential();
```

---

## 5. Troubleshooting Authentication Failures

| Symptom | Fix |
|---|---|
| `CredentialUnavailableError` from all credentials | Ensure at least one auth method is configured (run `az login`, set env vars, or enable managed identity) |
| Wrong tenant/subscription | Set `AZURE_TENANT_ID` env var or pass `tenantId` in options |
| 403 Forbidden (auth succeeds but access denied) | The identity lacks the required RBAC role — assign it in the Azure portal |
| Timeout on managed identity | You're not running on Azure; the MI endpoint isn't reachable locally |

**Enable logging** to see which credentials are tried and why they fail:

```typescript
import { setLogLevel } from "@azure/logger";
setLogLevel("info"); // "verbose" for full detail
```

This prints each credential attempt and its result to the console, making it easy to pinpoint which step fails.

**Docs:** [DefaultAzureCredential API reference](https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential) · [Authentication best practices](https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/best-practices)

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config azure-mcp-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
