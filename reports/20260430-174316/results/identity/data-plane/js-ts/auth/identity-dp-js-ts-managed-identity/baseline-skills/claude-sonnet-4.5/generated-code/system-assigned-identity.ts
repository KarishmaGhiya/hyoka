/**
 * System-Assigned Managed Identity Example
 * 
 * A system-assigned identity is tied to your Azure resource (VM, App Service, etc.)
 * and is automatically created/deleted with the resource.
 * 
 * Use when: Single resource needs access to Azure services
 */

import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";
import { QueueClient } from "@azure/storage-queue";

/**
 * Create a ManagedIdentityCredential for system-assigned identity
 * No parameters needed - it automatically uses the system-assigned identity
 */
export function createSystemAssignedCredential(): ManagedIdentityCredential {
  return new ManagedIdentityCredential();
}

/**
 * Example 1: Using system-assigned identity with Azure Blob Storage
 */
export async function accessBlobStorageWithSystemIdentity() {
  const credential = new ManagedIdentityCredential();
  
  const accountName = "mystorageaccount";
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );

  try {
    // List containers to verify authentication
    const containers = blobServiceClient.listContainers();
    
    console.log("Containers:");
    for await (const container of containers) {
      console.log(`- ${container.name}`);
    }
  } catch (error) {
    console.error("Error accessing blob storage:", error);
    throw error;
  }
}

/**
 * Example 2: Using system-assigned identity with Azure Key Vault
 */
export async function accessKeyVaultWithSystemIdentity() {
  const credential = new ManagedIdentityCredential();
  
  const vaultUrl = "https://mykeyvault.vault.azure.net";
  const secretClient = new SecretClient(vaultUrl, credential);

  try {
    // Retrieve a secret
    const secretName = "database-connection-string";
    const secret = await secretClient.getSecret(secretName);
    
    console.log(`Retrieved secret: ${secretName}`);
    return secret.value;
  } catch (error) {
    console.error("Error accessing Key Vault:", error);
    throw error;
  }
}

/**
 * Example 3: Using system-assigned identity with Azure Queue Storage
 */
export async function accessQueueStorageWithSystemIdentity() {
  const credential = new ManagedIdentityCredential();
  
  const accountName = "mystorageaccount";
  const queueName = "myqueue";
  
  const queueClient = new QueueClient(
    `https://${accountName}.queue.core.windows.net/${queueName}`,
    credential
  );

  try {
    // Send a message
    const message = { timestamp: new Date().toISOString(), data: "test" };
    await queueClient.sendMessage(JSON.stringify(message));
    
    console.log("Message sent successfully");
  } catch (error) {
    console.error("Error accessing queue storage:", error);
    throw error;
  }
}

/**
 * Example 4: Error handling for system-assigned identity
 */
export async function systemIdentityWithErrorHandling() {
  const credential = new ManagedIdentityCredential();
  const vaultUrl = "https://mykeyvault.vault.azure.net";
  const secretClient = new SecretClient(vaultUrl, credential);

  try {
    const secret = await secretClient.getSecret("my-secret");
    return secret.value;
  } catch (error: any) {
    // Common error scenarios
    if (error.code === "ManagedIdentityCredential authentication failed") {
      console.error("Managed Identity not enabled or not configured properly");
      console.error("Check: Azure resource has system-assigned identity enabled");
    } else if (error.statusCode === 403) {
      console.error("Access denied - check RBAC permissions");
      console.error("Required: Assign appropriate role (e.g., 'Key Vault Secrets User')");
    } else if (error.code === "ENOTFOUND") {
      console.error("Network error - check service endpoint URL");
    } else {
      console.error("Unexpected error:", error.message);
    }
    throw error;
  }
}
