# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** azure-mcp-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 195.3s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | azure-mcp-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 195.3s |
| Timestamp | 2026-04-30T23:21:45Z |
| Files Generated | 0 |
| Event Count | 77 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 195.2s |
| **Total** | **195.3s** |

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
| Token Usage | in=98657 out=15832 |
| Turn Count | 2 |

## Error

```
0 files generated despite 7 file-write tool attempts
```

## Prompt Sent

```
Show me how to
use Managed Identity to authenticate Azure SDK clients in Node.js. Cover:
1. System-assigned vs user-assigned managed identity
2. How to create a ManagedIdentityCredential for each type
3. Using it with Azure SDK clients
4. Local development fallback strategies
5. Common pitfalls and error handling

Provide TypeScript examples for both identity types.
```

## Copilot Reasoning

The user is asking for a comprehensive guide on using Managed Identity to authenticate Azure SDK clients in Node.js. This is a technical educational request that requires:

1. Explanation of system-assigned vs user-assigned managed identity
2. Code examples showing how to create ManagedIdentityCredential for each type
3. Examples of using it with Azure SDK clients
4. Local development fallback strategies
5. Common pitfalls and error handling

This is a knowledge-sharing request, and I should provide clear, practical TypeScript examples. Let me create a comprehensive guide with working code examples.

I'll need to:
1. Create TypeScript example files showing both types of managed identity
2. Explain the concepts clearly
3. Show practical usage with Azure SDK clients
4. Cover local development scenarios
5. Highlight common issues

Since this is a "show me how" request focused on education/examples rather than implementing something in a codebase, I should provide clear examples and explanations directly. I don't need to use the report_intent tool since I'm not performing file operations or other tasks - I'm providing educational content.

