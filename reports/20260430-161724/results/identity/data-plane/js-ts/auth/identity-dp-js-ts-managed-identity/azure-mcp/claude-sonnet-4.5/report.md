# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** azure-mcp/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 220.4s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | azure-mcp/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 220.4s |
| Timestamp | 2026-04-30T23:21:46Z |
| Files Generated | 0 |
| Event Count | 63 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 220.3s |
| **Total** | **220.4s** |

## Configuration

- **name:** azure-mcp/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=96060 out=18286 |
| Turn Count | 2 |

## Error

```
0 files generated despite 5 file-write tool attempts
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

The user wants to learn how to use Managed Identity to authenticate Azure SDK clients in Node.js, with comprehensive coverage including system-assigned vs user-assigned identity, local development fallback, and error handling.

This is a straightforward documentation/example request. I should:
1. Create TypeScript code examples showing both types of managed identities
2. Show how to use them with Azure SDK clients
3. Provide local development fallback strategies
4. Include error handling and common pitfalls

I'll create practical, runnable examples in the temp directory to demonstrate this comprehensively.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating managed identity examples"}
```

### 🔧 2. create

**Input:**

```json
{"file_text":"/**\n * System-Assigned Managed Identity Example\n * \n * System-assigned identities are tied to the lifecycle of the Azure resource.\n * When the resource is deleted, the identity is automatically deleted.\n */\n\nimport { ManagedIdentityCredential, DefaultAzureCredential } from \"@azure/identity\";\nimport { SecretClient } from \"@azure/keyvault-secrets\";\nimport { BlobServiceClient } from \"@azure/storage-blob\";\nimport { CosmosClient } from \"@azure/cosmos\";\n\n// ============================================================================\n// 1. BASIC SYSTEM-ASSIGNED MANAGED IDENTITY\n// ============================================================================\n\n/**\n * Creates a ManagedIdentityCredential for system-assigned identity.\n * No parameters needed - uses the identity attached to the Azure resource.\n */\nfunction createSystemAssignedCredential(): ManagedIdentityCredential {\n  return new ManagedIdentityCredential();\n}\n\n// ============================================================================\n// 2. USING WITH AZURE SDK CLIENTS\n// ============================================================================\n\n/**\n * Example: Using system-assigned identity with Key Vault\n */\nasync function accessKeyVaultWithSystemIdentity(): Promise\u003cvoid\u003e {\n  const credential = new ManagedIdentityCredential();\n  const vaultUrl = \"https://my-keyvault.vault.azure.net\";\n  \n  const client = new SecretClient(vaultUrl, credential);\n  \n  try {\n    const secret = await client.getSecret(\"my-secret-name\");\n    console.log(\"Secret retrieved:\", secret.name);\n    console.log(\"Secret value:\", secret.value);\n  } catch (error) {\n    console.error(\"Error accessing Key Vault:\", error);\n    throw error;\n  }\n}\n\n/**\n * Example: Using system-assigned identity with Blob Storage\n */\nasync function accessBlobStorageWithSystemIdentity(): Promise\u003cvoid\u003e {\n  const credential = new ManagedIdentityCredential();\n  const storageAccountUrl = \"https://mystorageaccount.blob.core.windows.net\";\n  \n  const blobServiceClient = new BlobServiceClient(\n    storageAccountUrl,\n    credential\n  );\n  \n  try {\n    const containerClient = blobServiceClient.getContainerClient(\"my-container\");\n    \n    // List blobs in the container\n    for await (const blob of containerClient.listBlobsFlat()) {\n      console.log(`Blob: ${blob.name}`);\n    }\n  } catch (error) {\n    console.error(\"Error accessing Blob Storage:\", error);\n    throw error;\n  }\n}\n\n/**\n * Example: Using system-assigned identity with Cosmos DB\n */\nasync function accessCosmosDBWithSystemIdentity(): Promise\u003cvoid\u003e {\n  const credential = new ManagedIdentityCredential();\n  const endpoint = \"https://mycosmosdb.documents.azure.com:443/\";\n  \n  const client = new CosmosClient({\n    endpoint,\n    aadCredentials: credential\n  });\n  \n  try {\n    const { database } = await client.databases.createIfNotExists({\n      id: \"my-database\"\n    });\n    console.log(\"Database accessed:\", database.id);\n  } catch (error) {\n    console.error(\"Error accessing Cosmos DB:\", error);\n    throw error;\n  }\n}\n\n// ============================================================================\n// 3. LOCAL DEVELOPMENT FALLBACK - DEFAULT AZURE CREDENTIAL\n// ============================================================================\n\n/**\n * DefaultAzureCredential provides automatic fallback for local development.\n * It tries credentials in this order:\n * 1. EnvironmentCredential (env variables)\n * 2. WorkloadIdentityCredential (Kubernetes)\n * 3. ManagedIdentityCredential (Azure resources)\n * 4. AzureCliCredential (local Azure CLI)\n * 5. AzurePowerShellCredential (local Azure PowerShell)\n * 6. AzureDeveloperCliCredential (local azd)\n */\nasync function useDefaultAzureCredential(): Promise\u003cvoid\u003e {\n  // This works both in Azure (managed identity) and locally (Azure CLI)\n  const credential = new DefaultAzureCredential();\n  const vaultUrl = \"https://my-keyvault.vault.azure.net\";\n  \n  const client = new SecretClient(vaultUrl, credential);\n  \n  try {\n    const secret = await client.getSecret(\"my-secret-name\");\n    console.log(\"Secret retrieved:\", secret.name);\n  } catch (error) {\n    console.error(\"Authentication failed:\", error);\n    throw error;\n  }\n}\n\n// ============================================================================\n// 4. MANUAL LOCAL DEVELOPMENT FALLBACK\n// ============================================================================\n\n/**\n * Manual fallback strategy - try managed identity first, then Azure CLI\n */\nasync function manualFallbackStrategy(): Promise\u003cvoid\u003e {\n  const { AzureCliCredential } = require(\"@azure/identity\");\n  \n  // Detect if running in Azure (common env variables)\n  const isRunningInAzure = \n    process.env.WEBSITE_INSTANCE_ID || // App Service\n    process.env.CONTAINER_APP_NAME ||  // Container Apps\n    process.env.FUNCTIONS_WORKER_RUNTIME; // Functions\n  \n  const credential = isRunningInAzure\n    ? new ManagedIdentityCredential()\n    : new AzureCliCredential();\n  \n  const vaultUrl = \"https://my-keyvault.vault.azure.net\";\n  const client = new SecretClient(vaultUrl, credential);\n  \n  try {\n    const secret = await client.getSecret(\"my-secret-name\");\n    console.log(\"Secret retrieved using:\", isRunningInAzure ? \"Managed Identity\" : \"Azure CLI\");\n  } catch (error) {\n    console.error(\"Authentication failed:\", error);\n    throw error;\n  }\n}\n\n// ============================================================================\n// 5. ERROR HANDLING AND COMMON PITFALLS\n// ============================================================================\n\n/**\n * Comprehensive error handling for managed identity\n */\nasync function robustManagedIdentityUsage(): Promise\u003cvoid\u003e {\n  const vaultUrl = \"https://my-keyvault.vault.azure.net\";\n  \n  try {\n    const credential = new ManagedIdentityCredential();\n    const client = new SecretClient(vaultUrl, credential);\n    \n    const secret = await client.getSecret(\"my-secret-name\");\n    console.log(\"Success:\", secret.name);\n    \n  } catch (error: any) {\n    // Handle specific error scenarios\n    if (error.code === \"ManagedIdentityCredential_Timeout\") {\n      console.error(\"Timeout: Managed identity endpoint not responding\");\n      console.error(\"Possible cause: Not running on Azure resource with managed identity enabled\");\n    } else if (error.code === \"CredentialUnavailable\") {\n      console.error(\"Managed identity not available\");\n      console.error(\"Ensure managed identity is enabled on your Azure resource\");\n    } else if (error.statusCode === 403) {\n      console.error(\"Access denied: Managed identity lacks required permissions\");\n      console.error(\"Grant appropriate RBAC role to the managed identity\");\n    } else if (error.statusCode === 404) {\n      console.error(\"Resource not found or managed identity lacks access\");\n    } else {\n      console.error(\"Unexpected error:\", error.message);\n      console.error(\"Full error:\", error);\n    }\n    \n    throw error;\n  }\n}\n\n/**\n * Testing managed identity availability\n */\nasync function testManagedIdentityAvailability(): Promise\u003cboolean\u003e {\n  try {\n    const credential = new ManagedIdentityCredential();\n    \n    // Try to get a token for Azure Resource Manager\n    const token = await credential.getToken(\"https://management.azure.com/.default\");\n    \n    if (token \u0026\u0026 token.token) {\n      console.log(\"✓ Managed identity is available and working\");\n      console.log(\"Token expires at:\", new Date(token.expiresOnTimestamp));\n      return true;\n    }\n    \n    return false;\n  } catch (error: any) {\n    console.log(\"✗ Managed identity is not available:\", error.message);\n    return false;\n  }\n}\n\n// ============================================================================\n// 6. COMMON PITFALLS\n// ============================================================================\n\n/**\n * PITFALL #1: Not enabling managed identity on the Azure resource\n * Solution: Enable it via Azure Portal, CLI, or ARM template\n */\n\n/**\n * PITFALL #2: Missing RBAC permissions\n * Solution: Assign appropriate role (e.g., \"Key Vault Secrets User\")\n * Example Azure CLI command:\n * \n * az role assignment create \\\n *   --assignee \u003cmanaged-identity-principal-id\u003e \\\n *   --role \"Key Vault Secrets User\" \\\n *   --scope /subscriptions/\u003csub-id\u003e/resourceGroups/\u003crg\u003e/providers/Microsoft.KeyVault/vaults/\u003cvault\u003e\n */\n\n/**\n * PITFALL #3: Using wrong endpoint in multi-cloud scenarios\n * Solution: Use DefaultAzureCredential with explicit options\n */\nfunction multiCloudCredential(): ManagedIdentityCredential {\n  return new ManagedIdentityCredential({\n    // For Azure Government\n    // authorityHost: \"https://login.microsoftonline.us\"\n    \n    // For Azure China\n    // authorityHost: \"https://login.chinacloudapi.cn\"\n  });\n}\n\n/**\n * PITFALL #4: Forgetting token caching\n * Good news: @azure/identity handles token caching automatically!\n * Tokens are cached and refreshed automatically before expiration.\n */\n\n/**\n * PITFALL #5: Long startup time on first request\n * Solution: Warm up the credential during app initialization\n */\nasync function warmUpCredential(credential: ManagedIdentityCredential): Promise\u003cvoid\u003e {\n  try {\n    console.log(\"Warming up managed identity credential...\");\n    await credential.getToken(\"https://management.azure.com/.default\");\n    console.log(\"Credential ready!\");\n  } catch (error) {\n    console.warn(\"Failed to warm up credential:\", error);\n  }\n}\n\n// ============================================================================\n// COMPLETE EXAMPLE: AZURE FUNCTION WITH SYSTEM-ASSIGNED IDENTITY\n// ============================================================================\n\ninterface HttpRequest {\n  query: { secretName?: string };\n}\n\ninterface HttpResponse {\n  status: number;\n  body: string;\n}\n\n/**\n * Azure Function example using system-assigned managed identity\n */\nexport async function httpTrigger(\n  context: any,\n  req: HttpRequest\n): Promise\u003cHttpResponse\u003e {\n  const secretName = req.query.secretName || \"default-secret\";\n  \n  try {\n    // Use DefaultAzureCredential for both Azure and local development\n    const credential = new DefaultAzureCredential();\n    const vaultUrl = process.env.KEY_VAULT_URL || \"https://my-keyvault.vault.azure.net\";\n    \n    const client = new SecretClient(vaultUrl, credential);\n    const secret = await client.getSecret(secretName);\n    \n    return {\n      status: 200,\n      body: JSON.stringify({\n        message: \"Secret retrieved successfully\",\n        secretName: secret.name,\n        // Never return the actual secret value in production!\n        hasValue: !!secret.value\n      })\n    };\n    \n  } catch (error: any) {\n    console.error(\"Error retrieving secret:\", error);\n    \n    return {\n      status: error.statusCode || 500,\n      body: JSON.stringify({\n        error: \"Failed to retrieve secret\",\n        message: error.message\n      })\n    };\n  }\n}\n\n// Export examples\nexport {\n  createSystemAssignedCredential,\n  accessKeyVaultWithSystemIdentity,\n  accessBlobStorageWithSystemIdentity,\n  accessCosmosDBWithSystemIdentity,\n  useDefaultAzureCredential,\n  manualFallbackStrategy,\n  robustManagedIdentityUsage,\n  testManagedIdentityAvailability,\n  warmUpCredential\n};\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-claude-sonnet-4.5-2340698639\\system-assigned-identity.ts"}
```

