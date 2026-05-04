/**
 * Managed Identity Authentication Examples for Azure SDK
 * Using @azure/identity package
 */

import { 
  ManagedIdentityCredential, 
  DefaultAzureCredential,
  ChainedTokenCredential,
  AzureCliCredential,
  EnvironmentCredential
} from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { BlobServiceClient } from '@azure/storage-blob';
import { QueueServiceClient } from '@azure/storage-queue';

// ============================================================================
// 1. SYSTEM-ASSIGNED MANAGED IDENTITY
// ============================================================================

/**
 * System-Assigned Managed Identity (simplest approach)
 * No configuration needed - automatically uses the system-assigned identity
 */
export function createSystemAssignedCredential(): ManagedIdentityCredential {
  // Create credential for system-assigned managed identity
  const credential = new ManagedIdentityCredential();
  return credential;
}

/**
 * Example: Using System-Assigned MI with Key Vault
 */
export async function keyVaultWithSystemMI(vaultUrl: string): Promise<void> {
  const credential = new ManagedIdentityCredential();
  const client = new SecretClient(vaultUrl, credential);

  try {
    const secret = await client.getSecret('my-secret');
    console.log(`Retrieved secret: ${secret.name}`);
  } catch (error) {
    console.error('Error accessing Key Vault:', error);
    throw error;
  }
}

/**
 * Example: Using System-Assigned MI with Blob Storage
 */
export async function blobStorageWithSystemMI(storageAccountUrl: string): Promise<void> {
  const credential = new ManagedIdentityCredential();
  const blobServiceClient = new BlobServiceClient(storageAccountUrl, credential);

  try {
    const containerClient = blobServiceClient.getContainerClient('my-container');
    const exists = await containerClient.exists();
    console.log(`Container exists: ${exists}`);
  } catch (error) {
    console.error('Error accessing Blob Storage:', error);
    throw error;
  }
}

// ============================================================================
// 2. USER-ASSIGNED MANAGED IDENTITY
// ============================================================================

/**
 * User-Assigned Managed Identity using Client ID
 * Preferred method when you have the client ID
 */
export function createUserAssignedCredentialByClientId(
  clientId: string
): ManagedIdentityCredential {
  const credential = new ManagedIdentityCredential({
    clientId: clientId
  });
  return credential;
}

/**
 * User-Assigned Managed Identity using Resource ID
 * Use when you have the full ARM resource ID
 */
export function createUserAssignedCredentialByResourceId(
  resourceId: string
): ManagedIdentityCredential {
  // Resource ID format: /subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{identityName}
  const credential = new ManagedIdentityCredential({
    resourceId: resourceId
  });
  return credential;
}

/**
 * Example: Using User-Assigned MI with Key Vault
 */
export async function keyVaultWithUserAssignedMI(
  vaultUrl: string,
  clientId: string
): Promise<void> {
  const credential = new ManagedIdentityCredential({
    clientId: clientId
  });
  
  const client = new SecretClient(vaultUrl, credential);

  try {
    const secret = await client.getSecret('my-secret');
    console.log(`Retrieved secret: ${secret.name}`);
  } catch (error) {
    console.error('Error accessing Key Vault:', error);
    throw error;
  }
}

/**
 * Example: Using User-Assigned MI with Queue Storage
 */
export async function queueStorageWithUserAssignedMI(
  storageAccountUrl: string,
  clientId: string
): Promise<void> {
  const credential = new ManagedIdentityCredential({
    clientId: clientId
  });
  
  const queueServiceClient = new QueueServiceClient(storageAccountUrl, credential);

  try {
    const queueClient = queueServiceClient.getQueueClient('my-queue');
    const exists = await queueClient.exists();
    console.log(`Queue exists: ${exists}`);
  } catch (error) {
    console.error('Error accessing Queue Storage:', error);
    throw error;
  }
}

// ============================================================================
// 3. LOCAL DEVELOPMENT FALLBACK STRATEGIES
// ============================================================================

