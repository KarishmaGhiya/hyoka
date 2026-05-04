# Azure Service Principal Authentication with Client Secret

A comprehensive TypeScript example demonstrating best practices for authenticating to Azure using a Service Principal with client secret credentials.

## 📦 Installation

```bash
npm install
```

## 🔧 Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Fill in your Azure credentials in `.env`:
```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

## 🚀 Usage

Run the example:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## 📋 Prerequisites

### Creating a Service Principal

Using Azure CLI:
```bash
az ad sp create-for-rbac --name "my-app-service-principal" --role Contributor --scopes /subscriptions/{subscription-id}
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

### Assigning Permissions

For Key Vault access:
```bash
az keyvault set-policy --name <vault-name> --spn <client-id> --secret-permissions get list
```

For Storage access:
```bash
az role assignment create --assignee <client-id> --role "Storage Blob Data Reader" --scope /subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Storage/storageAccounts/{storage-account}
```

## 🔒 Security Best Practices

### 1. Environment Variables
- ✅ Store credentials in environment variables
- ✅ Use `.env` files locally (add to `.gitignore`)
- ❌ Never hardcode credentials in source code
- ❌ Never commit `.env` to source control

### 2. Production Secret Management
- Use Azure Key Vault for secret storage
- Consider Azure Managed Identity when possible
- Implement secret rotation policies

### 3. Least Privilege
- Grant only necessary permissions
- Use specific RBAC roles
- Scope permissions to specific resources

### 4. Monitoring
- Enable Azure AD sign-in logs
- Set up alerts for failed authentication
- Monitor for suspicious activity

## 📚 What's Included

The example demonstrates:

1. **Required NPM Packages** - All necessary dependencies
2. **ClientSecretCredential Creation** - Proper credential initialization
3. **Azure SDK Integration** - Examples with Key Vault and Blob Storage
4. **Error Handling** - Comprehensive authentication error scenarios
5. **Best Practices** - Security patterns and secret management
6. **Retry Logic** - Handling transient failures
7. **Credential Validation** - Pre-flight credential checking
8. **Key Vault Bootstrap** - Loading secrets from Key Vault

## 🛠️ Common Error Scenarios

### 401 Unauthorized
- Verify client secret is correct
- Check if secret has expired
- Ensure service principal is active

### 403 Forbidden
- Service principal lacks necessary permissions
- Check RBAC role assignments
- Verify resource scope

### Invalid Tenant
- Verify `AZURE_TENANT_ID` is correct
- Check if using correct Azure cloud (Public, Government, etc.)

### Network Errors
- Check network connectivity
- Verify firewall rules
- Ensure Azure endpoints are accessible

## 📖 Further Reading

- [Azure Identity SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme)
- [Service Principal Authentication](https://learn.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals)
- [Azure RBAC Best Practices](https://learn.microsoft.com/en-us/azure/role-based-access-control/best-practices)
- [Secret Management in Azure](https://learn.microsoft.com/en-us/azure/key-vault/general/best-practices)
