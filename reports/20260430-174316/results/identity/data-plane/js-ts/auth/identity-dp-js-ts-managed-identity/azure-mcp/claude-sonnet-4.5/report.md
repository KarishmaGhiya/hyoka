# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** azure-mcp/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 59.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | azure-mcp/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 59.7s |
| Timestamp | 2026-05-01T00:46:29Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 59.6s |
| **Total** | **59.7s** |

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
| Token Usage | in=35071 out=4187 |
| Turn Count | 1 |

## Error

```
0 files generated — agent did not create any files
```

## Prompt Sent

```
Show me how to
use Managed Identity to authenticate Azure SDK clients in Node.js. Cover:
1. System-assigned vs user-assigned managed identity
2. How to create a ManagedIdentityCredential for each type
3. Using it with Azure SDK clients
4. Local development fallback strategies
5. Common pitfalls and error handling

Provide TypeScript examples for both identity types.
```

## Copilot Reasoning

The user is asking for a comprehensive guide on using Managed Identity to authenticate Azure SDK clients in Node.js/TypeScript. This is a specific Azure technical topic that I should provide detailed examples for.

Let me break down what they want:
1. System-assigned vs user-assigned managed identity explanation
2. How to create ManagedIdentityCredential for each type
3. Using it with Azure SDK clients
4. Local development fallback strategies
5. Common pitfalls and error handling
6. TypeScript examples

This is a straightforward request that doesn't require code changes to an existing repository - they want educational/reference material. I should provide a comprehensive response with code examples.

I don't need to use any tools for this - I can directly provide the information and examples they need.

## Copilot Response

I'll provide you with a comprehensive guide on using Managed Identity with Azure SDK clients in Node.js/TypeScript.

## **Managed Identity Authentication in Node.js/TypeScript**

### **1. System-Assigned vs User-Assigned Managed Identity**

**System-Assigned Managed Identity:**
- Lifecycle tied to the Azure resource (VM, App Service, etc.)
- Automatically deleted when the resource is deleted
- One-to-one relationship with the resource
- Simpler for single-resource scenarios

**User-Assigned Managed Identity:**
- Independent lifecycle - can exist before/after resources
- Can be shared across multiple Azure resources
- Requires explicit client ID specification
- Better for multi-resource or reusable identity scenarios

---

### **2. Creating ManagedIdentityCredential**

Install the required packages:
```bash
npm install @azure/identity @azure/storage-blob @azure/keyvault-secrets
```

#### **System-Assigned Managed Identity:**

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// Simple - no parameters needed for system-assigned
const credential = new ManagedIdentityCredential();

// With optional configuration
const credentialWithOptions = new ManagedIdentityCredential({
  // Optional: Retry options for token acquisition
  retryOptions: {
    maxRetries: 3,
    retryDelayInMs: 1000,
  }
});
```

#### **User-Assigned Managed Identity:**

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// Option 1: Using Client ID (most common)
const credential = new ManagedIdentityCredential({
  clientId: "your-user-assigned-identity-client-id"
});

// Option 2: Using Resource ID
const credentialResourceId = new ManagedIdentityCredential({
  resourceId: "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}"
});

// Option 3: Using Object ID (rare, but supported)
const credentialObjectId = new ManagedIdentityCredential({
  objectId: "your-user-assigned-identity-object-id"
});
```

---

### **3. Using with Azure SDK Clients**

#### **Azure Blob Storage Example:**

```typescript
import { BlobServiceClient } from "@azure/storage-blob";
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned identity
async function uploadBlobSystemAssigned() {
  const credential = new ManagedIdentityCredential();
  const accountName = "mystorageaccount";
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );

  const containerClient = blobServiceClient.getContainerClient("mycontainer");
  const blockBlobClient = containerClient.getBlockBlobClient("myfile.txt");
  
  await blockBlobClient.upload("Hello, Managed Identity!", 25);
  console.log("Upload complete!");
}

// User-assigned identity
async function uploadBlobUserAssigned() {
  const credential = new ManagedIdentityCredential({
    clientId: process.env.AZURE_CLIENT_ID
  });
  
  const accountName = "mystorageaccount";
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );

  const containerClient = blobServiceClient.getContainerClient("mycontainer");
  const blockBlobClient = containerClient.getBlockBlobClient("myfile.txt");
  
  await blockBlobClient.upload("Hello from user-assigned MI!", 31);
  console.log("Upload complete!");
}
```

#### **Azure Key Vault Example:**

