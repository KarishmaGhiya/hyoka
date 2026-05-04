import {
  ManagedIdentityCredential,
  ChainedTokenCredential,
  AzureCliCredential,
  CredentialUnavailableError,
  TokenCredential
} from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

/**
 * Demonstrates system-assigned Managed Identity authentication
 */
async function demonstrateSystemAssignedIdentity(): Promise<void> {
  console.log("\n=== System-Assigned Managed Identity ===");
  
  try {
    // Create credential for system-assigned managed identity
    const credential = new ManagedIdentityCredential();
    console.log("✓ Created ManagedIdentityCredential (system-assigned)");

    // Attempt to get a token to verify the credential works
    const token = await credential.getToken("https://storage.azure.com/.default");
    console.log("✓ Successfully acquired token");
    console.log(`  Token expires: ${new Date(token.expiresOnTimestamp).toISOString()}`);
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      console.log("✗ System-assigned managed identity is not available");
      console.log(`  Reason: ${error.message}`);
    } else {
      console.error("✗ Error:", error);
    }
  }
}

/**
 * Demonstrates user-assigned Managed Identity authentication with client ID
 */
async function demonstrateUserAssignedIdentity(): Promise<void> {
  console.log("\n=== User-Assigned Managed Identity ===");
  
  // Example client ID - replace with your actual user-assigned identity client ID
  const userAssignedClientId = process.env.AZURE_USER_ASSIGNED_CLIENT_ID || "00000000-0000-0000-0000-000000000000";
  
  try {
    // Create credential for user-assigned managed identity
    const credential = new ManagedIdentityCredential({
      clientId: userAssignedClientId
    });
    console.log(`✓ Created ManagedIdentityCredential (user-assigned)`);
    console.log(`  Client ID: ${userAssignedClientId}`);

    // Attempt to get a token to verify the credential works
    const token = await credential.getToken("https://storage.azure.com/.default");
    console.log("✓ Successfully acquired token");
    console.log(`  Token expires: ${new Date(token.expiresOnTimestamp).toISOString()}`);
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      console.log("✗ User-assigned managed identity is not available");
      console.log(`  Reason: ${error.message}`);
    } else {
      console.error("✗ Error:", error);
    }
  }
}

/**
 * Demonstrates ChainedTokenCredential for fallback authentication
 * This pattern works in both Azure (managed identity) and local dev (Azure CLI)
 */
async function demonstrateChainedCredential(): Promise<TokenCredential> {
  console.log("\n=== Chained Token Credential (Managed Identity → Azure CLI) ===");
  
  // Create a chain that tries managed identity first, then falls back to Azure CLI
  const credential = new ChainedTokenCredential(
    new ManagedIdentityCredential(),
    new AzureCliCredential()
  );
  console.log("✓ Created ChainedTokenCredential with fallback chain:");
  console.log("  1. ManagedIdentityCredential (for Azure environments)");
  console.log("  2. AzureCliCredential (for local development)");

  try {
    // Try to acquire a token - will use the first credential that succeeds
    const token = await credential.getToken("https://storage.azure.com/.default");
    console.log("✓ Successfully acquired token using credential chain");
    console.log(`  Token expires: ${new Date(token.expiresOnTimestamp).toISOString()}`);
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      console.log("✗ No credentials in the chain are available");
      console.log(`  Reason: ${error.message}`);
      console.log("\n  💡 Tip: Run 'az login' to authenticate with Azure CLI for local development");
    } else {
      console.error("✗ Error:", error);
    }
  }

  return credential;
}

/**
 * Demonstrates using a credential with an Azure SDK client
 */
