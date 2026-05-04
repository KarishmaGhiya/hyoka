import {
  ManagedIdentityCredential,
  ChainedTokenCredential,
  AzureCliCredential,
  CredentialUnavailableError,
} from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

/**
 * Example 1: System-Assigned Managed Identity
 * Used when your Azure resource (VM, App Service, etc.) has a system-assigned identity enabled
 */
async function createSystemAssignedIdentityCredential() {
  console.log("\n=== System-Assigned Managed Identity ===");
  
  try {
    const credential = new ManagedIdentityCredential();
    console.log("✓ Created ManagedIdentityCredential for system-assigned identity");
    return credential;
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      console.error("✗ Managed Identity not available:", error.message);
      console.log("  This is expected when running locally outside of Azure");
    } else {
      console.error("✗ Unexpected error:", error);
    }
    throw error;
  }
}

/**
 * Example 2: User-Assigned Managed Identity
 * Used when you want to use a specific user-assigned identity by its client ID
 */
async function createUserAssignedIdentityCredential(clientId: string) {
  console.log("\n=== User-Assigned Managed Identity ===");
  
  try {
    const credential = new ManagedIdentityCredential({
      clientId: clientId,
    });
    console.log(`✓ Created ManagedIdentityCredential for user-assigned identity: ${clientId}`);
    return credential;
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      console.error("✗ User-assigned Managed Identity not available:", error.message);
      console.log("  This is expected when running locally outside of Azure");
    } else {
      console.error("✗ Unexpected error:", error);
    }
    throw error;
  }
}

/**
 * Example 3: Chained Token Credential with Fallback
 * Tries Managed Identity first, falls back to Azure CLI for local development
 * This is the recommended pattern for code that runs both in Azure and locally
 */
async function createChainedCredential(userAssignedClientId?: string) {
  console.log("\n=== Chained Token Credential (MI → Azure CLI) ===");
  
  try {
    const credentials = [];
    
    // First, try system-assigned managed identity
    credentials.push(new ManagedIdentityCredential());
    console.log("  [1] Added: ManagedIdentityCredential (system-assigned)");
    
    // If a user-assigned client ID is provided, try that too
    if (userAssignedClientId) {
      credentials.push(new ManagedIdentityCredential({ clientId: userAssignedClientId }));
      console.log(`  [2] Added: ManagedIdentityCredential (user-assigned: ${userAssignedClientId})`);
    }
    
    // Finally, fall back to Azure CLI for local development
    credentials.push(new AzureCliCredential());
    console.log(`  [${credentials.length}] Added: AzureCliCredential (local dev fallback)`);
    
    const credential = new ChainedTokenCredential(...credentials);
    console.log("✓ Created ChainedTokenCredential");
    console.log("  → Will try credentials in order until one succeeds");
    
    return credential;
  } catch (error) {
    console.error("✗ Failed to create chained credential:", error);
    throw error;
  }
}

/**
 * Example 4: Using the Credential with an Azure SDK Client
 * Demonstrates authenticating to Azure Key Vault and performing an operation
 */
async function useCredentialWithAzureSDK(
  credential: ManagedIdentityCredential | ChainedTokenCredential,
  keyVaultUrl: string
) {
  console.log("\n=== Using Credential with Azure SDK Client ===");
  
  try {
    // Create an Azure Key Vault client with the credential
    const secretClient = new SecretClient(keyVaultUrl, credential);
    console.log(`✓ Created SecretClient for: ${keyVaultUrl}`);
    
    // Try to list secrets (requires Key Vault "List" permission)
    console.log("  Attempting to list secrets...");
    const secretsIterator = secretClient.listPropertiesOfSecrets();
    
    let secretCount = 0;
    for await (const secretProperties of secretsIterator) {
      secretCount++;
      console.log(`  - Secret: ${secretProperties.name}`);
      if (secretCount >= 5) {
        console.log(`  ... (showing first 5 secrets)`);
        break;
      }
    }
    
    if (secretCount === 0) {
      console.log("  No secrets found (or no permissions to list)");
    }
    
    console.log("✓ Successfully authenticated and performed operation");
    return true;
  } catch (error: any) {
    if (error instanceof CredentialUnavailableError) {
      console.error("✗ All credentials in chain failed:", error.message);
      console.log("  → Make sure you're either:");
      console.log("     1. Running in Azure with Managed Identity enabled, OR");
      console.log("     2. Logged in via Azure CLI (run: az login)");
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      console.error("✗ Network error - could not reach Key Vault:", error.message);
      console.log("  → Check that the Key Vault URL is correct and accessible");
    } else if (error.statusCode === 403) {
      console.error("✗ Access denied (403 Forbidden)");
      console.log("  → The identity needs Key Vault 'List' permission");
    } else {
      console.error("✗ Operation failed:", error.message || error);
    }
    return false;
  }
}