```typescript
import { SecretClient } from "@azure/keyvault-secrets";
import { ManagedIdentityCredential } from "@azure/identity";

async function getSecretFromKeyVault() {
  const credential = new ManagedIdentityCredential();
  const vaultName = "mykeyvault";
  const url = `https://${vaultName}.vault.azure.net`;

  const client = new SecretClient(url, credential);
  
  try {
    const secret = await client.getSecret("DatabaseConnectionString");
    console.log("Secret retrieved:", secret.value);
    return secret.value;
  } catch (error) {
    console.error("Failed to get secret:", error);
    throw error;
  }
}
```

---

### **4. Local Development Fallback Strategies**

#### **Strategy 1: DefaultAzureCredential (Recommended)**

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

/**
 * DefaultAzureCredential tries credentials in this order:
 * 1. EnvironmentCredential (env vars)
 * 2. WorkloadIdentityCredential (Kubernetes)
 * 3. ManagedIdentityCredential (Azure resources)
 * 4. AzureCliCredential (az cli)
 * 5. AzurePowerShellCredential
 * 6. AzureDeveloperCliCredential (azd)
 */
async function useDefaultCredential() {
  const credential = new DefaultAzureCredential();
  
  const accountName = "mystorageaccount";
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );

  // Works in Azure (MI) AND locally (az cli/Visual Studio/etc)
  const containerClient = blobServiceClient.getContainerClient("mycontainer");
  await containerClient.createIfNotExists();
}
```

#### **Strategy 2: ChainedTokenCredential (Custom Chain)**

```typescript
import { 
  ChainedTokenCredential,
  ManagedIdentityCredential,
  AzureCliCredential,
  EnvironmentCredential
} from "@azure/identity";

async function useCustomChain() {
  // Try environment variables first, then managed identity, then CLI
  const credential = new ChainedTokenCredential(
    new EnvironmentCredential(),
    new ManagedIdentityCredential(),
    new AzureCliCredential()
  );

  const accountName = "mystorageaccount";
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );

  return blobServiceClient;
}
```

#### **Strategy 3: Environment-Specific Credential Factory**

```typescript
import {
  ManagedIdentityCredential,
  AzureCliCredential,
  TokenCredential
} from "@azure/identity";

function createCredential(): TokenCredential {
  const isAzureEnvironment = process.env.AZURE_ENVIRONMENT === "true" ||
                             process.env.MSI_ENDPOINT !== undefined;

  if (isAzureEnvironment) {
    console.log("Using ManagedIdentityCredential");
    const clientId = process.env.AZURE_CLIENT_ID;
    return new ManagedIdentityCredential(
      clientId ? { clientId } : undefined
    );
  } else {
    console.log("Using AzureCliCredential for local development");
    return new AzureCliCredential();
  }
}

// Usage
const credential = createCredential();
const blobServiceClient = new BlobServiceClient(
  `https://mystorageaccount.blob.core.windows.net`,
  credential
);
```

---

### **5. Common Pitfalls and Error Handling**

#### **Pitfall 1: Missing RBAC Permissions**

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient, RestError } from "@azure/storage-blob";

async function handleAuthorizationErrors() {
  const credential = new ManagedIdentityCredential();
  const blobServiceClient = new BlobServiceClient(
    `https://mystorageaccount.blob.core.windows.net`,
    credential
  );

  try {
    const containerClient = blobServiceClient.getContainerClient("mycontainer");
    await containerClient.listBlobsFlat().next();
  } catch (error) {
    if (error instanceof RestError) {
      if (error.statusCode === 403) {
        console.error("Authorization failed! Check RBAC assignments:");
        console.error("- Managed identity needs 'Storage Blob Data Contributor' or 'Storage Blob Data Reader'");
        console.error("- Role assignment can take 5-10 minutes to propagate");
        console.error(error.message);
      } else if (error.statusCode === 401) {
        console.error("Authentication failed! Managed identity not configured or not available");
        console.error(error.message);
      }
    }
    throw error;
  }
}
```

#### **Pitfall 2: Managed Identity Not Available**

```typescript
import { ManagedIdentityCredential, AuthenticationError } from "@azure/identity";

