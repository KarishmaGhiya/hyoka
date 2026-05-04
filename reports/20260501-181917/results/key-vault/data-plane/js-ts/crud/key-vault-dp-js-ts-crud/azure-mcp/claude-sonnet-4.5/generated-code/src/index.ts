import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Demonstrates CRUD operations on Azure Key Vault secrets
 * Prerequisites:
 * - Azure Key Vault with soft-delete enabled
 * - Set environment variable: KEY_VAULT_NAME=<your-vault-name>
 * - Authentication configured (Azure CLI login, managed identity, etc.)
 */
async function main() {
  // Get Key Vault name from environment variable
  const keyVaultName = process.env.KEY_VAULT_NAME;
  
  if (!keyVaultName) {
    throw new Error("KEY_VAULT_NAME environment variable is required");
  }

  const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
  
  console.log(`Connecting to Key Vault: ${keyVaultUrl}\n`);

  // Initialize the SecretClient with DefaultAzureCredential
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(keyVaultUrl, credential);

  const secretName = "my-secret";

  try {
    // ========================================
    // 1. CREATE - Set a new secret
    // ========================================
    console.log("📝 CREATE: Setting secret...");
    const createResult = await client.setSecret(secretName, "my-secret-value");
    console.log(`✅ Created secret: ${createResult.name}`);
    console.log(`   Version: ${createResult.properties.version}`);
    console.log(`   Value: ${createResult.value}\n`);

    // ========================================
    // 2. READ - Get the secret value
    // ========================================
    console.log("📖 READ: Getting secret...");
    const readResult = await client.getSecret(secretName);
    console.log(`✅ Retrieved secret: ${readResult.name}`);
    console.log(`   Version: ${readResult.properties.version}`);
    console.log(`   Value: ${readResult.value}`);
    console.log(`   Created on: ${readResult.properties.createdOn}\n`);

    // ========================================
    // 3. UPDATE - Update the secret value
    // ========================================
    console.log("🔄 UPDATE: Updating secret...");
    const updateResult = await client.setSecret(secretName, "updated-value");
    console.log(`✅ Updated secret: ${updateResult.name}`);
    console.log(`   New version: ${updateResult.properties.version}`);
    console.log(`   New value: ${updateResult.value}\n`);

    // Verify the update
    console.log("📖 Verifying update...");
    const verifyResult = await client.getSecret(secretName);
    console.log(`✅ Verified secret value: ${verifyResult.value}\n`);

    // ========================================
    // 4. DELETE - Delete and purge the secret
    // ========================================
    console.log("🗑️  DELETE: Deleting secret...");
    const deletePoller = await client.beginDeleteSecret(secretName);
    const deletedSecret = await deletePoller.pollUntilDone();
    console.log(`✅ Deleted secret: ${deletedSecret.name}`);
    console.log(`   Scheduled purge date: ${deletedSecret.properties.scheduledPurgeDate}`);
    console.log(`   Recovery ID: ${deletedSecret.recoveryId}\n`);

    // Purge the deleted secret (permanent deletion)
    console.log("🧹 PURGE: Purging deleted secret...");
    await client.purgeDeletedSecret(secretName);
    console.log(`✅ Purged secret: ${secretName}`);
    console.log("   Secret has been permanently deleted\n");

    console.log("✨ All CRUD operations completed successfully!");

  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error occurred:");
      console.error(`   Message: ${error.message}`);
      
      // Handle specific Azure errors
      if ('statusCode' in error) {
        const azureError = error as any;
        console.error(`   Status Code: ${azureError.statusCode}`);
        console.error(`   Code: ${azureError.code || 'N/A'}`);
        
        // Provide helpful messages for common errors
        if (azureError.statusCode === 403) {
          console.error("\n💡 Tip: Ensure you have proper permissions on the Key Vault.");
          console.error("   Required permissions: Get, Set, Delete, Purge secrets");
        } else if (azureError.statusCode === 404) {
          console.error("\n💡 Tip: Verify the Key Vault name is correct.");
        }
      }
      
      console.error(`\n   Stack: ${error.stack}`);
    } else {
      console.error("❌ Unknown error occurred:", error);
    }
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
