# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** azure-mcp/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 44.1s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | azure-mcp/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 44.1s |
| Timestamp | 2026-04-30T23:23:11Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 44.0s |
| **Total** | **44.1s** |

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
| Token Usage | in=35024 out=2752 |
| Turn Count | 1 |

## Error

```
0 files generated — agent did not create any files
```

## Prompt Sent

```
Show me how to
authenticate to Azure using a Service Principal with client secret. I need:
1. Required npm packages
2. How to create a ClientSecretCredential with tenant ID, client ID, and secret
3. Using it with an Azure SDK client
4. Best practices for secret management in Node.js
5. Error handling for authentication failures

Provide a complete TypeScript example.
```

## Copilot Reasoning

The user is asking for a complete guide on authenticating to Azure using a Service Principal with client secret in Node.js/TypeScript. This is a straightforward request that doesn't require me to create any files in a repository or make changes to existing code. I should provide:

1. Required npm packages
2. How to create ClientSecretCredential
3. Using it with Azure SDK clients
4. Best practices for secret management
5. Error handling

This is a documentation/example request, so I should provide a comprehensive TypeScript example with explanations. I don't need to use any tools for this - I can just provide the information directly.

Let me structure a complete response with code examples.

## Copilot Response

I'll provide you with a complete guide for authenticating to Azure using a Service Principal with client secret in TypeScript.

## 1. Required npm packages

```bash
npm install @azure/identity @azure/arm-resources
# Or with specific Azure SDK clients you need, e.g.:
npm install @azure/identity @azure/storage-blob @azure/keyvault-secrets
npm install --save-dev @types/node typescript
```

## 2. Complete TypeScript Example

```typescript
import { ClientSecretCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";
import { BlobServiceClient } from "@azure/storage-blob";

// Configuration interface for type safety
interface AzureServicePrincipalConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId?: string;
}

// Load configuration from environment variables
function getAzureConfig(): AzureServicePrincipalConfig {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing required environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
    );
  }

  return {
    tenantId,
    clientId,
    clientSecret,
    subscriptionId,
  };
}

// Create credential with error handling
function createCredential(config: AzureServicePrincipalConfig): ClientSecretCredential {
  try {
    const credential = new ClientSecretCredential(
      config.tenantId,
      config.clientId,
      config.clientSecret
    );
    
    return credential;
  } catch (error) {
    throw new Error(`Failed to create credential: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Example 1: Using with Azure Resource Management
async function listResourceGroups() {
  try {
    const config = getAzureConfig();
    
    if (!config.subscriptionId) {
      throw new Error("AZURE_SUBSCRIPTION_ID is required for Resource Management operations");
    }

    const credential = createCredential(config);
    const client = new ResourceManagementClient(credential, config.subscriptionId);

    console.log("Fetching resource groups...");
    const resourceGroups = [];
    
    for await (const group of client.resourceGroups.list()) {
      resourceGroups.push(group);
      console.log(`- ${group.name} (${group.location})`);
    }

    return resourceGroups;
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}

// Example 2: Using with Azure Blob Storage
async function listBlobContainers(storageAccountName: string) {
  try {
    const config = getAzureConfig();
    const credential = createCredential(config);

    const blobServiceClient = new BlobServiceClient(
      `https://${storageAccountName}.blob.core.windows.net`,
      credential
    );

    console.log(`Fetching containers from ${storageAccountName}...`);
    const containers = [];

    for await (const container of blobServiceClient.listContainers()) {
      containers.push(container);
      console.log(`- ${container.name}`);
    }

    return containers;
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}

// Comprehensive error handling for authentication failures
function handleAuthError(error: unknown): void {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes("unauthorized") || errorMessage.includes("401")) {
      console.error("❌ Authentication failed: Invalid credentials or insufficient permissions");
      console.error("Check: Client ID, Client Secret, and Tenant ID are correct");
    } else if (errorMessage.includes("forbidden") || errorMessage.includes("403")) {
      console.error("❌ Authorization failed: Service Principal lacks required permissions");
      console.error("Check: Role assignments (e.g., Reader, Contributor) on target resources");
    } else if (errorMessage.includes("tenant")) {
      console.error("❌ Tenant error: Invalid Tenant ID or tenant not accessible");
      console.error("Check: AZURE_TENANT_ID matches your Azure AD tenant");
    } else if (errorMessage.includes("timeout") || errorMessage.includes("network")) {
      console.error("❌ Network error: Connection timeout or network issues");
      console.error("Check: Network connectivity and Azure service availability");
    } else if (errorMessage.includes("aadsts")) {
      // Azure AD error codes
      console.error("❌ Azure AD authentication error");
      console.error(`Details: ${error.message}`);
    } else {
      console.error("❌ Unexpected error:", error.message);
    }
  }
}

