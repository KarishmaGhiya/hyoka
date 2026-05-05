# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** azure-mcp-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 222.9s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | azure-mcp-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Score | 15/10 |
| Duration | 222.9s |
| Timestamp | 2026-05-01T00:48:14Z |
| Files Generated | 1 |
| Event Count | 83 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 54.1s |
| Review | 168.6s |
| **Total** | **222.9s** |

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
| Token Usage | in=198274 out=2174 |
| Turn Count | 5 |

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

The user wants a complete TypeScript example for Azure Service Principal authentication with client secret. This is a knowledge/documentation question. Let me provide a comprehensive example.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating SP auth example"}
```

### 🔧 2. azure-documentation (via azure)

**Input:**

```json
{"intent":"Authenticate to Azure using Service Principal with client secret in Node.js TypeScript using @azure/identity ClientSecretCredential","learn":true}
```

### 🔧 3. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_code_sample_search","intent":"Search for Azure Identity SDK ClientSecretCredential TypeScript Node.js authentication","parameters":{"language":"typescript","query":"ClientSecretCredential service principal authentication @azure/identity"}}
```

### 🔧 4. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"intent":"Get best practices for Azure identity and secret management in Node.js TypeScript","learn":true}
```

### 🔧 5. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"command":"get_azure_bestpractices_get","intent":"Get best practices for Azure identity and authentication in Node.js","parameters":{"action":"code-generation","resource":"general"}}
```

### 🔧 6. report_intent

**Input:**

```json
{"intent":"Writing SP auth example"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"/**\n * Azure Service Principal Authentication with Client Secret\n *\n * Required npm packages:\n *   npm install @azure/identity @azure/keyvault-secrets @azure/storage-blob\n *\n * Environment variables (never hardcode these):\n *   AZURE_TENANT_ID     - Your Microsoft Entra ID tenant ID\n *   AZURE_CLIENT_ID     - The service principal's application (client) ID\n *   AZURE_CLIENT_SECRET - The service principal's client secret value\n *\n * References:\n *   https://learn.microsoft.com/javascript/api/overview/azure/identity-readme\n *   https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/on-premises-apps\n */\n\nimport { ClientSecretCredential, AuthenticationError } from \"@azure/identity\";\nimport { BlobServiceClient } from \"@azure/storage-blob\";\nimport { SecretClient } from \"@azure/keyvault-secrets\";\n\n// ---------------------------------------------------------------------------\n// 1. Load credentials from environment variables\n// ---------------------------------------------------------------------------\nfunction loadConfig() {\n  const tenantId = process.env.AZURE_TENANT_ID;\n  const clientId = process.env.AZURE_CLIENT_ID;\n  const clientSecret = process.env.AZURE_CLIENT_SECRET;\n\n  if (!tenantId || !clientId || !clientSecret) {\n    throw new Error(\n      \"Missing required environment variables: \" +\n        \"AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET\"\n    );\n  }\n\n  return { tenantId, clientId, clientSecret };\n}\n\n// ---------------------------------------------------------------------------\n// 2. Create a ClientSecretCredential\n// ---------------------------------------------------------------------------\nfunction createCredential(): ClientSecretCredential {\n  const { tenantId, clientId, clientSecret } = loadConfig();\n\n  return new ClientSecretCredential(tenantId, clientId, clientSecret, {\n    // Optional: configure retry and logging\n    retryOptions: {\n      maxRetries: 3,\n      retryDelayInMs: 800,\n      maxRetryDelayInMs: 5000,\n    },\n  });\n}\n\n// ---------------------------------------------------------------------------\n// 3a. Example: Use with Azure Blob Storage\n// ---------------------------------------------------------------------------\nasync function listBlobContainers(accountName: string): Promise\u003cvoid\u003e {\n  const credential = createCredential();\n  const blobServiceClient = new BlobServiceClient(\n    `https://${accountName}.blob.core.windows.net`,\n    credential\n  );\n\n  console.log(`Listing containers in storage account: ${accountName}`);\n  for await (const container of blobServiceClient.listContainers()) {\n    console.log(`  - ${container.name}`);\n  }\n}\n\n// ---------------------------------------------------------------------------\n// 3b. Example: Use with Azure Key Vault\n// ---------------------------------------------------------------------------\nasync function getKeyVaultSecret(\n  vaultName: string,\n  secretName: string\n): Promise\u003cstring | undefined\u003e {\n  const credential = createCredential();\n  const client = new SecretClient(\n    `https://${vaultName}.vault.azure.net`,\n    credential\n  );\n\n  const secret = await client.getSecret(secretName);\n  console.log(`Retrieved secret \"${secretName}\" from vault \"${vaultName}\"`);\n  return secret.value;\n}\n\n// ---------------------------------------------------------------------------\n// 4. Error handling for authentication failures\n// ---------------------------------------------------------------------------\nasync function main(): Promise\u003cvoid\u003e {\n  try {\n    // Replace with your actual resource names\n    await listBlobContainers(\"mystorageaccount\");\n    await getKeyVaultSecret(\"mykeyvault\", \"my-secret\");\n  } catch (error: unknown) {\n    if (error instanceof AuthenticationError) {\n      // Specific authentication errors from @azure/identity\n      console.error(\"Authentication failed:\");\n      console.error(`  Status code: ${error.statusCode}`);\n      console.error(`  Message:     ${error.message}`);\n\n      // Common causes and remediation\n      if (error.message.includes(\"AADSTS7000215\")) {\n        console.error(\"  → Invalid client secret. Rotate it in Entra ID.\");\n      } else if (error.message.includes(\"AADSTS700016\")) {\n        console.error(\"  → App not found. Verify the client ID.\");\n      } else if (error.message.includes(\"AADSTS90002\")) {\n        console.error(\"  → Tenant not found. Verify the tenant ID.\");\n      }\n    } else if (error instanceof Error) {\n      console.error(`Unexpected error: ${error.message}`);\n    }\n    process.exit(1);\n  }\n}\n\nmain();\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-azure-mcp-skills-claude-opus-4.6-1699226893\\service-principal-auth.ts"}
```

## Generated Files

- `service-principal-auth.ts`

## Copilot Response

Here's the complete example saved to `service-principal-auth.ts`. Key points:

### 1. Required npm packages
```
npm install @azure/identity @azure/keyvault-secrets @azure/storage-blob
```

### 2. ClientSecretCredential
Pass `tenantId`, `clientId`, and `clientSecret` — all loaded from **environment variables**, never hardcoded.

### 3. SDK client usage
The credential is passed directly to any Azure SDK client (`BlobServiceClient`, `SecretClient`, etc.) — they all accept `TokenCredential`.

### 4. Secret management best practices
- **Environment variables** for credentials (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`)
- **Azure Key Vault** to store application secrets
- **Managed Identity** is preferred over client secrets when running in Azure
- Rotate client secrets regularly; set short expiration in Entra ID
- Use `.env` files locally (add to `.gitignore`), never commit secrets