/**
 * Strategy 1: DefaultAzureCredential (Recommended)
 * Tries multiple authentication methods in order:
 * 1. EnvironmentCredential
 * 2. WorkloadIdentityCredential
 * 3. ManagedIdentityCredential
 * 4. AzureCliCredential
 * 5. AzurePowerShellCredential
 * 6. AzureDeveloperCliCredential
 */
export function createDefaultCredential(): DefaultAzureCredential {
  const credential = new DefaultAzureCredential({
    // Optional: specify managed identity client ID for user-assigned MI
    managedIdentityClientId: process.env.AZURE_CLIENT_ID
  });
  return credential;
}

/**
 * Strategy 2: ChainedTokenCredential with custom fallback chain
 * More explicit control over the authentication chain
 */
export function createChainedCredentialWithFallback(
  userAssignedClientId?: string
): ChainedTokenCredential {
  const credentials = [];

  // First try: Environment variables (for local dev with service principal)
  credentials.push(new EnvironmentCredential());

  // Second try: Managed Identity (works in Azure)
  if (userAssignedClientId) {
    credentials.push(new ManagedIdentityCredential({ clientId: userAssignedClientId }));
  } else {
    credentials.push(new ManagedIdentityCredential());
  }

  // Third try: Azure CLI (for local development)
  credentials.push(new AzureCliCredential());

  return new ChainedTokenCredential(...credentials);
}

/**
 * Strategy 3: Environment-based credential selection
 * Explicitly choose credential based on environment
 */
export function createEnvironmentAwareCredential(): 
  ManagedIdentityCredential | AzureCliCredential {
  const isAzureEnvironment = process.env.AZURE_ENVIRONMENT === 'true' || 
                             process.env.IDENTITY_ENDPOINT !== undefined;

  if (isAzureEnvironment) {
    console.log('Running in Azure - using Managed Identity');
    const clientId = process.env.AZURE_CLIENT_ID;
    return clientId 
      ? new ManagedIdentityCredential({ clientId })
      : new ManagedIdentityCredential();
  } else {
    console.log('Running locally - using Azure CLI');
    return new AzureCliCredential();
  }
}

/**
 * Example: Using DefaultAzureCredential with Key Vault
 * Works both locally (using Azure CLI) and in Azure (using Managed Identity)
 */
export async function keyVaultWithDefaultCredential(vaultUrl: string): Promise<void> {
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(vaultUrl, credential);

  try {
    const secret = await client.getSecret('my-secret');
    console.log(`Retrieved secret: ${secret.name}`);
  } catch (error) {
    console.error('Error accessing Key Vault:', error);
    throw error;
  }
}

// ============================================================================
// 4. ERROR HANDLING AND COMMON PITFALLS
// ============================================================================

/**
 * Comprehensive error handling for Managed Identity
 */
