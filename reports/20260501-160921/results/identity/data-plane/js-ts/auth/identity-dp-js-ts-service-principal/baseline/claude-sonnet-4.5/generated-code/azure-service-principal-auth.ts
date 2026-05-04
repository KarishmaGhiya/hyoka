import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { BlobServiceClient } from "@azure/storage-blob";

/**
 * Azure Service Principal Authentication with Client Secret
 * 
 * This example demonstrates best practices for authenticating to Azure
 * using a Service Principal with a client secret credential.
 */

// ============================================================================
// 1. REQUIRED NPM PACKAGES
// ============================================================================
/*
npm install @azure/identity
npm install @azure/keyvault-secrets  // Example Azure SDK client
npm install @azure/storage-blob      // Another example Azure SDK client
npm install dotenv                   // For environment variable management
npm install @types/node --save-dev   // TypeScript types for Node.js
*/

// ============================================================================
// 2. ENVIRONMENT VARIABLES SETUP (Best Practice)
// ============================================================================
import dotenv from "dotenv";
dotenv.config();

interface AzureCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Retrieves Azure credentials from environment variables
 * Best Practice: Never hardcode credentials in source code
 */
function getAzureCredentials(): AzureCredentials {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing required environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
    );
  }

  return { tenantId, clientId, clientSecret };
}

// ============================================================================
// 3. CREATING CLIENT SECRET CREDENTIAL
// ============================================================================

/**
 * Creates a ClientSecretCredential with proper error handling
 */
function createCredential(): ClientSecretCredential {
  try {
    const { tenantId, clientId, clientSecret } = getAzureCredentials();

    // Create the credential
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret,
      {
        // Optional: Configure additional options
        authorityHost: process.env.AZURE_AUTHORITY_HOST, // For sovereign clouds
        // retryOptions: { maxRetries: 3 },
      }
    );

    console.log("✓ ClientSecretCredential created successfully");
    return credential;
  } catch (error) {
    console.error("✗ Failed to create credential:", error);
    throw error;
  }
}

// ============================================================================
// 4. USING CREDENTIAL WITH AZURE SDK CLIENTS
// ============================================================================

/**
 * Example 1: Using with Azure Key Vault
 */
async function accessKeyVault(
  credential: ClientSecretCredential,
  vaultUrl: string
): Promise<void> {
  try {
    // Create Key Vault client with the credential
    const secretClient = new SecretClient(vaultUrl, credential);

    // Test authentication by retrieving a secret
    const secretName = "example-secret";
    const secret = await secretClient.getSecret(secretName);

    console.log(`✓ Successfully retrieved secret: ${secret.name}`);
    console.log(`  Value: ${secret.value ? "****" : "(empty)"}`);
  } catch (error) {
    handleAuthenticationError(error, "Key Vault");
    throw error;
  }
}

/**
 * Example 2: Using with Azure Blob Storage
 */
async function accessBlobStorage(
  credential: ClientSecretCredential,
  storageAccountUrl: string
): Promise<void> {
  try {
    // Create Blob Service client with the credential
    const blobServiceClient = new BlobServiceClient(
      storageAccountUrl,
      credential
    );

    // Test authentication by listing containers
    const containerIterator = blobServiceClient.listContainers();
    const containers: string[] = [];

    for await (const container of containerIterator) {
      containers.push(container.name);
    }

    console.log(`✓ Successfully listed ${containers.length} containers`);
  } catch (error) {
    handleAuthenticationError(error, "Blob Storage");
    throw error;
  }
}

// ============================================================================
// 5. ERROR HANDLING FOR AUTHENTICATION FAILURES
// ============================================================================

/**
 * Comprehensive error handling for authentication failures
 */
function handleAuthenticationError(error: unknown, serviceName: string): void {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // Handle specific authentication error scenarios
    if (errorMessage.includes("unauthorized") || errorMessage.includes("401")) {
      console.error(`✗ Authentication failed for ${serviceName}:`);
      console.error("  - Verify client secret is correct and not expired");
      console.error("  - Check if service principal has required permissions");
    } else if (
      errorMessage.includes("forbidden") ||
      errorMessage.includes("403")
    ) {
      console.error(`✗ Authorization failed for ${serviceName}:`);
      console.error("  - Service principal lacks necessary permissions");
      console.error("  - Check RBAC roles assigned to the service principal");
    } else if (
      errorMessage.includes("tenant") ||
      errorMessage.includes("invalid_tenant")
    ) {
      console.error(`✗ Invalid tenant ID:`);
      console.error("  - Verify AZURE_TENANT_ID is correct");
    } else if (
      errorMessage.includes("client") ||
      errorMessage.includes("invalid_client")
    ) {
      console.error(`✗ Invalid client credentials:`);
      console.error("  - Verify AZURE_CLIENT_ID is correct");
      console.error("  - Check if service principal is active");
    } else if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("network")
    ) {
      console.error(`✗ Network error while authenticating:`);
      console.error("  - Check network connectivity");
      console.error("  - Verify firewall rules allow Azure connections");
    } else {
      console.error(`✗ Unexpected authentication error for ${serviceName}:`);
      console.error(`  ${error.message}`);
    }
  } else {
    console.error(`✗ Unknown error type for ${serviceName}:`, error);
  }
}

