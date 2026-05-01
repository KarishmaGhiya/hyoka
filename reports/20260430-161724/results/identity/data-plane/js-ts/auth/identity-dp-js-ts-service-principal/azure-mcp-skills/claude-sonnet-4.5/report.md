# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** azure-mcp-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 106.3s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | azure-mcp-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 106.3s |
| Timestamp | 2026-04-30T23:22:57Z |
| Files Generated | 0 |
| Event Count | 71 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 106.2s |
| **Total** | **106.3s** |

## Configuration

- **name:** azure-mcp-skills/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=83728 out=8230 |
| Turn Count | 2 |

## Error

```
0 files generated despite 6 file-write tool attempts
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

The user is asking for a comprehensive guide on authenticating to Azure using a Service Principal with client secret in TypeScript/Node.js. This is a straightforward request that doesn't require any codebase exploration or file manipulation - just providing information and examples.

I should provide:
1. Required npm packages
2. How to create ClientSecretCredential
3. Using it with Azure SDK clients
4. Best practices for secret management
5. Error handling

This is a knowledge-sharing task, so I'll provide a complete, well-documented TypeScript example with all the requested components.

I should report my intent as I'm providing information/guidance.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Providing Azure authentication guide"}
```

### 🔧 2. create

**Input:**

```json
{"file_text":"/**\n * Azure Service Principal Authentication with Client Secret\n * Complete TypeScript Example\n */\n\nimport { ClientSecretCredential } from \"@azure/identity\";\nimport { SecretClient } from \"@azure/keyvault-secrets\";\nimport { BlobServiceClient } from \"@azure/storage-blob\";\n\n// ============================================================================\n// 1. ENVIRONMENT CONFIGURATION\n// ============================================================================\n\ninterface AzureServicePrincipalConfig {\n  tenantId: string;\n  clientId: string;\n  clientSecret: string;\n}\n\n/**\n * Load configuration from environment variables\n * BEST PRACTICE: Never hardcode credentials in source code\n */\nfunction loadConfigFromEnvironment(): AzureServicePrincipalConfig {\n  const tenantId = process.env.AZURE_TENANT_ID;\n  const clientId = process.env.AZURE_CLIENT_ID;\n  const clientSecret = process.env.AZURE_CLIENT_SECRET;\n\n  if (!tenantId || !clientId || !clientSecret) {\n    throw new Error(\n      \"Missing required environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET\"\n    );\n  }\n\n  return { tenantId, clientId, clientSecret };\n}\n\n// ============================================================================\n// 2. CREATE CLIENT SECRET CREDENTIAL\n// ============================================================================\n\n/**\n * Creates a ClientSecretCredential for authenticating to Azure services\n * \n * @param config - Service Principal configuration\n * @returns ClientSecretCredential instance\n */\nfunction createCredential(config: AzureServicePrincipalConfig): ClientSecretCredential {\n  return new ClientSecretCredential(\n    config.tenantId,\n    config.clientId,\n    config.clientSecret,\n    {\n      // Optional: Configure retry policy\n      retryOptions: {\n        maxRetries: 3,\n        retryDelayInMs: 1000,\n      },\n      // Optional: Configure logging for debugging\n      loggingOptions: {\n        allowLoggingAccountIdentifiers: true,\n      },\n    }\n  );\n}\n\n// ============================================================================\n// 3. USING CREDENTIAL WITH AZURE SDK CLIENTS\n// ============================================================================\n\n/**\n * Example: Using credential with Azure Key Vault\n */\nasync function exampleKeyVault(credential: ClientSecretCredential): Promise\u003cvoid\u003e {\n  const keyVaultUrl = process.env.KEY_VAULT_URL || \"https://your-keyvault.vault.azure.net\";\n  \n  const secretClient = new SecretClient(keyVaultUrl, credential);\n  \n  try {\n    // Retrieve a secret\n    const secret = await secretClient.getSecret(\"my-secret-name\");\n    console.log(`Retrieved secret: ${secret.name}`);\n    // Use secret.value (but never log it!)\n  } catch (error) {\n    handleAuthenticationError(error, \"Key Vault\");\n  }\n}\n\n/**\n * Example: Using credential with Azure Blob Storage\n */\nasync function exampleBlobStorage(credential: ClientSecretCredential): Promise\u003cvoid\u003e {\n  const storageAccountName = process.env.STORAGE_ACCOUNT_NAME || \"yourstorageaccount\";\n  const blobServiceUrl = `https://${storageAccountName}.blob.core.windows.net`;\n  \n  const blobServiceClient = new BlobServiceClient(blobServiceUrl, credential);\n  \n  try {\n    // List containers\n    const containers = blobServiceClient.listContainers();\n    console.log(\"Storage containers:\");\n    for await (const container of containers) {\n      console.log(`- ${container.name}`);\n    }\n  } catch (error) {\n    handleAuthenticationError(error, \"Blob Storage\");\n  }\n}\n\n/**\n * Example: Using credential with any Azure Resource Management client\n */\nasync function exampleGenericAzureService(credential: ClientSecretCredential): Promise\u003cvoid\u003e {\n  // The credential can be used with any Azure SDK client that accepts TokenCredential\n  // Examples:\n  // - @azure/arm-resources (Resource Management)\n  // - @azure/arm-compute (Virtual Machines)\n  // - @azure/cosmos (Cosmos DB)\n  // - @azure/communication-email (Communication Services)\n  // - etc.\n  \n  // Example pattern:\n  // const client = new SomeAzureClient(credential, subscriptionId);\n  // const result = await client.someOperation();\n}\n\n// ============================================================================\n// 4. ERROR HANDLING\n// ============================================================================\n\n/**\n * Handle authentication errors with detailed diagnostics\n */\nfunction handleAuthenticationError(error: any, serviceName: string): void {\n  console.error(`Authentication error when accessing ${serviceName}:`);\n  \n  if (error.statusCode === 401) {\n    console.error(\"❌ Unauthorized (401): Invalid credentials or expired token\");\n    console.error(\"   Check that your Service Principal credentials are correct\");\n  } else if (error.statusCode === 403) {\n    console.error(\"❌ Forbidden (403): Insufficient permissions\");\n    console.error(\"   Ensure your Service Principal has the required RBAC roles\");\n  } else if (error.code === \"ENOTFOUND\" || error.code === \"ETIMEDOUT\") {\n    console.error(\"❌ Network error: Cannot reach Azure services\");\n    console.error(\"   Check your network connection and firewall settings\");\n  } else if (error.name === \"CredentialUnavailableError\") {\n    console.error(\"❌ Credential unavailable\");\n    console.error(\"   Verify environment variables are set correctly\");\n  } else if (error.name === \"AuthenticationError\") {\n    console.error(\"❌ Authentication failed\");\n    console.error(`   Details: ${error.message}`);\n  } else {\n    console.error(\"❌ Unexpected error:\", error.message);\n  }\n  \n  // Log error details for debugging (but never log secrets!)\n  if (process.env.NODE_ENV === \"development\") {\n    console.error(\"Error details:\", {\n      name: error.name,\n      code: error.code,\n      statusCode: error.statusCode,\n      // Omit full error object to avoid leaking sensitive data\n    });\n  }\n  \n  throw error; // Re-throw to let caller handle it\n}\n\n/**\n * Validate credential before using it\n */\nasync function validateCredential(credential: ClientSecretCredential): Promise\u003cboolean\u003e {\n  try {\n    // Try to get a token for Azure Resource Manager\n    const token = await credential.getToken(\"https://management.azure.com/.default\");\n    \n    if (!token || !token.token) {\n      console.error(\"❌ Failed to obtain access token\");\n      return false;\n    }\n    \n    console.log(\"✅ Credential is valid\");\n    console.log(`   Token expires at: ${new Date(token.expiresOnTimestamp).toISOString()}`);\n    return true;\n  } catch (error) {\n    console.error(\"❌ Credential validation failed\");\n    handleAuthenticationError(error, \"Token Validation\");\n    return false;\n  }\n}\n\n// ============================================================================\n// 5. BEST PRACTICES FOR SECRET MANAGEMENT\n// ============================================================================\n\n/**\n * BEST PRACTICES:\n * \n * 1. NEVER hardcode secrets in source code\n *    ❌ const clientSecret = \"abc123...\";\n *    ✅ const clientSecret = process.env.AZURE_CLIENT_SECRET;\n * \n * 2. Use environment variables for local development\n *    - Store in .env file (add to .gitignore!)\n *    - Use dotenv package: require('dotenv').config()\n * \n * 3. Use secure secret management in production:\n *    - Azure Key Vault for secrets storage\n *    - Managed Identity when possible (eliminates secrets entirely)\n *    - Azure App Configuration for non-sensitive config\n * \n * 4. Rotate secrets regularly:\n *    - Set up automatic rotation policies\n *    - Monitor expiration dates\n *    - Use multiple client secrets for zero-downtime rotation\n * \n * 5. Principle of least privilege:\n *    - Grant only necessary RBAC roles to Service Principal\n *    - Use separate Service Principals for different environments\n *    - Regularly audit permissions\n * \n * 6. Never log secrets:\n *    - Sanitize logs to exclude credential information\n *    - Be careful with error messages and stack traces\n * \n * 7. Use Managed Identity when possible:\n *    - Available in Azure App Service, Functions, VMs, AKS, etc.\n *    - No secrets to manage\n *    - Use DefaultAzureCredential for automatic fallback\n */\n\n/**\n * Example: Using Azure Key Vault to store and retrieve secrets\n * This is a more secure approach than environment variables in production\n */\nasync function loadSecretsFromKeyVault(): Promise\u003cAzureServicePrincipalConfig\u003e {\n  // Bootstrap credentials from environment (minimal set)\n  const bootstrapConfig = loadConfigFromEnvironment();\n  const credential = createCredential(bootstrapConfig);\n  \n  const keyVaultUrl = process.env.KEY_VAULT_URL || \"https://your-keyvault.vault.azure.net\";\n  const secretClient = new SecretClient(keyVaultUrl, credential);\n  \n  try {\n    // Retrieve secrets from Key Vault\n    const tenantIdSecret = await secretClient.getSecret(\"azure-tenant-id\");\n    const clientIdSecret = await secretClient.getSecret(\"azure-client-id\");\n    const clientSecretSecret = await secretClient.getSecret(\"azure-client-secret\");\n    \n    return {\n      tenantId: tenantIdSecret.value!,\n      clientId: clientIdSecret.value!,\n      clientSecret: clientSecretSecret.value!,\n    };\n  } catch (error) {\n    console.error(\"Failed to load secrets from Key Vault\");\n    throw error;\n  }\n}\n\n// ============================================================================\n// MAIN EXAMPLE\n// ============================================================================\n\nasync function main(): Promise\u003cvoid\u003e {\n  console.log(\"🔐 Azure Service Principal Authentication Example\\n\");\n  \n  try {\n    // Load configuration from environment\n    console.log(\"📋 Loading configuration...\");\n    const config = loadConfigFromEnvironment();\n    console.log(`   Tenant ID: ${config.tenantId}`);\n    console.log(`   Client ID: ${config.clientId}`);\n    console.log(`   Client Secret: ${\"*\".repeat(8)}\\n`);\n    \n    // Create credential\n    console.log(\"🔑 Creating ClientSecretCredential...\");\n    const credential = createCredential(config);\n    console.log(\"   ✅ Credential created\\n\");\n    \n    // Validate credential\n    console.log(\"✔️  Validating credential...\");\n    const isValid = await validateCredential(credential);\n    if (!isValid) {\n      throw new Error(\"Credential validation failed\");\n    }\n    console.log();\n    \n    // Use credential with Azure services\n    console.log(\"☁️  Using credential with Azure services...\\n\");\n    \n    console.log(\"1️⃣  Key Vault example:\");\n    await exampleKeyVault(credential);\n    console.log();\n    \n    console.log(\"2️⃣  Blob Storage example:\");\n    await exampleBlobStorage(credential);\n    console.log();\n    \n    console.log(\"✅ All operations completed successfully!\");\n    \n  } catch (error: any) {\n    console.error(\"\\n❌ Application failed:\", error.message);\n    process.exit(1);\n  }\n}\n\n// ============================================================================\n// ALTERNATIVE: Using DefaultAzureCredential (Recommended for Production)\n// ============================================================================\n\n/**\n * For production applications, consider using DefaultAzureCredential\n * which automatically tries multiple authentication methods in order:\n * 1. Environment variables (Service Principal)\n * 2. Managed Identity\n * 3. Azure CLI\n * 4. Azure PowerShell\n * etc.\n * \n * This provides flexibility without code changes across environments.\n */\nimport { DefaultAzureCredential } from \"@azure/identity\";\n\nfunction createFlexibleCredential(): DefaultAzureCredential {\n  return new DefaultAzureCredential({\n    // Will use Service Principal from environment variables if available\n    // Falls back to Managed Identity in Azure environments\n    // Falls back to Azure CLI during local development\n  });\n}\n\n// Run main function if this file is executed directly\nif (require.main === module) {\n  main().catch(console.error);\n}\n\nexport {\n  createCredential,\n  validateCredential,\n  loadConfigFromEnvironment,\n  handleAuthenticationError,\n  createFlexibleCredential,\n};\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-azure-mcp-skills-claude-sonnet-4.5-2814298322\\azure-service-principal-auth.ts"}
```

### 🔧 3. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-service-principal-auth-example\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Complete example of Azure Service Principal authentication with client secret\",\n  \"main\": \"azure-service-principal-auth.ts\",\n  \"scripts\": {\n    \"start\": \"ts-node azure-service-principal-auth.ts\",\n    \"build\": \"tsc\",\n    \"dev\": \"ts-node-dev azure-service-principal-auth.ts\"\n  },\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.0.0\",\n    \"@azure/keyvault-secrets\": \"^4.8.0\",\n    \"@azure/storage-blob\": \"^12.17.0\",\n    \"dotenv\": \"^16.4.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.11.0\",\n    \"ts-node\": \"^10.9.2\",\n    \"ts-node-dev\": \"^2.0.0\",\n    \"typescript\": \"^5.3.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-azure-mcp-skills-claude-sonnet-4.5-2814298322\\package.json"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"# Azure Service Principal Configuration\n# Copy this file to .env and fill in your actual values\n# NEVER commit .env to version control!\n\n# Required: Service Principal credentials\nAZURE_TENANT_ID=your-tenant-id-here\nAZURE_CLIENT_ID=your-client-id-here\nAZURE_CLIENT_SECRET=your-client-secret-here\n\n# Optional: Service-specific configuration\nKEY_VAULT_URL=https://your-keyvault.vault.azure.net\nSTORAGE_ACCOUNT_NAME=yourstorageaccount\n\n# Optional: Environment\nNODE_ENV=development\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-azure-mcp-skills-claude-sonnet-4.5-2814298322\\.env.example"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"# Dependencies\nnode_modules/\n\n# Environment variables (NEVER commit secrets!)\n.env\n.env.local\n.env.*.local\n\n# Build output\ndist/\nbuild/\n*.js\n*.js.map\n\n# IDE\n.vscode/\n.idea/\n*.swp\n*.swo\n\n# OS\n.DS_Store\nThumbs.db\n\n# Logs\n*.log\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-azure-mcp-skills-claude-sonnet-4.5-2814298322\\.gitignore"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true,\n    \"moduleResolution\": \"node\",\n    \"allowSyntheticDefaultImports\": true\n  },\n  \"include\": [\"*.ts\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-azure-mcp-skills-claude-sonnet-4.5-2814298322\\tsconfig.json"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"# Azure Service Principal Authentication with Client Secret\n\nComplete TypeScript example demonstrating how to authenticate to Azure using a Service Principal with client secret.\n\n## 📦 Required NPM Packages\n\n```bash\nnpm install @azure/identity @azure/keyvault-secrets @azure/storage-blob dotenv\nnpm install --save-dev typescript @types/node ts-node\n```\n\n### Package Overview\n\n- **@azure/identity** - Core authentication library for Azure SDK\n- **@azure/keyvault-secrets** - Example Azure service client (Key Vault)\n- **@azure/storage-blob** - Example Azure service client (Blob Storage)\n- **dotenv** - Load environment variables from .env file\n\n## 🔑 Prerequisites\n\n### 1. Create a Service Principal\n\nUsing Azure CLI:\n```bash\naz ad sp create-for-rbac --name \"my-app-sp\" --role Contributor --scopes /subscriptions/{subscription-id}\n```\n\nThis returns:\n```json\n{\n  \"appId\": \"your-client-id\",\n  \"displayName\": \"my-app-sp\",\n  \"password\": \"your-client-secret\",\n  \"tenant\": \"your-tenant-id\"\n}\n```\n\n### 2. Assign Permissions\n\nGrant the Service Principal access to resources:\n```bash\n# Key Vault access\naz keyvault set-policy --name your-keyvault \\\n  --spn your-client-id \\\n  --secret-permissions get list\n\n# Storage account access\naz role assignment create \\\n  --assignee your-client-id \\\n  --role \"Storage Blob Data Contributor\" \\\n  --scope /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{storage-account}\n```\n\n## 🚀 Setup\n\n1. **Install dependencies:**\n   ```bash\n   npm install\n   ```\n\n2. **Configure environment variables:**\n   ```bash\n   cp .env.example .env\n   # Edit .env with your actual values\n   ```\n\n3. **Run the example:**\n   ```bash\n   npm start\n   ```\n\n## 💡 Usage Examples\n\n### Basic Authentication\n\n```typescript\nimport { ClientSecretCredential } from \"@azure/identity\";\n\nconst credential = new ClientSecretCredential(\n  process.env.AZURE_TENANT_ID!,\n  process.env.AZURE_CLIENT_ID!,\n  process.env.AZURE_CLIENT_SECRET!\n);\n```\n\n### Using with Azure Key Vault\n\n```typescript\nimport { SecretClient } from \"@azure/keyvault-secrets\";\n\nconst client = new SecretClient(\n  \"https://your-keyvault.vault.azure.net\",\n  credential\n);\n\nconst secret = await client.getSecret(\"my-secret\");\nconsole.log(secret.value);\n```\n\n### Using with Azure Blob Storage\n\n```typescript\nimport { BlobServiceClient } from \"@azure/storage-blob\";\n\nconst blobServiceClient = new BlobServiceClient(\n  \"https://youraccount.blob.core.windows.net\",\n  credential\n);\n\nconst containers = blobServiceClient.listContainers();\nfor await (const container of containers) {\n  console.log(container.name);\n}\n```\n\n## 🛡️ Best Practices for Secret Management\n\n### 1. Never Hardcode Secrets\n❌ **Bad:**\n```typescript\nconst credential = new ClientSecretCredential(\n  \"tenant-id\",\n  \"client-id\",\n  \"my-secret-password\"\n);\n```\n\n✅ **Good:**\n```typescript\nconst credential = new ClientSecretCredential(\n  process.env.AZURE_TENANT_ID!,\n  process.env.AZURE_CLIENT_ID!,\n  process.env.AZURE_CLIENT_SECRET!\n);\n```\n\n### 2. Use .env for Local Development\n\nCreate a `.env` file (never commit this!):\n```env\nAZURE_TENANT_ID=your-tenant-id\nAZURE_CLIENT_ID=your-client-id\nAZURE_CLIENT_SECRET=your-client-secret\n```\n\nLoad it in your app:\n```typescript\nimport 'dotenv/config';\n```\n\n### 3. Production Secret Management\n\n- **Azure Key Vault**: Store secrets in Key Vault, retrieve at runtime\n- **Managed Identity**: Use when possible (no secrets to manage!)\n- **Azure App Configuration**: For application settings\n- **Environment Variables**: Set in Azure App Service/Functions configuration\n\n### 4. Use DefaultAzureCredential for Flexibility\n\n```typescript\nimport { DefaultAzureCredential } from \"@azure/identity\";\n\n// Automatically uses:\n// 1. Environment variables (local dev with Service Principal)\n// 2. Managed Identity (Azure App Service, Functions, VMs)\n// 3. Azure CLI (local development)\nconst credential = new DefaultAzureCredential();\n```\n\n### 5. Rotate Secrets Regularly\n\n- Create new client secret in Azure Portal\n- Update environment variables\n- Delete old secret after verification\n- Automate with Azure Key Vault rotation policies\n\n### 6. Principle of Least Privilege\n\n- Grant only necessary RBAC roles\n- Use separate Service Principals per environment\n- Regularly audit permissions\n\n## 🚨 Error Handling\n\n### Common Authentication Errors\n\n**401 Unauthorized:**\n- Invalid credentials\n- Expired client secret\n- Wrong tenant ID\n\n**403 Forbidden:**\n- Service Principal lacks required permissions\n- Need to assign RBAC roles\n\n**Credential Unavailable:**\n- Missing environment variables\n- Network connectivity issues\n\n### Robust Error Handling\n\n```typescript\ntry {\n  const token = await credential.getToken(\"https://management.azure.com/.default\");\n} catch (error) {\n  if (error.statusCode === 401) {\n    console.error(\"Invalid credentials\");\n  } else if (error.statusCode === 403) {\n    console.error(\"Insufficient permissions\");\n  } else {\n    console.error(\"Authentication failed:\", error.message);\n  }\n}\n```\n\n## 🔍 Debugging Tips\n\n1. **Enable logging:**\n   ```typescript\n   const credential = new ClientSecretCredential(\n     tenantId,\n     clientId,\n     clientSecret,\n     {\n       loggingOptions: {\n         allowLoggingAccountIdentifiers: true\n       }\n     }\n   );\n   ```\n\n2. **Validate credential:**\n   ```typescript\n   const token = await credential.getToken(\"https://management.azure.com/.default\");\n   console.log(\"Token expires:\", new Date(token.expiresOnTimestamp));\n   ```\n\n3. **Check environment variables:**\n   ```bash\n   echo $AZURE_TENANT_ID\n   echo $AZURE_CLIENT_ID\n   ```\n\n## 📚 Additional Resources\n\n- [Azure Identity SDK Documentation](https://docs.microsoft.com/en-us/javascript/api/@azure/identity)\n- [Service Principal Best Practices](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal)\n- [Managed Identity Overview](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview)\n\n## 🔒 Security Checklist\n\n- [ ] Never commit secrets to version control\n- [ ] Add .env to .gitignore\n- [ ] Use environment variables for all credentials\n- [ ] Rotate secrets regularly\n- [ ] Use Managed Identity in production when possible\n- [ ] Apply principle of least privilege\n- [ ] Monitor and audit Service Principal usage\n- [ ] Enable Azure AD logging\n- [ ] Set up alerts for authentication failures\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-service-principal-azure-mcp-skills-claude-sonnet-4.5-2814298322\\README.md"}
```

## Copilot Response

I'll provide you with a complete guide for authenticating to Azure using a Service Principal with client secret in TypeScript.

I encountered permission issues creating files in the temporary directory, but I can provide you with the complete guide directly. Here's everything you need for Azure Service Principal authentication with client secret in TypeScript:

## 📦 **1. Required NPM Packages**

```bash
npm install @azure/identity @azure/keyvault-secrets @azure/storage-blob dotenv
npm install --save-dev typescript @types/node ts-node
```

## 🔑 **2. Creating ClientSecretCredential**

```typescript
import { ClientSecretCredential } from "@azure/identity";

