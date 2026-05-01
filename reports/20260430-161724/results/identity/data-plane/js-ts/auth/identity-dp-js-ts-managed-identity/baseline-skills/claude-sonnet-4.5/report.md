# Evaluation Report: identity-dp-js-ts-managed-identity

**Config:** baseline-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 53.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-managed-identity` |
| Config | baseline-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 53.0s |
| Timestamp | 2026-04-30T23:22:20Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 52.9s |
| **Total** | **53.0s** |

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
| Token Usage | in=16475 out=4132 |
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

The user is asking for a comprehensive guide on using Managed Identity to authenticate Azure SDK clients in Node.js. This is a technical documentation/tutorial request, not a code change request to an existing repository.

I should provide:
1. Clear explanations of system-assigned vs user-assigned managed identity
2. TypeScript examples showing how to create ManagedIdentityCredential for each type
3. Examples of using it with Azure SDK clients
4. Local development fallback strategies
5. Common pitfalls and error handling

This is a straightforward knowledge request that I can answer directly without needing to use tools to explore a codebase or make changes. I'll provide comprehensive TypeScript examples and explanations.

## Copilot Response

I'll provide a comprehensive guide on using Managed Identity with Azure SDK clients in Node.js/TypeScript.

## Azure Managed Identity with Node.js - Complete Guide

### 1. System-Assigned vs User-Assigned Managed Identity

**System-Assigned Managed Identity:**
- Tied to a single Azure resource lifecycle
- Automatically deleted when the resource is deleted
- Simpler to set up, no need to specify client ID
- Use when: One identity per resource is sufficient

**User-Assigned Managed Identity:**
- Independent lifecycle, can be shared across resources
- Persists after resource deletion
- Requires explicit client ID reference
- Use when: Multiple resources need the same identity or identity should outlive resources

### 2. Creating ManagedIdentityCredential

**For System-Assigned Identity:**

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned - no parameters needed
const credential = new ManagedIdentityCredential();

// The credential will automatically discover the system-assigned identity
// from the Azure environment (VM, App Service, Container Instance, etc.)
```

**For User-Assigned Identity:**

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// Option 1: Using client ID (most common)
const credential = new ManagedIdentityCredential({
  clientId: "your-user-assigned-identity-client-id"
});

// Option 2: Using resource ID (less common)
const credential = new ManagedIdentityCredential({
  resourceId: "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{name}"
});
```

### 3. Using with Azure SDK Clients

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";
import { CosmosClient } from "@azure/cosmos";

// System-assigned example
const credential = new ManagedIdentityCredential();

// Azure Blob Storage
const blobServiceClient = new BlobServiceClient(
  "https://mystorageaccount.blob.core.windows.net",
  credential
);

// Azure Key Vault
const keyVaultUrl = "https://myvault.vault.azure.net";
const secretClient = new SecretClient(keyVaultUrl, credential);

// Azure Cosmos DB
const cosmosClient = new CosmosClient({
  endpoint: "https://mycosmosdb.documents.azure.com:443/",
  aadCredentials: credential
});

// User-assigned example
const userCredential = new ManagedIdentityCredential({
  clientId: process.env.AZURE_USER_ASSIGNED_CLIENT_ID
});

const userBlobClient = new BlobServiceClient(
  "https://mystorageaccount.blob.core.windows.net",
  userCredential
);
```

### 4. Local Development Fallback Strategies

**Strategy 1: DefaultAzureCredential (Recommended)**

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

// DefaultAzureCredential tries credentials in this order:
// 1. EnvironmentCredential (env vars)
// 2. WorkloadIdentityCredential (Kubernetes)
// 3. ManagedIdentityCredential (Azure resources)
// 4. AzureCliCredential (Azure CLI login)
// 5. AzurePowerShellCredential
// 6. AzureDeveloperCliCredential
const credential = new DefaultAzureCredential();

const blobClient = new BlobServiceClient(
  "https://mystorageaccount.blob.core.windows.net",
  credential
);

// Works in Azure (uses Managed Identity) AND locally (uses Azure CLI)
```

**Strategy 2: Environment-Based Credential Selection**

```typescript
import { 
  ManagedIdentityCredential, 
  AzureCliCredential,
  ChainedTokenCredential 
} from "@azure/identity";

function getCredential() {
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction) {
    // In Azure, use Managed Identity
    return new ManagedIdentityCredential({
      clientId: process.env.AZURE_USER_ASSIGNED_CLIENT_ID
    });
  } else {
    // Locally, use Azure CLI
    return new AzureCliCredential();
  }
}

