import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { RestError } from "@azure/core-rest-pipeline";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Main function to demonstrate Azure Service Principal authentication
 */
async function main(): Promise<void> {
  try {
    // Step 1: Read credentials from environment variables
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;

    // Validate environment variables
    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        "Missing required environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, or AZURE_CLIENT_SECRET"
      );
    }

    if (!keyVaultUrl) {
      throw new Error(
        "Missing required environment variable: AZURE_KEYVAULT_URL"
      );
    }

    console.log("🔐 Authenticating to Azure...");
    console.log(`Tenant ID: ${tenantId}`);
    console.log(`Client ID: ${clientId}`);
    console.log(`Key Vault URL: ${keyVaultUrl}`);
    console.log();

    // Step 2: Create ClientSecretCredential instance
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );

    console.log("✅ ClientSecretCredential created successfully");

    // Step 3: Create Azure SDK client (SecretClient for Key Vault)
    const secretClient = new SecretClient(keyVaultUrl, credential);

    console.log("✅ SecretClient initialized");
    console.log();

    // Step 4: Perform an operation to verify the credential works
    console.log("🔍 Testing credential by listing secrets...");

    const secretIterator = secretClient.listPropertiesOfSecrets();
    const secrets: string[] = [];

    // List up to 5 secrets to verify access
    let count = 0;
    for await (const secretProperties of secretIterator) {
      secrets.push(secretProperties.name);
      count++;
      if (count >= 5) break;
    }

    console.log("✅ Authentication successful!");
    console.log(
      `Found ${count} secret(s) in the Key Vault (showing max 5):`
    );

    if (secrets.length > 0) {
      secrets.forEach((name, index) => {
        console.log(`  ${index + 1}. ${name}`);
      });
    } else {
      console.log("  (No secrets found in the Key Vault)");
    }

    console.log();
    console.log("🎉 Service Principal authentication completed successfully!");
  } catch (error) {
    // Step 5: Handle AuthenticationError and other errors
    handleError(error);
  }
}

/**
 * Error handler with specific handling for authentication errors
 */
function handleError(error: unknown): void {
  console.error();
  console.error("❌ An error occurred:");
  console.error();

  if (error instanceof RestError) {
    // Handle Azure SDK REST errors (including authentication errors)
    const statusCode = error.statusCode;

    if (statusCode === 401) {
      console.error("🔒 AUTHENTICATION ERROR (401 Unauthorized)");
      console.error(
        "The provided Service Principal credentials are invalid or expired."
      );
      console.error();
      console.error("Please verify:");
      console.error("  • AZURE_TENANT_ID is correct");
      console.error("  • AZURE_CLIENT_ID is correct");
      console.error("  • AZURE_CLIENT_SECRET is correct and not expired");
      console.error(
        "  • The Service Principal has been granted access to the Key Vault"
      );
    } else if (statusCode === 403) {
      console.error("🚫 AUTHORIZATION ERROR (403 Forbidden)");
      console.error(
        "The Service Principal authenticated successfully but does not have permission to access this resource."
      );
      console.error();
      console.error("Please verify:");
      console.error(
        "  • The Service Principal has been assigned the appropriate role"
      );
      console.error(
        "  • Access policies are configured in the Key Vault (for Key Vault Secret User or similar)"
      );
    } else if (statusCode === 404) {
      console.error("🔍 NOT FOUND ERROR (404)");
      console.error("The specified Key Vault could not be found.");
      console.error();
      console.error("Please verify:");
      console.error("  • AZURE_KEYVAULT_URL is correct");
      console.error("  • The Key Vault exists in your Azure subscription");
    } else {
      console.error(`Azure REST Error (Status ${statusCode}):`);
      console.error(`  Code: ${error.code || "N/A"}`);
      console.error(`  Message: ${error.message}`);
    }

    if (error.details) {
      console.error(`  Details: ${JSON.stringify(error.details, null, 2)}`);
    }
  } else if (error instanceof Error) {
    // Handle general JavaScript errors
    console.error("Error:", error.message);

    if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      console.error();
      console.error("This appears to be a network connectivity issue.");
      console.error("Please check your internet connection and try again.");
    }
  } else {
    // Handle unknown error types
    console.error("Unknown error:", error);
  }

  console.error();
  process.exit(1);
}

// Run the main function
main();
