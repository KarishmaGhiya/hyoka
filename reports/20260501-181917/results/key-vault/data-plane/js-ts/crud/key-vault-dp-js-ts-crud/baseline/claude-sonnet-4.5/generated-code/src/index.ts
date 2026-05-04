import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

/**
 * Performs CRUD operations on Azure Key Vault secrets
 */
async function main() {
  // Get Key Vault URL from environment variable
  const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;
  
  if (!keyVaultUrl) {
    throw new Error(
      "AZURE_KEYVAULT_URL environment variable is required. " +
      "Example: https://your-vault-name.vault.azure.net/"
    );
  }

  console.log(`Connecting to Key Vault: ${keyVaultUrl}\n`);

  // Create SecretClient with DefaultAzureCredential
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(keyVaultUrl, credential);

  const secretName = "my-secret";

  try {
    // ========================================
    // 1. CREATE: Set a new secret
    // ========================================
    console.log("1. CREATE: Creating new secret...");
    const createResult = await client.setSecret(secretName, "my-secret-value");
    console.log(`   ✓ Secret created: ${createResult.name}`);
    console.log(`   Version: ${createResult.properties.version}`);
    console.log();

    // ========================================
    // 2. READ: Retrieve the secret
    // ========================================
    console.log("2. READ: Reading secret...");
    const readResult = await client.getSecret(secretName);
    console.log(`   ✓ Secret retrieved: ${readResult.name}`);
    console.log(`   Value: ${readResult.value}`);
    console.log(`   Version: ${readResult.properties.version}`);
    console.log();

    // ========================================
    // 3. UPDATE: Update the secret value
    // ========================================
    console.log("3. UPDATE: Updating secret to new value...");
    const updateResult = await client.setSecret(secretName, "updated-value");
    console.log(`   ✓ Secret updated: ${updateResult.name}`);
    console.log(`   New version: ${updateResult.properties.version}`);
    
    // Verify the update
    const verifyResult = await client.getSecret(secretName);
    console.log(`   Verified new value: ${verifyResult.value}`);
    console.log();

    // ========================================
    // 4. DELETE: Delete and purge the secret
    // ========================================
    console.log("4. DELETE: Deleting secret...");
    const deletePoller = await client.beginDeleteSecret(secretName);
    const deletedSecret = await deletePoller.pollUntilDone();
    console.log(`   ✓ Secret deleted: ${deletedSecret.name}`);
    console.log(`   Recovery ID: ${deletedSecret.properties.recoveryId}`);
    console.log();

    console.log("   Purging secret (permanent deletion)...");
    await client.purgeDeletedSecret(secretName);
    console.log(`   ✓ Secret purged permanently`);
    console.log();

    console.log("All CRUD operations completed successfully! ✓");

  } catch (error) {
    console.error("\n❌ Error occurred during operation:");
    
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      
      // Handle specific Azure error codes
      if ('code' in error) {
        console.error(`   Error code: ${(error as any).code}`);
      }
      if ('statusCode' in error) {
        console.error(`   Status code: ${(error as any).statusCode}`);
      }
      
      // Common troubleshooting tips
      if (error.message.includes("Authentication")) {
        console.error("\n   💡 Tip: Ensure you're authenticated with Azure CLI:");
        console.error("      Run: az login");
      } else if (error.message.includes("Forbidden") || error.message.includes("403")) {
        console.error("\n   💡 Tip: Check your Key Vault access policies:");
        console.error("      Your identity needs 'Get', 'Set', 'Delete', and 'Purge' permissions");
      } else if (error.message.includes("NotFound") || error.message.includes("404")) {
        console.error("\n   💡 Tip: Verify the Key Vault URL is correct");
      }
    } else {
      console.error(error);
    }
    
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
