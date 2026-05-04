/**
 * Azure Managed Identity Authentication Guide for Node.js/TypeScript
 * 
 * This guide covers using Managed Identity to authenticate Azure SDK clients,
 * including both system-assigned and user-assigned identities.
 */

import { 
  ManagedIdentityCredential,
  DefaultAzureCredential,
  ChainedTokenCredential
} from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";
import { QueueClient } from "@azure/storage-queue";

// ============================================================================
// 1. SYSTEM-ASSIGNED vs USER-ASSIGNED MANAGED IDENTITY
// ============================================================================

/**
 * SYSTEM-ASSIGNED MANAGED IDENTITY:
 * - Automatically created and tied to a single Azure resource (VM, App Service, etc.)
 * - Lifecycle is bound to the resource - deleted when resource is deleted
 * - No need to manage credentials or rotation
 * - Unique per resource
 * - Use when: Single resource needs access to Azure services
 * 
 * USER-ASSIGNED MANAGED IDENTITY:
 * - Created as a standalone Azure resource
 * - Can be assigned to multiple Azure resources
 * - Independent lifecycle from resources using it
 * - Shared identity across resources
 * - Use when: Multiple resources need the same permissions, or you want to
 *   separate identity lifecycle from resource lifecycle
 */

// ============================================================================
// 2. CREATING ManagedIdentityCredential
// ============================================================================

/**
 * System-Assigned Managed Identity
 * No configuration needed - automatically uses the system-assigned identity
 */
function createSystemAssignedCredential(): ManagedIdentityCredential {
  return new ManagedIdentityCredential();
}

/**
 * User-Assigned Managed Identity (by Client ID)
 * Specify the client ID of the user-assigned managed identity
 */
function createUserAssignedCredentialByClientId(clientId: string): ManagedIdentityCredential {
  return new ManagedIdentityCredential({
    clientId: clientId // e.g., "12345678-1234-1234-1234-123456789012"
  });
}

/**
 * User-Assigned Managed Identity (by Resource ID)
 * Use the full Azure resource ID
 */
function createUserAssignedCredentialByResourceId(resourceId: string): ManagedIdentityCredential {
  return new ManagedIdentityCredential({
    resourceId: resourceId // e.g., "/subscriptions/{sub}/resourcegroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}"
  });
}

/**
 * User-Assigned Managed Identity (by Object ID)
 * Less common, but supported
 */
function createUserAssignedCredentialByObjectId(objectId: string): ManagedIdentityCredential {
  return new ManagedIdentityCredential({
    objectId: objectId
  });
}

// ============================================================================
// 3. USING WITH AZURE SDK CLIENTS
// ============================================================================

/**
 * Example: Using System-Assigned Managed Identity with Azure Blob Storage
 */
async function exampleBlobStorageWithSystemAssigned() {
  const credential = new ManagedIdentityCredential();
  const storageAccountName = "mystorageaccount";
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential
  );

  try {
    // List containers
    const containers = blobServiceClient.listContainers();
    for await (const container of containers) {
      console.log(`Container: ${container.name}`);
    }
  } catch (error) {
    console.error("Error accessing blob storage:", error);
    throw error;
  }
}

/**
 * Example: Using User-Assigned Managed Identity with Azure Key Vault
 */
async function exampleKeyVaultWithUserAssigned(userAssignedClientId: string) {
  const credential = new ManagedIdentityCredential({
    clientId: userAssignedClientId
  });

  const vaultUrl = "https://myvault.vault.azure.net";
  const secretClient = new SecretClient(vaultUrl, credential);

  try {
    // Get a secret
    const secret = await secretClient.getSecret("my-secret");
    console.log(`Secret value: ${secret.value}`);
  } catch (error) {
    console.error("Error accessing Key Vault:", error);
    throw error;
  }
}

/**
 * Example: Using with multiple Azure services
 */
