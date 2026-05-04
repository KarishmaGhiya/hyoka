import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { AuthenticationError } from "@azure/identity";

/**
 * Main function to demonstrate Azure Key Vault authentication using DefaultAzureCredential
 */
async function main(): Promise<void> {
  try {
    // Get Key Vault URL and secret name from environment variables
    const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;
    const secretName = process.env.SECRET_NAME || "my-secret";

    if (!keyVaultUrl) {
      console.error("Error: AZURE_KEYVAULT_URL environment variable is not set.");
      console.error("Please set it to your Key Vault URL (e.g., https://your-vault.vault.azure.net)");
      process.exit(1);
    }

    console.log("Initializing Azure authentication...");
    console.log(`Key Vault URL: ${keyVaultUrl}`);
    console.log(`Secret Name: ${secretName}\n`);

    // Create DefaultAzureCredential instance
    // This will try credentials in the following order:
    // 1. EnvironmentCredential (service principal via env vars)
    // 2. WorkloadIdentityCredential (Kubernetes)
    // 3. ManagedIdentityCredential (Azure VMs, App Service, etc.)
    // 4. VisualStudioCodeCredential
    // 5. AzureCliCredential
    // 6. AzurePowerShellCredential
    // 7. AzureDeveloperCliCredential
    const credential = new DefaultAzureCredential();

    console.log("Creating SecretClient...");
    // Create SecretClient using the credential
    const secretClient = new SecretClient(keyVaultUrl, credential);

    console.log(`Retrieving secret "${secretName}" from Key Vault...`);
    // Retrieve the secret
    const secret = await secretClient.getSecret(secretName);

    // Print the secret value
    console.log("\n✓ Successfully retrieved secret!");
    console.log(`Secret Name: ${secret.name}`);
    console.log(`Secret Value: ${secret.value}`);
    
    if (secret.properties.version) {
      console.log(`Secret Version: ${secret.properties.version}`);
    }
    if (secret.properties.createdOn) {
      console.log(`Created On: ${secret.properties.createdOn.toISOString()}`);
    }
    if (secret.properties.updatedOn) {
      console.log(`Updated On: ${secret.properties.updatedOn.toISOString()}`);
    }

  } catch (error) {
    // Handle authentication errors specifically
    if (error instanceof AuthenticationError) {
      console.error("\n✗ Authentication Error:");
      console.error(error.message);
      console.error("\nTroubleshooting:");
      console.error("1. Ensure you're logged in with Azure CLI: az login");
      console.error("2. Or set environment variables for service principal:");
      console.error("   - AZURE_TENANT_ID");
      console.error("   - AZURE_CLIENT_ID");
      console.error("   - AZURE_CLIENT_SECRET");
      console.error("3. Verify your account has access to the Key Vault");
      console.error("4. Check that the Key Vault URL is correct");
      process.exit(1);
    }

    // Handle other errors (e.g., secret not found, network issues)
    if (error instanceof Error) {
      console.error("\n✗ Error occurred:");
      console.error(`Message: ${error.message}`);
      
      // Check for common error scenarios
      if (error.message.includes("SecretNotFound")) {
        console.error("\nThe secret does not exist in the Key Vault.");
        console.error("Create it first or specify a different SECRET_NAME.");
      } else if (error.message.includes("Forbidden")) {
        console.error("\nAccess denied. Ensure your identity has Key Vault Secrets User role.");
      } else if (error.message.includes("ResourceNotFound")) {
        console.error("\nKey Vault not found. Verify the AZURE_KEYVAULT_URL is correct.");
      }
      
      process.exit(1);
    }

    // Unexpected error type
    console.error("\n✗ Unexpected error:");
    console.error(error);
    process.exit(1);
  }
}

// Execute the main function
main().catch((error) => {
  console.error("Unhandled error in main():");
  console.error(error);
  process.exit(1);
});
