# DefaultAzureCredential Guide for TypeScript/JavaScript

## 3. Credential Chain Order

`DefaultAzureCredential` tries the following credentials **in this exact order**:

### Chain Sequence:
1. **EnvironmentCredential**
   - Reads environment variables: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` (or `AZURE_CLIENT_CERTIFICATE_PATH`)
   - Use for: CI/CD pipelines, containerized apps with injected secrets

2. **WorkloadIdentityCredential**
   - Uses Azure Workload Identity (federated credentials for Kubernetes)
   - Requires: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_FEDERATED_TOKEN_FILE`
   - Use for: Azure Kubernetes Service (AKS) with workload identity

3. **ManagedIdentityCredential**
   - Uses system-assigned or user-assigned managed identity
   - Available in: Azure VMs, App Service, Functions, Container Apps, AKS
   - Use for: Production Azure-hosted applications

4. **AzureCliCredential**
   - Uses credentials from `az login`
   - Available: Where Azure CLI is installed and authenticated
   - Use for: Local development, scripts, automation

5. **AzurePowerShellCredential**
   - Uses credentials from `Connect-AzAccount`
   - Available: Where Azure PowerShell is installed and authenticated
   - Use for: PowerShell scripts, Windows development

6. **AzureDeveloperCliCredential**
   - Uses credentials from `azd auth login`
   - Available: Where Azure Developer CLI is installed and authenticated
   - Use for: Azure Developer CLI projects

7. **VisualStudioCodeCredential**
   - Uses Azure Account extension credentials in VS Code
   - Available: When VS Code Azure Account extension is signed in
   - Use for: VS Code local development

**Note**: The chain stops at the first successful credential. If all fail, an error is thrown.

---

## 4. Environment-Specific Behavior

### 🖥️ Local Development Environments

#### Option 1: Azure CLI (Recommended)
```bash
# Install Azure CLI
# Windows: winget install Microsoft.AzureCLI
# Mac: brew install azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Verify authentication
az account show

# Your app will automatically use these credentials via AzureCliCredential
```

#### Option 2: Visual Studio Code
```bash
# Install Azure Account extension in VS Code
# Sign in through: View -> Command Palette -> "Azure: Sign In"

# Your app will automatically use these credentials via VisualStudioCodeCredential
```

#### Option 3: Environment Variables
```bash
# Set service principal credentials
export AZURE_CLIENT_ID="your-client-id"
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_SECRET="your-client-secret"

# Your app will use these via EnvironmentCredential
```

### ☁️ Azure-Hosted Environments

#### Azure App Service / Functions
1. Enable managed identity:
   ```bash
   az webapp identity assign --name your-app --resource-group your-rg
   ```

2. Grant permissions (example for Key Vault):
   ```bash
   az keyvault set-policy \
     --name your-keyvault \
     --object-id <managed-identity-object-id> \
     --secret-permissions get list
   ```

3. No code changes needed - `ManagedIdentityCredential` works automatically

#### Azure Virtual Machines
1. Enable managed identity:
   ```bash
   az vm identity assign --name your-vm --resource-group your-rg
   ```

2. Grant RBAC roles:
   ```bash
   az role assignment create \
     --assignee <managed-identity-principal-id> \
     --role "Key Vault Secrets User" \
     --scope /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/{vault}
   ```

#### Azure Kubernetes Service (AKS)
Use Workload Identity (modern approach):
```yaml
# Service account configuration
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-service-account
  annotations:
    azure.workload.identity/client-id: "your-client-id"
```

Set environment variables in your pod:
```yaml
env:
- name: AZURE_CLIENT_ID
  value: "your-client-id"
- name: AZURE_TENANT_ID
  value: "your-tenant-id"
- name: AZURE_FEDERATED_TOKEN_FILE
  value: "/var/run/secrets/azure/tokens/azure-identity-token"
```

---

## 5. Troubleshooting Authentication Failures

### Enable Debug Logging

```typescript
import { setLogLevel } from "@azure/logger";

// Enable verbose logging
setLogLevel("info"); // Options: "verbose", "info", "warning", "error"

const credential = new DefaultAzureCredential({
  loggingOptions: {
    allowLoggingAccountIdentifiers: true,
    logLevel: "info"
  }
});
```

### Common Issues & Solutions

#### ❌ Issue: "No available credentials found"

**Symptoms:**
```
CredentialUnavailableError: DefaultAzureCredential failed to retrieve a token from the included credentials.
```

