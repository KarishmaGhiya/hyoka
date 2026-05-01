# Evaluation Report: identity-dp-js-ts-default-credential

**Config:** baseline/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 98.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-default-credential` |
| Config | baseline/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 98.0s |
| Timestamp | 2026-04-30T23:21:19Z |
| Files Generated | 0 |
| Event Count | 51 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 97.9s |
| **Total** | **98.0s** |

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
| Token Usage | in=44665 out=7331 |
| Turn Count | 2 |

## Error

```
0 files generated despite 3 file-write tool attempts
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

The user is asking for a detailed explanation and example of how to use DefaultAzureCredential from Azure SDK for JavaScript/TypeScript. This is a documentation/tutorial request rather than a code modification task, so I should provide a comprehensive explanation with code examples.

Let me break down what they're asking for:
1. Required npm packages
2. How to create and use DefaultAzureCredential
3. The credential chain order
4. Local dev vs Azure-hosted environments
5. Troubleshooting tips
6. A complete TypeScript example with SecretClient

I should create a comprehensive example file that demonstrates this. I'll create a TypeScript file with detailed comments and explanations.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Azure authentication example"}
```

### 🔧 2. create

**Input:**

```json
{"file_text":"/**\n * Azure DefaultAzureCredential Authentication Example\n * \n * This example demonstrates how to authenticate Azure SDK clients using DefaultAzureCredential,\n * which provides a simplified authentication experience across different environments.\n */\n\n// ============================================================================\n// 1. REQUIRED NPM PACKAGES\n// ============================================================================\n// Install these packages:\n// npm install @azure/identity @azure/keyvault-secrets\n\nimport { DefaultAzureCredential, ChainedTokenCredential } from '@azure/identity';\nimport { SecretClient } from '@azure/keyvault-secrets';\n\n// ============================================================================\n// 2. CREATING AND USING DefaultAzureCredential\n// ============================================================================\n\n/**\n * Basic usage: Create a DefaultAzureCredential instance and use it with any Azure SDK client\n */\nasync function basicExample() {\n  // Step 1: Create the credential\n  const credential = new DefaultAzureCredential();\n\n  // Step 2: Use it with an Azure SDK client (SecretClient example)\n  const keyVaultUrl = \"https://your-keyvault-name.vault.azure.net\";\n  const client = new SecretClient(keyVaultUrl, credential);\n\n  // Step 3: Make API calls - authentication happens automatically\n  try {\n    const secret = await client.getSecret(\"my-secret-name\");\n    console.log(`Secret value: ${secret.value}`);\n  } catch (error) {\n    console.error(\"Error retrieving secret:\", error);\n  }\n}\n\n// ============================================================================\n// 3. CREDENTIAL CHAIN ORDER\n// ============================================================================\n/**\n * DefaultAzureCredential attempts credentials in this order:\n * \n * 1. EnvironmentCredential\n *    - Checks for environment variables:\n *      AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET (Service Principal)\n *      or AZURE_CLIENT_ID, AZURE_CLIENT_CERTIFICATE_PATH (Certificate-based)\n *      or AZURE_CLIENT_ID, AZURE_USERNAME, AZURE_PASSWORD (Username/Password)\n * \n * 2. WorkloadIdentityCredential\n *    - For Azure Kubernetes Service (AKS) workload identity\n *    - Checks AZURE_FEDERATED_TOKEN_FILE, AZURE_TENANT_ID, AZURE_CLIENT_ID\n * \n * 3. ManagedIdentityCredential\n *    - For Azure-hosted resources (VMs, App Service, Functions, AKS, etc.)\n *    - Uses system-assigned or user-assigned managed identity\n *    - No credentials needed - automatically available in Azure\n * \n * 4. AzureCliCredential\n *    - Uses the Azure CLI's logged-in account\n *    - Run: az login\n *    - Requires Azure CLI installed\n * \n * 5. AzurePowerShellCredential\n *    - Uses Azure PowerShell's logged-in account\n *    - Run: Connect-AzAccount\n *    - Requires Azure PowerShell module installed\n * \n * 6. AzureDeveloperCliCredential\n *    - Uses Azure Developer CLI's logged-in account\n *    - Run: azd auth login\n *    - Requires Azure Developer CLI installed\n * \n * The first credential that succeeds is used. If all fail, an error is thrown.\n */\n\n// ============================================================================\n// 4. LOCAL DEV vs AZURE-HOSTED ENVIRONMENTS\n// ============================================================================\n\n/**\n * LOCAL DEVELOPMENT (VS Code, Local Machine):\n * - Most commonly uses AzureCliCredential\n * - Developers run: az login\n * - Or use Visual Studio Code Azure Account extension\n * - Or set environment variables for Service Principal\n * \n * AZURE-HOSTED ENVIRONMENTS (App Service, Functions, VMs, AKS):\n * - Most commonly uses ManagedIdentityCredential\n * - Enable Managed Identity in Azure portal\n * - No code changes needed - same DefaultAzureCredential works\n * - No secrets to manage or rotate\n * \n * CI/CD PIPELINES (GitHub Actions, Azure DevOps):\n * - Typically uses EnvironmentCredential with Service Principal\n * - Set secrets in pipeline configuration\n * - Or use Workload Identity Federation (recommended, no secrets)\n */\n\nasync function environmentAwareExample() {\n  const credential = new DefaultAzureCredential();\n\n  // You can optionally configure logging to see which credential is used\n  const credentialWithLogging = new DefaultAzureCredential({\n    loggingOptions: {\n      logLevel: 'info'\n    }\n  });\n\n  // The same code works everywhere - no environment detection needed!\n  const keyVaultUrl = process.env.KEY_VAULT_URL || \"https://your-keyvault-name.vault.azure.net\";\n  const client = new SecretClient(keyVaultUrl, credential);\n\n  return client;\n}\n\n// ============================================================================\n// 5. TROUBLESHOOTING AUTHENTICATION FAILURES\n// ============================================================================\n\n/**\n * Enable detailed logging to diagnose authentication issues\n */\nasync function troubleshootingExample() {\n  // Enable logging to see which credentials are attempted\n  const credential = new DefaultAzureCredential({\n    loggingOptions: {\n      logLevel: 'verbose', // or 'info', 'warning', 'error'\n      allowLoggingAccountIdentifiers: true\n    }\n  });\n\n  try {\n    const keyVaultUrl = \"https://your-keyvault-name.vault.azure.net\";\n    const client = new SecretClient(keyVaultUrl, credential);\n    const secret = await client.getSecret(\"test-secret\");\n    console.log(\"Authentication successful!\");\n  } catch (error: any) {\n    console.error(\"Authentication failed!\");\n    console.error(\"Error name:\", error.name);\n    console.error(\"Error message:\", error.message);\n    console.error(\"Error code:\", error.code);\n    \n    // Common error codes:\n    // - CredentialUnavailableError: No credentials in the chain succeeded\n    // - ENOENT: Azure CLI not installed or not logged in\n    // - AADSTS*: Azure AD authentication errors\n    \n    console.error(\"\\nTroubleshooting steps:\");\n    console.error(\"1. For local dev: Run 'az login' to authenticate with Azure CLI\");\n    console.error(\"2. For Azure-hosted: Enable Managed Identity on your resource\");\n    console.error(\"3. Check environment variables (AZURE_TENANT_ID, AZURE_CLIENT_ID, etc.)\");\n    console.error(\"4. Verify resource permissions (RBAC roles assigned)\");\n    console.error(\"5. Check firewall rules on target resource (Key Vault, Storage, etc.)\");\n  }\n}\n\n/**\n * Common troubleshooting checklist:\n * \n * LOCAL DEVELOPMENT:\n * ✓ Is Azure CLI installed? (az --version)\n * ✓ Are you logged in? (az login)\n * ✓ Is the correct subscription set? (az account show)\n * ✓ Do you have permissions on the resource? (check Azure RBAC)\n * \n * AZURE-HOSTED:\n * ✓ Is Managed Identity enabled on the resource?\n * ✓ Does the Managed Identity have the right RBAC role?\n * ✓ Is the Key Vault URL correct?\n * ✓ Are there network restrictions (firewall, private endpoints)?\n * \n * ENVIRONMENT VARIABLES:\n * ✓ Are all required variables set? (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)\n * ✓ Are the values correct? (no extra spaces, quotes, etc.)\n * ✓ Is the Service Principal valid and has permissions?\n */\n\n// ============================================================================\n// ADVANCED: CUSTOMIZING THE CREDENTIAL CHAIN\n// ============================================================================\n\n/**\n * You can customize which credentials to try and in what order\n */\nasync function customChainExample() {\n  // Option 1: Exclude certain credentials\n  const credential = new DefaultAzureCredential({\n    excludeEnvironmentCredential: false,\n    excludeManagedIdentityCredential: false,\n    excludeAzureCliCredential: false,\n    excludeAzurePowerShellCredential: true, // Skip PowerShell\n    excludeAzureDeveloperCliCredential: true, // Skip azd\n    excludeWorkloadIdentityCredential: false\n  });\n\n  // Option 2: Specify managed identity client ID (for user-assigned identity)\n  const userAssignedCredential = new DefaultAzureCredential({\n    managedIdentityClientId: \"your-user-assigned-identity-client-id\"\n  });\n\n  // Option 3: Set timeout for each credential attempt\n  const fastFailCredential = new DefaultAzureCredential({\n    authorityHost: \"https://login.microsoftonline.com\",\n    // Each credential in the chain will timeout faster\n  });\n\n  return credential;\n}\n\n// ============================================================================\n// COMPLETE WORKING EXAMPLE\n// ============================================================================\n\n/**\n * Complete example: Retrieve a secret from Azure Key Vault\n */\nasync function completeExample() {\n  console.log(\"=== Azure DefaultAzureCredential Example ===\\n\");\n\n  // 1. Create credential (works in all environments)\n  console.log(\"Creating DefaultAzureCredential...\");\n  const credential = new DefaultAzureCredential({\n    loggingOptions: {\n      logLevel: 'info'\n    }\n  });\n\n  // 2. Configure Key Vault client\n  const keyVaultUrl = process.env.KEY_VAULT_URL;\n  if (!keyVaultUrl) {\n    throw new Error(\"KEY_VAULT_URL environment variable not set\");\n  }\n\n  console.log(`Connecting to Key Vault: ${keyVaultUrl}`);\n  const secretClient = new SecretClient(keyVaultUrl, credential);\n\n  // 3. Retrieve a secret\n  const secretName = \"my-secret\";\n  try {\n    console.log(`Retrieving secret: ${secretName}`);\n    const secret = await secretClient.getSecret(secretName);\n    console.log(`✓ Secret retrieved successfully`);\n    console.log(`  Name: ${secret.name}`);\n    console.log(`  Value: ${secret.value?.substring(0, 10)}...`); // Show first 10 chars\n    console.log(`  Enabled: ${secret.properties.enabled}`);\n    console.log(`  Created: ${secret.properties.createdOn}`);\n  } catch (error: any) {\n    console.error(`✗ Failed to retrieve secret: ${error.message}`);\n    throw error;\n  }\n\n  // 4. List all secrets\n  console.log(\"\\nListing all secrets...\");\n  try {\n    let count = 0;\n    for await (const secretProperties of secretClient.listPropertiesOfSecrets()) {\n      count++;\n      console.log(`  - ${secretProperties.name}`);\n    }\n    console.log(`✓ Found ${count} secrets`);\n  } catch (error: any) {\n    console.error(`✗ Failed to list secrets: ${error.message}`);\n  }\n}\n\n// ============================================================================\n// USAGE INSTRUCTIONS\n// ============================================================================\n\n/**\n * TO RUN THIS EXAMPLE:\n * \n * 1. Install dependencies:\n *    npm install @azure/identity @azure/keyvault-secrets typescript ts-node @types/node\n * \n * 2. FOR LOCAL DEVELOPMENT:\n *    a. Install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli\n *    b. Login: az login\n *    c. Set environment variable: export KEY_VAULT_URL=\"https://your-keyvault.vault.azure.net\"\n *    d. Grant yourself permissions:\n *       az keyvault set-policy --name your-keyvault --upn your@email.com --secret-permissions get list\n * \n * 3. FOR AZURE-HOSTED (App Service, Functions, etc.):\n *    a. Enable Managed Identity in Azure portal\n *    b. Grant the Managed Identity permissions on Key Vault:\n *       az keyvault set-policy --name your-keyvault --object-id \u003cmanaged-identity-object-id\u003e --secret-permissions get list\n *    c. Set application setting: KEY_VAULT_URL=\"https://your-keyvault.vault.azure.net\"\n * \n * 4. FOR CI/CD (Service Principal):\n *    a. Create Service Principal: az ad sp create-for-rbac --name my-app\n *    b. Set environment variables (in GitHub Secrets, Azure DevOps, etc.):\n *       AZURE_TENANT_ID=\"...\"\n *       AZURE_CLIENT_ID=\"...\"\n *       AZURE_CLIENT_SECRET=\"...\"\n *       KEY_VAULT_URL=\"https://your-keyvault.vault.azure.net\"\n *    c. Grant the Service Principal permissions on Key Vault\n * \n * 5. Run:\n *    npx ts-node azure-default-credential-example.ts\n */\n\n// Run the example if this file is executed directly\nif (require.main === module) {\n  completeExample()\n    .then(() =\u003e {\n      console.log(\"\\n✓ Example completed successfully\");\n      process.exit(0);\n    })\n    .catch((error) =\u003e {\n      console.error(\"\\n✗ Example failed:\", error.message);\n      process.exit(1);\n    });\n}\n\nexport {\n  basicExample,\n  environmentAwareExample,\n  troubleshootingExample,\n  customChainExample,\n  completeExample\n};\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-default-credential-baseline-claude-sonnet-4.5-1066904991\\azure-default-credential-example.ts"}
```

### 🔧 3. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-default-credential-example\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Example demonstrating Azure DefaultAzureCredential authentication\",\n  \"main\": \"azure-default-credential-example.ts\",\n  \"scripts\": {\n    \"start\": \"ts-node azure-default-credential-example.ts\",\n    \"build\": \"tsc\"\n  },\n  \"dependencies\": {\n    \"@azure/identity\": \"^4.0.0\",\n    \"@azure/keyvault-secrets\": \"^4.8.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.0.0\",\n    \"typescript\": \"^5.0.0\",\n    \"ts-node\": \"^10.9.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-default-credential-baseline-claude-sonnet-4.5-1066904991\\package.json"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"# Azure DefaultAzureCredential Authentication Guide\n\nThis example demonstrates how to authenticate Azure SDK clients using `DefaultAzureCredential`, which provides a simplified and unified authentication experience across different environments.\n\n## 📦 Required NPM Packages\n\n```bash\nnpm install @azure/identity @azure/keyvault-secrets\n```\n\n- **@azure/identity**: Core authentication library containing DefaultAzureCredential\n- **@azure/keyvault-secrets**: Example SDK client (can be replaced with any Azure SDK)\n\n## 🔑 What is DefaultAzureCredential?\n\n`DefaultAzureCredential` is a smart credential chain that automatically tries multiple authentication methods in sequence, making your code work seamlessly across:\n- Local development environments\n- Azure-hosted services\n- CI/CD pipelines\n\n**Key benefit**: Write once, authenticate anywhere - no environment-specific code needed!\n\n## 🔗 Credential Chain Order\n\nDefaultAzureCredential tries credentials in this order (stops at first success):\n\n1. **EnvironmentCredential** - Service Principal from environment variables\n2. **WorkloadIdentityCredential** - Azure Kubernetes workload identity\n3. **ManagedIdentityCredential** - Azure-hosted resources (VMs, App Service, Functions)\n4. **AzureCliCredential** - Azure CLI logged-in account (`az login`)\n5. **AzurePowerShellCredential** - Azure PowerShell logged-in account\n6. **AzureDeveloperCliCredential** - Azure Developer CLI logged-in account\n\n## 🖥️ Local Development vs Azure-Hosted\n\n### Local Development (VS Code, Terminal)\n**Most common**: Azure CLI authentication\n```bash\n# Login once\naz login\n\n# Your code automatically uses this account\n```\n\n**How it works**:\n- `DefaultAzureCredential` detects Azure CLI is installed and logged in\n- Uses your personal Azure account credentials\n- No secrets in code or config files\n- Perfect for development and testing\n\n### Azure-Hosted Environments (Production)\n**Most common**: Managed Identity\n```bash\n# Enable in Azure Portal or CLI\naz webapp identity assign --name myapp --resource-group mygroup\n```\n\n**How it works**:\n- `DefaultAzureCredential` automatically detects Managed Identity\n- Azure provides credentials internally (no secrets needed)\n- Secure and automatically rotated\n- Best practice for production\n\n### CI/CD Pipelines\n**Most common**: Service Principal with environment variables\n```bash\n# Set in GitHub Secrets, Azure DevOps Variables, etc.\nAZURE_TENANT_ID=your-tenant-id\nAZURE_CLIENT_ID=your-client-id\nAZURE_CLIENT_SECRET=your-client-secret\n```\n\n**Modern alternative**: Workload Identity Federation (no secrets!)\n\n## 🚀 Quick Start Example\n\n```typescript\nimport { DefaultAzureCredential } from '@azure/identity';\nimport { SecretClient } from '@azure/keyvault-secrets';\n\n// 1. Create credential (works everywhere)\nconst credential = new DefaultAzureCredential();\n\n// 2. Use with any Azure SDK client\nconst keyVaultUrl = \"https://your-keyvault.vault.azure.net\";\nconst client = new SecretClient(keyVaultUrl, credential);\n\n// 3. Make API calls - authentication is automatic!\nconst secret = await client.getSecret(\"my-secret\");\nconsole.log(secret.value);\n```\n\n## 🔧 Troubleshooting Authentication Failures\n\n### Enable Detailed Logging\n```typescript\nconst credential = new DefaultAzureCredential({\n  loggingOptions: {\n    logLevel: 'verbose',\n    allowLoggingAccountIdentifiers: true\n  }\n});\n```\n\n### Common Issues and Solutions\n\n#### Local Development\n| Issue | Solution |\n|-------|----------|\n| \"CredentialUnavailableError\" | Run `az login` to authenticate |\n| \"Azure CLI not found\" | Install Azure CLI: https://aka.ms/install-azure-cli |\n| \"Access denied\" | Check RBAC permissions on the resource |\n| \"Wrong subscription\" | Run `az account set --subscription \u003cid\u003e` |\n\n#### Azure-Hosted\n| Issue | Solution |\n|-------|----------|\n| \"ManagedIdentity not available\" | Enable Managed Identity in Azure Portal |\n| \"Access denied\" | Grant Managed Identity appropriate RBAC role |\n| \"Connection timeout\" | Check firewall rules and private endpoints |\n\n#### Service Principal (CI/CD)\n| Issue | Solution |\n|-------|----------|\n| \"Invalid client secret\" | Verify AZURE_CLIENT_SECRET is correct |\n| \"Missing environment variables\" | Set all three: TENANT_ID, CLIENT_ID, CLIENT_SECRET |\n| \"Client secret expired\" | Rotate secret in Azure AD and update pipeline |\n\n### Debug Checklist\n```bash\n# ✓ Check Azure CLI\naz --version\naz account show\n\n# ✓ Check environment variables\necho $AZURE_TENANT_ID\necho $AZURE_CLIENT_ID\n# Don't echo CLIENT_SECRET (it's sensitive!)\n\n# ✓ Test Key Vault access\naz keyvault secret show --vault-name mykeyvault --name mysecret\n\n# ✓ Check your permissions\naz role assignment list --assignee $(az account show --query user.name -o tsv)\n```\n\n## 📚 Additional Examples\n\nSee `azure-default-credential-example.ts` for:\n- Custom credential chain configuration\n- User-assigned managed identity\n- Multiple Azure services\n- Error handling patterns\n- Best practices\n\n## 🎯 Best Practices\n\n1. **Use DefaultAzureCredential** - Don't hardcode authentication methods\n2. **Never commit secrets** - Use environment variables or Managed Identity\n3. **Enable logging during development** - Makes debugging much easier\n4. **Grant least privilege** - Use RBAC to limit access scope\n5. **Use Managed Identity in Azure** - Most secure option for production\n6. **Rotate secrets regularly** - If using Service Principals\n\n## 📖 Further Reading\n\n- [Azure Identity SDK Docs](https://learn.microsoft.com/javascript/api/@azure/identity)\n- [DefaultAzureCredential Overview](https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential)\n- [Managed Identity Guide](https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)\n- [Azure CLI Installation](https://learn.microsoft.com/cli/azure/install-azure-cli)\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-identity-dp-js-ts-default-credential-baseline-claude-sonnet-4.5-1066904991\\README.md"}
```

## Copilot Response

I'll create a comprehensive TypeScript example demonstrating Azure DefaultAzureCredential authentication with detailed explanations.

I apologize - I'm unable to create files in this directory. Let me provide you with a comprehensive guide directly:

## 📦 **1. Required NPM Packages**

```bash
npm install @azure/identity @azure/keyvault-secrets
```

- **@azure/identity**: Core authentication library
- **@azure/keyvault-secrets**: Example Azure SDK (works with any Azure service)

---

## 🔑 **2. Creating and Using DefaultAzureCredential**

```typescript
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