### 🔧 3. create

**Input:**

```json
{"file_text":"/**\n * User-Assigned Managed Identity Example\n * \n * User-assigned identities are standalone Azure resources that can be\n * assigned to multiple Azure resources and have an independent lifecycle.\n */\n\nimport { ManagedIdentityCredential, DefaultAzureCredential } from \"@azure/identity\";\nimport { SecretClient } from \"@azure/keyvault-secrets\";\nimport { BlobServiceClient } from \"@azure/storage-blob\";\n\n// ============================================================================\n// 1. BASIC USER-ASSIGNED MANAGED IDENTITY\n// ============================================================================\n\n/**\n * Creates a ManagedIdentityCredential using CLIENT ID\n * This is the most common way to specify user-assigned identity\n */\nfunction createUserAssignedCredentialByClientId(clientId: string): ManagedIdentityCredential {\n  return new ManagedIdentityCredential({\n    clientId: clientId  // The Application (client) ID of the managed identity\n  });\n}\n\n/**\n * Creates a ManagedIdentityCredential using RESOURCE ID\n * Use when you have the full Azure Resource Manager resource ID\n */\nfunction createUserAssignedCredentialByResourceId(resourceId: string): ManagedIdentityCredential {\n  return new ManagedIdentityCredential({\n    resourceId: resourceId\n    // Example: /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}\n  });\n}\n\n/**\n * Creates a ManagedIdentityCredential using OBJECT ID (Principal ID)\n * Less common, but useful in some scenarios\n */\nfunction createUserAssignedCredentialByObjectId(objectId: string): ManagedIdentityCredential {\n  return new ManagedIdentityCredential({\n    // Note: The SDK might not support objectId directly in all versions\n    // Use clientId instead when possible\n    clientId: objectId\n  });\n}\n\n// ============================================================================\n// 2. USING USER-ASSIGNED IDENTITY WITH AZURE SDK CLIENTS\n// ============================================================================\n\n/**\n * Example: Using user-assigned identity with Key Vault\n */\nasync function accessKeyVaultWithUserAssignedIdentity(): Promise\u003cvoid\u003e {\n  // Get the client ID from environment variable (recommended)\n  const clientId = process.env.MANAGED_IDENTITY_CLIENT_ID;\n  \n  if (!clientId) {\n    throw new Error(\"MANAGED_IDENTITY_CLIENT_ID environment variable not set\");\n  }\n  \n  const credential = new ManagedIdentityCredential({ clientId });\n  const vaultUrl = \"https://my-keyvault.vault.azure.net\";\n  \n  const client = new SecretClient(vaultUrl, credential);\n  \n  try {\n    const secret = await client.getSecret(\"my-secret-name\");\n    console.log(\"Secret retrieved:\", secret.name);\n    console.log(\"Using user-assigned identity:\", clientId);\n  } catch (error) {\n    console.error(\"Error accessing Key Vault:\", error);\n    throw error;\n  }\n}\n\n/**\n * Example: Multiple user-assigned identities on the same resource\n * Choose which identity to use based on the operation\n */\nasync function useMultipleUserAssignedIdentities(): Promise\u003cvoid\u003e {\n  // Different identities for different services\n  const keyVaultIdentityClientId = process.env.KEYVAULT_IDENTITY_CLIENT_ID!;\n  const storageIdentityClientId = process.env.STORAGE_IDENTITY_CLIENT_ID!;\n  \n  // Access Key Vault with one identity\n  const kvCredential = new ManagedIdentityCredential({ \n    clientId: keyVaultIdentityClientId \n  });\n  const kvClient = new SecretClient(\n    \"https://my-keyvault.vault.azure.net\", \n    kvCredential\n  );\n  \n  // Access Storage with another identity\n  const storageCredential = new ManagedIdentityCredential({ \n    clientId: storageIdentityClientId \n  });\n  const blobClient = new BlobServiceClient(\n    \"https://mystorageaccount.blob.core.windows.net\",\n    storageCredential\n  );\n  \n  try {\n    const secret = await kvClient.getSecret(\"my-secret\");\n    console.log(\"Secret retrieved with identity:\", keyVaultIdentityClientId);\n    \n    const containerClient = blobClient.getContainerClient(\"my-container\");\n    const exists = await containerClient.exists();\n    console.log(\"Container accessed with identity:\", storageIdentityClientId);\n  } catch (error) {\n    console.error(\"Error:\", error);\n    throw error;\n  }\n}\n\n// ============================================================================\n// 3. LOCAL DEVELOPMENT FALLBACK\n// ============================================================================\n\n/**\n * DefaultAzureCredential with user-assigned identity hint\n * Works in Azure with user-assigned identity, falls back to Azure CLI locally\n */\nasync function useDefaultWithUserAssignedHint(): Promise\u003cvoid\u003e {\n  const clientId = process.env.MANAGED_IDENTITY_CLIENT_ID;\n  \n  // If clientId is provided, DefaultAzureCredential will use it for managed identity\n  const credential = new DefaultAzureCredential({\n    managedIdentityClientId: clientId\n  });\n  \n  const vaultUrl = \"https://my-keyvault.vault.azure.net\";\n  const client = new SecretClient(vaultUrl, credential);\n  \n  try {\n    const secret = await client.getSecret(\"my-secret-name\");\n    console.log(\"Secret retrieved successfully\");\n  } catch (error) {\n    console.error(\"Authentication failed:\", error);\n    throw error;\n  }\n}\n\n/**\n * Environment-based credential selection\n * Uses user-assigned identity in Azure, Azure CLI locally\n */\nfunction createEnvironmentAwareCredential(): ManagedIdentityCredential | any {\n  const { AzureCliCredential } = require(\"@azure/identity\");\n  \n  const isRunningInAzure = \n    process.env.WEBSITE_INSTANCE_ID || \n    process.env.CONTAINER_APP_NAME ||\n    process.env.FUNCTIONS_WORKER_RUNTIME;\n  \n  if (isRunningInAzure) {\n    const clientId = process.env.MANAGED_IDENTITY_CLIENT_ID;\n    \n    if (!clientId) {\n      throw new Error(\n        \"Running in Azure but MANAGED_IDENTITY_CLIENT_ID not set. \" +\n        \"Set this environment variable to your user-assigned identity client ID.\"\n      );\n    }\n    \n    console.log(\"Using user-assigned managed identity:\", clientId);\n    return new ManagedIdentityCredential({ clientId });\n  } else {\n    console.log(\"Using Azure CLI credential for local development\");\n    return new AzureCliCredential();\n  }\n}\n\n// ============================================================================\n// 4. CONFIGURATION PATTERNS\n// ============================================================================\n\n/**\n * Configuration interface for managed identity\n */\ninterface ManagedIdentityConfig {\n  type: \"system-assigned\" | \"user-assigned\";\n  clientId?: string;\n  resourceId?: string;\n}\n\n/**\n * Factory function to create appropriate credential based on configuration\n */\nfunction createManagedIdentityFromConfig(\n  config: ManagedIdentityConfig\n): ManagedIdentityCredential {\n  if (config.type === \"system-assigned\") {\n    console.log(\"Creating system-assigned managed identity credential\");\n    return new ManagedIdentityCredential();\n  }\n  \n  if (config.type === \"user-assigned\") {\n    if (config.clientId) {\n      console.log(\"Creating user-assigned managed identity with client ID:\", config.clientId);\n      return new ManagedIdentityCredential({ clientId: config.clientId });\n    } else if (config.resourceId) {\n      console.log(\"Creating user-assigned managed identity with resource ID\");\n      return new ManagedIdentityCredential({ resourceId: config.resourceId });\n    } else {\n      throw new Error(\n        \"User-assigned identity requires either clientId or resourceId\"\n      );\n    }\n  }\n  \n  throw new Error(`Unknown identity type: ${config.type}`);\n}\n\n/**\n * Load configuration from environment variables\n */\nfunction loadManagedIdentityConfigFromEnv(): ManagedIdentityConfig {\n  const identityType = process.env.MANAGED_IDENTITY_TYPE || \"system-assigned\";\n  \n  if (identityType === \"user-assigned\") {\n    const clientId = process.env.MANAGED_IDENTITY_CLIENT_ID;\n    const resourceId = process.env.MANAGED_IDENTITY_RESOURCE_ID;\n    \n    if (!clientId \u0026\u0026 !resourceId) {\n      throw new Error(\n        \"User-assigned identity requires MANAGED_IDENTITY_CLIENT_ID \" +\n        \"or MANAGED_IDENTITY_RESOURCE_ID environment variable\"\n      );\n    }\n    \n    return {\n      type: \"user-assigned\",\n      clientId,\n      resourceId\n    };\n  }\n  \n  return { type: \"system-assigned\" };\n}\n\n// ============================================================================\n// 5. ERROR HANDLING SPECIFIC TO USER-ASSIGNED IDENTITY\n// ============================================================================\n\n/**\n * Comprehensive error handling for user-assigned managed identity\n */\nasync function robustUserAssignedIdentityUsage(): Promise\u003cvoid\u003e {\n  const clientId = process.env.MANAGED_IDENTITY_CLIENT_ID;\n  \n  if (!clientId) {\n    throw new Error(\n      \"MANAGED_IDENTITY_CLIENT_ID environment variable is required for user-assigned identity\"\n    );\n  }\n  \n  const vaultUrl = \"https://my-keyvault.vault.azure.net\";\n  \n  try {\n    const credential = new ManagedIdentityCredential({ clientId });\n    const client = new SecretClient(vaultUrl, credential);\n    \n    const secret = await client.getSecret(\"my-secret-name\");\n    console.log(\"Success:\", secret.name);\n    \n  } catch (error: any) {\n    if (error.code === \"ManagedIdentityCredential_Timeout\") {\n      console.error(\"Timeout: Managed identity endpoint not responding\");\n      console.error(\"Possible causes:\");\n      console.error(\"  - Not running on Azure resource with managed identity enabled\");\n      console.error(\"  - User-assigned identity not assigned to this resource\");\n      console.error(\"  - Incorrect client ID\");\n    } else if (error.code === \"CredentialUnavailable\") {\n      console.error(\"User-assigned managed identity not available\");\n      console.error(\"Ensure the identity is assigned to your Azure resource\");\n      console.error(\"Client ID used:\", clientId);\n    } else if (error.statusCode === 403) {\n      console.error(\"Access denied: User-assigned identity lacks required permissions\");\n      console.error(\"Grant appropriate RBAC role to the identity:\", clientId);\n    } else if (error.message?.includes(\"Invalid client ID\")) {\n      console.error(\"Invalid client ID format:\", clientId);\n      console.error(\"Client ID should be a GUID (e.g., 12345678-1234-1234-1234-123456789abc)\");\n    } else {\n      console.error(\"Unexpected error:\", error.message);\n      console.error(\"Full error:\", error);\n    }\n    \n    throw error;\n  }\n}\n\n/**\n * Validate user-assigned identity configuration\n */\nfunction validateUserAssignedIdentityConfig(clientId: string): void {\n  // Basic GUID format validation\n  const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;\n  \n  if (!guidPattern.test(clientId)) {\n    throw new Error(\n      `Invalid client ID format: ${clientId}. ` +\n      `Expected a GUID (e.g., 12345678-1234-1234-1234-123456789abc)`\n    );\n  }\n  \n  console.log(\"✓ Client ID format is valid\");\n}\n\n/**\n * Test user-assigned identity availability and configuration\n */\nasync function testUserAssignedIdentity(clientId: string): Promise\u003cboolean\u003e {\n  try {\n    validateUserAssignedIdentityConfig(clientId);\n    \n    const credential = new ManagedIdentityCredential({ clientId });\n    \n    // Try to get a token\n    const token = await credential.getToken(\"https://management.azure.com/.default\");\n    \n    if (token \u0026\u0026 token.token) {\n      console.log(\"✓ User-assigned managed identity is working\");\n      console.log(\"Client ID:\", clientId);\n      console.log(\"Token expires at:\", new Date(token.expiresOnTimestamp));\n      return true;\n    }\n    \n    return false;\n  } catch (error: any) {\n    console.log(\"✗ User-assigned managed identity test failed:\", error.message);\n    return false;\n  }\n}\n\n// ============================================================================\n// 6. COMMON PITFALLS (USER-ASSIGNED SPECIFIC)\n// ============================================================================\n\n/**\n * PITFALL #1: Using client ID of the wrong identity\n * Solution: Double-check the client ID in Azure Portal or using Azure CLI:\n * \n * az identity show --name \u003cidentity-name\u003e --resource-group \u003crg\u003e --query clientId -o tsv\n */\n\n/**\n * PITFALL #2: Identity not assigned to the Azure resource\n * Solution: Assign the user-assigned identity to your resource:\n * \n * For App Service:\n * az webapp identity assign \\\n *   --name \u003capp-name\u003e \\\n *   --resource-group \u003crg\u003e \\\n *   --identities /subscriptions/\u003csub\u003e/resourceGroups/\u003crg\u003e/providers/Microsoft.ManagedIdentity/userAssignedIdentities/\u003cname\u003e\n * \n * For VM:\n * az vm identity assign \\\n *   --name \u003cvm-name\u003e \\\n *   --resource-group \u003crg\u003e \\\n *   --identities /subscriptions/\u003csub\u003e/resourceGroups/\u003crg\u003e/providers/Microsoft.ManagedIdentity/userAssignedIdentities/\u003cname\u003e\n */\n\n/**\n * PITFALL #3: Multiple identities assigned but not specifying which to use\n * Solution: Always specify clientId when using user-assigned identity\n */\n\n/**\n * PITFALL #4: Confusing client ID with object ID (principal ID)\n * Solution: Use CLIENT ID (Application ID), not Object ID, with ManagedIdentityCredential\n */\n\n// ============================================================================\n// COMPLETE EXAMPLE: EXPRESS APP WITH USER-ASSIGNED IDENTITY\n// ============================================================================\n\nimport express from \"express\";\n\n/**\n * Express.js application using user-assigned managed identity\n */\nfunction createExpressApp(): express.Application {\n  const app = express();\n  \n  // Load identity configuration at startup\n  const identityConfig = loadManagedIdentityConfigFromEnv();\n  const credential = createManagedIdentityFromConfig(identityConfig);\n  \n  const vaultUrl = process.env.KEY_VAULT_URL || \"https://my-keyvault.vault.azure.net\";\n  const secretClient = new SecretClient(vaultUrl, credential);\n  \n  // Warm up the credential during startup\n  (async () =\u003e {\n    try {\n      console.log(\"Warming up managed identity credential...\");\n      await credential.getToken(\"https://management.azure.com/.default\");\n      console.log(\"✓ Credential ready\");\n    } catch (error) {\n      console.error(\"✗ Failed to initialize credential:\", error);\n    }\n  })();\n  \n  // Endpoint to retrieve a secret\n  app.get(\"/api/secrets/:name\", async (req, res) =\u003e {\n    const secretName = req.params.name;\n    \n    try {\n      const secret = await secretClient.getSecret(secretName);\n      \n      res.json({\n        success: true,\n        secretName: secret.name,\n        hasValue: !!secret.value,\n        identityType: identityConfig.type,\n        clientId: identityConfig.clientId\n      });\n    } catch (error: any) {\n      console.error(\"Error retrieving secret:\", error);\n      \n      res.status(error.statusCode || 500).json({\n        success: false,\n        error: error.message,\n        identityType: identityConfig.type\n      });\n    }\n  });\n  \n  // Health check endpoint\n  app.get(\"/health\", (req, res) =\u003e {\n    res.json({\n      status: \"healthy\",\n      identityType: identityConfig.type,\n      clientId: identityConfig.clientId || \"N/A\"\n    });\n  });\n  \n  return app;\n}\n\n// Start the Express app\nif (require.main === module) {\n  const app = createExpressApp();\n  const port = process.env.PORT || 3000;\n  \n  app.listen(port, () =\u003e {\n    console.log(`Server listening on port ${port}`);\n  });\n}\n\n// Export examples\nexport {\n  createUserAssignedCredentialByClientId,\n  createUserAssignedCredentialByResourceId,\n  createUserAssignedCredentialByObjectId,\n  accessKeyVaultWithUserAssignedIdentity,\n  useMultipleUserAssignedIdentities,\n  useDefaultWithUserAssignedHint,\n  createEnvironmentAwareCredential,\n  createManagedIdentityFromConfig,\n  loadManagedIdentityConfigFromEnv,\n  robustUserAssignedIdentityUsage,\n  validateUserAssignedIdentityConfig,\n  testUserAssignedIdentity,\n  createExpressApp\n};\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-claude-sonnet-4.5-2340698639\\user-assigned-identity.ts"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"/**\n * System-Assigned vs User-Assigned Managed Identity\n * Comparison, Best Practices, and Decision Guide\n */\n\nimport { ManagedIdentityCredential, DefaultAzureCredential } from \"@azure/identity\";\n\n// ============================================================================\n// COMPARISON: SYSTEM-ASSIGNED VS USER-ASSIGNED\n// ============================================================================\n\n/**\n * SYSTEM-ASSIGNED MANAGED IDENTITY\n * \n * Pros:\n * - Simpler to set up (no need to specify identity)\n * - Automatically created with the resource\n * - Automatically deleted when resource is deleted\n * - No separate Azure resource to manage\n * - Perfect for 1:1 resource-to-identity relationships\n * \n * Cons:\n * - Tied to the lifecycle of a single resource\n * - Cannot be shared across multiple resources\n * - Loses all permissions when resource is deleted\n * - Harder to pre-configure permissions before resource creation\n * - Cannot be created separately from the resource\n * \n * Use When:\n * - Single Azure resource needs its own identity\n * - Identity permissions are specific to that resource\n * - Resource lifecycle matches identity lifecycle\n * - Simplicity is preferred over flexibility\n */\nfunction createSystemAssignedExample() {\n  // No parameters needed - uses the identity attached to the resource\n  return new ManagedIdentityCredential();\n}\n\n/**\n * USER-ASSIGNED MANAGED IDENTITY\n * \n * Pros:\n * - Can be shared across multiple resources\n * - Independent lifecycle (survives resource deletion)\n * - Can be pre-created with permissions before assigning to resources\n * - Better for multi-resource scenarios\n * - Easier to rotate or update permissions centrally\n * - Can be used in disaster recovery scenarios\n * \n * Cons:\n * - Requires explicit client ID specification\n * - Additional Azure resource to manage\n * - Must be explicitly assigned to resources\n * - Slightly more complex configuration\n * \n * Use When:\n * - Multiple resources need the same identity\n * - Identity should persist beyond resource lifecycle\n * - Need to pre-configure permissions before resource creation\n * - Want to centrally manage identity permissions\n * - Implementing blue/green deployments\n */\nfunction createUserAssignedExample(clientId: string) {\n  return new ManagedIdentityCredential({ clientId });\n}\n\n// ============================================================================\n// DECISION MATRIX\n// ============================================================================\n\ninterface IdentityRequirements {\n  multipleResources: boolean;\n  persistBeyondResourceDeletion: boolean;\n  preConfigurePermissions: boolean;\n  simplicity: boolean;\n  blueGreenDeployment: boolean;\n}\n\nfunction recommendIdentityType(requirements: IdentityRequirements): string {\n  // User-assigned if any of these are true\n  if (\n    requirements.multipleResources ||\n    requirements.persistBeyondResourceDeletion ||\n    requirements.preConfigurePermissions ||\n    requirements.blueGreenDeployment\n  ) {\n    return \"user-assigned\";\n  }\n  \n  // System-assigned for simplicity\n  if (requirements.simplicity) {\n    return \"system-assigned\";\n  }\n  \n  // Default to system-assigned for single-resource scenarios\n  return \"system-assigned\";\n}\n\n// Example usage\nconst recommendation1 = recommendIdentityType({\n  multipleResources: false,\n  persistBeyondResourceDeletion: false,\n  preConfigurePermissions: false,\n  simplicity: true,\n  blueGreenDeployment: false\n});\nconsole.log(\"Recommendation:\", recommendation1); // \"system-assigned\"\n\nconst recommendation2 = recommendIdentityType({\n  multipleResources: true,\n  persistBeyondResourceDeletion: true,\n  preConfigurePermissions: true,\n  simplicity: false,\n  blueGreenDeployment: true\n});\nconsole.log(\"Recommendation:\", recommendation2); // \"user-assigned\"\n\n// ============================================================================\n// BEST PRACTICES\n// ============================================================================\n\n/**\n * BEST PRACTICE #1: Use DefaultAzureCredential for maximum flexibility\n * Works both in Azure and local development\n */\nfunction bestPracticeDefaultCredential() {\n  // Works with both system-assigned and user-assigned identities\n  // Falls back to Azure CLI for local development\n  const credential = new DefaultAzureCredential({\n    // Optional: Specify client ID if using user-assigned identity\n    managedIdentityClientId: process.env.MANAGED_IDENTITY_CLIENT_ID\n  });\n  \n  return credential;\n}\n\n/**\n * BEST PRACTICE #2: Store configuration in environment variables\n */\nconst MANAGED_IDENTITY_CONFIG = {\n  // Type of identity\n  type: process.env.MANAGED_IDENTITY_TYPE || \"system-assigned\",\n  \n  // Client ID for user-assigned identity\n  clientId: process.env.MANAGED_IDENTITY_CLIENT_ID,\n  \n  // Resource ID for user-assigned identity (alternative)\n  resourceId: process.env.MANAGED_IDENTITY_RESOURCE_ID\n} as const;\n\n/**\n * BEST PRACTICE #3: Create a credential factory function\n */\nfunction createCredential() {\n  if (MANAGED_IDENTITY_CONFIG.type === \"user-assigned\") {\n    if (MANAGED_IDENTITY_CONFIG.clientId) {\n      return new ManagedIdentityCredential({\n        clientId: MANAGED_IDENTITY_CONFIG.clientId\n      });\n    }\n    if (MANAGED_IDENTITY_CONFIG.resourceId) {\n      return new ManagedIdentityCredential({\n        resourceId: MANAGED_IDENTITY_CONFIG.resourceId\n      });\n    }\n    throw new Error(\n      \"User-assigned identity requires MANAGED_IDENTITY_CLIENT_ID or MANAGED_IDENTITY_RESOURCE_ID\"\n    );\n  }\n  \n  // Default to system-assigned\n  return new ManagedIdentityCredential();\n}\n\n/**\n * BEST PRACTICE #4: Implement proper error handling\n */\nasync function properErrorHandling() {\n  const credential = createCredential();\n  \n  try {\n    const token = await credential.getToken(\"https://management.azure.com/.default\");\n    return token;\n  } catch (error: any) {\n    // Log detailed error information\n    console.error(\"Managed Identity Error:\", {\n      message: error.message,\n      code: error.code,\n      statusCode: error.statusCode,\n      identityType: MANAGED_IDENTITY_CONFIG.type,\n      clientId: MANAGED_IDENTITY_CONFIG.clientId\n    });\n    \n    // Provide actionable error messages\n    if (error.code === \"CredentialUnavailable\") {\n      throw new Error(\n        \"Managed identity is not available. Ensure it is enabled on the Azure resource.\"\n      );\n    }\n    \n    if (error.statusCode === 403) {\n      throw new Error(\n        \"Access denied. Grant the required RBAC permissions to the managed identity.\"\n      );\n    }\n    \n    throw error;\n  }\n}\n\n/**\n * BEST PRACTICE #5: Warm up credentials during application startup\n */\nasync function warmUpCredentials(credential: ManagedIdentityCredential) {\n  const startTime = Date.now();\n  \n  try {\n    console.log(\"Warming up managed identity credential...\");\n    await credential.getToken(\"https://management.azure.com/.default\");\n    \n    const duration = Date.now() - startTime;\n    console.log(`✓ Credential warmed up in ${duration}ms`);\n    \n    return true;\n  } catch (error: any) {\n    console.error(\"✗ Failed to warm up credential:\", error.message);\n    return false;\n  }\n}\n\n/**\n * BEST PRACTICE #6: Implement retry logic for transient failures\n */\nasync function getTokenWithRetry(\n  credential: ManagedIdentityCredential,\n  scope: string,\n  maxRetries: number = 3\n): Promise\u003cany\u003e {\n  let lastError: Error | undefined;\n  \n  for (let attempt = 1; attempt \u003c= maxRetries; attempt++) {\n    try {\n      const token = await credential.getToken(scope);\n      return token;\n    } catch (error: any) {\n      lastError = error;\n      \n      // Only retry on transient errors\n      if (error.code === \"ManagedIdentityCredential_Timeout\" \u0026\u0026 attempt \u003c maxRetries) {\n        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff\n        console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms...`);\n        await new Promise(resolve =\u003e setTimeout(resolve, delay));\n        continue;\n      }\n      \n      // Don't retry on permanent errors\n      if (error.statusCode === 403 || error.statusCode === 404) {\n        throw error;\n      }\n    }\n  }\n  \n  throw lastError;\n}\n\n/**\n * BEST PRACTICE #7: Use least privilege principle\n * Grant only the minimum required permissions to the managed identity\n */\nconst RBAC_ROLES_BY_SERVICE = {\n  keyVault: [\n    \"Key Vault Secrets User\",      // Read secrets\n    \"Key Vault Secrets Officer\"    // Manage secrets\n  ],\n  storage: [\n    \"Storage Blob Data Reader\",    // Read blobs\n    \"Storage Blob Data Contributor\" // Read/write blobs\n  ],\n  cosmosDb: [\n    \"Cosmos DB Account Reader Role\", // Read account metadata\n    \"Cosmos DB Built-in Data Reader\" // Read data\n  ],\n  sql: [\n    \"SQL DB Contributor\",           // Manage databases\n    \"SQL Server Contributor\"        // Manage servers\n  ]\n};\n\n/**\n * BEST PRACTICE #8: Monitor managed identity usage\n */\ninterface IdentityUsageMetrics {\n  tokenRequests: number;\n  successfulAuths: number;\n  failedAuths: number;\n  lastUsed: Date;\n  averageTokenDuration: number;\n}\n\nclass ManagedIdentityMonitor {\n  private metrics: IdentityUsageMetrics = {\n    tokenRequests: 0,\n    successfulAuths: 0,\n    failedAuths: 0,\n    lastUsed: new Date(),\n    averageTokenDuration: 0\n  };\n  \n  async getTokenWithMonitoring(\n    credential: ManagedIdentityCredential,\n    scope: string\n  ) {\n    const startTime = Date.now();\n    this.metrics.tokenRequests++;\n    \n    try {\n      const token = await credential.getToken(scope);\n      \n      const duration = Date.now() - startTime;\n      this.metrics.successfulAuths++;\n      this.metrics.lastUsed = new Date();\n      this.metrics.averageTokenDuration = \n        (this.metrics.averageTokenDuration + duration) / 2;\n      \n      console.log(\"Token acquired successfully:\", {\n        duration: `${duration}ms`,\n        expiresAt: new Date(token.expiresOnTimestamp)\n      });\n      \n      return token;\n    } catch (error) {\n      this.metrics.failedAuths++;\n      console.error(\"Token acquisition failed:\", error);\n      throw error;\n    }\n  }\n  \n  getMetrics(): IdentityUsageMetrics {\n    return { ...this.metrics };\n  }\n  \n  logMetrics(): void {\n    console.log(\"Managed Identity Metrics:\", {\n      ...this.metrics,\n      successRate: `${(this.metrics.successfulAuths / this.metrics.tokenRequests * 100).toFixed(2)}%`\n    });\n  }\n}\n\n/**\n * BEST PRACTICE #9: Test locally before deploying\n */\nasync function testLocalDevelopmentSetup() {\n  console.log(\"Testing local development setup...\");\n  console.log(\"Current environment:\", {\n    isAzure: !!(process.env.WEBSITE_INSTANCE_ID || process.env.CONTAINER_APP_NAME),\n    hasAzureCli: await checkAzureCliAvailable(),\n    identityType: MANAGED_IDENTITY_CONFIG.type,\n    clientId: MANAGED_IDENTITY_CONFIG.clientId\n  });\n  \n  // Test DefaultAzureCredential\n  try {\n    const credential = new DefaultAzureCredential();\n    const token = await credential.getToken(\"https://management.azure.com/.default\");\n    console.log(\"✓ DefaultAzureCredential working\");\n    return true;\n  } catch (error) {\n    console.error(\"✗ DefaultAzureCredential failed:\", error);\n    return false;\n  }\n}\n\nasync function checkAzureCliAvailable(): Promise\u003cboolean\u003e {\n  try {\n    const { execSync } = require(\"child_process\");\n    execSync(\"az account show\", { stdio: \"ignore\" });\n    return true;\n  } catch {\n    return false;\n  }\n}\n\n/**\n * BEST PRACTICE #10: Document identity requirements\n */\nconst IDENTITY_DOCUMENTATION = {\n  service: \"MyApplication\",\n  identityType: \"user-assigned\",\n  clientId: \"12345678-1234-1234-1234-123456789abc\",\n  requiredPermissions: [\n    {\n      resource: \"Key Vault\",\n      role: \"Key Vault Secrets User\",\n      scope: \"/subscriptions/xxx/resourceGroups/xxx/providers/Microsoft.KeyVault/vaults/my-vault\"\n    },\n    {\n      resource: \"Storage Account\",\n      role: \"Storage Blob Data Reader\",\n      scope: \"/subscriptions/xxx/resourceGroups/xxx/providers/Microsoft.Storage/storageAccounts/my-storage\"\n    }\n  ],\n  assignedTo: [\n    \"App Service: my-app-prod\",\n    \"App Service: my-app-staging\"\n  ],\n  notes: [\n    \"This identity is shared between prod and staging\",\n    \"Permissions are read-only for security\",\n    \"Created on: 2024-01-15\",\n    \"Owner: Platform Team\"\n  ]\n};\n\n// ============================================================================\n// COMPLETE EXAMPLE: PRODUCTION-READY MANAGED IDENTITY USAGE\n// ============================================================================\n\nimport { SecretClient } from \"@azure/keyvault-secrets\";\n\nclass ManagedIdentityService {\n  private credential: ManagedIdentityCredential;\n  private monitor: ManagedIdentityMonitor;\n  private isWarmedUp: boolean = false;\n  \n  constructor() {\n    this.credential = createCredential();\n    this.monitor = new ManagedIdentityMonitor();\n  }\n  \n  async initialize(): Promise\u003cvoid\u003e {\n    console.log(\"Initializing Managed Identity Service...\");\n    this.isWarmedUp = await warmUpCredentials(this.credential);\n    \n    if (!this.isWarmedUp) {\n      console.warn(\"Warning: Failed to warm up credential\");\n    }\n  }\n  \n  async getKeyVaultSecret(vaultUrl: string, secretName: string): Promise\u003cstring\u003e {\n    const client = new SecretClient(vaultUrl, this.credential);\n    \n    try {\n      // Get token with monitoring\n      await this.monitor.getTokenWithMonitoring(\n        this.credential,\n        \"https://vault.azure.net/.default\"\n      );\n      \n      const secret = await client.getSecret(secretName);\n      \n      if (!secret.value) {\n        throw new Error(\"Secret value is empty\");\n      }\n      \n      return secret.value;\n    } catch (error: any) {\n      console.error(\"Failed to retrieve secret:\", {\n        vaultUrl,\n        secretName,\n        error: error.message\n      });\n      throw error;\n    }\n  }\n  \n  getHealthStatus() {\n    return {\n      initialized: this.isWarmedUp,\n      identityType: MANAGED_IDENTITY_CONFIG.type,\n      metrics: this.monitor.getMetrics()\n    };\n  }\n}\n\n// Export everything\nexport {\n  createSystemAssignedExample,\n  createUserAssignedExample,\n  recommendIdentityType,\n  bestPracticeDefaultCredential,\n  createCredential,\n  properErrorHandling,\n  warmUpCredentials,\n  getTokenWithRetry,\n  ManagedIdentityMonitor,\n  ManagedIdentityService,\n  testLocalDevelopmentSetup,\n  RBAC_ROLES_BY_SERVICE,\n  IDENTITY_DOCUMENTATION\n};\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-claude-sonnet-4.5-2340698639\\comparison-and-best-practices.ts"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-managed-identity-examples\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Comprehensive examples of using Azure Managed Identity with Node.js/TypeScript\",\n  \"main\": \"index.js\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"test\": \"echo \\\"No tests specified\\\" \u0026\u0026 exit 0\"\n  },\n  \"keywords\": [\n    \"azure\",\n    \"managed-identity\",\n    \"authentication\",\n    \"typescript\",\n    \"nodejs\"\n  ],\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.0.0\",\n    \"@azure/keyvault-secrets\": \"^4.8.0\",\n    \"@azure/storage-blob\": \"^12.17.0\",\n    \"@azure/cosmos\": \"^4.0.0\",\n    \"express\": \"^4.18.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.0.0\",\n    \"@types/express\": \"^4.17.0\",\n    \"typescript\": \"^5.0.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-claude-sonnet-4.5-2340698639\\package.json"}
```

### 🔧 6. create

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-azure-mcp-claude-sonnet-4.5-2340698639\\README.md"}
```