const credential = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID!,      // Your Azure AD tenant ID
  process.env.AZURE_CLIENT_ID!,       // Service Principal application/client ID
  process.env.AZURE_CLIENT_SECRET!,   // Service Principal client secret
  {
    // Optional: Configure retry policy
    retryOptions: {
      maxRetries: 3,
      retryDelayInMs: 1000,
    },
    // Optional: Enable logging for debugging
    loggingOptions: {
      allowLoggingAccountIdentifiers: true,
    },
  }
);
```

## ☁️ **3. Using with Azure SDK Clients**

### Key Vault Example:
```typescript
import { SecretClient } from "@azure/keyvault-secrets";

const client = new SecretClient(
  "https://your-keyvault.vault.azure.net",
  credential
);

const secret = await client.getSecret("my-secret-name");
console.log(secret.value);
```

### Blob Storage Example:
```typescript
import { BlobServiceClient } from "@azure/storage-blob";

const blobServiceClient = new BlobServiceClient(
  "https://youraccount.blob.core.windows.net",
  credential
);

const containers = blobServiceClient.listContainers();
for await (const container of containers) {
  console.log(container.name);
}
```

## 🛡️ **4. Best Practices for Secret Management**

### ❌ **Never Hardcode:**
```typescript
// BAD - Never do this!
const credential = new ClientSecretCredential("tenant", "client", "secret123");
```

### ✅ **Use Environment Variables:**
```typescript
// GOOD - Load from environment
const credential = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID!,
  process.env.AZURE_CLIENT_ID!,
  process.env.AZURE_CLIENT_SECRET!
);
```

### **Local Development (.env file):**
```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

