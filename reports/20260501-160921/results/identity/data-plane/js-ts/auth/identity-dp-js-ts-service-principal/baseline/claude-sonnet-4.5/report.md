# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** baseline/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 125.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | baseline/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Score | 18/10 |
| Duration | 125.0s |
| Timestamp | 2026-05-01T23:12:09Z |
| Files Generated | 4 |
| Event Count | 63 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 78.3s |
| Review | 46.7s |
| **Total** | **125.0s** |

## Configuration

- **name:** baseline/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=39495 out=6363 |
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

The user wants a complete TypeScript example of authenticating to Azure using a Service Principal with client secret. They want:
1. Required npm packages
2. How to create ClientSecretCredential
3. Using it with an Azure SDK client
4. Best practices for secret management
5. Error handling

This is a straightforward request to create a TypeScript example demonstrating Azure Service Principal authentication. I should:
1. Create a TypeScript file with a complete working example
2. Include comments explaining best practices
3. Show error handling
4. Explain the packages needed

I'll create a comprehensive TypeScript file showing the implementation.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Azure auth example"}
```

### 🔧 2. create

**Input:**

```json
{"file_text":"import { ClientSecretCredential } from \"@azure/identity\";\nimport { SecretClient } from \"@azure/keyvault-secrets\";\nimport { BlobServiceClient } from \"@azure/storage-blob\";\n\n/**\n * Azure Service Principal Authentication with Client Secret\n * \n * This example demonstrates best practices for authenticating to Azure\n * using a Service Principal with a client secret credential.\n */\n\n// ============================================================================\n// 1. REQUIRED NPM PACKAGES\n// ============================================================================\n/*\nnpm install @azure/identity\nnpm install @azure/keyvault-secrets  // Example Azure SDK client\nnpm install @azure/storage-blob      // Another example Azure SDK client\nnpm install dotenv                   // For environment variable management\nnpm install @types/node --save-dev   // TypeScript types for Node.js\n*/\n\n// ============================================================================\n// 2. ENVIRONMENT VARIABLES SETUP (Best Practice)\n// ============================================================================\nimport dotenv from \"dotenv\";\ndotenv.config();\n\ninterface AzureCredentials {\n  tenantId: string;\n  clientId: string;\n  clientSecret: string;\n}\n\n/**\n * Retrieves Azure credentials from environment variables\n * Best Practice: Never hardcode credentials in source code\n */\nfunction getAzureCredentials(): AzureCredentials {\n  const tenantId = process.env.AZURE_TENANT_ID;\n  const clientId = process.env.AZURE_CLIENT_ID;\n  const clientSecret = process.env.AZURE_CLIENT_SECRET;\n\n  if (!tenantId || !clientId || !clientSecret) {\n    throw new Error(\n      \"Missing required environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET\"\n    );\n  }\n\n  return { tenantId, clientId, clientSecret };\n}\n\n// ============================================================================\n// 3. CREATING CLIENT SECRET CREDENTIAL\n// ============================================================================\n\n/**\n * Creates a ClientSecretCredential with proper error handling\n */\nfunction createCredential(): ClientSecretCredential {\n  try {\n    const { tenantId, clientId, clientSecret } = getAzureCredentials();\n\n    // Create the credential\n    const credential = new ClientSecretCredential(\n      tenantId,\n      clientId,\n      clientSecret,\n      {\n        // Optional: Configure additional options\n        authorityHost: process.env.AZURE_AUTHORITY_HOST, // For sovereign clouds\n        // retryOptions: { maxRetries: 3 },\n      }\n    );\n\n    console.log(\"✓ ClientSecretCredential created successfully\");\n    return credential;\n  } catch (error) {\n    console.error(\"✗ Failed to create credential:\", error);\n    throw error;\n  }\n}\n\n// ============================================================================\n// 4. USING CREDENTIAL WITH AZURE SDK CLIENTS\n// ============================================================================\n\n/**\n * Example 1: Using with Azure Key Vault\n */\nasync function accessKeyVault(\n  credential: ClientSecretCredential,\n  vaultUrl: string\n): Promise\u003cvoid\u003e {\n  try {\n    // Create Key Vault client with the credential\n    const secretClient = new SecretClient(vaultUrl, credential);\n\n    // Test authentication by retrieving a secret\n    const secretName = \"example-secret\";\n    const secret = await secretClient.getSecret(secretName);\n\n    console.log(`✓ Successfully retrieved secret: ${secret.name}`);\n    console.log(`  Value: ${secret.value ? \"****\" : \"(empty)\"}`);\n  } catch (error) {\n    handleAuthenticationError(error, \"Key Vault\");\n    throw error;\n  }\n}\n\n/**\n * Example 2: Using with Azure Blob Storage\n */\nasync function accessBlobStorage(\n  credential: ClientSecretCredential,\n  storageAccountUrl: string\n): Promise\u003cvoid\u003e {\n  try {\n    // Create Blob Service client with the credential\n    const blobServiceClient = new BlobServiceClient(\n      storageAccountUrl,\n      credential\n    );\n\n    // Test authentication by listing containers\n    const containerIterator = blobServiceClient.listContainers();\n    const containers: string[] = [];\n\n    for await (const container of containerIterator) {\n      containers.push(container.name);\n    }\n\n    console.log(`✓ Successfully listed ${containers.length} containers`);\n  } catch (error) {\n    handleAuthenticationError(error, \"Blob Storage\");\n    throw error;\n  }\n}\n\n// ============================================================================\n// 5. ERROR HANDLING FOR AUTHENTICATION FAILURES\n// ============================================================================\n\n/**\n * Comprehensive error handling for authentication failures\n */\nfunction handleAuthenticationError(error: unknown, serviceName: string): void {\n  if (error instanceof Error) {\n    const errorMessage = error.message.toLowerCase();\n\n    // Handle specific authentication error scenarios\n    if (errorMessage.includes(\"unauthorized\") || errorMessage.includes(\"401\")) {\n      console.error(`✗ Authentication failed for ${serviceName}:`);\n      console.error(\"  - Verify client secret is correct and not expired\");\n      console.error(\"  - Check if service principal has required permissions\");\n    } else if (\n      errorMessage.includes(\"forbidden\") ||\n      errorMessage.includes(\"403\")\n    ) {\n      console.error(`✗ Authorization failed for ${serviceName}:`);\n      console.error(\"  - Service principal lacks necessary permissions\");\n      console.error(\"  - Check RBAC roles assigned to the service principal\");\n    } else if (\n      errorMessage.includes(\"tenant\") ||\n      errorMessage.includes(\"invalid_tenant\")\n    ) {\n      console.error(`✗ Invalid tenant ID:`);\n      console.error(\"  - Verify AZURE_TENANT_ID is correct\");\n    } else if (\n      errorMessage.includes(\"client\") ||\n      errorMessage.includes(\"invalid_client\")\n    ) {\n      console.error(`✗ Invalid client credentials:`);\n      console.error(\"  - Verify AZURE_CLIENT_ID is correct\");\n      console.error(\"  - Check if service principal is active\");\n    } else if (\n      errorMessage.includes(\"timeout\") ||\n      errorMessage.includes(\"network\")\n    ) {\n      console.error(`✗ Network error while authenticating:`);\n      console.error(\"  - Check network connectivity\");\n      console.error(\"  - Verify firewall rules allow Azure connections\");\n    } else {\n      console.error(`✗ Unexpected authentication error for ${serviceName}:`);\n      console.error(`  ${error.message}`);\n    }\n  } else {\n    console.error(`✗ Unknown error type for ${serviceName}:`, error);\n  }\n}\n\n// ============================================================================\n// 6. BEST PRACTICES FOR SECRET MANAGEMENT\n// ============================================================================\n\n/**\n * SECURITY BEST PRACTICES:\n * \n * 1. ENVIRONMENT VARIABLES:\n *    - Store credentials in environment variables, never in code\n *    - Use .env files locally (add .env to .gitignore)\n *    - Set environment variables in production deployment environment\n * \n * 2. AZURE KEY VAULT (Production Recommended):\n *    - Store secrets in Azure Key Vault\n *    - Use Managed Identity for the application itself when possible\n *    - Only use Service Principal when Managed Identity isn't available\n * \n * 3. SECRET ROTATION:\n *    - Regularly rotate client secrets (e.g., every 90 days)\n *    - Support multiple active secrets during rotation period\n *    - Use expiration dates on secrets\n * \n * 4. LEAST PRIVILEGE:\n *    - Grant only the minimum required permissions\n *    - Use specific RBAC roles, not Owner or Contributor\n *    - Scope permissions to specific resources when possible\n * \n * 5. AUDIT AND MONITORING:\n *    - Enable Azure AD sign-in logs\n *    - Monitor for failed authentication attempts\n *    - Set up alerts for suspicious activity\n * \n * 6. NEVER:\n *    - Commit secrets to source control\n *    - Log secret values\n *    - Share secrets via insecure channels\n *    - Hardcode secrets in application code\n */\n\n// ============================================================================\n// 7. EXAMPLE: LOADING SECRETS FROM AZURE KEY VAULT (RECOMMENDED)\n// ============================================================================\n\n/**\n * Advanced pattern: Use a bootstrap credential to fetch secrets from Key Vault\n * Then use those secrets for the actual application credential\n */\nasync function getCredentialFromKeyVault(): Promise\u003cClientSecretCredential\u003e {\n  // Bootstrap: Use environment variables for Key Vault access only\n  const bootstrapCredential = createCredential();\n  \n  const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;\n  if (!keyVaultUrl) {\n    throw new Error(\"AZURE_KEYVAULT_URL not configured\");\n  }\n\n  try {\n    const secretClient = new SecretClient(keyVaultUrl, bootstrapCredential);\n\n    // Fetch actual application credentials from Key Vault\n    const tenantId = (await secretClient.getSecret(\"app-tenant-id\")).value!;\n    const clientId = (await secretClient.getSecret(\"app-client-id\")).value!;\n    const clientSecret = (await secretClient.getSecret(\"app-client-secret\")).value!;\n\n    // Create application credential using secrets from Key Vault\n    const appCredential = new ClientSecretCredential(\n      tenantId,\n      clientId,\n      clientSecret\n    );\n\n    console.log(\"✓ Application credential loaded from Key Vault\");\n    return appCredential;\n  } catch (error) {\n    handleAuthenticationError(error, \"Key Vault Secret Retrieval\");\n    throw error;\n  }\n}\n\n// ============================================================================\n// 8. MAIN EXECUTION EXAMPLE\n// ============================================================================\n\nasync function main(): Promise\u003cvoid\u003e {\n  console.log(\"=== Azure Service Principal Authentication Example ===\\n\");\n\n  try {\n    // Create credential\n    const credential = createCredential();\n\n    // Example 1: Access Key Vault\n    const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;\n    if (keyVaultUrl) {\n      console.log(\"\\n--- Testing Key Vault Access ---\");\n      await accessKeyVault(credential, keyVaultUrl);\n    }\n\n    // Example 2: Access Blob Storage\n    const storageAccountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL;\n    if (storageAccountUrl) {\n      console.log(\"\\n--- Testing Blob Storage Access ---\");\n      await accessBlobStorage(credential, storageAccountUrl);\n    }\n\n    console.log(\"\\n✓ All authentication tests completed successfully\");\n  } catch (error) {\n    console.error(\"\\n✗ Authentication example failed\");\n    process.exit(1);\n  }\n}\n\n// ============================================================================\n// 9. RETRY LOGIC FOR TRANSIENT FAILURES\n// ============================================================================\n\n/**\n * Helper function to retry operations on transient failures\n */\nasync function withRetry\u003cT\u003e(\n  operation: () =\u003e Promise\u003cT\u003e,\n  maxRetries: number = 3,\n  delayMs: number = 1000\n): Promise\u003cT\u003e {\n  let lastError: Error | undefined;\n\n  for (let attempt = 1; attempt \u003c= maxRetries; attempt++) {\n    try {\n      return await operation();\n    } catch (error) {\n      lastError = error as Error;\n      \n      // Don't retry on permanent failures (4xx errors)\n      if (\n        error instanceof Error \u0026\u0026\n        (error.message.includes(\"401\") ||\n          error.message.includes(\"403\") ||\n          error.message.includes(\"invalid\"))\n      ) {\n        throw error;\n      }\n\n      // Retry on transient failures (5xx, network errors)\n      if (attempt \u003c maxRetries) {\n        console.log(`  Attempt ${attempt} failed, retrying in ${delayMs}ms...`);\n        await new Promise((resolve) =\u003e setTimeout(resolve, delayMs));\n        delayMs *= 2; // Exponential backoff\n      }\n    }\n  }\n\n  throw lastError;\n}\n\n// ============================================================================\n// 10. CREDENTIAL VALIDATION\n// ============================================================================\n\n/**\n * Validates that the credential works before using it in the application\n */\nasync function validateCredential(\n  credential: ClientSecretCredential\n): Promise\u003cboolean\u003e {\n  try {\n    // Use a lightweight operation to validate the credential\n    // For example, get a token for the Azure Resource Manager scope\n    const token = await credential.getToken(\n      \"https://management.azure.com/.default\"\n    );\n\n    if (token \u0026\u0026 token.token) {\n      console.log(\"✓ Credential validated successfully\");\n      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);\n      return true;\n    }\n\n    return false;\n  } catch (error) {\n    console.error(\"✗ Credential validation failed\");\n    handleAuthenticationError(error, \"Credential Validation\");\n    return false;\n  }\n}\n\n// Execute main function if this file is run directly\nif (require.main === module) {\n  main().catch((error) =\u003e {\n    console.error(\"Fatal error:\", error);\n    process.exit(1);\n  });\n}\n\n// Export functions for use in other modules\nexport {\n  createCredential,\n  getAzureCredentials,\n  accessKeyVault,\n  accessBlobStorage,\n  handleAuthenticationError,\n  getCredentialFromKeyVault,\n  withRetry,\n  validateCredential,\n};\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-baseline-claude-sonnet-4.5-424798506\\azure-service-principal-auth.ts"}
```

### 🔧 3. create

**Input:**

```json
{"file_text":"# Azure Service Principal Credentials\n# Copy this file to .env and fill in your actual values\n# NEVER commit .env to source control!\n\n# Required for Service Principal authentication\nAZURE_TENANT_ID=your-tenant-id-here\nAZURE_CLIENT_ID=your-client-id-here\nAZURE_CLIENT_SECRET=your-client-secret-here\n\n# Optional: For sovereign clouds (e.g., Azure Government, Azure China)\n# AZURE_AUTHORITY_HOST=https://login.microsoftonline.us\n\n# Example Azure resources to test against\nAZURE_KEYVAULT_URL=https://your-keyvault-name.vault.azure.net\nAZURE_STORAGE_ACCOUNT_URL=https://your-storage-account.blob.core.windows.net\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-baseline-claude-sonnet-4.5-424798506\\.env.example"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-service-principal-auth-example\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Complete example of Azure Service Principal authentication with client secret\",\n  \"main\": \"azure-service-principal-auth.ts\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"ts-node azure-service-principal-auth.ts\",\n    \"dev\": \"ts-node-dev --respawn azure-service-principal-auth.ts\"\n  },\n  \"keywords\": [\n    \"azure\",\n    \"authentication\",\n    \"service-principal\",\n    \"client-secret\",\n    \"typescript\"\n  ],\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.0.0\",\n    \"@azure/keyvault-secrets\": \"^4.8.0\",\n    \"@azure/storage-blob\": \"^12.17.0\",\n    \"dotenv\": \"^16.3.1\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.10.0\",\n    \"ts-node\": \"^10.9.2\",\n    \"ts-node-dev\": \"^2.0.0\",\n    \"typescript\": \"^5.3.3\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-baseline-claude-sonnet-4.5-424798506\\package.json"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true,\n    \"moduleResolution\": \"node\",\n    \"declaration\": true,\n    \"declarationMap\": true,\n    \"sourceMap\": true\n  },\n  \"include\": [\"*.ts\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-baseline-claude-sonnet-4.5-424798506\\tsconfig.json"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"# Azure Service Principal Authentication with Client Secret\n\nA comprehensive TypeScript example demonstrating best practices for authenticating to Azure using a Service Principal with client secret credentials.\n\n## 📦 Installation\n\n```bash\nnpm install\n```\n\n## 🔧 Configuration\n\n1. Copy the example environment file:\n```bash\ncp .env.example .env\n```\n\n2. Fill in your Azure credentials in `.env`:\n```env\nAZURE_TENANT_ID=your-tenant-id\nAZURE_CLIENT_ID=your-client-id\nAZURE_CLIENT_SECRET=your-client-secret\n```\n\n## 🚀 Usage\n\nRun the example:\n```bash\nnpm start\n```\n\nOr for development with auto-reload:\n```bash\nnpm run dev\n```\n\n## 📋 Prerequisites\n\n### Creating a Service Principal\n\nUsing Azure CLI:\n```bash\naz ad sp create-for-rbac --name \"my-app-service-principal\" --role Contributor --scopes /subscriptions/{subscription-id}\n```\n\nThis will output:\n```json\n{\n  \"appId\": \"your-client-id\",\n  \"displayName\": \"my-app-service-principal\",\n  \"password\": \"your-client-secret\",\n  \"tenant\": \"your-tenant-id\"\n}\n```\n\n### Assigning Permissions\n\nFor Key Vault access:\n```bash\naz keyvault set-policy --name \u003cvault-name\u003e --spn \u003cclient-id\u003e --secret-permissions get list\n```\n\nFor Storage access:\n```bash\naz role assignment create --assignee \u003cclient-id\u003e --role \"Storage Blob Data Reader\" --scope /subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Storage/storageAccounts/{storage-account}\n```\n\n## 🔒 Security Best Practices\n\n### 1. Environment Variables\n- ✅ Store credentials in environment variables\n- ✅ Use `.env` files locally (add to `.gitignore`)\n- ❌ Never hardcode credentials in source code\n- ❌ Never commit `.env` to source control\n\n### 2. Production Secret Management\n- Use Azure Key Vault for secret storage\n- Consider Azure Managed Identity when possible\n- Implement secret rotation policies\n\n### 3. Least Privilege\n- Grant only necessary permissions\n- Use specific RBAC roles\n- Scope permissions to specific resources\n\n### 4. Monitoring\n- Enable Azure AD sign-in logs\n- Set up alerts for failed authentication\n- Monitor for suspicious activity\n\n## 📚 What's Included\n\nThe example demonstrates:\n\n1. **Required NPM Packages** - All necessary dependencies\n2. **ClientSecretCredential Creation** - Proper credential initialization\n3. **Azure SDK Integration** - Examples with Key Vault and Blob Storage\n4. **Error Handling** - Comprehensive authentication error scenarios\n5. **Best Practices** - Security patterns and secret management\n6. **Retry Logic** - Handling transient failures\n7. **Credential Validation** - Pre-flight credential checking\n8. **Key Vault Bootstrap** - Loading secrets from Key Vault\n\n## 🛠️ Common Error Scenarios\n\n### 401 Unauthorized\n- Verify client secret is correct\n- Check if secret has expired\n- Ensure service principal is active\n\n### 403 Forbidden\n- Service principal lacks necessary permissions\n- Check RBAC role assignments\n- Verify resource scope\n\n### Invalid Tenant\n- Verify `AZURE_TENANT_ID` is correct\n- Check if using correct Azure cloud (Public, Government, etc.)\n\n### Network Errors\n- Check network connectivity\n- Verify firewall rules\n- Ensure Azure endpoints are accessible\n\n## 📖 Further Reading\n\n- [Azure Identity SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme)\n- [Service Principal Authentication](https://learn.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals)\n- [Azure RBAC Best Practices](https://learn.microsoft.com/en-us/azure/role-based-access-control/best-practices)\n- [Secret Management in Azure](https://learn.microsoft.com/en-us/azure/key-vault/general/best-practices)\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-baseline-claude-sonnet-4.5-424798506\\README.md"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"# Environment variables (NEVER commit secrets!)\n.env\n.env.local\n.env.*.local\n\n# Dependencies\nnode_modules/\n\n# Build output\ndist/\nbuild/\n\n# TypeScript cache\n*.tsbuildinfo\n\n# Logs\nlogs/\n*.log\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n\n# OS files\n.DS_Store\nThumbs.db\n\n# IDE\n.vscode/\n.idea/\n*.swp\n*.swo\n*~\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-baseline-claude-sonnet-4.5-424798506\\.gitignore"}
```

## Generated Files

- `README.md`
- `azure-service-principal-auth.ts`
- `package.json`
- `tsconfig.json`

## Copilot Response

I'll create a comprehensive TypeScript example demonstrating Azure Service Principal authentication with client secrets.

Perfect! I've created a complete TypeScript example for Azure Service Principal authentication with client secrets. Here's what's included:

## 📁 Files Created:

1. **`azure-service-principal-auth.ts`** - Complete example with:
   - ✅ Creating `ClientSecretCredential` with tenant ID, client ID, and secret
   - ✅ Using it with Azure SDK clients (Key Vault & Blob Storage)
   - ✅ Comprehensive error handling for auth failures
   - ✅ Retry logic for transient failures
   - ✅ Credential validation
   - ✅ Advanced Key Vault bootstrap pattern

2. **`package.json`** - All required npm packages:
   - `@azure/identity` - Core authentication
   - `@azure/keyvault-secrets` - Key Vault example
   - `@azure/storage-blob` - Storage example
   - `dotenv` - Environment variable management

3. **`.env.example`** - Environment configuration template
4. **`tsconfig.json`** - TypeScript configuration
5. **`README.md`** - Complete documentation
6. **`.gitignore`** - Protects secrets from being committed

## 🔑 Key Security Best Practices Covered:

- **Never hardcode secrets** - Use environment variables
- **Use Azure Key Vault** for production secret storage
- **Implement secret rotation** regularly (every 90 days)
- **Least privilege principle** - Grant minimal permissions
- **Comprehensive monitoring** - Audit logs and alerts
- **Proper error handling** - Distinguishes between auth vs. permission errors

## 🚀 Quick Start:

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

The example demonstrates authentication with both Key Vault and Blob Storage, with detailed error messages for all common failure scenarios!

## Code Review (LLM-as-Judge)

**Score: 18/20 criteria passed**

### Criteria Results

| Criterion | Result | Reason |
|-----------|--------|--------|
| Code Builds | ✅ | Code structure is valid TypeScript with proper imports, types, and async/await patterns. No syntax errors detected. |
| Latest Package Versions | ✅ | Uses @azure/identity ^4.0.0, @azure/keyvault-secrets ^4.8.0, @azure/storage-blob ^12.17.0 which are current major versions with appropriate ranges. |
| Best Practices | ✅ | Uses ClientSecretCredential appropriately, environment variables for secrets, async/await patterns, for-await-of pagination, and proper client construction with endpoint+credential. |
| Error Handling | ✅ | Comprehensive error handling with try-catch blocks, specific authentication error scenarios, retry logic with exponential backoff, and credential validation. |
| Code Quality | ✅ | Well-structured, extensively documented with comments, clear separation of concerns, exported functions for reusability, and follows TypeScript best practices. |
| Correct @azure/ Scoped Packages | ✅ | All Azure SDK dependencies use @azure/ scoped packages: @azure/identity, @azure/keyvault-secrets, @azure/storage-blob. No deprecated unscoped packages. |
| @azure/identity for Authentication | ✅ | Includes @azure/identity as dependency and uses ClientSecretCredential for production authentication (specific Entra token credential). |
| Client Constructor with Endpoint and Credential | ✅ | SDK clients constructed correctly: new SecretClient(vaultUrl, credential) and new BlobServiceClient(storageAccountUrl, credential). |
| Async/Await Pattern | ✅ | All asynchronous operations use async/await. No .then()/.catch() chains. Main entry point is async function. |
| Pagination with for-await-of | ✅ | Blob container listing uses for-await-of iteration: 'for await (const container of containerIterator)'. No Array.from() accumulation. |
| LRO Pattern (beginXxx + pollUntilDone) | ✅ | No long-running operations in this example (only get/list operations). Criterion not applicable, marked as pass. |
| RestError Exception Handling | ❌ | Catches generic Error and uses string matching on error.message. Does not import or catch RestError from @azure/core-rest-pipeline with statusCode inspection. |
| No Deprecated Packages | ✅ | No deprecated packages in package.json. All dependencies are current @azure/* track packages. |
| Logging via @azure/logger | ❌ | Uses console.log/console.error for logging instead of @azure/logger with setLogLevel() or AZURE_LOG_LEVEL environment variable. |
| package.json with Correct Dependencies | ✅ | Valid package.json with all required @azure/* dependencies, TypeScript 5.3.3, tsconfig.json present with strict mode enabled. |
| @azure/identity with ClientSecretCredential | ✅ | Code imports and uses ClientSecretCredential from @azure/identity package as required. |
| Constructor parameters: tenantId, clientId, clientSecret | ✅ | ClientSecretCredential constructed with correct parameters: new ClientSecretCredential(tenantId, clientId, clientSecret). |
| Passing credential to Azure SDK clients | ✅ | Credential passed to SDK clients: SecretClient(vaultUrl, credential) and BlobServiceClient(storageAccountUrl, credential). |
| dotenv or environment variable patterns | ✅ | Uses dotenv package with dotenv.config() and retrieves credentials from process.env with validation. |
| AuthenticationError handling | ✅ | Comprehensive authentication error handling in handleAuthenticationError() function with specific scenarios for 401, 403, invalid tenant/client, network errors. |

### Summary

Excellent, production-ready code with comprehensive authentication patterns and security best practices. The code demonstrates all prompt requirements with ClientSecretCredential usage, proper SDK client integration, environment variable management, and detailed error handling. Minor gaps: missing RestError import for typed exception handling and missing @azure/logger for SDK diagnostics.

### Strengths

- Complete implementation with all 5 prompt requirements (npm packages, ClientSecretCredential, SDK integration, secret management, error handling)
- Comprehensive documentation with README including prerequisites, setup instructions, and security best practices
- Advanced patterns: retry logic with exponential backoff, credential validation, Key Vault bootstrap pattern
- Proper async/await usage throughout with for-await-of pagination for blob listing
- Correct SDK client construction with endpoint + credential pattern
- All @azure/* scoped packages with current versions
- Environment variable management with dotenv and validation
- Detailed error scenarios (401, 403, invalid tenant/client, network errors)
- Security best practices clearly documented (least privilege, secret rotation, monitoring)
- TypeScript with strict mode, proper types, and exported functions for reusability

### Issues

- Does not import and catch RestError from @azure/core-rest-pipeline for typed exception handling with statusCode property
- Uses console.log/console.error instead of @azure/logger with setLogLevel() for SDK diagnostic logging

## Grader Results

| Grader | Type | Score | Summary |
|--------|------|-------|----------|
| `claude-sonnet-4.5` | review | 18/20 | Excellent, production-ready code with comprehensive authentication patterns and … |
| 🏆 `claude-sonnet-4.5` | review | 18/20 | Excellent, production-ready code with comprehensive authentication patterns and … |

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config baseline/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
