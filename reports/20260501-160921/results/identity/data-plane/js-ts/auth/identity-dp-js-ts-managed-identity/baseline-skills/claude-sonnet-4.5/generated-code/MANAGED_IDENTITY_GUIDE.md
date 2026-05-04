# Managed Identity Authentication Guide for Azure SDK (Node.js/TypeScript)

## Overview

Managed Identity provides Azure services with an automatically managed identity in Azure Active Directory (now Microsoft Entra ID). This eliminates the need to manage credentials in your code.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System-Assigned vs User-Assigned Identity](#system-assigned-vs-user-assigned-identity)
3. [Installation](#installation)
4. [Creating Credentials](#creating-credentials)
5. [Local Development Fallback](#local-development-fallback)
6. [Common Pitfalls](#common-pitfalls)
7. [Best Practices](#best-practices)

---

## Prerequisites

```bash
npm install @azure/identity
npm install @azure/keyvault-secrets  # Example: Key Vault SDK
npm install @azure/storage-blob      # Example: Storage SDK
```

---

## System-Assigned vs User-Assigned Identity

### System-Assigned Managed Identity

**Characteristics:**
- ✅ Automatically created and tied to a single Azure resource
- ✅ Lifecycle managed with the resource
- ✅ Automatically deleted when resource is deleted
- ✅ Simplest to configure
- ❌ Cannot be shared across resources
- ❌ One-to-one relationship with resource

**Use Cases:**
- Single application deployment
- Simple scenarios with one resource accessing other Azure services
- When you don't need identity reuse

**Code Example:**
```typescript
import { ManagedIdentityCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

// No configuration needed!
const credential = new ManagedIdentityCredential();
const client = new SecretClient('https://my-vault.vault.azure.net', credential);
```

### User-Assigned Managed Identity

**Characteristics:**
- ✅ Independent lifecycle from resources
- ✅ Can be assigned to multiple resources
- ✅ Centralized identity management
- ✅ Reusable across different services
- ❌ Requires explicit creation and assignment
- ❌ Must specify client ID or resource ID

**Use Cases:**
- Multiple applications/resources sharing the same identity
- Complex microservices architectures
- When you need fine-grained control over identity lifecycle

**Code Example:**
```typescript
import { ManagedIdentityCredential } from '@azure/identity';

// Specify the client ID
const credential = new ManagedIdentityCredential({
  clientId: '12345678-1234-1234-1234-123456789abc'
});

// OR use resource ID
const credential = new ManagedIdentityCredential({
  resourceId: '/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}'
});
```

---

## Creating Credentials

### 1. System-Assigned Managed Identity

```typescript
import { ManagedIdentityCredential } from '@azure/identity';

// Simplest form - automatically uses system-assigned identity
const credential = new ManagedIdentityCredential();
```

### 2. User-Assigned Managed Identity (by Client ID)

```typescript
import { ManagedIdentityCredential } from '@azure/identity';

const credential = new ManagedIdentityCredential({
  clientId: process.env.AZURE_CLIENT_ID || '12345678-1234-1234-1234-123456789abc'
});
```

### 3. User-Assigned Managed Identity (by Resource ID)

```typescript
import { ManagedIdentityCredential } from '@azure/identity';

const credential = new ManagedIdentityCredential({
  resourceId: '/subscriptions/sub-id/resourceGroups/rg-name/providers/Microsoft.ManagedIdentity/userAssignedIdentities/identity-name'
});
```

### 4. Using with Azure SDK Clients

```typescript
import { ManagedIdentityCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { BlobServiceClient } from '@azure/storage-blob';
import { QueueServiceClient } from '@azure/storage-queue';

const credential = new ManagedIdentityCredential();

// Key Vault
const secretClient = new SecretClient(
  'https://my-vault.vault.azure.net',
  credential
);

// Blob Storage
const blobServiceClient = new BlobServiceClient(
  'https://mystorageaccount.blob.core.windows.net',
  credential
);

// Queue Storage
const queueServiceClient = new QueueServiceClient(
  'https://mystorageaccount.queue.core.windows.net',
  credential
);
```

---

## Local Development Fallback

When developing locally, Managed Identity is not available. Use these strategies:

### Strategy 1: DefaultAzureCredential (⭐ Recommended)

Automatically tries multiple authentication methods in order:

```typescript
import { DefaultAzureCredential } from '@azure/identity';

// Works in both Azure and locally!
const credential = new DefaultAzureCredential({
  // Optional: specify user-assigned MI client ID for Azure environments
  managedIdentityClientId: process.env.AZURE_CLIENT_ID
});

// Authentication priority:
// 1. Environment variables (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID)
// 2. Workload Identity
// 3. Managed Identity
// 4. Azure CLI (az login)
// 5. Azure PowerShell
// 6. Azure Developer CLI
```

**Local Development:**
```bash
# Login with Azure CLI
az login

# Your code will automatically use Azure CLI credentials locally
# and Managed Identity in Azure!
```

### Strategy 2: ChainedTokenCredential (Explicit Control)

```typescript
import { 
  ChainedTokenCredential,
  EnvironmentCredential,
  ManagedIdentityCredential,
  AzureCliCredential
} from '@azure/identity';

const credential = new ChainedTokenCredential(
  new EnvironmentCredential(),      // First: try env vars
  new ManagedIdentityCredential(),  // Second: try managed identity
  new AzureCliCredential()          // Third: try Azure CLI
);
```

### Strategy 3: Environment-Based Selection

```typescript
import { 
  ManagedIdentityCredential, 
  AzureCliCredential 
} from '@azure/identity';

function createCredential() {
  // Check if running in Azure
  const isAzure = process.env.IDENTITY_ENDPOINT !== undefined ||
                  process.env.AZURE_ENVIRONMENT === 'production';

  if (isAzure) {
    console.log('Using Managed Identity');
    return new ManagedIdentityCredential({
      clientId: process.env.AZURE_CLIENT_ID
    });
  } else {
    console.log('Using Azure CLI for local development');
    return new AzureCliCredential();
  }
}
```

---

## Common Pitfalls

### 1. ❌ Managed Identity Not Enabled

**Error:**
```
ManagedIdentityCredential authentication failed: IDENTITY_ENDPOINT environment variable not found
```

**Solution:**
- Ensure managed identity is enabled on your Azure resource
- For App Service/Function Apps: Settings → Identity → System assigned → On
- For VM: Identity → System assigned → Status → On

### 2. ❌ Missing RBAC Permissions

**Error:**
```
Status: 403
Message: The user, group or application does not have secrets get permission
```

**Solution:**
```bash
# Grant Key Vault access
az keyvault set-policy --name my-keyvault \
  --object-id <managed-identity-object-id> \
  --secret-permissions get list

# Or use RBAC
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee <managed-identity-object-id> \
  --scope /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/{vault-name}
```

### 3. ❌ Wrong Client ID for User-Assigned Identity

**Error:**
```
Status: 400
Message: The provided client_id is not valid
```

**Solution:**
- Verify the client ID (not object ID!)
- Get correct client ID:
```bash
az identity show --name my-identity --resource-group my-rg --query clientId -o tsv
```

### 4. ❌ Multiple User-Assigned Identities Without Specifying Client ID

**Error:**
```
Multiple user assigned identities exist, please specify the clientId / resourceId / object_id
```

**Solution:**
```typescript
// Explicitly specify which identity to use
const credential = new ManagedIdentityCredential({
  clientId: '12345678-1234-1234-1234-123456789abc'
});
```

### 5. ❌ Network/Firewall Issues

**Error:**
```
ENOTFOUND or connection timeout
```

**Solution:**
- Ensure outbound connectivity to Azure services
- Check NSG rules and firewall configuration
- Verify service endpoints or private endpoints are configured correctly

### 6. ❌ Token Caching Issues

**Problem:** Old/expired tokens being used

**Solution:**
```typescript
// Credentials automatically handle token refresh
// But if you're manually caching tokens, implement expiration logic

const credential = new ManagedIdentityCredential();
const token = await credential.getToken('https://vault.azure.net/.default');

// Token contains expiresOnTimestamp
if (token.expiresOnTimestamp < Date.now()) {
  // Token is expired, get a new one
  const newToken = await credential.getToken('https://vault.azure.net/.default');
}
```

---

## Best Practices

### 1. ✅ Use DefaultAzureCredential for Most Scenarios

```typescript
import { DefaultAzureCredential } from '@azure/identity';

// Works everywhere!
const credential = new DefaultAzureCredential();
```

### 2. ✅ Store Configuration in Environment Variables

```typescript
// Don't hardcode client IDs!
const credential = new ManagedIdentityCredential({
  clientId: process.env.AZURE_CLIENT_ID  // ✅ Good
  // clientId: '12345678-abcd-...'      // ❌ Bad
});
```

### 3. ✅ Implement Proper Error Handling

```typescript
import { ManagedIdentityCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

async function getSecret(secretName: string): Promise<string | null> {
  try {
    const credential = new ManagedIdentityCredential();
    const client = new SecretClient(vaultUrl, credential);
    const secret = await client.getSecret(secretName);
    return secret.value || null;
  } catch (error: any) {
    if (error.statusCode === 403) {
      console.error('Access denied - check RBAC permissions');
    } else if (error.statusCode === 404) {
      console.error('Secret not found');
    } else if (error.message?.includes('IDENTITY_ENDPOINT')) {
      console.error('Managed Identity not available');
    } else {
      console.error('Unexpected error:', error);
    }
    return null;
  }
}
```

### 4. ✅ Use Retry Logic for Transient Failures

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry auth errors
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw error;
      }
      
      // Exponential backoff
      if (i < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  }
  
  throw lastError!;
}
```

### 5. ✅ Prefer System-Assigned for Simple Scenarios

```typescript
// If you only have one application accessing resources:
const credential = new ManagedIdentityCredential(); // ✅ Simple and secure
```

### 6. ✅ Use User-Assigned for Complex Architectures

```typescript
// When multiple resources need the same identity:
const credential = new ManagedIdentityCredential({
  clientId: process.env.SHARED_IDENTITY_CLIENT_ID
});
```

### 7. ✅ Validate Credentials Early

```typescript
import { ManagedIdentityCredential } from '@azure/identity';

async function validateCredential(credential: ManagedIdentityCredential): Promise<boolean> {
  try {
    // Try to get a token to validate the credential works
    await credential.getToken('https://management.azure.com/.default');
    return true;
  } catch (error) {
    console.error('Credential validation failed:', error);
    return false;
  }
}

// Use during application startup
const credential = new ManagedIdentityCredential();
if (await validateCredential(credential)) {
  console.log('Credentials validated successfully');
} else {
  console.error('Failed to validate credentials - check identity configuration');
  process.exit(1);
}
```

### 8. ✅ Log Credential Type Being Used

```typescript
const credential = new DefaultAzureCredential();

// Enable logging
import { setLogLevel } from '@azure/logger';
setLogLevel('info');

// This will log which credential type succeeded
// e.g., "ManagedIdentityCredential => getToken() => SUCCESS"
```

---

## Environment Variables Reference

### For Local Development with Service Principal

```bash
# .env file for local development
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-app-id
AZURE_CLIENT_SECRET=your-client-secret
```

### For User-Assigned Managed Identity in Azure

```bash
# App Service / Function App configuration
AZURE_CLIENT_ID=your-managed-identity-client-id
```

### For Detecting Azure Environment

```bash
# Automatically set by Azure services
IDENTITY_ENDPOINT=http://169.254.169.254/metadata/identity/oauth2/token
IDENTITY_HEADER=<secret>
```

---

## Testing Managed Identity Locally

You can test Managed Identity behavior locally using Azure CLI:

```bash
# Login with Azure CLI
az login

# Your DefaultAzureCredential will use Azure CLI credentials
# This simulates managed identity behavior for testing
```

Or use service principal with environment variables:

```bash
# Create a service principal
az ad sp create-for-rbac --name my-test-sp

# Set environment variables
export AZURE_TENANT_ID="<tenant-id>"
export AZURE_CLIENT_ID="<client-id>"
export AZURE_CLIENT_SECRET="<client-secret>"

# Your DefaultAzureCredential will use these credentials
```

---

## Complete Example

```typescript
import { DefaultAzureCredential, ManagedIdentityCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

class AzureService {
  private credential: DefaultAzureCredential | ManagedIdentityCredential;
  
  constructor() {
    // Use DefaultAzureCredential for automatic fallback
    this.credential = new DefaultAzureCredential({
      managedIdentityClientId: process.env.AZURE_CLIENT_ID
    });
  }
  
  async getKeyVaultSecret(vaultUrl: string, secretName: string): Promise<string> {
    const client = new SecretClient(vaultUrl, this.credential);
    
    try {
      const secret = await client.getSecret(secretName);
      return secret.value || '';
    } catch (error: any) {
      console.error(`Failed to get secret ${secretName}:`, error.message);
      throw error;
    }
  }
}

// Usage
const service = new AzureService();
const connectionString = await service.getKeyVaultSecret(
  'https://my-vault.vault.azure.net',
  'database-connection-string'
);
```

---

## Resources

- [Azure Identity SDK Documentation](https://docs.microsoft.com/azure/developer/javascript/sdk/authentication/overview)
- [Managed Identity Overview](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)
- [DefaultAzureCredential](https://docs.microsoft.com/javascript/api/@azure/identity/defaultazurecredential)
- [Best Practices for Authentication](https://docs.microsoft.com/azure/developer/javascript/sdk/authentication/best-practices)
