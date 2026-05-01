# Azure Service Principal Authentication - Complete TypeScript Example

Complete example demonstrating Azure Service Principal authentication using client secret in TypeScript/Node.js.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual Azure credentials
```

You'll need:
- **AZURE_TENANT_ID**: Your Azure AD tenant (directory) ID
- **AZURE_CLIENT_ID**: Service Principal application (client) ID  
- **AZURE_CLIENT_SECRET**: Service Principal client secret

### 3. Run the Example

```bash
npm start
```

## How to Create a Service Principal

### Using Azure CLI

```bash
# Create Service Principal with Contributor role
az ad sp create-for-rbac --name "my-app-sp" --role Contributor --scopes /subscriptions/{subscription-id}

# Output will contain:
# - appId (use as AZURE_CLIENT_ID)
# - password (use as AZURE_CLIENT_SECRET)
# - tenant (use as AZURE_TENANT_ID)
```

### Using Azure Portal

1. Navigate to **Azure Active Directory** > **App registrations**
2. Click **New registration**
3. After creation, note the **Application (client) ID** and **Directory (tenant) ID**
4. Go to **Certificates & secrets** > **Client secrets** > **New client secret**
5. Copy the secret value immediately (it won't be shown again)

## What's Included

### 1. Required NPM Packages
- `@azure/identity` - Azure authentication
- `@azure/keyvault-secrets` - Example SDK client
- `@azure/storage-blob` - Example SDK client
- `dotenv` - Environment variable management

### 2. ClientSecretCredential Creation
- Basic credential creation
- Advanced options (authority host, retry, logging)
- Validation and error handling

### 3. Using with Azure SDK Clients
- Azure Key Vault example
- Azure Blob Storage example
- Pattern works with all Azure SDK clients

### 4. Best Practices
- ✅ Environment variable management
- ✅ Secret validation
- ✅ Never hardcode credentials
- ✅ Use Key Vault in production
- ✅ Proper .gitignore configuration

### 5. Error Handling
- Configuration errors (missing/invalid env vars)
- Authentication failures (invalid credentials)
- Network errors (connectivity issues)
- Retry logic with exponential backoff
- Detailed error messages

## Security Best Practices

### ✅ DO
- Use environment variables or Azure Key Vault
- Add `.env` to `.gitignore`
- Rotate secrets every 90 days
- Use Managed Identity when running in Azure
- Limit Service Principal permissions (least privilege)
- Monitor authentication logs

### ❌ DON'T
- Hardcode secrets in source code
- Commit `.env` files to git
- Use the same Service Principal across environments
- Grant excessive permissions
- Share Service Principal credentials

## Common Errors and Solutions

### "INVALID_CLIENT"
- **Cause**: Wrong client ID or client secret
- **Solution**: Verify credentials in Azure Portal

### "UNAUTHORIZED_CLIENT"
- **Cause**: Service Principal lacks required permissions
- **Solution**: Assign appropriate Azure RBAC roles

### "INVALID_TENANT"
- **Cause**: Wrong tenant ID
- **Solution**: Verify tenant ID in Azure AD

### Network Errors
- **Cause**: Cannot reach `login.microsoftonline.com`
- **Solution**: Check firewall/proxy settings

## Alternative Authentication Methods

1. **Managed Identity** (Recommended for Azure-hosted apps)
   ```typescript
   import { ManagedIdentityCredential } from '@azure/identity';
   const credential = new ManagedIdentityCredential();
   ```

2. **Certificate-based Authentication** (More secure)
   ```typescript
   import { ClientCertificateCredential } from '@azure/identity';
   const credential = new ClientCertificateCredential(
     tenantId, clientId, certificatePath
   );
   ```

3. **DefaultAzureCredential** (Tries multiple methods)
   ```typescript
   import { DefaultAzureCredential } from '@azure/identity';
   const credential = new DefaultAzureCredential();
   ```

## Resources

- [Azure Identity SDK Documentation](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/identity/identity)
- [Service Principal Documentation](https://docs.microsoft.com/azure/active-directory/develop/app-objects-and-service-principals)
- [Azure RBAC Documentation](https://docs.microsoft.com/azure/role-based-access-control/overview)