## Copilot Response

I'll create comprehensive TypeScript examples showing how to use Managed Identity with Azure SDK clients in Node.js.

I see the directory has content exclusion policies that are preventing file creation. Let me provide you with the comprehensive guide directly in the response instead:

## Azure Managed Identity Authentication in Node.js/TypeScript

### **1. System-Assigned vs User-Assigned Managed Identity**

**System-Assigned Identity:**
- ✅ Tied to a single Azure resource lifecycle
- ✅ Simpler setup (no client ID needed)
- ✅ Auto-deleted when resource is deleted
- ❌ Cannot be shared across resources
- **Use when:** Single resource needs its own unique identity

**User-Assigned Identity:**
- ✅ Can be shared across multiple resources
- ✅ Independent lifecycle (survives resource deletion)
- ✅ Pre-configurable before resource creation
- ❌ Requires client ID specification
- **Use when:** Multiple resources need same identity or blue/green deployments

---

### **2. Creating ManagedIdentityCredential**

#### **System-Assigned Identity:**
```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// No parameters needed
const credential = new ManagedIdentityCredential();
```

#### **User-Assigned Identity:**
```typescript
// Option 1: Using Client ID (most common)
const credential = new ManagedIdentityCredential({
  clientId: "12345678-1234-1234-1234-123456789abc"
});

// Option 2: Using Resource ID
const credential = new ManagedIdentityCredential({
  resourceId: "/subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}"
});

// Option 3: From environment variables
const credential = new ManagedIdentityCredential({
  clientId: process.env.MANAGED_IDENTITY_CLIENT_ID
});
```

