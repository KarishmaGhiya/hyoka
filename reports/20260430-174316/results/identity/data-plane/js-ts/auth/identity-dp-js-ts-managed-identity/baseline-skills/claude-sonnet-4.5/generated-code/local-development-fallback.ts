/**
 * Local Development Fallback Strategies
 * 
 * Managed Identity only works in Azure. For local development,
 * you need fallback authentication methods.
 */

import {
  DefaultAzureCredential,
  ChainedTokenCredential,
  ManagedIdentityCredential,
  AzureCliCredential,
  EnvironmentCredential,
  AzureDeveloperCliCredential,
  TokenCredential,
} from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";

/**
 * Strategy 1: DefaultAzureCredential (RECOMMENDED)
 * 
 * Automatically tries multiple authentication methods in order:
 * 1. EnvironmentCredential - Service principal from env vars
 * 2. WorkloadIdentityCredential - Kubernetes workload identity
 * 3. ManagedIdentityCredential - Azure Managed Identity
 * 4. AzureCliCredential - Azure CLI login (az login)
 * 5. AzurePowerShellCredential - Azure PowerShell
 * 6. AzureDeveloperCliCredential - Azure Developer CLI (azd)
 * 
 * Works seamlessly in both Azure and local development
 */
export function useDefaultAzureCredential(): TokenCredential {
  // This is the BEST practice for most scenarios
  return new DefaultAzureCredential();
}

/**
 * Example: Using DefaultAzureCredential with Azure services
 */
export async function accessServicesWithDefaultCredential() {
  const credential = new DefaultAzureCredential();
  
  // Works in Azure with Managed Identity AND locally with Azure CLI
  const blobServiceClient = new BlobServiceClient(
    "https://mystorageaccount.blob.core.windows.net",
    credential
  );
  
  const secretClient = new SecretClient(
    "https://mykeyvault.vault.azure.net",
    credential
  );

  try {
    // Use the clients normally
    const containers = blobServiceClient.listContainers({ prefix: "data-" });
    for await (const container of containers) {
      console.log(`Container: ${container.name}`);
    }
  } catch (error) {
    console.error("Authentication failed:", error);
    throw error;
  }
}

/**
 * Strategy 2: Custom ChainedTokenCredential
 * 
 * Create a custom credential chain for specific scenarios
 * Useful when you want explicit control over the order
 */
export function useCustomCredentialChain(userAssignedClientId?: string): TokenCredential {
  const credentials: TokenCredential[] = [];

  // First, try Managed Identity (for Azure environments)
  if (userAssignedClientId) {
    credentials.push(new ManagedIdentityCredential({ clientId: userAssignedClientId }));
  } else {
    credentials.push(new ManagedIdentityCredential());
  }

  // Fallback to Azure CLI (for local development)
  credentials.push(new AzureCliCredential());

  // Fallback to environment variables (for CI/CD pipelines)
  credentials.push(new EnvironmentCredential());

  return new ChainedTokenCredential(...credentials);
}

/**
 * Strategy 3: Environment-based credential selection
 * 
 * Explicitly choose credential based on environment
 */
export function useEnvironmentSpecificCredential(): TokenCredential {
  const isAzure = process.env.WEBSITE_INSTANCE_ID || // App Service
                  process.env.AZURE_FUNCTIONS_ENVIRONMENT || // Functions
                  process.env.IDENTITY_ENDPOINT; // Container Apps, VMs

  if (isAzure) {
    console.log("Running in Azure - using Managed Identity");
    const clientId = process.env.AZURE_CLIENT_ID;
    return clientId
      ? new ManagedIdentityCredential({ clientId })
      : new ManagedIdentityCredential();
  } else {
    console.log("Running locally - using Azure CLI");
    return new AzureCliCredential();
  }
}

/**
 * Strategy 4: Configuration-based credential
 * 
 * Use configuration to determine authentication method
 */
export interface AuthConfig {
  useManagedIdentity: boolean;
  userAssignedClientId?: string;
  useAzureCli?: boolean;
}

