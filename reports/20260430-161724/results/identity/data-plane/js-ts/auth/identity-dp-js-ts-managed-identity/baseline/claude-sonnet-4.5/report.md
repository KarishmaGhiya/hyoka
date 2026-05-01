# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** baseline/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 208.5s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | baseline/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 208.5s |
| Timestamp | 2026-04-30T23:22:21Z |
| Files Generated | 0 |
| Event Count | 79 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 208.4s |
| **Total** | **208.5s** |

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
| Token Usage | in=64352 out=18236 |
| Turn Count | 2 |

## Error

```
0 files generated despite 8 file-write tool attempts
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

The user is asking for a comprehensive guide on using Managed Identity to authenticate Azure SDK clients in Node.js. This is a technical documentation request that requires me to create examples and explanations.

Let me break down what they want:
1. Explanation of system-assigned vs user-assigned managed identity
2. How to create ManagedIdentityCredential for each type
3. Using it with Azure SDK clients
4. Local development fallback strategies
5. Common pitfalls and error handling
6. TypeScript examples for both identity types

This seems like a task where I should create a comprehensive guide/documentation file with code examples. I'll create a TypeScript example file that demonstrates these concepts with detailed comments.

Let me create a structured response with:
- A main documentation/guide file
- Example TypeScript files showing both types of managed identities
- Error handling examples
- Local development fallback patterns

I'll use the create tool to make these files in the current directory.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Managed Identity examples"}
```

### 🔧 2. create

**Input:**

