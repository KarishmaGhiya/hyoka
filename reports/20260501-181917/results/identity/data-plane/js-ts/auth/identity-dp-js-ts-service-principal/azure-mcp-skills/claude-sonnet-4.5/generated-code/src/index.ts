import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { AuthenticationError } from "@azure/identity";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Main function to authenticate and test Azure Service Principal
 */
async function main(): Promise<void> {
  try {
    console.log("Starting Azure Service Principal authentication...\n");

    // 1. Read credentials from environment variables
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;

    // Validate required environment variables
    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        "Missing required environment variables. Please ensure AZURE_TENANT_ID, " +
        "AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET are set."
      );
    }

    if (!keyVaultUrl) {
      throw new Error(
        "Missing AZURE_KEYVAULT_URL environment variable. " +
        "Please set it to your Key Vault URL (e.g., https://your-vault.vault.azure.net/)"
      );
    }

    console.log("✓ Environment variables loaded");
    console.log(`  Tenant ID: ${tenantId.substring(0, 8)}...`);
    console.log(`  Client ID: ${clientId.substring(0, 8)}...`);
    console.log(`  Key Vault URL: ${keyVaultUrl}\n`);

    // 2. Create ClientSecretCredential instance
    console.log("Creating ClientSecretCredential...");
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );
    console.log("✓ ClientSecretCredential created\n");

    // 3. Create Azure SDK client (SecretClient for Key Vault)
    console.log("Creating SecretClient for Key Vault...");
    const secretClient = new SecretClient(keyVaultUrl, credential);
    console.log("✓ SecretClient created\n");

    // 4. Perform an operation to verify the credential works
    console.log("Testing authentication by listing secrets...");
    
    // List secrets to verify authentication
    const secretsIterator = secretClient.listPropertiesOfSecrets();
    const secrets: string[] = [];
    
    let count = 0;
    for await (const secretProperties of secretsIterator) {
      secrets.push(secretProperties.name);
      count++;
      // Limit to first 5 secrets for demo
      if (count >= 5) break;
    }

    console.log("✓ Authentication successful!");
    console.log(`  Found ${count} secret(s) in Key Vault`);
    
    if (secrets.length > 0) {
      console.log("  Secrets:");
      secrets.forEach(name => console.log(`    - ${name}`));
    } else {
      console.log("  (No secrets found in Key Vault)");
    }

    console.log("\n✅ Service Principal authentication test completed successfully!");

  } catch (error) {
    // 5. Handle AuthenticationError for invalid credentials
    if (error instanceof AuthenticationError) {
      console.error("\n❌ Authentication failed!");
      console.error("Error details:");
      console.error(`  Message: ${error.message}`);
      console.error(`  Error Code: ${error.name}`);
      console.error("\nPossible causes:");
      console.error("  - Invalid tenant ID, client ID, or client secret");
      console.error("  - Service Principal doesn't have access to the Key Vault");
      console.error("  - Service Principal might be disabled or expired");
      console.error("  - Incorrect Azure environment or authority host");
      process.exit(1);
    } else if (error instanceof Error) {
      console.error("\n❌ An error occurred:");
      console.error(`  ${error.message}`);
      
      if (error.message.includes("Key Vault")) {
        console.error("\nTroubleshooting Key Vault access:");
        console.error("  1. Ensure the Key Vault URL is correct");
        console.error("  2. Verify the Service Principal has 'Get' and 'List' permissions");
        console.error("  3. Check if Key Vault firewall allows your IP address");
        console.error("  4. Confirm the Key Vault exists and is accessible");
      }
      
      process.exit(1);
    } else {
      console.error("\n❌ An unexpected error occurred:", error);
      process.exit(1);
    }
  }
}

// Run the main function
main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