Actually, let me reconsider - the user might benefit from me creating actual working example files that they can reference. Let me create a few TypeScript example files demonstrating these concepts.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Managed Identity examples"}
```

### 🔧 2. create

**Input:**

```json
{"file_text":"/**\n * System-Assigned Managed Identity Example\n * \n * System-assigned identities are tied to the lifecycle of the Azure resource.\n * When the resource is deleted, the identity is automatically deleted.\n * Best for: Single resource authentication scenarios\n */\n\nimport { ManagedIdentityCredential } from \"@azure/identity\";\nimport { SecretClient } from \"@azure/keyvault-secrets\";\nimport { BlobServiceClient } from \"@azure/storage-blob\";\n\n// 1. CREATE CREDENTIAL FOR SYSTEM-ASSIGNED IDENTITY\n// Simply instantiate without any parameters\nconst credential = new ManagedIdentityCredential();\n\n// 2. USE WITH AZURE KEY VAULT\nasync function getSecretFromKeyVault() {\n  const keyVaultUrl = \"https://my-keyvault.vault.azure.net\";\n  const secretClient = new SecretClient(keyVaultUrl, credential);\n  \n  try {\n    const secret = await secretClient.getSecret(\"my-secret-name\");\n    console.log(`Secret value: ${secret.value}`);\n    return secret.value;\n  } catch (error) {\n    console.error(\"Error accessing Key Vault:\", error);\n    throw error;\n  }\n}\n\n// 3. USE WITH AZURE BLOB STORAGE\nasync function uploadBlobToStorage() {\n  const storageAccountUrl = \"https://mystorageaccount.blob.core.windows.net\";\n  const blobServiceClient = new BlobServiceClient(storageAccountUrl, credential);\n  \n  try {\n    const containerClient = blobServiceClient.getContainerClient(\"my-container\");\n    const blockBlobClient = containerClient.getBlockBlobClient(\"example.txt\");\n    \n    const content = \"Hello from Managed Identity!\";\n    await blockBlobClient.upload(content, content.length);\n    \n    console.log(\"Blob uploaded successfully\");\n  } catch (error) {\n    console.error(\"Error uploading blob:\", error);\n    throw error;\n  }\n}\n\n// 4. ERROR HANDLING EXAMPLE\nasync function handleManagedIdentityErrors() {\n  try {\n    const token = await credential.getToken(\"https://vault.azure.net/.default\");\n    console.log(\"Token acquired successfully\");\n    console.log(`Expires on: ${new Date(token.expiresOnTimestamp)}`);\n  } catch (error: any) {\n    if (error.code === \"ManagedIdentityCredential\") {\n      console.error(\"Managed Identity is not available or not configured\");\n      console.error(\"Make sure:\");\n      console.error(\"1. You're running on an Azure resource (VM, App Service, Function, etc.)\");\n      console.error(\"2. System-assigned identity is enabled on the resource\");\n      console.error(\"3. The identity has the required RBAC permissions\");\n    } else {\n      console.error(\"Unexpected error:\", error.message);\n    }\n    throw error;\n  }\n}\n\n// EXPORT FOR USE IN OTHER MODULES\nexport { credential, getSecretFromKeyVault, uploadBlobToStorage, handleManagedIdentityErrors };\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-264280719\\system-assigned-identity.ts"}
```

### 🔧 3. create

**Input:**

```json
{"file_text":"/**\n * User-Assigned Managed Identity Example\n * \n * User-assigned identities are independent resources that can be assigned to multiple Azure resources.\n * They persist even when the associated resources are deleted.\n * Best for: Shared identity across multiple resources, fine-grained access control\n */\n\nimport { ManagedIdentityCredential } from \"@azure/identity\";\nimport { CosmosClient } from \"@azure/cosmos\";\nimport { EventHubProducerClient } from \"@azure/event-hubs\";\n\n// OPTION 1: Specify by Client ID (recommended)\nconst clientId = \"12345678-1234-1234-1234-123456789abc\";\nconst credentialByClientId = new ManagedIdentityCredential(clientId);\n\n// OPTION 2: Specify by Resource ID (full ARM resource ID)\nconst resourceId = \"/subscriptions/{subscription-id}/resourcegroups/{resource-group}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{identity-name}\";\nconst credentialByResourceId = new ManagedIdentityCredential({\n  resourceId: resourceId\n});\n\n// OPTION 3: Using options object with Client ID\nconst credentialWithOptions = new ManagedIdentityCredential({\n  clientId: clientId\n});\n\n// 1. USE WITH AZURE COSMOS DB\nasync function queryCosmos() {\n  const endpoint = \"https://my-cosmos-account.documents.azure.com:443/\";\n  const cosmosClient = new CosmosClient({\n    endpoint,\n    aadCredentials: credentialByClientId\n  });\n  \n  try {\n    const database = cosmosClient.database(\"my-database\");\n    const container = database.container(\"my-container\");\n    \n    const querySpec = {\n      query: \"SELECT * FROM c WHERE c.status = @status\",\n      parameters: [{ name: \"@status\", value: \"active\" }]\n    };\n    \n    const { resources } = await container.items.query(querySpec).fetchAll();\n    console.log(`Found ${resources.length} items`);\n    return resources;\n  } catch (error) {\n    console.error(\"Error querying Cosmos DB:\", error);\n    throw error;\n  }\n}\n\n// 2. USE WITH AZURE EVENT HUBS\nasync function sendEventToEventHub() {\n  const fullyQualifiedNamespace = \"my-eventhub-namespace.servicebus.windows.net\";\n  const eventHubName = \"my-event-hub\";\n  \n  const producer = new EventHubProducerClient(\n    fullyQualifiedNamespace,\n    eventHubName,\n    credentialByClientId\n  );\n  \n  try {\n    const batch = await producer.createBatch();\n    batch.tryAdd({ body: \"Event from user-assigned managed identity\" });\n    \n    await producer.sendBatch(batch);\n    console.log(\"Event sent successfully\");\n  } catch (error) {\n    console.error(\"Error sending event:\", error);\n    throw error;\n  } finally {\n    await producer.close();\n  }\n}\n\n// 3. MULTIPLE USER-ASSIGNED IDENTITIES\n// When a resource has multiple user-assigned identities, you MUST specify which one\ninterface IdentityConfig {\n  keyVaultIdentity: string;\n  storageIdentity: string;\n  databaseIdentity: string;\n}\n\nclass MultiIdentityService {\n  private identities: Map\u003cstring, ManagedIdentityCredential\u003e;\n  \n  constructor(config: IdentityConfig) {\n    this.identities = new Map([\n      [\"keyvault\", new ManagedIdentityCredential(config.keyVaultIdentity)],\n      [\"storage\", new ManagedIdentityCredential(config.storageIdentity)],\n      [\"database\", new ManagedIdentityCredential(config.databaseIdentity)]\n    ]);\n  }\n  \n  getCredential(service: string): ManagedIdentityCredential {\n    const credential = this.identities.get(service);\n    if (!credential) {\n      throw new Error(`No credential configured for service: ${service}`);\n    }\n    return credential;\n  }\n}\n\n// Example usage\nconst identityService = new MultiIdentityService({\n  keyVaultIdentity: \"11111111-1111-1111-1111-111111111111\",\n  storageIdentity: \"22222222-2222-2222-2222-222222222222\",\n  databaseIdentity: \"33333333-3333-3333-3333-333333333333\"\n});\n\n// 4. ERROR HANDLING WITH USER-ASSIGNED IDENTITY\nasync function validateUserAssignedIdentity(clientId: string) {\n  const credential = new ManagedIdentityCredential(clientId);\n  \n  try {\n    const token = await credential.getToken(\"https://management.azure.com/.default\");\n    console.log(\"User-assigned identity is working correctly\");\n    console.log(`Token for client ID: ${clientId}`);\n    return true;\n  } catch (error: any) {\n    console.error(\"User-assigned identity validation failed:\");\n    \n    if (error.message?.includes(\"clientId\")) {\n      console.error(\"❌ The specified client ID may not exist or not be assigned to this resource\");\n      console.error(`   Client ID: ${clientId}`);\n      console.error(\"   Check: Azure Portal → Resource → Identity → User assigned\");\n    } else if (error.message?.includes(\"IMDS\")) {\n      console.error(\"❌ Instance Metadata Service (IMDS) is not available\");\n      console.error(\"   Make sure you're running on an Azure resource that supports managed identity\");\n    } else {\n      console.error(`❌ ${error.message}`);\n    }\n    \n    return false;\n  }\n}\n\nexport {\n  credentialByClientId,\n  credentialByResourceId,\n  queryCosmos,\n  sendEventToEventHub,\n  MultiIdentityService,\n  validateUserAssignedIdentity\n};\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-264280719\\user-assigned-identity.ts"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"/**\n * Local Development Fallback Strategies\n * \n * Managed Identity only works on Azure resources. For local development,\n * you need fallback authentication methods.\n */\n\nimport {\n  ManagedIdentityCredential,\n  DefaultAzureCredential,\n  ChainedTokenCredential,\n  AzureCliCredential,\n  EnvironmentCredential,\n  TokenCredential\n} from \"@azure/identity\";\nimport { SecretClient } from \"@azure/keyvault-secrets\";\n\n// STRATEGY 1: DefaultAzureCredential (RECOMMENDED)\n// Automatically tries multiple authentication methods in order:\n// 1. EnvironmentCredential (env vars)\n// 2. WorkloadIdentityCredential (Kubernetes)\n// 3. ManagedIdentityCredential (Azure resources)\n// 4. AzureCliCredential (Azure CLI login)\n// 5. AzurePowerShellCredential (Azure PowerShell login)\nfunction createDefaultCredential(): TokenCredential {\n  // Works in both Azure and local development\n  return new DefaultAzureCredential();\n}\n\n// STRATEGY 2: ChainedTokenCredential (Custom Fallback Chain)\n// Explicitly define the authentication priority\nfunction createCustomChainCredential(): TokenCredential {\n  return new ChainedTokenCredential(\n    new ManagedIdentityCredential(), // Try managed identity first (in Azure)\n    new AzureCliCredential(),        // Fall back to Azure CLI (local dev)\n    new EnvironmentCredential()       // Fall back to env vars (CI/CD)\n  );\n}\n\n// STRATEGY 3: Environment-Based Selection\nfunction createEnvironmentAwareCredential(): TokenCredential {\n  const isProduction = process.env.NODE_ENV === \"production\";\n  const isAzure = process.env.AZURE_ENVIRONMENT === \"true\" || \n                  process.env.WEBSITE_INSTANCE_ID !== undefined; // App Service indicator\n  \n  if (isAzure || isProduction) {\n    console.log(\"Using Managed Identity (Azure environment)\");\n    return new ManagedIdentityCredential();\n  } else {\n    console.log(\"Using Azure CLI (local development)\");\n    return new AzureCliCredential();\n  }\n}\n\n// STRATEGY 4: Configuration-Based with User-Assigned Identity\ninterface CredentialConfig {\n  managedIdentityClientId?: string;\n  useLocalDevelopment?: boolean;\n}\n\nfunction createConfigurableCredential(config: CredentialConfig = {}): TokenCredential {\n  if (config.useLocalDevelopment) {\n    // Local development mode\n    return new ChainedTokenCredential(\n      new AzureCliCredential(),\n      new EnvironmentCredential()\n    );\n  } else if (config.managedIdentityClientId) {\n    // User-assigned managed identity\n    return new ChainedTokenCredential(\n      new ManagedIdentityCredential(config.managedIdentityClientId),\n      new AzureCliCredential() // Fallback for local testing\n    );\n  } else {\n    // Default: use system-assigned or DefaultAzureCredential\n    return new DefaultAzureCredential();\n  }\n}\n\n// PRACTICAL EXAMPLE: Key Vault Client with Fallback\nclass KeyVaultService {\n  private client: SecretClient;\n  private credential: TokenCredential;\n  \n  constructor(keyVaultUrl: string, managedIdentityClientId?: string) {\n    // Use DefaultAzureCredential for automatic fallback\n    if (managedIdentityClientId) {\n      // User-assigned identity in Azure, falls back to Azure CLI locally\n      this.credential = new ChainedTokenCredential(\n        new ManagedIdentityCredential(managedIdentityClientId),\n        new AzureCliCredential()\n      );\n    } else {\n      // System-assigned identity in Azure, multiple fallbacks locally\n      this.credential = new DefaultAzureCredential();\n    }\n    \n    this.client = new SecretClient(keyVaultUrl, this.credential);\n  }\n  \n  async getSecret(secretName: string): Promise\u003cstring\u003e {\n    try {\n      const secret = await this.client.getSecret(secretName);\n      return secret.value || \"\";\n    } catch (error: any) {\n      console.error(`Error retrieving secret '${secretName}':`, error.message);\n      throw error;\n    }\n  }\n}\n\n// USAGE EXAMPLES\n\n// Example 1: Simple DefaultAzureCredential (works everywhere)\nasync function example1() {\n  const credential = new DefaultAzureCredential();\n  const client = new SecretClient(\"https://my-vault.vault.azure.net\", credential);\n  await client.getSecret(\"my-secret\");\n}\n\n// Example 2: Custom chain with explicit fallback\nasync function example2() {\n  const credential = createCustomChainCredential();\n  const client = new SecretClient(\"https://my-vault.vault.azure.net\", credential);\n  await client.getSecret(\"my-secret\");\n}\n\n// Example 3: Environment-aware selection\nasync function example3() {\n  const credential = createEnvironmentAwareCredential();\n  const client = new SecretClient(\"https://my-vault.vault.azure.net\", credential);\n  await client.getSecret(\"my-secret\");\n}\n\n// Example 4: Using the KeyVaultService wrapper\nasync function example4() {\n  // In Azure: uses managed identity\n  // Locally: uses Azure CLI\n  const service = new KeyVaultService(\n    \"https://my-vault.vault.azure.net\",\n    process.env.MANAGED_IDENTITY_CLIENT_ID\n  );\n  const secretValue = await service.getSecret(\"database-password\");\n  console.log(\"Secret retrieved successfully\");\n}\n\n// LOCAL DEVELOPMENT SETUP INSTRUCTIONS\nconsole.log(`\nLOCAL DEVELOPMENT SETUP:\n\n1. Azure CLI (Recommended):\n   az login\n   az account set --subscription \"Your Subscription Name\"\n\n2. Environment Variables (for EnvironmentCredential):\n   - AZURE_CLIENT_ID\n   - AZURE_TENANT_ID\n   - AZURE_CLIENT_SECRET\n   \n3. Service Principal (CI/CD):\n   az login --service-principal -u \u003capp-id\u003e -p \u003cpassword\u003e --tenant \u003ctenant-id\u003e\n\n4. VS Code Azure Account Extension:\n   - Install \"Azure Account\" extension\n   - Sign in through VS Code\n\nTESTING:\n- Test locally with: NODE_ENV=development npm start\n- Test production config: NODE_ENV=production AZURE_ENVIRONMENT=true npm start\n`);\n\nexport {\n  createDefaultCredential,\n  createCustomChainCredential,\n  createEnvironmentAwareCredential,\n  createConfigurableCredential,\n  KeyVaultService\n};\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-264280719\\local-development-fallback.ts"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"/**\n * Common Pitfalls and Error Handling for Managed Identity\n */\n\nimport {\n  ManagedIdentityCredential,\n  DefaultAzureCredential,\n  TokenCredential\n} from \"@azure/identity\";\nimport { SecretClient } from \"@azure/keyvault-secrets\";\n\n// PITFALL 1: Not checking if Managed Identity is enabled\n// ❌ BAD: Assumes managed identity is available\nasync function badExample1() {\n  const credential = new ManagedIdentityCredential();\n  const client = new SecretClient(\"https://vault.azure.net\", credential);\n  \n  // This will fail if managed identity is not enabled\n  await client.getSecret(\"secret\");\n}\n\n// ✅ GOOD: Test managed identity availability first\nasync function goodExample1() {\n  const credential = new ManagedIdentityCredential();\n  \n  try {\n    // Test token acquisition before using with SDK clients\n    await credential.getToken(\"https://vault.azure.net/.default\");\n    console.log(\"✓ Managed Identity is available\");\n    \n    const client = new SecretClient(\"https://vault.azure.net\", credential);\n    await client.getSecret(\"secret\");\n  } catch (error: any) {\n    if (error.message?.includes(\"ManagedIdentityCredential\")) {\n      console.error(\"❌ Managed Identity not available. Enable it in Azure Portal → Resource → Identity\");\n      throw new Error(\"Managed Identity must be enabled on this Azure resource\");\n    }\n    throw error;\n  }\n}\n\n// PITFALL 2: Missing RBAC permissions\n// Even with managed identity enabled, you need proper role assignments\nasync function handleRBACErrors() {\n  const credential = new ManagedIdentityCredential();\n  const keyVaultUrl = \"https://my-vault.vault.azure.net\";\n  const client = new SecretClient(keyVaultUrl, credential);\n  \n  try {\n    const secret = await client.getSecret(\"my-secret\");\n    return secret.value;\n  } catch (error: any) {\n    console.error(\"Error accessing Key Vault:\", error.message);\n    \n    // Check for permission-related errors\n    if (error.statusCode === 403 || error.code === \"Forbidden\") {\n      console.error(`\n❌ RBAC PERMISSION ERROR\n   The managed identity doesn't have permission to access this Key Vault.\n   \n   FIX:\n   1. Get the managed identity's Object ID:\n      - Azure Portal → Your Resource → Identity → Object ID\n   \n   2. Grant access:\n      az keyvault set-policy \\\\\n        --name my-vault \\\\\n        --object-id \u003cidentity-object-id\u003e \\\\\n        --secret-permissions get list\n      \n   OR use RBAC (recommended):\n      az role assignment create \\\\\n        --assignee \u003cidentity-object-id\u003e \\\\\n        --role \"Key Vault Secrets User\" \\\\\n        --scope /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/my-vault\n      `);\n    }\n    \n    throw error;\n  }\n}\n\n// PITFALL 3: Using wrong Client ID for user-assigned identity\n// ❌ BAD: Using Object ID instead of Client ID\nasync function badExample3() {\n  // Object ID looks like this: \"12345678-90ab-cdef-1234-567890abcdef\"\n  // Client ID also looks like a GUID, but they're different!\n  const objectId = \"12345678-90ab-cdef-1234-567890abcdef\"; // WRONG!\n  const credential = new ManagedIdentityCredential(objectId);\n  \n  // This will fail silently or with confusing errors\n}\n\n// ✅ GOOD: Use the correct Client ID\nasync function goodExample3() {\n  // Get Client ID from: Azure Portal → Managed Identity → Properties → Client ID\n  const clientId = \"abcdef12-3456-7890-abcd-ef1234567890\"; // This is the Application ID\n  const credential = new ManagedIdentityCredential(clientId);\n  console.log(\"✓ Using correct Client ID\");\n}\n\n// PITFALL 4: Not handling token refresh\n// Token refresh is automatic, but be aware of timing\nasync function demonstrateTokenLifecycle() {\n  const credential = new ManagedIdentityCredential();\n  \n  // Get initial token\n  const token1 = await credential.getToken(\"https://vault.azure.net/.default\");\n  console.log(`Token expires: ${new Date(token1.expiresOnTimestamp)}`);\n  \n  // The credential automatically refreshes tokens before they expire\n  // You don't need to manually refresh, but be aware:\n  // - Tokens typically last 24 hours\n  // - Refresh happens ~30 minutes before expiration\n  // - Network issues during refresh can cause temporary failures\n  \n  // ✅ GOOD: SDK clients handle refresh automatically\n  const client = new SecretClient(\"https://vault.azure.net\", credential);\n  // This works even after 24+ hours because credential refreshes tokens\n  await client.getSecret(\"secret\");\n}\n\n// PITFALL 5: Multiple user-assigned identities without specifying which one\nasync function badExample5() {\n  // If your resource has multiple user-assigned identities assigned to it,\n  // you MUST specify which one to use\n  const credential = new ManagedIdentityCredential(); // ❌ Which identity?\n  \n  // This will fail or use a random identity\n}\n\nasync function goodExample5() {\n  // ✅ Explicitly specify the identity\n  const clientId = process.env.MANAGED_IDENTITY_CLIENT_ID!;\n  \n  if (!clientId) {\n    throw new Error(\"MANAGED_IDENTITY_CLIENT_ID environment variable is required\");\n  }\n  \n  const credential = new ManagedIdentityCredential(clientId);\n  console.log(`✓ Using specific identity: ${clientId}`);\n}\n\n// PITFALL 6: Not handling network timeouts to IMDS\n// The Instance Metadata Service (IMDS) can be slow or unavailable\nasync function handleIMDSTimeout() {\n  const credential = new ManagedIdentityCredential();\n  \n  try {\n    // Set a reasonable timeout\n    const timeoutMs = 10000; // 10 seconds\n    const timeoutPromise = new Promise((_, reject) =\u003e \n      setTimeout(() =\u003e reject(new Error(\"IMDS timeout\")), timeoutMs)\n    );\n    \n    const tokenPromise = credential.getToken(\"https://vault.azure.net/.default\");\n    \n    const token = await Promise.race([tokenPromise, timeoutPromise]);\n    console.log(\"✓ Token acquired successfully\");\n  } catch (error: any) {\n    if (error.message === \"IMDS timeout\") {\n      console.error(\"❌ IMDS endpoint is not responding. Possible causes:\");\n      console.error(\"   - Not running on an Azure resource\");\n      console.error(\"   - Network connectivity issues\");\n      console.error(\"   - IMDS endpoint is blocked by firewall/proxy\");\n    }\n    throw error;\n  }\n}\n\n// PITFALL 7: Wrong scope/audience for the token\nasync function demonstrateScopes() {\n  const credential = new ManagedIdentityCredential();\n  \n  // Common Azure scopes (audiences):\n  const scopes = {\n    keyVault: \"https://vault.azure.net/.default\",\n    storage: \"https://storage.azure.com/.default\",\n    azureManagement: \"https://management.azure.com/.default\",\n    database: \"https://database.windows.net/.default\",\n    eventHubs: \"https://eventhubs.azure.net/.default\",\n    serviceBus: \"https://servicebus.azure.net/.default\"\n  };\n  \n  try {\n    // ✅ Use the correct scope for your service\n    const token = await credential.getToken(scopes.keyVault);\n    console.log(\"✓ Token acquired for Key Vault\");\n  } catch (error: any) {\n    // ❌ Using wrong scope will fail\n    console.error(\"Make sure you're using the correct scope for your Azure service\");\n  }\n}\n\n// COMPREHENSIVE ERROR HANDLER\nasync function robustManagedIdentityUsage(\n  keyVaultUrl: string,\n  clientId?: string\n) {\n  let credential: TokenCredential;\n  \n  try {\n    // Create credential\n    if (clientId) {\n      credential = new ManagedIdentityCredential(clientId);\n      console.log(`Using user-assigned identity: ${clientId}`);\n    } else {\n      credential = new ManagedIdentityCredential();\n      console.log(\"Using system-assigned identity\");\n    }\n    \n    // Test credential before using\n    console.log(\"Testing managed identity...\");\n    const testToken = await credential.getToken(\"https://vault.azure.net/.default\");\n    console.log(\"✓ Managed identity is working\");\n    console.log(`  Token expires: ${new Date(testToken.expiresOnTimestamp)}`);\n    \n    // Use with SDK client\n    const client = new SecretClient(keyVaultUrl, credential);\n    const secret = await client.getSecret(\"my-secret\");\n    \n    return secret.value;\n    \n  } catch (error: any) {\n    console.error(\"\\n❌ MANAGED IDENTITY ERROR\\n\");\n    \n    // Categorize and provide specific guidance\n    if (error.message?.includes(\"ManagedIdentityCredential\")) {\n      console.error(\"Cause: Managed Identity not available\");\n      console.error(\"Fix: Enable managed identity on your Azure resource\");\n      console.error(\"     Azure Portal → Resource → Identity → System assigned: On\");\n    } else if (error.statusCode === 403) {\n      console.error(\"Cause: Missing RBAC permissions\");\n      console.error(\"Fix: Grant the managed identity access to the Key Vault\");\n      console.error(`     az role assignment create --assignee \u003cidentity-id\u003e --role \"Key Vault Secrets User\" --scope \u003cvault-id\u003e`);\n    } else if (error.message?.includes(\"IMDS\")) {\n      console.error(\"Cause: Cannot reach Instance Metadata Service\");\n      console.error(\"Fix: Ensure you're running on an Azure resource\");\n    } else if (error.code === \"ENOTFOUND\" || error.code === \"ECONNREFUSED\") {\n      console.error(\"Cause: Network connectivity issue\");\n      console.error(\"Fix: Check firewall rules and network configuration\");\n    } else {\n      console.error(`Cause: ${error.message}`);\n    }\n    \n    console.error(`\\nFull error:`, error);\n    throw error;\n  }\n}\n\n// DEBUGGING HELPER\nasync function debugManagedIdentity(clientId?: string) {\n  console.log(\"=== MANAGED IDENTITY DIAGNOSTICS ===\\n\");\n  \n  // Check environment\n  console.log(\"Environment:\");\n  console.log(`  NODE_ENV: ${process.env.NODE_ENV || \"not set\"}`);\n  console.log(`  WEBSITE_INSTANCE_ID: ${process.env.WEBSITE_INSTANCE_ID || \"not set\"} (App Service)`);\n  console.log(`  MSI_ENDPOINT: ${process.env.MSI_ENDPOINT || \"not set\"} (Managed Identity endpoint)`);\n  console.log();\n  \n  // Try to get token\n  const credential = clientId \n    ? new ManagedIdentityCredential(clientId)\n    : new ManagedIdentityCredential();\n  \n  try {\n    console.log(\"Attempting to acquire token...\");\n    const token = await credential.getToken(\"https://management.azure.com/.default\");\n    console.log(\"✓ SUCCESS\");\n    console.log(`  Token acquired at: ${new Date()}`);\n    console.log(`  Expires at: ${new Date(token.expiresOnTimestamp)}`);\n    console.log(`  Token length: ${token.token.length} characters`);\n  } catch (error: any) {\n    console.log(\"✗ FAILED\");\n    console.log(`  Error: ${error.message}`);\n    console.log(`  Code: ${error.code || \"N/A\"}`);\n  }\n}\n\nexport {\n  goodExample1,\n  handleRBACErrors,\n  robustManagedIdentityUsage,\n  debugManagedIdentity\n};\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-264280719\\common-pitfalls.ts"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"/**\n * Complete Production-Ready Example\n * \n * This example demonstrates a full application using managed identity\n * with proper error handling, fallback strategies, and best practices.\n */\n\nimport {\n  ManagedIdentityCredential,\n  DefaultAzureCredential,\n  ChainedTokenCredential,\n  AzureCliCredential,\n  TokenCredential\n} from \"@azure/identity\";\nimport { SecretClient } from \"@azure/keyvault-secrets\";\nimport { BlobServiceClient } from \"@azure/storage-blob\";\nimport { CosmosClient } from \"@azure/cosmos\";\n\n// Configuration interface\ninterface AppConfig {\n  environment: \"development\" | \"staging\" | \"production\";\n  managedIdentityClientId?: string;\n  keyVaultUrl: string;\n  storageAccountUrl: string;\n  cosmosEndpoint: string;\n}\n\n// Credential factory with intelligent fallback\nclass CredentialFactory {\n  static create(config: AppConfig): TokenCredential {\n    const isDevelopment = config.environment === \"development\";\n    const isAzureEnvironment = process.env.WEBSITE_INSTANCE_ID !== undefined ||\n                               process.env.MSI_ENDPOINT !== undefined;\n    \n    if (isDevelopment \u0026\u0026 !isAzureEnvironment) {\n      console.log(\"🔧 Development mode: Using Azure CLI credential\");\n      return new ChainedTokenCredential(\n        new AzureCliCredential(),\n        new DefaultAzureCredential()\n      );\n    }\n    \n    if (config.managedIdentityClientId) {\n      console.log(`🔐 Using user-assigned managed identity: ${config.managedIdentityClientId}`);\n      return new ChainedTokenCredential(\n        new ManagedIdentityCredential(config.managedIdentityClientId),\n        new AzureCliCredential() // Fallback for local testing with service principal\n      );\n    }\n    \n    console.log(\"🔐 Using system-assigned managed identity\");\n    return new ManagedIdentityCredential();\n  }\n}\n\n// Azure Services wrapper with managed identity\nclass AzureServices {\n  private credential: TokenCredential;\n  private config: AppConfig;\n  private secretClient?: SecretClient;\n  private blobServiceClient?: BlobServiceClient;\n  private cosmosClient?: CosmosClient;\n  \n  constructor(config: AppConfig) {\n    this.config = config;\n    this.credential = CredentialFactory.create(config);\n  }\n  \n  // Initialize and validate managed identity\n  async initialize(): Promise\u003cvoid\u003e {\n    console.log(\"Initializing Azure services...\");\n    \n    try {\n      // Test credential by acquiring a token\n      const token = await this.credential.getToken(\"https://vault.azure.net/.default\");\n      console.log(\"✓ Managed identity validated\");\n      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp).toISOString()}`);\n      \n      // Initialize clients\n      this.secretClient = new SecretClient(this.config.keyVaultUrl, this.credential);\n      this.blobServiceClient = new BlobServiceClient(\n        this.config.storageAccountUrl,\n        this.credential\n      );\n      this.cosmosClient = new CosmosClient({\n        endpoint: this.config.cosmosEndpoint,\n        aadCredentials: this.credential\n      });\n      \n      console.log(\"✓ Azure services initialized successfully\");\n    } catch (error: any) {\n      console.error(\"❌ Failed to initialize Azure services\");\n      this.handleCredentialError(error);\n      throw error;\n    }\n  }\n  \n  // Key Vault operations\n  async getSecret(secretName: string): Promise\u003cstring\u003e {\n    if (!this.secretClient) {\n      throw new Error(\"Services not initialized. Call initialize() first.\");\n    }\n    \n    try {\n      const secret = await this.secretClient.getSecret(secretName);\n      return secret.value || \"\";\n    } catch (error: any) {\n      console.error(`Error retrieving secret '${secretName}':`, error.message);\n      \n      if (error.statusCode === 403) {\n        console.error(`\nMissing Key Vault permission. Grant access with:\naz keyvault set-policy --name \u003cvault-name\u003e --object-id \u003cidentity-object-id\u003e --secret-permissions get\n\nOr using RBAC:\naz role assignment create --assignee \u003cidentity-object-id\u003e --role \"Key Vault Secrets User\" --scope \u003cvault-resource-id\u003e\n        `);\n      }\n      \n      throw error;\n    }\n  }\n  \n  async setSecret(secretName: string, value: string): Promise\u003cvoid\u003e {\n    if (!this.secretClient) {\n      throw new Error(\"Services not initialized. Call initialize() first.\");\n    }\n    \n    try {\n      await this.secretClient.setSecret(secretName, value);\n      console.log(`✓ Secret '${secretName}' updated successfully`);\n    } catch (error: any) {\n      if (error.statusCode === 403) {\n        console.error(\"Missing Key Vault 'set' permission\");\n      }\n      throw error;\n    }\n  }\n  \n  // Blob Storage operations\n  async uploadBlob(containerName: string, blobName: string, content: string): Promise\u003cvoid\u003e {\n    if (!this.blobServiceClient) {\n      throw new Error(\"Services not initialized. Call initialize() first.\");\n    }\n    \n    try {\n      const containerClient = this.blobServiceClient.getContainerClient(containerName);\n      \n      // Create container if it doesn't exist\n      await containerClient.createIfNotExists();\n      \n      const blockBlobClient = containerClient.getBlockBlobClient(blobName);\n      await blockBlobClient.upload(content, content.length);\n      \n      console.log(`✓ Blob '${blobName}' uploaded to container '${containerName}'`);\n    } catch (error: any) {\n      console.error(`Error uploading blob:`, error.message);\n      \n      if (error.statusCode === 403) {\n        console.error(`\nMissing Storage permission. Grant access with:\naz role assignment create --assignee \u003cidentity-object-id\u003e --role \"Storage Blob Data Contributor\" --scope \u003cstorage-account-resource-id\u003e\n        `);\n      }\n      \n      throw error;\n    }\n  }\n  \n  async downloadBlob(containerName: string, blobName: string): Promise\u003cstring\u003e {\n    if (!this.blobServiceClient) {\n      throw new Error(\"Services not initialized. Call initialize() first.\");\n    }\n    \n    try {\n      const containerClient = this.blobServiceClient.getContainerClient(containerName);\n      const blobClient = containerClient.getBlobClient(blobName);\n      \n      const downloadResponse = await blobClient.download();\n      const downloaded = await this.streamToString(downloadResponse.readableStreamBody!);\n      \n      return downloaded;\n    } catch (error: any) {\n      console.error(`Error downloading blob:`, error.message);\n      throw error;\n    }\n  }\n  \n  // Cosmos DB operations\n  async queryDocuments(databaseId: string, containerId: string, query: string): Promise\u003cany[]\u003e {\n    if (!this.cosmosClient) {\n      throw new Error(\"Services not initialized. Call initialize() first.\");\n    }\n    \n    try {\n      const database = this.cosmosClient.database(databaseId);\n      const container = database.container(containerId);\n      \n      const { resources } = await container.items.query(query).fetchAll();\n      return resources;\n    } catch (error: any) {\n      console.error(`Error querying Cosmos DB:`, error.message);\n      \n      if (error.code === 403) {\n        console.error(`\nMissing Cosmos DB permission. Grant access with:\naz cosmosdb sql role assignment create --account-name \u003caccount\u003e --resource-group \u003crg\u003e --role-definition-name \"Cosmos DB Built-in Data Contributor\" --principal-id \u003cidentity-object-id\u003e --scope \"/\"\n        `);\n      }\n      \n      throw error;\n    }\n  }\n  \n  // Error handling helper\n  private handleCredentialError(error: any): void {\n    if (error.message?.includes(\"ManagedIdentityCredential\")) {\n      console.error(`\n⚠️  MANAGED IDENTITY NOT AVAILABLE\n\nPossible causes:\n1. Not running on an Azure resource that supports managed identity\n2. Managed identity not enabled on the resource\n3. User-assigned identity not attached to the resource\n\nFixes:\n- Enable system-assigned identity: Azure Portal → Resource → Identity → System assigned: ON\n- Attach user-assigned identity: Azure Portal → Resource → Identity → User assigned → Add\n- For local development: az login\n      `);\n    } else if (error.code === \"ECONNREFUSED\" || error.message?.includes(\"IMDS\")) {\n      console.error(`\n⚠️  INSTANCE METADATA SERVICE (IMDS) UNREACHABLE\n\nThis typically means:\n1. Not running on an Azure VM/App Service/Function/Container\n2. Network firewall blocking IMDS endpoint (169.254.169.254)\n3. Running in a restricted network environment\n\nFor local development, make sure you're logged in:\naz login\naz account set --subscription \"\u003cyour-subscription\u003e\"\n      `);\n    }\n  }\n  \n  // Helper: Convert stream to string\n  private async streamToString(readableStream: NodeJS.ReadableStream): Promise\u003cstring\u003e {\n    return new Promise((resolve, reject) =\u003e {\n      const chunks: Buffer[] = [];\n      readableStream.on(\"data\", (data) =\u003e {\n        chunks.push(data instanceof Buffer ? data : Buffer.from(data));\n      });\n      readableStream.on(\"end\", () =\u003e {\n        resolve(Buffer.concat(chunks).toString(\"utf8\"));\n      });\n      readableStream.on(\"error\", reject);\n    });\n  }\n}\n\n// Example application\nasync function main() {\n  // Load configuration\n  const config: AppConfig = {\n    environment: (process.env.NODE_ENV as any) || \"development\",\n    managedIdentityClientId: process.env.MANAGED_IDENTITY_CLIENT_ID,\n    keyVaultUrl: process.env.KEY_VAULT_URL || \"https://my-vault.vault.azure.net\",\n    storageAccountUrl: process.env.STORAGE_ACCOUNT_URL || \"https://mystorage.blob.core.windows.net\",\n    cosmosEndpoint: process.env.COSMOS_ENDPOINT || \"https://mycosmosdb.documents.azure.com:443/\"\n  };\n  \n  console.log(\"=== Azure Managed Identity Demo ===\");\n  console.log(`Environment: ${config.environment}`);\n  console.log(`User-assigned identity: ${config.managedIdentityClientId || \"None (using system-assigned)\"}`);\n  console.log();\n  \n  try {\n    // Initialize services\n    const services = new AzureServices(config);\n    await services.initialize();\n    \n    // Example 1: Work with Key Vault\n    console.log(\"\\n--- Key Vault Operations ---\");\n    const dbPassword = await services.getSecret(\"database-password\");\n    console.log(`✓ Retrieved database password (length: ${dbPassword.length})`);\n    \n    // Example 2: Work with Blob Storage\n    console.log(\"\\n--- Blob Storage Operations ---\");\n    await services.uploadBlob(\"logs\", \"app.log\", `Log entry at ${new Date().toISOString()}`);\n    const logContent = await services.downloadBlob(\"logs\", \"app.log\");\n    console.log(`✓ Downloaded log: ${logContent}`);\n    \n    // Example 3: Work with Cosmos DB\n    console.log(\"\\n--- Cosmos DB Operations ---\");\n    const documents = await services.queryDocuments(\n      \"my-database\",\n      \"my-container\",\n      \"SELECT * FROM c WHERE c.status = 'active' OFFSET 0 LIMIT 10\"\n    );\n    console.log(`✓ Found ${documents.length} active documents`);\n    \n    console.log(\"\\n✓ All operations completed successfully!\");\n    \n  } catch (error: any) {\n    console.error(\"\\n❌ Application error:\", error.message);\n    process.exit(1);\n  }\n}\n\n// Run if executed directly\nif (require.main === module) {\n  main().catch(console.error);\n}\n\nexport { AzureServices, CredentialFactory, AppConfig };\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-264280719\\complete-example.ts"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-managed-identity-examples\",\n  \"version\": \"1.0.0\",\n  \"description\": \"TypeScript examples for Azure Managed Identity authentication\",\n  \"main\": \"complete-example.ts\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/complete-example.js\",\n    \"dev\": \"ts-node complete-example.ts\"\n  },\n  \"keywords\": [\n    \"azure\",\n    \"managed-identity\",\n    \"authentication\",\n    \"typescript\"\n  ],\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.0.0\",\n    \"@azure/keyvault-secrets\": \"^4.7.0\",\n    \"@azure/storage-blob\": \"^12.17.0\",\n    \"@azure/cosmos\": \"^4.0.0\",\n    \"@azure/event-hubs\": \"^5.11.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.0.0\",\n    \"typescript\": \"^5.3.0\",\n    \"ts-node\": \"^10.9.0\"\n  },\n  \"engines\": {\n    \"node\": \"\u003e=18.0.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-264280719\\package.json"}
```

### 🔧 8. create

**Input:**

```json
{"file_text":"# Azure Managed Identity - Node.js/TypeScript Examples\n\nComplete guide to using Managed Identity for authenticating Azure SDK clients in Node.js.\n\n## 📚 What's Included\n\n### Core Examples\n- **`system-assigned-identity.ts`** - System-assigned managed identity examples\n- **`user-assigned-identity.ts`** - User-assigned managed identity with multiple identity scenarios\n- **`local-development-fallback.ts`** - Fallback strategies for local development\n- **`common-pitfalls.ts`** - Common mistakes and how to avoid them\n- **`complete-example.ts`** - Production-ready application example\n\n## 🔑 Managed Identity Types\n\n### System-Assigned Identity\n- **Lifecycle**: Tied to the Azure resource (deleted when resource is deleted)\n- **Scope**: Single resource only\n- **Best for**: Simple scenarios, single-resource authentication\n- **Setup**: Azure Portal → Resource → Identity → System assigned: ON\n\n```typescript\nimport { ManagedIdentityCredential } from \"@azure/identity\";\n\n// No parameters needed for system-assigned\nconst credential = new ManagedIdentityCredential();\n```\n\n### User-Assigned Identity\n- **Lifecycle**: Independent resource (persists after resource deletion)\n- **Scope**: Can be shared across multiple resources\n- **Best for**: Shared identity, fine-grained access control, multiple resources\n- **Setup**: Create identity → Assign to resources\n\n```typescript\nimport { ManagedIdentityCredential } from \"@azure/identity\";\n\n// Specify by Client ID (recommended)\nconst clientId = \"12345678-1234-1234-1234-123456789abc\";\nconst credential = new ManagedIdentityCredential(clientId);\n\n// OR specify by Resource ID\nconst credential2 = new ManagedIdentityCredential({\n  resourceId: \"/subscriptions/{sub}/resourcegroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}\"\n});\n```\n\n## 🚀 Quick Start\n\n### 1. Install Dependencies\n\n```bash\nnpm install @azure/identity @azure/keyvault-secrets @azure/storage-blob\n```\n\n### 2. Enable Managed Identity\n\n**For Azure App Service / Function:**\n```bash\naz webapp identity assign --name myapp --resource-group myrg\n```\n\n**For Azure VM:**\n```bash\naz vm identity assign --name myvm --resource-group myrg\n```\n\n**For user-assigned identity:**\n```bash\n# Create the identity\naz identity create --name myidentity --resource-group myrg\n\n# Assign to resource\naz webapp identity assign --name myapp --resource-group myrg \\\n  --identities /subscriptions/{sub}/resourcegroups/myrg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/myidentity\n```\n\n### 3. Grant RBAC Permissions\n\n```bash\n# Get the managed identity's Object ID\nIDENTITY_ID=$(az webapp identity show --name myapp --resource-group myrg --query principalId -o tsv)\n\n# Grant Key Vault access\naz role assignment create \\\n  --assignee $IDENTITY_ID \\\n  --role \"Key Vault Secrets User\" \\\n  --scope /subscriptions/{sub}/resourceGroups/myrg/providers/Microsoft.KeyVault/vaults/myvault\n```\n\n### 4. Use in Your Application\n\n```typescript\nimport { ManagedIdentityCredential } from \"@azure/identity\";\nimport { SecretClient } from \"@azure/keyvault-secrets\";\n\nconst credential = new ManagedIdentityCredential();\nconst client = new SecretClient(\"https://myvault.vault.azure.net\", credential);\n\nconst secret = await client.getSecret(\"my-secret\");\nconsole.log(secret.value);\n```\n\n## 🏠 Local Development\n\n**Option 1: DefaultAzureCredential (Recommended)**\n```typescript\nimport { DefaultAzureCredential } from \"@azure/identity\";\n\n// Works in Azure (managed identity) AND locally (Azure CLI)\nconst credential = new DefaultAzureCredential();\n```\n\n**Option 2: ChainedTokenCredential (Custom fallback)**\n```typescript\nimport { ChainedTokenCredential, ManagedIdentityCredential, AzureCliCredential } from \"@azure/identity\";\n\nconst credential = new ChainedTokenCredential(\n  new ManagedIdentityCredential(),  // Try managed identity first\n  new AzureCliCredential()           // Fall back to Azure CLI\n);\n```\n\n**Local Setup:**\n```bash\n# Login with Azure CLI\naz login\naz account set --subscription \"Your Subscription\"\n\n# Now your app works locally!\nnpm run dev\n```\n\n## ⚠️ Common Pitfalls\n\n### 1. Managed Identity Not Enabled\n**Error:** `ManagedIdentityCredential authentication failed`\n\n**Fix:**\n```bash\naz webapp identity assign --name myapp --resource-group myrg\n```\n\n### 2. Missing RBAC Permissions\n**Error:** `403 Forbidden`\n\n**Fix:**\n```bash\naz role assignment create \\\n  --assignee \u003cidentity-object-id\u003e \\\n  --role \"Key Vault Secrets User\" \\\n  --scope \u003ckey-vault-resource-id\u003e\n```\n\n### 3. Using Object ID Instead of Client ID\n**Wrong:**\n```typescript\n// ❌ This is the Object ID (doesn't work)\nconst credential = new ManagedIdentityCredential(\"a1b2c3d4-...\");\n```\n\n**Correct:**\n```typescript\n// ✅ Use the Client ID from the managed identity properties\nconst credential = new ManagedIdentityCredential(\"12345678-1234-...\");\n```\n\n### 4. Multiple User-Assigned Identities Without Specifying\n**Problem:** Resource has multiple identities, but you didn't specify which one\n\n**Fix:**\n```typescript\n// Always specify when multiple identities exist\nconst credential = new ManagedIdentityCredential(\n  process.env.MANAGED_IDENTITY_CLIENT_ID\n);\n```\n\n## 🔍 Debugging\n\n```typescript\n// Check if managed identity is available\ntry {\n  const token = await credential.getToken(\"https://vault.azure.net/.default\");\n  console.log(\"✓ Managed Identity working\");\n  console.log(`Expires: ${new Date(token.expiresOnTimestamp)}`);\n} catch (error) {\n  console.error(\"❌ Managed Identity not available:\", error.message);\n}\n```\n\n**Check environment variables:**\n```typescript\nconsole.log(\"MSI_ENDPOINT:\", process.env.MSI_ENDPOINT);\nconsole.log(\"IDENTITY_ENDPOINT:\", process.env.IDENTITY_ENDPOINT);\nconsole.log(\"WEBSITE_INSTANCE_ID:\", process.env.WEBSITE_INSTANCE_ID);\n```\n\n## 📖 Common Azure Service Scopes\n\n| Service | Scope |\n|---------|-------|\n| Key Vault | `https://vault.azure.net/.default` |\n| Storage | `https://storage.azure.com/.default` |\n| Azure Management | `https://management.azure.com/.default` |\n| SQL Database | `https://database.windows.net/.default` |\n| Event Hubs | `https://eventhubs.azure.net/.default` |\n| Service Bus | `https://servicebus.azure.net/.default` |\n\n## 🎯 Best Practices\n\n1. **Use DefaultAzureCredential** for local dev + Azure compatibility\n2. **Always grant least-privilege RBAC** roles\n3. **Prefer user-assigned identity** for shared scenarios\n4. **Handle token refresh automatically** (SDK does this)\n5. **Log but don't expose** token details\n6. **Test locally** with Azure CLI login\n7. **Validate managed identity** on app startup\n8. **Use environment-specific identities** for dev/staging/prod\n\n## 📚 Additional Resources\n\n- [Azure Identity SDK Docs](https://learn.microsoft.com/javascript/api/@azure/identity)\n- [Managed Identity Overview](https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)\n- [DefaultAzureCredential](https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential)\n\n## 🧪 Running the Examples\n\n```bash\n# Install dependencies\nnpm install\n\n# Run complete example\nnpm run dev\n\n# Or run specific examples\nnpx ts-node system-assigned-identity.ts\nnpx ts-node user-assigned-identity.ts\nnpx ts-node common-pitfalls.ts\n```\n\n## 📝 Environment Variables\n\n```bash\n# Optional: Specify user-assigned identity\nMANAGED_IDENTITY_CLIENT_ID=12345678-1234-1234-1234-123456789abc\n\n# Required: Azure resource URLs\nKEY_VAULT_URL=https://myvault.vault.azure.net\nSTORAGE_ACCOUNT_URL=https://mystorage.blob.core.windows.net\nCOSMOS_ENDPOINT=https://mycosmosdb.documents.azure.com:443/\n\n# Environment\nNODE_ENV=production\n```\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-skills-claude-sonnet-4.5-264280719\\README.md"}
```

## Copilot Response

I'll create comprehensive TypeScript examples showing how to use Managed Identity with Azure SDK clients. Let me create example files covering all the scenarios you mentioned.

I understand - it looks like there are content exclusion policies preventing file creation in this directory. Let me provide you with a comprehensive guide directly instead:

# Azure Managed Identity Authentication in Node.js/TypeScript

## 🔑 1. System-Assigned vs User-Assigned Managed Identity

### **System-Assigned Identity**
- **Lifecycle**: Tied to the Azure resource - deleted when resource is deleted
- **Scope**: Single resource only
- **Use When**: Single application, simple scenarios
- **Setup**: Azure Portal → Resource → Identity → System assigned: ON

### **User-Assigned Identity**
- **Lifecycle**: Independent resource - persists after resource deletion  
- **Scope**: Can be shared across multiple resources
- **Use When**: Shared identity, fine-grained access control, multiple resources
- **Setup**: Create identity first, then assign to resources

---

## 📝 2. Creating ManagedIdentityCredential

### **System-Assigned Identity**
```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// No parameters needed
const credential = new ManagedIdentityCredential();
```

### **User-Assigned Identity**
```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// Option 1: By Client ID (RECOMMENDED)
const clientId = "12345678-1234-1234-1234-123456789abc";
const credential = new ManagedIdentityCredential(clientId);

