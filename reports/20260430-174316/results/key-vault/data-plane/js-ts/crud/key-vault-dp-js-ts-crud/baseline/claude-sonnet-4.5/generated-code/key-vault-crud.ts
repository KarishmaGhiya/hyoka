import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Azure Key Vault CRUD Operations Demo
 * 
 * Prerequisites:
 * - Azure Key Vault with soft-delete enabled
 * - Appropriate permissions (Key Vault Secrets Officer or similar)
 * - Valid Azure credentials configured
 */

async function main() {
  // Replace with your Key Vault URL
  const keyVaultUrl = process.env.KEY_VAULT_URL || "https://your-keyvault-name.vault.azure.net/";
  
  if (keyVaultUrl === "https://your-keyvault-name.vault.azure.net/") {
    console.error("ERROR: Please set the KEY_VAULT_URL environment variable");
    console.error("Example: KEY_VAULT_URL=https://your-keyvault-name.vault.azure.net/");
    process.exit(1);
  }

  console.log(`Connecting to Key Vault: ${keyVaultUrl}\n`);

  // Initialize the credential and secret client
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(keyVaultUrl, credential);

  const secretName = "my-secret";

  try {
    // ===== CREATE =====
    console.log("1. CREATE - Setting a new secret...");
    const createResult = await client.setSecret(secretName, "my-secret-value");
    console.log(`✓ Secret '${secretName}' created successfully`);
    console.log(`  Version: ${createResult.properties.version}`);
    console.log(`  Created: ${createResult.properties.createdOn}\n`);

    // ===== READ =====
    console.log("2. READ - Retrieving the secret...");
    const readResult = await client.getSecret(secretName);
    console.log(`✓ Secret '${secretName}' retrieved successfully`);
    console.log(`  Value: ${readResult.value}`);
    console.log(`  Version: ${readResult.properties.version}\n`);

    // ===== UPDATE =====
    console.log("3. UPDATE - Updating the secret to a new value...");
    const updateResult = await client.setSecret(secretName, "updated-value");
    console.log(`✓ Secret '${secretName}' updated successfully`);
    console.log(`  New Value: ${updateResult.value}`);
    console.log(`  New Version: ${updateResult.properties.version}`);
    console.log(`  Updated: ${updateResult.properties.updatedOn}\n`);

    // Verify the update
    const verifyResult = await client.getSecret(secretName);
    console.log(`✓ Verified updated value: ${verifyResult.value}\n`);

    // ===== DELETE =====
    console.log("4. DELETE - Soft-deleting the secret...");
    const deletePoller = await client.beginDeleteSecret(secretName);
    const deletedSecret = await deletePoller.pollUntilDone();
    console.log(`✓ Secret '${secretName}' soft-deleted successfully`);
    console.log(`  Deleted On: ${deletedSecret.properties.deletedOn}`);
    console.log(`  Scheduled Purge Date: ${deletedSecret.properties.scheduledPurgeDate}\n`);

    // ===== PURGE =====
    console.log("5. PURGE - Permanently deleting the secret...");
    await client.purgeDeletedSecret(secretName);
    console.log(`✓ Secret '${secretName}' purged successfully`);
    console.log(`  The secret has been permanently removed from the Key Vault\n`);

    console.log("✓ All CRUD operations completed successfully!");

  } catch (error: any) {
    console.error("\n❌ Error occurred during Key Vault operations:");
    
    if (error.code === "Forbidden") {
      console.error("Access denied. Please ensure you have the necessary permissions:");
      console.error("  - Key Vault Secrets Officer (or similar role)");
      console.error("  - Ensure your Azure credentials are properly configured");
    } else if (error.code === "SecretNotFound") {
      console.error(`Secret '${secretName}' was not found in the Key Vault`);
    } else if (error.statusCode === 401) {
      console.error("Authentication failed. Please check your Azure credentials:");
      console.error("  - Azure CLI: az login");
      console.error("  - Service Principal: Set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID");
      console.error("  - Managed Identity: Ensure the identity is properly configured");
    } else {
      console.error(`Error: ${error.message}`);
      console.error(`Code: ${error.code || 'N/A'}`);
      console.error(`Status: ${error.statusCode || 'N/A'}`);
    }
    
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Execute the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
