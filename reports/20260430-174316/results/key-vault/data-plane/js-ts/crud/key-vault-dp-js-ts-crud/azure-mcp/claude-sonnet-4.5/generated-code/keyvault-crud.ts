import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

/**
 * Azure Key Vault CRUD Operations Demo
 * Demonstrates Create, Read, Update, and Delete operations on secrets
 */
async function runKeyVaultCrudOperations() {
  // Replace with your Key Vault name
  const keyVaultName = process.env.KEY_VAULT_NAME;
  
  if (!keyVaultName) {
    throw new Error("KEY_VAULT_NAME environment variable is required");
  }

  const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
  
  // Authenticate using DefaultAzureCredential
  // This will try multiple authentication methods in order:
  // - Environment variables
  // - Managed Identity
  // - Azure CLI
  // - Azure PowerShell, etc.
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(keyVaultUrl, credential);

  const secretName = "my-secret";

  try {
    console.log("=".repeat(60));
    console.log("Azure Key Vault CRUD Operations Demo");
    console.log("=".repeat(60));
    console.log(`Key Vault URL: ${keyVaultUrl}\n`);

    // =============================================
    // 1. CREATE - Add a new secret
    // =============================================
    console.log("1. CREATE - Creating secret...");
    const createResult = await client.setSecret(secretName, "my-secret-value");
    console.log(`   ✓ Secret '${secretName}' created successfully`);
    console.log(`   - Version: ${createResult.properties.version}`);
    console.log(`   - Created: ${createResult.properties.createdOn}\n`);

    // =============================================
    // 2. READ - Retrieve the secret
    // =============================================
    console.log("2. READ - Reading secret...");
    const readResult = await client.getSecret(secretName);
    console.log(`   ✓ Secret '${secretName}' retrieved successfully`);
    console.log(`   - Value: ${readResult.value}`);
    console.log(`   - Version: ${readResult.properties.version}`);
    console.log(`   - Content Type: ${readResult.properties.contentType || "Not set"}\n`);

    // =============================================
    // 3. UPDATE - Modify the secret
    // =============================================
    console.log("3. UPDATE - Updating secret...");
    const updateResult = await client.setSecret(secretName, "updated-value", {
      contentType: "text/plain",
      tags: {
        updated: "true",
        timestamp: new Date().toISOString()
      }
    });
    console.log(`   ✓ Secret '${secretName}' updated successfully`);
    console.log(`   - New Value: updated-value`);
    console.log(`   - New Version: ${updateResult.properties.version}`);
    console.log(`   - Tags:`, updateResult.properties.tags);
    
    // Verify the update
    const verifyRead = await client.getSecret(secretName);
    console.log(`   - Verified Value: ${verifyRead.value}\n`);

    // =============================================
    // 4. DELETE - Remove the secret (soft delete)
    // =============================================
    console.log("4. DELETE - Deleting secret (soft-delete)...");
    const deletePoller = await client.beginDeleteSecret(secretName);
    const deletedSecret = await deletePoller.pollUntilDone();
    console.log(`   ✓ Secret '${secretName}' deleted successfully`);
    console.log(`   - Deleted On: ${deletedSecret.properties.deletedOn}`);
    console.log(`   - Scheduled Purge Date: ${deletedSecret.properties.scheduledPurgeDate}`);
    console.log(`   - Recovery ID: ${deletedSecret.recoveryId}\n`);

    // =============================================
    // PURGE - Permanently remove the secret
    // =============================================
    console.log("5. PURGE - Permanently removing secret...");
    // Wait a moment to ensure delete operation is complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await client.purgeDeletedSecret(secretName);
    console.log(`   ✓ Secret '${secretName}' purged successfully`);
    console.log(`   - The secret is now permanently deleted\n`);

    console.log("=".repeat(60));
    console.log("✓ All CRUD operations completed successfully!");
    console.log("=".repeat(60));

  } catch (error: any) {
    console.error("\n❌ Error occurred during Key Vault operations:");
    
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    
    if (error.statusCode) {
      console.error(`   Status Code: ${error.statusCode}`);
    }
    
    console.error(`   Message: ${error.message}`);
    
    // Common error scenarios
    if (error.statusCode === 401 || error.statusCode === 403) {
      console.error("\n💡 Tip: Ensure you have the required permissions:");
      console.error("   - Key Vault Secrets Officer (or)");
      console.error("   - Key Vault Administrator (or)");
      console.error("   - Access policy with Get, Set, Delete, Purge permissions");
    }
    
    if (error.code === "VaultNotFound") {
      console.error("\n💡 Tip: Verify the KEY_VAULT_NAME environment variable is correct");
    }
    
    throw error;
  }
}

// Run the demo
runKeyVaultCrudOperations()
  .then(() => {
    console.log("\n✓ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error.message);
    process.exit(1);
  });
