/**
 * Azure Service Principal Authentication with Client Secret
 * Complete TypeScript Example
 */

import { ClientSecretCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { BlobServiceClient } from '@azure/storage-blob';

// ============================================================================
// 1. REQUIRED NPM PACKAGES
// ============================================================================
// npm install @azure/identity
// npm install @azure/keyvault-secrets  (example Azure SDK client)
// npm install @azure/storage-blob      (example Azure SDK client)
// npm install dotenv                   (for environment variables)

// ============================================================================
// 2. BEST PRACTICES FOR SECRET MANAGEMENT
// ============================================================================

/**
 * NEVER hardcode credentials in source code!
 * Use one of these approaches (in order of preference):
 * 
 * 1. Azure Key Vault (production)
 * 2. Environment variables (local dev, CI/CD)
 * 3. .env files (local dev only, add to .gitignore)
 * 4. Azure Managed Identity (when running in Azure)
 */

// Load environment variables from .env file (local dev only)
import dotenv from 'dotenv';
dotenv.config();

// ============================================================================
// 3. CREATING ClientSecretCredential
// ============================================================================

interface AzureCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Get credentials from environment variables
 */
function getCredentialsFromEnv(): AzureCredentials {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      'Missing required environment variables: ' +
      'AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET'
    );
  }

  return { tenantId, clientId, clientSecret };
}

/**
 * Create ClientSecretCredential
 */
function createCredential(): ClientSecretCredential {
  const { tenantId, clientId, clientSecret } = getCredentialsFromEnv();

  // Basic credential creation
  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
  );

  return credential;
}

/**
 * Create credential with advanced options
 */
function createCredentialWithOptions(): ClientSecretCredential {
  const { tenantId, clientId, clientSecret } = getCredentialsFromEnv();

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret,
    {
      // Authority host (use different clouds)
      authorityHost: 'https://login.microsoftonline.com', // Default (Azure Public Cloud)
      // authorityHost: 'https://login.microsoftonline.us', // Azure US Government
      // authorityHost: 'https://login.chinacloudapi.cn', // Azure China

      // Retry options
      retryOptions: {
        maxRetries: 3,
        retryDelayInMs: 1000,
        maxRetryDelayInMs: 8000,
      },

      // Logging (useful for debugging)
      loggingOptions: {
        allowLoggingAccountIdentifiers: true,
        enableUnsafeSupportLogging: false,
      },
    }
  );

  return credential;
}

// ============================================================================
// 4. USING WITH AZURE SDK CLIENTS
// ============================================================================

/**
 * Example 1: Azure Key Vault Secrets Client
 */
async function useWithKeyVault(credential: ClientSecretCredential) {
  const vaultUrl = process.env.AZURE_KEYVAULT_URL;
  if (!vaultUrl) {
    throw new Error('Missing AZURE_KEYVAULT_URL environment variable');
  }

  const client = new SecretClient(vaultUrl, credential);

  // Get a secret
  const secret = await client.getSecret('my-secret-name');
  console.log('Secret retrieved:', secret.name);
  
  return secret.value;
}

/**
 * Example 2: Azure Blob Storage Client
 */
async function useWithBlobStorage(credential: ClientSecretCredential) {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  if (!accountName) {
    throw new Error('Missing AZURE_STORAGE_ACCOUNT_NAME environment variable');
  }

  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );

  // List containers
  const containers: string[] = [];
  for await (const container of blobServiceClient.listContainers()) {
    containers.push(container.name);
  }
  
  return containers;
}

// ============================================================================
// 5. ERROR HANDLING FOR AUTHENTICATION FAILURES
// ============================================================================

/**
 * Custom error types for better error handling
 */
class AuthenticationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Comprehensive error handling wrapper
 */
async function authenticateWithErrorHandling(): Promise<ClientSecretCredential> {
  try {
    const { tenantId, clientId, clientSecret } = getCredentialsFromEnv();

    // Validate credentials format
    if (!tenantId.match(/^[a-f0-9-]{36}$/i)) {
      throw new ConfigurationError('Invalid tenant ID format (expected GUID)');
    }

    if (!clientId.match(/^[a-f0-9-]{36}$/i)) {
      throw new ConfigurationError('Invalid client ID format (expected GUID)');
    }

    if (clientSecret.length < 10) {
      throw new ConfigurationError('Client secret appears to be invalid');
    }

    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );

    // Test the credential by getting a token
    await testCredential(credential);

    return credential;

  } catch (error: any) {
    // Handle specific error types
    if (error.name === 'ConfigurationError') {
      throw error;
    }

    if (error.code === 'INVALID_CLIENT') {
      throw new AuthenticationError(
        'Invalid client ID or client secret. Please verify your credentials.',
        error
      );
    }

    if (error.code === 'UNAUTHORIZED_CLIENT') {
      throw new AuthenticationError(
        'Service Principal not authorized. Check Azure AD app registration permissions.',
        error
      );
    }

    if (error.code === 'INVALID_TENANT') {
      throw new AuthenticationError(
        'Invalid tenant ID. Please verify your Azure tenant.',
        error
      );
    }

    if (error.message?.includes('getaddrinfo')) {
      throw new AuthenticationError(
        'Network error: Cannot reach Azure AD. Check internet connectivity.',
        error
      );
    }

    // Generic authentication error
    throw new AuthenticationError(
      `Authentication failed: ${error.message}`,
      error
    );
  }
}

