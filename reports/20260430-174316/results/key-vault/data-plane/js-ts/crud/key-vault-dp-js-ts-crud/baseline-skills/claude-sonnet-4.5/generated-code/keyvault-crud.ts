import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Demonstrates CRUD operations on Azure Key Vault secrets
 */
async function main() {
  // Replace with your Key Vault URL
  const keyVaultUrl = process.env.AZURE_KEYVAULT_URL || "https://<your-vault-name>.vault.azure.net/";
  
  if (!keyVaultUrl || keyVaultUrl.includes("<your-vault-name>")) {
    console.error("Error: Please set AZURE_KEYVAULT_URL environment variable");
    console.error("Example: export AZURE_KEYVAULT_URL=https://my-vault.vault.azure.net/");
    process.exit(1);
  }

  console.log(`Connecting to Key Vault: ${keyVaultUrl}`);

  // Authenticate using DefaultAzureCredential
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(keyVaultUrl, credential);

  const secretName = "my-secret";

  try {
    // 1. CREATE - Create a new secret
    console.log("\n=== CREATE ===");
    console.log(`Creating secret "${secretName}"...`);
    const createResult = await client.setSecret(secretName, "my-secret-value");
    console.log(`✓ Secret created successfully`);
    console.log(`  Name: ${createResult.name}`);
    console.log(`  Version: ${createResult.properties.version}`);
    console.log(`  Created: ${createResult.properties.createdOn}`);

    // 2. READ - Read the secret back
    console.log("\n=== READ ===");
    console.log(`Reading secret "${secretName}"...`);
    const readResult = await client.getSecret(secretName);
    console.log(`✓ Secret retrieved successfully`);
    console.log(`  Name: ${readResult.name}`);
    console.log(`  Value: ${readResult.value}`);
    console.log(`  Version: ${readResult.properties.version}`);

    // 3. UPDATE - Update the secret to a new value
    console.log("\n=== UPDATE ===");
    console.log(`Updating secret "${secretName}"...`);
    const updateResult = await client.setSecret(secretName, "updated-value");
    console.log(`✓ Secret updated successfully`);
    console.log(`  Name: ${updateResult.name}`);
    console.log(`  New Version: ${updateResult.properties.version}`);
    
    // Verify the update
    const verifyUpdate = await client.getSecret(secretName);
    console.log(`  New Value: ${verifyUpdate.value}`);

    // 4. DELETE - Delete the secret (soft delete)
    console.log("\n=== DELETE ===");
    console.log(`Deleting secret "${secretName}"...`);
    const deletePoller = await client.beginDeleteSecret(secretName);
    const deletedSecret = await deletePoller.pollUntilDone();
    console.log(`✓ Secret soft-deleted successfully`);
    console.log(`  Deleted On: ${deletedSecret.properties.deletedOn}`);
    console.log(`  Scheduled Purge Date: ${deletedSecret.properties.scheduledPurgeDate}`);

    // PURGE - Permanently delete the secret
    console.log("\n=== PURGE ===");
    console.log(`Purging secret "${secretName}"...`);
    await client.purgeDeletedSecret(secretName);
    console.log(`✓ Secret purged successfully (permanently deleted)`);

    console.log("\n=== COMPLETE ===");
    console.log("All CRUD operations completed successfully!");

  } catch (error: any) {
    console.error("\n❌ Error occurred:");
    
    if (error.code) {
      console.error(`  Error Code: ${error.code}`);
    }
    
    if (error.statusCode) {
      console.error(`  Status Code: ${error.statusCode}`);
    }
    
    console.error(`  Message: ${error.message}`);
    
    // Common error scenarios
    if (error.code === "Forbidden") {
      console.error("\n💡 Tip: Ensure your identity has proper Key Vault permissions:");
      console.error("   - Key Vault Secrets Officer (for full CRUD)");
      console.error("   - Or individual permissions: Get, Set, Delete, Purge");
    } else if (error.message?.includes("ENOTFOUND") || error.message?.includes("getaddrinfo")) {
      console.error("\n💡 Tip: Check that your Key Vault URL is correct");
    }
    
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
