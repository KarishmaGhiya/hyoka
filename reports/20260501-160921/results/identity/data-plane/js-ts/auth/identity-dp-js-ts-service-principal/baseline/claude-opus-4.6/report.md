# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** baseline/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 79.9s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | baseline/claude-opus-4.6 |
| Result | ❌ FAILED |
| Score | 17/10 |
| Duration | 79.9s |
| Timestamp | 2026-05-01T23:11:53Z |
| Files Generated | 1 |
| Event Count | 38 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 34.1s |
| Review | 45.6s |
| **Total** | **79.9s** |

## Configuration

- **model:** claude-opus-4.6
- **name:** baseline/claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=34337 out=1522 |
| Turn Count | 2 |

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

The user wants a TypeScript example for Azure Service Principal authentication with client secret. This is a knowledge/documentation question - I can answer directly without needing to explore any codebase.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Azure SP auth example"}
```

### 🔧 2. create

**Input:**

```json
{"file_text":"/**\n * Azure Service Principal Authentication with Client Secret\n *\n * Required packages:\n *   npm install @azure/identity @azure/keyvault-secrets\n *\n * @azure/identity       - Provides ClientSecretCredential and other credential classes\n * @azure/keyvault-secrets - Example SDK client (swap for any Azure SDK client)\n */\n\nimport { ClientSecretCredential, AuthenticationError } from \"@azure/identity\";\nimport { SecretClient } from \"@azure/keyvault-secrets\";\n\n// ---------------------------------------------------------------------------\n// 1. Configuration — load from environment variables, never hard-code secrets\n// ---------------------------------------------------------------------------\ninterface ServicePrincipalConfig {\n  tenantId: string;\n  clientId: string;\n  clientSecret: string;\n}\n\nfunction loadConfig(): ServicePrincipalConfig {\n  const tenantId = process.env.AZURE_TENANT_ID;\n  const clientId = process.env.AZURE_CLIENT_ID;\n  const clientSecret = process.env.AZURE_CLIENT_SECRET;\n\n  if (!tenantId || !clientId || !clientSecret) {\n    throw new Error(\n      \"Missing required environment variables: \" +\n        \"AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET\"\n    );\n  }\n\n  return { tenantId, clientId, clientSecret };\n}\n\n// ---------------------------------------------------------------------------\n// 2. Create the credential\n// ---------------------------------------------------------------------------\nfunction createCredential(config: ServicePrincipalConfig): ClientSecretCredential {\n  return new ClientSecretCredential(\n    config.tenantId,\n    config.clientId,\n    config.clientSecret,\n    {\n      // Optional: configure retry and logging\n      retryOptions: {\n        maxRetries: 3,\n        retryDelayInMs: 800,\n        maxRetryDelayInMs: 6400,\n      },\n    }\n  );\n}\n\n// ---------------------------------------------------------------------------\n// 3. Use the credential with an Azure SDK client (Key Vault example)\n// ---------------------------------------------------------------------------\nasync function useWithKeyVault(credential: ClientSecretCredential): Promise\u003cvoid\u003e {\n  const vaultUrl = process.env.AZURE_KEYVAULT_URL;\n  if (!vaultUrl) {\n    throw new Error(\"Missing AZURE_KEYVAULT_URL environment variable\");\n  }\n\n  const secretClient = new SecretClient(vaultUrl, credential);\n\n  // List secrets (demonstrates the credential in action)\n  console.log(\"Listing secrets in vault...\");\n  for await (const secretProperties of secretClient.listPropertiesOfSecrets()) {\n    console.log(`  - ${secretProperties.name} (enabled: ${secretProperties.enabled})`);\n  }\n}\n\n// ---------------------------------------------------------------------------\n// 4. Verify the credential works by requesting a token directly\n// ---------------------------------------------------------------------------\nasync function verifyCredential(credential: ClientSecretCredential): Promise\u003cvoid\u003e {\n  const tokenResponse = await credential.getToken(\n    \"https://management.azure.com/.default\"\n  );\n  console.log(\n    `Token acquired, expires: ${new Date(tokenResponse.expiresOnTimestamp).toISOString()}`\n  );\n}\n\n// ---------------------------------------------------------------------------\n// 5. Error handling\n// ---------------------------------------------------------------------------\nasync function main(): Promise\u003cvoid\u003e {\n  try {\n    const config = loadConfig();\n    const credential = createCredential(config);\n\n    await verifyCredential(credential);\n    await useWithKeyVault(credential);\n  } catch (error: unknown) {\n    if (error instanceof AuthenticationError) {\n      // AuthenticationError includes statusCode and detailed message\n      console.error(`Authentication failed (HTTP ${error.statusCode}): ${error.message}`);\n\n      // Common causes:\n      // 401 — invalid client secret or client ID\n      // 400 — invalid tenant ID or malformed request\n      // 403 — SP exists but lacks required permissions\n    } else if (error instanceof Error) {\n      console.error(`Error: ${error.message}`);\n    } else {\n      console.error(\"Unknown error\", error);\n    }\n    process.exit(1);\n  }\n}\n\nmain();\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-baseline-claude-opus-4.6-1543071739\\azure-sp-auth-example.ts"}
```

## Generated Files

- `azure-sp-auth-example.ts`

## Copilot Response

Created `azure-sp-auth-example.ts` with a complete working example. Here's the summary:

### Required packages
```bash
npm install @azure/identity @azure/keyvault-secrets
```

### Key concepts

1. **`ClientSecretCredential`** — takes `tenantId`, `clientId`, `clientSecret`; handles token acquisition and caching automatically.

2. **Any Azure SDK client** accepts the credential as a second argument (e.g., `new SecretClient(url, credential)`).

3. **Error handling** — catch `AuthenticationError` from `@azure/identity` for auth-specific failures (includes HTTP status code).

### Best practices for secret management
- **Never hard-code secrets** — use environment variables (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`)
- `@azure/identity` auto-reads these env vars via `DefaultAzureCredential`, but `ClientSecretCredential` gives you explicit control
- In production, prefer **managed identities** when running on Azure (no secret to manage)
- Rotate client secrets on a schedule and use **Azure Key Vault** to store other app secrets
- Use `.env` files locally (with `dotenv`) and **never commit them** — add `.env` to `.gitignore`