const credential = getCredential();
```

**Strategy 3: ChainedTokenCredential (Explicit Fallback)**

```typescript
import { 
  ChainedTokenCredential,
  ManagedIdentityCredential,
  AzureCliCredential,
  EnvironmentCredential
} from "@azure/identity";

// Try credentials in order until one succeeds
const credential = new ChainedTokenCredential(
  new EnvironmentCredential(),
  new ManagedIdentityCredential({
    clientId: process.env.AZURE_USER_ASSIGNED_CLIENT_ID
  }),
  new AzureCliCredential()
);

// Attempts:
// 1. Environment variables (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, etc.)
// 2. Managed Identity (in Azure)
// 3. Azure CLI (local development)
```

**Strategy 4: Configuration-Based with Type Safety**

```typescript
import { TokenCredential, ManagedIdentityCredential, AzureCliCredential } from "@azure/identity";

interface AzureConfig {
  environment: "local" | "azure";
  userAssignedClientId?: string;
}

class AzureCredentialFactory {
  static create(config: AzureConfig): TokenCredential {
    if (config.environment === "azure") {
      if (config.userAssignedClientId) {
        return new ManagedIdentityCredential({
          clientId: config.userAssignedClientId
        });
      }
      return new ManagedIdentityCredential(); // System-assigned
    }
    
    return new AzureCliCredential();
  }
}

// Usage
const config: AzureConfig = {
  environment: process.env.AZURE_ENVIRONMENT as "local" | "azure",
  userAssignedClientId: process.env.AZURE_USER_ASSIGNED_CLIENT_ID
};

const credential = AzureCredentialFactory.create(config);
```

### 5. Common Pitfalls and Error Handling

**Complete Error Handling Example:**

```typescript
import { 
  ManagedIdentityCredential,
  AzureCliCredential,
  AuthenticationError 
} from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

async function createAuthenticatedClient() {
  try {
    // Attempt 1: Managed Identity (production)
    const credential = new ManagedIdentityCredential({
      clientId: process.env.AZURE_USER_ASSIGNED_CLIENT_ID
    });

    const blobClient = new BlobServiceClient(
      process.env.AZURE_STORAGE_URL!,
      credential
    );

    // Test the credential by making a simple call
    await blobClient.getProperties();
    
    console.log("✓ Authenticated with Managed Identity");
    return blobClient;

  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.warn("⚠ Managed Identity failed, falling back to Azure CLI");
      
      try {
        // Attempt 2: Azure CLI (local development)
        const cliCredential = new AzureCliCredential();
        const blobClient = new BlobServiceClient(
          process.env.AZURE_STORAGE_URL!,
          cliCredential
        );
        
        await blobClient.getProperties();
        console.log("✓ Authenticated with Azure CLI");
        return blobClient;
        
      } catch (cliError) {
        console.error("✗ All authentication methods failed");
        throw new Error(
          "Unable to authenticate. Ensure Managed Identity is configured in Azure " +
          "or run 'az login' for local development"
        );
      }
    }
    throw error;
  }
}

// Usage with proper error handling
async function main() {
  try {
    const client = await createAuthenticatedClient();
    
    // Use the client
    const containerClient = client.getContainerClient("mycontainer");
    const blobs = containerClient.listBlobsFlat();
    
    for await (const blob of blobs) {
      console.log(`Blob: ${blob.name}`);
    }
    
  } catch (error) {
    console.error("Application error:", error);
    process.exit(1);
  }
}
```

**Common Pitfalls:**

```typescript
// ❌ PITFALL 1: Forgetting to await credential token acquisition
async function badExample() {
  const credential = new ManagedIdentityCredential();
  const client = new BlobServiceClient(url, credential);
  
  // This might fail silently - credential hasn't acquired token yet
  client.getProperties(); // Missing await!
}

// ✓ CORRECT
async function goodExample() {
  const credential = new ManagedIdentityCredential();
  const client = new BlobServiceClient(url, credential);
  await client.getProperties(); // Proper await
}

// ❌ PITFALL 2: Wrong client ID format
const badCredential = new ManagedIdentityCredential({
  clientId: "/subscriptions/..." // This is resource ID, not client ID!
});

// ✓ CORRECT: Client ID is a GUID
const goodCredential = new ManagedIdentityCredential({
  clientId: "12345678-1234-1234-1234-123456789012"
});

