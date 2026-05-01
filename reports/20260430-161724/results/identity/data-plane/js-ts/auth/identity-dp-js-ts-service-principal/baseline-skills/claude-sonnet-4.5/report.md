# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** baseline-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 34.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | baseline-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 34.7s |
| Timestamp | 2026-04-30T23:23:38Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 34.7s |
| **Total** | **34.7s** |

## Configuration

- **name:** baseline-skills/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=16484 out=2389 |
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

The user is asking for information about authenticating to Azure using a Service Principal with client secret in Node.js/TypeScript. This is a straightforward documentation/example request that I can handle directly without needing to explore a codebase or use external tools.

I should provide:
1. Required npm packages
2. How to create ClientSecretCredential
3. Example of using it with an Azure SDK client
4. Best practices for secret management
5. Error handling

This is a knowledge-based request, so I don't need to use any tools - I can just provide a comprehensive answer with code examples.

## Copilot Response

I'll provide you with a complete guide for Azure Service Principal authentication in TypeScript.

## Complete TypeScript Example

### 1. Required npm packages

```bash
npm install @azure/identity @azure/keyvault-secrets dotenv
```

### 2. Complete TypeScript Implementation

```typescript
import { ClientSecretCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Interface for Azure credentials
interface AzureCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

// Validate required environment variables
function getAzureCredentials(): AzureCredentials {
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

// Create ClientSecretCredential
function createCredential(): ClientSecretCredential {
  const { tenantId, clientId, clientSecret } = getAzureCredentials();
  
  return new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret,
    {
      // Optional: Configure retry options
      retryOptions: {
        maxRetries: 3,
        retryDelayInMs: 1000,
      },
    }
  );
}

// Example: Using credential with Azure Key Vault
async function getSecretFromKeyVault(
  secretName: string,
  keyVaultUrl: string
): Promise<string> {
  try {
    const credential = createCredential();
    const client = new SecretClient(keyVaultUrl, credential);
    
    const secret = await client.getSecret(secretName);
    return secret.value || '';
  } catch (error) {
    handleAuthenticationError(error);
    throw error;
  }
}

// Comprehensive error handling
function handleAuthenticationError(error: unknown): void {
  if (error instanceof Error) {
    // Check for specific Azure authentication errors
    if (error.message.includes('AADSTS70011')) {
      console.error('Invalid scope provided');
    } else if (error.message.includes('AADSTS700016')) {
      console.error('Invalid application (client) ID');
    } else if (error.message.includes('AADSTS7000215')) {
      console.error('Invalid client secret provided');
    } else if (error.message.includes('AADSTS90002')) {
      console.error('Invalid tenant ID');
    } else if (error.message.includes('AADSTS50034')) {
      console.error('Service principal does not exist in tenant');
    } else if (error.message.includes('unauthorized_client')) {
      console.error('Service principal not authorized for this resource');
    } else {
      console.error('Authentication error:', error.message);
    }
  } else {
    console.error('Unknown authentication error:', error);
  }
}

// Example: Test authentication
async function testAuthentication(): Promise<boolean> {
  try {
    const credential = createCredential();
    
    // Attempt to get a token (this validates the credentials)
    const token = await credential.getToken('https://management.azure.com/.default');
    
    if (token?.token) {
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

// Example usage
async function main() {
  try {
    // Test authentication
    const isAuthenticated = await testAuthentication();
    
    if (!isAuthenticated) {
      process.exit(1);
    }
    
    // Use with Azure service (example: Key Vault)
    const keyVaultUrl = process.env.KEY_VAULT_URL || 'https://your-vault.vault.azure.net';
    const secretValue = await getSecretFromKeyVault('my-secret', keyVaultUrl);
    console.log('Secret retrieved successfully');
    
  } catch (error) {
    console.error('Application error:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { createCredential, getSecretFromKeyVault, testAuthentication };

// Run if executed directly
if (require.main === module) {
  main();
}
```

### 3. Environment Configuration (.env)

```env
# Azure Service Principal Credentials
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here

# Optional: Azure resources
KEY_VAULT_URL=https://your-keyvault.vault.azure.net
```

### 4. Best Practices for Secret Management

```typescript
// secrets-manager.ts
import { SecretClient } from '@azure/keyvault-secrets';
import { createCredential } from './auth';

/**
 * Best Practice: Store secrets in Azure Key Vault
 * Load them at runtime, never commit to source control
 */
export class SecretsManager {
  private client: SecretClient;
  private cache: Map<string, { value: string; expires: number }> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(keyVaultUrl: string) {
    const credential = createCredential();
    this.client = new SecretClient(keyVaultUrl, credential);
  }

  async getSecret(name: string, useCache = true): Promise<string> {
    if (useCache) {
      const cached = this.cache.get(name);
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }
    }

    const secret = await this.client.getSecret(name);
    const value = secret.value || '';

    if (useCache) {
      this.cache.set(name, {
        value,
        expires: Date.now() + this.CACHE_TTL,
      });
    }

    return value;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
```

### 5. Additional Best Practices

```typescript
// best-practices.ts

/**
 * 1. Use Azure Managed Identity when possible (in Azure services)
 * 2. Rotate secrets regularly (every 90 days recommended)
 * 3. Use different service principals per environment
 * 4. Apply principle of least privilege (minimal RBAC permissions)
 * 5. Never log credentials
 */

// Example: Using DefaultAzureCredential (tries multiple auth methods)
import { DefaultAzureCredential } from '@azure/identity';

export function createFlexibleCredential() {
  // Tries: Environment variables → Managed Identity → Azure CLI → etc.
  return new DefaultAzureCredential();
}

// Example: Credential with custom authority host (for sovereign clouds)
import { ClientSecretCredential, AzureAuthorityHosts } from '@azure/identity';

export function createGovernmentCloudCredential(
  tenantId: string,
  clientId: string,
  clientSecret: string
) {
  return new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret,
    {
      authorityHost: AzureAuthorityHosts.AzureGovernment, // For US Government cloud
    }
  );
}
```

### 6. TypeScript Configuration (tsconfig.json)

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

### Key Points:

- **Never commit secrets** to source control (use `.gitignore` for `.env`)
- **Use Azure Key Vault** for production secret storage
- **Implement retry logic** for transient failures
- **Monitor token expiration** and refresh automatically
- **Use Managed Identity** when running in Azure (App Service, Functions, VMs)
- **Rotate secrets regularly** as part of security hygiene

The `@azure/identity` library handles token caching and refresh automatically!

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config baseline-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
