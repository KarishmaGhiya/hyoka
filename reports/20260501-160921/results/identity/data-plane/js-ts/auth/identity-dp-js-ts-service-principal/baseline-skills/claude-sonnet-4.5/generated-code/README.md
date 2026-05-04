# Azure Service Principal Authentication with TypeScript

Complete example demonstrating Service Principal authentication using client secrets in Node.js/TypeScript.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env`:

```
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### 3. Run the Example

```bash
npm start
```

## Creating a Service Principal

If you don't have a Service Principal yet, create one using Azure CLI:

```bash
# Login to Azure
az login

# Create a Service Principal
az ad sp create-for-rbac --name "my-app-service-principal" --role Contributor

# Output will include:
# - appId (this is your AZURE_CLIENT_ID)
# - password (this is your AZURE_CLIENT_SECRET)
# - tenant (this is your AZURE_TENANT_ID)
```

## Required NPM Packages

- **@azure/identity**: Authentication library providing ClientSecretCredential
- **@azure/keyvault-secrets**: Example Azure SDK client (Key Vault)
- **@azure/storage-blob**: Example Azure SDK client (Blob Storage)

## Key Concepts

### ClientSecretCredential

```typescript
import { ClientSecretCredential } from "@azure/identity";

const credential = new ClientSecretCredential(
  tenantId,    // Azure AD tenant ID
  clientId,    // Application (client) ID
  clientSecret // Client secret value
);
```

### Using with Azure SDK Clients

All Azure SDK clients accept a credential in their constructor:

```typescript
import { SecretClient } from "@azure/keyvault-secrets";

const client = new SecretClient(vaultUrl, credential);
```

## Security Best Practices

### ✅ DO

- Store secrets in Azure Key Vault
- Use environment variables for local development
- Use Managed Identity when possible (eliminates secrets entirely)
- Rotate secrets regularly
- Use separate service principals for different environments
- Set appropriate RBAC permissions (principle of least privilege)
- Add `.env` to `.gitignore`

### ❌ DON'T

- Hard-code secrets in source code
- Commit secrets to version control
- Share secrets via email or chat
- Use the same service principal across all environments
- Grant excessive permissions

## Error Handling

The example includes comprehensive error handling for:

- Invalid credentials
- Expired secrets
- Network errors
- Azure AD error codes (AADSTS*)
- Transient failures with retry logic

## Common Azure AD Error Codes

- **AADSTS7000215**: Invalid client secret
- **AADSTS700016**: Invalid client ID (application not found)
- **AADSTS90002**: Invalid tenant ID
- **AADSTS50057**: Service principal is disabled or deleted

## Alternative: DefaultAzureCredential

For production applications, consider using `DefaultAzureCredential` which automatically tries multiple authentication methods:

```typescript
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();
```

This tries authentication methods in this order:
1. Environment variables (including client secret)
2. Managed Identity
3. Azure CLI
4. Azure PowerShell
5. Interactive browser

## Resources

- [Azure Identity SDK Documentation](https://learn.microsoft.com/javascript/api/overview/azure/identity-readme)
- [Azure SDK for JavaScript](https://learn.microsoft.com/javascript/azure/)
- [Service Principal Authentication](https://learn.microsoft.com/azure/active-directory/develop/howto-create-service-principal-portal)