/**
 * Example 5: Getting a Token Directly (for demonstration)
 * Shows how to retrieve an access token for a specific scope
 */
async function getTokenExample(credential: ManagedIdentityCredential | ChainedTokenCredential) {
  console.log("\n=== Getting Access Token Directly ===");
  
  try {
    // Request a token for Azure Key Vault
    const scope = "https://vault.azure.net/.default";
    console.log(`  Requesting token for scope: ${scope}`);
    
    const tokenResponse = await credential.getToken(scope);
    
    if (tokenResponse) {
      console.log("✓ Successfully obtained access token");
      console.log(`  Token (first 20 chars): ${tokenResponse.token.substring(0, 20)}...`);
      console.log(`  Expires on: ${new Date(tokenResponse.expiresOnTimestamp).toISOString()}`);
      
      const expiresIn = Math.floor((tokenResponse.expiresOnTimestamp - Date.now()) / 1000 / 60);
      console.log(`  Valid for: ${expiresIn} minutes`);
    } else {
      console.log("✗ No token returned");
    }
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      console.error("✗ Could not obtain token:", error.message);
    } else {
      console.error("✗ Token request failed:", error);
    }
  }
}

/**
 * Main function - demonstrates all authentication patterns
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║   Azure Managed Identity Authentication Demo                  ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  
  // Configuration
  const USER_ASSIGNED_CLIENT_ID = process.env.AZURE_CLIENT_ID || "00000000-0000-0000-0000-000000000000";
  const KEY_VAULT_URL = process.env.KEY_VAULT_URL || "https://my-keyvault.vault.azure.net/";
  
  console.log("\nConfiguration:");
  console.log(`  User-Assigned Client ID: ${USER_ASSIGNED_CLIENT_ID}`);
  console.log(`  Key Vault URL: ${KEY_VAULT_URL}`);
  
  try {
    // Example 1: System-assigned identity
    try {
      const systemCredential = await createSystemAssignedIdentityCredential();
      // Try to get a token to verify it works
      await getTokenExample(systemCredential);
    } catch (error) {
      console.log("  Skipping system-assigned identity examples (not available)");
    }
    
    // Example 2: User-assigned identity
    try {
      const userCredential = await createUserAssignedIdentityCredential(USER_ASSIGNED_CLIENT_ID);
      await getTokenExample(userCredential);
    } catch (error) {
      console.log("  Skipping user-assigned identity examples (not available)");
    }
    
    // Example 3: Chained credential (RECOMMENDED approach)
    console.log("\n" + "=".repeat(64));
    console.log("RECOMMENDED: Using ChainedTokenCredential");
    console.log("=".repeat(64));
    
    const chainedCredential = await createChainedCredential(USER_ASSIGNED_CLIENT_ID);
    
    // Example 4: Get token using chained credential
    await getTokenExample(chainedCredential);
    
    // Example 5: Use with Azure SDK client
    await useCredentialWithAzureSDK(chainedCredential, KEY_VAULT_URL);
    
    console.log("\n" + "=".repeat(64));
    console.log("✓ Demo completed successfully");
    console.log("=".repeat(64));
    
  } catch (error) {
    console.error("\n✗ Demo failed with error:", error);
    process.exit(1);
  }
}

// Run the demo
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
