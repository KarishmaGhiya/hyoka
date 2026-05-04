/**
 * Azure Service Principal Authentication Example
 * 
 * This example demonstrates how to authenticate to Azure using a Service Principal
 * with a client secret in Node.js/TypeScript.
 */

import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { BlobServiceClient } from "@azure/storage-blob";

// ============================================================================
// 1. REQUIRED NPM PACKAGES
// ============================================================================
// Run: npm install @azure/identity @azure/keyvault-secrets @azure/storage-blob

// ============================================================================
// 2. CREATING A ClientSecretCredential
// ============================================================================

/**
 * Creates a ClientSecretCredential for Service Principal authentication.
 * 
 * @param tenantId - Azure AD tenant ID (directory ID)
 * @param clientId - Application (client) ID of the service principal
 * @param clientSecret - Client secret value (not the secret ID)
 * @returns ClientSecretCredential instance
 */
function createCredential(
  tenantId: string,
  clientId: string,
  clientSecret: string
): ClientSecretCredential {
  return new ClientSecretCredential(tenantId, clientId, clientSecret);
}

// ============================================================================
// 3. USING WITH AZURE SDK CLIENTS
// ============================================================================

/**
 * Example: Using ClientSecretCredential with Azure Key Vault
 */
async function accessKeyVaultExample() {
  // Get configuration from environment variables (best practice)
  const tenantId = process.env.AZURE_TENANT_ID!;
  const clientId = process.env.AZURE_CLIENT_ID!;
  const clientSecret = process.env.AZURE_CLIENT_SECRET!;
  const keyVaultUrl = process.env.AZURE_KEYVAULT_URL!;

  // Create credential
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

  // Use with Azure Key Vault client
  const secretClient = new SecretClient(keyVaultUrl, credential);

  try {
    // Retrieve a secret
    const secret = await secretClient.getSecret("my-secret-name");
    console.log(`Retrieved secret: ${secret.value}`);
  } catch (error) {
    handleAuthenticationError(error);
  }
}

/**
 * Example: Using ClientSecretCredential with Azure Blob Storage
 */
async function accessBlobStorageExample() {
  const tenantId = process.env.AZURE_TENANT_ID!;
  const clientId = process.env.AZURE_CLIENT_ID!;
  const clientSecret = process.env.AZURE_CLIENT_SECRET!;
  const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential
  );

  try {
    // List containers
    const containerIterator = blobServiceClient.listContainers();
    for await (const container of containerIterator) {
      console.log(`Container: ${container.name}`);
    }
  } catch (error) {
    handleAuthenticationError(error);
  }
}

// ============================================================================
// 4. BEST PRACTICES FOR SECRET MANAGEMENT
// ============================================================================

/**
 * RECOMMENDED: Load credentials from environment variables
 * 
 * Set these in your environment:
 * - AZURE_TENANT_ID
 * - AZURE_CLIENT_ID
 * - AZURE_CLIENT_SECRET
 */
function loadCredentialsFromEnvironment(): ClientSecretCredential {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing required environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
    );
  }

  return new ClientSecretCredential(tenantId, clientId, clientSecret);
}

/**
 * BEST PRACTICE: Use Azure Key Vault to store secrets
 * 
 * Instead of storing secrets in environment variables, retrieve them from Key Vault.
 * This example uses Managed Identity for the initial auth to Key Vault.
 */
async function loadCredentialsFromKeyVault(): Promise<ClientSecretCredential> {
  const { DefaultAzureCredential } = await import("@azure/identity");
  
  const keyVaultUrl = process.env.AZURE_KEYVAULT_URL!;
  const tenantId = process.env.AZURE_TENANT_ID!;

  // Use DefaultAzureCredential (Managed Identity) to access Key Vault
  const kvCredential = new DefaultAzureCredential();
  const secretClient = new SecretClient(keyVaultUrl, kvCredential);

  // Retrieve Service Principal credentials from Key Vault
  const clientIdSecret = await secretClient.getSecret("sp-client-id");
  const clientSecretSecret = await secretClient.getSecret("sp-client-secret");

  return new ClientSecretCredential(
    tenantId,
    clientIdSecret.value!,
    clientSecretSecret.value!
  );
}

