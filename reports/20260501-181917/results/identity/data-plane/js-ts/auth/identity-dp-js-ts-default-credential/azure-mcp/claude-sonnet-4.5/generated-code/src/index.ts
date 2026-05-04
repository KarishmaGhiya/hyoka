import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import type { AuthenticationError } from "@azure/identity";

/**
 * Main function to demonstrate Azure authentication and Key Vault access
 */
async function main(): Promise<void> {
  try {
    // Step 1: Parse environment variables
    const keyVaultName = process.env.AZURE_KEYVAULT_NAME;
    const secretName = process.env.AZURE_SECRET_NAME || "my-secret";

    if (!keyVaultName) {
      throw new Error(
        "AZURE_KEYVAULT_NAME environment variable is required.\n" +
        "Set it to your Key Vault name (without the full URL)."
      );
    }

    const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;

    console.log("🔐 Azure Identity & Key Vault Demo");
    console.log("=" .repeat(50));
    console.log(`Key Vault URL: ${keyVaultUrl}`);
    console.log(`Secret Name: ${secretName}\n`);

    // Step 2: Create DefaultAzureCredential instance
    console.log("Creating DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    console.log("✓ DefaultAzureCredential created successfully\n");

    // DefaultAzureCredential tries these credentials in order:
    // 1. EnvironmentCredential (service principal via env vars)
    // 2. WorkloadIdentityCredential (Kubernetes)
    // 3. ManagedIdentityCredential (Azure VMs, App Service, etc.)
    // 4. VisualStudioCodeCredential
    // 5. AzureCliCredential (az login)
    // 6. AzurePowerShellCredential
    // 7. AzureDeveloperCliCredential (azd auth login)

    // Step 3: Create SecretClient with the credential
    console.log("Creating SecretClient...");
    const secretClient = new SecretClient(keyVaultUrl, credential);
    console.log("✓ SecretClient created successfully\n");

    // Step 4: Retrieve the secret from Key Vault
    console.log(`Retrieving secret '${secretName}'...`);
    const secret = await secretClient.getSecret(secretName);
    
    console.log("✓ Secret retrieved successfully\n");
    console.log("=" .repeat(50));
    console.log("Secret Details:");
    console.log(`  Name: ${secret.name}`);
    console.log(`  Value: ${secret.value}`);
    console.log(`  Enabled: ${secret.properties.enabled}`);
    console.log(`  Created: ${secret.properties.createdOn?.toISOString()}`);
    console.log(`  Updated: ${secret.properties.updatedOn?.toISOString()}`);
    if (secret.properties.expiresOn) {
      console.log(`  Expires: ${secret.properties.expiresOn.toISOString()}`);
    }
    console.log("=" .repeat(50));

  } catch (error) {
    // Step 5: Handle AuthenticationError specifically
    if (isAuthenticationError(error)) {
      console.error("\n❌ Authentication Failed");
      console.error("=" .repeat(50));
      console.error("An authentication error occurred. This typically means:");
      console.error("  • No valid credentials were found");
      console.error("  • The credentials don't have permission to access the Key Vault");
      console.error("  • Azure CLI/PowerShell/Developer CLI is not logged in\n");
      
      console.error("To fix this, try one of the following:\n");
      console.error("1. Azure CLI (recommended for local development):");
      console.error("   az login\n");
      
      console.error("2. Azure Developer CLI:");
      console.error("   azd auth login\n");
      
      console.error("3. Service Principal (for CI/CD):");
      console.error("   Set environment variables:");
      console.error("   - AZURE_TENANT_ID");
      console.error("   - AZURE_CLIENT_ID");
      console.error("   - AZURE_CLIENT_SECRET\n");
      
      console.error("4. Managed Identity (for Azure resources):");
      console.error("   Enable managed identity on your Azure resource\n");
      
      console.error(`Error details: ${error.message}`);
      console.error("=" .repeat(50));
      process.exit(1);
    }

    // Handle other errors (e.g., Key Vault not found, secret not found, permission denied)
    console.error("\n❌ Error occurred");
    console.error("=" .repeat(50));
    
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      
      // Check for common Key Vault errors
      if (error.message.includes("ResourceNotFound") || error.message.includes("not found")) {
        console.error("\nPossible causes:");
        console.error("  • The Key Vault or secret does not exist");
        console.error("  • The Key Vault name is incorrect");
        console.error("  • The secret name is incorrect");
      } else if (error.message.includes("Forbidden") || error.message.includes("403")) {
        console.error("\nPossible causes:");
        console.error("  • The authenticated identity lacks Key Vault permissions");
        console.error("  • Add 'Key Vault Secrets User' role to your identity");
        console.error("  • Or set an access policy in the Key Vault");
      }
      
      if (error.stack) {
        console.error("\nStack trace:");
        console.error(error.stack);
      }
    } else {
      console.error("Unknown error:", error);
    }
    
    console.error("=" .repeat(50));
    process.exit(1);
  }
}

/**
 * Type guard to check if an error is an AuthenticationError
 * Since @azure/identity doesn't export AuthenticationError directly,
 * we check for the error name and common properties
 */
function isAuthenticationError(error: unknown): error is AuthenticationError {
  if (!(error instanceof Error)) {
    return false;
  }
  
  // Check for authentication-related error names and messages
  const authErrorNames = [
    "AuthenticationError",
    "CredentialUnavailableError",
    "AuthenticationRequiredError"
  ];
  
  const isAuthErrorName = authErrorNames.some(name => 
    error.name === name || error.constructor.name === name
  );
  
  const isAuthErrorMessage = 
    error.message.includes("authentication") ||
    error.message.includes("credential") ||
    error.message.includes("No valid credential") ||
    error.message.includes("DefaultAzureCredential failed");
  
  return isAuthErrorName || isAuthErrorMessage;
}

// Run the main function
main().catch((error) => {
  console.error("Unhandled error in main:", error);
  process.exit(1);
});
