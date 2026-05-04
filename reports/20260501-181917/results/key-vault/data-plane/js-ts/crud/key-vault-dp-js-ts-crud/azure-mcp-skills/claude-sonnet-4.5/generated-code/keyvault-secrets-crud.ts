import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

/**
 * Azure Key Vault Secrets CRUD Demo
 * 
 * Prerequisites:
 * - Azure Key Vault with soft-delete enabled
 * - Appropriate RBAC permissions (Key Vault Secrets Officer or similar)
 * - Authentication configured (Azure CLI login, managed identity, etc.)
 * 
 * Environment Variables:
 * - AZURE_KEYVAULT_NAME: Your Key Vault name (e.g., "my-keyvault")
 * OR
 * - KEY_VAULT_URL: Full vault URL (e.g., "https://my-keyvault.vault.azure.net")
 */

async function main(): Promise<void> {
  console.log("=== Azure Key Vault Secrets CRUD Operations ===\n");

  // Initialize credential and client
  const credential = new DefaultAzureCredential();
  
  // Get vault URL from environment
  const vaultName = process.env.AZURE_KEYVAULT_NAME;
  const vaultUrl = process.env.KEY_VAULT_URL || 
    (vaultName ? `https://${vaultName}.vault.azure.net` : "");

  if (!vaultUrl) {
    throw new Error(
      "Please set AZURE_KEYVAULT_NAME or KEY_VAULT_URL environment variable"
    );
  }

  console.log(`Connecting to Key Vault: ${vaultUrl}\n`);
  const secretClient = new SecretClient(vaultUrl, credential);

  const secretName = "my-secret";
  const initialValue = "my-secret-value";
  const updatedValue = "updated-value";

  try {
    // ========================================
    // 1. CREATE - Set a new secret
    // ========================================
    console.log("1. CREATE - Creating secret...");
    const createResult = await secretClient.setSecret(secretName, initialValue, {
      contentType: "text/plain",
      tags: {
        environment: "demo",
        purpose: "crud-example"
      }
    });
    
    console.log(`✓ Secret created: ${createResult.name}`);
    console.log(`  Version: ${createResult.properties.version}`);
    console.log(`  Created: ${createResult.properties.createdOn?.toISOString()}\n`);

    // ========================================
    // 2. READ - Retrieve the secret
    // ========================================
    console.log("2. READ - Reading secret...");
    const readResult = await secretClient.getSecret(secretName);
    
    console.log(`✓ Secret retrieved: ${readResult.name}`);
    console.log(`  Value: ${readResult.value}`);
    console.log(`  Version: ${readResult.properties.version}`);
    console.log(`  Content-Type: ${readResult.properties.contentType}`);
    console.log(`  Tags: ${JSON.stringify(readResult.properties.tags)}\n`);

    // ========================================
    // 3. UPDATE - Update the secret value
    // ========================================
    console.log("3. UPDATE - Updating secret...");
    const updateResult = await secretClient.setSecret(secretName, updatedValue, {
      contentType: "text/plain",
      tags: {
        environment: "demo",
        purpose: "crud-example",
        updated: "true"
      }
    });
    
    console.log(`✓ Secret updated: ${updateResult.name}`);
    console.log(`  New Version: ${updateResult.properties.version}`);
    console.log(`  Updated: ${updateResult.properties.updatedOn?.toISOString()}`);

    // Read back to verify update
    const verifyResult = await secretClient.getSecret(secretName);
    console.log(`  New Value: ${verifyResult.value}\n`);

    // ========================================
    // 4. DELETE - Soft delete the secret
    // ========================================
    console.log("4. DELETE - Deleting secret (soft delete)...");
    const deletePoller = await secretClient.beginDeleteSecret(secretName);
    const deletedSecret = await deletePoller.pollUntilDone();
    
    console.log(`✓ Secret deleted: ${deletedSecret.name}`);
    console.log(`  Deleted On: ${deletedSecret.properties.deletedOn?.toISOString()}`);
    console.log(`  Recovery ID: ${deletedSecret.properties.recoveryId}\n`);

    // ========================================
    // 5. PURGE - Permanently delete the secret
    // ========================================
    console.log("5. PURGE - Purging deleted secret...");
    await secretClient.purgeDeletedSecret(secretName);
    
    console.log(`✓ Secret purged permanently: ${secretName}\n`);

    console.log("=== All CRUD operations completed successfully! ===");

  } catch (error: any) {
    console.error("\n❌ Error occurred:");
    
    if (error.code) {
      console.error(`  Code: ${error.code}`);
    }
    
    if (error.statusCode) {
      console.error(`  Status: ${error.statusCode}`);
    }
    
    console.error(`  Message: ${error.message}`);

    // Specific error handling
    if (error.code === "SecretNotFound") {
      console.error("\n  The secret does not exist in the vault.");
    } else if (error.code === "Forbidden") {
      console.error("\n  Access denied. Check your RBAC permissions.");
      console.error("  Required role: Key Vault Secrets Officer or similar");
    } else if (error.statusCode === 401) {
      console.error("\n  Authentication failed. Ensure you're logged in:");
      console.error("  Run: az login");
    }

    throw error;
  }
}

// Run the script
main().catch((error) => {
  console.error("\n💥 Script failed:", error.message);
  process.exit(1);
});
