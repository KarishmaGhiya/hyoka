# Quick Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Azure CLI** (for local development)
3. **Azure Key Vault** with secrets configured

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Authenticate with Azure (Local Development)

```bash
# Login to Azure
az login

# Set your default subscription (optional)
az account set --subscription "Your-Subscription-Name"
```

### 3. Set Environment Variable

**Linux/macOS:**
```bash
export AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net/"
```

**Windows PowerShell:**
```powershell
$env:AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net/"
```

**Windows CMD:**
```cmd
set AZURE_KEYVAULT_URL=https://your-vault-name.vault.azure.net/
```

### 4. Grant Key Vault Access

Ensure your Azure account or managed identity has the following permissions on the Key Vault:

```bash
# For local development (using your Azure AD account)
az keyvault set-policy --name your-vault-name \
  --upn your-email@domain.com \
  --secret-permissions get list set delete purge

# For managed identity in Azure
az keyvault set-policy --name your-vault-name \
  --object-id <managed-identity-principal-id> \
  --secret-permissions get list set delete purge
```

### 5. Create Sample Secrets

```bash
# Create test secrets in Key Vault
az keyvault secret set --vault-name your-vault-name \
  --name DatabaseConnectionString \
  --value "Server=myserver;Database=mydb;User=admin;Password=pass123"

az keyvault secret set --vault-name your-vault-name \
  --name ApiKey \
  --value "my-api-key-12345"

az keyvault secret set --vault-name your-vault-name \
  --name AppSecret \
  --value "my-app-secret-67890"

# Optional: Set expiry date (90 days from now)
az keyvault secret set --vault-name your-vault-name \
  --name ApiKey \
  --value "my-api-key-12345" \
  --expires "2026-07-31T00:00:00Z"
```

### 6. Build and Run

```bash
# Build the TypeScript project
npm run build

# Run the demo
npm start
```

## Running in Azure

When deploying to Azure (App Service, Function App, AKS, VM, etc.):

### 1. Enable Managed Identity

```bash
# For App Service / Function App
az webapp identity assign --name your-app-name --resource-group your-rg

# Get the principal ID from the output
```

### 2. Grant Key Vault Access to Managed Identity

```bash
az keyvault set-policy --name your-vault-name \
  --object-id <managed-identity-principal-id> \
  --secret-permissions get list set delete purge
```

### 3. Set Environment Variable in App Service

```bash
az webapp config appsettings set --name your-app-name \
  --resource-group your-rg \
  --settings AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net/"
```

## Troubleshooting

### Authentication Errors

**Error:** `authentication_failed` or `credential unavailable`

**Solution:**
- Ensure you're logged in: `az login`
- Verify your account has access to the Key Vault
- Check that the AZURE_KEYVAULT_URL is correct

### Secret Not Found

**Error:** `SecretNotFound` or 404

**Solution:**
- Verify the secret exists: `az keyvault secret list --vault-name your-vault-name`
- Check the secret name spelling
- Ensure you have `get` permission on secrets

### Permission Denied

**Error:** `Forbidden` or `insufficient permissions`

**Solution:**
```bash
# Grant yourself access
az keyvault set-policy --name your-vault-name \
  --upn $(az account show --query user.name -o tsv) \
  --secret-permissions get list set delete purge
```

### Vault URL Issues

**Error:** `vault not found` or `ENOTFOUND`

**Solution:**
- Verify the vault exists: `az keyvault show --name your-vault-name`
- Ensure the URL format is correct: `https://vault-name.vault.azure.net/`
- Check network connectivity to Azure

## Testing Without Azure Key Vault

If you want to test the TypeScript compilation without Azure access, you can:

1. Comment out the demo execution in `src/index.ts`
2. Only build the project: `npm run build`
3. Inspect the generated TypeScript definitions in `dist/`

## Next Steps

- Review the [README.md](README.md) for architecture details
- Explore the source files in `src/`
- Customize the configuration for your needs
- Add error handling and logging for production use
- Implement monitoring and alerting for expiring secrets