// ❌ PITFALL 3: Not handling IMDS timeout in Azure
async function riskyCode() {
  const credential = new ManagedIdentityCredential();
  // If IMDS is slow, this might timeout
  const token = await credential.getToken("https://storage.azure.com/.default");
}

// ✓ CORRECT: Set timeout options
const robustCredential = new ManagedIdentityCredential({
  clientId: process.env.AZURE_CLIENT_ID,
  retryOptions: {
    maxRetries: 3,
    retryDelayInMs: 800
  }
});

// ❌ PITFALL 4: Incorrect scope format
const token = await credential.getToken("https://storage.azure.com"); // Missing /.default

// ✓ CORRECT
const token = await credential.getToken("https://storage.azure.com/.default");

// ❌ PITFALL 5: Not checking environment variables
const credential = new ManagedIdentityCredential({
  clientId: process.env.AZURE_USER_ASSIGNED_CLIENT_ID // undefined!
});

// ✓ CORRECT: Validate configuration
function validateConfig() {
  if (!process.env.AZURE_STORAGE_URL) {
    throw new Error("AZURE_STORAGE_URL is required");
  }
  
  const clientId = process.env.AZURE_USER_ASSIGNED_CLIENT_ID;
  if (clientId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
    throw new Error("Invalid AZURE_USER_ASSIGNED_CLIENT_ID format");
  }
}
```

**Error Types and Handling:**

```typescript
import { 
  AuthenticationError,
  CredentialUnavailableError 
} from "@azure/identity";

async function handleAuthErrors() {
  try {
    const credential = new ManagedIdentityCredential();
    const token = await credential.getToken("https://storage.azure.com/.default");
    
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      // Managed Identity isn't available (not in Azure environment)
      console.error("Not running in Azure environment with Managed Identity");
      
    } else if (error instanceof AuthenticationError) {
      // Authentication failed (permissions issue, wrong client ID, etc.)
      console.error("Authentication failed:", error.message);
      console.error("Ensure the Managed Identity has proper RBAC roles assigned");
      
    } else if (error.code === "ETIMEDOUT") {
      // IMDS endpoint timeout
      console.error("IMDS timeout - check network configuration");
      
    } else {
      console.error("Unexpected error:", error);
    }
  }
}
```

### Complete Working Example

```typescript
import { 
  DefaultAzureCredential,
  ManagedIdentityCredential 
} from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { BlobServiceClient } from "@azure/storage-blob";

interface AppConfig {
  keyVaultUrl: string;
  storageUrl: string;
  userAssignedClientId?: string;
}

class AzureService {
  private credential;
  
  constructor(config: AppConfig) {
    // Use DefaultAzureCredential for flexibility
    // Or specify user-assigned for production
    if (config.userAssignedClientId) {
      this.credential = new ManagedIdentityCredential({
        clientId: config.userAssignedClientId
      });
    } else {
      this.credential = new DefaultAzureCredential();
    }
  }
  
  async getSecret(secretName: string): Promise<string> {
    const secretClient = new SecretClient(
      process.env.KEY_VAULT_URL!,
      this.credential
    );
    
    const secret = await secretClient.getSecret(secretName);
    return secret.value!;
  }
  
  async uploadBlob(containerName: string, blobName: string, content: Buffer): Promise<void> {
    const blobServiceClient = new BlobServiceClient(
      process.env.STORAGE_URL!,
      this.credential
    );
    
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(content, content.length);
  }
}

// Usage
const config: AppConfig = {
  keyVaultUrl: process.env.KEY_VAULT_URL!,
  storageUrl: process.env.STORAGE_URL!,
  userAssignedClientId: process.env.AZURE_USER_ASSIGNED_CLIENT_ID
};

const azureService = new AzureService(config);

async function main() {
  try {
    const secret = await azureService.getSecret("my-secret");
    console.log("Retrieved secret successfully");
    
    await azureService.uploadBlob("mycontainer", "test.txt", Buffer.from("Hello"));
    console.log("Uploaded blob successfully");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
```

### Package Dependencies

```json
{
  "dependencies": {
    "@azure/identity": "^4.0.0",
    "@azure/keyvault-secrets": "^4.7.0",
    "@azure/storage-blob": "^12.17.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

This guide covers all essential aspects of using Managed Identity in Node.js. Use `DefaultAzureCredential` for most cases—it provides the best developer experience with automatic fallback to Azure CLI locally.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-managed-identity --config baseline-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
