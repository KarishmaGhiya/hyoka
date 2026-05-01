# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** azure-mcp-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 50.3s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | azure-mcp-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 50.3s |
| Timestamp | 2026-05-01T00:46:06Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 50.2s |
| **Total** | **50.3s** |

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
| Token Usage | in=35069 out=3381 |
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

The user is asking for a comprehensive guide on using Managed Identity with Azure SDK clients in Node.js/TypeScript. This is a technical documentation/tutorial request about Azure authentication.

I should provide:
1. Explanation of system-assigned vs user-assigned managed identities
2. Code examples showing how to create ManagedIdentityCredential for both types
3. Examples of using these credentials with Azure SDK clients
4. Local development fallback strategies (like DefaultAzureCredential)
5. Common pitfalls and error handling patterns

This is a straightforward documentation request - I don't need to use any tools, I can just provide the information directly with code examples.

## Copilot Response

I'll provide a comprehensive guide on using Managed Identity with Azure SDK clients in Node.js/TypeScript.

## Managed Identity Authentication in Node.js

### 1. System-Assigned vs User-Assigned Managed Identity

**System-Assigned Managed Identity:**
- Lifecycle tied to the Azure resource (VM, App Service, etc.)
- Automatically created and deleted with the resource
- One identity per resource
- Best for single-purpose resources

**User-Assigned Managed Identity:**
- Independent lifecycle from resources
- Can be shared across multiple resources
- Created as a standalone Azure resource
- Best for multi-resource scenarios

### 2. Creating ManagedIdentityCredential

First, install the required package:
```bash
npm install @azure/identity
```

**System-Assigned Identity:**
```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// No client ID needed - uses the system-assigned identity
const credential = new ManagedIdentityCredential();
```

**User-Assigned Identity:**
```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// Specify the client ID of your user-assigned managed identity
const credential = new ManagedIdentityCredential({
  clientId: "your-user-assigned-identity-client-id"
});

// Alternative: Use the resource ID
const credentialByResourceId = new ManagedIdentityCredential({
  resourceId: "/subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}"
});
```

### 3. Using with Azure SDK Clients

**Example with Azure Key Vault:**
```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// System-assigned identity
const credential = new ManagedIdentityCredential();
const keyVaultUrl = "https://your-keyvault.vault.azure.net";
const client = new SecretClient(keyVaultUrl, credential);

async function getSecret() {
  try {
    const secret = await client.getSecret("my-secret");
    console.log(`Secret value: ${secret.value}`);
  } catch (error) {
    console.error("Error retrieving secret:", error);
  }
}
```

**Example with Azure Storage:**
```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

// User-assigned identity
const credential = new ManagedIdentityCredential({
  clientId: "12345678-1234-1234-1234-123456789abc"
});

const accountName = "mystorageaccount";
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  credential
);

async function listContainers() {
  try {
    for await (const container of blobServiceClient.listContainers()) {
      console.log(`Container: ${container.name}`);
    }
  } catch (error) {
    console.error("Error listing containers:", error);
  }
}
```

**Example with Cosmos DB:**
```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { CosmosClient } from "@azure/cosmos";

const credential = new ManagedIdentityCredential();
const endpoint = "https://your-cosmos-account.documents.azure.com:443/";

const client = new CosmosClient({
  endpoint,
  aadCredentials: credential
});
```

### 4. Local Development Fallback Strategies

**Strategy 1: DefaultAzureCredential (Recommended)**
```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// Tries multiple authentication methods in order:
// 1. EnvironmentCredential (env vars)
// 2. WorkloadIdentityCredential (Kubernetes)
// 3. ManagedIdentityCredential (Azure resources)
// 4. AzureCliCredential (local Azure CLI)
// 5. AzurePowerShellCredential
// 6. AzureDeveloperCliCredential
const credential = new DefaultAzureCredential();

const client = new SecretClient(
  "https://your-keyvault.vault.azure.net",
  credential
);
```

**Strategy 2: ChainedTokenCredential (Custom Chain)**
```typescript
import { 
  ChainedTokenCredential, 
  ManagedIdentityCredential,
  AzureCliCredential,
  EnvironmentCredential
} from "@azure/identity";

// Custom authentication chain
const credential = new ChainedTokenCredential(
  new EnvironmentCredential(),
  new ManagedIdentityCredential(),
  new AzureCliCredential()
);
```

**Strategy 3: Environment-Based Selection**
```typescript
import { 
  ManagedIdentityCredential, 
  AzureCliCredential,
  TokenCredential 
} from "@azure/identity";

function getCredential(): TokenCredential {
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction) {
    // Use managed identity in production
    const clientId = process.env.MANAGED_IDENTITY_CLIENT_ID;
    return clientId 
      ? new ManagedIdentityCredential({ clientId })
      : new ManagedIdentityCredential();
  } else {
    // Use Azure CLI for local development
    return new AzureCliCredential();
  }
}

const credential = getCredential();
```

