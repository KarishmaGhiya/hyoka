# Azure Service Principal Authentication with TypeScript

This project demonstrates how to authenticate to Azure services using a Service Principal with client secret credentials using the `@azure/identity` SDK.

## Features

- ✅ Service Principal authentication with `ClientSecretCredential`
- ✅ Environment variable management with `dotenv`
- ✅ Integration with Azure Key Vault Secrets SDK
- ✅ Comprehensive error handling for authentication failures
- ✅ TypeScript with strict type checking
- ✅ Async/await throughout

## Prerequisites

1. **Azure Subscription**: You need an active Azure subscription
2. **Service Principal**: Create a Service Principal with client secret
3. **Key Vault**: An Azure Key Vault instance
4. **Permissions**: Grant the Service Principal access to the Key Vault

### Create a Service Principal

```bash
# Create a service principal
az ad sp create-for-rbac --name "my-app-sp" --role Contributor --scopes /subscriptions/{subscription-id}

# Output will include:
# - appId (AZURE_CLIENT_ID)
# - tenant (AZURE_TENANT_ID)
# - password (AZURE_CLIENT_SECRET)
```

### Grant Key Vault Access

```bash
# Assign Key Vault Secrets User role
az role assignment create \
  --assignee <AZURE_CLIENT_ID> \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.KeyVault/vaults/{vault-name}
```

## Installation

1. **Clone or download this project**

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

Create a `.env` file in the root directory:

```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
KEY_VAULT_URL=https://your-keyvault-name.vault.azure.net
```

## Usage

### Development Mode

Run with ts-node (no compilation needed):

```bash
npm run dev
```

### Production Mode

Compile TypeScript and run:

```bash
npm run build
npm start
```

## How It Works

The program performs the following steps:

1. **Load Configuration**: Reads Service Principal credentials from environment variables
2. **Create Credential**: Instantiates `ClientSecretCredential` with tenant ID, client ID, and client secret
3. **Create SDK Client**: Uses the credential to create a `SecretClient` for Azure Key Vault
4. **Verify Authentication**: Lists secrets in the Key Vault to verify the credential works
5. **Error Handling**: Catches and handles `AuthenticationError` and other exceptions

## Project Structure

```
.
├── src/
│   └── index.ts          # Main application code
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Environment variables (create this)
├── .env.example          # Example environment file
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Error Handling

The program handles several error scenarios:

### Authentication Errors
- Invalid credentials (tenant ID, client ID, or secret)
- Expired client secret
- Disabled Service Principal

### Permission Errors
- Service Principal lacks Key Vault access permissions
- Missing role assignments

### Network Errors
- Invalid Key Vault URL
- Network connectivity issues

## Dependencies

- **@azure/identity**: Azure authentication library
- **@azure/keyvault-secrets**: Azure Key Vault Secrets SDK
- **dotenv**: Environment variable management
- **typescript**: TypeScript compiler
- **ts-node**: TypeScript execution for development

## Best Practices

1. **Never commit secrets**: Keep `.env` file out of version control
2. **Use Managed Identity in production**: Prefer Managed Identity over Service Principal when running in Azure
3. **Rotate secrets regularly**: Update client secrets before they expire
4. **Principle of least privilege**: Grant only necessary permissions
5. **Monitor authentication**: Enable Azure AD sign-in logs for auditing

## Troubleshooting

### "Missing required environment variables"
- Ensure all variables in `.env` are set correctly
- Check for typos in variable names

### "Authentication Error"
- Verify Service Principal credentials are correct
- Check if client secret has expired
- Ensure Service Principal is not disabled

### "Forbidden" or "403" errors
- Grant the Service Principal appropriate Key Vault permissions
- Use Azure RBAC roles: "Key Vault Secrets User" or "Key Vault Reader"

### "ENOTFOUND" errors
- Verify the Key Vault URL is correct
- Check network connectivity to Azure

## License

MIT
