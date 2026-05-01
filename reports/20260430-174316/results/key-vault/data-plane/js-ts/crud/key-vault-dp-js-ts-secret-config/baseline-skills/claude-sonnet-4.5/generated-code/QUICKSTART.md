# Quick Start Guide

## Prerequisites

1. **Azure Key Vault**: Create a Key Vault in Azure Portal
2. **Authentication**: Set up one of the following:
   - Azure CLI: Run `az login` for local development
   - Managed Identity: Automatically used when running in Azure
   - Service Principal: Set environment variables (if needed)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Configure Key Vault URL

Set the Key Vault URL as an environment variable:

**Windows (PowerShell):**
```powershell
$env:AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net"
```

**Windows (Command Prompt):**
```cmd
set AZURE_KEYVAULT_URL=https://your-vault-name.vault.azure.net
```

**Linux/macOS:**
```bash
export AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net"
```

### 4. Grant Permissions

Ensure your identity has Key Vault permissions:

**Option A: Using RBAC (Recommended)**
```bash
# Get your Azure user ID
az ad signed-in-user show --query id -o tsv

# Assign Key Vault Secrets Officer role
az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee <your-user-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/<rg-name>/providers/Microsoft.KeyVault/vaults/<vault-name>
```

**Option B: Using Access Policies**
```bash
az keyvault set-policy \
  --name <your-vault-name> \
  --upn <your-email@domain.com> \
  --secret-permissions get list set delete purge
```

### 5. Run the Demo

```bash
npm start
```

Or for development with hot reload:
```bash
npm run dev
```

## Example Usage

### Basic Configuration Provider

```typescript
import { SecretProvider } from './secretProvider';
import { CachingProvider } from './cachingProvider';

// Initialize
const provider = new SecretProvider(process.env.AZURE_KEYVAULT_URL!);
const cache = new CachingProvider(provider);

// Bulk load at startup
await cache.bulkLoad(['DatabasePassword', 'ApiKey', 'JwtSecret']);

// Read from cache (fast!)
const dbPassword = await cache.get('DatabasePassword', 'default-password');
const apiKey = await cache.get('ApiKey');

// Refresh if needed
await cache.refresh('ApiKey');
```

### Secret Rotation

```typescript
import { SecretRotationHelper } from './secretRotation';

const rotationHelper = new SecretRotationHelper(provider);

// Rotate with new value and expiry
const expiry = new Date();
expiry.setDate(expiry.getDate() + 90); // 90 days

await rotationHelper.rotateSecret('MySecret', {
  newValue: 'new-secure-value',
  expiresOn: expiry,
  cleanupOldVersions: false, // Set true to clean up old versions
});
```

### Checking Expiring Secrets

```typescript
// Check which secrets are expiring soon
const expiringSecrets = await cache.checkExpiringSecrets();

for (const secret of expiringSecrets) {
  console.warn(
    `Secret '${secret.name}' expires in ${secret.daysUntilExpiry} days`
  );
  
  // Optionally rotate automatically
  // await rotationHelper.rotateSecret(secret.name, { ... });
}
```

## Troubleshooting

### "AZURE_KEYVAULT_URL is not set"
Set the environment variable before running the application.

### Authentication Errors (401/403)
- Run `az login` for local development
- Verify Key Vault permissions (RBAC role or access policy)
- Check firewall rules if Key Vault has network restrictions

### "Secret not found" (404)
- The application handles this gracefully by returning default values
- Check the secret name (case-sensitive)
- Verify the secret exists in the Key Vault

### Purge Errors
- Ensure soft-delete is enabled on the Key Vault (default)
- You need "Purge" permission to permanently delete secrets
- Wait for delete operation to complete before purging

## Running in Production (Azure)

When deployed to Azure services (App Service, Functions, VM, AKS), the application automatically uses Managed Identity:

1. **Enable Managed Identity** on your Azure resource
2. **Grant permissions** to the Managed Identity on Key Vault
3. **Set environment variable** in application settings:
   - Name: `AZURE_KEYVAULT_URL`
   - Value: `https://your-vault-name.vault.azure.net`

No code changes needed—`DefaultAzureCredential` automatically detects and uses Managed Identity!

## Features Demonstrated

✅ Graceful secret retrieval with default values  
✅ Specific version retrieval  
✅ Expiry date inspection  
✅ In-memory caching layer  
✅ Bulk loading at startup  
✅ On-demand refresh  
✅ Automatic expiry monitoring  
✅ Managed identity authentication  
✅ Secret rotation with versioning  
✅ Safe delete and purge workflow  

## Next Steps

- Integrate with your application configuration
- Set up automated secret rotation schedules
- Monitor expiring secrets in CI/CD pipelines
- Add metrics and logging for production monitoring