**Strategy 4: Complete Example with Config**
```typescript
import { 
  DefaultAzureCredential,
  ManagedIdentityCredential,
  DefaultAzureCredentialOptions 
} from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

interface AzureConfig {
  keyVaultUrl: string;
  managedIdentityClientId?: string;
}

class AzureService {
  private secretClient: SecretClient;

  constructor(config: AzureConfig) {
    const credential = this.createCredential(config.managedIdentityClientId);
    this.secretClient = new SecretClient(config.keyVaultUrl, credential);
  }

  private createCredential(clientId?: string) {
    const options: DefaultAzureCredentialOptions = {
      // Exclude interactive browser credential for server scenarios
      excludeInteractiveBrowserCredential: true,
      // Specify user-assigned identity if provided
      managedIdentityClientId: clientId
    };

    return new DefaultAzureCredential(options);
  }

  async getSecret(name: string): Promise<string> {
    const secret = await this.secretClient.getSecret(name);
    return secret.value || "";
  }
}

// Usage
const service = new AzureService({
  keyVaultUrl: process.env.KEY_VAULT_URL || "",
  managedIdentityClientId: process.env.MANAGED_IDENTITY_CLIENT_ID
});
```

### 5. Common Pitfalls and Error Handling

**Pitfall 1: Missing RBAC Permissions**
```typescript
import { RestError } from "@azure/core-rest-pipeline";

async function handleSecretAccess() {
  try {
    const secret = await client.getSecret("my-secret");
    return secret.value;
  } catch (error) {
    if (error instanceof RestError) {
      if (error.statusCode === 403) {
        console.error("Access denied. Ensure managed identity has Key Vault Secrets User role.");
      } else if (error.statusCode === 401) {
        console.error("Authentication failed. Verify managed identity is enabled.");
      }
    }
    throw error;
  }
}
```

**Pitfall 2: Managed Identity Not Enabled**
```typescript
import { AuthenticationError } from "@azure/identity";

async function authenticateWithRetry() {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const credential = new ManagedIdentityCredential();
      const token = await credential.getToken("https://vault.azure.net/.default");
      console.log("Authentication successful");
      return credential;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        console.error(`Authentication attempt ${attempt + 1} failed:`, error.message);
        
        if (error.message.includes("No managed identity endpoint found")) {
          throw new Error(
            "Managed Identity is not enabled on this resource. " +
            "Enable it in the Azure Portal under Identity settings."
          );
        }
      }
      
      attempt++;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw new Error("Failed to authenticate after multiple attempts");
}
```

**Pitfall 3: Wrong Client ID**
```typescript
async function validateManagedIdentity(clientId?: string) {
  try {
    const credential = clientId 
      ? new ManagedIdentityCredential({ clientId })
      : new ManagedIdentityCredential();
    
    // Test authentication by requesting a token
    await credential.getToken("https://management.azure.com/.default");
    
    console.log("Managed identity validation successful");
    return true;
  } catch (error) {
    console.error("Managed identity validation failed:", error);
    
    if (clientId) {
      console.error(
        `Verify that user-assigned identity with client ID ${clientId} ` +
        `is assigned to this resource.`
      );
    }
    
    return false;
  }
}
```

**Comprehensive Error Handling Pattern:**
```typescript
import { 
  ManagedIdentityCredential, 
  AuthenticationError 
} from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { RestError } from "@azure/core-rest-pipeline";

class SecureKeyVaultService {
  private client: SecretClient;

  constructor(vaultUrl: string, clientId?: string) {
    const credential = clientId
      ? new ManagedIdentityCredential({ clientId })
      : new ManagedIdentityCredential();
    
    this.client = new SecretClient(vaultUrl, credential);
  }

  async getSecret(secretName: string): Promise<string | null> {
    try {
      const secret = await this.client.getSecret(secretName);
      return secret.value || null;
    } catch (error) {
      return this.handleError(error, secretName);
    }
  }

  private handleError(error: unknown, secretName: string): null {
    if (error instanceof AuthenticationError) {
      console.error("Authentication failed:", error.message);
      
      if (error.message.includes("No managed identity endpoint")) {
        console.error(
          "Managed Identity is not configured. " +
          "For local development, use 'az login' with Azure CLI."
        );
      }
    } else if (error instanceof RestError) {
      switch (error.statusCode) {
        case 401:
          console.error("Unauthorized: Managed identity authentication failed");
          break;
        case 403:
          console.error(
            `Forbidden: Managed identity lacks permissions for secret '${secretName}'. ` +
            "Grant 'Key Vault Secrets User' role."
          );
          break;
        case 404:
          console.error(`Secret '${secretName}' not found in Key Vault`);
          break;
        default:
          console.error(`Key Vault error (${error.statusCode}):`, error.message);
      }
    } else {
      console.error("Unexpected error:", error);
    }
    
    return null;
  }
}

// Usage
const service = new SecureKeyVaultService(
  process.env.KEY_VAULT_URL!,
  process.env.MANAGED_IDENTITY_CLIENT_ID
);

const secret = await service.getSecret("database-connection-string");
```

**Debugging Tips:**
```typescript
import { setLogLevel } from "@azure/logger";

// Enable detailed logging for troubleshooting
setLogLevel("verbose");

// Or use environment variable:
// export AZURE_LOG_LEVEL=verbose
```

### Key Takeaways

1. **Use `DefaultAzureCredential`** for automatic fallback between environments
2. **Grant proper RBAC roles** to your managed identity before deploying
3. **For user-assigned identities**, always verify the correct client ID
4. **Test locally** using Azure CLI (`az login`) before deploying
5. **Enable logging** when troubleshooting authentication issues
6. **Handle errors explicitly** to provide clear feedback on permission issues

This approach ensures your code works seamlessly in both Azure and local development environments! 🔐

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config azure-mcp-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
