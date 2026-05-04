import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { RestError } from "@azure/core-rest-pipeline";

/**
 * Main function to authenticate and retrieve a secret from Azure Key Vault
 */
async function main(): Promise<void> {
  try {
    // Get Key Vault URL from environment variable
    const keyVaultUrl = process.env.KEY_VAULT_URL;
    if (!keyVaultUrl) {
      throw new Error("KEY_VAULT_URL environment variable is not set");
    }

    // Get secret name from environment variable (with default)
    const secretName = process.env.SECRET_NAME || "mySecret";

    console.log("Initializing DefaultAzureCredential...");
    
    // Create DefaultAzureCredential instance
    // This will try multiple credential types in order:
    // 1. EnvironmentCredential (service principal via env vars)
    // 2. WorkloadIdentityCredential (Kubernetes)
    // 3. ManagedIdentityCredential (Azure resources)
    // 4. VisualStudioCodeCredential
    // 5. AzureCliCredential (az login)
    // 6. AzurePowerShellCredential (Connect-AzAccount)
    // 7. AzureDeveloperCliCredential (azd auth login)
    const credential = new DefaultAzureCredential();

    console.log("Creating SecretClient...");
    
    // Create SecretClient with the credential
    const client = new SecretClient(keyVaultUrl, credential);

    console.log(`Retrieving secret: ${secretName}...`);
    
    // Retrieve the secret from Key Vault
    const secret = await client.getSecret(secretName);

    // Print the secret value
    console.log("\n✓ Successfully retrieved secret!");
    console.log("Secret Name:", secret.name);
    console.log("Secret Value:", secret.value);
    console.log("Secret Properties:");
    console.log("  - Enabled:", secret.properties.enabled);
    console.log("  - Created On:", secret.properties.createdOn?.toISOString());
    console.log("  - Updated On:", secret.properties.updatedOn?.toISOString());

    if (secret.properties.expiresOn) {
      console.log("  - Expires On:", secret.properties.expiresOn.toISOString());
    }

  } catch (error) {
    // Handle authentication and REST errors specifically
    if (error instanceof RestError) {
      // Check for authentication-related status codes
      if (error.statusCode === 401 || error.statusCode === 403) {
        console.error("\n✗ Authentication Failed!");
        console.error("Error Code:", error.statusCode);
        console.error("Error Message:", error.message);
        console.error("\nTroubleshooting:");
        console.error("1. Ensure you're logged in via Azure CLI: az login");
        console.error("2. Or set service principal environment variables:");
        console.error("   - AZURE_TENANT_ID");
        console.error("   - AZURE_CLIENT_ID");
        console.error("   - AZURE_CLIENT_SECRET");
        console.error("3. Verify you have 'Get' permission for secrets in the Key Vault");
        process.exit(1);
      }
      
      // Handle other REST errors
      console.error("\n✗ Azure Service Error!");
      console.error("Error Code:", error.statusCode);
      console.error("Error Message:", error.message);
      process.exit(1);
    }

    // Handle other errors
    if (error instanceof Error) {
      console.error("\n✗ Error:", error.message);
      
      // Provide additional context for common errors
      if (error.message.includes("KEY_VAULT_URL")) {
        console.error("\nPlease set the KEY_VAULT_URL environment variable:");
        console.error('  export KEY_VAULT_URL="https://<your-vault-name>.vault.azure.net"');
      } else if (error.message.includes("Forbidden")) {
        console.error("\nAccess denied. Please ensure:");
        console.error("- You have proper RBAC role (e.g., Key Vault Secrets User)");
        console.error("- Or access policy with 'Get' permission for secrets");
      } else if (error.message.includes("not found")) {
        console.error(`\nSecret '${process.env.SECRET_NAME || "mySecret"}' was not found in the vault`);
      }
    } else {
      console.error("\n✗ An unexpected error occurred:", error);
    }
    
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