// Step 1: Create credential (one line!)
const credential = new DefaultAzureCredential();

// Step 2: Use with any Azure SDK client
const keyVaultUrl = "https://your-keyvault.vault.azure.net";
const client = new SecretClient(keyVaultUrl, credential);

// Step 3: Make calls - authentication is automatic
const secret = await client.getSecret("my-secret");
console.log(secret.value);
```

---

## 🔗 **3. Credential Chain Order**

DefaultAzureCredential tries these in sequence (stops at first success):

1. **EnvironmentCredential** → Service Principal from env vars (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`)
2. **WorkloadIdentityCredential** → Azure Kubernetes workload identity
3. **ManagedIdentityCredential** → Azure-hosted resources (VMs, App Service, Functions, AKS)
4. **AzureCliCredential** → `az login` account
5. **AzurePowerShellCredential** → `Connect-AzAccount` session
6. **AzureDeveloperCliCredential** → `azd auth login` account

---

## 🖥️ **4. Local Dev vs Azure-Hosted**

### **Local Development** (VS Code, Terminal)
**Most common**: Azure CLI

```bash
# Login once
az login

# Your code automatically uses this account
```

✅ No secrets in code  
✅ Uses your personal Azure identity  
✅ Perfect for dev/testing

### **Azure-Hosted** (Production)
**Most common**: Managed Identity