// Option 2: By Resource ID
const credential2 = new ManagedIdentityCredential({
  resourceId: "/subscriptions/{sub}/resourcegroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}"
});

// Option 3: Using options object
const credential3 = new ManagedIdentityCredential({ clientId });
```

---

## 🔧 3. Using with Azure SDK Clients

### **Key Vault**
```typescript
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new ManagedIdentityCredential();
const client = new SecretClient("https://myvault.vault.azure.net", credential);

const secret = await client.getSecret("database-password");
console.log(secret.value);
```

### **Blob Storage**
```typescript
import { BlobServiceClient } from "@azure/storage-blob";

const credential = new ManagedIdentityCredential();
const blobClient = new BlobServiceClient(
  "https://mystorageaccount.blob.core.windows.net",
  credential
);

const containerClient = blobClient.getContainerClient("my-container");
const blockBlobClient = containerClient.getBlockBlobClient("file.txt");
await blockBlobClient.upload("Hello World", 11);
```

### **Cosmos DB**
```typescript
import { CosmosClient } from "@azure/cosmos";

const credential = new ManagedIdentityCredential(clientId);
const cosmosClient = new CosmosClient({
  endpoint: "https://myaccount.documents.azure.com:443/",
  aadCredentials: credential
});

const database = cosmosClient.database("mydb");
const container = database.container("items");
const { resources } = await container.items.query("SELECT * FROM c").fetchAll();
```

---

## 🏠 4. Local Development Fallback Strategies

### **Strategy 1: DefaultAzureCredential (RECOMMENDED)**
```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Automatically tries: Environment → Workload Identity → Managed Identity → Azure CLI
const credential = new DefaultAzureCredential();

