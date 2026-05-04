# Usage Guide

## Quick Start

### 1. Set Environment Variable

```bash
export KEY_VAULT_URL="https://your-vault-name.vault.azure.net"
```

### 2. Run the Demo

```bash
npm run dev
```

## Common Patterns

### Pattern 1: Application Startup

```typescript
import { ConfigurationModule } from "./ConfigurationModule.js";

class MyApplication {
  private config: ConfigurationModule;

  async initialize() {
    // Initialize with 7-day expiry warning
    this.config = new ConfigurationModule({ expiryWarningDays: 7 });
    
    // Bulk load all required secrets at startup
    const requiredSecrets = [
      "database-connection-string",
      "api-key",
      "jwt-secret",
      "smtp-password"
    ];
    
    await this.config.getCachedProvider().bulkLoad(requiredSecrets);
    console.log("✅ Configuration loaded");
  }

  async getDbConnection(): Promise<string> {
    // Reads from cache (no network call)
    return this.config.getCachedProvider().get("database-connection-string");
  }
}
```

### Pattern 2: Scheduled Secret Rotation

```typescript
import { SecretRotationHelper } from "./SecretRotationHelper.js";
import { ConfigurationModule } from "./ConfigurationModule.js";

async function scheduledRotation() {
  const config = new ConfigurationModule();
  const rotationHelper = new SecretRotationHelper(config.getSecretClient());
  const cache = config.getCachedProvider();

  // Check for expiring secrets
  const expiring = await cache.getExpiringSecrets();
  
  for (const secret of expiring) {
    if (secret.daysUntilExpiry !== null && secret.daysUntilExpiry <= 7) {
      console.log(`Rotating ${secret.secretName}...`);
      
      // Generate new value (your logic here)
      const newValue = await generateNewSecretValue(secret.secretName);
      
      // Rotate the secret
      await rotationHelper.rotateSecret(secret.secretName, {
        newValue,
        expiryDays: 90,
        tags: {
          rotatedBy: "automated-rotation",
          rotatedAt: new Date().toISOString()
        }
      });
      
      // Refresh cache
      await cache.refresh(secret.secretName);
    }
  }
}

function generateNewSecretValue(secretName: string): Promise<string> {
  // Implement your secret generation logic
  return Promise.resolve(`new-value-${Date.now()}`);
}
```

### Pattern 3: Feature Flags with Defaults

```typescript
async function getFeatureFlags(cache: CachedSecretProvider) {
  return {
    newUI: await cache.get("feature-new-ui", "false") === "true",
    betaFeatures: await cache.get("feature-beta", "false") === "true",
    maxUploadSize: parseInt(await cache.get("config-max-upload-mb", "100")),
  };
}
```

### Pattern 4: Health Check Endpoint

```typescript
async function healthCheck(config: ConfigurationModule) {
  const cache = config.getCachedProvider();
  const stats = cache.getCacheStats();
  
  // Check for expiring secrets
  const expiring = await cache.getExpiringSecrets();
  const hasExpired = expiring.some(s => s.isExpired);
  const nearExpiry = expiring.filter(s => 
    s.daysUntilExpiry !== null && s.daysUntilExpiry <= 3
  );

  return {
    status: hasExpired || nearExpiry.length > 0 ? "warning" : "healthy",
    cacheSize: stats.size,
    expiredSecrets: hasExpired ? expiring.filter(s => s.isExpired).length : 0,
    expiringIn3Days: nearExpiry.length,
    warnings: nearExpiry.map(s => ({
      secret: s.secretName,
      daysUntilExpiry: s.daysUntilExpiry
    }))
  };
}
```

### Pattern 5: Azure Function with Key Vault

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ConfigurationModule } from "./ConfigurationModule.js";

// Global config instance (reused across invocations)
let config: ConfigurationModule;

async function initializeConfig() {
  if (!config) {
    config = new ConfigurationModule({ expiryWarningDays: 7 });
    await config.getCachedProvider().bulkLoad([
      "database-connection-string",
      "api-key"
    ]);
  }
}

