# Azure Service Principal Authentication with TypeScript

Complete example demonstrating how to authenticate to Azure using a Service Principal with client secret in Node.js/TypeScript.

## Prerequisites

- Node.js 18+ and npm
- Azure subscription
- Service Principal with client secret

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Create Service Principal (if you don't have one):**
```bash
az ad sp create-for-rbac \
  --name "my-app-sp" \
  --role "Contributor" \
  --scopes /subscriptions/<subscription-id>
```

Save the output values:
- `appId` → Client ID
- `password` → Client Secret  
- `tenant` → Tenant ID

3. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_KEYVAULT_URL=https://your-keyvault.vault.azure.net/
```

4. **Run the example:**
```bash
# Development mode
npm run dev

# Or build and run
npm run build
npm start
```

## Project Structure

```
├── azure-service-principal-auth.ts  # Main implementation
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── .env.example                     # Environment template
├── BEST-PRACTICES.md               # Security best practices
└── README.md                        # This file
```

## Key Features

✅ **ClientSecretCredential** creation  
✅ **Environment-based** configuration  
✅ **Comprehensive error** handling  
✅ **Azure SDK client** usage example  
✅ **Token validation** testing  
✅ **Best practices** for secret management  

## Usage Examples

### Basic Authentication
```typescript
import { ClientSecretCredential } from '@azure/identity';

const credential = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID!,
  process.env.AZURE_CLIENT_ID!,
  process.env.AZURE_CLIENT_SECRET!
);
```

### With Azure Key Vault
```typescript
import { SecretClient } from '@azure/keyvault-secrets';

const client = new SecretClient(vaultUrl, credential);
const secret = await client.getSecret('my-secret');
```

### With Azure Storage
```typescript
import { BlobServiceClient } from '@azure/storage-blob';

const blobClient = new BlobServiceClient(
  'https://mystorageaccount.blob.core.windows.net',
  credential
);
```

### With Azure Resource Management
```typescript
import { ResourceManagementClient } from '@azure/arm-resources';

const resourceClient = new ResourceManagementClient(
  credential,
  subscriptionId
);
```

## Error Handling

The example includes handling for:
- Invalid credentials (AADSTS7000215)
- Application not found (AADSTS700016)
- Network errors (ENOTFOUND, ETIMEDOUT)
- Authorization errors (Forbidden)
- Token expiration

## Security Best Practices

See [BEST-PRACTICES.md](BEST-PRACTICES.md) for comprehensive security guidance:

- ✅ Store secrets in environment variables
- ✅ Use Azure Key Vault for production
- ✅ Rotate secrets regularly (90 days)
- ✅ Implement least privilege access
- ✅ Never commit secrets to git
- ✅ Use Managed Identity when possible

## Troubleshooting

### "Invalid client secret"
- Verify the secret is correct and not expired
- Generate a new secret in Azure Portal

### "Application not found"
- Check the Client ID and Tenant ID
- Verify the Service Principal exists

### "Forbidden" errors
- Ensure the Service Principal has required RBAC roles
- Check access policies (for Key Vault)

### Network errors
- Verify internet connectivity
- Check firewall/proxy settings

## Additional Resources

- [Azure Identity SDK](https://learn.microsoft.com/en-us/javascript/api/@azure/identity)
- [Service Principals](https://learn.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals)
- [Azure RBAC](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview)

## License

MIT