export async function robustManagedIdentityExample(
  vaultUrl: string,
  clientId?: string
): Promise<void> {
  let credential: ManagedIdentityCredential;

  try {
    // Create credential
    if (clientId) {
      credential = new ManagedIdentityCredential({ clientId });
      console.log(`Using user-assigned MI with client ID: ${clientId}`);
    } else {
      credential = new ManagedIdentityCredential();
      console.log('Using system-assigned MI');
    }

    // Create client
    const client = new SecretClient(vaultUrl, credential);

    // Attempt to get a token (this validates the credential works)
    const token = await credential.getToken('https://vault.azure.net/.default');
    console.log('Successfully obtained token');

    // Use the client
    const secret = await client.getSecret('my-secret');
    console.log(`Retrieved secret: ${secret.name}`);

  } catch (error: any) {
    // Handle specific error types
    if (error.code === 'ENOTFOUND') {
      console.error('Network error: Cannot reach Azure services');
      console.error('Check network connectivity and firewall rules');
    } else if (error.statusCode === 403) {
      console.error('Access denied: Managed Identity lacks required permissions');
      console.error('Ensure the MI has proper RBAC role assignments');
    } else if (error.message?.includes('ManagedIdentityCredential')) {
      console.error('Managed Identity not available');
      console.error('Ensure the resource has a managed identity assigned');
      console.error('Check environment variables: IDENTITY_ENDPOINT and IDENTITY_HEADER');
    } else if (error.statusCode === 400 && error.message?.includes('client_id')) {
      console.error('Invalid client ID for user-assigned managed identity');
      console.error(`Provided client ID: ${clientId}`);
    } else {
      console.error('Unexpected error:', error.message);
    }
    
    throw error;
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function managedIdentityWithRetry(
  vaultUrl: string,
  maxRetries: number = 3
): Promise<void> {
  const credential = new ManagedIdentityCredential();
  const client = new SecretClient(vaultUrl, credential);

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const secret = await client.getSecret('my-secret');
      console.log(`Retrieved secret on attempt ${attempt}: ${secret.name}`);
      return; // Success
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed: ${error.message}`);

      // Don't retry on authentication/authorization errors
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

// ============================================================================
// 5. CONFIGURATION AND BEST PRACTICES
// ============================================================================

/**
 * Configuration class for managing identity settings
 */
export class ManagedIdentityConfig {
  private readonly clientId?: string;
  private readonly resourceId?: string;
  private readonly useDefaultCredential: boolean;

  constructor(options?: {
    clientId?: string;
    resourceId?: string;
    useDefaultCredential?: boolean;
  }) {
    this.clientId = options?.clientId || process.env.AZURE_CLIENT_ID;
    this.resourceId = options?.resourceId;
    this.useDefaultCredential = options?.useDefaultCredential ?? true;
  }

  /**
   * Create the appropriate credential based on configuration
   */
  public createCredential(): DefaultAzureCredential | ManagedIdentityCredential {
    if (this.useDefaultCredential) {
      return new DefaultAzureCredential({
        managedIdentityClientId: this.clientId
      });
    }

    if (this.resourceId) {
      return new ManagedIdentityCredential({ resourceId: this.resourceId });
    }

    if (this.clientId) {
      return new ManagedIdentityCredential({ clientId: this.clientId });
    }

    return new ManagedIdentityCredential();
  }
}

/**
 * Example: Production-ready service class
 */
export class SecretService {
  private readonly client: SecretClient;

  constructor(vaultUrl: string, config: ManagedIdentityConfig) {
    const credential = config.createCredential();
    this.client = new SecretClient(vaultUrl, credential);
  }

  public async getSecret(secretName: string): Promise<string | undefined> {
    try {
      const secret = await this.client.getSecret(secretName);
      return secret.value;
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.warn(`Secret '${secretName}' not found`);
        return undefined;
      }
      throw error;
    }
  }

  public async setSecret(secretName: string, secretValue: string): Promise<void> {
    await this.client.setSecret(secretName, secretValue);
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Main function demonstrating various scenarios
 */
export async function main(): Promise<void> {
  const vaultUrl = 'https://my-keyvault.vault.azure.net';
  const storageUrl = 'https://mystorageaccount.blob.core.windows.net';

  // System-assigned MI (simplest)
  console.log('\n=== System-Assigned Managed Identity ===');
  await keyVaultWithSystemMI(vaultUrl);

  // User-assigned MI with client ID
  console.log('\n=== User-Assigned Managed Identity ===');
  const userAssignedClientId = '12345678-1234-1234-1234-123456789abc';
  await keyVaultWithUserAssignedMI(vaultUrl, userAssignedClientId);

  // DefaultAzureCredential (recommended for most scenarios)
  console.log('\n=== DefaultAzureCredential (with fallback) ===');
  await keyVaultWithDefaultCredential(vaultUrl);

  // Production-ready with error handling
  console.log('\n=== Production-Ready Example ===');
  const config = new ManagedIdentityConfig({
    useDefaultCredential: true
  });
  const secretService = new SecretService(vaultUrl, config);
  const secretValue = await secretService.getSecret('my-secret');
  console.log(`Secret value retrieved: ${secretValue ? '***' : 'not found'}`);
}
