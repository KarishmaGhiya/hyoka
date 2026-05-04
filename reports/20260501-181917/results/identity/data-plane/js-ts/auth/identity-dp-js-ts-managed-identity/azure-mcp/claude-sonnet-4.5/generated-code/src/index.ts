import {
  ManagedIdentityCredential,
  ChainedTokenCredential,
  AzureCliCredential,
  CredentialUnavailableError,
  TokenCredential
} from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';

/**
 * Example 1: Create a system-assigned Managed Identity credential
 */
function createSystemAssignedCredential(): ManagedIdentityCredential {
  console.log('Creating system-assigned Managed Identity credential...');
  return new ManagedIdentityCredential();
}

/**
 * Example 2: Create a user-assigned Managed Identity credential with client ID
 */
function createUserAssignedCredential(clientId: string): ManagedIdentityCredential {
  console.log(`Creating user-assigned Managed Identity credential with client ID: ${clientId}...`);
  return new ManagedIdentityCredential({ clientId });
}

/**
 * Example 3: Create a ChainedTokenCredential that falls back to Azure CLI for local development
 */
function createChainedCredential(userAssignedClientId?: string): ChainedTokenCredential {
  console.log('Creating ChainedTokenCredential with fallback to Azure CLI...');
  
  const credentials: TokenCredential[] = [];
  
  // Try system-assigned managed identity first
  credentials.push(new ManagedIdentityCredential());
  
  // If user-assigned client ID is provided, try that too
  if (userAssignedClientId) {
    credentials.push(new ManagedIdentityCredential({ clientId: userAssignedClientId }));
  }
  
  // Fall back to Azure CLI credential for local development
  credentials.push(new AzureCliCredential());
  
  return new ChainedTokenCredential(...credentials);
}

/**
 * Example 4: Use the credential with an Azure SDK client to perform an operation
 */
async function listBlobContainers(
  storageAccountName: string,
  credential: TokenCredential
): Promise<void> {
  console.log(`\nConnecting to storage account: ${storageAccountName}...`);
  
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential
  );

  console.log('Listing blob containers:');
  
  try {
    let containerCount = 0;
    for await (const container of blobServiceClient.listContainers()) {
      console.log(`  - ${container.name}`);
      containerCount++;
    }
    
    if (containerCount === 0) {
      console.log('  (No containers found)');
    } else {
      console.log(`\nTotal containers: ${containerCount}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error listing containers: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Example 5: Handle CredentialUnavailableError when not running in Azure
 */
async function authenticateWithErrorHandling(
  storageAccountName: string,
  userAssignedClientId?: string
): Promise<void> {
  console.log('\n=== Attempting authentication with error handling ===\n');
  
  try {
    // Try system-assigned managed identity
    console.log('Attempt 1: System-assigned Managed Identity');
    const systemCredential = createSystemAssignedCredential();
    
    try {
      await listBlobContainers(storageAccountName, systemCredential);
      console.log('✓ Authentication successful with system-assigned managed identity');
      return;
    } catch (error) {
      if (error instanceof CredentialUnavailableError) {
        console.log('⚠ System-assigned managed identity not available');
      } else {
        throw error;
      }
    }
    
    // Try user-assigned managed identity if client ID provided
    if (userAssignedClientId) {
      console.log('\nAttempt 2: User-assigned Managed Identity');
      const userCredential = createUserAssignedCredential(userAssignedClientId);
      
      try {
        await listBlobContainers(storageAccountName, userCredential);
        console.log('✓ Authentication successful with user-assigned managed identity');
        return;
      } catch (error) {
        if (error instanceof CredentialUnavailableError) {
          console.log('⚠ User-assigned managed identity not available');
        } else {
          throw error;
        }
      }
    }
    
    // Fall back to Azure CLI credential
    console.log('\nAttempt 3: Azure CLI credential (fallback for local development)');
    const cliCredential = new AzureCliCredential();
    
    try {
      await listBlobContainers(storageAccountName, cliCredential);
      console.log('✓ Authentication successful with Azure CLI credential');
      return;
    } catch (error) {
      if (error instanceof CredentialUnavailableError) {
        console.log('⚠ Azure CLI credential not available');
        console.log('\nTo use Azure CLI authentication locally:');
        console.log('  1. Install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli');
        console.log('  2. Run: az login');
      } else {
        throw error;
      }
    }
    
    throw new Error('All authentication methods failed');
    
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Authentication failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Demonstrate using ChainedTokenCredential for automatic fallback
 */
async function demonstrateChainedCredential(
  storageAccountName: string,
  userAssignedClientId?: string
): Promise<void> {
  console.log('\n=== Using ChainedTokenCredential (automatic fallback) ===\n');
  
  try {
    const credential = createChainedCredential(userAssignedClientId);
    await listBlobContainers(storageAccountName, credential);
    console.log('✓ Authentication successful with ChainedTokenCredential');
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      console.error('❌ All credentials in the chain are unavailable');
      console.log('\nMake sure you are either:');
      console.log('  1. Running in an Azure environment with Managed Identity enabled, OR');
      console.log('  2. Logged in with Azure CLI (run: az login)');
    } else if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Azure Managed Identity Authentication Demo');
  console.log('='.repeat(60));
  
  // Configuration (replace with your values)
  const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'mystorageaccount';
  const userAssignedClientId = process.env.AZURE_CLIENT_ID; // Optional
  
  console.log(`\nConfiguration:`);
  console.log(`  Storage Account: ${storageAccountName}`);
  console.log(`  User-assigned Client ID: ${userAssignedClientId || '(not provided)'}`);
  
  // Demonstrate manual error handling
  try {
    await authenticateWithErrorHandling(storageAccountName, userAssignedClientId);
  } catch (error) {
    console.log('\nManual authentication handling completed with errors.');
  }
  
  // Demonstrate ChainedTokenCredential
  try {
    await demonstrateChainedCredential(storageAccountName, userAssignedClientId);
  } catch (error) {
    console.log('\nChainedTokenCredential demonstration completed with errors.');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Demo completed');
  console.log('='.repeat(60));
}

// Run the demo
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  createSystemAssignedCredential,
  createUserAssignedCredential,
  createChainedCredential,
  listBlobContainers,
  authenticateWithErrorHandling,
  demonstrateChainedCredential
};
