# Azure Managed Identity Examples for Node.js/TypeScript

Comprehensive examples demonstrating how to use Managed Identity to authenticate Azure SDK clients in Node.js applications.

## 📚 Contents

1. **Main Guide**: [`azure-managed-identity-guide.md`](./azure-managed-identity-guide.md)
   - Complete documentation covering all aspects of Managed Identity
   - System-assigned vs user-assigned comparison
   - Common pitfalls and error handling
   - Best practices

2. **Examples**:
   - [`system-assigned-example.ts`](./examples/system-assigned-example.ts) - System-assigned identity usage
   - [`user-assigned-example.ts`](./examples/user-assigned-example.ts) - User-assigned identity with all three methods
   - [`local-development.ts`](./examples/local-development.ts) - Local development fallback strategies

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure your Azure resources:

```bash
cp .env.example .env
```

Edit `.env` with your Azure resource details:
- Key Vault URL
- Storage account name
- Managed identity client IDs
- etc.

### Running Examples

```bash
# System-assigned managed identity example
npm run system-assigned

# User-assigned managed identity example
npm run user-assigned

# Local development strategies
npm run local-dev
```

## 📖 Key Concepts

### System-Assigned Managed Identity

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// Simple - no configuration needed
const credential = new ManagedIdentityCredential();
```

- Automatically created with Azure resource
- Tied to resource lifecycle
- One per resource

### User-Assigned Managed Identity

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// Specify which identity to use
const credential = new ManagedIdentityCredential({
  clientId: "00000000-0000-0000-0000-000000000000"
});
```

- Created as standalone Azure resource
- Can be shared across multiple resources
- Survives resource deletion

### Local Development

```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Works in both Azure and locally
const credential = new DefaultAzureCredential();
```

Automatically tries:
1. Environment variables (service principal)
2. Managed Identity (in Azure)
3. Azure CLI (`az login`)
4. VS Code Azure extension

## 🔧 Prerequisites

### For Azure Deployment
1. Azure resource with Managed Identity enabled
2. Appropriate role assignments (e.g., "Key Vault Secrets User")

### For Local Development
1. Azure CLI installed: https://docs.microsoft.com/cli/azure/install-azure-cli
2. Logged in: `az login`
3. Access to the same Azure resources

## 🔑 Role Assignments

Assign appropriate roles to your managed identity:

```bash
# Key Vault access
az role assignment create \
  --assignee <identity-principal-id> \
  --role "Key Vault Secrets User" \
  --scope <key-vault-resource-id>

# Storage Blob access
az role assignment create \
  --assignee <identity-principal-id> \
  --role "Storage Blob Data Contributor" \
  --scope <storage-account-resource-id>

# Service Bus access
az role assignment create \
  --assignee <identity-principal-id> \
  --role "Azure Service Bus Data Owner" \
  --scope <service-bus-resource-id>
```

## ⚠️ Common Issues

### "No managed identity credential available"
- Ensure Managed Identity is enabled on your Azure resource
- Verify you're running on Azure (VM, App Service, Function, etc.)

### 403 Forbidden
- Check role assignments
- Ensure the identity has the required permissions
- May take a few minutes for role assignments to propagate

### Local development not working
- Run `az login` to authenticate
- Verify you have access to the Azure resources
- Check that resource URLs are correct in `.env`

## 📦 Dependencies

```json
{
  "@azure/identity": "^4.0.0",
  "@azure/keyvault-secrets": "^4.7.0",
  "@azure/storage-blob": "^12.17.0",
  "@azure/service-bus": "^7.9.0",
  "@azure/cosmos": "^4.0.0"
}
```

## 🎯 Best Practices

1. ✅ Use `DefaultAzureCredential` for most scenarios
2. ✅ Always specify `clientId` for user-assigned identity with multiple identities
3. ✅ Handle 403 errors gracefully with helpful messages
4. ✅ Test locally with Azure CLI before deploying
5. ✅ Use environment variables for configuration
6. ✅ Implement retry logic for transient failures
7. ✅ Follow principle of least privilege for role assignments
8. ✅ Log authentication attempts for debugging
9. ✅ Validate credentials during application startup
10. ✅ Document required role assignments in deployment guides

## 📚 Additional Resources

- [Azure Managed Identity Documentation](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/)
- [Azure Identity SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/identity/identity)
- [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)

## 📄 License

MIT
