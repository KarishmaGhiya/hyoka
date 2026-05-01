# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** azure-mcp-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 36.9s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | azure-mcp-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 36.9s |
| Timestamp | 2026-04-30T23:20:44Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 36.7s |
| **Total** | **36.9s** |

## Configuration

- **name:** azure-mcp-skills/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=35038 out=1782 |
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

The user is asking for information about authenticating Azure SDK clients using DefaultAzureCredential in TypeScript/JavaScript. They want:
1. Required npm packages
2. How to create and use DefaultAzureCredential
3. Credential chain order
4. How it works in different environments
5. Troubleshooting tips
6. A complete TypeScript example with SecretClient

This is a straightforward informational request. I don't need to invoke any skills or read any files - I can provide this information directly based on my knowledge of Azure SDK and DefaultAzureCredential.

Let me provide a comprehensive answer with a working example.

## Copilot Response

I'll explain how to authenticate Azure SDK clients using `DefaultAzureCredential` with a complete TypeScript example.

## 1. Required npm Packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- **@azure/identity**: Provides `DefaultAzureCredential` and other credential types
- **@azure/keyvault-secrets**: Example Azure service SDK (SecretClient)

## 2. Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

async function main() {
  // Create a DefaultAzureCredential instance
  const credential = new DefaultAzureCredential();
  
  // Use it to authenticate an Azure service client
  const keyVaultUrl = "https://your-keyvault-name.vault.azure.net";
  const client = new SecretClient(keyVaultUrl, credential);
  
  try {
    // Use the authenticated client
    const secret = await client.getSecret("my-secret-name");
    console.log("Secret value:", secret.value);
  } catch (error) {
    console.error("Authentication or access error:", error);
  }
}

main();
```

## 3. Credential Chain Order

`DefaultAzureCredential` tries credentials in this order:

1. **EnvironmentCredential** - Environment variables:
   - `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` (Service Principal)
   - `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_CERTIFICATE_PATH` (Certificate)
   - `AZURE_USERNAME`, `AZURE_PASSWORD` (Username/Password)

2. **WorkloadIdentityCredential** - Azure Kubernetes Service workload identity

3. **ManagedIdentityCredential** - Azure-hosted resources:
   - App Service, Functions, Container Apps
   - Virtual Machines, Container Instances
   - Azure Arc

4. **AzureCliCredential** - Logged in via `az login`

5. **AzurePowerShellCredential** - Logged in via `Connect-AzAccount`

6. **AzureDeveloperCliCredential** - Logged in via `azd auth login`

## 4. Environment Comparison

### Local Development

**VS Code:**
- Uses **AzureCliCredential** if signed in with Azure CLI (`az login`)
- Or uses **AzureDeveloperCliCredential** if using `azd auth login`
- VS Code Azure Account extension doesn't affect SDK authentication

**Setup:**
```bash
# Login with Azure CLI
az login

# Set subscription (optional)
az account set --subscription "your-subscription-id"
```

### Azure-Hosted Environments

**Managed Identity (automatic, no credentials stored):**

```typescript
// Enable Managed Identity in Azure Portal, then same code works:
const credential = new DefaultAzureCredential();
const client = new SecretClient(keyVaultUrl, credential);
```

**App Service / Azure Functions:**
- Enable System-assigned or User-assigned Managed Identity
- Grant IAM permissions (e.g., "Key Vault Secrets User")
- No code changes needed!

**Container Apps / AKS:**
- Similar setup with Managed Identity or Workload Identity

## 5. Troubleshooting Authentication Failures

### Enable Detailed Logging

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { setLogLevel } from "@azure/logger";

// Enable verbose logging
setLogLevel("info");

const credential = new DefaultAzureCredential({
  // Optional: exclude credentials you don't want to try
  excludeEnvironmentCredential: false,
  excludeManagedIdentityCredential: false,
  excludeAzureCliCredential: false,
  excludeAzurePowerShellCredential: true,
  excludeAzureDeveloperCliCredential: false,
});
```

### Common Issues & Solutions

**Issue: "DefaultAzureCredential failed to retrieve a token"**
```bash
# Solution: Login with Azure CLI
az login
az account show  # Verify you're logged in
```

**Issue: "No subscription found"**
```bash
# Solution: Set default subscription
az account list --output table
az account set --subscription "your-subscription-id"
```

**Issue: "Permission denied" / "Forbidden"**
- Grant appropriate IAM role (Key Vault: "Key Vault Secrets User")
- For Managed Identity: assign the identity to the resource
- Wait 5-10 minutes for permission propagation

**Issue: Local dev works, Azure deployment fails**
- Enable Managed Identity on Azure resource
- Assign IAM permissions to the Managed Identity
- Check firewall/network rules

### Debug Helper Function

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { setLogLevel } from "@azure/logger";

async function testAuthentication() {
  setLogLevel("info");
  
  const credential = new DefaultAzureCredential();
  
  try {
    // Try to get a token to verify authentication works
    const token = await credential.getToken("https://vault.azure.net/.default");
    console.log("✅ Authentication successful!");
    console.log("Token expires:", new Date(token.expiresOnTimestamp));
  } catch (error) {
    console.error("❌ Authentication failed:", error.message);
    
    // Helpful diagnostics
    console.log("\n🔍 Troubleshooting steps:");
    console.log("1. Run 'az login' if developing locally");
    console.log("2. Run 'az account show' to verify authentication");
    console.log("3. Check if Managed Identity is enabled (Azure-hosted)");
    console.log("4. Verify IAM permissions on the resource");
  }
}

testAuthentication();
```

### Environment Variables for Testing

```bash
# Service Principal authentication (CI/CD)
export AZURE_CLIENT_ID="your-app-id"
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_SECRET="your-secret"
```

## Best Practices

1. **Use DefaultAzureCredential** for most scenarios - it adapts automatically
2. **Never hardcode credentials** - let the credential chain handle it
3. **Grant least privilege** - use specific IAM roles (e.g., "Key Vault Secrets User" not "Contributor")
4. **Enable logging during development** to understand which credential succeeded
5. **Test in both environments** - local dev and target Azure environment

This approach provides seamless authentication across development and production without code changes! 🚀

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config azure-mcp-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
