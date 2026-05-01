# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** azure-mcp/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 41.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | azure-mcp/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 41.0s |
| Timestamp | 2026-04-30T23:20:56Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 40.9s |
| **Total** | **41.0s** |

## Configuration

- **name:** azure-mcp/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=35042 out=2112 |
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

The user is asking for information about authenticating Azure SDK clients using DefaultAzureCredential in TypeScript/JavaScript. This is a documentation/educational request about Azure identity and authentication.

Let me provide a comprehensive explanation with code examples. I should:
1. List the npm packages needed
2. Show how to create and use DefaultAzureCredential
3. Explain the credential chain order
4. Explain how it works in different environments
5. Provide troubleshooting guidance
6. Give a complete TypeScript example with SecretClient

This doesn't require any file operations or code changes - just a comprehensive response with examples.

## Copilot Response

I'll provide a comprehensive guide to using `DefaultAzureCredential` with Azure SDK in TypeScript.

## 1. Required npm Packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- **`@azure/identity`**: Provides authentication capabilities including `DefaultAzureCredential`
- **`@azure/keyvault-secrets`**: Example Azure service SDK (SecretClient)

## 2. Creating and Using DefaultAzureCredential

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// Create credential instance
const credential = new DefaultAzureCredential();

// Use with any Azure SDK client
const keyVaultUrl = "https://your-keyvault.vault.azure.net";
const client = new SecretClient(keyVaultUrl, credential);

// Use the client
const secret = await client.getSecret("mySecretName");
console.log(`Secret value: ${secret.value}`);
```

## 3. Credential Chain Order

`DefaultAzureCredential` tries credentials in this order until one succeeds:

1. **EnvironmentCredential** - Environment variables (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`)
2. **WorkloadIdentityCredential** - Azure Kubernetes workload identity
3. **ManagedIdentityCredential** - System or user-assigned managed identity (Azure VMs, App Service, Functions, etc.)
4. **AzureCliCredential** - Azure CLI logged-in user (`az login`)
5. **AzurePowerShellCredential** - Azure PowerShell logged-in user
6. **AzureDeveloperCliCredential** - Azure Developer CLI (`azd auth login`)
7. **VisualStudioCodeCredential** - VS Code Azure Account extension

## 4. Environment-Specific Behavior

### Local Development

**VS Code:**
```typescript
// Install Azure Account extension
// Sign in via Command Palette: "Azure: Sign In"
// DefaultAzureCredential automatically uses VS Code credentials
const credential = new DefaultAzureCredential();
```

**Azure CLI:**
```bash
# Login first
az login

# Your code automatically uses these credentials
```

### Azure-Hosted Environments

**Azure App Service / Functions:**
```typescript
// Enable System Managed Identity in Azure Portal
// DefaultAzureCredential automatically detects and uses it
const credential = new DefaultAzureCredential();
```

**Azure VM:**
```typescript
// Enable Managed Identity on the VM
// No code changes needed
const credential = new DefaultAzureCredential();
```

**Azure Kubernetes Service (AKS):**
```typescript
// Configure workload identity
// DefaultAzureCredential automatically uses it
const credential = new DefaultAzureCredential();
```

## 5. Troubleshooting Authentication Failures

### Enable Logging

```typescript
import { setLogLevel } from "@azure/logger";

// Enable detailed logging
setLogLevel("info");

const credential = new DefaultAzureCredential({
  // Exclude specific credentials if needed
  excludeEnvironmentCredential: false,
  excludeManagedIdentityCredential: false,
  excludeAzureCliCredential: false,
  
  // Retry options
  retryOptions: {
    maxRetries: 3,
    retryDelayInMs: 1000
  }
});
```

### Common Issues & Solutions

**Error: "DefaultAzureCredential failed to retrieve a token"**
- Check if any credential is configured (run `az account show` or sign in to VS Code)
- Verify managed identity is enabled in Azure portal
- Check environment variables are set correctly

**Error: "No subscription found"**
```bash
az account list
az account set --subscription "your-subscription-id"
```

**Error: "Insufficient permissions"**
- Grant appropriate RBAC role (e.g., "Key Vault Secrets User")
- Wait 5-10 minutes for permission propagation

**Debugging specific credentials:**
```typescript
import { 
  DefaultAzureCredential,
  AzureCliCredential,
  ManagedIdentityCredential 
} from "@azure/identity";

// Test specific credentials individually
try {
  const cliCred = new AzureCliCredential();
  const token = await cliCred.getToken("https://management.azure.com/.default");
  console.log("Azure CLI auth works:", token !== null);
} catch (error) {
  console.error("Azure CLI auth failed:", error.message);
}
```

## Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { setLogLevel } from "@azure/logger";

// Enable logging for troubleshooting
setLogLevel("info");

async function main() {
  try {
    // Create credential with options
    const credential = new DefaultAzureCredential({
      // Exclude credentials not needed (optional)
      // excludeAzureCliCredential: true,
      
      // For user-assigned managed identity
      // managedIdentityClientId: "your-client-id"
    });

    // Key Vault URL - replace with your vault
    const keyVaultUrl = "https://your-keyvault.vault.azure.net";
    
    // Create Key Vault client
    const client = new SecretClient(keyVaultUrl, credential);
    
    // Test authentication by listing secrets
    console.log("Listing secrets from Key Vault...");
    
    const secretsIterator = client.listPropertiesOfSecrets();
    for await (const secretProperties of secretsIterator) {
      console.log(`- ${secretProperties.name}`);
    }
    
    // Get a specific secret
    const secretName = "mySecret";
    console.log(`\nRetrieving secret: ${secretName}`);
    
    const secret = await client.getSecret(secretName);
    console.log(`Secret retrieved: ${secret.name}`);
    console.log(`Secret value: ${secret.value}`);
    
    // Set a new secret
    const newSecretName = "newSecret";
    const newSecretValue = "mySecretValue123";
    
    console.log(`\nSetting new secret: ${newSecretName}`);
    await client.setSecret(newSecretName, newSecretValue);
    console.log("Secret set successfully!");
    
  } catch (error) {
    console.error("Authentication or operation failed:");
    console.error(`Error: ${error.message}`);
    
    if (error.statusCode === 401 || error.statusCode === 403) {
      console.error("\nAuthentication issue detected:");
      console.error("1. Ensure you're logged in (az login or VS Code Azure Account)");
      console.error("2. Check managed identity is enabled if running in Azure");
      console.error("3. Verify RBAC permissions on the Key Vault");
    }
    
    throw error;
  }
}

main().catch(console.error);
```

## Environment Variables (Optional)

For service principal authentication in CI/CD or production:

```bash
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

```typescript
// DefaultAzureCredential will automatically use these
const credential = new DefaultAzureCredential();
```

## Best Practices

1. **Use DefaultAzureCredential for flexibility** - works everywhere without code changes
2. **Enable managed identity in Azure** - most secure, no credentials in code
3. **Use environment variables for service principals** - better than hardcoding
4. **Grant least privilege RBAC** - only permissions needed
5. **Enable logging during development** - easier troubleshooting
6. **Never commit credentials** - use environment variables or managed identity

This approach provides seamless authentication across local development and Azure-hosted environments! 🔐

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config azure-mcp/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