```json
{"file_text":"# Azure Managed Identity Authentication Guide for Node.js\n\n## Overview\n\nManaged Identity provides Azure services with an automatically managed identity in Azure Active Directory (AAD). This eliminates the need to store credentials in your code.\n\n## 1. System-Assigned vs User-Assigned Managed Identity\n\n### System-Assigned Managed Identity\n- **Lifecycle**: Tied to the Azure resource (e.g., VM, App Service)\n- **Creation**: Automatically created when enabled on the resource\n- **Deletion**: Automatically deleted when the resource is deleted\n- **Usage**: One identity per resource\n- **Best for**: Single-resource scenarios where identity doesn't need to be shared\n\n### User-Assigned Managed Identity\n- **Lifecycle**: Independent of Azure resources\n- **Creation**: Created as a standalone Azure resource\n- **Deletion**: Must be explicitly deleted\n- **Usage**: Can be assigned to multiple resources\n- **Best for**: Scenarios requiring identity sharing across resources or pre-provisioning identities\n\n## 2. Creating ManagedIdentityCredential\n\n### Installation\n\n```bash\nnpm install @azure/identity\n```\n\n### System-Assigned Identity\n\n```typescript\nimport { ManagedIdentityCredential } from '@azure/identity';\n\n// Simple - uses system-assigned identity\nconst credential = new ManagedIdentityCredential();\n```\n\n### User-Assigned Identity\n\n```typescript\nimport { ManagedIdentityCredential } from '@azure/identity';\n\n// Option 1: Using Client ID\nconst credential = new ManagedIdentityCredential({\n  clientId: \"your-user-assigned-identity-client-id\"\n});\n\n// Option 2: Using Resource ID (full ARM resource ID)\nconst credential = new ManagedIdentityCredential({\n  resourceId: \"/subscriptions/{sub-id}/resourcegroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{identity-name}\"\n});\n```\n\n## 3. Using with Azure SDK Clients\n\nSee the example files for complete implementations with various Azure services.\n\n## 4. Local Development Fallback Strategies\n\n### Strategy 1: DefaultAzureCredential (Recommended)\nFalls back through multiple authentication methods including Azure CLI, environment variables, and managed identity.\n\n### Strategy 2: ChainedTokenCredential\nManually chain credentials for explicit control over fallback order.\n\n### Strategy 3: Environment-Based Selection\nUse environment variables to switch between credential types.\n\n## 5. Common Pitfalls and Error Handling\n\n### Pitfall 1: Missing Role Assignments\n**Error**: `AuthorizationFailed` or `Forbidden`\n**Solution**: Ensure the managed identity has appropriate RBAC roles\n\n### Pitfall 2: Wrong Client ID\n**Error**: `ManagedIdentityCredential authentication failed`\n**Solution**: Verify the client ID matches your user-assigned identity\n\n### Pitfall 3: Local Development Without Fallback\n**Error**: `No managed identity endpoint found`\n**Solution**: Use DefaultAzureCredential or proper credential chaining\n\n### Pitfall 4: Token Expiration Not Handled\n**Solution**: Azure SDK automatically refreshes tokens, but ensure long-running operations handle credential refresh\n\n### Pitfall 5: Incorrect Resource/Scope\n**Solution**: Ensure you're requesting tokens for the correct Azure service scope\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-baseline-claude-sonnet-4.5-2632164801\\managed-identity-guide.md"}
```

### 🔧 3. create

**Input:**

```json
{"file_text":"/**\n * System-Assigned Managed Identity Example\n * \n * This example demonstrates using a system-assigned managed identity\n * to authenticate Azure SDK clients.\n */\n\nimport { ManagedIdentityCredential } from '@azure/identity';\nimport { BlobServiceClient } from '@azure/storage-blob';\nimport { SecretClient } from '@azure/keyvault-secrets';\nimport { CosmosClient } from '@azure/cosmos';\n\n/**\n * Example 1: Using system-assigned identity with Azure Blob Storage\n */\nexport async function useBlobStorageWithSystemIdentity(): Promise\u003cvoid\u003e {\n  try {\n    // Create credential - no parameters needed for system-assigned identity\n    const credential = new ManagedIdentityCredential();\n\n    // Create Azure Storage client\n    const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n    const blobServiceClient = new BlobServiceClient(\n      `https://${accountName}.blob.core.windows.net`,\n      credential\n    );\n\n    // Use the client\n    const containerClient = blobServiceClient.getContainerClient('mycontainer');\n    \n    console.log('Listing blobs...');\n    for await (const blob of containerClient.listBlobsFlat()) {\n      console.log(`- ${blob.name}`);\n    }\n\n    console.log('✓ Successfully authenticated with system-assigned identity');\n  } catch (error) {\n    handleAuthenticationError(error, 'system-assigned');\n  }\n}\n\n/**\n * Example 2: Using system-assigned identity with Azure Key Vault\n */\nexport async function useKeyVaultWithSystemIdentity(): Promise\u003cvoid\u003e {\n  try {\n    const credential = new ManagedIdentityCredential();\n\n    // Create Key Vault client\n    const vaultUrl = process.env.KEY_VAULT_URL || 'https://myvault.vault.azure.net';\n    const client = new SecretClient(vaultUrl, credential);\n\n    // Retrieve a secret\n    const secretName = 'my-secret';\n    const secret = await client.getSecret(secretName);\n    \n    console.log(`✓ Retrieved secret: ${secretName}`);\n    console.log(`  Secret value length: ${secret.value?.length || 0} characters`);\n  } catch (error) {\n    handleAuthenticationError(error, 'system-assigned');\n  }\n}\n\n/**\n * Example 3: Using system-assigned identity with Azure Cosmos DB\n */\nexport async function useCosmosDbWithSystemIdentity(): Promise\u003cvoid\u003e {\n  try {\n    const credential = new ManagedIdentityCredential();\n\n    // Create Cosmos DB client\n    const endpoint = process.env.COSMOS_ENDPOINT || 'https://mycosmosdb.documents.azure.com:443/';\n    const client = new CosmosClient({\n      endpoint,\n      aadCredentials: credential\n    });\n\n    // Use the client\n    const { databases } = await client.databases.readAll().fetchAll();\n    console.log(`✓ Connected to Cosmos DB. Found ${databases.length} databases`);\n  } catch (error) {\n    handleAuthenticationError(error, 'system-assigned');\n  }\n}\n\n/**\n * Example 4: Multiple Azure services with single credential instance\n * Best practice: Reuse credential instances\n */\nexport async function useMultipleServicesWithSystemIdentity(): Promise\u003cvoid\u003e {\n  // Create credential once\n  const credential = new ManagedIdentityCredential();\n\n  try {\n    // Use with multiple services\n    const storageAccountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n    const blobServiceClient = new BlobServiceClient(\n      `https://${storageAccountName}.blob.core.windows.net`,\n      credential\n    );\n\n    const vaultUrl = process.env.KEY_VAULT_URL || 'https://myvault.vault.azure.net';\n    const secretClient = new SecretClient(vaultUrl, credential);\n\n    // Perform operations\n    await Promise.all([\n      blobServiceClient.getContainerClient('test').exists(),\n      secretClient.getSecret('test-secret').catch(() =\u003e null)\n    ]);\n\n    console.log('✓ Successfully used system-assigned identity with multiple services');\n  } catch (error) {\n    handleAuthenticationError(error, 'system-assigned');\n  }\n}\n\n/**\n * Example 5: With explicit logging for troubleshooting\n */\nexport async function useWithLogging(): Promise\u003cvoid\u003e {\n  try {\n    const credential = new ManagedIdentityCredential({\n      // Enable logging for troubleshooting\n      loggingOptions: {\n        enableUncheckedCertificateChain: false,\n        allowLoggingAccountIdentifiers: true\n      }\n    });\n\n    const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n    const blobServiceClient = new BlobServiceClient(\n      `https://${accountName}.blob.core.windows.net`,\n      credential\n    );\n\n    const containerClient = blobServiceClient.getContainerClient('mycontainer');\n    const exists = await containerClient.exists();\n    \n    console.log(`✓ Container exists: ${exists}`);\n  } catch (error) {\n    handleAuthenticationError(error, 'system-assigned');\n  }\n}\n\n/**\n * Centralized error handling for authentication issues\n */\nfunction handleAuthenticationError(error: any, identityType: string): void {\n  console.error(`\\n❌ Authentication failed with ${identityType} identity\\n`);\n\n  if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {\n    console.error('Network Error: Cannot reach the service endpoint');\n    console.error('Check: Network connectivity and firewall rules');\n  } else if (error.statusCode === 403 || error.message?.includes('Forbidden')) {\n    console.error('Authorization Error: Identity lacks required permissions');\n    console.error('Check: RBAC role assignments for the managed identity');\n  } else if (error.message?.includes('ManagedIdentityCredential')) {\n    console.error('Identity Error: Managed identity not available or misconfigured');\n    console.error('Check:');\n    console.error('  1. Managed identity is enabled on the resource');\n    console.error('  2. Running on Azure (App Service, VM, Container Instance, etc.)');\n    console.error('  3. IDENTITY_ENDPOINT environment variable is set');\n  } else if (error.code === 'CredentialUnavailableError') {\n    console.error('Credential Unavailable: Not running in a managed identity environment');\n    console.error('Solution: Use DefaultAzureCredential for local development fallback');\n  } else {\n    console.error('Unexpected Error:', error.message);\n    console.error('Full error:', error);\n  }\n\n  throw error;\n}\n\n// Example usage\nif (require.main === module) {\n  (async () =\u003e {\n    console.log('=== System-Assigned Managed Identity Examples ===\\n');\n    \n    try {\n      await useBlobStorageWithSystemIdentity();\n    } catch (error) {\n      // Error already logged\n    }\n  })();\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-baseline-claude-sonnet-4.5-2632164801\\system-assigned-identity.ts"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"/**\n * User-Assigned Managed Identity Example\n * \n * This example demonstrates using a user-assigned managed identity\n * to authenticate Azure SDK clients.\n */\n\nimport { ManagedIdentityCredential } from '@azure/identity';\nimport { BlobServiceClient } from '@azure/storage-blob';\nimport { SecretClient } from '@azure/keyvault-secrets';\nimport { QueueServiceClient } from '@azure/storage-queue';\n\n/**\n * Example 1: Using user-assigned identity with Client ID (recommended)\n */\nexport async function useBlobStorageWithUserIdentity(): Promise\u003cvoid\u003e {\n  try {\n    // Get client ID from environment variable (best practice)\n    const clientId = process.env.USER_ASSIGNED_IDENTITY_CLIENT_ID;\n    \n    if (!clientId) {\n      throw new Error('USER_ASSIGNED_IDENTITY_CLIENT_ID environment variable is required');\n    }\n\n    // Create credential with client ID\n    const credential = new ManagedIdentityCredential({ clientId });\n\n    // Create Azure Storage client\n    const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n    const blobServiceClient = new BlobServiceClient(\n      `https://${accountName}.blob.core.windows.net`,\n      credential\n    );\n\n    // Use the client\n    const containerClient = blobServiceClient.getContainerClient('mycontainer');\n    const properties = await containerClient.getProperties();\n    \n    console.log(`✓ Successfully authenticated with user-assigned identity (Client ID)`);\n    console.log(`  Container: ${containerClient.containerName}`);\n    console.log(`  Last modified: ${properties.lastModified}`);\n  } catch (error) {\n    handleAuthenticationError(error, 'user-assigned');\n  }\n}\n\n/**\n * Example 2: Using user-assigned identity with Resource ID\n */\nexport async function useKeyVaultWithResourceId(): Promise\u003cvoid\u003e {\n  try {\n    // Full ARM resource ID of the user-assigned identity\n    const resourceId = process.env.USER_ASSIGNED_IDENTITY_RESOURCE_ID;\n    \n    if (!resourceId) {\n      throw new Error('USER_ASSIGNED_IDENTITY_RESOURCE_ID environment variable is required');\n    }\n\n    // Create credential with resource ID\n    const credential = new ManagedIdentityCredential({ resourceId });\n\n    // Create Key Vault client\n    const vaultUrl = process.env.KEY_VAULT_URL || 'https://myvault.vault.azure.net';\n    const client = new SecretClient(vaultUrl, credential);\n\n    // List secrets\n    console.log('Listing secrets in Key Vault...');\n    const secretsIterator = client.listPropertiesOfSecrets();\n    \n    let count = 0;\n    for await (const secretProperties of secretsIterator) {\n      console.log(`  - ${secretProperties.name}`);\n      count++;\n    }\n    \n    console.log(`✓ Successfully listed ${count} secrets with user-assigned identity (Resource ID)`);\n  } catch (error) {\n    handleAuthenticationError(error, 'user-assigned');\n  }\n}\n\n/**\n * Example 3: Multiple user-assigned identities on same resource\n * When a resource has multiple user-assigned identities, you must specify which one to use\n */\nexport async function useMultipleUserAssignedIdentities(): Promise\u003cvoid\u003e {\n  // Scenario: Resource has two user-assigned identities\n  // - One for storage access\n  // - One for Key Vault access\n\n  const storageIdentityClientId = process.env.STORAGE_IDENTITY_CLIENT_ID;\n  const keyVaultIdentityClientId = process.env.KEYVAULT_IDENTITY_CLIENT_ID;\n\n  if (!storageIdentityClientId || !keyVaultIdentityClientId) {\n    throw new Error('Both STORAGE_IDENTITY_CLIENT_ID and KEYVAULT_IDENTITY_CLIENT_ID are required');\n  }\n\n  try {\n    // Create separate credentials for each identity\n    const storageCredential = new ManagedIdentityCredential({ \n      clientId: storageIdentityClientId \n    });\n    \n    const keyVaultCredential = new ManagedIdentityCredential({ \n      clientId: keyVaultIdentityClientId \n    });\n\n    // Use appropriate identity for each service\n    const storageAccountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n    const blobServiceClient = new BlobServiceClient(\n      `https://${storageAccountName}.blob.core.windows.net`,\n      storageCredential\n    );\n\n    const queueServiceClient = new QueueServiceClient(\n      `https://${storageAccountName}.queue.core.windows.net`,\n      storageCredential\n    );\n\n    const vaultUrl = process.env.KEY_VAULT_URL || 'https://myvault.vault.azure.net';\n    const secretClient = new SecretClient(vaultUrl, keyVaultCredential);\n\n    // Perform operations with appropriate identities\n    await Promise.all([\n      blobServiceClient.getContainerClient('test').exists(),\n      queueServiceClient.getQueueClient('test').exists(),\n      secretClient.getSecret('test-secret').catch(() =\u003e null)\n    ]);\n\n    console.log('✓ Successfully used multiple user-assigned identities');\n  } catch (error) {\n    handleAuthenticationError(error, 'user-assigned');\n  }\n}\n\n/**\n * Example 4: Dynamic identity selection based on environment\n */\nexport async function useDynamicIdentitySelection(): Promise\u003cvoid\u003e {\n  const environment = process.env.ENVIRONMENT || 'dev';\n\n  // Different identities for different environments\n  const identityConfig = {\n    dev: process.env.DEV_IDENTITY_CLIENT_ID,\n    staging: process.env.STAGING_IDENTITY_CLIENT_ID,\n    prod: process.env.PROD_IDENTITY_CLIENT_ID\n  };\n\n  const clientId = identityConfig[environment as keyof typeof identityConfig];\n\n  if (!clientId) {\n    throw new Error(`No identity configured for environment: ${environment}`);\n  }\n\n  try {\n    const credential = new ManagedIdentityCredential({ clientId });\n\n    const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n    const blobServiceClient = new BlobServiceClient(\n      `https://${accountName}.blob.core.windows.net`,\n      credential\n    );\n\n    const containerClient = blobServiceClient.getContainerClient('mycontainer');\n    await containerClient.exists();\n\n    console.log(`✓ Successfully authenticated with ${environment} identity`);\n    console.log(`  Client ID: ${clientId.substring(0, 8)}...`);\n  } catch (error) {\n    handleAuthenticationError(error, 'user-assigned');\n  }\n}\n\n/**\n * Example 5: With retry logic for transient failures\n */\nexport async function useWithRetryLogic(): Promise\u003cvoid\u003e {\n  const clientId = process.env.USER_ASSIGNED_IDENTITY_CLIENT_ID;\n  \n  if (!clientId) {\n    throw new Error('USER_ASSIGNED_IDENTITY_CLIENT_ID environment variable is required');\n  }\n\n  const credential = new ManagedIdentityCredential({ clientId });\n\n  // Retry configuration\n  const maxRetries = 3;\n  const retryDelayMs = 1000;\n\n  for (let attempt = 1; attempt \u003c= maxRetries; attempt++) {\n    try {\n      const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n      const blobServiceClient = new BlobServiceClient(\n        `https://${accountName}.blob.core.windows.net`,\n        credential\n      );\n\n      const containerClient = blobServiceClient.getContainerClient('mycontainer');\n      await containerClient.exists();\n\n      console.log(`✓ Successfully authenticated on attempt ${attempt}`);\n      return;\n    } catch (error: any) {\n      console.log(`  Attempt ${attempt}/${maxRetries} failed`);\n\n      // Don't retry on authorization errors (403) - these won't fix themselves\n      if (error.statusCode === 403) {\n        console.error('❌ Authorization error - retrying won\\'t help');\n        throw error;\n      }\n\n      // Don't retry on invalid identity errors\n      if (error.message?.includes('invalid')) {\n        console.error('❌ Invalid identity - retrying won\\'t help');\n        throw error;\n      }\n\n      if (attempt === maxRetries) {\n        console.error(`❌ All ${maxRetries} attempts failed`);\n        throw error;\n      }\n\n      // Wait before retrying\n      console.log(`  Waiting ${retryDelayMs}ms before retry...`);\n      await new Promise(resolve =\u003e setTimeout(resolve, retryDelayMs * attempt));\n    }\n  }\n}\n\n/**\n * Example 6: Validating user-assigned identity configuration\n */\nexport async function validateUserAssignedIdentityConfig(): Promise\u003cboolean\u003e {\n  console.log('Validating user-assigned identity configuration...\\n');\n\n  const clientId = process.env.USER_ASSIGNED_IDENTITY_CLIENT_ID;\n  const resourceId = process.env.USER_ASSIGNED_IDENTITY_RESOURCE_ID;\n\n  // Check if identity is configured\n  if (!clientId \u0026\u0026 !resourceId) {\n    console.error('❌ No user-assigned identity configured');\n    console.error('   Set either USER_ASSIGNED_IDENTITY_CLIENT_ID or USER_ASSIGNED_IDENTITY_RESOURCE_ID');\n    return false;\n  }\n\n  console.log('✓ Identity configuration found:');\n  if (clientId) {\n    console.log(`  Client ID: ${clientId.substring(0, 8)}...${clientId.substring(clientId.length - 4)}`);\n  }\n  if (resourceId) {\n    console.log(`  Resource ID: ${resourceId}`);\n  }\n\n  // Try to get a token to validate the identity\n  try {\n    const credential = new ManagedIdentityCredential(\n      clientId ? { clientId } : { resourceId: resourceId! }\n    );\n\n    // Request a token for Azure Storage scope\n    const token = await credential.getToken('https://storage.azure.com/.default');\n    \n    console.log('\\n✓ Successfully obtained token');\n    console.log(`  Token expires at: ${new Date(token.expiresOnTimestamp).toISOString()}`);\n    console.log(`  Token valid for: ${Math.round((token.expiresOnTimestamp - Date.now()) / 1000 / 60)} minutes`);\n    \n    return true;\n  } catch (error: any) {\n    console.error('\\n❌ Failed to obtain token');\n    console.error(`   Error: ${error.message}`);\n    return false;\n  }\n}\n\n/**\n * Centralized error handling for authentication issues\n */\nfunction handleAuthenticationError(error: any, identityType: string): void {\n  console.error(`\\n❌ Authentication failed with ${identityType} identity\\n`);\n\n  if (error.message?.includes('client_id')) {\n    console.error('Client ID Error: Invalid or missing client ID');\n    console.error('Check:');\n    console.error('  1. USER_ASSIGNED_IDENTITY_CLIENT_ID is set correctly');\n    console.error('  2. Client ID matches your user-assigned identity');\n    console.error('  3. Identity is assigned to this resource');\n  } else if (error.message?.includes('resource_id')) {\n    console.error('Resource ID Error: Invalid or missing resource ID');\n    console.error('Check: USER_ASSIGNED_IDENTITY_RESOURCE_ID format');\n    console.error('Format: /subscriptions/{sub}/resourcegroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}');\n  } else if (error.statusCode === 403 || error.message?.includes('Forbidden')) {\n    console.error('Authorization Error: Identity lacks required permissions');\n    console.error('Check:');\n    console.error('  1. User-assigned identity has appropriate RBAC roles');\n    console.error('  2. Role assignments are applied to correct resources');\n    console.error('  3. Propagation delay (can take 5-10 minutes)');\n  } else if (error.message?.includes('ManagedIdentityCredential')) {\n    console.error('Identity Error: User-assigned identity not available');\n    console.error('Check:');\n    console.error('  1. User-assigned identity exists in Azure');\n    console.error('  2. Identity is assigned to this resource');\n    console.error('  3. Running on Azure (App Service, VM, Container Instance, etc.)');\n  } else {\n    console.error('Unexpected Error:', error.message);\n    console.error('Full error:', error);\n  }\n\n  throw error;\n}\n\n// Example usage\nif (require.main === module) {\n  (async () =\u003e {\n    console.log('=== User-Assigned Managed Identity Examples ===\\n');\n    \n    // Validate configuration first\n    const isValid = await validateUserAssignedIdentityConfig();\n    \n    if (isValid) {\n      console.log('\\n---\\n');\n      await useBlobStorageWithUserIdentity();\n    }\n  })();\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-baseline-claude-sonnet-4.5-2632164801\\user-assigned-identity.ts"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"/**\n * Local Development Fallback Strategies\n * \n * This file demonstrates different strategies for handling authentication\n * in both Azure (with managed identity) and local development environments.\n */\n\nimport {\n  ManagedIdentityCredential,\n  DefaultAzureCredential,\n  ChainedTokenCredential,\n  AzureCliCredential,\n  EnvironmentCredential,\n  TokenCredential\n} from '@azure/identity';\nimport { BlobServiceClient } from '@azure/storage-blob';\nimport { SecretClient } from '@azure/keyvault-secrets';\n\n/**\n * Strategy 1: DefaultAzureCredential (RECOMMENDED)\n * \n * Tries multiple authentication methods in order:\n * 1. EnvironmentCredential (env vars: AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)\n * 2. WorkloadIdentityCredential (Kubernetes)\n * 3. ManagedIdentityCredential (Azure resources)\n * 4. AzureCliCredential (az login)\n * 5. AzurePowerShellCredential (Connect-AzAccount)\n * \n * This is the recommended approach for most scenarios.\n */\nexport async function useDefaultAzureCredential(): Promise\u003cvoid\u003e {\n  console.log('Strategy 1: DefaultAzureCredential\\n');\n\n  try {\n    // Simple - works in Azure AND local development\n    const credential = new DefaultAzureCredential();\n\n    const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n    const blobServiceClient = new BlobServiceClient(\n      `https://${accountName}.blob.core.windows.net`,\n      credential\n    );\n\n    const containerClient = blobServiceClient.getContainerClient('mycontainer');\n    const exists = await containerClient.exists();\n\n    console.log('✓ Authentication successful with DefaultAzureCredential');\n    console.log(`  Container exists: ${exists}`);\n    console.log('  This works in both Azure and local development!');\n  } catch (error: any) {\n    console.error('❌ Authentication failed');\n    console.error(`  Error: ${error.message}`);\n    console.error('\\nLocal development setup:');\n    console.error('  Run: az login');\n    console.error('  Or set environment variables: AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET');\n  }\n}\n\n/**\n * Strategy 2: ChainedTokenCredential with Custom Order\n * \n * Gives you explicit control over the authentication fallback chain.\n * Useful when you want specific behavior or need to debug authentication flow.\n */\nexport async function useChainedTokenCredential(): Promise\u003cvoid\u003e {\n  console.log('Strategy 2: ChainedTokenCredential\\n');\n\n  try {\n    // User-assigned identity in Azure\n    const userAssignedClientId = process.env.USER_ASSIGNED_IDENTITY_CLIENT_ID;\n    \n    // Create credential chain with explicit order\n    const credential = new ChainedTokenCredential(\n      // 1. Try environment variables first (for CI/CD pipelines)\n      new EnvironmentCredential(),\n      \n      // 2. Try user-assigned managed identity if client ID is provided\n      ...(userAssignedClientId \n        ? [new ManagedIdentityCredential({ clientId: userAssignedClientId })]\n        : []),\n      \n      // 3. Try system-assigned managed identity\n      new ManagedIdentityCredential(),\n      \n      // 4. Fall back to Azure CLI (for local development)\n      new AzureCliCredential()\n    );\n\n    const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n    const blobServiceClient = new BlobServiceClient(\n      `https://${accountName}.blob.core.windows.net`,\n      credential\n    );\n\n    const containerClient = blobServiceClient.getContainerClient('mycontainer');\n    await containerClient.exists();\n\n    console.log('✓ Authentication successful with ChainedTokenCredential');\n    console.log('  Credential chain tried in order:');\n    console.log('    1. Environment variables');\n    if (userAssignedClientId) {\n      console.log('    2. User-assigned managed identity');\n      console.log('    3. System-assigned managed identity');\n      console.log('    4. Azure CLI');\n    } else {\n      console.log('    2. System-assigned managed identity');\n      console.log('    3. Azure CLI');\n    }\n  } catch (error: any) {\n    console.error('❌ All credential sources failed');\n    console.error(`  Error: ${error.message}`);\n  }\n}\n\n/**\n * Strategy 3: Environment-Based Selection\n * \n * Explicitly choose credential type based on environment.\n * Good for scenarios where you want different behavior per environment.\n */\nexport function createCredentialForEnvironment(): TokenCredential {\n  const environment = process.env.NODE_ENV || 'development';\n  const isAzure = process.env.WEBSITE_INSTANCE_ID || process.env.IDENTITY_ENDPOINT;\n\n  console.log(`Creating credential for environment: ${environment}`);\n  console.log(`Running in Azure: ${!!isAzure}\\n`);\n\n  if (isAzure) {\n    // Running in Azure - use managed identity\n    const clientId = process.env.USER_ASSIGNED_IDENTITY_CLIENT_ID;\n    \n    if (clientId) {\n      console.log('→ Using user-assigned managed identity');\n      return new ManagedIdentityCredential({ clientId });\n    } else {\n      console.log('→ Using system-assigned managed identity');\n      return new ManagedIdentityCredential();\n    }\n  } else {\n    // Local development\n    if (environment === 'development') {\n      console.log('→ Using Azure CLI credential (local development)');\n      return new AzureCliCredential();\n    } else {\n      // CI/CD or other non-Azure environments\n      console.log('→ Using environment credential (CI/CD)');\n      return new EnvironmentCredential();\n    }\n  }\n}\n\nexport async function useEnvironmentBasedCredential(): Promise\u003cvoid\u003e {\n  console.log('Strategy 3: Environment-Based Selection\\n');\n\n  try {\n    const credential = createCredentialForEnvironment();\n\n    const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n    const blobServiceClient = new BlobServiceClient(\n      `https://${accountName}.blob.core.windows.net`,\n      credential\n    );\n\n    const containerClient = blobServiceClient.getContainerClient('mycontainer');\n    await containerClient.exists();\n\n    console.log('\\n✓ Authentication successful');\n  } catch (error: any) {\n    console.error('\\n❌ Authentication failed');\n    console.error(`  Error: ${error.message}`);\n  }\n}\n\n/**\n * Strategy 4: Graceful Degradation with Feature Flags\n * \n * Use managed identity in Azure, but allow disabling for testing.\n */\nexport async function useWithFeatureFlags(): Promise\u003cvoid\u003e {\n  console.log('Strategy 4: Graceful Degradation with Feature Flags\\n');\n\n  const useManagedIdentity = process.env.USE_MANAGED_IDENTITY !== 'false';\n  const useAzureCli = process.env.USE_AZURE_CLI === 'true';\n\n  try {\n    let credential: TokenCredential;\n\n    if (useManagedIdentity) {\n      console.log('→ Managed Identity: ENABLED');\n      credential = new DefaultAzureCredential();\n    } else if (useAzureCli) {\n      console.log('→ Azure CLI: ENABLED');\n      credential = new AzureCliCredential();\n    } else {\n      console.log('→ Environment Variables: ENABLED');\n      credential = new EnvironmentCredential();\n    }\n\n    const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n    const blobServiceClient = new BlobServiceClient(\n      `https://${accountName}.blob.core.windows.net`,\n      credential\n    );\n\n    const containerClient = blobServiceClient.getContainerClient('mycontainer');\n    await containerClient.exists();\n\n    console.log('\\n✓ Authentication successful');\n  } catch (error: any) {\n    console.error('\\n❌ Authentication failed');\n    console.error(`  Error: ${error.message}`);\n  }\n}\n\n/**\n * Strategy 5: With Comprehensive Error Handling and Logging\n */\nexport async function useWithDetailedLogging(): Promise\u003cvoid\u003e {\n  console.log('Strategy 5: Comprehensive Error Handling\\n');\n\n  try {\n    // Enable logging for troubleshooting\n    const credential = new DefaultAzureCredential({\n      loggingOptions: {\n        allowLoggingAccountIdentifiers: true\n      }\n    });\n\n    console.log('Attempting authentication...');\n\n    const vaultUrl = process.env.KEY_VAULT_URL || 'https://myvault.vault.azure.net';\n    const client = new SecretClient(vaultUrl, credential);\n\n    // Try to get a secret\n    const secretName = 'test-secret';\n    console.log(`  Retrieving secret: ${secretName}`);\n    \n    try {\n      const secret = await client.getSecret(secretName);\n      console.log('✓ Successfully retrieved secret');\n      console.log(`  Secret version: ${secret.properties.version}`);\n    } catch (secretError: any) {\n      if (secretError.statusCode === 404) {\n        console.log(`  Secret '${secretName}' not found (404)`);\n        console.log('✓ Authentication worked, but secret doesn\\'t exist');\n      } else {\n        throw secretError;\n      }\n    }\n  } catch (error: any) {\n    console.error('❌ Authentication or authorization failed\\n');\n    \n    // Detailed error diagnosis\n    if (error.code === 'CredentialUnavailableError') {\n      console.error('Problem: No credentials available');\n      console.error('\\nSolutions:');\n      console.error('  Azure:');\n      console.error('    - Enable managed identity on your resource');\n      console.error('    - Verify IDENTITY_ENDPOINT environment variable');\n      console.error('  Local:');\n      console.error('    - Run: az login');\n      console.error('    - Or set: AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET');\n    } else if (error.statusCode === 403) {\n      console.error('Problem: Insufficient permissions');\n      console.error('\\nSolutions:');\n      console.error('  1. Verify RBAC role assignments');\n      console.error('  2. Check if permissions have propagated (5-10 min delay)');\n      console.error('  3. Ensure correct scope (subscription, resource group, resource)');\n    } else if (error.code === 'ENOTFOUND') {\n      console.error('Problem: Cannot reach service endpoint');\n      console.error('\\nSolutions:');\n      console.error('  1. Check network connectivity');\n      console.error('  2. Verify service endpoint URL');\n      console.error('  3. Check firewall rules');\n    } else {\n      console.error(`Error: ${error.message}`);\n      console.error('\\nFull error:', error);\n    }\n  }\n}\n\n/**\n * Helper: Detect if running in Azure\n */\nexport function isRunningInAzure(): boolean {\n  return !!(\n    process.env.WEBSITE_INSTANCE_ID ||        // App Service\n    process.env.IDENTITY_ENDPOINT ||          // Managed Identity\n    process.env.AZURE_CLIENT_ID ||            // Container Apps\n    process.env.MSI_ENDPOINT                  // Legacy\n  );\n}\n\n/**\n * Helper: Get recommended credential for current environment\n */\nexport function getRecommendedCredential(): {\n  credential: TokenCredential;\n  description: string;\n} {\n  if (isRunningInAzure()) {\n    const clientId = process.env.USER_ASSIGNED_IDENTITY_CLIENT_ID;\n    \n    if (clientId) {\n      return {\n        credential: new ManagedIdentityCredential({ clientId }),\n        description: 'User-assigned managed identity'\n      };\n    } else {\n      return {\n        credential: new ManagedIdentityCredential(),\n        description: 'System-assigned managed identity'\n      };\n    }\n  } else {\n    return {\n      credential: new DefaultAzureCredential(),\n      description: 'DefaultAzureCredential (local development)'\n    };\n  }\n}\n\n// Example usage\nif (require.main === module) {\n  (async () =\u003e {\n    console.log('=== Local Development Fallback Strategies ===\\n');\n    console.log(`Running in Azure: ${isRunningInAzure()}\\n`);\n    console.log('---\\n');\n    \n    // Try each strategy\n    await useDefaultAzureCredential();\n    console.log('\\n---\\n');\n    \n    await useChainedTokenCredential();\n    console.log('\\n---\\n');\n    \n    await useEnvironmentBasedCredential();\n    console.log('\\n---\\n');\n    \n    await useWithFeatureFlags();\n    console.log('\\n---\\n');\n    \n    await useWithDetailedLogging();\n  })();\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-baseline-claude-sonnet-4.5-2632164801\\local-development-fallback.ts"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"/**\n * Error Handling and Common Pitfalls\n * \n * This file demonstrates proper error handling for managed identity scenarios\n * and shows how to avoid common pitfalls.\n */\n\nimport {\n  ManagedIdentityCredential,\n  DefaultAzureCredential,\n  TokenCredential,\n  AggregateAuthenticationError\n} from '@azure/identity';\nimport { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';\nimport { SecretClient } from '@azure/keyvault-secrets';\n\n/**\n * Common Pitfall 1: Not handling CredentialUnavailableError\n */\nexport async function pitfall1_NotHandlingUnavailableCredential(): Promise\u003cvoid\u003e {\n  console.log('Pitfall 1: Not Handling Credential Unavailable\\n');\n\n  try {\n    // ❌ BAD: This will fail in local development if managed identity isn't available\n    const credential = new ManagedIdentityCredential();\n    \n    const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n    const blobServiceClient = new BlobServiceClient(\n      `https://${accountName}.blob.core.windows.net`,\n      credential\n    );\n\n    await blobServiceClient.getAccountInfo();\n    console.log('✓ Connected successfully');\n  } catch (error: any) {\n    if (error.name === 'CredentialUnavailableError') {\n      console.error('❌ Managed identity not available');\n      console.error('   This is expected when running locally\\n');\n      \n      console.log('✓ SOLUTION: Use DefaultAzureCredential instead');\n      console.log('  const credential = new DefaultAzureCredential();');\n    } else {\n      throw error;\n    }\n  }\n}\n\n/**\n * Common Pitfall 2: Wrong Client ID for User-Assigned Identity\n */\nexport async function pitfall2_WrongClientId(): Promise\u003cvoid\u003e {\n  console.log('Pitfall 2: Wrong Client ID\\n');\n\n  const wrongClientId = '00000000-0000-0000-0000-000000000000'; // ❌ Wrong ID\n\n  try {\n    const credential = new ManagedIdentityCredential({ \n      clientId: wrongClientId \n    });\n\n    const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n    const blobServiceClient = new BlobServiceClient(\n      `https://${accountName}.blob.core.windows.net`,\n      credential\n    );\n\n    await blobServiceClient.getAccountInfo();\n  } catch (error: any) {\n    console.error('❌ Authentication failed with wrong client ID');\n    console.error(`   Error: ${error.message}\\n`);\n    \n    console.log('✓ SOLUTION:');\n    console.log('  1. Verify client ID in Azure Portal:');\n    console.log('     Portal → Managed Identities → [Your Identity] → Properties → Client ID');\n    console.log('  2. Ensure the identity is assigned to your resource:');\n    console.log('     Portal → [Your Resource] → Identity → User assigned → Add');\n    console.log('  3. Check environment variable:');\n    console.log('     echo $USER_ASSIGNED_IDENTITY_CLIENT_ID');\n  }\n}\n\n/**\n * Common Pitfall 3: Missing RBAC Role Assignments\n */\nexport async function pitfall3_MissingRbacRoles(): Promise\u003cvoid\u003e {\n  console.log('Pitfall 3: Missing RBAC Role Assignments\\n');\n\n  try {\n    const credential = new DefaultAzureCredential();\n\n    const vaultUrl = process.env.KEY_VAULT_URL || 'https://myvault.vault.azure.net';\n    const client = new SecretClient(vaultUrl, credential);\n\n    // This will fail if identity doesn't have Key Vault permissions\n    await client.getSecret('my-secret');\n    console.log('✓ Successfully accessed Key Vault');\n  } catch (error: any) {\n    if (error.statusCode === 403 || error.code === 'Forbidden') {\n      console.error('❌ Access denied (403 Forbidden)');\n      console.error(`   Error: ${error.message}\\n`);\n      \n      console.log('✓ SOLUTION: Grant appropriate RBAC roles');\n      console.log('\\n  For Key Vault (using Azure RBAC):');\n      console.log('    az role assignment create \\\\');\n      console.log('      --role \"Key Vault Secrets User\" \\\\');\n      console.log('      --assignee \u003cmanaged-identity-principal-id\u003e \\\\');\n      console.log('      --scope /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/{vault}');\n      console.log('\\n  For Key Vault (using Access Policies):');\n      console.log('    az keyvault set-policy \\\\');\n      console.log('      --name \u003cvault-name\u003e \\\\');\n      console.log('      --object-id \u003cmanaged-identity-principal-id\u003e \\\\');\n      console.log('      --secret-permissions get list');\n      console.log('\\n  For Storage Account:');\n      console.log('    az role assignment create \\\\');\n      console.log('      --role \"Storage Blob Data Contributor\" \\\\');\n      console.log('      --assignee \u003cmanaged-identity-principal-id\u003e \\\\');\n      console.log('      --scope /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{account}');\n      console.log('\\n  Note: Role assignments can take 5-10 minutes to propagate');\n    } else {\n      throw error;\n    }\n  }\n}\n\n/**\n * Common Pitfall 4: Not Reusing Credential Instances\n */\nexport async function pitfall4_NotReusingCredentials(): Promise\u003cvoid\u003e {\n  console.log('Pitfall 4: Not Reusing Credential Instances\\n');\n\n  console.log('❌ BAD: Creating new credential for each client');\n  console.log('  const blob = new BlobServiceClient(url, new DefaultAzureCredential());');\n  console.log('  const secret = new SecretClient(vault, new DefaultAzureCredential());');\n  console.log('  → Each credential instance makes separate auth calls\\n');\n\n  console.log('✓ GOOD: Reuse credential instance');\n  console.log('  const credential = new DefaultAzureCredential();');\n  console.log('  const blob = new BlobServiceClient(url, credential);');\n  console.log('  const secret = new SecretClient(vault, credential);');\n  console.log('  → Credential caches tokens across clients\\n');\n\n  // Demonstrate the good pattern\n  const credential = new DefaultAzureCredential();\n  \n  const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n  const vaultUrl = process.env.KEY_VAULT_URL || 'https://myvault.vault.azure.net';\n\n  try {\n    const blobServiceClient = new BlobServiceClient(\n      `https://${accountName}.blob.core.windows.net`,\n      credential // ✓ Reusing same credential\n    );\n\n    const secretClient = new SecretClient(\n      vaultUrl,\n      credential // ✓ Reusing same credential\n    );\n\n    await Promise.all([\n      blobServiceClient.getAccountInfo(),\n      secretClient.listPropertiesOfSecrets().next()\n    ]);\n\n    console.log('✓ Successfully reused credential across multiple clients');\n  } catch (error: any) {\n    console.error('Note: This example requires proper configuration to run');\n  }\n}\n\n/**\n * Common Pitfall 5: Ignoring Token Expiration\n */\nexport async function pitfall5_TokenExpiration(): Promise\u003cvoid\u003e {\n  console.log('Pitfall 5: Token Expiration\\n');\n\n  const credential = new DefaultAzureCredential();\n\n  // Get a token manually (usually SDK handles this)\n  try {\n    const token = await credential.getToken('https://storage.azure.com/.default');\n    \n    const expiresIn = Math.round((token.expiresOnTimestamp - Date.now()) / 1000 / 60);\n    console.log(`Token obtained: expires in ${expiresIn} minutes`);\n    console.log(`  Expiry time: ${new Date(token.expiresOnTimestamp).toISOString()}`);\n    \n    console.log('\\n✓ GOOD NEWS: Azure SDK automatically handles token refresh');\n    console.log('  - SDK requests new token before expiration');\n    console.log('  - No manual token management needed');\n    console.log('  - Just keep using the same credential instance\\n');\n\n    console.log('❌ However, be aware of long-running operations:');\n    console.log('  - Very long-running tasks (hours) may need error handling');\n    console.log('  - Credential may become invalid if identity is removed');\n    console.log('  - Network issues during token refresh can cause failures');\n  } catch (error: any) {\n    console.error('Failed to obtain token:', error.message);\n  }\n}\n\n/**\n * Best Practice: Comprehensive Error Handler\n */\nexport async function handleManagedIdentityError(\n  error: any,\n  operation: string,\n  serviceName: string\n): Promise\u003cvoid\u003e {\n  console.error(`\\n❌ ${operation} failed on ${serviceName}\\n`);\n\n  // 1. Credential unavailable\n  if (error.name === 'CredentialUnavailableError') {\n    console.error('Issue: Managed identity not available');\n    console.error('Possible causes:');\n    console.error('  - Not running on Azure (expected in local dev)');\n    console.error('  - Managed identity not enabled on resource');\n    console.error('  - IDENTITY_ENDPOINT not set\\n');\n    console.error('Solutions:');\n    console.error('  Azure: Enable managed identity on your resource');\n    console.error('  Local: Use DefaultAzureCredential + az login');\n    return;\n  }\n\n  // 2. Authorization errors (403)\n  if (error.statusCode === 403 || error.code === 'Forbidden') {\n    console.error('Issue: Authorization denied');\n    console.error('Possible causes:');\n    console.error('  - Missing RBAC role assignment');\n    console.error('  - Wrong scope for role assignment');\n    console.error('  - Role assignment not yet propagated (5-10 min delay)\\n');\n    console.error('Solutions:');\n    console.error('  1. Check role assignments:');\n    console.error('     az role assignment list --assignee \u003cidentity-principal-id\u003e');\n    console.error('  2. Grant required role:');\n    console.error(`     az role assignment create --role \"\u003cRoleName\u003e\" --assignee \u003cidentity-principal-id\u003e`);\n    console.error('  3. Wait 5-10 minutes for propagation');\n    return;\n  }\n\n  // 3. Authentication errors\n  if (error.message?.includes('authentication') || error.message?.includes('ManagedIdentityCredential')) {\n    console.error('Issue: Authentication failed');\n    console.error('Possible causes:');\n    console.error('  - Invalid client ID (user-assigned identity)');\n    console.error('  - Identity not assigned to resource');\n    console.error('  - Managed identity service temporarily unavailable\\n');\n    console.error('Solutions:');\n    console.error('  1. Verify client ID in Azure Portal');\n    console.error('  2. Confirm identity assignment:');\n    console.error('     az identity list --query \"[?principalId!=null]\"');\n    console.error('  3. Check Azure service health');\n    return;\n  }\n\n  // 4. Network errors\n  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {\n    console.error('Issue: Network connectivity problem');\n    console.error('Possible causes:');\n    console.error('  - Service endpoint unreachable');\n    console.error('  - Firewall blocking outbound traffic');\n    console.error('  - Incorrect service URL\\n');\n    console.error('Solutions:');\n    console.error('  1. Check network connectivity');\n    console.error('  2. Verify service endpoint URL');\n    console.error('  3. Review firewall rules');\n    return;\n  }\n\n  // 5. Aggregate errors (from DefaultAzureCredential)\n  if (error.name === 'AggregateAuthenticationError') {\n    console.error('Issue: All credential sources failed');\n    console.error('Attempted credentials:');\n    const aggError = error as AggregateAuthenticationError;\n    aggError.errors.forEach((err: any, index: number) =\u003e {\n      console.error(`  ${index + 1}. ${err.name}: ${err.message}`);\n    });\n    console.error('\\nSolutions:');\n    console.error('  - Ensure at least one credential source is properly configured');\n    console.error('  - Azure: Enable managed identity');\n    console.error('  - Local: Run az login or set environment variables');\n    return;\n  }\n\n  // 6. Resource not found (404)\n  if (error.statusCode === 404) {\n    console.error('Issue: Resource not found');\n    console.error(`  The requested ${serviceName} resource doesn't exist\\n`);\n    console.error('Solutions:');\n    console.error('  1. Verify resource name and URL');\n    console.error('  2. Check if resource exists in correct subscription');\n    console.error('  3. Confirm you have read permissions');\n    return;\n  }\n\n  // 7. Generic fallback\n  console.error('Issue: Unexpected error');\n  console.error(`  Error name: ${error.name || 'Unknown'}`);\n  console.error(`  Error code: ${error.code || 'N/A'}`);\n  console.error(`  Status code: ${error.statusCode || 'N/A'}`);\n  console.error(`  Message: ${error.message}`);\n  console.error('\\nFull error object:');\n  console.error(error);\n}\n\n/**\n * Best Practice: Retry with Exponential Backoff\n */\nexport async function retryWithBackoff\u003cT\u003e(\n  operation: () =\u003e Promise\u003cT\u003e,\n  maxRetries: number = 3,\n  initialDelayMs: number = 1000\n): Promise\u003cT\u003e {\n  let lastError: Error | undefined;\n\n  for (let attempt = 1; attempt \u003c= maxRetries; attempt++) {\n    try {\n      return await operation();\n    } catch (error: any) {\n      lastError = error;\n      \n      // Don't retry authorization errors - they won't fix themselves\n      if (error.statusCode === 403 || error.statusCode === 401) {\n        throw error;\n      }\n\n      // Don't retry invalid configuration errors\n      if (error.message?.includes('invalid') || error.message?.includes('not found')) {\n        throw error;\n      }\n\n      if (attempt === maxRetries) {\n        throw error;\n      }\n\n      // Exponential backoff\n      const delayMs = initialDelayMs * Math.pow(2, attempt - 1);\n      console.log(`  Retry ${attempt}/${maxRetries} after ${delayMs}ms...`);\n      await new Promise(resolve =\u003e setTimeout(resolve, delayMs));\n    }\n  }\n\n  throw lastError;\n}\n\n// Example usage of retry\nexport async function useWithRetry(): Promise\u003cvoid\u003e {\n  console.log('Using retry with exponential backoff\\n');\n\n  try {\n    await retryWithBackoff(async () =\u003e {\n      const credential = new DefaultAzureCredential();\n      const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mystorageaccount';\n      const blobServiceClient = new BlobServiceClient(\n        `https://${accountName}.blob.core.windows.net`,\n        credential\n      );\n\n      await blobServiceClient.getAccountInfo();\n      console.log('✓ Operation succeeded');\n    }, 3, 1000);\n  } catch (error: any) {\n    await handleManagedIdentityError(error, 'Get account info', 'Azure Storage');\n  }\n}\n\n// Example usage\nif (require.main === module) {\n  (async () =\u003e {\n    console.log('=== Error Handling and Common Pitfalls ===\\n');\n    \n    await pitfall1_NotHandlingUnavailableCredential();\n    console.log('\\n---\\n');\n    \n    await pitfall3_MissingRbacRoles();\n    console.log('\\n---\\n');\n    \n    await pitfall4_NotReusingCredentials();\n    console.log('\\n---\\n');\n    \n    await pitfall5_TokenExpiration();\n    console.log('\\n---\\n');\n    \n    await useWithRetry();\n  })();\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-baseline-claude-sonnet-4.5-2632164801\\error-handling.ts"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-managed-identity-examples\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Comprehensive examples of using Managed Identity with Azure SDK in Node.js\",\n  \"main\": \"index.js\",\n  \"scripts\": {\n    \"system-identity\": \"ts-node system-assigned-identity.ts\",\n    \"user-identity\": \"ts-node user-assigned-identity.ts\",\n    \"local-dev\": \"ts-node local-development-fallback.ts\",\n    \"error-handling\": \"ts-node error-handling.ts\"\n  },\n  \"keywords\": [\n    \"azure\",\n    \"managed-identity\",\n    \"authentication\",\n    \"azure-sdk\",\n    \"typescript\"\n  ],\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.0.0\",\n    \"@azure/storage-blob\": \"^12.17.0\",\n    \"@azure/storage-queue\": \"^12.15.0\",\n    \"@azure/keyvault-secrets\": \"^4.7.0\",\n    \"@azure/cosmos\": \"^4.0.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.0.0\",\n    \"typescript\": \"^5.3.0\",\n    \"ts-node\": \"^10.9.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-baseline-claude-sonnet-4.5-2632164801\\package.json"}
```

### 🔧 8. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"moduleResolution\": \"node\",\n    \"resolveJsonModule\": true,\n    \"declaration\": true,\n    \"declarationMap\": true,\n    \"sourceMap\": true\n  },\n  \"include\": [\"*.ts\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-baseline-claude-sonnet-4.5-2632164801\\tsconfig.json"}
```