// Works in Azure AND locally (with az login)
const client = new SecretClient("https://vault.azure.net", credential);
```

### **Strategy 2: ChainedTokenCredential**
```typescript
import { 
  ChainedTokenCredential, 
  ManagedIdentityCredential, 
  AzureCliCredential 
} from "@azure/identity";

const credential = new ChainedTokenCredential(
  new ManagedIdentityCredential(),  // Try managed identity first (Azure)
  new AzureCliCredential()           // Fall back to Azure CLI (local)
);
```

### **Strategy 3: Environment-Based Selection**
```typescript
function createCredential() {
  const isAzure = process.env.WEBSITE_INSTANCE_ID || process.env.MSI_ENDPOINT;
  
  if (isAzure) {
    return new ManagedIdentityCredential();
  } else {
    return new AzureCliCredential();
  }
}
```

### **Local Setup**
```bash
# Login with Azure CLI
az login
az account set --subscription "Your Subscription"

# Now your app works locally!
npm run dev
```

---

## ⚠️ 5. Common Pitfalls & Error Handling

### **Pitfall 1: Managed Identity Not Enabled**
```typescript
try {
  const token = await credential.getToken("https://vault.azure.net/.default");
  console.log("✓ Managed Identity working");
} catch (error) {
  if (error.message?.includes("ManagedIdentityCredential")) {
    console.error("❌ Enable managed identity: az webapp identity assign");
  }
}
```

### **Pitfall 2: Missing RBAC Permissions**
```typescript
try {
  const secret = await client.getSecret("my-secret");
} catch (error) {
  if (error.statusCode === 403) {
    console.error(`
Fix: Grant access
az role assignment create \\
  --assignee <identity-object-id> \\
  --role "Key Vault Secrets User" \\
  --scope <vault-resource-id>
    `);
  }
}
```

### **Pitfall 3: Using Object ID Instead of Client ID**
```typescript
// ❌ WRONG: This is the Object ID
const credential = new ManagedIdentityCredential("a1b2c3d4-...");

