import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

/**
 * Example: Using DefaultAzureCredential with Azure Key Vault
 * 
 * DefaultAzureCredential simplifies authentication by automatically trying
 * multiple credential types in a specific order until one succeeds.
 */
async function main() {
  // Create a DefaultAzureCredential instance
  // This will automatically try various authentication methods
  const credential = new DefaultAzureCredential();

  // Optional: Configure credential behavior
  const credentialWithOptions = new DefaultAzureCredential({
    // Exclude specific credential types if needed
    excludeEnvironmentCredential: false,
    excludeManagedIdentityCredential: false,
    excludeAzureCliCredential: false,
    excludeAzurePowerShellCredential: false,
    excludeVisualStudioCodeCredential: false,
    excludeAzureDeveloperCliCredential: false,
    
    // Set managed identity client ID (for user-assigned managed identities)
    managedIdentityClientId: undefined,
    
    // Set tenant ID for specific scenarios
    tenantId: undefined,
    
    // Enable logging for troubleshooting
    loggingOptions: {
      allowLoggingAccountIdentifiers: true,
      logLevel: "info"
    }
  });

  // Use the credential with an Azure SDK client
  const keyVaultUrl = "https://your-keyvault-name.vault.azure.net";
  const client = new SecretClient(keyVaultUrl, credential);

  try {
    // Example: Get a secret from Key Vault
    const secretName = "my-secret";
    const secret = await client.getSecret(secretName);
    console.log(`Secret retrieved: ${secret.name}`);
    console.log(`Secret value: ${secret.value}`);
  } catch (error) {
    console.error("Authentication or operation failed:", error);
    
    // Check for authentication errors
    if (error.code === "ENOTFOUND") {
      console.error("Key Vault URL not found. Check your Key Vault name.");
    } else if (error.statusCode === 401) {
      console.error("Authentication failed. See troubleshooting guide below.");
    } else if (error.statusCode === 403) {
      console.error("Authenticated but not authorized. Check RBAC permissions.");
    }
  }
}

/**
 * Example: Testing credential acquisition directly
 */
async function testCredential() {
  const credential = new DefaultAzureCredential();
  
  try {
    // Get an access token for Azure Resource Manager
    const tokenResponse = await credential.getToken(
      "https://management.azure.com/.default"
    );
    
    console.log("Authentication successful!");
    console.log(`Token expires at: ${new Date(tokenResponse.expiresOnTimestamp)}`);
  } catch (error) {
    console.error("Failed to acquire token:", error);
  }
}

/**
 * Example: Using with different Azure services
 */
async function multiServiceExample() {
  const credential = new DefaultAzureCredential();
  
  // Key Vault Secrets
  const secretClient = new SecretClient(
    "https://your-keyvault.vault.azure.net",
    credential
  );
  
  // You can reuse the same credential instance across multiple clients
  // This is efficient as it caches tokens internally
  
  // Example with other services (install respective packages):
  // import { BlobServiceClient } from "@azure/storage-blob";
  // const blobServiceClient = new BlobServiceClient(
  //   "https://youraccount.blob.core.windows.net",
  //   credential
  // );
  
  // import { CosmosClient } from "@azure/cosmos";
  // const cosmosClient = new CosmosClient({
  //   endpoint: "https://yourcosmosdb.documents.azure.com",
  //   aadCredentials: credential
  // });
}

// Run the example
main().catch(console.error);
