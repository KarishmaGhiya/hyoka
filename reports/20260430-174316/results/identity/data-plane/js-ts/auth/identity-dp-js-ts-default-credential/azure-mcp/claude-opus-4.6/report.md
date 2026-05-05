# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** azure-mcp/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 54.9s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | azure-mcp/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 54.9s |
| Timestamp | 2026-05-01T01:46:31Z |
| Files Generated | 0 |
| Event Count | 86 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 54.7s |
| **Total** | **54.9s** |

## Configuration

- **model:** claude-opus-4.6
- **name:** azure-mcp/claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=197705 out=2017 |
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

The user is asking for documentation/explanation about Azure DefaultAzureCredential. Let me search the Azure documentation for this.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Researching DefaultAzureCredential"}
```

### 🔧 2. azure-documentation (via azure)

**Input:**

```json
{"intent":"DefaultAzureCredential TypeScript Node.js authentication credential chain order troubleshooting","learn":true}
```

### 🔧 3. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_search","intent":"Search for DefaultAzureCredential documentation","parameters":{"query":"DefaultAzureCredential JavaScript TypeScript @azure/identity credential chain order local development Azure hosted"}}
```

### 🔧 4. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_code_sample_search","intent":"Search for code samples","parameters":{"language":"typescript","query":"DefaultAzureCredential SecretClient KeyVault TypeScript"}}
```

### 🔧 5. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_fetch","intent":"Get full DefaultAzureCredential chain order and troubleshooting details","parameters":{"url":"https://learn.microsoft.com/javascript/api/overview/azure/identity-readme?view=azure-node-latest"}}
```

### 🔧 6. powershell

**Input:**

```json
{"command":"Get-Content \"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\1777600015065-copilot-tool-output-t631vl.txt\" | Select-String -Pattern \"DefaultAzureCredential|credential chain|credential types|troubleshoot|logging|AZURE_LOG\" -Context 3,3 | Select-Object -First 80","description":"Search doc output for credential chain info","initial_wait":15}
```

## Copilot Response

Now I have comprehensive information. Let me provide the complete answer.

---

## Authenticating Azure SDK Clients with `DefaultAzureCredential`

### 1. Required npm packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- **`@azure/identity`** — provides `DefaultAzureCredential` and other credential types
- **`@azure/keyvault-secrets`** — (or any Azure SDK client library you need)

---

### 2. Creating and using `DefaultAzureCredential`

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// One credential instance, reused across clients
const credential = new DefaultAzureCredential();

const vaultUrl = `https://${process.env.KEY_VAULT_NAME}.vault.azure.net`;
const client = new SecretClient(vaultUrl, credential);

async function main() {
  // Set a secret
  await client.setSecret("my-secret", "my-secret-value");

  // Get a secret
  const secret = await client.getSecret("my-secret");
  console.log(`Secret: ${secret.name} = ${secret.value}`);

  // List secrets
  for await (const properties of client.listPropertiesOfSecrets()) {
    console.log(`- ${properties.name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

---

### 3. Credential chain order

`DefaultAzureCredential` tries these credentials **in order**, stopping at the first success:

| Order | Credential | When it's used |
|-------|-----------|----------------|
| 1 | **EnvironmentCredential** | `AZURE_CLIENT_ID` + `AZURE_CLIENT_SECRET` + `AZURE_TENANT_ID` env vars set |
| 2 | **WorkloadIdentityCredential** | Kubernetes workload identity configured |
| 3 | **ManagedIdentityCredential** | Running on Azure with managed identity enabled |
| 4 | **AzureCliCredential** | Logged in via `az login` |
| 5 | **AzurePowerShellCredential** | Logged in via `Connect-AzAccount` |
| 6 | **AzureDeveloperCliCredential** | Logged in via `azd auth login` |

> **Note:** VS Code authentication requires installing `@azure/identity-vscode` and calling `useIdentityPlugin()` separately.

As of v3.3.0, if a developer credential (4–6) fails, it continues to the next. Deployed service credentials (1–3) throw immediately if they can attempt but fail to get a token.

---

### 4. Local dev vs Azure-hosted

| Environment | Credential used | Setup |
|-------------|----------------|-------|
| **Local — Azure CLI** | `AzureCliCredential` | Run `az login` |
| **Local — VS Code** | Via `@azure/identity-vscode` plugin | Install Azure Resources extension, sign in |
| **Local — PowerShell** | `AzurePowerShellCredential` | Run `Connect-AzAccount` |
| **Local — Env vars** | `EnvironmentCredential` | Set `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` |
| **Azure App Service / Functions** | `ManagedIdentityCredential` | Enable managed identity on the resource |
| **Azure VM / AKS** | `ManagedIdentityCredential` | Assign system or user-assigned identity |
| **AKS with workload identity** | `WorkloadIdentityCredential` | Configure federated identity |

**Best practice for production:** Use a deterministic credential instead of `DefaultAzureCredential`:

```typescript
import { ManagedIdentityCredential, ChainedTokenCredential, AzureCliCredential } from "@azure/identity";

const credential = process.env.NODE_ENV === "production"
  ? new ManagedIdentityCredential(process.env.AZURE_CLIENT_ID!)
  : new ChainedTokenCredential(new AzureCliCredential());
```

---

### 5. Troubleshooting authentication failures

**Enable logging** to see which credentials are attempted:

```typescript
import { setLogLevel } from "@azure/logger";
setLogLevel("info"); // or "verbose" for full details
```

Or set the environment variable:
```
AZURE_LOG_LEVEL=info
```

**Common issues:**

| Problem | Fix |
|---------|-----|
| `CredentialUnavailableError` from all credentials | Ensure at least one auth method is configured (run `az login`, set env vars, or enable managed identity) |
| Wrong tenant | Set `AZURE_TENANT_ID` or pass `tenantId` in options |
| 403 Forbidden (authenticated but unauthorized) | Grant the identity proper RBAC roles on the target resource |
| Timeout on managed identity | Verify managed identity is enabled on the Azure resource |
| VS Code credential not working | Install `@azure/identity-vscode` and call `useIdentityPlugin()` |

Full troubleshooting guide: https://aka.ms/azsdk/js/identity/troubleshoot

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config azure-mcp/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
