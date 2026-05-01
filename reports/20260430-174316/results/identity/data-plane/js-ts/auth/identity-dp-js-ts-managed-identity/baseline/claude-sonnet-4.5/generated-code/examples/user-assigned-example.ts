/**
 * User-Assigned Managed Identity Example
 * 
 * This example demonstrates using a user-assigned managed identity
 * to authenticate with Azure services. Shows all three ways to specify
 * the identity: client ID, resource ID, and object ID.
 */

import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { ServiceBusClient } from "@azure/service-bus";

export async function userAssignedExample(): Promise<void> {
  console.log("=== User-Assigned Managed Identity Example ===\n");
  
  // Get configuration from environment
  const clientId = process.env.AZURE_USER_ASSIGNED_CLIENT_ID;
  const resourceId = process.env.AZURE_USER_ASSIGNED_RESOURCE_ID;
  
  if (!clientId) {
    console.error("ERROR: AZURE_USER_ASSIGNED_CLIENT_ID environment variable not set");
    console.error("Set it to your user-assigned managed identity's client ID");
    return;
  }
  
  // Method 1: Using Client ID (most common and recommended)
  await useClientId(clientId);
  
  // Method 2: Using Resource ID (if available)
  if (resourceId) {
    await useResourceId(resourceId);
  }
  
  // Method 3: Using Object ID (less common)
  // await useObjectId(objectId);
}

/**
 * Method 1: Create credential using Client ID (Recommended)
 */
async function useClientId(clientId: string): Promise<void> {
  console.log("\n--- Method 1: Using Client ID ---");
  console.log(`Client ID: ${clientId}`);
  
  const credential = new ManagedIdentityCredential({
    clientId: clientId
  });
  
  console.log("✓ Created ManagedIdentityCredential with client ID");
  
  // Use with Key Vault
  await testKeyVaultAccess(credential, "client-id");
}

/**
 * Method 2: Create credential using Resource ID
 */
async function useResourceId(resourceId: string): Promise<void> {
  console.log("\n--- Method 2: Using Resource ID ---");
  console.log(`Resource ID: ${resourceId}`);
  
  const credential = new ManagedIdentityCredential({
    resourceId: resourceId
  });
  
  console.log("✓ Created ManagedIdentityCredential with resource ID");
  
  // Use with Service Bus
  await testServiceBusAccess(credential, "resource-id");
}

/**
 * Method 3: Create credential using Object ID (less common)
 */
async function useObjectId(objectId: string): Promise<void> {
  console.log("\n--- Method 3: Using Object ID ---");
  console.log(`Object ID: ${objectId}`);
  
  const credential = new ManagedIdentityCredential({
    objectId: objectId
  });
  
  console.log("✓ Created ManagedIdentityCredential with object ID");
}

async function testKeyVaultAccess(
  credential: ManagedIdentityCredential,
  method: string
): Promise<void> {
  console.log(`\nTesting Key Vault access (${method})...`);
  
  const keyVaultUrl = process.env.KEY_VAULT_URL || "https://my-keyvault.vault.azure.net";
  const secretClient = new SecretClient(keyVaultUrl, credential);
  
  try {
    // Try to list secrets (requires list permission)
    const secretsIterator = secretClient.listPropertiesOfSecrets();
    const secrets: string[] = [];
    
    for await (const secretProperties of secretsIterator) {
      secrets.push(secretProperties.name);
      if (secrets.length >= 5) break; // Limit to first 5
    }
    
    console.log(`✓ Successfully accessed Key Vault`);
    console.log(`  Found ${secrets.length} secret(s):`);
    secrets.forEach(name => console.log(`    - ${name}`));
  } catch (error: any) {
    console.error("✗ Failed to access Key Vault");
    handleAuthError(error, "Key Vault Secrets User");
  }
}

async function testServiceBusAccess(
  credential: ManagedIdentityCredential,
  method: string
): Promise<void> {
  console.log(`\nTesting Service Bus access (${method})...`);
  
  const fullyQualifiedNamespace = process.env.SERVICE_BUS_NAMESPACE;
  
  if (!fullyQualifiedNamespace) {
    console.log("  Skipped: SERVICE_BUS_NAMESPACE not configured");
    return;
  }
  
  const client = new ServiceBusClient(fullyQualifiedNamespace, credential);
  
  try {
    // Create a test receiver to verify access
    const queueName = process.env.SERVICE_BUS_QUEUE_NAME || "test-queue";
    const receiver = client.createReceiver(queueName);
    
    // Just creating the receiver tests authentication
    await receiver.close();
    await client.close();
    
    console.log(`✓ Successfully authenticated with Service Bus`);
    console.log(`  Queue: ${queueName}`);
  } catch (error: any) {
    console.error("✗ Failed to access Service Bus");
    handleAuthError(error, "Azure Service Bus Data Receiver");
  }
}

function handleAuthError(error: any, requiredRole: string): void {
  if (error.statusCode === 403 || error.code === "Forbidden") {
    console.error(`  Permission denied. The user-assigned identity lacks the required role.`);
    console.error(`  Required role: '${requiredRole}'`);
    console.error("\n  Assign the role:");
    console.error("  az role assignment create \\");
    console.error("    --assignee <user-assigned-identity-client-id> \\");
    console.error(`    --role '${requiredRole}' \\`);
    console.error("    --scope <resource-scope>");
  } else if (error.message?.includes("No MSI credential available")) {
    console.error("  User-assigned identity not found or not attached to this resource");
    console.error("\n  Check:");
    console.error("  1. Identity exists: az identity show --name <identity-name> --resource-group <rg>");
    console.error("  2. Identity is assigned to resource: az webapp identity show --name <app-name> --resource-group <rg>");
    console.error("  3. Client ID is correct");
  } else {
    console.error(`  Error: ${error.message}`);
    if (error.code) {
      console.error(`  Code: ${error.code}`);
    }
  }
}

/**
 * Example: Managing multiple user-assigned identities
 */
export async function multipleIdentitiesExample(): Promise<void> {
  console.log("\n=== Multiple User-Assigned Identities Example ===\n");
  
  // When a resource has multiple user-assigned identities,
  // you must specify which one to use for each service
  
  const keyVaultIdentityClientId = process.env.KEYVAULT_IDENTITY_CLIENT_ID;
  const storageIdentityClientId = process.env.STORAGE_IDENTITY_CLIENT_ID;
  
  if (!keyVaultIdentityClientId || !storageIdentityClientId) {
    console.log("Skipped: Identity client IDs not configured");
    return;
  }
  
  // Use different identities for different services
  const keyVaultCredential = new ManagedIdentityCredential({
    clientId: keyVaultIdentityClientId
  });
  
  const storageCredential = new ManagedIdentityCredential({
    clientId: storageIdentityClientId
  });
  
  console.log("✓ Created separate credentials for Key Vault and Storage");
  console.log(`  Key Vault identity: ${keyVaultIdentityClientId}`);
  console.log(`  Storage identity: ${storageIdentityClientId}`);
  
  // Use each credential with its respective service
  // (implementation omitted for brevity)
}

// Run the examples
if (require.main === module) {
  userAssignedExample()
    .then(() => multipleIdentitiesExample())
    .catch(error => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}