async function exampleMultipleServices() {
  const credential = new ManagedIdentityCredential();

  // Storage Queue
  const queueClient = new QueueClient(
    "https://mystorageaccount.queue.core.windows.net/myqueue",
    credential
  );

  // Key Vault
  const secretClient = new SecretClient(
    "https://myvault.vault.azure.net",
    credential
  );

  // Blob Storage
  const blobServiceClient = new BlobServiceClient(
    "https://mystorageaccount.blob.core.windows.net",
    credential
  );

  // Use all services with the same credential
  await queueClient.sendMessage("Hello from Managed Identity!");
  const secret = await secretClient.getSecret("connection-string");
  const containers = blobServiceClient.listContainers();
}

// ============================================================================
// 4. LOCAL DEVELOPMENT FALLBACK STRATEGIES
// ============================================================================

/**
 * Strategy 1: DefaultAzureCredential
 * Recommended for most scenarios - tries multiple authentication methods in order:
 * 1. EnvironmentCredential (env vars)
 * 2. WorkloadIdentityCredential (Kubernetes)
 * 3. ManagedIdentityCredential (Azure resources)
 * 4. AzureCliCredential (local development)
 * 5. AzurePowerShellCredential (local development)
 * 6. AzureDeveloperCliCredential (local development)
 */
function strategyDefaultCredential() {
  // Works in Azure (Managed Identity) AND locally (Azure CLI, VS Code, etc.)
  const credential = new DefaultAzureCredential();

  const blobServiceClient = new BlobServiceClient(
    "https://mystorageaccount.blob.core.windows.net",
    credential
  );

  return blobServiceClient;
}

/**
 * Strategy 2: ChainedTokenCredential with explicit fallback
 * More control over the authentication chain
 */
function strategyChainedCredential() {
  const { AzureCliCredential, EnvironmentCredential } = require("@azure/identity");

  const credential = new ChainedTokenCredential(
    new ManagedIdentityCredential(), // Try Managed Identity first (production)
    new AzureCliCredential(),         // Fallback to Azure CLI (local dev)
    new EnvironmentCredential()       // Fallback to env vars
  );

  const blobServiceClient = new BlobServiceClient(
    "https://mystorageaccount.blob.core.windows.net",
    credential
  );

  return blobServiceClient;
}

/**
 * Strategy 3: Environment-based selection
 * Explicitly choose credential based on environment
 */
function strategyEnvironmentBased() {
  const isProduction = process.env.NODE_ENV === "production";
  const isAzure = process.env.AZURE_CLIENT_ID !== undefined || 
                  process.env.IDENTITY_ENDPOINT !== undefined;

  let credential;

  if (isAzure) {
    // Running in Azure - use Managed Identity
    const clientId = process.env.AZURE_CLIENT_ID;
    credential = clientId 
      ? new ManagedIdentityCredential({ clientId })
      : new ManagedIdentityCredential();
  } else {
    // Running locally - use DefaultAzureCredential for dev convenience
    credential = new DefaultAzureCredential();
  }

  return credential;
}

/**
 * Strategy 4: User-Assigned MI in Azure, Service Principal locally
 */
function strategyUserAssignedWithServicePrincipal() {
  const { ClientSecretCredential } = require("@azure/identity");

  const userAssignedClientId = process.env.MANAGED_IDENTITY_CLIENT_ID;
  
  let credential;

  if (userAssignedClientId) {
    // Azure environment with User-Assigned MI
    credential = new ManagedIdentityCredential({
      clientId: userAssignedClientId
    });
  } else if (process.env.AZURE_TENANT_ID && 
             process.env.AZURE_CLIENT_ID && 
             process.env.AZURE_CLIENT_SECRET) {
    // Local development with Service Principal
    credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID,
      process.env.AZURE_CLIENT_ID,
      process.env.AZURE_CLIENT_SECRET
    );
  } else {
    // Fallback to DefaultAzureCredential
    credential = new DefaultAzureCredential();
  }

  return credential;
}

// ============================================================================
// 5. COMMON PITFALLS AND ERROR HANDLING
// ============================================================================

/**
 * Pitfall 1: Missing Role Assignments
 * The managed identity must have appropriate RBAC roles assigned
 */