### 5. Error handling
The example catches `AuthenticationError` from `@azure/identity` and maps common Entra ID error codes (`AADSTS7000215`, `AADSTS700016`, `AADSTS90002`) to actionable messages.

> **Tip:** In production Azure workloads, prefer `DefaultAzureCredential` or `ManagedIdentityCredential` — they eliminate secrets entirely. Use `ClientSecretCredential` for CI/CD pipelines or on-premises apps where managed identity isn't available.

## Code Review (LLM-as-Judge)

**Score: 15/20 criteria passed**

### Criteria Results

| Criterion | Result | Reason |
|-----------|--------|--------|
| Code Builds | ❌ | No package.json or tsconfig.json provided. Cannot compile TypeScript without build scaffolding. Both reviewers agree. |
| Latest Package Versions | ❌ | No package.json with version pins. Latest versions are @azure/identity@4.13.1, @azure/storage-blob@12.31.0, @azure/keyvault-secrets@4.11.1 but no versions specified anywhere. |
| Best Practices | ✅ | Uses environment variables for secrets, ClientSecretCredential for auth, async/await patterns, and clear separation of concerns. Reviewer 2 incorrectly claimed AuthenticationError does not exist; it is a valid export from @azure/identity. |
| Error Handling | ✅ | Catches AuthenticationError (confirmed valid export from @azure/identity) with statusCode inspection and AADSTS error code remediation hints. Also catches generic Error. Reviewer 2's claim that AuthenticationError doesn't exist was factually wrong. |
| Code Quality | ✅ | Well-structured with clear sections, good comments, descriptive function names, and proper TypeScript typing. Both reviewers agree. |
| Correct @azure/ Scoped Packages | ✅ | Uses @azure/identity, @azure/storage-blob, @azure/keyvault-secrets. No deprecated unscoped packages. Both reviewers agree. |
| @azure/identity for Authentication | ✅ | Uses @azure/identity with ClientSecretCredential. No hardcoded secrets; credentials loaded from environment variables. Both reviewers agree. |
| Client Constructor with Endpoint and Credential | ✅ | BlobServiceClient(url, credential) and SecretClient(vaultUrl, credential) follow correct constructor pattern. Both reviewers agree. |
| Async/Await Pattern | ✅ | All async operations use async/await. Entry point calls main() directly. No .then()/.catch() chains. Both reviewers agree. |
| Pagination with for-await-of | ✅ | listContainers() iterated with for-await-of over PagedAsyncIterableIterator. No array accumulation. Both reviewers agree. |
| LRO Pattern (beginXxx + pollUntilDone) | ✅ | No long-running operations in this sample. The prompt did not require LRO operations, so no misuse to penalize. Reviewer 2 failed this but the prompt is about authentication, not LROs. |
| RestError Exception Handling | ❌ | No RestError handling from @azure/core-rest-pipeline. Only AuthenticationError and generic Error are caught. Service-level HTTP errors (e.g., 404, 403) are not handled. Both reviewers agree. |
| No Deprecated Packages | ✅ | All referenced packages are current-track @azure/* packages. Both reviewers agree. |
| Logging via @azure/logger | ❌ | No import or use of @azure/logger. No setLogLevel() call or AZURE_LOG_LEVEL mention. Both reviewers agree. |
| package.json with Correct Dependencies | ❌ | No package.json or tsconfig.json provided. Only an npm install comment in the header. Both reviewers agree. |
| @azure/identity package with ClientSecretCredential class | ✅ | Imports ClientSecretCredential from @azure/identity and uses it as the primary credential. |
| Constructor parameters: tenantId, clientId, clientSecret | ✅ | ClientSecretCredential constructed with tenantId, clientId, clientSecret in correct order. |
| Passing credential to Azure SDK clients | ✅ | Credential passed to both BlobServiceClient and SecretClient constructors. |
| dotenv or environment variable patterns | ✅ | Uses process.env for AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET with validation. Comment explicitly states never hardcode. |
| AuthenticationError handling | ✅ | Imports and catches AuthenticationError from @azure/identity with statusCode inspection and AADSTS error code matching. AuthenticationError is a confirmed valid export. |

### Summary

Solid TypeScript example demonstrating service principal authentication with ClientSecretCredential. Covers two Azure services (Blob Storage + Key Vault), proper async/await, pagination with for-await-of, environment variable configuration, and detailed AuthenticationError handling with AADSTS code remediation hints. Key gaps: missing package.json/tsconfig.json (unbuildable as-is), no @azure/logger usage for SDK diagnostics, no RestError handling for service-level HTTP errors, and no pinned dependency versions. Note: Reviewer 2 incorrectly claimed AuthenticationError does not exist in @azure/identity; official Microsoft documentation confirms it is a valid export with statusCode property.

### Strengths

- Excellent AuthenticationError handling with specific AADSTS error code remediation hints (AADSTS7000215, AADSTS700016, AADSTS90002)
- Clean separation of concerns: loadConfig, createCredential, service-specific functions, main
- Correct for-await-of pagination over listContainers()
- Environment variable validation with clear error message on missing vars
- Two distinct Azure service examples (Blob Storage + Key Vault) showing credential reuse
- Readable, well-structured code with helpful comments and references

### Issues

- No package.json or tsconfig.json — code cannot be built as-is
- No RestError handling for service-level HTTP errors (404, 403, etc.)
- No @azure/logger usage for SDK diagnostic logging
- No dependency versions specified anywhere

## Grader Results

| Grader | Type | Score | Summary |
|--------|------|-------|----------|
| `claude-opus-4.6` | review | 15/20 | Solid TypeScript example demonstrating service principal authentication with Cli… |
| `gpt-4.1` | review | 7/15 | The code demonstrates correct use of Azure SDK authentication and async patterns… |
| 🏆 `consensus` | review | 15/20 | Solid TypeScript example demonstrating service principal authentication with Cli… |

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config azure-mcp-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
