# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** baseline-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 31.8s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | baseline-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 31.8s |
| Timestamp | 2026-04-30T23:21:16Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 31.8s |
| **Total** | **31.8s** |

## Configuration

- **name:** baseline-skills/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=16510 out=1773 |
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

The user is asking for information about Azure SDK authentication using DefaultAzureCredential in TypeScript/Node.js. They want:
1. NPM packages needed
2. How to create and use DefaultAzureCredential
3. Credential chain order
4. Local dev vs Azure-hosted behavior
5. Troubleshooting tips
6. A complete TypeScript example with SecretClient

This is a documentation/tutorial request, not a coding task. I should provide a comprehensive explanation with working code examples. I don't need to search the filesystem or use any tools - this is a straightforward educational response about Azure SDK usage.

I should provide:
- Clear explanation of the npm packages
- Code example showing DefaultAzureCredential usage
- Detailed explanation of the credential chain
- Comparison of local vs cloud scenarios
- Troubleshooting guidance
- A complete TypeScript example

No tools are needed for this request - it's a knowledge/documentation question.

## Copilot Response

I'll provide a comprehensive guide on using `DefaultAzureCredential` with Azure SDK in TypeScript.

## 1. Required NPM Packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- `@azure/identity` - Provides DefaultAzureCredential and other credential types
- `@azure/keyvault-secrets` - Example Azure service client (SecretClient)

## 2. Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// Create DefaultAzureCredential instance
const credential = new DefaultAzureCredential();

// Use it with any Azure SDK client
const keyVaultUrl = "https://your-keyvault.vault.azure.net";
const client = new SecretClient(keyVaultUrl, credential);

// Use the client
async function getSecret() {
  try {
    const secret = await client.getSecret("my-secret-name");
    console.log(`Secret value: ${secret.value}`);
  } catch (error) {
    console.error("Authentication or access failed:", error.message);
  }
}

getSecret();
```

## 3. Credential Chain Order

`DefaultAzureCredential` tries these credentials **in order** until one succeeds:

1. **EnvironmentCredential** - Checks environment variables:
   - `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (Service Principal)
   - `AZURE_CLIENT_ID`, `AZURE_CLIENT_CERTIFICATE_PATH` (Certificate)
   - `AZURE_USERNAME`, `AZURE_PASSWORD` (User credentials)

2. **WorkloadIdentityCredential** - Azure Kubernetes Service workload identity

3. **ManagedIdentityCredential** - Managed Identity in Azure:
   - System-assigned identity
   - User-assigned identity (if `AZURE_CLIENT_ID` set)

4. **AzureCliCredential** - Uses `az login` session from Azure CLI

5. **AzurePowerShellCredential** - Uses `Connect-AzAccount` session

6. **AzureDeveloperCliCredential** - Uses `azd auth login` session

## 4. Local Dev vs Azure-Hosted Environments

### **Local Development** (VS Code, CLI)

```typescript
// Just works if you've run: az login
const credential = new DefaultAzureCredential();
```

**Setup for local development:**
```bash
# Option 1: Azure CLI (most common)
az login

# Option 2: Azure Developer CLI
azd auth login

# Option 3: Environment variables (for CI/CD or service principal)
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

### **Azure-Hosted Environments**

**Azure App Service / Functions / Container Apps:**
- Enable **Managed Identity** in portal
- No code changes needed
- DefaultAzureCredential automatically detects and uses it

**Azure Kubernetes Service (AKS):**
- Configure **Workload Identity**
- DefaultAzureCredential auto-discovers via service account tokens

**Azure Virtual Machines:**
- Enable **System-Assigned Managed Identity**
- No secrets in code or environment variables

## 5. Troubleshooting Authentication Failures

### Enable Detailed Logging

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { setLogLevel } from "@azure/logger";

// Enable verbose logging to see which credentials are tried
setLogLevel("info");

const credential = new DefaultAzureCredential({
  // Optional: Exclude credentials you don't want to try
  excludeCredentials: ["AzurePowerShellCredential"],
});
```

### Common Issues & Solutions

**Error: "DefaultAzureCredential failed to retrieve a token"**

```typescript
// Specify exactly which credential to test
import { AzureCliCredential, ManagedIdentityCredential } from "@azure/identity";

// Test CLI credential specifically
const cliCredential = new AzureCliCredential();
try {
  const token = await cliCredential.getToken("https://vault.azure.net/.default");
  console.log("CLI auth works!");
} catch (error) {
  console.error("CLI auth failed:", error.message);
  console.log("Solution: Run 'az login' first");
}
```

**Local dev works, Azure deployment fails:**
- Ensure Managed Identity is enabled
- Grant the identity permissions (RBAC roles) on target resources
- Example: "Key Vault Secrets User" role on Key Vault

**Permission denied errors:**
```bash
# Check your current login
az account show

# Grant permissions (example for Key Vault)
az keyvault set-policy --name your-keyvault \
  --object-id <managed-identity-principal-id> \
  --secret-permissions get list
```

### Advanced: Custom Credential Chain

```typescript
import { 
  ChainedTokenCredential, 
  ManagedIdentityCredential,
  AzureCliCredential,
  EnvironmentCredential 
} from "@azure/identity";

// Create custom chain with specific order
const credential = new ChainedTokenCredential(
  new EnvironmentCredential(),
  new ManagedIdentityCredential(),
  new AzureCliCredential()
);
```

### Testing Different Scenarios

```typescript
// For local dev only
const credential = new DefaultAzureCredential({
  excludeCredentials: ["ManagedIdentityCredential", "WorkloadIdentityCredential"]
});

// For Azure deployment only (faster, skips local credentials)
const credential = new DefaultAzureCredential({
  excludeCredentials: ["AzureCliCredential", "AzurePowerShellCredential"]
});
```

## Key Benefits

✅ **No secrets in code** - Credentials discovered from environment  
✅ **Works everywhere** - Same code for local dev and production  
✅ **Zero-trust** - Use Managed Identity in Azure (no passwords/keys)  
✅ **Fallback chain** - Tries multiple methods automatically  

The beauty of `DefaultAzureCredential` is that you write authentication code **once** and it adapts to wherever it runs!

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config baseline-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