---

### **3. Using with Azure SDK Clients**

```typescript
import { SecretClient } from "@azure/keyvault-secrets";
import { BlobServiceClient } from "@azure/storage-blob";
import { CosmosClient } from "@azure/cosmos";

// Key Vault
const kvClient = new SecretClient(
  "https://my-vault.vault.azure.net",
  credential
);
const secret = await kvClient.getSecret("my-secret");

// Blob Storage
const blobClient = new BlobServiceClient(
  "https://mystorageaccount.blob.core.windows.net",
  credential
);

// Cosmos DB
const cosmosClient = new CosmosClient({
  endpoint: "https://mycosmosdb.documents.azure.com:443/",
  aadCredentials: credential
});
```

---

### **4. Local Development Fallback Strategies**

#### **Strategy 1: DefaultAzureCredential (Recommended)**
```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Auto-fallback: Managed Identity → Azure CLI → Other methods
const credential = new DefaultAzureCredential({
  // Optional: Specify client ID for user-assigned identity
  managedIdentityClientId: process.env.MANAGED_IDENTITY_CLIENT_ID
});

const client = new SecretClient(vaultUrl, credential);
```

**Credential chain order:**
1. Environment variables
2. Workload Identity (Kubernetes)
3. **Managed Identity** (in Azure)
4. **Azure CLI** (local dev)
5. Azure PowerShell
6. Azure Developer CLI