## Code Review (LLM-as-Judge)

**Score: 17/20 criteria passed**

### Criteria Results

| Criterion | Result | Reason |
|-----------|--------|--------|
| Code Builds | ✅ | TypeScript code is syntactically valid, uses correct imports and types. Would compile with proper tsconfig.json. |
| Latest Package Versions | ✅ | Uses current @azure/identity and @azure/keyvault-secrets packages without version pins. Assumes latest when installed. |
| Best Practices | ✅ | Uses ClientSecretCredential appropriately, loads secrets from environment variables, never hard-codes credentials, includes retry configuration. |
| Error Handling | ✅ | Comprehensive error handling with AuthenticationError catch, detailed error messages, and process.exit(1) on failure. Validates required env vars upfront. |
| Code Quality | ✅ | Well-structured with clear sections, descriptive comments, typed interfaces, and clean separation of concerns. |
| Correct @azure/ Scoped Packages | ✅ | Uses @azure/identity and @azure/keyvault-secrets. No deprecated unscoped packages. |
| @azure/identity for Authentication | ✅ | Imports and uses ClientSecretCredential from @azure/identity. No hardcoded secrets or connection strings. |
| Client Constructor with Endpoint and Credential | ✅ | SecretClient constructed with endpoint URL and credential: new SecretClient(vaultUrl, credential). |
| Async/Await Pattern | ✅ | All async operations use async/await. Main function is async. No .then()/.catch() chains. |
| Pagination with for-await-of | ✅ | List operation uses for-await-of over listPropertiesOfSecrets(). Does not accumulate all pages in memory. |
| LRO Pattern (beginXxx + pollUntilDone) | ✅ | Not applicable - no long-running operations in this example. Code uses appropriate patterns for operations shown. |
| RestError Exception Handling | ❌ | Catches AuthenticationError for auth failures, but does not handle RestError for service operation failures (e.g., from listPropertiesOfSecrets). |
| No Deprecated Packages | ✅ | No deprecated packages referenced. Uses current @azure/* track. |
| Logging via @azure/logger | ❌ | Does not import or use @azure/logger. Uses console.log instead of setLogLevel() or AZURE_LOG_LEVEL. |
| package.json with Correct Dependencies | ❌ | No package.json file provided. Only lists dependencies in comments. Missing tsconfig.json. |
| @azure/identity package with ClientSecretCredential class | ✅ | Imports and demonstrates ClientSecretCredential from @azure/identity. |
| Constructor parameters: tenantId, clientId, clientSecret | ✅ | Correctly passes tenantId, clientId, clientSecret to ClientSecretCredential constructor in proper order. |
| Passing credential to Azure SDK clients | ✅ | Demonstrates passing credential to SecretClient constructor and using it for operations. |
| dotenv or environment variable patterns | ✅ | Uses process.env to load configuration. Validates required variables. Comments mention dotenv is optional. |
| AuthenticationError handling | ✅ | Catches AuthenticationError specifically, inspects statusCode, provides helpful error messages for common auth failure scenarios. |

### Summary

High-quality TypeScript example demonstrating Azure Service Principal authentication with client secrets. Code is well-structured, uses proper async patterns, includes comprehensive authentication error handling, and follows most Azure SDK best practices. Missing package.json/tsconfig.json files, @azure/logger integration, and RestError handling for service errors.

### Strengths

- Correct ClientSecretCredential usage with all required parameters
- Excellent secret management using environment variables with validation
- Comprehensive AuthenticationError handling with status code inspection and helpful messages
- Clean code structure with clear sections and detailed comments
- Proper async/await patterns and for-await-of pagination
- Includes credential verification example with getToken()
- Demonstrates both direct token acquisition and SDK client usage

### Issues

- No package.json or tsconfig.json provided - only dependencies listed in comments
- Does not use @azure/logger for SDK diagnostic logging (uses console.log instead)
- Missing RestError handling for service operation failures (only catches AuthenticationError)

## Grader Results

| Grader | Type | Score | Summary |
|--------|------|-------|----------|
| `claude-sonnet-4.5` | review | 17/20 | High-quality TypeScript example demonstrating Azure Service Principal authentica… |
| 🏆 `claude-sonnet-4.5` | review | 17/20 | High-quality TypeScript example demonstrating Azure Service Principal authentica… |

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config baseline/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