export function createConfiguredCredential(config: AuthConfig): TokenCredential {
  if (config.useManagedIdentity) {
    return config.userAssignedClientId
      ? new ManagedIdentityCredential({ clientId: config.userAssignedClientId })
      : new ManagedIdentityCredential();
  }

  // Local development fallbacks
  const fallbackCredentials: TokenCredential[] = [];

  if (config.useAzureCli !== false) {
    fallbackCredentials.push(new AzureCliCredential());
  }

  fallbackCredentials.push(new AzureDeveloperCliCredential());
  fallbackCredentials.push(new EnvironmentCredential());

  return new ChainedTokenCredential(...fallbackCredentials);
}

/**
 * Strategy 5: Using environment variables for service principal (CI/CD)
 * 
 * For CI/CD pipelines, set these environment variables:
 * - AZURE_CLIENT_ID: Application (client) ID
 * - AZURE_TENANT_ID: Directory (tenant) ID  
 * - AZURE_CLIENT_SECRET: Client secret
 * 
 * EnvironmentCredential will automatically pick these up
 */
export function useCiCdCredential(): TokenCredential {
  // EnvironmentCredential reads from env vars automatically
  return new EnvironmentCredential();
}

/**
 * Complete example: Production-ready service with fallback
 */
export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;

  constructor(
    private accountName: string,
    private userAssignedClientId?: string
  ) {
    const credential = this.createCredential();
    this.blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );
  }

  private createCredential(): TokenCredential {
    // DefaultAzureCredential handles everything
    // - Managed Identity in Azure
    // - Azure CLI locally
    // - Environment variables in CI/CD
    const credential = new DefaultAzureCredential({
      managedIdentityClientId: this.userAssignedClientId,
    });

    return credential;
  }

  async uploadFile(containerName: string, fileName: string, content: string): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    try {
      await blockBlobClient.upload(content, content.length);
      console.log(`✓ Uploaded ${fileName} to ${containerName}`);
    } catch (error: any) {
      console.error(`✗ Failed to upload ${fileName}:`, error.message);
      throw error;
    }
  }

  async listContainers(): Promise<string[]> {
    const containers: string[] = [];
    try {
      for await (const container of this.blobServiceClient.listContainers()) {
        containers.push(container.name);
      }
      return containers;
    } catch (error: any) {
      console.error("✗ Failed to list containers:", error.message);
      throw error;
    }
  }
}

/**
 * Local development setup guide
 */
export function printLocalDevelopmentSetup(): void {
  console.log(`
📝 LOCAL DEVELOPMENT SETUP GUIDE

Option 1: Azure CLI (Recommended for local development)
  1. Install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli
  2. Run: az login
  3. Set subscription: az account set --subscription "subscription-name"
  4. Your app will use your Azure CLI credentials automatically

Option 2: Azure Developer CLI  
  1. Install: https://learn.microsoft.com/azure/developer/azure-developer-cli/
  2. Run: azd auth login
  3. Your app will use azd credentials

Option 3: Environment Variables (for CI/CD)
  Set these environment variables:
  - AZURE_CLIENT_ID=your-app-id
  - AZURE_TENANT_ID=your-tenant-id
  - AZURE_CLIENT_SECRET=your-secret

Option 4: Visual Studio / VS Code
  - Sign in to Azure in your IDE
  - IDE credentials will be used automatically

⚠️  Make sure your local identity has the same permissions
    as your Managed Identity in Azure!
  `);
}

/**
 * Test your authentication setup
 */
export async function testAuthentication(): Promise<void> {
  console.log("Testing authentication setup...\n");

  const credential = new DefaultAzureCredential();

  try {
    // Try to get a token for Azure Resource Manager
    const token = await credential.getToken("https://management.azure.com/.default");
    
    console.log("✓ Authentication successful!");
    console.log(`  Token obtained, expires: ${new Date(token.expiresOnTimestamp)}`);
    console.log("\nYour credential is working correctly. 🎉");
  } catch (error: any) {
    console.error("✗ Authentication failed!");
    console.error(`  Error: ${error.message}\n`);
    
    printLocalDevelopmentSetup();
  }
}
