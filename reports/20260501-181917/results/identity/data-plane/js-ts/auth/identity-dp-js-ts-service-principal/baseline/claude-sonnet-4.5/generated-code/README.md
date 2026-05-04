# Azure Service Principal Authentication Example

This TypeScript program demonstrates how to authenticate to Azure using a Service Principal with client secret credentials.

## Features

- ✅ Service Principal authentication with client secret
- ✅ Environment variable management with dotenv
- ✅ Azure Key Vault integration for credential verification
- ✅ Comprehensive error handling for authentication failures
- ✅ Full TypeScript support with strict type checking
- ✅ Async/await pattern throughout

## Prerequisites

1. **Azure Service Principal**: Create a Service Principal in Azure:
   ```bash
   az ad sp create-for-rbac --name "MyAppServicePrincipal" --role contributor
   ```
   This will output your tenant ID, client ID, and client secret.

2. **Azure Key Vault**: Create a Key Vault for testing:
   ```bash
   az keyvault create --name "my-keyvault" --resource-group "my-resource-group" --location "eastus"
   ```

3. **Grant Access**: Give your Service Principal access to the Key Vault:
   ```bash
   az keyvault set-policy --name "my-keyvault" --spn <client-id> --secret-permissions get list
   ```

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```
   AZURE_TENANT_ID=your-tenant-id
   AZURE_CLIENT_ID=your-client-id
   AZURE_CLIENT_SECRET=your-client-secret
   AZURE_KEYVAULT_URL=https://your-keyvault-name.vault.azure.net
   ```

## Usage

### Development Mode (with ts-node)
```bash
npm run dev
```

### Production Mode
```bash
# Build TypeScript to JavaScript
npm run build

# Run compiled JavaScript
npm start
```

## What the Program Does

1. **Loads Environment Variables**: Reads Azure credentials from `.env` file
2. **Creates ClientSecretCredential**: Initializes the credential with tenant ID, client ID, and client secret
3. **Creates SecretClient**: Uses the credential to create an Azure Key Vault SecretClient
4. **Verifies Authentication**: Lists secrets in the Key Vault to verify the credential works
5. **Error Handling**: Catches and provides detailed messages for authentication errors

## Error Handling

The program handles various error scenarios:

- **401 Unauthorized**: Invalid credentials or expired secret
- **403 Forbidden**: Valid credentials but insufficient permissions
- **404 Not Found**: Key Vault doesn't exist or URL is incorrect
- **Network Errors**: Connection issues
- **Missing Environment Variables**: Configuration validation

## Expected Output

### Success
```
🔐 Authenticating to Azure...
Tenant ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Client ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Key Vault URL: https://my-keyvault.vault.azure.net

✅ ClientSecretCredential created successfully
✅ SecretClient initialized

🔍 Testing credential by listing secrets...
✅ Authentication successful!
Found 3 secret(s) in the Key Vault (showing max 5):
  1. my-secret-1
  2. my-secret-2
  3. my-secret-3

🎉 Service Principal authentication completed successfully!
```

### Authentication Failure
```
❌ An error occurred:

🔒 AUTHENTICATION ERROR (401 Unauthorized)
The provided Service Principal credentials are invalid or expired.

Please verify:
  • AZURE_TENANT_ID is correct
  • AZURE_CLIENT_ID is correct
  • AZURE_CLIENT_SECRET is correct and not expired
  • The Service Principal has been granted access to the Key Vault
```

## Dependencies

- **@azure/identity**: Azure authentication library
- **@azure/keyvault-secrets**: Azure Key Vault client
- **dotenv**: Environment variable management
- **typescript**: TypeScript compiler
- **ts-node**: TypeScript execution for development

## Security Best Practices

1. **Never commit `.env` file**: It's included in `.gitignore`
2. **Rotate secrets regularly**: Update client secrets periodically
3. **Use least privilege**: Grant only necessary permissions
4. **Consider managed identity**: For Azure-hosted applications, prefer Managed Identity over Service Principal
5. **Monitor access**: Enable Azure logging to track authentication attempts

## License

MIT
