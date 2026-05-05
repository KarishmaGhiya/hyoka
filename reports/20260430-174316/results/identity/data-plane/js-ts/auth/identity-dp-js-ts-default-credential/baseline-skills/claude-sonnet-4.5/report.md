# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** baseline-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 33.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | baseline-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 33.0s |
| Timestamp | 2026-05-01T00:44:24Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 32.9s |
| **Total** | **33.0s** |

## Configuration

- **model:** claude-sonnet-4.5
- **name:** baseline-skills/claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=16559 out=1822 |
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

The user is asking for a comprehensive guide on using Azure's DefaultAzureCredential in a TypeScript/JavaScript context. This is a documentation/educational request rather than a coding task on an existing codebase.

I should:
1. Explain the npm packages needed
2. Show how to create and use DefaultAzureCredential
3. Explain the credential chain order
4. Explain local dev vs Azure-hosted scenarios
5. Provide troubleshooting tips
6. Give a complete TypeScript example

This doesn't require any file operations or code changes - just a comprehensive explanation with code examples inline. I don't need to use tools for this.

## Copilot Response

I'll provide a comprehensive guide on using Azure's DefaultAzureCredential in TypeScript.

## 1. Required NPM Packages

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- **@azure/identity**: Contains DefaultAzureCredential and other credential classes
- **@azure/keyvault-secrets**: Example Azure SDK client (SecretClient)

## 2. Complete TypeScript Example

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// Create the credential instance
const credential = new DefaultAzureCredential();

// Use it with any Azure SDK client
const vaultUrl = "https://your-keyvault-name.vault.azure.net";
const client = new SecretClient(vaultUrl, credential);

// Make authenticated calls
async function getSecret() {
  try {
    const secret = await client.getSecret("my-secret-name");
    console.log("Secret value:", secret.value);
  } catch (error) {
    console.error("Authentication or access failed:", error);
  }
}

getSecret();
```

## 3. Credential Chain Order

DefaultAzureCredential tries these credentials **in order**, stopping at the first successful one:

1. **EnvironmentCredential** - Checks environment variables:
   - `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (Service Principal)
   - `AZURE_CLIENT_ID`, `AZURE_CLIENT_CERTIFICATE_PATH` (Certificate-based)
   - `AZURE_CLIENT_ID`, `AZURE_USERNAME`, `AZURE_PASSWORD` (Username/password)

2. **WorkloadIdentityCredential** - Azure Kubernetes Service (AKS) workload identity

3. **ManagedIdentityCredential** - Azure-hosted resources (VM, App Service, Functions, AKS)

4. **AzureCliCredential** - Uses `az login` credentials from Azure CLI

5. **AzurePowerShellCredential** - Uses `Connect-AzAccount` credentials from Azure PowerShell

6. **AzureDeveloperCliCredential** - Uses `azd auth login` credentials

## 4. Local Dev vs Azure-Hosted Environments

### Local Development:

**VS Code / Azure CLI:**
```bash
# Login via Azure CLI
az login

# Your code automatically uses these credentials via AzureCliCredential
```

**Advantages:**
- No secrets in code
- Uses your Azure account permissions
- Works immediately after `az login`

### Azure-Hosted Environments:

**Azure App Service / Functions / VM:**
- Enable **Managed Identity** (System-assigned or User-assigned)
- Grant the identity permissions to resources (Key Vault, Storage, etc.)
- DefaultAzureCredential automatically uses ManagedIdentityCredential
- **No configuration needed in code!**

**Example: Enable System-Assigned Managed Identity**
```bash
az webapp identity assign --name <app-name> --resource-group <rg-name>
```

## 5. Troubleshooting Authentication Failures

### Enable Detailed Logging:

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { setLogLevel } from "@azure/logger";

// Enable verbose logging
setLogLevel("info");

const credential = new DefaultAzureCredential({
  // Optional: exclude credentials to narrow down issues
  excludeEnvironmentCredential: false,
  excludeManagedIdentityCredential: false,
  excludeAzureCliCredential: false,
});
```

### Common Issues & Solutions:

**"DefaultAzureCredential failed to retrieve token"**
- Check if you're logged in: `az login` or `az account show`
- Verify Azure CLI is installed: `az version`
- Check environment variables are not partially set

**"Managed Identity not found" (in Azure)**
- Enable Managed Identity on your resource
- Wait 1-2 minutes for propagation
- Verify with: `az webapp identity show --name <app> --resource-group <rg>`

**"Insufficient permissions"**
- Grant proper RBAC roles: `az role assignment create --assignee <identity-id> --role "Key Vault Secrets User" --scope <resource-id>`

**Debugging which credential is being used:**
```typescript
import { DefaultAzureCredential, AzureCliCredential, ManagedIdentityCredential } from "@azure/identity";

// Try individual credentials to isolate the issue
const cliCred = new AzureCliCredential();
const managedCred = new ManagedIdentityCredential();

// Test each one
try {
  const token = await cliCred.getToken("https://vault.azure.net/.default");
  console.log("Azure CLI credential works!");
} catch (error) {
  console.error("Azure CLI credential failed:", error.message);
}
```

### Environment-Specific Configuration:

```typescript
const credential = new DefaultAzureCredential({
  // Specify managed identity client ID (for user-assigned)
  managedIdentityClientId: process.env.AZURE_CLIENT_ID,
  
  // Exclude certain credentials to speed up authentication
  excludeAzurePowerShellCredential: true,
  excludeAzureDeveloperCliCredential: true,
});
```

## Complete Production-Ready Example:

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { setLogLevel } from "@azure/logger";

// Enable logging in non-production environments
if (process.env.NODE_ENV !== "production") {
  setLogLevel("info");
}

const credential = new DefaultAzureCredential();
const vaultUrl = process.env.AZURE_KEYVAULT_URL || "https://your-vault.vault.azure.net";
const secretClient = new SecretClient(vaultUrl, credential);

async function main() {
  try {
    // Retrieve a secret
    const secret = await secretClient.getSecret("database-password");
    console.log("Successfully retrieved secret");
    
    // Use the secret (don't log sensitive values in production!)
    // const connectionString = secret.value;
    
  } catch (error: any) {
    console.error("Failed to retrieve secret:", error.message);
    
    // Provide helpful error context
    if (error.code === "ENOTFOUND") {
      console.error("Check your Key Vault URL");
    } else if (error.statusCode === 403) {
      console.error("Check your permissions (RBAC or Access Policies)");
    }
    
    process.exit(1);
  }
}

main();
```

This approach provides **zero-config authentication** that works seamlessly from local development to production without changing code!

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config baseline-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