/**
 * SECRET MANAGEMENT BEST PRACTICES:
 * 
 * ✅ DO:
 * - Store secrets in Azure Key Vault
 * - Use environment variables for local development
 * - Use Managed Identity when possible (eliminates secrets)
 * - Rotate secrets regularly
 * - Use separate service principals for different environments (dev/staging/prod)
 * - Set appropriate RBAC permissions (principle of least privilege)
 * - Use .env files (with dotenv package) and add to .gitignore
 * 
 * ❌ DON'T:
 * - Hard-code secrets in source code
 * - Commit secrets to version control
 * - Share secrets via email or chat
 * - Use the same service principal across all environments
 * - Grant excessive permissions
 */

// ============================================================================
// 5. ERROR HANDLING FOR AUTHENTICATION FAILURES
// ============================================================================

/**
 * Comprehensive error handling for authentication failures
 */
function handleAuthenticationError(error: unknown): void {
  if (error instanceof Error) {
    // Check for specific authentication errors
    if (error.name === "AuthenticationError") {
      console.error("Authentication failed:", error.message);
      
      // Common causes:
      // - Invalid tenant ID, client ID, or client secret
      // - Service principal disabled or deleted
      // - Client secret expired
      console.error("Please verify your credentials and ensure the service principal is active.");
    } else if (error.message.includes("AADSTS")) {
      // Azure AD error codes
      console.error("Azure AD authentication error:", error.message);
      
      if (error.message.includes("AADSTS7000215")) {
        console.error("Invalid client secret provided.");
      } else if (error.message.includes("AADSTS700016")) {
        console.error("Invalid client ID (application not found in tenant).");
      } else if (error.message.includes("AADSTS90002")) {
        console.error("Invalid tenant ID.");
      } else if (error.message.includes("AADSTS50057")) {
        console.error("Service principal is disabled or deleted.");
      }
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ETIMEDOUT")) {
      console.error("Network error: Unable to reach Azure AD endpoint.");
    } else {
      console.error("Unexpected error:", error.message);
    }
  } else {
    console.error("Unknown error occurred:", error);
  }
}

/**
 * Retry logic with exponential backoff for transient failures
 */
async function authenticateWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Only retry on transient errors
      if (isTransientError(error)) {
        const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Attempt ${attempt + 1} failed. Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        // Non-transient error, don't retry
        throw error;
      }
    }
  }
  
  throw lastError;
}

function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    const transientPatterns = [
      "ETIMEDOUT",
      "ECONNRESET",
      "ENOTFOUND",
      "429", // Too many requests
      "503", // Service unavailable
      "504", // Gateway timeout
    ];
    
    return transientPatterns.some(pattern => 
      error.message.includes(pattern)
    );
  }
  return false;
}

// ============================================================================
// COMPLETE WORKING EXAMPLE
// ============================================================================

async function main() {
  try {
    console.log("=== Azure Service Principal Authentication Example ===\n");

    // Load credentials from environment variables
    const credential = loadCredentialsFromEnvironment();
    console.log("✓ Credentials loaded from environment variables\n");

    // Example 1: Access Azure Key Vault
    console.log("Example 1: Accessing Azure Key Vault...");
    const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;
    if (keyVaultUrl) {
      const secretClient = new SecretClient(keyVaultUrl, credential);
      
      await authenticateWithRetry(async () => {
        // This will trigger authentication
        const secretIterator = secretClient.listPropertiesOfSecrets();
        const secrets = [];
        for await (const secretProperties of secretIterator) {
          secrets.push(secretProperties.name);
        }
        console.log(`✓ Successfully authenticated. Found ${secrets.length} secrets.\n`);
      });
    } else {
      console.log("⊘ Skipped (AZURE_KEYVAULT_URL not set)\n");
    }

    // Example 2: Access Azure Blob Storage
    console.log("Example 2: Accessing Azure Blob Storage...");
    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (storageAccountName) {
      const blobServiceClient = new BlobServiceClient(
        `https://${storageAccountName}.blob.core.windows.net`,
        credential
      );

      await authenticateWithRetry(async () => {
        const containerIterator = blobServiceClient.listContainers();
        const containers = [];
        for await (const container of containerIterator) {
          containers.push(container.name);
        }
        console.log(`✓ Successfully authenticated. Found ${containers.length} containers.\n`);
      });
    } else {
      console.log("⊘ Skipped (AZURE_STORAGE_ACCOUNT_NAME not set)\n");
    }

    console.log("=== All examples completed successfully ===");
  } catch (error) {
    console.error("\n=== Error occurred ===");
    handleAuthenticationError(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  createCredential,
  loadCredentialsFromEnvironment,
  loadCredentialsFromKeyVault,
  handleAuthenticationError,
  authenticateWithRetry,
};
