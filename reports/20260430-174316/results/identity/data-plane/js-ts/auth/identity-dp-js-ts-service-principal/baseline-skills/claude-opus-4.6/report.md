# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** baseline-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 18.4s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | baseline-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 18.4s |
| Timestamp | 2026-05-01T00:49:19Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 18.4s |
| **Total** | **18.4s** |

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
| Token Usage | in=16493 out=739 |
| Turn Count | 1 |

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

The user wants a TypeScript example for Azure Service Principal authentication with client secret. This is a knowledge/documentation question - I can answer directly without needing to search the codebase.

## Copilot Response

Here's a complete TypeScript example for Azure Service Principal authentication:

## Required npm packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

## Complete Example

```typescript
import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// 1. Load credentials from environment variables (never hardcode)
const tenantId = process.env.AZURE_TENANT_ID!;
const clientId = process.env.AZURE_CLIENT_ID!;
const clientSecret = process.env.AZURE_CLIENT_SECRET!;

// 2. Create the credential
const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

// 3. Use it with any Azure SDK client
const vaultUrl = "https://my-keyvault.vault.azure.net";
const secretClient = new SecretClient(vaultUrl, credential);

async function main() {
  try {
    // Example: list secrets from Key Vault
    for await (const secretProperties of secretClient.listPropertiesOfSecrets()) {
      console.log(`Secret: ${secretProperties.name}`);
    }
  } catch (err: unknown) {
    // 4. Handle authentication errors specifically
    if (err instanceof Error) {
      if (err.name === "AuthenticationError") {
        console.error("Auth failed — check tenant/client/secret values");
      } else if (err.name === "CredentialUnavailableError") {
        console.error("Credential not configured properly");
      } else {
        console.error(`Unexpected error: ${err.message}`);
      }
    }
    process.exit(1);
  }
}

main();
```

## Best Practices

1. **Never hardcode secrets** — use environment variables or a `.env` file (with `dotenv`) excluded from git.

2. **Use `DefaultAzureCredential` in production** — it chains multiple auth methods (managed identity → env vars → CLI), making code portable:
   ```typescript
   import { DefaultAzureCredential } from "@azure/identity";
   const credential = new DefaultAzureCredential();
   ```

3. **Prefer Managed Identity** over service principals when running in Azure (no secret to rotate).

4. **Rotate secrets regularly** — set short expiry on app registrations.

5. **Least privilege** — assign only the RBAC roles the SP actually needs.

6. **Store secrets in Key Vault**, not in config files or env vars on VMs.

7. **Set `AZURE_*` env vars** for `DefaultAzureCredential` auto-detection:
   ```
   AZURE_TENANT_ID=<tenant>
   AZURE_CLIENT_ID=<client>
   AZURE_CLIENT_SECRET=<secret>
   ```

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config baseline-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