async function demonstrateAzureSdkClient(credential: TokenCredential): Promise<void> {
  console.log("\n=== Using Credential with Azure SDK Client ===");
  
  // Example storage account URL - replace with your actual storage account
  const storageAccountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL || "https://mystorageaccount.blob.core.windows.net";
  
  try {
    // Create a BlobServiceClient using the credential
    const blobServiceClient = new BlobServiceClient(storageAccountUrl, credential);
    console.log(`✓ Created BlobServiceClient for: ${storageAccountUrl}`);

    // List containers to verify authentication works
    console.log("  Attempting to list containers...");
    const containerIterator = blobServiceClient.listContainers();
    
    let containerCount = 0;
    for await (const container of containerIterator) {
      containerCount++;
      console.log(`  - Container: ${container.name}`);
      if (containerCount >= 5) {
        console.log("  ... (showing first 5 containers)");
        break;
      }
    }

    if (containerCount === 0) {
      console.log("  No containers found (this is normal for new storage accounts)");
    }

    console.log(`✓ Successfully listed containers (count: ${containerCount})`);
  } catch (error: any) {
    if (error instanceof CredentialUnavailableError) {
      console.log("✗ Credential is not available for Azure SDK client");
      console.log(`  Reason: ${error.message}`);
    } else if (error.code === "ResourceNotFound") {
      console.log("✗ Storage account not found");
      console.log(`  URL: ${storageAccountUrl}`);
      console.log("  💡 Set AZURE_STORAGE_ACCOUNT_URL environment variable");
    } else if (error.statusCode === 403) {
      console.log("✗ Access denied - identity lacks permissions");
      console.log("  💡 Grant 'Storage Blob Data Reader' role to the managed identity");
    } else {
      console.log(`✗ Error accessing storage: ${error.message}`);
      if (error.code) {
        console.log(`  Error code: ${error.code}`);
      }
    }
  }
}

/**
 * Demonstrates comprehensive error handling for managed identity scenarios
 */
async function demonstrateErrorHandling(): Promise<void> {
  console.log("\n=== Error Handling Patterns ===");
  
  const credential = new ManagedIdentityCredential();

  try {
    console.log("Attempting to acquire token...");
    const token = await credential.getToken("https://management.azure.com/.default");
    console.log("✓ Token acquired successfully");
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      console.log("\n✗ CredentialUnavailableError caught:");
      console.log(`  Message: ${error.message}`);
      console.log("\n  This typically means:");
      console.log("  • Not running in an Azure environment with managed identity enabled");
      console.log("  • Managed identity is not configured on the resource");
      console.log("  • IMDS endpoint is not accessible");
      console.log("\n  Solutions:");
      console.log("  • Enable system-assigned managed identity on your Azure resource");
      console.log("  • Assign a user-assigned managed identity");
      console.log("  • Use ChainedTokenCredential with AzureCliCredential for local dev");
    } else if (error instanceof Error) {
      console.log(`\n✗ Unexpected error: ${error.name}`);
      console.log(`  Message: ${error.message}`);
    } else {
      console.log("\n✗ Unknown error occurred");
    }
  }
}

/**
 * Main function to run all demonstrations
 */
async function main(): Promise<void> {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║   Azure Managed Identity Authentication Demonstration         ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  
  // Demonstrate different managed identity types
  await demonstrateSystemAssignedIdentity();
  await demonstrateUserAssignedIdentity();
  
  // Demonstrate credential chaining for production + local dev
  const credential = await demonstrateChainedCredential();
  
  // Use the credential with an Azure SDK client
  await demonstrateAzureSdkClient(credential);
  
  // Show error handling patterns
  await demonstrateErrorHandling();

  console.log("\n" + "=".repeat(66));
  console.log("Demo completed!");
  console.log("\nEnvironment Variables (optional):");
  console.log("  AZURE_USER_ASSIGNED_CLIENT_ID - Client ID for user-assigned identity");
  console.log("  AZURE_STORAGE_ACCOUNT_URL     - Storage account URL for SDK demo");
  console.log("\nFor local development:");
  console.log("  1. Run 'az login' to authenticate with Azure CLI");
  console.log("  2. Ensure you have appropriate RBAC permissions");
  console.log("\nFor Azure environments:");
  console.log("  1. Enable system-assigned or user-assigned managed identity");
  console.log("  2. Grant necessary RBAC roles (e.g., Storage Blob Data Reader)");
  console.log("=".repeat(66));
}

// Run the demonstration
main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
