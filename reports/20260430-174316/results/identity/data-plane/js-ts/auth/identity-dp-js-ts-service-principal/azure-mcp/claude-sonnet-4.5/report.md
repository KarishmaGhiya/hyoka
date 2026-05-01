# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** azure-mcp/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 39.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | azure-mcp/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 39.7s |
| Timestamp | 2026-05-01T00:48:37Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 39.6s |
| **Total** | **39.7s** |

## Configuration

- **model:** claude-sonnet-4.5
- **name:** azure-mcp/claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=35062 out=2507 |
| Turn Count | 1 |

## Error

```
0 files generated — agent did not create any files
```

## Prompt Sent

```
Show me how to
authenticate to Azure using a Service Principal with client secret. I need:
1. Required npm packages
2. How to create a ClientSecretCredential with tenant ID, client ID, and secret
3. Using it with an Azure SDK client
4. Best practices for secret management in Node.js
5. Error handling for authentication failures

Provide a complete TypeScript example.
```

## Copilot Reasoning

The user is asking for guidance on authenticating to Azure using a Service Principal with client secret in Node.js/TypeScript. They want:
1. Required npm packages
2. How to create ClientSecretCredential
3. Using it with Azure SDK clients
4. Best practices for secret management
5. Error handling

This is a straightforward documentation/example request. I should provide a complete, working TypeScript example with best practices. I don't need to search any codebase or create files unless requested. I'll provide a comprehensive code example with explanations.

Let me structure this as a clear, educational response with code examples.

## Copilot Response

I'll show you how to authenticate to Azure using a Service Principal with client secret in TypeScript.

## 1. Required npm packages

```bash
npm install @azure/identity @azure/storage-blob dotenv
npm install -D @types/node typescript
```

## 2. Complete TypeScript Example

```typescript
import { ClientSecretCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration interface
interface AzureConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  storageAccountName?: string;
}

// Validate required environment variables
function getAzureConfig(): AzureConfig {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      'Missing required Azure credentials. Please set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET'
    );
  }

  return {
    tenantId,
    clientId,
    clientSecret,
    storageAccountName,
  };
}

// Create credential with error handling
function createCredential(config: AzureConfig): ClientSecretCredential {
  try {
    const credential = new ClientSecretCredential(
      config.tenantId,
      config.clientId,
      config.clientSecret,
      {
        // Optional: Configure additional options
        authorityHost: 'https://login.microsoftonline.com', // Default
        // Retry options
        retryOptions: {
          maxRetries: 3,
          retryDelayInMs: 1000,
        },
      }
    );

    return credential;
  } catch (error) {
    throw new Error(`Failed to create credential: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Example: Use credential with Azure Storage
async function listStorageContainers(
  credential: ClientSecretCredential,
  accountName: string
): Promise<void> {
  try {
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );

    console.log('Listing containers...');
    const containers = blobServiceClient.listContainers();
    
    for await (const container of containers) {
      console.log(`- ${container.name}`);
    }
  } catch (error) {
    handleAzureError(error);
  }
}

// Comprehensive error handling
function handleAzureError(error: unknown): void {
  if (error instanceof Error) {
    // Check for specific authentication errors
    if (error.message.includes('AADSTS')) {
      // Azure AD specific error codes
      if (error.message.includes('AADSTS700016')) {
        console.error('❌ Invalid client application (client ID not found)');
      } else if (error.message.includes('AADSTS7000215')) {
        console.error('❌ Invalid client secret provided');
      } else if (error.message.includes('AADSTS90002')) {
        console.error('❌ Invalid tenant ID');
      } else if (error.message.includes('AADSTS50034')) {
        console.error('❌ User or service principal does not exist in tenant');
      } else {
        console.error(`❌ Azure AD authentication error: ${error.message}`);
      }
    } else if (error.message.includes('403')) {
      console.error('❌ Forbidden: Service principal lacks required permissions');
    } else if (error.message.includes('401')) {
      console.error('❌ Unauthorized: Authentication failed or token expired');
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Log full error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', error);
    }
  } else {
    console.error('❌ Unknown error occurred:', error);
  }
}

// Test credential validity
async function testCredential(credential: ClientSecretCredential): Promise<boolean> {
  try {
    // Attempt to get a token for Azure Resource Manager
    const token = await credential.getToken('https://management.azure.com/.default');
    
    if (token) {
      console.log('✅ Authentication successful');
      console.log(`Token expires: ${new Date(token.expiresOnTimestamp).toISOString()}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Authentication test failed');
    handleAzureError(error);
    return false;
  }
}

// Main function
async function main(): Promise<void> {
  try {
    console.log('🔐 Azure Service Principal Authentication Example\n');

    // 1. Load configuration
    const config = getAzureConfig();
    console.log(`Tenant ID: ${config.tenantId}`);
    console.log(`Client ID: ${config.clientId}`);
    console.log(`Client Secret: ${'*'.repeat(8)}\n`);

    // 2. Create credential
    const credential = createCredential(config);

    // 3. Test authentication
    const isAuthenticated = await testCredential(credential);
    
    if (!isAuthenticated) {
      process.exit(1);
    }

    // 4. Use credential with Azure service
    if (config.storageAccountName) {
      await listStorageContainers(credential, config.storageAccountName);
    }

    console.log('\n✅ All operations completed successfully');
  } catch (error) {
    handleAzureError(error);
    process.exit(1);
  }
}

// Run the application
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { createCredential, getAzureConfig, testCredential };
```

## 3. Environment Variables (.env file)

```env
# Azure Service Principal Credentials
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Optional: Azure resources
AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount

# Environment
NODE_ENV=development
```

## 4. Best Practices for Secret Management

### ✅ DO:
- **Use environment variables** - Never hardcode secrets
- **Use Azure Key Vault** for production:
  ```typescript
  import { SecretClient } from '@azure/keyvault-secrets';
  import { DefaultAzureCredential } from '@azure/identity';
  
  const keyVaultName = process.env.KEY_VAULT_NAME;
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(`https://${keyVaultName}.vault.azure.net`, credential);
  
  const secret = await client.getSecret('ClientSecret');
  ```
- **Use Managed Identity** when running on Azure (no secrets needed)
- **Rotate secrets regularly** (Azure allows 2 secrets per SP)
- **Add .env to .gitignore**
- **Use different service principals per environment**

### ❌ DON'T:
- Commit secrets to version control
- Log secrets (even partially)
- Share secrets via email/chat
- Use the same credentials across environments

## 5. Additional Azure SDK Examples

```typescript
// Example with Azure Resource Manager
import { ResourceManagementClient } from '@azure/arm-resources';

async function listResourceGroups(credential: ClientSecretCredential, subscriptionId: string) {
  const client = new ResourceManagementClient(credential, subscriptionId);
  
  for await (const rg of client.resourceGroups.list()) {
    console.log(`Resource Group: ${rg.name} (${rg.location})`);
  }
}

// Example with Cosmos DB
import { CosmosClient } from '@azure/cosmos';

async function connectToCosmosDB(credential: ClientSecretCredential, endpoint: string) {
  const client = new CosmosClient({ endpoint, aadCredentials: credential });
  const { databases } = await client.databases.readAll().fetchAll();
  console.log(`Found ${databases.length} databases`);
}
```

## 6. TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

This example covers authentication setup, error handling, best practices, and is ready to use in production with proper secret management!

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config azure-mcp/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
