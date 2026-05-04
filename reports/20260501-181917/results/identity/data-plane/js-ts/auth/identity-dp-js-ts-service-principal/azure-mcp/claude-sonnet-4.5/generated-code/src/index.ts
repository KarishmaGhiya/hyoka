import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { AuthenticationError } from "@azure/identity";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

interface AzureConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  keyVaultUrl: string;
}

/**
 * Validates that all required environment variables are present
 */
function validateEnvironmentVariables(): AzureConfig {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;

  if (!tenantId || !clientId || !clientSecret || !keyVaultUrl) {
    throw new Error(
      "Missing required environment variables. Please ensure AZURE_TENANT_ID, " +
      "AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_KEYVAULT_URL are set."
    );
  }

  return {
    tenantId,
    clientId,
    clientSecret,
    keyVaultUrl,
  };
}

/**
 * Authenticates to Azure using Service Principal with client secret
 * and performs a Key Vault operation to verify the credential works
 */
async function authenticateWithServicePrincipal(): Promise<void> {
  try {
    console.log("🔐 Azure Service Principal Authentication Demo\n");

    // Step 1: Validate environment variables
    console.log("Step 1: Validating environment variables...");
    const config = validateEnvironmentVariables();
    console.log("✓ Environment variables loaded successfully\n");

    // Step 2: Create ClientSecretCredential
    console.log("Step 2: Creating ClientSecretCredential...");
    const credential = new ClientSecretCredential(
      config.tenantId,
      config.clientId,
      config.clientSecret
    );
    console.log("✓ Credential created successfully\n");

    // Step 3: Create Azure SDK client (SecretClient)
    console.log("Step 3: Creating SecretClient for Key Vault...");
    const secretClient = new SecretClient(config.keyVaultUrl, credential);
    console.log(`✓ SecretClient created for: ${config.keyVaultUrl}\n`);

    // Step 4: Perform an operation to verify the credential works
    console.log("Step 4: Verifying credential by listing secrets...");
    
    // List secrets (this will trigger authentication)
    const secretsIterator = secretClient.listPropertiesOfSecrets();
    const secrets: string[] = [];
    
    for await (const secretProperties of secretsIterator) {
      secrets.push(secretProperties.name);
    }

    console.log("✓ Authentication successful!");
    console.log(`✓ Found ${secrets.length} secret(s) in Key Vault`);
    
    if (secrets.length > 0) {
      console.log("\nSecrets in Key Vault:");
      secrets.forEach((name, index) => {
        console.log(`  ${index + 1}. ${name}`);
      });
    } else {
      console.log("\n(No secrets found in Key Vault - this is normal for a new vault)");
    }

    console.log("\n✅ All operations completed successfully!");

  } catch (error) {
    // Step 5: Handle AuthenticationError for invalid credentials
    if (error instanceof AuthenticationError) {
      console.error("\n❌ Authentication Error:");
      console.error("Failed to authenticate with the provided credentials.");
      console.error("\nPossible causes:");
      console.error("  • Invalid tenant ID, client ID, or client secret");
      console.error("  • Service Principal does not exist or is disabled");
      console.error("  • Service Principal does not have access to the Key Vault");
      console.error("\nError details:", error.message);
    } else if (error instanceof Error) {
      console.error("\n❌ Error:", error.message);
      
      // Check for specific error types
      if (error.message.includes("ENOTFOUND") || error.message.includes("network")) {
        console.error("\nThis appears to be a network error. Please check:");
        console.error("  • Your internet connection");
        console.error("  • The Key Vault URL is correct");
        console.error("  • The Key Vault exists and is accessible");
      } else if (error.message.includes("Forbidden") || error.message.includes("403")) {
        console.error("\nAccess forbidden. Please ensure:");
        console.error("  • The Service Principal has appropriate permissions");
        console.error("  • Key Vault access policies are configured correctly");
      }
    } else {
      console.error("\n❌ Unknown error:", error);
    }
    
    process.exit(1);
  }
}

// Run the authentication demo
authenticateWithServicePrincipal();