async function detectManagedIdentityAvailability() {
  const credential = new ManagedIdentityCredential();

  try {
    // Try to get a token for Azure Resource Manager
    const token = await credential.getToken("https://management.azure.com/.default");
    console.log("Managed Identity is available");
    console.log("Token expires at:", new Date(token.expiresOnTimestamp));
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error("Managed Identity is NOT available");
      console.error("Possible reasons:");
      console.error("1. Not running on Azure resource with MI enabled");
      console.error("2. System-assigned MI not enabled on the resource");
      console.error("3. User-assigned MI not associated with the resource");
      console.error("4. Incorrect client ID for user-assigned MI");
      console.error("\nError details:", error.message);
    }
    throw error;
  }
}
```

#### **Pitfall 3: Wrong Client ID for User-Assigned Identity**

```typescript
async function validateUserAssignedIdentity() {
  const clientId = process.env.AZURE_CLIENT_ID;

  if (!clientId) {
    throw new Error("AZURE_CLIENT_ID environment variable not set");
  }

  // Validate format (should be a GUID)
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(clientId)) {
    throw new Error(`Invalid client ID format: ${clientId}`);
  }

  const credential = new ManagedIdentityCredential({ clientId });
  
  try {
    await credential.getToken("https://management.azure.com/.default");
    console.log("User-assigned identity validated successfully");
  } catch (error) {
    console.error("Failed to authenticate with user-assigned identity");
    console.error("Verify the client ID is correct and the identity is associated with this resource");
    throw error;
  }
}
```

#### **Pitfall 4: Token Expiration (Rare but Important)**

```typescript
import { ManagedIdentityCredential, AccessToken } from "@azure/identity";

class TokenManager {
  private credential: ManagedIdentityCredential;
  private cachedToken: AccessToken | null = null;

  constructor(clientId?: string) {
    this.credential = new ManagedIdentityCredential(
      clientId ? { clientId } : undefined
    );
  }

  async getToken(scope: string): Promise<string> {
    const now = Date.now();
    
    // Refresh token 5 minutes before expiration
    const bufferMs = 5 * 60 * 1000;
    
    if (!this.cachedToken || this.cachedToken.expiresOnTimestamp - now < bufferMs) {
      console.log("Refreshing token...");
      this.cachedToken = await this.credential.getToken(scope);
    }

    return this.cachedToken.token;
  }
}

// Usage
const tokenManager = new TokenManager();
const token = await tokenManager.getToken("https://storage.azure.com/.default");
```

#### **Complete Error Handling Example:**

```typescript
import {
  ManagedIdentityCredential,
  AuthenticationError,
  AggregateAuthenticationError
} from "@azure/identity";
import { BlobServiceClient, RestError } from "@azure/storage-blob";

async function robustManagedIdentityExample() {
  let credential: ManagedIdentityCredential;

  try {
    // User-assigned identity with fallback
    const clientId = process.env.AZURE_CLIENT_ID;
    
    credential = clientId
      ? new ManagedIdentityCredential({ clientId })
      : new ManagedIdentityCredential();

    const accountName = process.env.STORAGE_ACCOUNT_NAME || "mystorageaccount";
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );

    const containerClient = blobServiceClient.getContainerClient("mycontainer");
    
    // Test the connection
    const exists = await containerClient.exists();
    console.log(`Container exists: ${exists}`);

    if (!exists) {
      await containerClient.create();
      console.log("Container created successfully");
    }

    return blobServiceClient;

  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthenticationError) {
      console.error("❌ Authentication failed:");
      console.error(error.message);
      
      if (error.message.includes("No MSI credentials available")) {
        console.error("\n💡 Solutions:");
        console.error("1. Enable system-assigned managed identity on your Azure resource");
        console.error("2. Associate a user-assigned identity and set AZURE_CLIENT_ID");
        console.error("3. Run locally using DefaultAzureCredential with 'az login'");
      }
      
      throw new Error("Managed Identity authentication failed");
    }

    // Handle authorization errors
    if (error instanceof RestError) {
      if (error.statusCode === 403) {
        console.error("❌ Authorization failed:");
        console.error("The managed identity lacks required permissions");
        console.error("\n💡 Required RBAC role:");
        console.error("'Storage Blob Data Contributor' on the storage account");
        throw new Error("Insufficient permissions");
      }

      if (error.statusCode === 404) {
        console.error("❌ Resource not found:");
        console.error("Storage account or container does not exist");
        throw new Error("Resource not found");
      }
    }

    // Handle aggregate errors (multiple credential failures)
    if (error instanceof AggregateAuthenticationError) {
      console.error("❌ All authentication methods failed:");
      error.errors.forEach((err, index) => {
        console.error(`  ${index + 1}. ${err.message}`);
      });
      throw error;
    }

    // Unknown error
    console.error("❌ Unexpected error:", error);
    throw error;
  }
}
```

---

### **Best Practices Summary**

1. **Use `DefaultAzureCredential` for flexibility** - works in Azure and locally
2. **Store user-assigned identity client IDs in environment variables**
3. **Grant minimal RBAC permissions** needed for the task
4. **Wait 5-10 minutes** after role assignment for propagation
5. **Implement proper error handling** for auth failures
6. **Log authentication method** used for debugging
7. **Don't hardcode credentials** - use managed identity in production
8. **Test locally** with Azure CLI (`az login`) before deploying

This approach provides secure, credential-free authentication that works seamlessly in Azure while supporting local development workflows!

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config azure-mcp/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
