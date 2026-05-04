# Quick Start Guide

## Setup Steps

1. **Configure your environment variables:**
   Copy `.env.example` to `.env` and fill in your Azure credentials:
   ```bash
   copy .env.example .env
   ```

   Edit `.env` with your actual values:
   - `AZURE_TENANT_ID`: Your Azure AD tenant ID
   - `AZURE_CLIENT_ID`: Service Principal application (client) ID
   - `AZURE_CLIENT_SECRET`: Service Principal client secret
   - `KEY_VAULT_URL`: Your Key Vault URL (e.g., https://myvault.vault.azure.net)

2. **Run the application:**
   
   Development mode (with ts-node):
   ```bash
   npm run dev
   ```
   
   Or production mode (compiled):
   ```bash
   npm run build
   npm start
   ```

## What the Program Does

The program demonstrates Azure Service Principal authentication by:

1. ✅ Loading credentials from environment variables using `dotenv`
2. ✅ Creating a `ClientSecretCredential` instance
3. ✅ Using it to authenticate with Azure Key Vault
4. ✅ Listing secrets to verify authentication works
5. ✅ Handling `AuthenticationError` and other exceptions

## Expected Output

Success:
```
🔐 Azure Service Principal Authentication Demo

📋 Step 1: Loading configuration from environment variables...
   ✓ Tenant ID: 12345678...
   ✓ Client ID: 87654321...
   ✓ Key Vault URL: https://myvault.vault.azure.net

🔑 Step 2: Creating ClientSecretCredential...
   ✓ Credential created successfully

🏗️  Step 3: Creating SecretClient with the credential...
   ✓ SecretClient created successfully

✅ Step 4: Verifying authentication by listing secrets...
   • secret1
   • secret2

   ✓ Successfully listed 2 secret(s)

🎉 Authentication successful! Service Principal is working correctly.
```

## Troubleshooting

If you get authentication errors:
- Double-check your tenant ID, client ID, and client secret
- Verify the Service Principal exists and is not disabled
- Check if the client secret has expired

If you get permission errors:
- Grant the Service Principal access to your Key Vault
- Use: `az role assignment create --assignee <CLIENT_ID> --role "Key Vault Secrets User" --scope <KEY_VAULT_RESOURCE_ID>`

## Files Created

- `src/index.ts` - Main TypeScript application
- `package.json` - Node.js dependencies and scripts
- `tsconfig.json` - TypeScript compiler configuration
- `.env.example` - Environment variable template
- `.gitignore` - Git ignore rules
- `README.md` - Full documentation
- `QUICKSTART.md` - This file
