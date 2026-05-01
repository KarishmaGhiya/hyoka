# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** azure-mcp-skills/gpt-5.4 | **Result:** ❌ FAILED | **Duration:** 56.4s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | azure-mcp-skills/gpt-5.4 |
| Result | ❌ FAILED |
| Duration | 56.4s |
| Timestamp | 2026-05-01T01:45:35Z |
| Files Generated | 0 |
| Event Count | 120 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 56.3s |
| **Total** | **56.4s** |

## Configuration

- **name:** azure-mcp-skills/gpt-5.4
- **model:** gpt-5.4

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.4 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=169543 out=2929 |
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

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Researching Azure auth"}
```

### 🔧 2. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"intent":"Get best practices for Azure SDK authentication with DefaultAzureCredential in TypeScript","learn":true}
```

### 🔧 3. azure-documentation (via azure)

**Input:**

```json
{"intent":"Find official docs for DefaultAzureCredential in JavaScript/TypeScript and SecretClient Key Vault","learn":true}
```

### 🔧 4. report_intent

**Input:**

```json
{"intent":"Gathering Azure guidance"}
```

### 🔧 5. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"command":"get_azure_bestpractices_get","intent":"Get best practices for Azure SDK authentication with DefaultAzureCredential in TypeScript","parameters":{"action":"code-generation","resource":"general"}}
```

### 🔧 6. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_search","intent":"Search official docs for DefaultAzureCredential JavaScript/TypeScript, credential chain, hosted environments, troubleshooting, and SecretClient sample","parameters":{"query":"JavaScript TypeScript DefaultAzureCredential Azure Identity credential chain order local development VS Code Azure CLI managed identity troubleshooting SecretClient Key Vault"}}
```

### 🔧 7. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_code_sample_search","intent":"Find official TypeScript code samples for DefaultAzureCredential with SecretClient","parameters":{"language":"typescript","query":"DefaultAzureCredential SecretClient Key Vault TypeScript"}}
```

### 🔧 8. report_intent

**Input:**

```json
{"intent":"Fetching Azure docs"}
```

### 🔧 9. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_search","intent":"Search official docs for JavaScript credential chains and troubleshooting DefaultAzureCredential","parameters":{"query":"site:learn.microsoft.com JavaScript DefaultAzureCredential credential chains troubleshoot authentication failures Azure Identity"}}
```

### 🔧 10. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_fetch","intent":"Fetch JavaScript authentication best practices doc","parameters":{"url":"https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/best-practices"}}
```

### 🔧 11. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_fetch","intent":"Fetch DefaultAzureCredential API doc for JavaScript","parameters":{"url":"https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential?view=azure-node-latest"}}
```

### 🔧 12. report_intent

**Input:**

```json
{"intent":"Collecting auth details"}
```

### 🔧 13. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_fetch","intent":"Fetch JavaScript credential chains guidance","parameters":{"url":"https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/credential-chains"}}
```

### 🔧 14. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_search","intent":"Search official docs for troubleshooting DefaultAzureCredential failures in JavaScript","parameters":{"query":"JavaScript DefaultAzureCredential troubleshooting authentication failures CredentialUnavailableError AggregateAuthenticationError Azure Identity"}}
```

## Copilot Response

I’m pulling the official SDK/auth docs now so the credential chain and troubleshooting details are accurate, not hand-wavy.

Use `@azure/identity` for `DefaultAzureCredential` and the service client package for the resource you’re calling. For Key Vault secrets, that’s `@azure/keyvault-secrets`.

```bash
npm install @azure/identity @azure/keyvault-secrets
```

Optional packages:
- `@azure/identity-vscode` if you want `VisualStudioCodeCredential` to work from the `DefaultAzureCredential` chain
- `@azure/identity-broker` if you want broker-based OS account auth
- `@azure/logger` if you want verbose Azure Identity logs while troubleshooting

## 1. Required npm packages

| Purpose | Package |
|---|---|
| `DefaultAzureCredential` and other credentials | `@azure/identity` |
| Key Vault secret client | `@azure/keyvault-secrets` |
| VS Code credential support | `@azure/identity-vscode` |
| Broker credential support | `@azure/identity-broker` |
| Verbose SDK logging | `@azure/logger` |

## 2. Create and use `DefaultAzureCredential`

