import {
  ManagedIdentityCredential,
  ChainedTokenCredential,
  AzureCliCredential,
  CredentialUnavailableError,
} from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

/**
 * Example 1: System-Assigned Managed Identity
 * This is the simplest form - uses the identity attached to the Azure resource
 */
async function useSystemAssignedIdentity(): Promise<void> {
  console.log("\n=== Example 1: System-Assigned Managed Identity ===");

  try {
    // Create credential for system-assigned identity
    const credential = new ManagedIdentityCredential();
    console.log("✓ Created ManagedIdentityCredential (system-assigned)");

    // Test the credential by getting a token
    const token = await credential.getToken(
      "https://storage.azure.com/.default"
    );

    if (token) {
      console.log("✓ Successfully acquired token");
      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);
    }
  } catch (error) {
    handleAuthError(error, "System-Assigned Identity");
  }
}

/**
 * Example 2: User-Assigned Managed Identity (by Client ID)
 * Used when multiple identities are assigned to a resource
 */
async function useUserAssignedIdentity(clientId: string): Promise<void> {
  console.log("\n=== Example 2: User-Assigned Managed Identity ===");

  try {
    // Create credential for user-assigned identity using client ID
    const credential = new ManagedIdentityCredential({
      clientId: clientId,
    });
    console.log(
      `✓ Created ManagedIdentityCredential (user-assigned: ${clientId})`
    );

    // Test the credential by getting a token
    const token = await credential.getToken(
      "https://storage.azure.com/.default"
    );

    if (token) {
      console.log("✓ Successfully acquired token");
      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);
    }
  } catch (error) {
    handleAuthError(error, "User-Assigned Identity");
  }
}

/**
 * Example 3: ChainedTokenCredential for Development/Production Flexibility
 * Tries managed identity first (production), falls back to Azure CLI (local dev)
 */
async function useChainedCredential(): Promise<void> {
  console.log(
    "\n=== Example 3: ChainedTokenCredential (Managed Identity → Azure CLI) ==="
  );

  try {
    // Create a credential chain that tries multiple authentication methods
    const credential = new ChainedTokenCredential(
      new ManagedIdentityCredential(), // Try managed identity first (works in Azure)
      new AzureCliCredential() // Fall back to Azure CLI (works locally)
    );
    console.log("✓ Created ChainedTokenCredential");
    console.log(
      "  Chain: ManagedIdentity → AzureCli"
    );

    // Test the credential
    const token = await credential.getToken(
      "https://storage.azure.com/.default"
    );

    if (token) {
      console.log("✓ Successfully acquired token from credential chain");
      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);
    }
  } catch (error) {
    handleAuthError(error, "ChainedTokenCredential");
  }
}

/**
 * Example 4: Using Credential with Azure SDK Client
 * Demonstrates how to pass credential to an actual Azure service
 */
async function useWithAzureClient(storageAccountName: string): Promise<void> {
  console.log("\n=== Example 4: Using Credential with Azure Storage Client ===");

  try {
    // Create credential chain for flexibility
    const credential = new ChainedTokenCredential(
      new ManagedIdentityCredential(),
      new AzureCliCredential()
    );

    // Create Azure Storage Blob client with the credential
    const blobServiceClient = new BlobServiceClient(
      `https://${storageAccountName}.blob.core.windows.net`,
      credential
    );
    console.log(
      `✓ Created BlobServiceClient for '${storageAccountName}'`
    );

    // Perform an actual operation - list containers
    console.log("  Listing containers...");
    const containers = blobServiceClient.listContainers();

    let containerCount = 0;
    for await (const container of containers) {
      containerCount++;
      console.log(`  - ${container.name}`);
      if (containerCount >= 5) {
        console.log("  ... (showing first 5 containers)");
        break;
      }
    }

    if (containerCount === 0) {
      console.log("  (No containers found)");
    }

    console.log(`✓ Successfully listed ${containerCount} container(s)`);
  } catch (error) {
    handleAuthError(error, "Azure Storage Client");
  }
}

/**
 * Example 5: User-Assigned Identity with Multiple Identities
 * Shows how to work with multiple user-assigned identities
 */
async function useMultipleUserAssignedIdentities(
  clientIds: string[]
): Promise<void> {
  console.log("\n=== Example 5: Multiple User-Assigned Identities ===");

  for (let i = 0; i < clientIds.length; i++) {
    const clientId = clientIds[i];
    console.log(`\nTrying identity ${i + 1}/${clientIds.length}: ${clientId}`);

    try {
      const credential = new ManagedIdentityCredential({
        clientId: clientId,
      });

      const token = await credential.getToken(
        "https://management.azure.com/.default"
      );

      if (token) {
        console.log("✓ Successfully authenticated");
        console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);
      }
    } catch (error) {
      console.log(`✗ Failed to authenticate with this identity`);
      if (error instanceof Error) {
        console.log(`  Error: ${error.message}`);
      }
    }
  }
}

/**
 * Centralized error handling for authentication errors
 */
function handleAuthError(error: unknown, context: string): void {
  if (error instanceof CredentialUnavailableError) {
    console.log(`✗ ${context}: Credential Unavailable`);
    console.log(
      `  This typically means you're not running in Azure or Azure CLI is not logged in.`
    );
    console.log(`  Error: ${error.message}`);
    console.log(
      `\n  To fix:\n  - In Azure: Ensure managed identity is enabled on your resource`
    );
    console.log(`  - Locally: Run 'az login' to authenticate with Azure CLI`);
  } else if (error instanceof Error) {
    console.log(`✗ ${context}: Authentication Error`);
    console.log(`  Error: ${error.message}`);
  } else {
    console.log(`✗ ${context}: Unknown Error`);
    console.log(`  Error:`, error);
  }
}

/**
 * Main function demonstrating all authentication patterns
 */
async function main(): Promise<void> {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  Azure Managed Identity Authentication Examples          ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");

  // Configuration - replace with your values
  const config = {
    userAssignedClientId:
      process.env.USER_ASSIGNED_CLIENT_ID || "00000000-0000-0000-0000-000000000000",
    storageAccountName: process.env.STORAGE_ACCOUNT_NAME || "mystorageaccount",
    additionalClientIds: process.env.ADDITIONAL_CLIENT_IDS?.split(",") || [],
  };

  console.log("\nConfiguration:");
  console.log(`  User-Assigned Client ID: ${config.userAssignedClientId}`);
  console.log(`  Storage Account: ${config.storageAccountName}`);
  console.log(`  Running in Azure: ${isRunningInAzure() ? "Yes" : "No (local)"}`);

  // Example 1: System-assigned managed identity
  await useSystemAssignedIdentity();

  // Example 2: User-assigned managed identity
  await useUserAssignedIdentity(config.userAssignedClientId);

  // Example 3: Chained credential (managed identity + Azure CLI fallback)
  await useChainedCredential();

  // Example 4: Using credential with Azure Storage client
  await useWithAzureClient(config.storageAccountName);

  // Example 5: Multiple user-assigned identities (if configured)
  if (config.additionalClientIds.length > 0) {
    await useMultipleUserAssignedIdentities(config.additionalClientIds);
  }

  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║  Examples Complete                                         ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
}

/**
 * Helper function to detect if running in Azure
 */
function isRunningInAzure(): boolean {
  // Azure services set environment variables like these
  return !!(
    process.env.IDENTITY_ENDPOINT ||
    process.env.MSI_ENDPOINT ||
    process.env.IMDS_ENDPOINT ||
    process.env.AZURE_CLIENT_ID
  );
}

// Run the main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