**Solutions:**
1. **Local Dev**: Run `az login` or sign into VS Code Azure Account extension
2. **Azure-hosted**: Enable managed identity on your resource
3. **CI/CD**: Set `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` env variables

**Verify:**
```bash
# Check Azure CLI login
az account show

# Test token acquisition
az account get-access-token --resource https://management.azure.com/
```

#### ❌ Issue: 403 Forbidden

**Symptoms:**
```
Request failed with status code 403
```

**Solutions:**
- Authentication succeeded, but authorization failed
- Grant appropriate RBAC role or access policy:

```bash
# Key Vault example - RBAC approach (recommended)
az role assignment create \
  --assignee <your-user-or-service-principal-id> \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/{vault}

# Key Vault example - Access Policy approach (legacy)
az keyvault set-policy \
  --name your-keyvault \
  --object-id <object-id> \
  --secret-permissions get list
```

#### ❌ Issue: "Timeout waiting for managed identity"

**Symptoms:**
```
ManagedIdentityCredential: Timeout waiting for response from Azure Instance Metadata Service
```

**Solutions:**
1. Verify managed identity is enabled:
   ```bash
   az webapp identity show --name your-app --resource-group your-rg
   ```

2. If not in Azure, exclude ManagedIdentityCredential:
   ```typescript
   const credential = new DefaultAzureCredential({
     excludeManagedIdentityCredential: true
   });
   ```

#### ❌ Issue: Multi-tenant scenarios

**Symptoms:**
- Need to authenticate against a specific tenant
- Cross-tenant access denied

**Solutions:**
```typescript
const credential = new DefaultAzureCredential({
  tenantId: "specific-tenant-id"
});
```

#### ❌ Issue: User-assigned managed identity

**Symptoms:**
- Multiple managed identities assigned
- Wrong identity being used

**Solutions:**
```typescript
const credential = new DefaultAzureCredential({
  managedIdentityClientId: "your-user-assigned-identity-client-id"
});
```

### Diagnostic Script

```typescript
import { DefaultAzureCredential, ChainedTokenCredential } from "@azure/identity";
import { setLogLevel } from "@azure/logger";

async function diagnoseAuthentication() {
  setLogLevel("verbose");
  
  console.log("Testing DefaultAzureCredential chain...\n");
  
  const credential = new DefaultAzureCredential();
  const scope = "https://management.azure.com/.default";
  
  try {
    const token = await credential.getToken(scope);
    console.log("✅ Authentication successful!");
    console.log(`Token expires: ${new Date(token.expiresOnTimestamp)}`);
  } catch (error) {
    console.error("❌ Authentication failed:");
    console.error(error.message);
    console.error("\nCheck the following:");
    console.error("1. Run 'az login' if developing locally");
    console.error("2. Enable managed identity if running in Azure");
    console.error("3. Set AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET if using service principal");
  }
}

diagnoseAuthentication();
```

### Environment Variable Quick Reference

```bash
# Service Principal (Client Secret)
AZURE_CLIENT_ID=<client-id>
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_SECRET=<client-secret>

# Service Principal (Certificate)
AZURE_CLIENT_ID=<client-id>
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_CERTIFICATE_PATH=/path/to/cert.pem

# Workload Identity (AKS)
AZURE_CLIENT_ID=<client-id>
AZURE_TENANT_ID=<tenant-id>
AZURE_FEDERATED_TOKEN_FILE=/var/run/secrets/azure/tokens/azure-identity-token

# User-assigned Managed Identity
AZURE_CLIENT_ID=<managed-identity-client-id>
```

---

## Best Practices

1. **Use DefaultAzureCredential for most scenarios** - it handles dev and prod automatically
2. **Reuse credential instances** - they cache tokens internally
3. **Use managed identities in production** - most secure, no secrets to manage
4. **Grant least-privilege permissions** - use RBAC roles or access policies appropriately
5. **Enable logging during troubleshooting** - use `@azure/logger` package
6. **Handle authentication errors gracefully** - distinguish between auth (401) and authz (403) errors
7. **Use environment-specific credentials explicitly** if needed:
   ```typescript
   import { AzureCliCredential, ManagedIdentityCredential } from "@azure/identity";
   
   const credential = process.env.NODE_ENV === "production"
     ? new ManagedIdentityCredential()
     : new AzureCliCredential();
   ```

---

## Additional Resources

- [Azure Identity SDK Documentation](https://learn.microsoft.com/javascript/api/@azure/identity)
- [Azure SDK for JavaScript/TypeScript](https://azure.github.io/azure-sdk-for-js/)
- [Managed Identity Overview](https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)
- [Azure RBAC Roles](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles)
