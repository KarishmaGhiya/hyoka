/**
 * Complete Guide to Azure DefaultAzureCredential
 * 
 * This example demonstrates how to authenticate Azure SDK clients using
 * DefaultAzureCredential, which automatically tries multiple authentication
 * methods in a specific order.
 */

// ============================================================================
// 1. REQUIRED NPM PACKAGES
// ============================================================================

// Core identity package - provides DefaultAzureCredential
// npm install @azure/identity

// Service-specific SDK (example: Key Vault Secrets)
// npm install @azure/keyvault-secrets

// For TypeScript projects, also install:
// npm install --save-dev typescript @types/node

import { DefaultAzureCredential, ChainedTokenCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// ============================================================================
// 2. CREATING AND USING DefaultAzureCredential
// ============================================================================

/**
 * Basic usage: Create credential and pass to Azure SDK client
 */
async function basicExample() {
  // Create the credential - no parameters needed for default behavior
  const credential = new DefaultAzureCredential();

  // Use it with any Azure SDK client
  const keyVaultUrl = "https://your-keyvault-name.vault.azure.net";
  const client = new SecretClient(keyVaultUrl, credential);

  // Make authenticated calls
  try {
    const secret = await client.getSecret("my-secret-name");
    console.log(`Secret value: ${secret.value}`);
  } catch (error) {
    console.error("Authentication or access failed:", error);
  }
}

// ============================================================================
// 3. CREDENTIAL CHAIN ORDER
// ============================================================================

/**
 * DefaultAzureCredential tries these credentials IN ORDER until one succeeds:
 * 
 * 1. EnvironmentCredential
 *    - Reads from environment variables:
 *      * AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET (Service Principal)
 *      * AZURE_CLIENT_ID, AZURE_CLIENT_CERTIFICATE_PATH (Certificate)
 *      * AZURE_CLIENT_ID, AZURE_USERNAME, AZURE_PASSWORD (User/Password)
 * 
 * 2. WorkloadIdentityCredential
 *    - Uses Azure Workload Identity (Kubernetes service account tokens)
 *    - Requires AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_FEDERATED_TOKEN_FILE
 * 
 * 3. ManagedIdentityCredential
 *    - Uses Managed Identity on Azure resources (VM, App Service, Functions, etc.)
 *    - System-assigned or user-assigned identity
 *    - No configuration needed when deployed to Azure
 * 
 * 4. AzureCliCredential
 *    - Uses the logged-in Azure CLI user (`az login`)
 *    - Great for local development
 * 
 * 5. AzurePowerShellCredential
 *    - Uses the logged-in Azure PowerShell user (`Connect-AzAccount`)
 * 
 * 6. AzureDeveloperCliCredential
 *    - Uses the logged-in Azure Developer CLI user (`azd auth login`)
 * 
 * If ALL credentials fail, DefaultAzureCredential throws an error.
 */

// ============================================================================
// 4. ENVIRONMENT-SPECIFIC BEHAVIOR
// ============================================================================

/**
 * LOCAL DEVELOPMENT ENVIRONMENTS
 * 
 * VS Code / Local Machine:
 * - AzureCliCredential is typically used
 * - Requires: `az login` to be run first
 * - Uses your personal Azure account
 * - Inherits your RBAC permissions
 * 
 * Setup steps:
 * 1. Install Azure CLI: https://aka.ms/azure-cli
 * 2. Run: az login
 * 3. (Optional) Set default subscription: az account set --subscription "your-sub-id"
 * 4. Run your application - DefaultAzureCredential will use CLI credentials
 */

/**
 * AZURE-HOSTED ENVIRONMENTS
 * 
 * Azure App Service / Functions / Container Apps:
 * - ManagedIdentityCredential is used
 * - Enable "System-assigned managed identity" in Azure portal
 * - Grant the identity RBAC permissions to required resources
 * - No code changes or secrets needed
 * 
 * Azure Kubernetes Service (AKS):
 * - WorkloadIdentityCredential (recommended) or ManagedIdentityCredential
 * - Setup workload identity federation for service accounts
 * 
 * Azure VM / VM Scale Sets:
 * - ManagedIdentityCredential
 * - Enable managed identity on the VM
 * - Grant RBAC permissions to the identity
 * 
 * CI/CD Pipelines (GitHub Actions, Azure DevOps):
 * - EnvironmentCredential with service principal
 * - Set environment variables for AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
 * - Or use WorkloadIdentityCredential with federated credentials (passwordless)
 */

// ============================================================================
// 5. COMPLETE WORKING EXAMPLE
// ============================================================================

async function completeExample() {
  console.log("=== Azure DefaultAzureCredential Example ===\n");

  // Create credential with optional configuration
  const credential = new DefaultAzureCredential({
    // Optional: Specify which credentials to try (excludes others)
    // excludeCredentials: ["AzurePowerShellCredential"],
    
    // Optional: For user-assigned managed identity, specify client ID
    // managedIdentityClientId: "your-managed-identity-client-id",
    
    // Optional: Set timeout for authentication attempts (default: 10000ms)
    // timeout: 15000,
    
    // Optional: Enable logging for troubleshooting
    // loggingOptions: { logLevel: "info" }
  });

  // Example: Azure Key Vault Secret Client
  const keyVaultUrl = process.env.KEY_VAULT_URL || "https://your-keyvault.vault.azure.net";
  const secretClient = new SecretClient(keyVaultUrl, credential);

  try {
    console.log("Attempting to authenticate and access Key Vault...");
    
    // List all secrets (requires "Key Vault Secrets User" or "Key Vault Secrets Officer" role)
    console.log("\nListing secrets:");
    for await (const secretProperties of secretClient.listPropertiesOfSecrets()) {
      console.log(`- ${secretProperties.name}`);
    }

    // Get a specific secret
    const secretName = "my-secret";
    console.log(`\nRetrieving secret: ${secretName}`);
    const secret = await secretClient.getSecret(secretName);
    console.log(`Secret retrieved successfully (length: ${secret.value?.length} chars)`);

  } catch (error: any) {
    console.error("\n❌ Authentication or access failed!");
    console.error(`Error: ${error.message}`);
    
    // See troubleshooting section below for common issues
    if (error.code === "ENOTFOUND") {
      console.error("\n💡 Tip: Check your Key Vault URL");
    } else if (error.statusCode === 401) {
      console.error("\n💡 Tip: Authentication failed - see troubleshooting guide");
    } else if (error.statusCode === 403) {
      console.error("\n💡 Tip: Authenticated but no permissions - assign RBAC role");
    }
  }
}

// ============================================================================
// 6. TROUBLESHOOTING AUTHENTICATION FAILURES
// ============================================================================

/**
 * COMMON ERRORS AND SOLUTIONS
 * 
 * Error: "DefaultAzureCredential failed to retrieve a token from the included credentials"
 * 
 * Solution 1 - Enable Detailed Logging:
 */
async function troubleshootingExample() {
  // Set environment variable to see which credentials are tried
  process.env.AZURE_LOG_LEVEL = "info";

  const credential = new DefaultAzureCredential();
  
  try {
    // This will log each credential attempt
    const token = await credential.getToken("https://vault.azure.net/.default");
    console.log("✅ Authentication successful!");
  } catch (error: any) {
    console.error("❌ All credentials failed:", error.message);
  }
}

/**
 * Solution 2 - Check Azure CLI Login:
 * 
 * Run in terminal:
 *   az login
 *   az account show  # Verify you're logged in
 *   az account list  # See available subscriptions
 *   az account set --subscription "your-subscription-id"  # Set default if needed
 */

/**
 * Solution 3 - Verify Environment Variables (for CI/CD):
 * 
 * Required for service principal:
 *   AZURE_TENANT_ID=your-tenant-id
 *   AZURE_CLIENT_ID=your-client-id
 *   AZURE_CLIENT_SECRET=your-client-secret
 * 
 * Verify they're set:
 *   console.log("Tenant ID:", process.env.AZURE_TENANT_ID ? "✅ Set" : "❌ Missing");
 */

/**
 * Solution 4 - Check RBAC Permissions:
 * 
 * Even with valid credentials, you need permissions on the resource.
 * 
 * For Key Vault:
 *   - Role: "Key Vault Secrets User" (read) or "Key Vault Secrets Officer" (read/write)
 *   - Assign via Azure Portal > Key Vault > Access control (IAM) > Add role assignment
 * 
 * For Storage Account:
 *   - Role: "Storage Blob Data Reader" or "Storage Blob Data Contributor"
 * 
 * For Cosmos DB:
 *   - Role: "Cosmos DB Account Reader Role" or built-in RBAC roles
 */

/**
 * Solution 5 - Test Individual Credentials:
 * 
 * Narrow down which credential should work but isn't:
 */
async function testSpecificCredential() {
  const { AzureCliCredential } = await import("@azure/identity");
  
  try {
    const cliCredential = new AzureCliCredential();
    const token = await cliCredential.getToken("https://management.azure.com/.default");
    console.log("✅ Azure CLI credential works!");
  } catch (error: any) {
    console.error("❌ Azure CLI credential failed:", error.message);
    console.error("💡 Run: az login");
  }
}

/**
 * Solution 6 - Common Issues by Environment:
 * 
 * Local Development:
 *   - Forgot to run `az login`
 *   - Azure CLI not installed
 *   - Logged into wrong tenant/subscription
 *   - Solution: az login --tenant "your-tenant-id"
 * 
 * Azure App Service / Functions:
 *   - Managed identity not enabled
 *   - Solution: Enable in Portal > Identity > System assigned > On
 *   - RBAC role not assigned to the managed identity
 *   - Solution: Assign role to the managed identity in target resource
 * 
 * CI/CD Pipeline:
 *   - Environment variables not set or incorrect
 *   - Service principal expired or deleted
 *   - Service principal doesn't have permissions
 *   - Solution: Verify service principal exists and has correct RBAC roles
 * 
 * Network Issues:
 *   - Firewall blocking Azure endpoints
 *   - Private endpoint configuration issues
 *   - Solution: Check network connectivity to Azure services
 */

// ============================================================================
// 7. ADVANCED: CUSTOM CREDENTIAL CHAINS
// ============================================================================

/**
 * If you need a different order or subset of credentials:
 */
async function customChainExample() {
  const {
    ChainedTokenCredential,
    EnvironmentCredential,
    ManagedIdentityCredential,
    AzureCliCredential
  } = await import("@azure/identity");

  // Only try these credentials in this order
  const credential = new ChainedTokenCredential(
    new EnvironmentCredential(),
    new ManagedIdentityCredential(),
    new AzureCliCredential()
  );

  const keyVaultUrl = "https://your-keyvault.vault.azure.net";
  const client = new SecretClient(keyVaultUrl, credential);
  
  // Use as normal
  const secret = await client.getSecret("my-secret");
}

// ============================================================================
// QUICK START CHECKLIST
// ============================================================================

/**
 * ✅ LOCAL DEVELOPMENT SETUP:
 * 
 * 1. Install packages:
 *    npm install @azure/identity @azure/keyvault-secrets
 * 
 * 2. Login to Azure:
 *    az login
 * 
 * 3. Set environment variable (optional):
 *    export KEY_VAULT_URL="https://your-keyvault.vault.azure.net"
 * 
 * 4. Grant yourself permissions in Azure Portal:
 *    Your Key Vault > Access control (IAM) > Add role assignment
 *    Role: "Key Vault Secrets User"
 *    Assign access to: your Azure CLI user
 * 
 * 5. Run your code:
 *    const credential = new DefaultAzureCredential();
 *    const client = new SecretClient(vaultUrl, credential);
 *    await client.getSecret("my-secret");
 * 
 * ✅ AZURE DEPLOYMENT SETUP:
 * 
 * 1. Enable managed identity on your Azure resource:
 *    Azure Portal > Your App Service/Function > Identity > System assigned > On
 * 
 * 2. Grant the managed identity permissions:
 *    Key Vault > Access control (IAM) > Add role assignment
 *    Role: "Key Vault Secrets User"
 *    Assign access to: your managed identity
 * 
 * 3. Deploy your code (no changes needed):
 *    DefaultAzureCredential will automatically use managed identity
 * 
 * ✅ CI/CD PIPELINE SETUP:
 * 
 * 1. Create a service principal:
 *    az ad sp create-for-rbac --name "my-app-sp" --role contributor
 * 
 * 2. Set environment variables in your pipeline:
 *    AZURE_TENANT_ID=<tenant-id>
 *    AZURE_CLIENT_ID=<app-id>
 *    AZURE_CLIENT_SECRET=<password>
 * 
 * 3. Grant service principal permissions to resources
 * 
 * 4. Run your pipeline - DefaultAzureCredential will use environment variables
 */

// Run the example
if (require.main === module) {
  completeExample().catch(console.error);
}

export { completeExample, troubleshootingExample, customChainExample };