#### **Strategy 2: Environment-Based Selection**
```typescript
import { ManagedIdentityCredential, AzureCliCredential } from "@azure/identity";

const isRunningInAzure = 
  process.env.WEBSITE_INSTANCE_ID ||      // App Service
  process.env.CONTAINER_APP_NAME ||       // Container Apps
  process.env.FUNCTIONS_WORKER_RUNTIME;   // Functions

const credential = isRunningInAzure
  ? new ManagedIdentityCredential({ 
      clientId: process.env.MANAGED_IDENTITY_CLIENT_ID 
    })
  : new AzureCliCredential();
```

#### **Strategy 3: Configuration Factory**
```typescript
function createCredential() {
  const identityType = process.env.MANAGED_IDENTITY_TYPE || "system-assigned";
  
  if (identityType === "user-assigned") {
    const clientId = process.env.MANAGED_IDENTITY_CLIENT_ID;
    if (!clientId) throw new Error("MANAGED_IDENTITY_CLIENT_ID required");
    return new ManagedIdentityCredential({ clientId });
  }
  
  return new ManagedIdentityCredential();
}
```

---

### **5. Common Pitfalls and Error Handling**

#### **Comprehensive Error Handling:**
```typescript
async function accessKeyVaultSafely() {
  try {
    const credential = new ManagedIdentityCredential();
    const client = new SecretClient(vaultUrl, credential);
    const secret = await client.getSecret("my-secret");
    
    return secret.value;
  } catch (error: any) {
    // Timeout - not running on Azure or identity not enabled
    if (error.code === "ManagedIdentityCredential_Timeout") {
      console.error("❌ Managed identity endpoint not responding");
      console.error("Ensure identity is enabled on your Azure resource");
    }
    
    // Identity not available
    else if (error.code === "CredentialUnavailable") {
      console.error("❌ Managed identity not available");
      console.error("Check: Identity enabled? Correct client ID?");
    }
    
    // Permission denied
    else if (error.statusCode === 403) {
      console.error("❌ Access denied - missing RBAC permissions");
      console.error("Grant 'Key Vault Secrets User' role to the identity");
    }
    
    // Invalid client ID format
    else if (error.message?.includes("Invalid client ID")) {
      console.error("❌ Invalid client ID format (must be GUID)");
    }
    
    else {
      console.error("❌ Unexpected error:", error.message);
    }
    
    throw error;
  }
}
```