export async function httpTrigger(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  await initializeConfig();
  
  // Use cached config (fast)
  const dbConnection = await config.getCachedProvider().get("database-connection-string");
  
  // Your function logic...
  return { status: 200, body: "Success" };
}

app.http("myFunction", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler: httpTrigger,
});
```

## Authentication Options

### Production (Managed Identity)

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new ManagedIdentityCredential();
const client = new SecretClient(process.env.KEY_VAULT_URL!, credential);
```

### Local Development (Azure CLI)

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// Uses Azure CLI credentials when running locally
const credential = new DefaultAzureCredential();
const client = new SecretClient(process.env.KEY_VAULT_URL!, credential);
```

### Service Principal

```typescript
import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID!,
  process.env.AZURE_CLIENT_ID!,
  process.env.AZURE_CLIENT_SECRET!
);
const client = new SecretClient(process.env.KEY_VAULT_URL!, credential);
```

## Performance Tips

1. **Use bulk loading** - Load all secrets at startup to minimize API calls
2. **Cache secrets** - The caching layer reduces Key Vault API calls dramatically
3. **Set expiry warnings** - Configure appropriate warning days (7-30 recommended)
4. **Monitor cache stats** - Track cache hits and misses for optimization
5. **Use managed identity** - Fastest authentication method in Azure

## Security Best Practices

1. **Never log secret values** - Use masking: `value.substring(0, 4) + "***"`
2. **Enable soft-delete** - Required for production Key Vaults
3. **Enable purge protection** - Prevents accidental permanent deletion
4. **Set expiration dates** - All secrets should have expiry dates
5. **Use RBAC roles** - Grant minimum necessary permissions
6. **Rotate regularly** - Automate rotation before expiry
7. **Monitor access** - Enable Key Vault logging and alerts

## Troubleshooting

### Issue: "Authentication failed"

**Solution**: Ensure Managed Identity is enabled and has Key Vault access:

```bash
# Assign role to managed identity
az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee <managed-identity-object-id> \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault-name>
```

### Issue: "Secret not found"

**Solution**: Create the secret or use a default value:

```typescript
const value = await cache.get("my-secret", "default-value");
```

### Issue: "Caller is not authorized"

**Solution**: Grant appropriate RBAC permissions:

- Key Vault Secrets Officer: Full secret management
- Key Vault Secrets User: Read-only access

### Issue: "Cache not updating after rotation"

**Solution**: Explicitly refresh after rotation:

```typescript
await rotationHelper.rotateSecret("my-secret", { newValue: "new-value" });
await cache.refresh("my-secret"); // Force cache update
```

## API Reference

### ConfigurationModule

```typescript
constructor(cacheOptions?: CacheOptions)
getSecretProvider(): SecretProvider
getCachedProvider(): CachedSecretProvider
getSecretClient(): SecretClient
```

### CachedSecretProvider

```typescript
async get(secretName: string, defaultValue?: string): Promise<string>
async refresh(secretName: string, defaultValue?: string): Promise<string>
async bulkLoad(secretNames: string[]): Promise<void>
async refreshExpiring(): Promise<string[]>
async getExpiringSecrets(): Promise<SecretExpiryInfo[]>
has(secretName: string): boolean
clear(): void
getCacheStats(): { size: number; entries: Array<...> }
```

### SecretProvider

```typescript
async getSecret(secretName: string, options?: GetSecretOptions): Promise<string>
async getSecretVersion(secretName: string, version: string): Promise<string>
async getExpiryInfo(secretName: string, version?: string): Promise<SecretExpiryInfo>
async isNearExpiry(secretName: string, warningDays: number): Promise<boolean>
async listSecretVersions(secretName: string): Promise<SecretProperties[]>
```

### SecretRotationHelper

```typescript
async rotateSecret(secretName: string, options: RotateSecretOptions): Promise<KeyVaultSecret>
async cleanupOldVersions(secretName: string, options?: CleanupOptions): Promise<void>
async deleteAndPurgeSecret(secretName: string, purge?: boolean): Promise<void>
async listVersions(secretName: string): Promise<void>
```
