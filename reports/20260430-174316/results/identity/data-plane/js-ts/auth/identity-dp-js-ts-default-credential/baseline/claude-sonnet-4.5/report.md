# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** baseline/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 33.4s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | baseline/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 33.4s |
| Timestamp | 2026-05-01T00:44:24Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 33.3s |
| **Total** | **33.4s** |

## Configuration

- **model:** claude-sonnet-4.5
- **name:** baseline/claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=16554 out=1885 |
| Turn Count | 1 |

## Error

```
0 files generated — agent did not create any files
```

## Prompt Sent

```
Show me how to
authenticate an Azure SDK client using DefaultAzureCredential. Explain:
1. What npm packages are needed
2. How to create and use a DefaultAzureCredential instance
3. The credential chain order and which credentials are tried
4. How it works in local dev (VS Code, Azure CLI) vs Azure-hosted environments
5. How to troubleshoot authentication failures

Provide a complete TypeScript example that creates a SecretClient using
DefaultAzureCredential.
```

## Copilot Reasoning

The user is asking me to explain how to authenticate an Azure SDK client using DefaultAzureCredential. This is a straightforward documentation/tutorial request that I can handle directly without needing to explore any existing codebase or use specialized skills.

I should provide:
1. Required npm packages
2. How to create and use DefaultAzureCredential
3. Credential chain order
4. Local dev vs Azure-hosted behavior
5. Troubleshooting tips
6. A complete TypeScript example with SecretClient

This is a knowledge-based response that doesn't require tool usage - I can provide this information directly from my knowledge of Azure SDK.

## Copilot Response

I'll provide you with a comprehensive guide on using `DefaultAzureCredential` in TypeScript to authenticate Azure SDK clients.

## 1. Required npm Packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- `@azure/identity` - Provides DefaultAzureCredential and other credential types
- `@azure/keyvault-secrets` - Example Azure SDK client (for the SecretClient example)

## 2. Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

async function main() {
  // Create DefaultAzureCredential instance
  const credential = new DefaultAzureCredential();
  
  // Use it with any Azure SDK client
  const keyVaultUrl = "https://your-keyvault-name.vault.azure.net";
  const client = new SecretClient(keyVaultUrl, credential);
  
  try {
    // Attempt to use the client
    const secret = await client.getSecret("my-secret-name");
    console.log(`Secret value: ${secret.value}`);
  } catch (error) {
    console.error("Authentication or access failed:", error.message);
  }
}

main();
```

## 3. Credential Chain Order

`DefaultAzureCredential` tries credentials in this specific order:

1. **EnvironmentCredential** - Environment variables:
   - `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` (service principal)
   - `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_CERTIFICATE_PATH` (certificate)
   - `AZURE_CLIENT_ID`, `AZURE_USERNAME`, `AZURE_PASSWORD` (username/password)

2. **WorkloadIdentityCredential** - Azure Kubernetes Service workload identity

3. **ManagedIdentityCredential** - Azure-hosted resources:
   - App Service, Azure Functions, Virtual Machines, Container Apps, etc.
   - Uses system-assigned or user-assigned managed identity

4. **AzureCliCredential** - Uses credentials from Azure CLI (`az login`)

5. **AzurePowerShellCredential** - Uses credentials from Azure PowerShell

6. **AzureDeveloperCliCredential** - Uses credentials from Azure Developer CLI (`azd auth login`)

**It stops at the first credential that successfully authenticates.**

## 4. Local Dev vs Azure-Hosted Environments

### **Local Development:**

**VS Code:**
- Install Azure CLI or Azure PowerShell
- Run `az login` or `Connect-AzAccount`
- DefaultAzureCredential will use `AzureCliCredential` or `AzurePowerShellCredential`

**Environment Variables (recommended for CI/CD):**
```bash
# Set these for service principal authentication
AZURE_CLIENT_ID=your-app-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_SECRET=your-secret
```

### **Azure-Hosted Environments:**

**App Service / Functions / VMs:**
- Enable Managed Identity in Azure portal
- No code changes needed - DefaultAzureCredential automatically detects it
- Uses `ManagedIdentityCredential` transparently

**Benefits:**
- ✅ No secrets in code or config files
- ✅ Same code works locally and in Azure
- ✅ Automatic credential rotation (managed identity)

## 5. Troubleshooting Authentication Failures

### **Enable Detailed Logging:**

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { setLogLevel } from "@azure/logger";

// Enable verbose logging
setLogLevel("info");

const credential = new DefaultAzureCredential({
  // Exclude credentials to narrow down issues
  excludeEnvironmentCredential: false,
  excludeManagedIdentityCredential: false,
  excludeAzureCliCredential: false,
  excludeAzurePowerShellCredential: true,
});
```

### **Common Issues:**

| Problem | Solution |
|---------|----------|
| `CredentialUnavailableError` | No credentials available in the chain. Run `az login` locally or enable Managed Identity in Azure |
| `AuthenticationFailedError` | Credential found but failed. Check permissions (RBAC roles) on the resource |
| `AADSTS` errors | Azure AD issues. Check tenant ID, client ID, or secret validity |
| Timeout in Azure | Managed Identity may not be enabled. Check App Service → Identity → Status = On |
| Works locally, fails in Azure | Check that Managed Identity has proper RBAC roles (e.g., "Key Vault Secrets User") |

### **Testing Specific Credentials:**

```typescript
// Test Azure CLI only
import { AzureCliCredential } from "@azure/identity";
const cliCredential = new AzureCliCredential();

// Test Managed Identity only
import { ManagedIdentityCredential } from "@azure/identity";
const managedIdentity = new ManagedIdentityCredential();
```

### **Check Azure CLI Status:**

```bash
# Verify Azure CLI is logged in
az account show

# Login if needed
az login
```

## Complete Production-Ready Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { setLogLevel } from "@azure/logger";

async function createSecretClient(): Promise<SecretClient> {
  // Enable logging for troubleshooting (remove in production)
  if (process.env.NODE_ENV === "development") {
    setLogLevel("info");
  }

  // Create credential with optional configuration
  const credential = new DefaultAzureCredential({
    // Optional: Use specific managed identity
    managedIdentityClientId: process.env.AZURE_CLIENT_ID,
  });

  const keyVaultUrl = process.env.KEY_VAULT_URL || 
                      "https://your-keyvault.vault.azure.net";

  return new SecretClient(keyVaultUrl, credential);
}

async function main() {
  try {
    const client = await createSecretClient();
    
    // Use the client
    const secret = await client.getSecret("database-connection-string");
    console.log("✅ Successfully authenticated and retrieved secret");
    
    // Use secret.value in your application
    
  } catch (error: any) {
    if (error.code === "CredentialUnavailableError") {
      console.error("❌ No credentials available. Run 'az login' or configure environment variables.");
    } else if (error.statusCode === 403) {
      console.error("❌ Access denied. Check RBAC permissions on Key Vault.");
    } else {
      console.error("❌ Authentication failed:", error.message);
    }
    process.exit(1);
  }
}

main();
```

This approach provides **zero-trust authentication** with no hardcoded credentials, working seamlessly from local development to production Azure environments.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config baseline/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
