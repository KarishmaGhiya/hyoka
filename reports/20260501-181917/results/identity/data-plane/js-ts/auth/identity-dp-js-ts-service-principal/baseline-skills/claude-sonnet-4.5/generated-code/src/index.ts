import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { AuthenticationError } from "@azure/identity";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

interface ServicePrincipalConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  keyVaultUrl: string;
}

/**
 * Validate that all required environment variables are set
 */
function validateEnvironmentVariables(): ServicePrincipalConfig {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const keyVaultUrl = process.env.KEY_VAULT_URL;

  if (!tenantId || !clientId || !clientSecret || !keyVaultUrl) {
    throw new Error(
      "Missing required environment variables. Please ensure AZURE_TENANT_ID, " +
      "AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and KEY_VAULT_URL are set."
    );
  }

  return { tenantId, clientId, clientSecret, keyVaultUrl };
}

/**
 * Main function to demonstrate Service Principal authentication
 */
async function main(): Promise<void> {
  try {
    console.log("🔐 Azure Service Principal Authentication Demo\n");

    // Step 1: Validate and load configuration
    console.log("📋 Step 1: Loading configuration from environment variables...");
    const config = validateEnvironmentVariables();
    console.log(`   ✓ Tenant ID: ${config.tenantId.substring(0, 8)}...`);
    console.log(`   ✓ Client ID: ${config.clientId.substring(0, 8)}...`);
    console.log(`   ✓ Key Vault URL: ${config.keyVaultUrl}\n`);

    // Step 2: Create ClientSecretCredential
    console.log("🔑 Step 2: Creating ClientSecretCredential...");
    const credential = new ClientSecretCredential(
      config.tenantId,
      config.clientId,
      config.clientSecret
    );
    console.log("   ✓ Credential created successfully\n");

    // Step 3: Create Azure SDK client (SecretClient)
    console.log("🏗️  Step 3: Creating SecretClient with the credential...");
    const secretClient = new SecretClient(config.keyVaultUrl, credential);
    console.log("   ✓ SecretClient created successfully\n");

    // Step 4: Perform an operation to verify the credential works
    console.log("✅ Step 4: Verifying authentication by listing secrets...");
    
    const secrets: string[] = [];
    let secretCount = 0;

    for await (const secretProperties of secretClient.listPropertiesOfSecrets()) {
      secretCount++;
      secrets.push(secretProperties.name);
      
      // Only display first 5 secrets to keep output clean
      if (secretCount <= 5) {
        console.log(`   • ${secretProperties.name}`);
      }
    }

    if (secretCount === 0) {
      console.log("   ℹ️  No secrets found in the Key Vault");
      console.log("   (This is normal for a new/empty Key Vault)");
    } else if (secretCount > 5) {
      console.log(`   ... and ${secretCount - 5} more secret(s)`);
    }

    console.log(`\n   ✓ Successfully listed ${secretCount} secret(s)`);
    console.log("\n🎉 Authentication successful! Service Principal is working correctly.\n");

  } catch (error: unknown) {
    console.error("\n❌ Error occurred:\n");

    // Handle AuthenticationError specifically
    if (error instanceof AuthenticationError) {
      console.error("🔒 Authentication Error:");
      console.error(`   Message: ${error.message}`);
      console.error("\n   Possible causes:");
      console.error("   • Invalid tenant ID, client ID, or client secret");
      console.error("   • Service Principal may not exist or is disabled");
      console.error("   • Client secret may have expired");
      console.error("   • Incorrect Azure cloud environment\n");
      
      process.exit(1);
    }

    // Handle other errors
    if (error instanceof Error) {
      console.error(`   Error type: ${error.constructor.name}`);
      console.error(`   Message: ${error.message}`);
      
      // Check for permission errors
      if (error.message.includes("Forbidden") || error.message.includes("403")) {
        console.error("\n   ⚠️  The Service Principal doesn't have permission to access this Key Vault.");
        console.error("   Grant the Service Principal 'Key Vault Secrets User' or 'Key Vault Reader' role.\n");
      }
      
      // Check for network/DNS errors
      if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
        console.error("\n   ⚠️  Cannot connect to Key Vault. Check your KEY_VAULT_URL.\n");
      }
    } else {
      console.error("   Unknown error:", error);
    }

    process.exit(1);
  }
}

// Run the main function
main();
