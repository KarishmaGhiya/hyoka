# Azure Service Principal Authentication with TypeScript

This project demonstrates how to authenticate to Azure using a Service Principal with client secret credentials using the `@azure/identity` package.

## Features

- ✅ ClientSecretCredential authentication
- ✅ Environment variable management with dotenv
- ✅ Azure Key Vault integration for verification
- ✅ Comprehensive error handling for AuthenticationError
- ✅ Full TypeScript support with async/await

## Prerequisites

1. **Azure Service Principal**: Create a Service Principal with client secret
2. **Azure Key Vault**: A Key Vault instance for testing authentication
3. **Node.js**: Version 18 or higher
4. **Permissions**: Service Principal must have access to the Key Vault

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Azure credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here
AZURE_KEYVAULT_URL=https://your-keyvault-name.vault.azure.net/
```

### 3. Grant Key Vault Permissions

Ensure your Service Principal has the following permissions on the Key Vault:

```bash
# Using Azure CLI
az keyvault set-policy \
  --name <your-keyvault-name> \
  --spn <your-client-id> \
  --secret-permissions get list
```

Or use Azure RBAC:

```bash
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee <your-client-id> \
  --scope /subscriptions/<subscription-id>/resourceGroups/<rg-name>/providers/Microsoft.KeyVault/vaults/<vault-name>
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

## How It Works

1. **Load Environment Variables**: Uses `dotenv` to read credentials from `.env` file
2. **Create Credential**: Instantiates `ClientSecretCredential` with tenant ID, client ID, and client secret
3. **Initialize SDK Client**: Creates a `SecretClient` from `@azure/keyvault-secrets`
4. **Verify Authentication**: Lists secrets in Key Vault to confirm the credential works
5. **Error Handling**: Catches `AuthenticationError` for invalid credentials with helpful troubleshooting tips

## Error Handling

The program handles various error scenarios:

- **Missing environment variables**: Clear error message indicating which variables are required
- **AuthenticationError**: Specific handling for authentication failures with troubleshooting tips
- **Key Vault access errors**: Guidance on permissions and network access
- **General errors**: Graceful error handling with descriptive messages

## Expected Output

### Success

```
Starting Azure Service Principal authentication...

✓ Environment variables loaded
  Tenant ID: 12345678...
  Client ID: abcdefgh...
  Key Vault URL: https://my-vault.vault.azure.net/

Creating ClientSecretCredential...
✓ ClientSecretCredential created

Creating SecretClient for Key Vault...
✓ SecretClient created

Testing authentication by listing secrets...
✓ Authentication successful!
  Found 3 secret(s) in Key Vault
  Secrets:
    - database-password
    - api-key
    - connection-string

✅ Service Principal authentication test completed successfully!
```

### Authentication Failure

```
❌ Authentication failed!
Error details:
  Message: Client authentication failed
  Error Code: AuthenticationError

Possible causes:
  - Invalid tenant ID, client ID, or client secret
  - Service Principal doesn't have access to the Key Vault
  - Service Principal might be disabled or expired
  - Incorrect Azure environment or authority host
```

## Project Structure

```
.
├── src/
│   └── index.ts          # Main application code
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Environment variables (not committed)
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Dependencies

- **@azure/identity**: Azure authentication library
- **@azure/keyvault-secrets**: Azure Key Vault SDK for testing
- **dotenv**: Environment variable management
- **typescript**: TypeScript compiler
- **ts-node**: TypeScript execution for development

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use Managed Identity** in production when running on Azure (VM, App Service, Functions, etc.)
3. **Rotate secrets regularly** using Azure Key Vault
4. **Use least privilege** for Service Principal permissions
5. **Consider using certificate-based authentication** for higher security

## Alternative Authentication Methods

This example uses `ClientSecretCredential`, but `@azure/identity` supports many credential types:

- **DefaultAzureCredential**: Best for both development and production
- **ManagedIdentityCredential**: For Azure-hosted applications
- **ClientCertificateCredential**: Certificate-based Service Principal auth
- **AzureCliCredential**: Uses `az login` credentials
- **InteractiveBrowserCredential**: Browser-based login for user apps

## Troubleshooting

### "Authentication failed"
- Verify tenant ID, client ID, and client secret are correct
- Check if Service Principal is active in Azure AD

### "Key Vault access denied"
- Ensure Service Principal has Key Vault permissions
- Check Key Vault firewall settings
- Verify the Key Vault URL is correct

### "Module not found"
- Run `npm install` to install dependencies
- Ensure Node.js version 18+ is installed

## Resources

- [Azure Identity SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/@azure/identity)
- [Service Principal Authentication](https://learn.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal)
- [Azure Key Vault SDK](https://learn.microsoft.com/en-us/javascript/api/@azure/keyvault-secrets)

## License

MIT