### 🔧 9. create

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-managed-identity-baseline-claude-sonnet-4.5-2632164801\\README.md"}
```

## Copilot Response

I'll create a comprehensive guide on using Managed Identity with Azure SDK clients in Node.js, with practical TypeScript examples.

I apologize - it seems there's a permissions issue preventing me from creating files in this directory. Let me provide you with the comprehensive guide directly as output instead:

## **Azure Managed Identity Authentication Guide for Node.js**

### **1. System-Assigned vs User-Assigned Managed Identity**

**System-Assigned:**
- Tied to the Azure resource lifecycle (VM, App Service, etc.)
- Automatically created/deleted with the resource
- One identity per resource
- Best for single-resource scenarios

**User-Assigned:**
- Independent Azure resource
- Can be assigned to multiple resources
- Must be explicitly created/deleted
- Best for identity sharing across resources

---

### **2. Creating ManagedIdentityCredential**

**Installation:**
```bash
npm install @azure/identity
```

**System-Assigned Identity:**
```typescript
import { ManagedIdentityCredential } from '@azure/identity';

// Simple - no parameters needed
const credential = new ManagedIdentityCredential();
```

**User-Assigned Identity:**
```typescript
// Option 1: Using Client ID (recommended)
const credential = new ManagedIdentityCredential({
  clientId: "your-client-id-guid"
});

