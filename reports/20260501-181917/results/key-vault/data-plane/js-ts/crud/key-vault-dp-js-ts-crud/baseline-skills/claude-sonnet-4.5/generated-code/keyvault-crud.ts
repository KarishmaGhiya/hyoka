import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Azure Key Vault Secrets CRUD Operations Demo
 * 
 * Prerequisites:
 * 1. Azure Key Vault with soft-delete enabled
 * 2. Set environment variable: KEY_VAULT_NAME (or KEY_VAULT_URL)
 * 3. Azure credentials configured (Azure CLI, Managed Identity, or other auth method)
 * 4. RBAC permissions: Get, Set, Delete, and Purge secrets
 */

async function main() {
  try {
    // Initialize the SecretClient
    const vaultName = process.env.KEY_VAULT_NAME;
    const vaultUrl = process.env.KEY_VAULT_URL || `https://${vaultName}.vault.azure.net`;
    
    if (!vaultName && !process.env.KEY_VAULT_URL) {
      throw new Error("Please set KEY_VAULT_NAME or KEY_VAULT_URL environment variable");
    }
    
    console.log(`Connecting to Key Vault: ${vaultUrl}\n`);
    
    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(vaultUrl, credential);

    // ===== 1. CREATE: Set a new secret =====
    console.log("=== 1. CREATE SECRET ===");
    try {
      const secretName = "my-secret";
      const secretValue = "my-secret-value";
      
      const createdSecret = await secretClient.setSecret(secretName, secretValue, {
        enabled: true,
        contentType: "text/plain",
        tags: {
          purpose: "demo",
          environment: "development"
        }
      });
      
      console.log(`✓ Created secret: ${createdSecret.name}`);
      console.log(`  Version: ${createdSecret.properties.version}`);
      console.log(`  Created on: ${createdSecret.properties.createdOn}`);
      console.log(`  Content Type: ${createdSecret.properties.contentType}`);
      console.log(`  Tags: ${JSON.stringify(createdSecret.properties.tags)}\n`);
    } catch (error: any) {
      console.error(`✗ Failed to create secret: ${error.message}`);
      if (error.statusCode === 403) {
        console.error("  Hint: Check RBAC permissions - need 'Set' permission on secrets\n");
      }
      throw error;
    }

    // ===== 2. READ: Get the secret value =====
    console.log("=== 2. READ SECRET ===");
    try {
      const secretName = "my-secret";
      
      const retrievedSecret = await secretClient.getSecret(secretName);
      
      console.log(`✓ Retrieved secret: ${retrievedSecret.name}`);
      console.log(`  Value: ${retrievedSecret.value}`);
      console.log(`  Version: ${retrievedSecret.properties.version}`);
      console.log(`  Enabled: ${retrievedSecret.properties.enabled}`);
      console.log(`  Content Type: ${retrievedSecret.properties.contentType}\n`);
    } catch (error: any) {
      console.error(`✗ Failed to read secret: ${error.message}`);
      if (error.statusCode === 404) {
        console.error("  Hint: Secret not found\n");
      } else if (error.statusCode === 403) {
        console.error("  Hint: Check RBAC permissions - need 'Get' permission on secrets\n");
      }
      throw error;
    }

    // ===== 3. UPDATE: Update secret to new value =====
    console.log("=== 3. UPDATE SECRET ===");
    try {
      const secretName = "my-secret";
      const newValue = "updated-value";
      
      // Setting a secret with the same name creates a new version
      const updatedSecret = await secretClient.setSecret(secretName, newValue, {
        enabled: true,
        contentType: "text/plain",
        tags: {
          purpose: "demo",
          environment: "development",
          updated: new Date().toISOString()
        }
      });
      
      console.log(`✓ Updated secret: ${updatedSecret.name}`);
      console.log(`  New value: ${updatedSecret.value}`);
      console.log(`  New version: ${updatedSecret.properties.version}`);
      console.log(`  Updated on: ${updatedSecret.properties.updatedOn}`);
      
      // Verify the update by reading back
      const verifySecret = await secretClient.getSecret(secretName);
      console.log(`  Verified value: ${verifySecret.value}\n`);
    } catch (error: any) {
      console.error(`✗ Failed to update secret: ${error.message}`);
      if (error.statusCode === 403) {
        console.error("  Hint: Check RBAC permissions - need 'Set' permission on secrets\n");
      }
      throw error;
    }

    // ===== 4. DELETE: Soft-delete and purge the secret =====
    console.log("=== 4. DELETE SECRET ===");
    try {
      const secretName = "my-secret";
      
      // Step 4a: Soft delete the secret
      console.log("  Step 1: Soft-deleting secret...");
      const deletePoller = await secretClient.beginDeleteSecret(secretName);
      
      // Wait for deletion to complete
      const deletedSecret = await deletePoller.pollUntilDone();
      
      console.log(`✓ Soft-deleted secret: ${deletedSecret.name}`);
      console.log(`  Deleted on: ${deletedSecret.deletedOn}`);
      console.log(`  Scheduled purge date: ${deletedSecret.scheduledPurgeDate}`);
      console.log(`  Recovery ID: ${deletedSecret.recoveryId}\n`);
      
      // Step 4b: Purge the secret (permanent deletion)
      console.log("  Step 2: Purging secret (permanent deletion)...");
      await secretClient.purgeDeletedSecret(secretName);
      
      console.log(`✓ Permanently purged secret: ${secretName}`);
      console.log("  Note: This operation is IRREVERSIBLE\n");
      
    } catch (error: any) {
      console.error(`✗ Failed to delete/purge secret: ${error.message}`);
      if (error.statusCode === 403) {
        console.error("  Hint: Check RBAC permissions - need 'Delete' and 'Purge' permissions\n");
      } else if (error.statusCode === 404) {
        console.error("  Hint: Secret not found or already deleted\n");
      }
      throw error;
    }

    console.log("=== CRUD OPERATIONS COMPLETED SUCCESSFULLY ===\n");
    
  } catch (error: any) {
    console.error("\n❌ Error occurred:", error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.statusCode) {
      console.error(`   HTTP status: ${error.statusCode}`);
    }
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
