# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** azure-mcp-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 177.5s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | azure-mcp-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Score | 18/10 |
| Duration | 177.5s |
| Timestamp | 2026-05-02T01:24:36Z |
| Files Generated | 4 |
| Event Count | 102 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 129.4s |
| Review | 47.9s |
| **Total** | **177.5s** |

## Configuration

- **name:** azure-mcp-skills/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skill Directories | C:\code\hyoka\skills\generator\js-ts-azure-patterns, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-identity-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-storage-blob-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-keyvault-secrets-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-keyvault-keys-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-cosmos-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-servicebus-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-eventhub-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-appconfiguration-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-storage-queue-ts |
| Skills Loaded | azure-identity-ts, azure-storage-blob-ts, azure-keyvault-secrets-ts, azure-keyvault-keys-ts, azure-cosmos-ts, azure-servicebus-ts, azure-eventhub-ts, azure-appconfiguration-ts, azure-storage-queue-ts, customize-cloud-agent |
| Skills Invoked | azure-identity-ts |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=214956 out=8801 |
| Turn Count | 5 |

## Prompt Sent

```
Write a TypeScript program that
uses Managed Identity to authenticate Azure SDK clients. The program should:
1. Create a ManagedIdentityCredential for system-assigned identity
2. Create a ManagedIdentityCredential for user-assigned identity (with client ID)
3. Use ChainedTokenCredential to fall back to Azure CLI credential for local development
4. Pass the credential to an Azure SDK client and perform an operation
5. Handle CredentialUnavailableError when not running in Azure

Include a package.json with all dependencies and use async/await throughout.
```

## Copilot Reasoning

The user wants a TypeScript program demonstrating Managed Identity authentication with Azure SDK. This is directly related to Azure identity management, and I should invoke the azure-identity-ts skill to get proper patterns, examples, and acceptance criteria before writing code.

Let me:
1. First invoke the azure-identity-ts skill to get guidance
2. Then create the TypeScript program and package.json following the skill's guidance

The user wants:
- System-assigned managed identity
- User-assigned managed identity (with client ID)
- ChainedTokenCredential with fallback to Azure CLI
- Use credential with an Azure SDK client
- Handle CredentialUnavailableError
- Include package.json with dependencies
- Use async/await throughout

Great! Now I have the skill context for Azure Identity. The user wants me to:
1. Create a ManagedIdentityCredential for system-assigned identity
2. Create a ManagedIdentityCredential for user-assigned identity (with client ID)
3. Use ChainedTokenCredential to fall back to Azure CLI credential for local development
4. Pass the credential to an Azure SDK client and perform an operation
5. Handle CredentialUnavailableError when not running in Azure

