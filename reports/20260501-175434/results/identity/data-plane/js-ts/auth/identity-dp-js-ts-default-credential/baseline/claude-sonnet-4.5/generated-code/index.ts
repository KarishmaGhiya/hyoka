import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { AuthenticationError } from "@azure/identity";

/**
 * Main function to demonstrate Azure Key Vault authentication
 * using DefaultAzureCredential
 */
async function main(): Promise<void> {
  try {
    // Configuration - replace with your Key Vault details
    const keyVaultName = process.env.KEY_VAULT_NAME || "<your-key-vault-name>";
    const secretName = process.env.SECRET_NAME || "<your-secret-name>";
    const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;

    console.log("🔐 Azure Key Vault Authentication Demo");
    console.log("=" .repeat(50));
    console.log(`Key Vault URL: ${keyVaultUrl}`);
    console.log(`Secret Name: ${secretName}\n`);

    // Step 1: Create DefaultAzureCredential instance
    console.log("📌 Step 1: Creating DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    console.log("✅ DefaultAzureCredential created successfully\n");

    // Step 2: Create SecretClient with the credential
    console.log("📌 Step 2: Creating SecretClient...");
    const client = new SecretClient(keyVaultUrl, credential);
    console.log("✅ SecretClient created successfully\n");

    // Step 3: Retrieve a secret from the vault
    console.log("📌 Step 3: Retrieving secret from Key Vault...");
    const secret = await client.getSecret(secretName);
    
    console.log("✅ Secret retrieved successfully");
    console.log("=" .repeat(50));
    console.log(`Secret Name: ${secret.name}`);
    console.log(`Secret Value: ${secret.value}`);
    console.log(`Secret Version: ${secret.properties.version}`);
    console.log(`Created On: ${secret.properties.createdOn}`);
    console.log(`Updated On: ${secret.properties.updatedOn}`);
    console.log("=" .repeat(50));

  } catch (error: unknown) {
    // Step 4: Handle AuthenticationError for credential failures
    if (error instanceof AuthenticationError) {
      console.error("\n❌ Authentication Error:");
      console.error("Failed to authenticate with Azure services.");
      console.error(`Error Message: ${error.message}`);
      console.error("\nTroubleshooting steps:");
      console.error("1. Ensure you're logged in with Azure CLI: az login");
      console.error("2. Check environment variables (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)");
      console.error("3. Verify managed identity is configured if running on Azure");
      console.error("4. Check that your account has access to the Key Vault");
      process.exit(1);
    } else if (error instanceof Error) {
      console.error("\n❌ Error occurred:");
      console.error(`Error Type: ${error.constructor.name}`);
      console.error(`Error Message: ${error.message}`);
      
      if (error.message.includes("getaddrinfo ENOTFOUND")) {
        console.error("\n⚠️  Key Vault not found. Please check:");
        console.error("1. KEY_VAULT_NAME environment variable is set correctly");
        console.error("2. The Key Vault exists in your Azure subscription");
      } else if (error.message.includes("forbidden")) {
        console.error("\n⚠️  Access denied. Please check:");
        console.error("1. Your account has 'Get' permission for secrets");
        console.error("2. Key Vault access policies or RBAC roles are configured");
      } else if (error.message.includes("not found")) {
        console.error("\n⚠️  Secret not found. Please check:");
        console.error("1. SECRET_NAME environment variable is set correctly");
        console.error("2. The secret exists in the Key Vault");
      }
      
      process.exit(1);
    } else {
      console.error("\n❌ Unknown error occurred:", error);
      process.exit(1);
    }
  }
}

// Execute the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
