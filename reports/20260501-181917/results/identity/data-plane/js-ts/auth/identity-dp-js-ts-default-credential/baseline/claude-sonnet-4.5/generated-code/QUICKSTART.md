# Quick Start Guide

## Setup (5 minutes)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set environment variables**:
   ```bash
   # Windows PowerShell
   $env:AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net"
   $env:SECRET_NAME="my-secret"
   
   # Linux/macOS
   export AZURE_KEYVAULT_URL="https://your-vault-name.vault.azure.net"
   export SECRET_NAME="my-secret"
   ```

3. **Authenticate with Azure CLI** (easiest for local development):
   ```bash
   az login
   ```

4. **Run the program**:
   ```bash
   npm run build
   npm start
   ```

## Alternative: Use Service Principal

Instead of Azure CLI, you can use a service principal:

```bash
# Windows PowerShell
$env:AZURE_TENANT_ID="your-tenant-id"
$env:AZURE_CLIENT_ID="your-client-id"
$env:AZURE_CLIENT_SECRET="your-client-secret"

# Linux/macOS
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

## Verify Key Vault Access

Ensure your identity has the required permissions:

```bash
# Check your current Azure account
az account show

# List secrets in the vault (to verify access)
az keyvault secret list --vault-name your-vault-name

# Grant yourself access if needed
az keyvault set-policy --name your-vault-name \
  --upn your-email@example.com \
  --secret-permissions get list
```

## Troubleshooting

- **"Authentication failed"**: Run `az login` or set service principal env vars
- **"Forbidden"**: Grant Key Vault Secrets User role or access policy
- **"SecretNotFound"**: Create the secret or change SECRET_NAME
- **"ResourceNotFound"**: Verify the Key Vault URL is correct