I'll create a comprehensive example with package.json. Let me create the files showing all these patterns.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Azure identity example"}
```

### 🔧 2. skill

**Input:**

```json
{"skill":"azure-identity-ts"}
```

### 🔧 3. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-managed-identity-demo\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Demonstration of Azure Managed Identity authentication patterns\",\n  \"main\": \"dist/index.js\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/index.js\",\n    \"dev\": \"ts-node --esm src/index.ts\"\n  },\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.0.0\",\n    \"@azure/storage-blob\": \"^12.17.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.0.0\",\n    \"typescript\": \"^5.3.0\",\n    \"ts-node\": \"^10.9.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-375732331\\package.json"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2022\",\n    \"module\": \"ES2022\",\n    \"lib\": [\"ES2022\"],\n    \"moduleResolution\": \"node\",\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./src\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true\n  },\n  \"include\": [\"src/**/*\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-375732331\\tsconfig.json"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"import {\n  ManagedIdentityCredential,\n  ChainedTokenCredential,\n  AzureCliCredential,\n  CredentialUnavailableError,\n} from \"@azure/identity\";\nimport { BlobServiceClient } from \"@azure/storage-blob\";\n\n/**\n * Example 1: System-Assigned Managed Identity\n * This is the simplest form - uses the identity attached to the Azure resource\n */\nasync function useSystemAssignedIdentity(): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Example 1: System-Assigned Managed Identity ===\");\n\n  try {\n    // Create credential for system-assigned identity\n    const credential = new ManagedIdentityCredential();\n    console.log(\"✓ Created ManagedIdentityCredential (system-assigned)\");\n\n    // Test the credential by getting a token\n    const token = await credential.getToken(\n      \"https://storage.azure.com/.default\"\n    );\n\n    if (token) {\n      console.log(\"✓ Successfully acquired token\");\n      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);\n    }\n  } catch (error) {\n    handleAuthError(error, \"System-Assigned Identity\");\n  }\n}\n\n/**\n * Example 2: User-Assigned Managed Identity (by Client ID)\n * Used when multiple identities are assigned to a resource\n */\nasync function useUserAssignedIdentity(clientId: string): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Example 2: User-Assigned Managed Identity ===\");\n\n  try {\n    // Create credential for user-assigned identity using client ID\n    const credential = new ManagedIdentityCredential({\n      clientId: clientId,\n    });\n    console.log(\n      `✓ Created ManagedIdentityCredential (user-assigned: ${clientId})`\n    );\n\n    // Test the credential by getting a token\n    const token = await credential.getToken(\n      \"https://storage.azure.com/.default\"\n    );\n\n    if (token) {\n      console.log(\"✓ Successfully acquired token\");\n      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);\n    }\n  } catch (error) {\n    handleAuthError(error, \"User-Assigned Identity\");\n  }\n}\n\n/**\n * Example 3: ChainedTokenCredential for Development/Production Flexibility\n * Tries managed identity first (production), falls back to Azure CLI (local dev)\n */\nasync function useChainedCredential(): Promise\u003cvoid\u003e {\n  console.log(\n    \"\\n=== Example 3: ChainedTokenCredential (Managed Identity → Azure CLI) ===\"\n  );\n\n  try {\n    // Create a credential chain that tries multiple authentication methods\n    const credential = new ChainedTokenCredential(\n      new ManagedIdentityCredential(), // Try managed identity first (works in Azure)\n      new AzureCliCredential() // Fall back to Azure CLI (works locally)\n    );\n    console.log(\"✓ Created ChainedTokenCredential\");\n    console.log(\n      \"  Chain: ManagedIdentity → AzureCli\"\n    );\n\n    // Test the credential\n    const token = await credential.getToken(\n      \"https://storage.azure.com/.default\"\n    );\n\n    if (token) {\n      console.log(\"✓ Successfully acquired token from credential chain\");\n      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);\n    }\n  } catch (error) {\n    handleAuthError(error, \"ChainedTokenCredential\");\n  }\n}\n\n/**\n * Example 4: Using Credential with Azure SDK Client\n * Demonstrates how to pass credential to an actual Azure service\n */\nasync function useWithAzureClient(storageAccountName: string): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Example 4: Using Credential with Azure Storage Client ===\");\n\n  try {\n    // Create credential chain for flexibility\n    const credential = new ChainedTokenCredential(\n      new ManagedIdentityCredential(),\n      new AzureCliCredential()\n    );\n\n    // Create Azure Storage Blob client with the credential\n    const blobServiceClient = new BlobServiceClient(\n      `https://${storageAccountName}.blob.core.windows.net`,\n      credential\n    );\n    console.log(\n      `✓ Created BlobServiceClient for '${storageAccountName}'`\n    );\n\n    // Perform an actual operation - list containers\n    console.log(\"  Listing containers...\");\n    const containers = blobServiceClient.listContainers();\n\n    let containerCount = 0;\n    for await (const container of containers) {\n      containerCount++;\n      console.log(`  - ${container.name}`);\n      if (containerCount \u003e= 5) {\n        console.log(\"  ... (showing first 5 containers)\");\n        break;\n      }\n    }\n\n    if (containerCount === 0) {\n      console.log(\"  (No containers found)\");\n    }\n\n    console.log(`✓ Successfully listed ${containerCount} container(s)`);\n  } catch (error) {\n    handleAuthError(error, \"Azure Storage Client\");\n  }\n}\n\n/**\n * Example 5: User-Assigned Identity with Multiple Identities\n * Shows how to work with multiple user-assigned identities\n */\nasync function useMultipleUserAssignedIdentities(\n  clientIds: string[]\n): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Example 5: Multiple User-Assigned Identities ===\");\n\n  for (let i = 0; i \u003c clientIds.length; i++) {\n    const clientId = clientIds[i];\n    console.log(`\\nTrying identity ${i + 1}/${clientIds.length}: ${clientId}`);\n\n    try {\n      const credential = new ManagedIdentityCredential({\n        clientId: clientId,\n      });\n\n      const token = await credential.getToken(\n        \"https://management.azure.com/.default\"\n      );\n\n      if (token) {\n        console.log(\"✓ Successfully authenticated\");\n        console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);\n      }\n    } catch (error) {\n      console.log(`✗ Failed to authenticate with this identity`);\n      if (error instanceof Error) {\n        console.log(`  Error: ${error.message}`);\n      }\n    }\n  }\n}\n\n/**\n * Centralized error handling for authentication errors\n */\nfunction handleAuthError(error: unknown, context: string): void {\n  if (error instanceof CredentialUnavailableError) {\n    console.log(`✗ ${context}: Credential Unavailable`);\n    console.log(\n      `  This typically means you're not running in Azure or Azure CLI is not logged in.`\n    );\n    console.log(`  Error: ${error.message}`);\n    console.log(\n      `\\n  To fix:\\n  - In Azure: Ensure managed identity is enabled on your resource`\n    );\n    console.log(`  - Locally: Run 'az login' to authenticate with Azure CLI`);\n  } else if (error instanceof Error) {\n    console.log(`✗ ${context}: Authentication Error`);\n    console.log(`  Error: ${error.message}`);\n  } else {\n    console.log(`✗ ${context}: Unknown Error`);\n    console.log(`  Error:`, error);\n  }\n}\n\n/**\n * Main function demonstrating all authentication patterns\n */\nasync function main(): Promise\u003cvoid\u003e {\n  console.log(\"╔═══════════════════════════════════════════════════════════╗\");\n  console.log(\"║  Azure Managed Identity Authentication Examples          ║\");\n  console.log(\"╚═══════════════════════════════════════════════════════════╝\");\n\n  // Configuration - replace with your values\n  const config = {\n    userAssignedClientId:\n      process.env.USER_ASSIGNED_CLIENT_ID || \"00000000-0000-0000-0000-000000000000\",\n    storageAccountName: process.env.STORAGE_ACCOUNT_NAME || \"mystorageaccount\",\n    additionalClientIds: process.env.ADDITIONAL_CLIENT_IDS?.split(\",\") || [],\n  };\n\n  console.log(\"\\nConfiguration:\");\n  console.log(`  User-Assigned Client ID: ${config.userAssignedClientId}`);\n  console.log(`  Storage Account: ${config.storageAccountName}`);\n  console.log(`  Running in Azure: ${isRunningInAzure() ? \"Yes\" : \"No (local)\"}`);\n\n  // Example 1: System-assigned managed identity\n  await useSystemAssignedIdentity();\n\n  // Example 2: User-assigned managed identity\n  await useUserAssignedIdentity(config.userAssignedClientId);\n\n  // Example 3: Chained credential (managed identity + Azure CLI fallback)\n  await useChainedCredential();\n\n  // Example 4: Using credential with Azure Storage client\n  await useWithAzureClient(config.storageAccountName);\n\n  // Example 5: Multiple user-assigned identities (if configured)\n  if (config.additionalClientIds.length \u003e 0) {\n    await useMultipleUserAssignedIdentities(config.additionalClientIds);\n  }\n\n  console.log(\"\\n╔═══════════════════════════════════════════════════════════╗\");\n  console.log(\"║  Examples Complete                                         ║\");\n  console.log(\"╚═══════════════════════════════════════════════════════════╝\\n\");\n}\n\n/**\n * Helper function to detect if running in Azure\n */\nfunction isRunningInAzure(): boolean {\n  // Azure services set environment variables like these\n  return !!(\n    process.env.IDENTITY_ENDPOINT ||\n    process.env.MSI_ENDPOINT ||\n    process.env.IMDS_ENDPOINT ||\n    process.env.AZURE_CLIENT_ID\n  );\n}\n\n// Run the main function\nmain().catch((error) =\u003e {\n  console.error(\"Fatal error:\", error);\n  process.exit(1);\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-375732331\\src\\index.ts"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"# Azure Managed Identity Authentication Demo\n\nA comprehensive TypeScript demonstration of Azure Managed Identity authentication patterns, including system-assigned, user-assigned, and chained credentials.\n\n## Features\n\nThis demo showcases:\n\n1. **System-Assigned Managed Identity** - Simplest authentication method for Azure resources\n2. **User-Assigned Managed Identity** - Authentication with specific client ID\n3. **ChainedTokenCredential** - Automatic fallback from Managed Identity to Azure CLI for local development\n4. **Azure SDK Integration** - Using credentials with Azure Storage Blob client\n5. **Error Handling** - Proper handling of `CredentialUnavailableError`\n\n## Prerequisites\n\n- Node.js 18+ and npm\n- Azure subscription\n- Azure CLI installed (for local development)\n\n## Installation\n\n```bash\nnpm install\n```\n\n## Configuration\n\nSet environment variables for your Azure resources:\n\n```bash\n# Optional: User-assigned managed identity client ID\nexport USER_ASSIGNED_CLIENT_ID=\"your-client-id\"\n\n# Optional: Storage account name for testing\nexport STORAGE_ACCOUNT_NAME=\"yourstorageaccount\"\n\n# Optional: Additional client IDs (comma-separated)\nexport ADDITIONAL_CLIENT_IDS=\"client-id-1,client-id-2\"\n```\n\n## Running the Demo\n\n### Local Development\n\nFirst, authenticate with Azure CLI:\n\n```bash\naz login\n```\n\nThen run the demo:\n\n```bash\n# Using ts-node\nnpm run dev\n\n# Or build and run\nnpm run build\nnpm start\n```\n\n### In Azure\n\nDeploy this code to any Azure service with managed identity enabled:\n- Azure App Service\n- Azure Functions\n- Azure Container Apps\n- Azure Virtual Machines\n- Azure Kubernetes Service\n\nThe code will automatically detect and use the managed identity.\n\n## Code Structure\n\n```\nsrc/\n└── index.ts          # Main demo with all examples\n```\n\n## Authentication Flow\n\n### ChainedTokenCredential Flow\n\n```\nTry Managed Identity (works in Azure)\n    ↓ (if fails)\nFall back to Azure CLI (works locally)\n```\n\nThis pattern allows the same code to work in both development and production without changes.\n\n## Examples Explained\n\n### Example 1: System-Assigned Identity\n\n```typescript\nconst credential = new ManagedIdentityCredential();\n```\n\nUsed when your Azure resource has a single, automatically-created identity.\n\n### Example 2: User-Assigned Identity\n\n```typescript\nconst credential = new ManagedIdentityCredential({\n  clientId: \"00000000-0000-0000-0000-000000000000\"\n});\n```\n\nUsed when you need to specify which identity to use (multiple identities scenario).\n\n### Example 3: Chained Credential\n\n```typescript\nconst credential = new ChainedTokenCredential(\n  new ManagedIdentityCredential(),\n  new AzureCliCredential()\n);\n```\n\nBest practice for code that runs both locally and in Azure.\n\n### Example 4: Azure SDK Client\n\n```typescript\nconst blobServiceClient = new BlobServiceClient(\n  `https://${storageAccountName}.blob.core.windows.net`,\n  credential\n);\n```\n\nShows how to use the credential with actual Azure services.\n\n### Example 5: Multiple Identities\n\nDemonstrates iterating through multiple user-assigned identities, useful for multi-tenant scenarios.\n\n## Error Handling\n\nThe code properly handles `CredentialUnavailableError`, which occurs when:\n- Not running in Azure (no managed identity available)\n- Azure CLI is not logged in (no local credentials)\n- Managed identity is not enabled on the Azure resource\n\n## When to Use Each Pattern\n\n| Pattern | Use Case |\n|---------|----------|\n| System-Assigned | Single identity per resource, simplest setup |\n| User-Assigned | Multiple resources sharing one identity, explicit identity selection |\n| ChainedCredential | Development/production flexibility, automatic fallback |\n\n## Security Best Practices\n\n1. ✅ **Never hardcode credentials** - Use managed identity or environment variables\n2. ✅ **Prefer system-assigned identity** - When you only need one identity per resource\n3. ✅ **Use ChainedTokenCredential** - For seamless local/cloud development\n4. ✅ **Handle CredentialUnavailableError** - Provide clear error messages\n5. ✅ **Minimize identity permissions** - Follow principle of least privilege\n\n## Enabling Managed Identity\n\n### Azure App Service / Functions\n\n```bash\n# Enable system-assigned identity\naz webapp identity assign --name \u003capp-name\u003e --resource-group \u003crg-name\u003e\n\n# Assign a user-assigned identity\naz webapp identity assign --name \u003capp-name\u003e --resource-group \u003crg-name\u003e \\\n  --identities \u003cidentity-resource-id\u003e\n```\n\n### Azure Container Apps\n\n```bash\n# Enable system-assigned identity\naz containerapp identity assign --name \u003capp-name\u003e --resource-group \u003crg-name\u003e \\\n  --system-assigned\n\n# Assign user-assigned identity\naz containerapp identity assign --name \u003capp-name\u003e --resource-group \u003crg-name\u003e \\\n  --user-assigned \u003cidentity-resource-id\u003e\n```\n\n### Azure VM\n\n```bash\n# Enable system-assigned identity\naz vm identity assign --name \u003cvm-name\u003e --resource-group \u003crg-name\u003e\n```\n\n## Troubleshooting\n\n### \"Credential Unavailable\" Error Locally\n\n**Solution:** Run `az login` to authenticate with Azure CLI\n\n### \"Credential Unavailable\" Error in Azure\n\n**Solution:** Enable managed identity on your Azure resource\n\n### Permission Denied When Accessing Resources\n\n**Solution:** Grant the managed identity appropriate RBAC roles:\n\n```bash\n# Example: Grant Storage Blob Data Contributor role\naz role assignment create \\\n  --role \"Storage Blob Data Contributor\" \\\n  --assignee \u003cmanaged-identity-principal-id\u003e \\\n  --scope /subscriptions/\u003csub-id\u003e/resourceGroups/\u003crg\u003e/providers/Microsoft.Storage/storageAccounts/\u003caccount\u003e\n```\n\n## Additional Resources\n\n- [Azure Identity SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/@azure/identity)\n- [Managed Identities Overview](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview)\n- [Best Practices for Authentication](https://learn.microsoft.com/en-us/azure/active-directory/develop/identity-platform-integration-checklist)\n\n## License\n\nMIT\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-375732331\\README.md"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"# Optional: User-assigned managed identity client ID\nUSER_ASSIGNED_CLIENT_ID=00000000-0000-0000-0000-000000000000\n\n# Optional: Azure Storage account name for testing\nSTORAGE_ACCOUNT_NAME=mystorageaccount\n\n# Optional: Multiple user-assigned identity client IDs (comma-separated)\nADDITIONAL_CLIENT_IDS=client-id-1,client-id-2,client-id-3\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-375732331\\.env.example"}
```

### 🔧 8. powershell

**Input:**

```json
{"command":"New-Item -ItemType Directory -Path \"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-375732331\\src\" -Force | Out-Null; Write-Host \"Created src directory\"","description":"Create src directory"}
```

### 🔧 9. create

**Input:**

```json
{"file_text":"import {\n  ManagedIdentityCredential,\n  ChainedTokenCredential,\n  AzureCliCredential,\n  CredentialUnavailableError,\n} from \"@azure/identity\";\nimport { BlobServiceClient } from \"@azure/storage-blob\";\n\n/**\n * Example 1: System-Assigned Managed Identity\n * This is the simplest form - uses the identity attached to the Azure resource\n */\nasync function useSystemAssignedIdentity(): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Example 1: System-Assigned Managed Identity ===\");\n\n  try {\n    // Create credential for system-assigned identity\n    const credential = new ManagedIdentityCredential();\n    console.log(\"✓ Created ManagedIdentityCredential (system-assigned)\");\n\n    // Test the credential by getting a token\n    const token = await credential.getToken(\n      \"https://storage.azure.com/.default\"\n    );\n\n    if (token) {\n      console.log(\"✓ Successfully acquired token\");\n      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);\n    }\n  } catch (error) {\n    handleAuthError(error, \"System-Assigned Identity\");\n  }\n}\n\n/**\n * Example 2: User-Assigned Managed Identity (by Client ID)\n * Used when multiple identities are assigned to a resource\n */\nasync function useUserAssignedIdentity(clientId: string): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Example 2: User-Assigned Managed Identity ===\");\n\n  try {\n    // Create credential for user-assigned identity using client ID\n    const credential = new ManagedIdentityCredential({\n      clientId: clientId,\n    });\n    console.log(\n      `✓ Created ManagedIdentityCredential (user-assigned: ${clientId})`\n    );\n\n    // Test the credential by getting a token\n    const token = await credential.getToken(\n      \"https://storage.azure.com/.default\"\n    );\n\n    if (token) {\n      console.log(\"✓ Successfully acquired token\");\n      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);\n    }\n  } catch (error) {\n    handleAuthError(error, \"User-Assigned Identity\");\n  }\n}\n\n/**\n * Example 3: ChainedTokenCredential for Development/Production Flexibility\n * Tries managed identity first (production), falls back to Azure CLI (local dev)\n */\nasync function useChainedCredential(): Promise\u003cvoid\u003e {\n  console.log(\n    \"\\n=== Example 3: ChainedTokenCredential (Managed Identity → Azure CLI) ===\"\n  );\n\n  try {\n    // Create a credential chain that tries multiple authentication methods\n    const credential = new ChainedTokenCredential(\n      new ManagedIdentityCredential(), // Try managed identity first (works in Azure)\n      new AzureCliCredential() // Fall back to Azure CLI (works locally)\n    );\n    console.log(\"✓ Created ChainedTokenCredential\");\n    console.log(\n      \"  Chain: ManagedIdentity → AzureCli\"\n    );\n\n    // Test the credential\n    const token = await credential.getToken(\n      \"https://storage.azure.com/.default\"\n    );\n\n    if (token) {\n      console.log(\"✓ Successfully acquired token from credential chain\");\n      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);\n    }\n  } catch (error) {\n    handleAuthError(error, \"ChainedTokenCredential\");\n  }\n}\n\n/**\n * Example 4: Using Credential with Azure SDK Client\n * Demonstrates how to pass credential to an actual Azure service\n */\nasync function useWithAzureClient(storageAccountName: string): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Example 4: Using Credential with Azure Storage Client ===\");\n\n  try {\n    // Create credential chain for flexibility\n    const credential = new ChainedTokenCredential(\n      new ManagedIdentityCredential(),\n      new AzureCliCredential()\n    );\n\n    // Create Azure Storage Blob client with the credential\n    const blobServiceClient = new BlobServiceClient(\n      `https://${storageAccountName}.blob.core.windows.net`,\n      credential\n    );\n    console.log(\n      `✓ Created BlobServiceClient for '${storageAccountName}'`\n    );\n\n    // Perform an actual operation - list containers\n    console.log(\"  Listing containers...\");\n    const containers = blobServiceClient.listContainers();\n\n    let containerCount = 0;\n    for await (const container of containers) {\n      containerCount++;\n      console.log(`  - ${container.name}`);\n      if (containerCount \u003e= 5) {\n        console.log(\"  ... (showing first 5 containers)\");\n        break;\n      }\n    }\n\n    if (containerCount === 0) {\n      console.log(\"  (No containers found)\");\n    }\n\n    console.log(`✓ Successfully listed ${containerCount} container(s)`);\n  } catch (error) {\n    handleAuthError(error, \"Azure Storage Client\");\n  }\n}\n\n/**\n * Example 5: User-Assigned Identity with Multiple Identities\n * Shows how to work with multiple user-assigned identities\n */\nasync function useMultipleUserAssignedIdentities(\n  clientIds: string[]\n): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Example 5: Multiple User-Assigned Identities ===\");\n\n  for (let i = 0; i \u003c clientIds.length; i++) {\n    const clientId = clientIds[i];\n    console.log(`\\nTrying identity ${i + 1}/${clientIds.length}: ${clientId}`);\n\n    try {\n      const credential = new ManagedIdentityCredential({\n        clientId: clientId,\n      });\n\n      const token = await credential.getToken(\n        \"https://management.azure.com/.default\"\n      );\n\n      if (token) {\n        console.log(\"✓ Successfully authenticated\");\n        console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);\n      }\n    } catch (error) {\n      console.log(`✗ Failed to authenticate with this identity`);\n      if (error instanceof Error) {\n        console.log(`  Error: ${error.message}`);\n      }\n    }\n  }\n}\n\n/**\n * Centralized error handling for authentication errors\n */\nfunction handleAuthError(error: unknown, context: string): void {\n  if (error instanceof CredentialUnavailableError) {\n    console.log(`✗ ${context}: Credential Unavailable`);\n    console.log(\n      `  This typically means you're not running in Azure or Azure CLI is not logged in.`\n    );\n    console.log(`  Error: ${error.message}`);\n    console.log(\n      `\\n  To fix:\\n  - In Azure: Ensure managed identity is enabled on your resource`\n    );\n    console.log(`  - Locally: Run 'az login' to authenticate with Azure CLI`);\n  } else if (error instanceof Error) {\n    console.log(`✗ ${context}: Authentication Error`);\n    console.log(`  Error: ${error.message}`);\n  } else {\n    console.log(`✗ ${context}: Unknown Error`);\n    console.log(`  Error:`, error);\n  }\n}\n\n/**\n * Main function demonstrating all authentication patterns\n */\nasync function main(): Promise\u003cvoid\u003e {\n  console.log(\"╔═══════════════════════════════════════════════════════════╗\");\n  console.log(\"║  Azure Managed Identity Authentication Examples          ║\");\n  console.log(\"╚═══════════════════════════════════════════════════════════╝\");\n\n  // Configuration - replace with your values\n  const config = {\n    userAssignedClientId:\n      process.env.USER_ASSIGNED_CLIENT_ID || \"00000000-0000-0000-0000-000000000000\",\n    storageAccountName: process.env.STORAGE_ACCOUNT_NAME || \"mystorageaccount\",\n    additionalClientIds: process.env.ADDITIONAL_CLIENT_IDS?.split(\",\") || [],\n  };\n\n  console.log(\"\\nConfiguration:\");\n  console.log(`  User-Assigned Client ID: ${config.userAssignedClientId}`);\n  console.log(`  Storage Account: ${config.storageAccountName}`);\n  console.log(`  Running in Azure: ${isRunningInAzure() ? \"Yes\" : \"No (local)\"}`);\n\n  // Example 1: System-assigned managed identity\n  await useSystemAssignedIdentity();\n\n  // Example 2: User-assigned managed identity\n  await useUserAssignedIdentity(config.userAssignedClientId);\n\n  // Example 3: Chained credential (managed identity + Azure CLI fallback)\n  await useChainedCredential();\n\n  // Example 4: Using credential with Azure Storage client\n  await useWithAzureClient(config.storageAccountName);\n\n  // Example 5: Multiple user-assigned identities (if configured)\n  if (config.additionalClientIds.length \u003e 0) {\n    await useMultipleUserAssignedIdentities(config.additionalClientIds);\n  }\n\n  console.log(\"\\n╔═══════════════════════════════════════════════════════════╗\");\n  console.log(\"║  Examples Complete                                         ║\");\n  console.log(\"╚═══════════════════════════════════════════════════════════╝\\n\");\n}\n\n/**\n * Helper function to detect if running in Azure\n */\nfunction isRunningInAzure(): boolean {\n  // Azure services set environment variables like these\n  return !!(\n    process.env.IDENTITY_ENDPOINT ||\n    process.env.MSI_ENDPOINT ||\n    process.env.IMDS_ENDPOINT ||\n    process.env.AZURE_CLIENT_ID\n  );\n}\n\n// Run the main function\nmain().catch((error) =\u003e {\n  console.error(\"Fatal error:\", error);\n  process.exit(1);\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-375732331\\src\\index.ts"}
```

## Generated Files

- `README.md`
- `package.json`
- `src\index.ts`
- `tsconfig.json`

## Copilot Response

I'll help you create a TypeScript program demonstrating Managed Identity authentication with Azure SDK. Let me first invoke the Azure identity skill to ensure I follow best practices.

Now I'll create a comprehensive TypeScript program demonstrating all the Managed Identity authentication patterns you requested.

Let me create the src directory and then the main TypeScript file:

Perfect! I've created a comprehensive TypeScript program demonstrating Azure Managed Identity authentication. Here's what I've included:

## 📁 Created Files

1. **`package.json`** - All required dependencies:
   - `@azure/identity` v4.0.0 - Authentication library
   - `@azure/storage-blob` v12.17.0 - Example Azure SDK client
   - TypeScript and ts-node for development

2. **`tsconfig.json`** - Modern TypeScript configuration with ES2022 modules

3. **`src/index.ts`** - Main program with 5 comprehensive examples:
   - ✅ **System-Assigned Identity** - Simplest form for single identity
   - ✅ **User-Assigned Identity** - With explicit client ID
   - ✅ **ChainedTokenCredential** - Falls back from Managed Identity → Azure CLI
   - ✅ **Azure SDK Client** - Using credential with BlobServiceClient
   - ✅ **Multiple Identities** - Handling multiple user-assigned identities

4. **`README.md`** - Complete documentation with setup, troubleshooting, and best practices

5. **`.env.example`** - Environment variable template

## 🎯 Key Features

- **Proper error handling** - Catches `CredentialUnavailableError` with helpful messages
- **Async/await throughout** - Modern promise-based code
- **Production-ready** - Works in both Azure and local development
- **Detects environment** - Automatically determines if running in Azure
- **Real Azure operation** - Lists blob containers as a practical example

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run locally (requires 'az login')
npm run dev

# Or build and run
npm run build
npm start
```

