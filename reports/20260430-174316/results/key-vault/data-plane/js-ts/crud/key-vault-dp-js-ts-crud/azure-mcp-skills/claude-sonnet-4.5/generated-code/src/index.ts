import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

/**
 * Azure Key Vault CRUD Operations Demo
 * 
 * Prerequisites:
 * 1. Set environment variable: KEY_VAULT_NAME=<your-keyvault-name>
 * 2. Ensure you have appropriate permissions on the Key Vault
 * 3. Authenticate using Azure CLI: az login
 */

async function main() {
  // Get Key Vault name from environment variable
  const keyVaultName = process.env.KEY_VAULT_NAME;
  
  if (!keyVaultName) {
    throw new Error("KEY_VAULT_NAME environment variable is not set");
  }

  const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
  console.log(`\n🔐 Connecting to Key Vault: ${keyVaultUrl}\n`);

  // Create the SecretClient with DefaultAzureCredential
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(keyVaultUrl, credential);

  const secretName = "my-secret";
  const initialValue = "my-secret-value";
  const updatedValue = "updated-value";

  try {
    // ============================================
    // 1. CREATE - Create a new secret
    // ============================================
    console.log("📝 Step 1: Creating secret...");
    const createResult = await client.setSecret(secretName, initialValue);
    console.log(`✅ Secret created: ${createResult.name}`);
    console.log(`   Version: ${createResult.properties.version}`);
    console.log(`   Created: ${createResult.properties.createdOn}\n`);

    // ============================================
    // 2. READ - Read the secret back
    // ============================================
    console.log("📖 Step 2: Reading secret...");
    const readResult = await client.getSecret(secretName);
    console.log(`✅ Secret retrieved: ${readResult.name}`);
    console.log(`   Value: ${readResult.value}`);
    console.log(`   Version: ${readResult.properties.version}\n`);

    // ============================================
    // 3. UPDATE - Update the secret value
    // ============================================
    console.log("✏️  Step 3: Updating secret...");
    const updateResult = await client.setSecret(secretName, updatedValue);
    console.log(`✅ Secret updated: ${updateResult.name}`);
    console.log(`   New version: ${updateResult.properties.version}`);
    console.log(`   Updated: ${updateResult.properties.updatedOn}`);

    // Read again to verify the update
    const verifyResult = await client.getSecret(secretName);
    console.log(`   New value: ${verifyResult.value}\n`);

    // ============================================
    // 4. DELETE - Delete and purge the secret
    // ============================================
    console.log("🗑️  Step 4: Deleting secret...");
    const deletePoller = await client.beginDeleteSecret(secretName);
    const deletedSecret = await deletePoller.pollUntilDone();
    console.log(`✅ Secret deleted: ${deletedSecret.name}`);
    console.log(`   Scheduled purge date: ${deletedSecret.properties.scheduledPurgeDate}`);
    console.log(`   Deleted on: ${deletedSecret.properties.deletedOn}\n`);

    // Purge the deleted secret (permanent deletion)
    console.log("🔥 Purging deleted secret (permanent deletion)...");
    await client.purgeDeletedSecret(secretName);
    console.log(`✅ Secret purged permanently: ${secretName}\n`);

    console.log("✨ All CRUD operations completed successfully!\n");

  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error occurred:");
      console.error(`   Message: ${error.message}`);
      
      // Check for specific Azure error types
      if ('statusCode' in error) {
        const azureError = error as any;
        console.error(`   Status Code: ${azureError.statusCode}`);
        console.error(`   Code: ${azureError.code || 'N/A'}`);
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
  console.error("💥 Unhandled error in main:", error);
  process.exit(1);
});