async function handleMissingRoleAssignment() {
  const credential = new ManagedIdentityCredential();
  const blobServiceClient = new BlobServiceClient(
    "https://mystorageaccount.blob.core.windows.net",
    credential
  );

  try {
    const containers = blobServiceClient.listContainers();
    for await (const container of containers) {
      console.log(container.name);
    }
  } catch (error: any) {
    if (error.statusCode === 403) {
      console.error("Access denied - Managed Identity may lack required role assignment");
      console.error("Ensure the identity has 'Storage Blob Data Reader' or appropriate role");
      // Required role examples:
      // - Storage Blob Data Reader (read blobs)
      // - Storage Blob Data Contributor (read/write blobs)
      // - Key Vault Secrets User (read secrets)
    }
    throw error;
  }
}

/**
 * Pitfall 2: Wrong User-Assigned Identity
 * When multiple user-assigned identities are attached, specify the correct one
 */
async function handleMultipleUserAssignedIdentities() {
  const correctClientId = process.env.MANAGED_IDENTITY_CLIENT_ID;

  if (!correctClientId) {
    throw new Error(
      "When multiple user-assigned identities exist, MANAGED_IDENTITY_CLIENT_ID must be specified"
    );
  }

  const credential = new ManagedIdentityCredential({
    clientId: correctClientId
  });

  // Use credential...
}

/**
 * Pitfall 3: Managed Identity not available in environment
 * Handle cases where code runs outside Azure
 */
async function handleManagedIdentityUnavailable() {
  try {
    const credential = new ManagedIdentityCredential();
    
    // Test if credential works by requesting a token
    const scope = "https://storage.azure.com/.default";
    const token = await credential.getToken(scope);
    
    console.log("Managed Identity available");
    return credential;
  } catch (error: any) {
    if (error.message?.includes("ManagedIdentityCredential authentication failed")) {
      console.warn("Managed Identity not available, falling back to DefaultAzureCredential");
      return new DefaultAzureCredential();
    }
    throw error;
  }
}

/**
 * Pitfall 4: Token expiration and retry logic
 * Azure SDK handles token refresh automatically, but be aware of retry scenarios
 */
async function handleTokenExpirationWithRetry() {
  const credential = new ManagedIdentityCredential();
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const secretClient = new SecretClient(
        "https://myvault.vault.azure.net",
        credential
      );
      
      const secret = await secretClient.getSecret("my-secret");
      return secret.value;
    } catch (error: any) {
      if (attempt === maxRetries) {
        console.error("Failed after all retries:", error.message);
        throw error;
      }
      
      // Retry on transient errors
      if (error.statusCode === 429 || error.statusCode >= 500) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

/**
 * Pitfall 5: Scope/Resource URI confusion
 * Different Azure services require different scope values
 */
async function demonstrateProperScopes() {
  const credential = new ManagedIdentityCredential();

  // Common scope patterns:
  const storageScope = "https://storage.azure.com/.default";
  const keyVaultScope = "https://vault.azure.net/.default";
  const managementScope = "https://management.azure.com/.default";
  const graphScope = "https://graph.microsoft.com/.default";

  // Get token for specific scope
  const token = await credential.getToken(storageScope);
  console.log(`Token expires at: ${token.expiresOnTimestamp}`);
}

/**
 * Comprehensive error handling example
 */
async function comprehensiveErrorHandling() {
  const credential = new ManagedIdentityCredential();
  const vaultUrl = "https://myvault.vault.azure.net";
  const secretClient = new SecretClient(vaultUrl, credential);

  try {
    const secret = await secretClient.getSecret("my-secret");
    return secret.value;
  } catch (error: any) {
    // Authentication/Authorization errors
    if (error.statusCode === 401) {
      console.error("Authentication failed - Managed Identity token may be invalid");
    } else if (error.statusCode === 403) {
      console.error("Authorization failed - Identity lacks required permissions");
      console.error(`Required: 'Key Vault Secrets User' role on ${vaultUrl}`);
    }
    // Resource not found
    else if (error.statusCode === 404) {
      console.error("Secret not found or Key Vault does not exist");
    }
    // Throttling
    else if (error.statusCode === 429) {
      console.error("Too many requests - implement exponential backoff");
    }
    // Network/transient errors
    else if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      console.error("Network error - service may be temporarily unavailable");
    }
    // Managed Identity not available
    else if (error.message?.includes("ManagedIdentityCredential")) {
      console.error("Managed Identity not available in this environment");
      console.error("Ensure app is running in Azure with MI enabled");
    }
    else {
      console.error("Unexpected error:", error.message);
    }

    throw error;
  }
}

