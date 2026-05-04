# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** baseline-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 103.1s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | baseline-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 103.1s |
| Timestamp | 2026-05-01T23:11:43Z |
| Files Generated | 0 |
| Event Count | 130 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 103.0s |
| **Total** | **103.1s** |

## Configuration

- **model:** claude-opus-4.6
- **name:** baseline-skills/claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skill Directories | C:\code\hyoka\skills\generator\js-ts-azure-patterns |
| Skills Loaded | customize-cloud-agent |
| Skills Invoked | find-skills |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=139897 out=1882 |
| Turn Count | 7 |

## Error

```
0 files generated — agent did not create any files
```

## Prompt Sent

```
Show me how to
authenticate to Azure using a Service Principal with client secret. I need:
1. Required npm packages
2. How to create a ClientSecretCredential with tenant ID, client ID, and secret
3. Using it with an Azure SDK client
4. Best practices for secret management in Node.js
5. Error handling for authentication failures

Provide a complete TypeScript example.
```

## Copilot Reasoning

The user is asking about Azure Identity SDK usage with Service Principal authentication. Let me invoke the relevant skill first.

The user is asking about Azure Identity SDK with Service Principal authentication in TypeScript. Let me search for relevant skills first, then provide a comprehensive example.

Let me check if there's an Azure-related skill available, and also look at the current directory for any existing code.

I found an Azure Identity TypeScript skill. Let me install it and use its guidance.

Now I have comprehensive information from the Azure Identity skill. Let me create a complete TypeScript example for the user.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Providing Azure auth guidance"}
```

### 🔧 2. skill

**Input:**

```json
{"skill":"find-skills"}
```

### 🔧 3. report_intent

**Input:**

```json
{"intent":"Searching for Azure skills"}
```

### 🔧 4. powershell

**Input:**

```json
{"command":"npx skills find azure identity 2\u003e\u00261 | Select-Object -First 30","description":"Search for Azure identity skills","initial_wait":30}
```

### 🔧 5. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-baseline-skills-claude-opus-4.6-730033064"}
```

### 🔧 6. powershell

**Input:**

```json
{"command":"npx skills add sickn33/antigravity-awesome-skills@azure-identity-ts -g -y 2\u003e\u00261 | Select-Object -Last 10","description":"Install Azure Identity TS skill","initial_wait":30}
```

### 🔧 7. read_powershell

**Input:**

```json
{"delay":30,"shellId":"1"}
```

### 🔧 8. report_intent

**Input:**

```json
{"intent":"Reading Azure Identity skill"}
```

### 🔧 9. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\.agents\\skills\\azure-identity-ts"}
```

### 🔧 10. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\.agents\\skills\\azure-identity-ts\\SKILL.md"}
```

## Copilot Response

Here's a complete TypeScript example for Service Principal authentication with client secret:

## Required packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

## Complete Example

```typescript
import {
  ClientSecretCredential,
  DefaultAzureCredential,
  ChainedTokenCredential,
  AzureCliCredential,
} from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { setLogLevel } from "@azure/logger";

// ── 1. Create a ClientSecretCredential ──────────────────────────
// NEVER hardcode these — load from environment variables
const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;

if (!tenantId || !clientId || !clientSecret) {
  throw new Error(
    "Missing required env vars: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
  );
}

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

// ── 2. Use with an Azure SDK client (Key Vault example) ─────────
const vaultUrl = "https://<your-vault-name>.vault.azure.net";
const secretClient = new SecretClient(vaultUrl, credential);

// ── 3. Error handling for auth failures ─────────────────────────
async function getSecret(secretName: string): Promise<string | undefined> {
  try {
    const secret = await secretClient.getSecret(secretName);
    console.log(`Retrieved secret "${secretName}"`);
    return secret.value;
  } catch (err: unknown) {
    if (err instanceof Error) {
      // Common auth errors:
      // - "AADSTS7000215" → invalid client secret
      // - "AADSTS700016"  → app not found in tenant
      // - "AADSTS90002"   → tenant not found
      if (err.message.includes("AADSTS")) {
        console.error("Authentication failed:", err.message);
      } else {
        console.error("Operation failed:", err.message);
      }
    }
    throw err;
  }
}

// ── 4. Production pattern: ChainedTokenCredential ───────────────
// Use managed identity in prod, fall back to CLI for local dev
function createProductionCredential() {
  return new ChainedTokenCredential(
    new DefaultAzureCredential(), // tries managed identity, env vars, CLI, etc.
    new AzureCliCredential()      // explicit fallback for local dev
  );
}

// ── 5. Enable debug logging when troubleshooting ────────────────
if (process.env.DEBUG_AZURE) {
  setLogLevel("verbose");
}

// ── Usage ───────────────────────────────────────────────────────
(async () => {
  const value = await getSecret("my-secret");
  console.log("Secret value:", value);
})();
```

## Best practices for secret management

| Practice | Details |
|---|---|
| **Use env vars** | Set `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` — never hardcode |
| **Prefer managed identity** | In production (App Service, AKS, VMs), use `DefaultAzureCredential` which picks up managed identity automatically — no secrets needed |
| **Rotate secrets** | Set expiration on SP credentials in Entra ID; automate rotation |
| **Use `.env` + `.gitignore`** | For local dev, use `dotenv` and never commit `.env` files |
| **Least privilege** | Grant the SP only the RBAC roles it needs (e.g., `Key Vault Secrets User`) |
| **Use `DefaultAzureCredential`** | It works everywhere — managed identity in prod, CLI/env vars locally — so you don't need to change code per environment |

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config baseline-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
