import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { AuthenticationError } from "@azure/identity";

/**
 * Main function that demonstrates Azure Key Vault authentication
 * using DefaultAzureCredential
 */
async function main(): Promise<void> {
  try {
    // Step 1: Get Key Vault URL and secret name from environment variables
    const keyVaultUrl = process.env.KEY_VAULT_URL;
    const secretName = process.env.SECRET_NAME;

    if (!keyVaultUrl) {
      throw new Error(
        "KEY_VAULT_URL environment variable is required. " +
        "Example: https://your-keyvault-name.vault.azure.net/"
      );
    }

    if (!secretName) {
      throw new Error(
        "SECRET_NAME environment variable is required. " +
        "Example: my-secret"
      );
    }

    console.log("Initializing Azure authentication...");
    console.log(`Key Vault URL: ${keyVaultUrl}`);
    console.log(`Secret Name: ${secretName}\n`);

    // Step 2: Create DefaultAzureCredential instance
    // This will try multiple authentication methods in order:
    // 1. EnvironmentCredential (Service Principal via env vars)
    // 2. WorkloadIdentityCredential (Kubernetes)
    // 3. ManagedIdentityCredential (Azure resources)
    // 4. VisualStudioCodeCredential
    // 5. AzureCliCredential
    // 6. AzurePowerShellCredential
    // 7. AzureDeveloperCliCredential
    const credential = new DefaultAzureCredential();

    // Step 3: Create SecretClient with the credential
    const secretClient = new SecretClient(keyVaultUrl, credential);

    console.log("Attempting to retrieve secret...");

    // Step 4: Retrieve the secret from Key Vault
    const secret = await secretClient.getSecret(secretName);

    // Step 5: Print the secret value
    console.log("\n✓ Authentication successful!");
    console.log(`Secret Name: ${secret.name}`);
    console.log(`Secret Value: ${secret.value}`);
    
    if (secret.properties.createdOn) {
      console.log(`Created On: ${secret.properties.createdOn.toISOString()}`);
    }
    if (secret.properties.updatedOn) {
      console.log(`Updated On: ${secret.properties.updatedOn.toISOString()}`);
    }

  } catch (error) {
    // Handle authentication errors specifically
    if (error instanceof AuthenticationError) {
      console.error("\n✗ Authentication failed!");
      console.error("Error:", error.message);
      console.error("\nPossible solutions:");
      console.error("1. Run 'az login' to authenticate via Azure CLI");
      console.error("2. Set environment variables for Service Principal:");
      console.error("   - AZURE_TENANT_ID");
      console.error("   - AZURE_CLIENT_ID");
      console.error("   - AZURE_CLIENT_SECRET");
      console.error("3. Use Managed Identity if running on Azure resources");
      console.error("4. Ensure you have proper permissions to access Key Vault");
      process.exit(1);
    }

    // Handle other errors (e.g., Key Vault not found, secret not found)
    if (error instanceof Error) {
      console.error("\n✗ Error occurred:");
      console.error(error.message);
      
      // Provide helpful context for common errors
      if (error.message.includes("not found")) {
        console.error("\nTip: Verify the KEY_VAULT_URL and SECRET_NAME are correct");
      } else if (error.message.includes("Forbidden")) {
        console.error("\nTip: Ensure your identity has 'Get' permission for secrets");
        console.error("You can grant access using: az keyvault set-policy");
      }
    } else {
      console.error("\n✗ Unknown error occurred:", error);
    }

    process.exit(1);
  }
}

// Execute the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
