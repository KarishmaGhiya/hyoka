# Azure DefaultAzureCredential Guide

Complete TypeScript example demonstrating Azure SDK authentication using `DefaultAzureCredential`.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Login to Azure CLI:**
   ```bash
   az login
   ```

3. **Set your Key Vault URL:**
   ```bash
   # Linux/Mac
   export KEY_VAULT_URL="https://your-keyvault.vault.azure.net"
   
   # Windows PowerShell
   $env:KEY_VAULT_URL="https://your-keyvault.vault.azure.net"
   ```

4. **Grant yourself permissions:**
   - Go to Azure Portal → Your Key Vault
   - Navigate to "Access control (IAM)"
   - Click "Add role assignment"
   - Select role: "Key Vault Secrets User"
   - Assign to your Azure user

5. **Run the example:**
   ```bash
   npm start
   ```

## What is DefaultAzureCredential?

`DefaultAzureCredential` simplifies authentication by automatically trying multiple authentication methods in order:

1. **Environment variables** (service principal)
2. **Workload Identity** (Kubernetes)
3. **Managed Identity** (Azure resources)
4. **Azure CLI** (local development)
5. **Azure PowerShell** (local development)
6. **Azure Developer CLI** (local development)

## NPM Packages Required

```json
{
  "dependencies": {
    "@azure/identity": "^4.0.0",          // Provides DefaultAzureCredential
    "@azure/keyvault-secrets": "^4.8.0"   // Example Azure SDK (Key Vault)
  }
}
```

Install for any Azure service:
- `@azure/storage-blob` - Blob Storage
- `@azure/cosmos` - Cosmos DB
- `@azure/service-bus` - Service Bus
- `@azure/data-tables` - Table Storage
- etc.

## Basic Usage

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new DefaultAzureCredential();
const client = new SecretClient("https://your-kv.vault.azure.net", credential);

const secret = await client.getSecret("my-secret");
console.log(secret.value);
```

## Credential Chain Order

DefaultAzureCredential tries each credential in this order until one succeeds:

### 1. Environment Credential
Reads from environment variables:
```bash
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### 2. Workload Identity Credential
For Kubernetes workload identity federation.

### 3. Managed Identity Credential
Automatically available on Azure resources (VM, App Service, Functions, AKS, etc.).

### 4. Azure CLI Credential
Uses your `az login` session. Perfect for local development.

### 5. Azure PowerShell Credential
Uses your `Connect-AzAccount` session.

### 6. Azure Developer CLI Credential
Uses your `azd auth login` session.

## Environment-Specific Behavior

### Local Development (VS Code)

**Setup:**
```bash
# Install Azure CLI
# https://aka.ms/azure-cli

# Login
az login

# (Optional) Set default subscription
az account set --subscription "your-subscription-id"

# Run your app - it will use Azure CLI credentials
npm start
```

**How it works:**
- `AzureCliCredential` reads your CLI login token
- Inherits your personal Azure RBAC permissions
- No secrets or configuration needed in code

### Azure-Hosted Environments

#### App Service / Functions / Container Apps

**Setup:**
1. Enable managed identity:
   - Portal → Your App Service → Identity → System assigned → On

2. Grant permissions:
   - Target resource → Access control (IAM) → Add role assignment
   - Assign appropriate role to your app's managed identity

**How it works:**
- `ManagedIdentityCredential` automatically authenticates
- Uses Azure's metadata service
- No credentials in code or configuration

#### Azure Kubernetes Service (AKS)

**Setup:**
```bash
# Enable workload identity on cluster
az aks update --name myCluster --resource-group myRG \
  --enable-oidc-issuer --enable-workload-identity
```

**How it works:**
- `WorkloadIdentityCredential` uses federated identity
- Service account tokens exchanged for Azure tokens

#### CI/CD Pipelines

**GitHub Actions example:**
```yaml
env:
  AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
  AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
  AZURE_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}

steps:
  - run: npm start
```

**How it works:**
- `EnvironmentCredential` uses service principal from env vars
- Create service principal: `az ad sp create-for-rbac`

## Troubleshooting

### Error: "Failed to retrieve a token"

**Enable detailed logging:**
```typescript
process.env.AZURE_LOG_LEVEL = "info";
const credential = new DefaultAzureCredential();
```

This shows which credentials were tried and why they failed.

### Common Issues

#### 1. Not logged into Azure CLI
```bash
# Check if logged in
az account show

# If not, login
az login
```

#### 2. Wrong subscription selected
```bash
# List subscriptions
az account list --output table

# Set default
az account set --subscription "your-subscription-id"
```

#### 3. Missing RBAC permissions
Even with valid authentication, you need permissions:
- Key Vault: "Key Vault Secrets User" role
- Storage: "Storage Blob Data Reader" role
- Cosmos DB: "Cosmos DB Account Reader Role"

Assign via: Azure Portal → Resource → Access control (IAM)

#### 4. Environment variables not set (CI/CD)
```typescript
console.log("Tenant:", process.env.AZURE_TENANT_ID ? "✅" : "❌");
console.log("Client:", process.env.AZURE_CLIENT_ID ? "✅" : "❌");
console.log("Secret:", process.env.AZURE_CLIENT_SECRET ? "✅" : "❌");
```

#### 5. Managed identity not enabled
Azure Portal → Your Resource → Identity → System assigned → Status = On

### Test Specific Credentials

```typescript
import { AzureCliCredential } from "@azure/identity";

try {
  const cred = new AzureCliCredential();
  await cred.getToken("https://management.azure.com/.default");
  console.log("✅ Azure CLI works!");
} catch (error) {
  console.error("❌ Azure CLI failed:", error.message);
}
```

## Advanced: Custom Credential Chain

```typescript
import {
  ChainedTokenCredential,
  EnvironmentCredential,
  ManagedIdentityCredential,
  AzureCliCredential
} from "@azure/identity";

// Only try these specific credentials in this order
const credential = new ChainedTokenCredential(
  new EnvironmentCredential(),
  new ManagedIdentityCredential(),
  new AzureCliCredential()
);
```

## Examples for Other Azure Services

### Blob Storage
```typescript
import { BlobServiceClient } from "@azure/storage-blob";

const credential = new DefaultAzureCredential();
const client = new BlobServiceClient(
  "https://mystorageaccount.blob.core.windows.net",
  credential
);
```

### Cosmos DB
```typescript
import { CosmosClient } from "@azure/cosmos";

const credential = new DefaultAzureCredential();
const client = new CosmosClient({
  endpoint: "https://mycosmosdb.documents.azure.com:443/",
  aadCredentials: credential
});
```

### Service Bus
```typescript
import { ServiceBusClient } from "@azure/service-bus";

const credential = new DefaultAzureCredential();
const client = new ServiceBusClient(
  "myservicebus.servicebus.windows.net",
  credential
);
```

## Best Practices

1. **Use DefaultAzureCredential for all environments** - it adapts automatically
2. **Never hardcode credentials** - let the credential chain handle it
3. **Enable managed identity in Azure** - most secure option
4. **Use Azure CLI for local dev** - simple and secure
5. **Grant minimal RBAC permissions** - principle of least privilege
6. **Enable logging when troubleshooting** - see which credential failed
7. **Test in dev environment first** - validate RBAC permissions

## Resources

- [DefaultAzureCredential Documentation](https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/defaultazurecredential)
- [Azure Identity Library](https://www.npmjs.com/package/@azure/identity)
- [Azure RBAC Documentation](https://learn.microsoft.com/azure/role-based-access-control/)
- [Managed Identity Overview](https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)

## License

MIT