```bash
# Enable on App Service/Function/VM
az webapp identity assign --name myapp --resource-group mygroup

# Grant permissions
az role assignment create \
  --assignee <managed-identity-object-id> \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/.../resourceGroups/.../providers/Microsoft.KeyVault/vaults/myvault
```

✅ No secrets to manage  
✅ Automatically rotated  
✅ Most secure for production  
✅ **Same code works - just deploy!**

### **CI/CD Pipelines**
**Most common**: Service Principal environment variables

```bash
# Set in GitHub Secrets, Azure DevOps, etc.
AZURE_TENANT_ID="..."
AZURE_CLIENT_ID="..."
AZURE_CLIENT_SECRET="..."
```

---

## 🔧 **5. Troubleshooting Authentication Failures**

### **Enable Logging**
```typescript
const credential = new DefaultAzureCredential({
  loggingOptions: {
    logLevel: 'verbose',
    allowLoggingAccountIdentifiers: true
  }
});
```

### **Common Issues**

| Environment | Issue | Solution |
|-------------|-------|----------|
| **Local** | "CredentialUnavailableError" | Run `az login` |
| **Local** | "Azure CLI not found" | Install: https://aka.ms/install-azure-cli |
| **Local** | "Access denied" | Check RBAC: `az role assignment list --assignee $(az account show --query user.name -o tsv)` |
| **Azure** | "Managed Identity unavailable" | Enable in Portal: Identity → System assigned → On |
| **Azure** | "Access denied" | Grant RBAC role to Managed Identity |
| **CI/CD** | "Invalid client secret" | Check `AZURE_CLIENT_SECRET` is correct |
| **CI/CD** | "Missing variables" | Set all 3: `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET` |