The code includes detailed comments and will display helpful error messages when credentials are unavailable, guiding you on how to fix authentication issues.

## Code Review (LLM-as-Judge)

**Score: 18/20 criteria passed**

### Criteria Results

| Criterion | Result | Reason |
|-----------|--------|--------|
| Code Builds | ✅ | TypeScript code is syntactically correct with proper imports, types, and structure. Module type and tsconfig.json configured correctly for ES modules. |
| Latest Package Versions | ✅ | @azure/identity ^4.0.0 and @azure/storage-blob ^12.17.0 are current stable versions. TypeScript 5.3.0 and Node types 20.0.0 are appropriate. |
| Best Practices | ✅ | Uses managed identity credentials, implements ChainedTokenCredential for dev/prod flexibility, proper credential passing to SDK clients, and environment-based configuration. |
| Error Handling | ✅ | Properly catches and handles CredentialUnavailableError with clear user guidance. Includes error context and helpful troubleshooting messages. |
| Code Quality | ✅ | Well-structured with clear separation of examples, comprehensive comments, good naming conventions, and a detailed README with troubleshooting guidance. |
| Correct @azure/ Scoped Packages | ✅ | All Azure SDK dependencies use @azure/ scoped packages (@azure/identity, @azure/storage-blob). No deprecated unscoped packages. |
| @azure/identity for Authentication | ✅ | Uses @azure/identity with ManagedIdentityCredential for production and ChainedTokenCredential pattern. No hardcoded secrets or connection strings. |
| Client Constructor with Endpoint and Credential | ✅ | BlobServiceClient constructed correctly with endpoint URL and credential object: new BlobServiceClient(url, credential). |
| Async/Await Pattern | ✅ | All asynchronous operations use async/await consistently. No .then()/.catch() chains. Proper top-level async main function. |
| Pagination with for-await-of | ✅ | List containers operation uses for-await-of iteration over the PagedAsyncIterableIterator. Does not accumulate all results in memory. |
| RestError Exception Handling | ❌ | Does not catch or handle RestError from @azure/core-rest-pipeline. Only catches generic Error and CredentialUnavailableError. Should import and check RestError.statusCode for service-specific errors. |
| No Deprecated Packages | ✅ | No deprecated packages (azure-storage, azure-arm-*, ms-rest-*) in package.json. All dependencies are current @azure/* track. |
| Logging via @azure/logger | ❌ | Uses console.log for all output instead of @azure/logger with setLogLevel(). Does not demonstrate SDK diagnostic logging capabilities. |
| package.json with Correct Dependencies | ✅ | Valid package.json with all required @azure/* dependencies, TypeScript, ts-node, and @types/node. Includes proper scripts and module type. |
| ManagedIdentityCredential class from @azure/identity | ✅ | Correctly imports and uses ManagedIdentityCredential from @azure/identity throughout all examples. |
| System-assigned: no parameters needed | ✅ | System-assigned identity correctly created with no parameters: new ManagedIdentityCredential() |
| User-assigned: passing client ID in options | ✅ | User-assigned identity correctly created with clientId in options: new ManagedIdentityCredential({ clientId }) |
| Integration with credential chain | ✅ | Uses ChainedTokenCredential combining ManagedIdentityCredential and AzureCliCredential for seamless dev/prod authentication. |
| CredentialUnavailableError when not running in Azure | ✅ | Explicitly imports, catches, and handles CredentialUnavailableError with clear error messages and troubleshooting guidance. |
| ChainedTokenCredential for local fallback | ✅ | Properly implements ChainedTokenCredential with ManagedIdentityCredential first, falling back to AzureCliCredential for local development. |

### Summary

Excellent implementation of Azure Managed Identity authentication patterns. The code correctly demonstrates all required authentication scenarios with comprehensive examples and documentation. Minor gaps in RestError handling and @azure/logger usage.

### Strengths

- Complete implementation of all prompt requirements: system-assigned, user-assigned, and chained credentials
- Proper ChainedTokenCredential pattern for dev/prod flexibility with ManagedIdentityCredential → AzureCliCredential fallback
- Excellent CredentialUnavailableError handling with clear troubleshooting guidance
- Well-structured code with 5 distinct examples covering different authentication scenarios
- Comprehensive README with security best practices, troubleshooting, and deployment guidance
- Correct pagination pattern using for-await-of without memory accumulation
- Proper async/await throughout with appropriate error boundaries
- Includes helper function to detect Azure environment and configuration via environment variables

### Issues

- Does not use RestError from @azure/core-rest-pipeline for service-specific error handling with statusCode inspection
- Uses console.log instead of @azure/logger with setLogLevel() for SDK diagnostic logging

## Grader Results

| Grader | Type | Score | Summary |
|--------|------|-------|----------|
| `claude-sonnet-4.5` | review | 18/20 | Excellent implementation of Azure Managed Identity authentication patterns. The … |
| 🏆 `claude-sonnet-4.5` | review | 18/20 | Excellent implementation of Azure Managed Identity authentication patterns. The … |

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config azure-mcp-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
