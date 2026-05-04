import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Demonstrates all four CRUD operations on Azure Key Vault secrets:
 * - Create a secret
 * - Read the secret
 * - Update the secret
 * - Delete and purge the secret
 */
async function main() {
  // Replace with your Key Vault URL (e.g., https://your-keyvault-name.vault.azure.net/)
  const keyVaultUrl = process.env.KEY_VAULT_URL;

  if (!keyVaultUrl) {
    throw new Error(
      "KEY_VAULT_URL environment variable is required. " +
      "Set it to your Key Vault URL (e.g., https://your-keyvault-name.vault.azure.net/)"
    );
  }

  console.log(`Connecting to Key Vault: ${keyVaultUrl}\n`);

  // Create a SecretClient using DefaultAzureCredential
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(keyVaultUrl, credential);

  const secretName = "my-secret";

  try {
    // ============================================
    // 1. CREATE - Create a new secret
    // ============================================
    console.log("1. CREATE operation:");
    console.log(`   Creating secret "${secretName}" with value "my-secret-value"...`);
    
    const createResult = await client.setSecret(secretName, "my-secret-value");
    console.log(`   ✓ Secret created successfully`);
    console.log(`   - Version: ${createResult.properties.version}`);
    console.log(`   - Created: ${createResult.properties.createdOn}\n`);

    // ============================================
    // 2. READ - Read the secret back
    // ============================================
    console.log("2. READ operation:");
    console.log(`   Reading secret "${secretName}"...`);
    
    const readResult = await client.getSecret(secretName);
    console.log(`   ✓ Secret retrieved successfully`);
    console.log(`   - Name: ${readResult.name}`);
    console.log(`   - Value: ${readResult.value}`);
    console.log(`   - Version: ${readResult.properties.version}\n`);

    // ============================================
    // 3. UPDATE - Update the secret to a new value
    // ============================================
    console.log("3. UPDATE operation:");
    console.log(`   Updating secret "${secretName}" to "updated-value"...`);
    
    const updateResult = await client.setSecret(secretName, "updated-value");
    console.log(`   ✓ Secret updated successfully`);
    console.log(`   - New Version: ${updateResult.properties.version}`);
    console.log(`   - Updated: ${updateResult.properties.updatedOn}`);
    
    // Verify the update
    const verifyResult = await client.getSecret(secretName);
    console.log(`   - Verified Value: ${verifyResult.value}\n`);

    // ============================================
    // 4. DELETE - Delete and purge the secret
    // ============================================
    console.log("4. DELETE operation:");
    console.log(`   Deleting secret "${secretName}"...`);
    
    // Begin delete operation (soft delete)
    const deletePoller = await client.beginDeleteSecret(secretName);
    const deletedSecret = await deletePoller.pollUntilDone();
    console.log(`   ✓ Secret soft-deleted successfully`);
    console.log(`   - Deleted On: ${deletedSecret.properties.deletedOn}`);
    console.log(`   - Scheduled Purge: ${deletedSecret.properties.scheduledPurgeDate}`);
    
    // Purge the secret permanently
    console.log(`   Purging secret "${secretName}" permanently...`);
    await client.purgeDeletedSecret(secretName);
    console.log(`   ✓ Secret purged successfully\n`);

    console.log("✅ All CRUD operations completed successfully!");

  } catch (error: any) {
    console.error("❌ Error occurred during Key Vault operations:");
    
    if (error.statusCode === 401) {
      console.error("   Authentication failed. Make sure you have:");
      console.error("   1. Azure CLI logged in (az login)");
      console.error("   2. Appropriate permissions on the Key Vault");
      console.error("   3. Key Vault access policies or RBAC roles configured");
    } else if (error.statusCode === 403) {
      console.error("   Access denied. You need the following permissions:");
      console.error("   - Get, Set, Delete, Purge secrets");
      console.error("   Configure access policies or assign the 'Key Vault Secrets Officer' role");
    } else if (error.statusCode === 404) {
      console.error("   Key Vault not found. Check your KEY_VAULT_URL");
    } else {
      console.error(`   ${error.message}`);
      if (error.code) {
        console.error(`   Error Code: ${error.code}`);
      }
    }
    
    console.error("\nFull error details:", error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