// Option 2: Using Resource ID
const credential = new ManagedIdentityCredential({
  resourceId: "/subscriptions/{sub}/resourcegroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}"
});
```

---

### **3. Using with Azure SDK Clients**

**Azure Blob Storage:**
```typescript
import { ManagedIdentityCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';

const credential = new ManagedIdentityCredential();
const blobServiceClient = new BlobServiceClient(
  `https://mystorageaccount.blob.core.windows.net`,
  credential
);

const containerClient = blobServiceClient.getContainerClient('mycontainer');
for await (const blob of containerClient.listBlobsFlat()) {
  console.log(blob.name);
}
```

**Azure Key Vault:**
```typescript
import { SecretClient } from '@azure/keyvault-secrets';

const credential = new ManagedIdentityCredential();
const client = new SecretClient(
  'https://myvault.vault.azure.net',
  credential
);

const secret = await client.getSecret('my-secret');
console.log(secret.value);
```

**Multiple Services (reuse credential!):**
```typescript
// ✓ GOOD: Reuse credential instance
const credential = new ManagedIdentityCredential();

const blobClient = new BlobServiceClient(blobUrl, credential);
const secretClient = new SecretClient(vaultUrl, credential);
const queueClient = new QueueServiceClient(queueUrl, credential);
```

---

### **4. Local Development Fallback Strategies**

**Strategy 1: DefaultAzureCredential (Recommended)**
```typescript
import { DefaultAzureCredential } from '@azure/identity';

// Works in Azure AND local development
const credential = new DefaultAzureCredential();

// Tries in order:
// 1. Environment variables
// 2. Workload Identity (Kubernetes)
// 3. Managed Identity
// 4. Azure CLI (az login)
// 5. Azure PowerShell
```

**Strategy 2: ChainedTokenCredential**
```typescript
import { 
  ChainedTokenCredential, 
  ManagedIdentityCredential,
  AzureCliCredential,
  EnvironmentCredential 
} from '@azure/identity';

const credential = new ChainedTokenCredential(
  new EnvironmentCredential(),
  new ManagedIdentityCredential({ 
    clientId: process.env.USER_ASSIGNED_IDENTITY_CLIENT_ID 
  }),
  new AzureCliCredential()
);
```

**Strategy 3: Environment-Based**
```typescript
function getCredential() {
  const isAzure = process.env.IDENTITY_ENDPOINT;
  
  if (isAzure) {
    const clientId = process.env.USER_ASSIGNED_IDENTITY_CLIENT_ID;
    return new ManagedIdentityCredential(clientId ? { clientId } : undefined);
  } else {
    return new AzureCliCredential(); // Local dev
  }
}
```

---

### **5. Common Pitfalls and Error Handling**

**Pitfall 1: Not Handling CredentialUnavailableError**
```typescript
❌ BAD:
const credential = new ManagedIdentityCredential();
// Fails locally!

✓ GOOD:
const credential = new DefaultAzureCredential();
// Works everywhere
```

**Pitfall 2: Wrong Client ID**
```typescript
// Verify in Azure Portal:
// Managed Identities → [Your Identity] → Properties → Client ID

// Ensure identity is assigned to your resource:
// [Your Resource] → Identity → User assigned → Add
```

**Pitfall 3: Missing RBAC Roles**
```bash
# Grant Storage Blob Data Contributor
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee <managed-identity-principal-id> \
  --scope /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{account}

# Grant Key Vault Secrets User
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee <managed-identity-principal-id> \
  --scope /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/{vault}

# Note: Propagation takes 5-10 minutes
```

**Pitfall 4: Not Reusing Credentials**
```typescript
❌ BAD:
const blob = new BlobServiceClient(url, new DefaultAzureCredential());
const secret = new SecretClient(vault, new DefaultAzureCredential());
// Creates separate auth calls!

✓ GOOD:
const credential = new DefaultAzureCredential();
const blob = new BlobServiceClient(url, credential);
const secret = new SecretClient(vault, credential);
// Reuses cached tokens
```

**Comprehensive Error Handler:**
```typescript
async function handleManagedIdentityError(error: any) {
  if (error.name === 'CredentialUnavailableError') {
    console.error('Not running in Azure or managed identity not enabled');
    console.error('Solution: Use DefaultAzureCredential + az login for local dev');
  } 
  else if (error.statusCode === 403) {
    console.error('Missing RBAC role assignments');
    console.error('Solution: Grant appropriate roles and wait 5-10 min');
  }
  else if (error.message?.includes('ManagedIdentityCredential')) {
    console.error('Invalid client ID or identity not assigned to resource');
    console.error('Solution: Verify client ID and identity assignment');
  }
  else if (error.code === 'ENOTFOUND') {
    console.error('Network connectivity issue');
    console.error('Solution: Check firewall rules and endpoint URL');
  }
}
```

**Retry with Exponential Backoff:**
```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      // Don't retry auth errors (403/401)
      if (error.statusCode === 403 || error.statusCode === 401) {
        throw error;
      }
      
      if (attempt === maxRetries) throw error;
      
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error('Unreachable');
}
```

---

### **Quick Reference**

| Scenario | Use This |
|----------|----------|
| Production in Azure | `ManagedIdentityCredential` |
| User-assigned identity | `ManagedIdentityCredential({ clientId })` |
| Azure + Local dev | `DefaultAzureCredential` ✅ |
| Multiple identities | Separate `ManagedIdentityCredential` instances |
| CI/CD pipelines | `EnvironmentCredential` or service principal |
| Debugging | Enable `loggingOptions.allowLoggingAccountIdentifiers` |

**Key Takeaways:**
1. ✅ Use **DefaultAzureCredential** for most scenarios
2. ✅ **Reuse credential instances** across clients
3. ✅ Azure SDK **auto-refreshes tokens** - no manual handling
4. ⚠️ RBAC changes take **5-10 minutes** to propagate
5. ⚠️ Don't retry **403/401 errors** - they won't fix themselves

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config baseline/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