// ============================================================================
// COMPLETE PRODUCTION EXAMPLE
// ============================================================================

/**
 * Production-ready example with all best practices
 */
export class AzureServiceManager {
  private credential: ManagedIdentityCredential | DefaultAzureCredential;
  private blobServiceClient: BlobServiceClient;
  private secretClient: SecretClient;

  constructor(storageAccountName: string, keyVaultName: string) {
    // Use DefaultAzureCredential for flexibility (works locally and in Azure)
    this.credential = new DefaultAzureCredential({
      // Optionally specify managed identity client ID for user-assigned MI
      managedIdentityClientId: process.env.MANAGED_IDENTITY_CLIENT_ID
    });

    this.blobServiceClient = new BlobServiceClient(
      `https://${storageAccountName}.blob.core.windows.net`,
      this.credential
    );

    this.secretClient = new SecretClient(
      `https://${keyVaultName}.vault.azure.net`,
      this.credential
    );
  }

  async uploadBlob(containerName: string, blobName: string, content: string): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      
      // Ensure container exists
      await containerClient.createIfNotExists();
      
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(content, content.length);
      
      console.log(`Blob uploaded: ${blobName}`);
    } catch (error: any) {
      this.handleStorageError(error, "uploadBlob");
      throw error;
    }
  }

  async getSecret(secretName: string): Promise<string> {
    try {
      const secret = await this.secretClient.getSecret(secretName);
      return secret.value || "";
    } catch (error: any) {
      this.handleKeyVaultError(error, secretName);
      throw error;
    }
  }

  private handleStorageError(error: any, operation: string): void {
    console.error(`Storage operation '${operation}' failed:`, {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message
    });

    if (error.statusCode === 403) {
      console.error("Required role: 'Storage Blob Data Contributor'");
    }
  }

  private handleKeyVaultError(error: any, secretName: string): void {
    console.error(`Key Vault operation failed for secret '${secretName}':`, {
      statusCode: error.statusCode,
      message: error.message
    });

    if (error.statusCode === 403) {
      console.error("Required role: 'Key Vault Secrets User'");
    }
  }
}

// Usage example
async function main() {
  const manager = new AzureServiceManager("mystorageaccount", "myvault");
  
  // Get configuration from Key Vault
  const connectionString = await manager.getSecret("db-connection-string");
  
  // Upload data to Blob Storage
  await manager.uploadBlob("data", "config.json", JSON.stringify({ 
    version: "1.0",
    connectionString 
  }));
}

// ============================================================================
// BEST PRACTICES SUMMARY
// ============================================================================

/**
 * BEST PRACTICES:
 * 
 * 1. Use DefaultAzureCredential for most scenarios
 *    - Works in Azure (Managed Identity) and locally (Azure CLI, VS Code)
 *    - Simplifies development and deployment
 * 
 * 2. Specify User-Assigned MI client ID when needed
 *    - Use environment variable: MANAGED_IDENTITY_CLIENT_ID
 *    - Pass to DefaultAzureCredential options: managedIdentityClientId
 * 
 * 3. Assign minimal RBAC roles required
 *    - Storage: "Storage Blob Data Reader/Contributor"
 *    - Key Vault: "Key Vault Secrets User"
 *    - Avoid "Owner" or "Contributor" roles
 * 
 * 4. Handle errors gracefully
 *    - Check for 401/403 status codes
 *    - Log useful context for debugging
 *    - Implement retry logic for transient failures
 * 
 * 5. Test locally with Azure CLI
 *    - Run: az login
 *    - Assign your user the same roles as the managed identity
 *    - Verify DefaultAzureCredential works before deploying
 * 
 * 6. Enable Managed Identity on Azure resources
 *    - App Service: Identity blade → System assigned → On
 *    - VM: Identity → System assigned → Status → On
 *    - User-assigned: Create identity, then assign to resources
 * 
 * 7. Monitor and audit
 *    - Enable diagnostic logs for the managed identity
 *    - Review role assignments regularly
 *    - Use Azure Monitor for authentication failures
 */