// ✅ CORRECT: Use the Client ID (Application ID)
const credential = new ManagedIdentityCredential("12345678-1234-...");

// Find it: Azure Portal → Managed Identity → Properties → Client ID
```

### **Pitfall 4: Multiple User-Assigned Identities**
```typescript
// When resource has multiple identities, MUST specify which one
const credential = new ManagedIdentityCredential(
  process.env.MANAGED_IDENTITY_CLIENT_ID || throwError("CLIENT_ID required")
);
```

### **Comprehensive Error Handler**
```typescript
async function robustUsage(keyVaultUrl: string, clientId?: string) {
  const credential = clientId 
    ? new ManagedIdentityCredential(clientId)
    : new ManagedIdentityCredential();
  
  try {
    // Test credential first
    await credential.getToken("https://vault.azure.net/.default");
    
    const client = new SecretClient(keyVaultUrl, credential);
    return await client.getSecret("my-secret");
    
  } catch (error) {
    if (error.message?.includes("ManagedIdentityCredential")) {
      console.error("Enable identity: Azure Portal → Resource → Identity → ON");
    } else if (error.statusCode === 403) {
      console.error("Grant RBAC: az role assignment create...");
    } else if (error.message?.includes("IMDS")) {
      console.error("Not on Azure or IMDS unreachable");
    }
    throw error;
  }
}
```

---

## 🎯 Quick Setup Checklist

1. **Enable Managed Identity**
   ```bash
   az webapp identity assign --name myapp --resource-group myrg
   ```

2. **Grant RBAC Permissions**
   ```bash
   IDENTITY_ID=$(az webapp identity show --name myapp --resource-group myrg --query principalId -o tsv)
   az role assignment create --assignee $IDENTITY_ID --role "Key Vault Secrets User" --scope <vault-id>
   ```

3. **Use DefaultAzureCredential**
   ```typescript
   const credential = new DefaultAzureCredential();
   ```

4. **Test Locally**
   ```bash
   az login && npm run dev
   ```

## 📖 Common Azure Scopes

| Service | Scope |
|---------|-------|
| Key Vault | `https://vault.azure.net/.default` |
| Storage | `https://storage.azure.com/.default` |
| Azure Management | `https://management.azure.com/.default` |
| SQL Database | `https://database.windows.net/.default` |

This approach ensures your application works seamlessly in both Azure and local development environments!

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config azure-mcp-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
