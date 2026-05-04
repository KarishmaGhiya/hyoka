# Quick Start Guide

## Prerequisites

1. **Azure Key Vault**: Create an Azure Key Vault instance
2. **Authentication**: Set up one of the following:
   - **For local development**: Run `az login`
   - **For Azure deployment**: Enable Managed Identity on your Azure resource

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and configure your Key Vault URL:

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
AZURE_KEYVAULT_URL=https://your-keyvault-name.vault.azure.net/
```

### 3. Grant Permissions

Your identity needs the following permissions on the Key Vault:

**Using Azure RBAC (recommended):**
```bash
# Get your identity's object ID
OBJECT_ID=$(az ad signed-in-user show --query id -o tsv)

# Grant Key Vault Secrets User role
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $OBJECT_ID \
  --scope /subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.KeyVault/vaults/{vault-name}
```

**Or using Access Policies (legacy):**
```bash
az keyvault set-policy \
  --name your-keyvault-name \
  --object-id $OBJECT_ID \
  --secret-permissions get list set delete purge
```

### 4. Create Sample Secrets (Optional)

For testing the demo, create some sample secrets:

```bash
# Using Azure CLI
az keyvault secret set --vault-name your-keyvault-name --name DatabaseConnectionString --value "Server=myserver;Database=mydb"
az keyvault secret set --vault-name your-keyvault-name --name ApiKey --value "sample-api-key-12345"
az keyvault secret set --vault-name your-keyvault-name --name ServicePassword --value "sample-password"

# Set expiry date (optional)
az keyvault secret set --vault-name your-keyvault-name --name ApiKey --value "sample-api-key" --expires "2027-12-31T23:59:59Z"
```

### 5. Build and Run

```bash
# Build the TypeScript code
npm run build

# Run the demo
npm start
```

## Using in Your Application

### Basic Usage

```typescript
import { ConfigurationModule } from './ConfigurationModule';

// Initialize configuration
const config = new ConfigurationModule({
  cacheOptions: {
    expiryWarningDays: 7, // Warn if expiring within 7 days
  },
});

// Load required secrets at startup
await config.initialize([
  'DatabaseConnectionString',
  'ApiKey',
  'ServicePassword',
]);

// Get configuration values (from cache)
const dbConnection = await config.get('DatabaseConnectionString');
const apiKey = await config.get('ApiKey', 'default-key');

// Use in your application
connectToDatabase(dbConnection);
initializeApiClient(apiKey);
```

### Monitoring Expiring Secrets

```typescript
// Check for expiring secrets periodically
setInterval(async () => {
  const expiring = await config.checkExpiry();
  
  if (expiring.size > 0) {
    // Send alerts, log warnings, etc.
    console.warn('Secrets expiring soon:', Array.from(expiring.keys()));
  }
}, 3600000); // Every hour
```

### Secret Rotation

```typescript
import { SecretRotationHelper } from './SecretRotationHelper';

const rotationHelper = new SecretRotationHelper(config.getSecretClient());

// Rotate a secret
await rotationHelper.rotateSecret(
  'ApiKey',
  generateNewApiKey(),
  {
    expiryDays: 90,
    tags: { rotatedBy: 'automated-process' },
  }
);

// Refresh the cache after rotation
await config.refresh('ApiKey');
```

## Troubleshooting

### Authentication Errors

**Error: "No valid credentials found"**

Solution:
```bash
# For local development
az login

# Verify your identity
az account show
```

**Error: "Forbidden" (403)**

Solution: Check that your identity has the required permissions on the Key Vault.

### Key Vault URL Not Found

**Error: "Vault URL must be provided"**

Solution: Ensure `AZURE_KEYVAULT_URL` is set in your environment:

```bash
# Set environment variable
export AZURE_KEYVAULT_URL=https://your-keyvault-name.vault.azure.net/

# Or in PowerShell
$env:AZURE_KEYVAULT_URL="https://your-keyvault-name.vault.azure.net/"
```

### Secret Not Found

The application handles missing secrets gracefully by returning default values:

```typescript
const value = await config.get('MissingSecret', 'default-value');
// Returns 'default-value' if secret doesn't exist
```

## Production Deployment

### 1. Enable Managed Identity

**For App Service:**
```bash
az webapp identity assign --name myapp --resource-group myrg
```

**For Virtual Machine:**
```bash
az vm identity assign --name myvm --resource-group myrg
```

### 2. Grant Key Vault Access

```bash
# Get the managed identity's principal ID
PRINCIPAL_ID=$(az webapp identity show --name myapp --resource-group myrg --query principalId -o tsv)

# Grant access
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $PRINCIPAL_ID \
  --scope /subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.KeyVault/vaults/{vault-name}
```

### 3. Set Environment Variables

Configure your application to set `AZURE_KEYVAULT_URL`:

**App Service:**
```bash
az webapp config appsettings set \
  --name myapp \
  --resource-group myrg \
  --settings AZURE_KEYVAULT_URL=https://your-keyvault-name.vault.azure.net/
```

### 4. Deploy Your Application

Build and deploy as normal. The `DefaultAzureCredential` will automatically use the managed identity.

## Best Practices

1. **Set Expiry Dates**: Always set expiry dates on secrets
2. **Monitor Expiring Secrets**: Implement monitoring and alerting
3. **Rotate Regularly**: Rotate secrets before they expire
4. **Use Managed Identity**: Never use client secrets in production
5. **Cache Configuration**: Use the caching layer to reduce Key Vault calls
6. **Graceful Degradation**: Always provide default values for non-critical secrets
7. **Keep Versions**: Don't delete old versions immediately (for rollback)

## Next Steps

- Implement automated secret rotation
- Set up monitoring and alerting for expiring secrets
- Integrate with your CI/CD pipeline
- Configure Azure Monitor for Key Vault audit logs