// Main execution with comprehensive error handling
async function main() {
  try {
    console.log("🔐 Azure Service Principal Authentication Example\n");

    // Test authentication by listing resource groups
    await listResourceGroups();

    // Example: List containers from a storage account
    // await listBlobContainers("mystorageaccount");

    console.log("\n✅ Authentication successful!");
  } catch (error) {
    console.error("\n❌ Authentication failed");
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { createCredential, getAzureConfig, listResourceGroups, listBlobContainers };
```

## 3. Environment Variables (.env file)

```env
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here
AZURE_SUBSCRIPTION_ID=your-subscription-id-here
```

## 4. Best Practices for Secret Management

### **Option 1: Environment Variables (Development)**
```typescript
// Use dotenv for local development
import dotenv from 'dotenv';
dotenv.config();

// Never commit .env files - add to .gitignore
```

### **Option 2: Azure Key Vault (Production)**
```typescript
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

async function getSecretsFromKeyVault() {
  // Use managed identity or different credential for Key Vault
  const kvCredential = new DefaultAzureCredential();
  const keyVaultUrl = `https://${process.env.KEY_VAULT_NAME}.vault.azure.net`;
  const client = new SecretClient(keyVaultUrl, kvCredential);

  const tenantId = (await client.getSecret("AZURE-TENANT-ID")).value!;
  const clientId = (await client.getSecret("AZURE-CLIENT-ID")).value!;
  const clientSecret = (await client.getSecret("AZURE-CLIENT-SECRET")).value!;

  return { tenantId, clientId, clientSecret };
}
```

### **Option 3: Azure App Configuration**
```typescript
import { AppConfigurationClient } from "@azure/app-configuration";

async function getSecretsFromAppConfig() {
  const connectionString = process.env.AZURE_APPCONFIG_CONNECTION_STRING!;
  const client = new AppConfigurationClient(connectionString);
  
  const tenantId = (await client.getConfigurationSetting({ key: "Azure:TenantId" })).value!;
  // ... fetch other secrets
  
  return { tenantId };
}
```

## 5. Security Checklist

```typescript
// security-checklist.ts

// ✅ DO: Use environment variables
const tenantId = process.env.AZURE_TENANT_ID;

// ❌ DON'T: Hardcode credentials
// const tenantId = "12345-678-90"; // NEVER DO THIS

// ✅ DO: Add .env to .gitignore
// ✅ DO: Use Azure Key Vault in production
// ✅ DO: Rotate secrets regularly
// ✅ DO: Use managed identities when running in Azure
// ✅ DO: Limit Service Principal permissions (least privilege)
// ✅ DO: Monitor and audit Service Principal usage
// ✅ DO: Set secret expiration dates
```

## 6. Additional Configuration Options

```typescript
import { ClientSecretCredential, ClientSecretCredentialOptions } from "@azure/identity";

// Advanced credential options
const options: ClientSecretCredentialOptions = {
  authorityHost: "https://login.microsoftonline.com", // Change for sovereign clouds
  loggingOptions: {
    allowLoggingAccountIdentifiers: true,
    enableUnsafeSupportLogging: false, // Never set true in production
  },
  retryOptions: {
    maxRetries: 3,
    retryDelayInMs: 1000,
  },
};

const credential = new ClientSecretCredential(
  tenantId,
  clientId,
  clientSecret,
  options
);
```

## 7. Testing Authentication

```typescript
// test-auth.ts
import { ClientSecretCredential } from "@azure/identity";

async function testAuthentication() {
  try {
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      process.env.AZURE_CLIENT_SECRET!
    );

    // Request a token to verify credentials work
    const token = await credential.getToken("https://management.azure.com/.default");
    
    console.log("✅ Authentication successful!");
    console.log(`Token expires: ${new Date(token.expiresOnTimestamp)}`);
    
    return true;
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    return false;
  }
}
```

This complete example covers authentication, error handling, and security best practices for using Service Principal authentication in Node.js/TypeScript applications!

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config azure-mcp/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
