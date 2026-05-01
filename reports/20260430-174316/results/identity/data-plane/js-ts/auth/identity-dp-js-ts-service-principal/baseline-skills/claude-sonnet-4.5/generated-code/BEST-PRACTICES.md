# Azure Service Principal Best Practices

## Secret Management

### 1. Never Hardcode Credentials
❌ **Don't do this:**
```typescript
const credential = new ClientSecretCredential(
  '12345-tenant-id',
  '67890-client-id',
  'my-secret-value'
);
```

✅ **Do this:**
```typescript
const credential = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID!,
  process.env.AZURE_CLIENT_ID!,
  process.env.AZURE_CLIENT_SECRET!
);
```

### 2. Use Environment Variables
- Store credentials in environment variables or `.env` files (never commit `.env` to git)
- Use `dotenv` package for local development
- Use proper secret management in production (see below)

### 3. Production Secret Management Options

#### Azure Key Vault (Recommended)
```typescript
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

// Use Managed Identity in production
const credential = new DefaultAzureCredential();
const client = new SecretClient('https://your-vault.vault.azure.net', credential);

// Retrieve the client secret from Key Vault
const secret = await client.getSecret('service-principal-secret');
const clientSecret = secret.value;
```

#### Azure App Configuration
- Store non-secret config in Azure App Configuration
- Reference Key Vault secrets via Key Vault references

#### Managed Identity (Best for Azure-hosted apps)
```typescript
import { DefaultAzureCredential } from '@azure/identity';

// No secrets needed - uses Managed Identity
const credential = new DefaultAzureCredential();
```

#### Container/Kubernetes Secrets
- Use Kubernetes secrets for containerized applications
- Integrate with Azure Key Vault using CSI driver

### 4. Secret Rotation
- Rotate client secrets regularly (Microsoft recommends 90 days)
- Store both old and new secrets during rotation period
- Automate rotation using Azure Key Vault or custom scripts

```typescript
// Support for secret rotation
const clientSecret = process.env.AZURE_CLIENT_SECRET_PRIMARY || 
                    process.env.AZURE_CLIENT_SECRET_SECONDARY;
```

### 5. Secure .env Files
Add to `.gitignore`:
```
.env
.env.local
.env.*.local
secrets/
```

Set file permissions:
```bash
chmod 600 .env  # Unix/Linux
```

## Authentication Best Practices

### 1. Use Appropriate Credential Types

```typescript
// Local development: Service Principal
const devCredential = new ClientSecretCredential(tenantId, clientId, secret);

// Production (Azure-hosted): Managed Identity
const prodCredential = new DefaultAzureCredential();

// Multi-environment wrapper
const credential = process.env.NODE_ENV === 'production'
  ? new DefaultAzureCredential()
  : new ClientSecretCredential(tenantId, clientId, secret);
```

### 2. Implement Proper Error Handling

```typescript
async function authenticateWithRetry(
  credential: TokenCredential,
  maxRetries = 3
): Promise<AccessToken> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await credential.getToken('https://management.azure.com/.default');
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  throw new Error('Authentication failed after retries');
}
```

### 3. Configure Retry Policies

```typescript
const credential = new ClientSecretCredential(tenantId, clientId, secret, {
  retryOptions: {
    maxRetries: 3,
    retryDelayInMs: 1000,
    maxRetryDelayInMs: 60000,
  },
});
```

### 4. Validate Configuration at Startup

```typescript
function validateAzureConfig(): void {
  const required = ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate format (UUIDs)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(process.env.AZURE_TENANT_ID!)) {
    throw new Error('Invalid AZURE_TENANT_ID format');
  }
  if (!uuidRegex.test(process.env.AZURE_CLIENT_ID!)) {
    throw new Error('Invalid AZURE_CLIENT_ID format');
  }
}
```

### 5. Use Least Privilege Principle
- Grant only necessary permissions to Service Principal
- Use specific RBAC roles instead of Owner/Contributor
- Apply resource-level or resource-group-level permissions

```bash
# Example: Grant specific role to Service Principal
az role assignment create \
  --assignee <client-id> \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/<subscription-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault>
```

### 6. Implement Token Caching
The `@azure/identity` library automatically caches tokens. For custom scenarios:

```typescript
class CachedCredential {
  private tokenCache: AccessToken | null = null;
  
  async getToken(scope: string): Promise<AccessToken> {
    if (this.tokenCache && this.tokenCache.expiresOnTimestamp > Date.now()) {
      return this.tokenCache;
    }
    
    this.tokenCache = await this.credential.getToken(scope);
    return this.tokenCache;
  }
}
```

### 7. Logging and Monitoring
```typescript
import { setLogLevel } from '@azure/logger';

// Enable logging for debugging (development only)
if (process.env.NODE_ENV === 'development') {
  setLogLevel('info');
}

// Monitor authentication failures
function logAuthenticationMetric(success: boolean, error?: Error): void {
  // Send to Application Insights, CloudWatch, etc.
  console.log({
    timestamp: new Date().toISOString(),
    event: 'azure_authentication',
    success,
    error: error?.message,
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
  });
}
```

## Creating a Service Principal

### Azure CLI
```bash
# Create Service Principal with role assignment
az ad sp create-for-rbac \
  --name "my-app-service-principal" \
  --role "Contributor" \
  --scopes /subscriptions/<subscription-id>/resourceGroups/<resource-group>

# Output will include:
# - appId (Client ID)
# - password (Client Secret)
# - tenant (Tenant ID)
```

### Azure Portal
1. Navigate to Azure Active Directory > App registrations
2. Click "New registration"
3. Configure application settings
4. Go to "Certificates & secrets"
5. Create new client secret
6. Assign appropriate RBAC roles

## Testing
```bash
# Test authentication locally
npm run dev

# Verify credentials
az login --service-principal \
  -u <client-id> \
  -p <client-secret> \
  --tenant <tenant-id>
```

## Security Checklist
- [ ] Credentials stored in environment variables or secrets manager
- [ ] `.env` file in `.gitignore`
- [ ] Client secrets rotated regularly
- [ ] Least privilege RBAC roles assigned
- [ ] Error handling doesn't expose sensitive information
- [ ] Logging doesn't include secrets
- [ ] Token expiration handled properly
- [ ] Network timeouts configured
- [ ] Service Principal validated at startup
- [ ] Production uses Managed Identity (if on Azure)
