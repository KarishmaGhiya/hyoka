/**
 * System-Assigned Managed Identity Example
 * 
 * This example demonstrates using a system-assigned managed identity
 * to authenticate with Azure Key Vault and Azure Storage.
 */

import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { BlobServiceClient } from "@azure/storage-blob";

export async function systemAssignedExample(): Promise<void> {
  console.log("=== System-Assigned Managed Identity Example ===\n");
  
  // Create credential - no parameters needed for system-assigned
  const credential = new ManagedIdentityCredential();
  console.log("✓ Created ManagedIdentityCredential (system-assigned)");
  
  // Example 1: Azure Key Vault
  await useKeyVault(credential);
  
  // Example 2: Azure Storage
  await useStorage(credential);
}

async function useKeyVault(credential: ManagedIdentityCredential): Promise<void> {
  console.log("\n--- Key Vault Example ---");
  
  const keyVaultUrl = process.env.KEY_VAULT_URL || "https://my-keyvault.vault.azure.net";
  const secretClient = new SecretClient(keyVaultUrl, credential);
  
  try {
    // Retrieve a secret
    const secretName = "database-connection-string";
    console.log(`Fetching secret: ${secretName}`);
    
    const secret = await secretClient.getSecret(secretName);
    console.log(`✓ Successfully retrieved secret: ${secretName}`);
    console.log(`  Secret value length: ${secret.value?.length || 0} characters`);
  } catch (error: any) {
    console.error("✗ Failed to retrieve secret");
    
    if (error.statusCode === 403) {
      console.error("  Permission denied. Assign 'Key Vault Secrets User' role:");
      console.error("  az role assignment create \\");
      console.error("    --assignee <system-identity-principal-id> \\");
      console.error("    --role 'Key Vault Secrets User' \\");
      console.error(`    --scope <key-vault-resource-id>`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
  }
}

async function useStorage(credential: ManagedIdentityCredential): Promise<void> {
  console.log("\n--- Storage Example ---");
  
  const storageAccountName = process.env.STORAGE_ACCOUNT_NAME || "mystorageaccount";
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential
  );
  
  try {
    // List containers
    console.log("Listing storage containers...");
    
    const containers: string[] = [];
    for await (const container of blobServiceClient.listContainers()) {
      containers.push(container.name);
    }
    
    console.log(`✓ Successfully listed ${containers.length} container(s)`);
    containers.forEach(name => console.log(`  - ${name}`));
  } catch (error: any) {
    console.error("✗ Failed to list containers");
    
    if (error.statusCode === 403) {
      console.error("  Permission denied. Assign 'Storage Blob Data Reader' role:");
      console.error("  az role assignment create \\");
      console.error("    --assignee <system-identity-principal-id> \\");
      console.error("    --role 'Storage Blob Data Reader' \\");
      console.error(`    --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/${storageAccountName}`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
  }
}

// Run the example
if (require.main === module) {
  systemAssignedExample().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
