# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** azure-mcp-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 52.3s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | azure-mcp-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 52.3s |
| Timestamp | 2026-04-30T23:20:37Z |
| Files Generated | 0 |
| Event Count | 80 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 52.0s |
| **Total** | **52.3s** |

## Configuration

- **name:** azure-mcp-skills/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=185418 out=1954 |
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
{"intent":"DefaultAzureCredential TypeScript JavaScript npm credential chain order troubleshooting","learn":true}
```

### 🔧 3. azure-documentation (via azure)

**Input:**

```json
{"command":"search","intent":"Search for DefaultAzureCredential documentation for JavaScript TypeScript","parameters":{"query":"DefaultAzureCredential JavaScript TypeScript npm @azure/identity credential chain order"}}
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
- **`@azure/keyvault-secrets`** — (example) the SDK client you want to authenticate

Any `@azure/` SDK client that accepts a `TokenCredential` works the same way.

---

## 2. Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// 1. Create a credential instance (no config needed for most scenarios)
const credential = new DefaultAzureCredential();

// 2. Pass it to any Azure SDK client
const vaultUrl = "https://<your-vault-name>.vault.azure.net";
const client = new SecretClient(vaultUrl, credential);

// 3. Use the client — authentication happens automatically
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
  console.error("Authentication or Key Vault error:", err.message);
  process.exit(1);
});
```

---

## 3. Credential Chain Order

`DefaultAzureCredential` tries these credentials **in order**, stopping at the first success:

| Order | Credential | When It's Used |
|-------|-----------|----------------|
| 1 | **EnvironmentCredential** | `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, + `AZURE_CLIENT_SECRET` or `AZURE_CLIENT_CERTIFICATE_PATH` are set |
| 2 | **WorkloadIdentityCredential** | Running in Kubernetes with Workload Identity configured |
| 3 | **ManagedIdentityCredential** | Running on an Azure service with managed identity enabled (App Service, VM, AKS, etc.) |
| 4 | **AzureDeveloperCliCredential** | Authenticated via `azd auth login` |
| 5 | **AzureCliCredential** | Authenticated via `az login` |
| 6 | **AzurePowerShellCredential** | Authenticated via `Connect-AzAccount` |

> **Continuation policy (v3.3.0+):** Developer credentials (4–6) continue trying even if one fails. Deployed service credentials (1–3) throw immediately if they can attempt auth but fail.

---

## 4. Local Dev vs Azure-Hosted Environments

### Local Development
| Method | Setup |
|--------|-------|
| **Azure CLI** | Run `az login` — `AzureCliCredential` picks it up automatically |
| **Azure Developer CLI** | Run `azd auth login` |
| **Azure PowerShell** | Run `Connect-AzAccount` |
| **VS Code** | Install `@azure/identity-vscode` plugin + Azure Resources extension, then sign in via `Azure: Sign In` |
| **Environment vars** | Set `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` for service principal auth |

### Azure-Hosted (Production)
| Environment | How It Works |
|-------------|-------------|
| **App Service / Functions** | Enable system- or user-assigned managed identity in the portal — `ManagedIdentityCredential` activates automatically |
| **VMs / VMSS** | Enable managed identity on the VM |
| **AKS** | Use Workload Identity (`WorkloadIdentityCredential`) or pod-managed identity |
| **Container Apps** | Enable managed identity on the container app |

**No code changes needed** — `DefaultAzureCredential` adapts to whatever environment it's running in.

---

## 5. Troubleshooting Authentication Failures

### Enable Logging
```typescript
import { setLogLevel } from "@azure/logger";
setLogLevel("info"); // or "verbose" for full detail
```

### Common Issues

| Symptom | Fix |
|---------|-----|
| `CredentialUnavailableError` from all credentials | No credential in the chain could authenticate — ensure `az login`, env vars, or managed identity is configured |
| `AZURE_TENANT_ID` / `AZURE_CLIENT_ID` missing | Set required environment variables for `EnvironmentCredential` |
| `az login` session expired | Re-run `az login` to refresh tokens |
| Managed identity not working | Verify managed identity is enabled on the Azure resource and has the correct RBAC role |
| Wrong tenant | Pass `tenantId` in options: `new DefaultAzureCredential({ tenantId: "<id>" })` |
| User-assigned identity not selected | Set `AZURE_CLIENT_ID` to the managed identity's client ID, or pass `managedIdentityClientId` in options |

### Exclude Credentials You Don't Need
```typescript
// Skip credentials that cause noise/delays in your environment
const credential = new DefaultAzureCredential({
  excludeAzurePowerShellCredential: true,
  excludeManagedIdentityCredential: true, // e.g., for local dev only
});
```

### Quick Diagnostic Checklist
1. Run `az account show` to verify CLI auth
2. Check `AZURE_*` environment variables
3. Enable verbose logging
4. Verify RBAC — the identity needs a role like **Key Vault Secrets User** on the resource
5. Check network/firewall rules on the target resource

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config azure-mcp-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