### **Debug Commands**
```bash
# Check CLI status
az --version
az account show

# Test Key Vault access
az keyvault secret show --vault-name myvault --name mysecret

# Verify permissions
az role assignment list --scope /subscriptions/YOUR_SUB/resourceGroups/YOUR_RG
```

---

## 🚀 **Complete TypeScript Example**

```typescript
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

async function main() {
  // Works in ALL environments - local, Azure, CI/CD
  const credential = new DefaultAzureCredential({
    loggingOptions: { logLevel: 'info' }
  });

  const keyVaultUrl = process.env.KEY_VAULT_URL || 
    "https://your-keyvault.vault.azure.net";
  
  const secretClient = new SecretClient(keyVaultUrl, credential);

  try {
    // Get a secret
    const secret = await secretClient.getSecret("my-secret");
    console.log(`✓ Secret retrieved: ${secret.name}`);
    console.log(`  Value: ${secret.value}`);

    // List all secrets
    console.log("\nAll secrets:");
    for await (const props of secretClient.listPropertiesOfSecrets()) {
      console.log(`  - ${props.name}`);
    }
  } catch (error: any) {
    console.error("❌ Authentication failed:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Run 'az login' for local dev");
    console.error("2. Enable Managed Identity for Azure");
    console.error("3. Check RBAC permissions");
  }
}

main();
```

---

## 🎯 **Best Practices**

1. ✅ **Always use DefaultAzureCredential** - works everywhere
2. ✅ **Never commit secrets** - use env vars or Managed Identity
3. ✅ **Enable logging during development** - easier debugging
4. ✅ **Use Managed Identity in production** - most secure
5. ✅ **Grant least privilege RBAC** - principle of least access

---

This approach gives you **one authentication pattern that works everywhere** - no environment detection needed! 🎉

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-default-credential --config baseline/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
