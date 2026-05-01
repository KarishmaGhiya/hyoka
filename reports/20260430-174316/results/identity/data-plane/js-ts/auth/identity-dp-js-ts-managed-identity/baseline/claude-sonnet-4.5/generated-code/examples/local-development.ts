/**
 * Local Development Fallback Strategies
 * 
 * Demonstrates different approaches to handle authentication
 * in both Azure (with Managed Identity) and local development.
 */

import {
  TokenCredential,
  ManagedIdentityCredential,
  DefaultAzureCredential,
  AzureCliCredential,
  ChainedTokenCredential,
  EnvironmentCredential,
  CredentialUnavailableError
} from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

/**
 * Strategy 1: DefaultAzureCredential (Recommended)
 * 
 * Tries multiple credential types automatically:
 * 1. Environment variables
 * 2. Managed Identity
 * 3. Azure CLI
 * 4. Azure PowerShell
 * 5. Visual Studio Code
 */
export function strategy1_DefaultCredential(): TokenCredential {
  console.log("Strategy 1: Using DefaultAzureCredential");
  
  // Works in both Azure and local development
  const credential = new DefaultAzureCredential();
  
  console.log("✓ Credential will try (in order):");
  console.log("  1. Environment variables (service principal)");
  console.log("  2. Managed Identity (if running in Azure)");
  console.log("  3. Azure CLI (az login)");
  console.log("  4. Azure PowerShell");
  console.log("  5. VS Code Azure Account extension");
  
  return credential;
}

/**
 * Strategy 2: ChainedTokenCredential
 * 
 * Create a custom fallback chain with specific credentials
 * in a defined order.
 */
export function strategy2_CustomChain(): TokenCredential {
  console.log("Strategy 2: Using ChainedTokenCredential");
  
  const credential = new ChainedTokenCredential(
    // Try environment variables first (for CI/CD)
    new EnvironmentCredential(),
    
    // Then try managed identity (for Azure deployments)
    new ManagedIdentityCredential(),
    
    // Finally try Azure CLI (for local development)
    new AzureCliCredential()
  );
  
  console.log("✓ Custom chain created:");
  console.log("  1. Environment variables → CI/CD pipelines");
  console.log("  2. Managed Identity → Azure resources");
  console.log("  3. Azure CLI → Local development");
  
  return credential;
}

/**
 * Strategy 3: Environment-Based Selection
 * 
 * Explicitly choose credential type based on environment
 */
export function strategy3_EnvironmentBased(): TokenCredential {
  console.log("Strategy 3: Environment-based selection");
  
  const isProduction = process.env.NODE_ENV === "production";
  const isAzureEnvironment = 
    process.env.WEBSITE_INSTANCE_ID || // App Service
    process.env.AZURE_FUNCTIONS_ENVIRONMENT || // Functions
    process.env.CONTAINER_APP_NAME; // Container Apps
  
  if (isProduction || isAzureEnvironment) {
    console.log("✓ Running in Azure - using Managed Identity");
    
    const clientId = process.env.AZURE_USER_ASSIGNED_CLIENT_ID;
    if (clientId) {
      console.log(`  User-assigned identity: ${clientId}`);
      return new ManagedIdentityCredential({ clientId });
    } else {
      console.log("  System-assigned identity");
      return new ManagedIdentityCredential();
    }
  } else {
    console.log("✓ Running locally - using Azure CLI");
    console.log("  Ensure you're logged in: az login");
    return new AzureCliCredential();
  }
}

/**
 * Strategy 4: Configuration-Based
 * 
 * Load credential configuration from environment variables
 * with support for multiple environments
 */
interface CredentialConfig {
  environment: string;
  credential: TokenCredential;
  description: string;
}

export function strategy4_ConfigurationBased(): CredentialConfig {
  console.log("Strategy 4: Configuration-based credential");
  
  const environment = process.env.ENVIRONMENT || "local";
  console.log(`Environment: ${environment}`);
  
  switch (environment) {
    case "production":
      return {
        environment: "production",
        credential: new ManagedIdentityCredential({
          clientId: process.env.AZURE_USER_ASSIGNED_CLIENT_ID
        }),
        description: "Production: User-assigned managed identity"
      };
    
    case "staging":
      return {
        environment: "staging",
        credential: new ManagedIdentityCredential(),
        description: "Staging: System-assigned managed identity"
      };
    
    case "development":
      // Use service principal for development environment
      if (!process.env.AZURE_TENANT_ID || 
          !process.env.AZURE_CLIENT_ID || 
          !process.env.AZURE_CLIENT_SECRET) {
        console.warn("Warning: Service principal credentials not configured");
        console.warn("Falling back to DefaultAzureCredential");
        return {
          environment: "development",
          credential: new DefaultAzureCredential(),
          description: "Development: DefaultAzureCredential (fallback)"
        };
      }
      
      return {
        environment: "development",
        credential: new EnvironmentCredential(),
        description: "Development: Service principal from environment"
      };
    
    case "local":
    default:
      return {
        environment: "local",
        credential: new DefaultAzureCredential(),
        description: "Local: DefaultAzureCredential (Azure CLI, etc.)"
      };
  }
}

