# Quick Start Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Set Environment Variables

### PowerShell:
```powershell
$env:AZURE_KEYVAULT_NAME = "your-keyvault-name"
$env:AZURE_SECRET_NAME = "your-secret-name"
```

### Bash/Linux:
```bash
export AZURE_KEYVAULT_NAME="your-keyvault-name"
export AZURE_SECRET_NAME="your-secret-name"
```

## Step 3: Authenticate

Make sure you're logged in with Azure CLI:
```bash
az login
```

## Step 4: Build and Run
```bash
# Build the TypeScript
npm run build

# Run the program
npm start

# Or do both at once
npm run dev
```

## Expected Output

If everything is configured correctly:
```
🔐 Azure Identity & Key Vault Demo
==================================================
Key Vault URL: https://your-keyvault.vault.azure.net
Secret Name: your-secret-name

Creating DefaultAzureCredential...
✓ DefaultAzureCredential created successfully

Creating SecretClient...
✓ SecretClient created successfully

Retrieving secret 'your-secret-name'...
✓ Secret retrieved successfully

==================================================
Secret Details:
  Name: your-secret-name
  Value: your-secret-value
  Enabled: true
  Created: 2024-01-15T10:30:00.000Z
  Updated: 2024-01-15T10:30:00.000Z
==================================================
```

## Common Issues

### "AZURE_KEYVAULT_NAME environment variable is required"
- Set the environment variable before running the program

### "Authentication Failed"
- Run `az login` to authenticate
- Or set service principal credentials (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)

### "Forbidden" (403 error)
- Your account needs Key Vault permissions
- Add "Key Vault Secrets User" role assignment:
  ```bash
  az role assignment create \
    --role "Key Vault Secrets User" \
    --assignee $(az ad signed-in-user show --query id -o tsv) \
    --scope $(az keyvault show --name <vault-name> --query id -o tsv)
  ```

### "ResourceNotFound"
- Check the Key Vault name is correct
- Verify the secret exists in the Key Vault
- Make sure you're using the correct Azure subscription

## Testing Without a Real Key Vault

If you don't have a Key Vault yet, create one:

```bash
# Create a resource group (if needed)
az group create --name my-rg --location eastus

# Create a Key Vault
az keyvault create \
  --name my-unique-keyvault \
  --resource-group my-rg \
  --location eastus

# Create a test secret
az keyvault secret set \
  --vault-name my-unique-keyvault \
  --name my-secret \
  --value "Hello from Key Vault!"

# Grant yourself access (if using RBAC)
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $(az ad signed-in-user show --query id -o tsv) \
  --scope $(az keyvault show --name my-unique-keyvault --query id -o tsv)
```

Then run the program:
```bash
$env:AZURE_KEYVAULT_NAME = "my-unique-keyvault"
$env:AZURE_SECRET_NAME = "my-secret"
npm run dev
```