#### **Common Pitfalls:**

**❌ Pitfall 1: Identity Not Enabled**
```bash
# Enable system-assigned identity
az webapp identity assign --name <app-name> --resource-group <rg>

# Assign user-assigned identity
az webapp identity assign \
  --name <app-name> \
  --resource-group <rg> \
  --identities <user-identity-resource-id>
```

**❌ Pitfall 2: Missing RBAC Permissions**
```bash
# Grant Key Vault access
az role assignment create \
  --assignee <identity-principal-id> \
  --role "Key Vault Secrets User" \
  --scope <key-vault-resource-id>
```

**❌ Pitfall 3: Wrong Client ID**
```bash
# Get correct client ID for user-assigned identity
az identity show \
  --name <identity-name> \
  --resource-group <rg> \
  --query clientId -o tsv
```

**❌ Pitfall 4: Not Testing Locally**
```bash
# Login with Azure CLI for local development
az login
az account set --subscription <subscription-id>
```

#### **Best Practices:**

**✅ Warm up credentials at startup:**
```typescript
async function warmUpCredential(credential: ManagedIdentityCredential) {
  try {
    await credential.getToken("https://management.azure.com/.default");
    console.log("✓ Credential ready");
  } catch (error) {
    console.warn("⚠ Failed to warm up credential");
  }
}
```

**✅ Implement retry logic:**
```typescript
async function getTokenWithRetry(credential, scope, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await credential.getToken(scope);
    } catch (error) {
      if (error.code === "ManagedIdentityCredential_Timeout" && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

**✅ Test identity availability:**
```typescript
async function testManagedIdentity(clientId?: string): Promise<boolean> {
  try {
    const credential = clientId 
      ? new ManagedIdentityCredential({ clientId })
      : new ManagedIdentityCredential();
    
    const token = await credential.getToken(
      "https://management.azure.com/.default"
    );
    
    console.log("✓ Identity working, expires:", new Date(token.expiresOnTimestamp));
    return true;
  } catch (error) {
    console.log("✗ Identity test failed:", error.message);
    return false;
  }
}
```

This covers the complete workflow for using Managed Identity in Node.js with TypeScript!

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config azure-mcp/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
