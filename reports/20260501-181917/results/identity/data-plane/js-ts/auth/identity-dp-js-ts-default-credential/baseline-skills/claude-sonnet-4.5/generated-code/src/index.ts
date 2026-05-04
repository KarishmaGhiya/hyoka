import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { RestError } from "@azure/core-rest-pipeline";

/**
 * Main function to demonstrate DefaultAzureCredential usage with Key Vault
 */
async function main(): Promise<void> {
  try {
    // Step 1: Get Key Vault URL from environment variable
    const keyVaultName = process.env.AZURE_KEYVAULT_NAME;
    
    if (!keyVaultName) {
      throw new Error("AZURE_KEYVAULT_NAME environment variable is not set");
    }
    
    const vaultUrl = `https://${keyVaultName}.vault.azure.net`;
    console.log(`Key Vault URL: ${vaultUrl}`);
    
    // Step 2: Create DefaultAzureCredential instance
    // This will attempt authentication using multiple methods in order:
    // 1. EnvironmentCredential (service principal via env vars)
    // 2. WorkloadIdentityCredential (Kubernetes)
    // 3. ManagedIdentityCredential (Azure resources)
    // 4. VisualStudioCodeCredential
    // 5. AzureCliCredential (az login)
    // 6. AzurePowerShellCredential (Connect-AzAccount)
    // 7. AzureDeveloperCliCredential (azd auth login)
    console.log("\nCreating DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    
    // Step 3: Create SecretClient using the credential
    console.log("Creating SecretClient...");
    const secretClient = new SecretClient(vaultUrl, credential);
    
    // Step 4: Get secret name from environment or use default
    const secretName = process.env.SECRET_NAME || "MySecret";
    console.log(`\nAttempting to retrieve secret: ${secretName}`);
    
    // Step 5: Retrieve the secret and print its value
    const secret = await secretClient.getSecret(secretName);
    
    console.log("\n=== Secret Retrieved Successfully ===");
    console.log(`Secret Name: ${secret.name}`);
    console.log(`Secret Value: ${secret.value}`);
    console.log(`Version: ${secret.properties.version}`);
    console.log(`Content Type: ${secret.properties.contentType || "N/A"}`);
    console.log(`Created On: ${secret.properties.createdOn}`);
    console.log(`Updated On: ${secret.properties.updatedOn}`);
    console.log(`Enabled: ${secret.properties.enabled}`);
    
    if (secret.properties.expiresOn) {
      console.log(`Expires On: ${secret.properties.expiresOn}`);
    }
    
    if (secret.properties.tags && Object.keys(secret.properties.tags).length > 0) {
      console.log(`Tags: ${JSON.stringify(secret.properties.tags, null, 2)}`);
    }
    
  } catch (error: unknown) {
    // Step 6: Handle errors appropriately
    handleError(error);
  }
}

/**
 * Error handler that specifically handles authentication errors
 */
function handleError(error: unknown): void {
  console.error("\n=== Error Occurred ===");
  
  if (error instanceof Error) {
    // Check for authentication-related errors
    if (error.name === "AuthenticationError" || 
        error.name === "CredentialUnavailableError" ||
        error.message.includes("authentication") ||
        error.message.includes("credential")) {
      
      console.error("❌ AUTHENTICATION ERROR");
      console.error(`Message: ${error.message}`);
      console.error("\nPossible solutions:");
      console.error("1. Run 'az login' to authenticate with Azure CLI");
      console.error("2. Set service principal environment variables:");
      console.error("   - AZURE_TENANT_ID");
      console.error("   - AZURE_CLIENT_ID");
      console.error("   - AZURE_CLIENT_SECRET");
      console.error("3. Use managed identity if running on Azure resources");
      console.error("4. Ensure you have the correct permissions to access the Key Vault");
      
    } else if (error instanceof RestError) {
      // Handle Key Vault specific REST errors
      console.error(`❌ KEY VAULT ERROR (Status ${error.statusCode})`);
      console.error(`Message: ${error.message}`);
      
      switch (error.statusCode) {
        case 404:
          console.error("\nThe secret was not found in the Key Vault.");
          console.error(`Make sure the secret exists or check the SECRET_NAME environment variable.`);
          break;
        case 403:
          console.error("\nAccess denied. Check that:");
          console.error("1. Your identity has the correct RBAC permissions");
          console.error("2. You have 'Key Vault Secrets User' or 'Key Vault Secrets Officer' role");
          console.error("3. The Key Vault firewall allows your IP address");
          break;
        case 401:
          console.error("\nUnauthorized. Your credentials may be invalid or expired.");
          break;
        case 429:
          console.error("\nRate limited. Too many requests to Key Vault.");
          break;
        default:
          console.error(`\nUnexpected error occurred.`);
      }
      
    } else {
      // Generic error handling
      console.error(`❌ ERROR: ${error.message}`);
      
      if (error.stack) {
        console.error("\nStack trace:");
        console.error(error.stack);
      }
    }
  } else {
    console.error("❌ An unknown error occurred:", error);
  }
  
  process.exit(1);
}

// Run the main function
main().catch((error) => {
  console.error("Unhandled error in main:", error);
  process.exit(1);
});