```ts
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new DefaultAzureCredential();
const client = new SecretClient("https://<your-vault-name>.vault.azure.net", credential);
```

Azure SDK clients call `credential.getToken(...)` internally, so you usually just pass the credential into the client constructor once and reuse it.

## 3. Credential chain order

`DefaultAzureCredential` tries these in order:

1. `EnvironmentCredential`
2. `WorkloadIdentityCredential`
3. `ManagedIdentityCredential`
4. `VisualStudioCodeCredential`
5. `AzureCliCredential`
6. `AzurePowerShellCredential`
7. `AzureDeveloperCliCredential`
8. Broker credential

It stops on the first one that successfully gets a token.

## 4. Local dev vs Azure-hosted

**Local development**
- **VS Code**: can use `VisualStudioCodeCredential` if you’re signed in through the Azure extension and have `@azure/identity-vscode` installed.
- **Azure CLI**: can use `AzureCliCredential` after `az login`.
- **Azure PowerShell**: can use `Connect-AzAccount`.
- **Azure Developer CLI**: can use `azd auth login`.

**Azure-hosted**
- If environment variables for a service principal are present, `EnvironmentCredential` can win first.
- On Azure with workload identity enabled, `WorkloadIdentityCredential` is tried before managed identity.
- On Azure with managed identity enabled, `ManagedIdentityCredential` is the common success path.

**Important:** Microsoft’s guidance is to use a **specific credential in production**—usually `ManagedIdentityCredential`—instead of `DefaultAzureCredential`, because it’s more deterministic.

## 5. Troubleshooting failures

1. **Turn on logs** to see which credential failed or succeeded.
2. **Check the exact auth source** you expect:
   - `az login`
   - VS Code Azure sign-in
   - Managed identity enabled on the Azure resource
   - Required env vars set for service principal auth
3. **Watch for auth vs authorization**:
   - Auth failure: can’t get a token
   - Authorization failure: got a token, but Key Vault returns `403`
4. **For Key Vault**, ensure the identity has a data-plane role such as **Key Vault Secrets User**.
5. **Constrain the chain** if needed with `AZURE_TOKEN_CREDENTIALS` or switch to a specific credential.
6. **Inspect aggregate errors**: `DefaultAzureCredential` can throw `AggregateAuthenticationError`, which contains per-credential failures.

## Complete TypeScript example

```ts
import { DefaultAzureCredential, AggregateAuthenticationError } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

async function main(): Promise<void> {
  const keyVaultUrl = process.env.KEY_VAULT_URL;
  const secretName = process.env.KEY_VAULT_SECRET_NAME ?? "my-secret";

  if (!keyVaultUrl) {
    throw new Error("Missing KEY_VAULT_URL. Example: https://myvault.vault.azure.net");
  }

  const credential = new DefaultAzureCredential();

  const client = new SecretClient(keyVaultUrl, credential);

  const secret = await client.getSecret(secretName);
  console.log(`Secret "${secret.name}" value: ${secret.value ?? "<empty>"}`);
}

main().catch((error: unknown) => {
  if (error instanceof AggregateAuthenticationError) {
    console.error("Authentication failed across the DefaultAzureCredential chain.");
    for (const innerError of error.errors) {
      console.error(`- ${innerError.name}: ${innerError.message}`);
    }
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error("Unknown error", error);
  }

  process.exit(1);
});
```

Example env vars:

```bash
set KEY_VAULT_URL=https://myvault.vault.azure.net
set KEY_VAULT_SECRET_NAME=my-secret
```

If you want credential-chain logging during troubleshooting:

```ts
import { setLogLevel, AzureLogger } from "@azure/logger";

setLogLevel("verbose");
AzureLogger.log = (...args) => {
  const message = args[0];
  if (typeof message === "string" && message.startsWith("azure:identity")) {
    console.log(...args);
  }
};
```

**References**
- https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/credential-chains
- https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/best-practices
- https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential?view=azure-node-latest
- https://learn.microsoft.com/azure/key-vault/secrets/quick-create-node?pivots=programming-language-typescript
- https://learn.microsoft.com/javascript/api/overview/azure/keyvault-secrets-readme?view=azure-node-latest#authenticating-with-azure-active-directory

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config azure-mcp-skills/gpt-5.4
```

---

[← Back to Summary](../../../../../../summary.md)
