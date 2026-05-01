/**
 * User-Assigned Managed Identity Example
 * 
 * A user-assigned identity is a standalone Azure resource that can be
 * assigned to one or more Azure resources.
 * 
 * Use when: Multiple resources need to share the same identity,
 * or you need more control over the identity lifecycle
 */

import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";
import { CosmosClient } from "@azure/cosmos";

/**
 * Create a ManagedIdentityCredential for user-assigned identity
 * Requires the client ID of the user-assigned managed identity
 */
export function createUserAssignedCredential(clientId: string): ManagedIdentityCredential {
  return new ManagedIdentityCredential({ clientId });
}

/**
 * Alternative: Use resource ID instead of client ID
 */
export function createUserAssignedCredentialWithResourceId(
  resourceId: string
): ManagedIdentityCredential {
  // Resource ID format:
  // /subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{identity-name}
  return new ManagedIdentityCredential({ resourceId });
}

/**
 * Example 1: Using user-assigned identity with configuration from environment
 */
export async function accessBlobStorageWithUserIdentity() {
  // Client ID typically stored in environment variable or configuration
  const clientId = process.env.AZURE_CLIENT_ID || "12345678-1234-1234-1234-123456789abc";
  const credential = new ManagedIdentityCredential({ clientId });
  
  const accountName = "mystorageaccount";
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );

  try {
    const containerClient = blobServiceClient.getContainerClient("mycontainer");
    
    // Upload a blob
    const blobName = `data-${Date.now()}.json`;
    const data = { message: "Hello from user-assigned identity" };
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(
      JSON.stringify(data),
      JSON.stringify(data).length
    );
    
    console.log(`Blob uploaded: ${blobName}`);
  } catch (error) {
    console.error("Error accessing blob storage:", error);
    throw error;
  }
}

/**
 * Example 2: Using user-assigned identity with Azure Cosmos DB
 */
export async function accessCosmosDbWithUserIdentity() {
  const clientId = process.env.AZURE_CLIENT_ID;
  if (!clientId) {
    throw new Error("AZURE_CLIENT_ID environment variable not set");
  }
  
  const credential = new ManagedIdentityCredential({ clientId });
  
  const endpoint = "https://mycosmosdb.documents.azure.com:443/";
  const cosmosClient = new CosmosClient({ endpoint, aadCredentials: credential });

  try {
    const database = cosmosClient.database("mydb");
    const container = database.container("mycollection");
    
    // Query items
    const { resources } = await container.items
      .query("SELECT * FROM c WHERE c.active = true")
      .fetchAll();
    
    console.log(`Found ${resources.length} active items`);
    return resources;
  } catch (error) {
    console.error("Error accessing Cosmos DB:", error);
    throw error;
  }
}

/**
 * Example 3: Multiple user-assigned identities scenario
 * Your resource might have multiple user-assigned identities,
 * and you need to specify which one to use
 */
export class MultiIdentityService {
  private storageCredential: ManagedIdentityCredential;
  private keyVaultCredential: ManagedIdentityCredential;

  constructor(
    private storageIdentityClientId: string,
    private keyVaultIdentityClientId: string
  ) {
    // Create separate credentials for different purposes
    this.storageCredential = new ManagedIdentityCredential({ 
      clientId: storageIdentityClientId 
    });
    this.keyVaultCredential = new ManagedIdentityCredential({ 
      clientId: keyVaultIdentityClientId 
    });
  }

  async accessStorage() {
    const blobServiceClient = new BlobServiceClient(
      "https://mystorageaccount.blob.core.windows.net",
      this.storageCredential
    );
    
    // Use storage credential...
  }

  async accessKeyVault() {
    const secretClient = new SecretClient(
      "https://mykeyvault.vault.azure.net",
      this.keyVaultCredential
    );
    
    // Use Key Vault credential...
  }
}

/**
 * Example 4: Comprehensive error handling for user-assigned identity
 */
export async function userIdentityWithErrorHandling(clientId: string) {
  try {
    const credential = new ManagedIdentityCredential({ clientId });
    const vaultUrl = "https://mykeyvault.vault.azure.net";
    const secretClient = new SecretClient(vaultUrl, credential);

    const secret = await secretClient.getSecret("my-secret");
    return secret.value;
  } catch (error: any) {
    if (error.message?.includes("No Managed Identity endpoint found")) {
      console.error("ERROR: Not running in an Azure environment with Managed Identity");
      console.error("Solution: Deploy to Azure VM, App Service, Function, or Container Instance");
    } else if (error.message?.includes("the requested identity has not been assigned")) {
      console.error(`ERROR: User-assigned identity ${clientId} not assigned to this resource`);
      console.error("Solution: Assign the identity to your Azure resource");
    } else if (error.statusCode === 403) {
      console.error("ERROR: Identity doesn't have required permissions");
      console.error(`Solution: Grant the identity (${clientId}) appropriate RBAC role`);
    } else if (error.code === "SecretNotFound") {
      console.error("ERROR: Secret not found in Key Vault");
    } else {
      console.error("Unexpected error:", error);
    }
    throw error;
  }
}

/**
 * Example 5: Validating user-assigned identity configuration
 */
export async function validateUserAssignedIdentity(clientId: string): Promise<boolean> {
  try {
    const credential = new ManagedIdentityCredential({ clientId });
    
    // Try to get a token (doesn't call any actual service)
    const token = await credential.getToken("https://management.azure.com/.default");
    
    if (token) {
      console.log("✓ User-assigned identity authenticated successfully");
      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error("✗ Failed to authenticate with user-assigned identity");
    console.error(`  Client ID: ${clientId}`);
    console.error(`  Error: ${error.message}`);
    return false;
  }
}
