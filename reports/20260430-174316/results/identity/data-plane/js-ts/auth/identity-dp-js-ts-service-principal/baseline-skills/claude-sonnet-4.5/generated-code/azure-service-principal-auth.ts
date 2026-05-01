import { ClientSecretCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Azure Service Principal configuration
 */
interface AzureServicePrincipalConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Load Service Principal credentials from environment variables
 * Best practice: Never hardcode credentials
 */
function loadCredentialsFromEnvironment(): AzureServicePrincipalConfig {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      'Missing required environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET'
    );
  }

  return { tenantId, clientId, clientSecret };
}

/**
 * Create a ClientSecretCredential instance
 */
function createCredential(config: AzureServicePrincipalConfig): ClientSecretCredential {
  return new ClientSecretCredential(
    config.tenantId,
    config.clientId,
    config.clientSecret,
    {
      // Optional: Configure additional options
      authorityHost: 'https://login.microsoftonline.com', // Default, can use AzureAuthorityHosts
      // Retry policy configuration
      retryOptions: {
        maxRetries: 3,
        maxRetryDelayInMs: 60000,
        retryDelayInMs: 1000,
      },
    }
  );
}

/**
 * Example: Using the credential with Azure Key Vault
 */
async function accessKeyVaultSecrets(
  credential: ClientSecretCredential,
  vaultUrl: string
): Promise<void> {
  try {
    // Create Azure SDK client with the credential
    const client = new SecretClient(vaultUrl, credential);

    // Example operation: List secrets
    console.log('Listing secrets from Key Vault...');
    for await (const secretProperties of client.listPropertiesOfSecrets()) {
      console.log(`- ${secretProperties.name}`);
    }

    // Example: Get a specific secret
    // const secret = await client.getSecret('my-secret-name');
    // console.log('Secret value:', secret.value);
  } catch (error) {
    handleAuthenticationError(error);
  }
}

/**
 * Error handling for authentication failures
 */
function handleAuthenticationError(error: unknown): void {
  if (error instanceof Error) {
    // Check for specific authentication errors
    if (error.name === 'AuthenticationError') {
      console.error('Authentication failed:', error.message);
      console.error('Please verify:');
      console.error('1. Tenant ID, Client ID, and Client Secret are correct');
      console.error('2. Service Principal has appropriate permissions');
      console.error('3. Service Principal is not expired or disabled');
    } else if (error.message.includes('AADSTS')) {
      // Azure AD error codes
      console.error('Azure AD Authentication Error:', error.message);
      
      // Common error codes:
      // AADSTS7000215: Invalid client secret
      // AADSTS700016: Application not found
      // AADSTS50034: User account not found in tenant
      if (error.message.includes('AADSTS7000215')) {
        console.error('The client secret is invalid or expired. Generate a new secret.');
      } else if (error.message.includes('AADSTS700016')) {
        console.error('Application (Client ID) not found in the tenant.');
      }
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.error('Network error: Unable to reach Azure services');
      console.error('Check your internet connection and firewall settings');
    } else if (error.message.includes('Forbidden')) {
      console.error('Authorization error: Service Principal lacks required permissions');
      console.error('Grant appropriate RBAC roles or access policies');
    } else {
      console.error('Unexpected error:', error.message);
    }
    
    // Log full error for debugging (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', error);
    }
  } else {
    console.error('Unknown error occurred:', error);
  }
  
  throw error; // Re-throw for upstream handling
}

/**
 * Test credential validity by attempting to get a token
 */
async function testCredential(credential: ClientSecretCredential): Promise<boolean> {
  try {
    // Attempt to get a token for Azure Management API
    const token = await credential.getToken('https://management.azure.com/.default');
    
    if (token && token.token) {
      console.log('✓ Authentication successful');
      console.log(`Token expires at: ${new Date(token.expiresOnTimestamp)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('✗ Authentication failed');
    handleAuthenticationError(error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    console.log('=== Azure Service Principal Authentication Example ===\n');

    // Step 1: Load credentials from environment
    console.log('Loading credentials from environment variables...');
    const config = loadCredentialsFromEnvironment();
    console.log(`Tenant ID: ${config.tenantId}`);
    console.log(`Client ID: ${config.clientId}`);
    console.log(`Client Secret: ${'*'.repeat(config.clientSecret.length)}\n`);

    // Step 2: Create credential
    console.log('Creating ClientSecretCredential...');
    const credential = createCredential(config);
    console.log('✓ Credential created\n');

    // Step 3: Test authentication
    console.log('Testing authentication...');
    await testCredential(credential);
    console.log();

    // Step 4: Use credential with an Azure SDK client
    const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;
    if (keyVaultUrl) {
      console.log('Accessing Key Vault...');
      await accessKeyVaultSecrets(credential, keyVaultUrl);
    } else {
      console.log('ℹ AZURE_KEYVAULT_URL not set, skipping Key Vault example');
    }

    console.log('\n✓ All operations completed successfully');
  } catch (error) {
    console.error('\n✗ Application failed');
    process.exit(1);
  }
}

// Export functions for reuse
export {
  AzureServicePrincipalConfig,
  createCredential,
  loadCredentialsFromEnvironment,
  handleAuthenticationError,
  testCredential,
};

// Run if executed directly
if (require.main === module) {
  main();
}
