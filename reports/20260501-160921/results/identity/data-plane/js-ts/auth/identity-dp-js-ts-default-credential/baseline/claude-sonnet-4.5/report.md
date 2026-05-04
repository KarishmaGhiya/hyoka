# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** baseline/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 28.2s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | baseline/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 28.2s |
| Timestamp | 2026-05-01T23:11:15Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 28.1s |
| **Total** | **28.2s** |

## Configuration

- **name:** baseline/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=16567 out=1580 |
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

The user is asking for information about authenticating Azure SDK clients using DefaultAzureCredential in a TypeScript/JavaScript context. This is a documentation/educational request rather than a coding task on an existing codebase.

I should provide:
1. Required npm packages
2. How to create and use DefaultAzureCredential
3. The credential chain order
4. How it works in different environments (local vs Azure)
5. Troubleshooting tips
6. A complete TypeScript example with SecretClient

Since this is an informational request and doesn't require me to modify any files or execute commands in this environment, I can provide a comprehensive explanation directly. I'll create a complete example to demonstrate the concepts.

## Copilot Response

I'll provide a comprehensive guide on using DefaultAzureCredential with Azure SDK in TypeScript.

## 1. Required npm Packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- **@azure/identity**: Contains DefaultAzureCredential and other credential types
- **@azure/keyvault-secrets**: Example Azure SDK client (SecretClient)

## 2. Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

async function main() {
  // Create a DefaultAzureCredential instance
  const credential = new DefaultAzureCredential();

  // Use it with any Azure SDK client
  const keyVaultUrl = "https://your-keyvault.vault.azure.net";
  const client = new SecretClient(keyVaultUrl, credential);

  try {
    // Example: Get a secret
    const secret = await client.getSecret("my-secret-name");
    console.log("Secret value:", secret.value);
  } catch (error) {
    console.error("Authentication or access failed:", error);
  }
}

main();
```

## 3. Credential Chain Order

DefaultAzureCredential tries credentials in this **specific order**:

1. **EnvironmentCredential** - Environment variables (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`)
2. **WorkloadIdentityCredential** - Azure Kubernetes workload identity
3. **ManagedIdentityCredential** - Azure Managed Identity (VM, App Service, Function, etc.)
4. **AzureCliCredential** - Azure CLI (`az login`)
5. **AzurePowerShellCredential** - Azure PowerShell (`Connect-AzAccount`)
6. **AzureDeveloperCliCredential** - Azure Developer CLI (`azd auth login`)

It stops at the **first successful authentication** and uses that credential.

## 4. Local Dev vs Azure-Hosted Environments

### **Local Development:**

**VS Code with Azure Account Extension:**
- Install the Azure Account extension
- Sign in via Command Palette: "Azure: Sign In"
- DefaultAzureCredential will use your VS Code authentication automatically via VisualStudioCodeCredential (if enabled)

**Azure CLI (Most Common):**
```bash
az login
```
DefaultAzureCredential will detect and use the cached credentials.

**Environment Variables (for CI/CD or local testing):**
```bash
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

### **Azure-Hosted Environments:**

**Managed Identity (Recommended for production):**
- **System-assigned**: Automatically configured on Azure resources (VM, App Service, Function)
- **User-assigned**: Explicitly assign a managed identity

DefaultAzureCredential automatically detects and uses Managed Identity without any code changes.

```typescript
// Same code works everywhere!
const credential = new DefaultAzureCredential();
```

## 5. Troubleshooting Authentication Failures

### **Enable Detailed Logging:**

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { setLogLevel } from "@azure/logger";

// Enable verbose logging
setLogLevel("info");

const credential = new DefaultAzureCredential({
  // Optional: Customize which credentials to try
  excludeEnvironmentCredential: false,
  excludeManagedIdentityCredential: false,
  excludeAzureCliCredential: false,
  excludeAzurePowerShellCredential: true, // Disable if not using PowerShell
  excludeWorkloadIdentityCredential: false,
});
```

### **Common Issues & Solutions:**

**Error: "No valid credentials found"**
- **Solution**: Run `az login` or set environment variables
- Check if you're behind a proxy or firewall

**Error: "AADSTS700016: Application not found in directory"**
- **Solution**: Ensure the service principal or managed identity has access to the Azure resource
- Grant appropriate IAM role (e.g., "Key Vault Secrets User")

**Error: "Timeout" or "Network error"**
- **Solution**: Check network connectivity to Azure
- Verify firewall rules allow outbound HTTPS (port 443)

**Local works, Azure doesn't:**
- **Solution**: Ensure Managed Identity is enabled on the Azure resource
- Assign proper RBAC roles to the managed identity

### **Debugging Script:**

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { setLogLevel } from "@azure/logger";

async function testAuthentication() {
  setLogLevel("info");
  
  const credential = new DefaultAzureCredential();
  
  try {
    // Try to get a token for Azure Key Vault
    const token = await credential.getToken("https://vault.azure.net/.default");
    console.log("✅ Authentication successful!");
    console.log("Token expires at:", new Date(token.expiresOnTimestamp));
  } catch (error: any) {
    console.error("❌ Authentication failed:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
  }
}

testAuthentication();
```

### **Best Practices:**

1. **Never hardcode credentials** in your code
2. **Use Managed Identity** in Azure environments
3. **Use Azure CLI** for local development
4. **Grant least-privilege access** via Azure RBAC
5. **Enable logging** during development to understand which credential is being used

The beauty of DefaultAzureCredential is that **the same code works everywhere** - it automatically adapts to the environment it's running in!

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config baseline/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