/**
 * Validate that a credential works before using it in production
 */
export async function validateCredential(credential: TokenCredential): Promise<boolean> {
  console.log("\nValidating credential...");
  
  try {
    // Try to get a token for Azure Management API
    const token = await credential.getToken("https://management.azure.com/.default");
    
    if (token && token.token) {
      console.log("✓ Credential is valid");
      console.log(`  Token expires: ${new Date(token.expiresOnTimestamp).toISOString()}`);
      return true;
    }
    
    console.error("✗ Token is invalid (empty)");
    return false;
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      console.error("✗ Credential is not available");
      console.error("  Possible reasons:");
      console.error("  - Not logged in (run: az login)");
      console.error("  - Managed Identity not enabled");
      console.error("  - No valid credentials found");
    } else {
      console.error("✗ Error validating credential:", (error as Error).message);
    }
    return false;
  }
}

/**
 * Example: Using credential with Azure SDK client
 */
export async function useCredentialExample(credential: TokenCredential): Promise<void> {
  console.log("\n--- Using Credential with Key Vault ---");
  
  const keyVaultUrl = process.env.KEY_VAULT_URL;
  if (!keyVaultUrl) {
    console.log("Skipped: KEY_VAULT_URL not set");
    return;
  }
  
  const client = new SecretClient(keyVaultUrl, credential);
  
  try {
    // List first 3 secrets
    const secrets: string[] = [];
    for await (const props of client.listPropertiesOfSecrets()) {
      secrets.push(props.name);
      if (secrets.length >= 3) break;
    }
    
    console.log(`✓ Successfully accessed Key Vault`);
    console.log(`  Found ${secrets.length} secret(s)`);
  } catch (error: any) {
    console.error("✗ Failed to access Key Vault");
    console.error(`  Error: ${error.message}`);
    
    if (error.statusCode === 403) {
      console.error("\n  Missing permissions. Required role: 'Key Vault Secrets User'");
    }
  }
}

/**
 * Complete example with error handling and retry logic
 */
export async function robustCredentialExample(): Promise<void> {
  console.log("\n=== Robust Credential Example ===\n");
  
  // Try multiple strategies until one works
  const strategies = [
    { name: "DefaultAzureCredential", fn: strategy1_DefaultCredential },
    { name: "Custom Chain", fn: strategy2_CustomChain },
    { name: "Environment-Based", fn: strategy3_EnvironmentBased }
  ];
  
  for (const strategy of strategies) {
    console.log(`\nTrying ${strategy.name}...`);
    
    try {
      const credential = strategy.fn();
      const isValid = await validateCredential(credential);
      
      if (isValid) {
        console.log(`\n✓ ${strategy.name} works!`);
        await useCredentialExample(credential);
        return; // Success!
      }
    } catch (error) {
      console.error(`✗ ${strategy.name} failed:`, (error as Error).message);
    }
  }
  
  console.error("\n✗ All credential strategies failed");
  console.error("Please ensure you're either:");
  console.error("  1. Running on Azure with Managed Identity enabled, OR");
  console.error("  2. Logged in locally with: az login");
}

// Demo all strategies
async function demonstrateStrategies(): Promise<void> {
  console.log("=== Local Development Strategies ===\n");
  
  // Strategy 1
  const cred1 = strategy1_DefaultCredential();
  await validateCredential(cred1);
  
  console.log("\n" + "=".repeat(50) + "\n");
  
  // Strategy 2
  const cred2 = strategy2_CustomChain();
  await validateCredential(cred2);
  
  console.log("\n" + "=".repeat(50) + "\n");
  
  // Strategy 3
  const cred3 = strategy3_EnvironmentBased();
  await validateCredential(cred3);
  
  console.log("\n" + "=".repeat(50) + "\n");
  
  // Strategy 4
  const config4 = strategy4_ConfigurationBased();
  console.log(`Description: ${config4.description}`);
  await validateCredential(config4.credential);
}

// Run if executed directly
if (require.main === module) {
  demonstrateStrategies().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
