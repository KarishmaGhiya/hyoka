# Azure Service Principal Authentication with TypeScript

This project demonstrates how to authenticate to Azure using a Service Principal with client secret using TypeScript and the Azure Identity SDK.

## Features

- ✅ Authenticates using ClientSecretCredential from @azure/identity
- ✅ Reads credentials from environment variables using dotenv
- ✅ Demonstrates usage with Azure Key Vault SecretClient
- ✅ Comprehensive error handling for authentication failures
- ✅ Full TypeScript support with type safety
- ✅ Async/await throughout

## Prerequisites

- Node.js (v18 or higher recommended)
- An Azure subscription
- An Azure Service Principal with client secret
- An Azure Key Vault (for testing the credential)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create a Service Principal

If you don't have a Service Principal, create one using Azure CLI:

```bash
az ad sp create-for-rbac --name "my-app-service-principal" --role contributor
```

This will output:
```json
{
  "appId": "your-client-id",
  "displayName": "my-app-service-principal",
  "password": "your-client-secret",
  "tenant": "your-tenant-id"
}
```

### 3. Create a Key Vault (if needed)

```bash
az keyvault create --name "your-keyvault-name" --resource-group "your-resource-group" --location "eastus"
```

### 4. Grant Service Principal Access to Key Vault

```bash
az keyvault set-policy --name "your-keyvault-name" --spn "your-client-id" --secret-permissions get list
```

### 5. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_KEYVAULT_URL=https://your-keyvault-name.vault.azure.net/
```

## Usage

### Development Mode (with ts-node)

```bash
npm run dev
```

### Production Mode

Build and run:

```bash
npm run build
npm start
```

## How It Works

1. **Environment Variables**: The application loads credentials from environment variables using dotenv
2. **ClientSecretCredential**: Creates a credential object with tenant ID, client ID, and client secret
3. **Azure SDK Client**: Initializes a SecretClient for Azure Key Vault using the credential
4. **Verification**: Lists secrets in the Key Vault to verify authentication works
5. **Error Handling**: Catches and handles AuthenticationError and other errors with helpful messages

## Error Handling

The application handles various error scenarios:

- **AuthenticationError**: Invalid credentials or access issues
- **Network Errors**: Connection problems or incorrect URLs
- **Permission Errors**: Service Principal lacks required permissions
- **Missing Environment Variables**: Required configuration not provided

## Security Best Practices

- ✅ Never commit `.env` file to version control
- ✅ Use Azure Key Vault to store secrets in production
- ✅ Rotate client secrets regularly
- ✅ Follow principle of least privilege for Service Principal permissions
- ✅ Use Managed Identities when possible (for Azure-hosted applications)

## Project Structure

```
.
├── src/
│   └── index.ts          # Main application code
├── dist/                 # Compiled JavaScript (generated)
├── .env.example          # Example environment variables
├── .gitignore           # Git ignore patterns
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## Dependencies

- **@azure/identity**: Azure authentication library
- **@azure/keyvault-secrets**: Azure Key Vault client
- **dotenv**: Environment variable management
- **typescript**: TypeScript compiler
- **ts-node**: TypeScript execution for development

## Troubleshooting

### "Missing required environment variables"
- Ensure `.env` file exists and contains all required variables
- Check that variable names match exactly

### "Authentication Error"
- Verify tenant ID, client ID, and client secret are correct
- Ensure Service Principal exists and is not disabled
- Check that Service Principal has access to the Key Vault

### "Access Forbidden" (403)
- Grant appropriate permissions to the Service Principal
- Update Key Vault access policies

## License

MIT
