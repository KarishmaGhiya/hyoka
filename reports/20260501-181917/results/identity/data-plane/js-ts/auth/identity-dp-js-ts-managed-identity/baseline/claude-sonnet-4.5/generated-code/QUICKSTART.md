# Quick Start Guide

## Run the Demo

### Local Development (using Azure CLI)

```bash
# 1. Login to Azure
az login

# 2. Install dependencies (if not done)
npm install

# 3. Run the demo
npm run dev
```

### With Environment Variables

```bash
# Set your Key Vault URL
export KEY_VAULT_URL="https://your-keyvault.vault.azure.net/"

# Set user-assigned identity client ID (optional)
export AZURE_CLIENT_ID="your-client-id"

# Run
npm run dev
```

### Build and Run

```bash
npm run build
node dist/index.js
```

## What the Demo Shows

1. ✅ **System-Assigned Managed Identity** - `new ManagedIdentityCredential()`
2. ✅ **User-Assigned Managed Identity** - `new ManagedIdentityCredential({ clientId })`
3. ✅ **ChainedTokenCredential** - Falls back to Azure CLI for local dev
4. ✅ **Azure SDK Integration** - Uses credential with Key Vault client
5. ✅ **Error Handling** - Handles `CredentialUnavailableError` gracefully

## Expected Output

When running locally with Azure CLI:
```
╔════════════════════════════════════════════════════════════════╗
║   Azure Managed Identity Authentication Demo                  ║
╚════════════════════════════════════════════════════════════════╝

Configuration:
  User-Assigned Client ID: 00000000-0000-0000-0000-000000000000
  Key Vault URL: https://my-keyvault.vault.azure.net/

=== System-Assigned Managed Identity ===
✗ Managed Identity not available: ...
  This is expected when running locally outside of Azure

=== Chained Token Credential (MI → Azure CLI) ===
  [1] Added: ManagedIdentityCredential (system-assigned)
  [2] Added: ManagedIdentityCredential (user-assigned: ...)
  [3] Added: AzureCliCredential (local dev fallback)
✓ Created ChainedTokenCredential
  → Will try credentials in order until one succeeds

=== Getting Access Token Directly ===
  Requesting token for scope: https://vault.azure.net/.default
✓ Successfully obtained access token
  Token (first 20 chars): eyJ0eXAiOiJKV1QiLCJ...
  Expires on: 2026-05-02T02:31:36.000Z
  Valid for: 59 minutes

✓ Demo completed successfully
```

## Deploy to Azure

### Enable System-Assigned Identity on VM

```bash
az vm identity assign \
  --name myVM \
  --resource-group myResourceGroup
```

### Enable User-Assigned Identity

```bash
# Create identity
az identity create \
  --name myIdentity \
  --resource-group myResourceGroup

# Assign to VM
az vm identity assign \
  --name myVM \
  --resource-group myResourceGroup \
  --identities myIdentity
```

### Grant Key Vault Access

```bash
# Get identity principal ID
PRINCIPAL_ID=$(az vm identity show \
  --name myVM \
  --resource-group myResourceGroup \
  --query principalId -o tsv)

# Grant access
az keyvault set-policy \
  --name myKeyVault \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

## Troubleshooting

**"Managed Identity not available"**
- Expected locally - make sure you run `az login`

**"All credentials in chain failed"**
- Run `az login` for local development
- Or enable Managed Identity in Azure

**"Access denied (403)"**
- Grant the identity Key Vault permissions (see above)

## Key Files

- `src/index.ts` - Main demo with all examples
- `package.json` - Dependencies and scripts
- `README.md` - Full documentation
- `QUICKSTART.md` - This file
