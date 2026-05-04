import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

/**
 * Azure Key Vault CRUD Operations Demo
 * 
 * This script demonstrates all four CRUD operations on Key Vault secrets:
 * 1. Create - Add a new secret
 * 2. Read - Retrieve the secret value
 * 3. Update - Modify the secret value
 * 4. Delete - Remove and purge the secret
 */

async function main() {
  // Configuration
  const keyVaultName = process.env.KEY_VAULT_NAME;
  
  if (!keyVaultName) {
    throw new Error("KEY_VAULT_NAME environment variable is required");
  }

  const vaultUrl = `https://${keyVaultName}.vault.azure.net`;
  const secretName = "my-secret";
  
  console.log(`\n🔐 Azure Key Vault CRUD Operations Demo`);
  console.log(`Key Vault: ${vaultUrl}\n`);

  // Initialize credential and client
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(vaultUrl, credential);

  try {
    // ========================================
    // 1. CREATE - Add a new secret
    // ========================================
    console.log(`📝 Creating secret "${secretName}"...`);
    
    const createResult = await client.setSecret(secretName, "my-secret-value");
    console.log(`✅ Secret created successfully`);
    console.log(`   - Name: ${createResult.name}`);
    console.log(`   - Version: ${createResult.properties.version}`);
    console.log(`   - Created: ${createResult.properties.createdOn}\n`);

    // ========================================
    // 2. READ - Retrieve the secret
    // ========================================
    console.log(`📖 Reading secret "${secretName}"...`);
    
    const secret = await client.getSecret(secretName);
    console.log(`✅ Secret retrieved successfully`);
    console.log(`   - Name: ${secret.name}`);
    console.log(`   - Value: ${secret.value}`);
    console.log(`   - Version: ${secret.properties.version}`);
    console.log(`   - Updated: ${secret.properties.updatedOn}\n`);

    // ========================================
    // 3. UPDATE - Modify the secret value
    // ========================================
    console.log(`🔄 Updating secret "${secretName}"...`);
    
    const updateResult = await client.setSecret(secretName, "updated-value", {
      contentType: "text/plain",
      tags: {
        updated: "true",
        timestamp: new Date().toISOString()
      }
    });
    console.log(`✅ Secret updated successfully`);
    console.log(`   - Name: ${updateResult.name}`);
    console.log(`   - New Version: ${updateResult.properties.version}`);
    console.log(`   - Content Type: ${updateResult.properties.contentType}`);
    console.log(`   - Tags: ${JSON.stringify(updateResult.properties.tags)}\n`);

    // Verify the update by reading again
    console.log(`📖 Verifying updated value...`);
    const updatedSecret = await client.getSecret(secretName);
    console.log(`✅ Verified new value: ${updatedSecret.value}\n`);

    // ========================================
    // 4. DELETE - Remove and purge the secret
    // ========================================
    console.log(`🗑️  Deleting secret "${secretName}"...`);
    
    // Begin delete (soft delete)
    const deletePoller = await client.beginDeleteSecret(secretName);
    const deletedSecret = await deletePoller.pollUntilDone();
    console.log(`✅ Secret deleted (soft delete)`);
    console.log(`   - Deleted On: ${deletedSecret.properties.deletedOn}`);
    console.log(`   - Scheduled Purge: ${deletedSecret.properties.scheduledPurgeDate}`);
    console.log(`   - Recovery ID: ${deletedSecret.recoveryId}\n`);

    // Purge the secret permanently
    console.log(`🔥 Purging secret "${secretName}" permanently...`);
    await client.purgeDeletedSecret(secretName);
    console.log(`✅ Secret purged successfully\n`);

    console.log(`✨ All CRUD operations completed successfully!`);

  } catch (error) {
    console.error(`\n❌ Error occurred during Key Vault operations:`);
    
    if (error instanceof Error) {
      console.error(`   - Message: ${error.message}`);
      
      // Handle specific Azure error types
      if ('statusCode' in error) {
        const azureError = error as any;
        console.error(`   - Status Code: ${azureError.statusCode}`);
        console.error(`   - Code: ${azureError.code || 'N/A'}`);
        
        // Provide helpful troubleshooting hints
        if (azureError.statusCode === 401) {
          console.error(`\n💡 Troubleshooting: Authentication failed`);
          console.error(`   - Ensure you're logged in: az login`);
          console.error(`   - Check RBAC permissions on the Key Vault`);
          console.error(`   - Required role: "Key Vault Secrets Officer" or "Key Vault Administrator"`);
        } else if (azureError.statusCode === 403) {
          console.error(`\n💡 Troubleshooting: Access denied`);
          console.error(`   - Check your access policies or RBAC role assignments`);
          console.error(`   - Required permissions: Get, Set, Delete, Purge secrets`);
        } else if (azureError.statusCode === 404) {
          console.error(`\n💡 Troubleshooting: Key Vault not found`);
          console.error(`   - Verify KEY_VAULT_NAME environment variable`);
          console.error(`   - Check if the Key Vault exists: az keyvault show --name ${keyVaultName}`);
        }
      }
    } else {
      console.error(`   - Unknown error: ${error}`);
    }
    
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