```typescript
import 'dotenv/config';  // Load environment variables
```

### **Production Recommendations:**
- **Azure Key Vault**: Store secrets in Key Vault, retrieve at runtime
- **Managed Identity**: Best option - no secrets needed!
- **DefaultAzureCredential**: Auto-detects authentication method

```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Works with Service Principal, Managed Identity, or Azure CLI
const credential = new DefaultAzureCredential();
```

## 🚨 **5. Error Handling**

```typescript
async function authenticateWithErrorHandling() {
  try {
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      process.env.AZURE_CLIENT_SECRET!
    );
    
    // Validate credential
    const token = await credential.getToken("https://management.azure.com/.default");
    
    if (!token) {
      throw new Error("Failed to obtain access token");
    }
    
    console.log("✅ Authentication successful");
    console.log(`Token expires: ${new Date(token.expiresOnTimestamp).toISOString()}`);
    
    return credential;
    
  } catch (error: any) {
    // Handle specific error types
    if (error.statusCode === 401) {
      console.error("❌ Unauthorized: Invalid credentials or expired secret");
    } else if (error.statusCode === 403) {
      console.error("❌ Forbidden: Insufficient permissions (check RBAC roles)");
    } else if (error.name === "CredentialUnavailableError") {
      console.error("❌ Credentials unavailable: Check environment variables");
    } else if (error.code === "ENOTFOUND" || error.code === "ETIMEDOUT") {
      console.error("❌ Network error: Cannot reach Azure services");
    } else {
      console.error(`❌ Authentication failed: ${error.message}`);
    }
    
    throw error;
  }
}
```

## 📋 **Complete Working Example**

```typescript
import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import 'dotenv/config';

async function main() {
  try {
    // Load credentials from environment
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    
    if (!tenantId || !clientId || !clientSecret) {
      throw new Error("Missing required environment variables");
    }
    
    // Create credential
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );
    
    // Validate credential
    const token = await credential.getToken("https://management.azure.com/.default");
    console.log("✅ Authentication successful");
    
    // Use with Azure service
    const keyVaultUrl = "https://your-keyvault.vault.azure.net";
    const secretClient = new SecretClient(keyVaultUrl, credential);
    
    const secret = await secretClient.getSecret("my-secret");
    console.log(`Retrieved secret: ${secret.name}`);
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
```

## 🔒 **Security Checklist**
- ✅ Never commit secrets to version control
- ✅ Add `.env` to `.gitignore`
- ✅ Use Managed Identity in Azure (when possible)
- ✅ Rotate secrets regularly
- ✅ Apply least privilege (minimal RBAC roles)
- ✅ Monitor authentication failures
- ✅ Use Key Vault for production secrets

This gives you a production-ready approach to Azure authentication with Service Principal!

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config azure-mcp-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