// ============================================================================
// 6. BEST PRACTICES FOR SECRET MANAGEMENT
// ============================================================================

/**
 * SECURITY BEST PRACTICES:
 * 
 * 1. ENVIRONMENT VARIABLES:
 *    - Store credentials in environment variables, never in code
 *    - Use .env files locally (add .env to .gitignore)
 *    - Set environment variables in production deployment environment
 * 
 * 2. AZURE KEY VAULT (Production Recommended):
 *    - Store secrets in Azure Key Vault
 *    - Use Managed Identity for the application itself when possible
 *    - Only use Service Principal when Managed Identity isn't available
 * 
 * 3. SECRET ROTATION:
 *    - Regularly rotate client secrets (e.g., every 90 days)
 *    - Support multiple active secrets during rotation period
 *    - Use expiration dates on secrets
 * 
 * 4. LEAST PRIVILEGE:
 *    - Grant only the minimum required permissions
 *    - Use specific RBAC roles, not Owner or Contributor
 *    - Scope permissions to specific resources when possible
 * 
 * 5. AUDIT AND MONITORING:
 *    - Enable Azure AD sign-in logs
 *    - Monitor for failed authentication attempts
 *    - Set up alerts for suspicious activity
 * 
 * 6. NEVER:
 *    - Commit secrets to source control
 *    - Log secret values
 *    - Share secrets via insecure channels
 *    - Hardcode secrets in application code
 */

// ============================================================================
// 7. EXAMPLE: LOADING SECRETS FROM AZURE KEY VAULT (RECOMMENDED)
// ============================================================================

/**
 * Advanced pattern: Use a bootstrap credential to fetch secrets from Key Vault
 * Then use those secrets for the actual application credential
 */
async function getCredentialFromKeyVault(): Promise<ClientSecretCredential> {
  // Bootstrap: Use environment variables for Key Vault access only
  const bootstrapCredential = createCredential();
  
  const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;
  if (!keyVaultUrl) {
    throw new Error("AZURE_KEYVAULT_URL not configured");
  }

  try {
    const secretClient = new SecretClient(keyVaultUrl, bootstrapCredential);

    // Fetch actual application credentials from Key Vault
    const tenantId = (await secretClient.getSecret("app-tenant-id")).value!;
    const clientId = (await secretClient.getSecret("app-client-id")).value!;
    const clientSecret = (await secretClient.getSecret("app-client-secret")).value!;

    // Create application credential using secrets from Key Vault
    const appCredential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );

    console.log("✓ Application credential loaded from Key Vault");
    return appCredential;
  } catch (error) {
    handleAuthenticationError(error, "Key Vault Secret Retrieval");
    throw error;
  }
}

// ============================================================================
// 8. MAIN EXECUTION EXAMPLE
// ============================================================================

async function main(): Promise<void> {
  console.log("=== Azure Service Principal Authentication Example ===\n");

  try {
    // Create credential
    const credential = createCredential();

    // Example 1: Access Key Vault
    const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;
    if (keyVaultUrl) {
      console.log("\n--- Testing Key Vault Access ---");
      await accessKeyVault(credential, keyVaultUrl);
    }

    // Example 2: Access Blob Storage
    const storageAccountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL;
    if (storageAccountUrl) {
      console.log("\n--- Testing Blob Storage Access ---");
      await accessBlobStorage(credential, storageAccountUrl);
    }

    console.log("\n✓ All authentication tests completed successfully");
  } catch (error) {
    console.error("\n✗ Authentication example failed");
    process.exit(1);
  }
}

// ============================================================================
// 9. RETRY LOGIC FOR TRANSIENT FAILURES
// ============================================================================

/**
 * Helper function to retry operations on transient failures
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on permanent failures (4xx errors)
      if (
        error instanceof Error &&
        (error.message.includes("401") ||
          error.message.includes("403") ||
          error.message.includes("invalid"))
      ) {
        throw error;
      }

      // Retry on transient failures (5xx, network errors)
      if (attempt < maxRetries) {
        console.log(`  Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw lastError;
}

// ============================================================================
// 10. CREDENTIAL VALIDATION
// ============================================================================

/**
 * Validates that the credential works before using it in the application
 */
async function validateCredential(
  credential: ClientSecretCredential
): Promise<boolean> {
  try {
    // Use a lightweight operation to validate the credential
    // For example, get a token for the Azure Resource Manager scope
    const token = await credential.getToken(
      "https://management.azure.com/.default"
    );

    if (token && token.token) {
      console.log("✓ Credential validated successfully");
      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp)}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("✗ Credential validation failed");
    handleAuthenticationError(error, "Credential Validation");
    return false;
  }
}

// Execute main function if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

// Export functions for use in other modules
export {
  createCredential,
  getAzureCredentials,
  accessKeyVault,
  accessBlobStorage,
  handleAuthenticationError,
  getCredentialFromKeyVault,
  withRetry,
  validateCredential,
};