/**
 * Test credential by attempting to get a token
 */
async function testCredential(credential: ClientSecretCredential): Promise<void> {
  try {
    // Request a token for Azure Resource Manager
    // This validates the credential without accessing any specific resource
    await credential.getToken('https://management.azure.com/.default');
  } catch (error: any) {
    throw new AuthenticationError(
      'Failed to obtain access token: ' + error.message,
      error
    );
  }
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on configuration errors or invalid credentials
      if (
        error.name === 'ConfigurationError' ||
        error.code === 'INVALID_CLIENT' ||
        error.code === 'INVALID_TENANT'
      ) {
        throw error;
      }

      // Calculate exponential backoff delay
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(
          `Attempt ${attempt + 1} failed: ${error.message}. ` +
          `Retrying in ${delay}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// ============================================================================
// COMPLETE USAGE EXAMPLE
// ============================================================================

async function main() {
  try {
    console.log('Authenticating to Azure...');

    // Create credential with error handling and retry logic
    const credential = await withRetry(
      () => authenticateWithErrorHandling(),
      3,
      1000
    );

    console.log('✓ Authentication successful!');

    // Use with Azure Key Vault
    console.log('\nAccessing Key Vault...');
    try {
      const secretValue = await useWithKeyVault(credential);
      console.log('✓ Retrieved secret from Key Vault');
    } catch (error: any) {
      console.error('✗ Key Vault access failed:', error.message);
    }

    // Use with Azure Blob Storage
    console.log('\nAccessing Blob Storage...');
    try {
      const containers = await useWithBlobStorage(credential);
      console.log(`✓ Found ${containers.length} containers`);
    } catch (error: any) {
      console.error('✗ Blob Storage access failed:', error.message);
    }

  } catch (error: any) {
    if (error.name === 'ConfigurationError') {
      console.error('❌ Configuration Error:', error.message);
      console.error('\nPlease set the following environment variables:');
      console.error('  - AZURE_TENANT_ID');
      console.error('  - AZURE_CLIENT_ID');
      console.error('  - AZURE_CLIENT_SECRET');
    } else if (error.name === 'AuthenticationError') {
      console.error('❌ Authentication Error:', error.message);
      if (error.cause) {
        console.error('Underlying error:', error.cause.message);
      }
    } else {
      console.error('❌ Unexpected Error:', error.message);
    }
    process.exit(1);
  }
}

// ============================================================================
// BEST PRACTICES SUMMARY
// ============================================================================

/**
 * SECURITY BEST PRACTICES:
 * 
 * 1. Never commit secrets to source control
 *    - Add .env to .gitignore
 *    - Use Azure Key Vault for production
 *    - Rotate secrets regularly
 * 
 * 2. Use Managed Identity when possible
 *    - Preferred for Azure-hosted apps (App Service, VMs, Functions)
 *    - No secrets to manage
 * 
 * 3. Limit Service Principal permissions
 *    - Follow principle of least privilege
 *    - Use Azure RBAC for fine-grained access
 *    - Assign only required scopes
 * 
 * 4. Environment-specific credentials
 *    - Separate Service Principals for dev/staging/prod
 *    - Use different Azure AD tenants if needed
 * 
 * 5. Monitor and audit
 *    - Enable Azure AD sign-in logs
 *    - Set up alerts for failed authentications
 *    - Review Service Principal usage regularly
 * 
 * 6. Secret rotation
 *    - Rotate client secrets every 90 days
 *    - Use certificate-based auth for enhanced security
 *    - Implement graceful secret rotation (overlap period)
 */

// Run the example
if (require.main === module) {
  main();
}

// Export for use as a module
export {
  createCredential,
  createCredentialWithOptions,
  authenticateWithErrorHandling,
  useWithKeyVault,
  useWithBlobStorage,
  withRetry,
  AuthenticationError,
  ConfigurationError,
};
