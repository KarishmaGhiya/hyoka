# Azure Managed Identity Authentication Guide for Node.js/TypeScript

## Overview

Managed Identity provides Azure resources with an automatically managed identity in Azure AD. This eliminates the need to manage credentials in your code.

## 1. System-Assigned vs User-Assigned Managed Identity

### System-Assigned Managed Identity
- **Lifecycle**: Tied to the Azure resource (VM, App Service, Function, etc.)
- **Deleted**: When the resource is deleted
- **Use case**: Single application per resource
- **Limit**: One per resource

### User-Assigned Managed Identity
- **Lifecycle**: Independent Azure resource
- **Deleted**: Manually, persists after resource deletion
- **Use case**: Multiple applications/resources sharing the same identity
- **Limit**: Multiple per resource

### Comparison Table

| Feature | System-Assigned | User-Assigned |
|---------|----------------|---------------|
| Creation | Automatically with resource | Standalone Azure resource |
| Lifecycle | Bound to resource | Independent |
| Sharing | No | Yes, across multiple resources |
| Management | Simpler | More flexible |

## 2. Creating ManagedIdentityCredential

### Prerequisites

```bash
npm install @azure/identity
```

### System-Assigned Managed Identity

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// Simple: Let Azure detect the system-assigned identity
const credential = new ManagedIdentityCredential();

// The credential will automatically use the system-assigned identity
// No client ID or resource ID needed
```

### User-Assigned Managed Identity

There are three ways to specify a user-assigned managed identity:

#### Option 1: Using Client ID (Recommended)

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

const credential = new ManagedIdentityCredential({
  clientId: "00000000-0000-0000-0000-000000000000" // Your managed identity client ID
});
```

#### Option 2: Using Resource ID

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

const credential = new ManagedIdentityCredential({
  resourceId: "/subscriptions/{subscription-id}/resourcegroups/{resource-group}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{identity-name}"
});
```

#### Option 3: Using Object ID (Less Common)

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

const credential = new ManagedIdentityCredential({
  objectId: "00000000-0000-0000-0000-000000000000" // Your managed identity object ID
});
```

## 3. Using with Azure SDK Clients

### Example 1: Azure Key Vault

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// System-assigned
const credential = new ManagedIdentityCredential();

// User-assigned
// const credential = new ManagedIdentityCredential({
//   clientId: process.env.AZURE_CLIENT_ID
// });

const vaultUrl = "https://my-keyvault.vault.azure.net";
const client = new SecretClient(vaultUrl, credential);

async function getSecret(secretName: string): Promise<string> {
  try {
    const secret = await client.getSecret(secretName);
    return secret.value || "";
  } catch (error) {
    console.error("Error retrieving secret:", error);
    throw error;
  }
}
```

### Example 2: Azure Storage Blob

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

const credential = new ManagedIdentityCredential({
  clientId: process.env.AZURE_USER_ASSIGNED_CLIENT_ID // Optional for user-assigned
});

const accountName = "mystorageaccount";
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  credential
);

async function listContainers(): Promise<void> {
  try {
    const containerIterator = blobServiceClient.listContainers();
    for await (const container of containerIterator) {
      console.log(`Container: ${container.name}`);
    }
  } catch (error) {
    console.error("Error listing containers:", error);
    throw error;
  }
}
```

### Example 3: Azure Cosmos DB

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { CosmosClient } from "@azure/cosmos";

const credential = new ManagedIdentityCredential();

const endpoint = "https://my-cosmos-account.documents.azure.com:443/";
const client = new CosmosClient({
  endpoint,
  aadCredentials: credential
});

async function queryDatabase(): Promise<void> {
  try {
    const database = client.database("myDatabase");
    const container = database.container("myContainer");
    
    const { resources } = await container.items
      .query("SELECT * FROM c")
      .fetchAll();
    
    console.log("Items:", resources);
  } catch (error) {
    console.error("Error querying database:", error);
    throw error;
  }
}
```

### Example 4: Azure Service Bus

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { ServiceBusClient } from "@azure/service-bus";

const credential = new ManagedIdentityCredential();

const fullyQualifiedNamespace = "my-servicebus.servicebus.windows.net";
const client = new ServiceBusClient(fullyQualifiedNamespace, credential);

async function sendMessage(queueName: string, messageBody: string): Promise<void> {
  const sender = client.createSender(queueName);
  
  try {
    await sender.sendMessages({ body: messageBody });
    console.log("Message sent successfully");
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  } finally {
    await sender.close();
  }
}
```

## 4. Local Development Fallback Strategies

### Strategy 1: DefaultAzureCredential (Recommended)

```typescript
import { DefaultAzureCredential } from "@azure/identity";

// Attempts credentials in this order:
// 1. Environment variables (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
// 2. Managed Identity
// 3. Visual Studio Code
// 4. Azure CLI
// 5. Azure PowerShell

const credential = new DefaultAzureCredential();

// Works seamlessly in both local and Azure environments
```

### Strategy 2: ChainedTokenCredential

```typescript
import {
  ChainedTokenCredential,
  ManagedIdentityCredential,
  AzureCliCredential,
  EnvironmentCredential
} from "@azure/identity";

// Create a custom fallback chain
const credential = new ChainedTokenCredential(
  new EnvironmentCredential(),          // Try environment variables first
  new ManagedIdentityCredential(),       // Then managed identity (in Azure)
  new AzureCliCredential()               // Finally Azure CLI (local development)
);
```

### Strategy 3: Environment-Based Selection

```typescript
import {
  ManagedIdentityCredential,
  AzureCliCredential,
  TokenCredential
} from "@azure/identity";

function getCredential(): TokenCredential {
  const isProduction = process.env.NODE_ENV === "production";
  const isAzureEnvironment = process.env.AZURE_FUNCTIONS_ENVIRONMENT || 
                             process.env.WEBSITE_INSTANCE_ID;
  
  if (isProduction || isAzureEnvironment) {
    // Use Managed Identity in Azure
    const clientId = process.env.AZURE_CLIENT_ID;
    return new ManagedIdentityCredential(
      clientId ? { clientId } : undefined
    );
  } else {
    // Use Azure CLI for local development
    return new AzureCliCredential();
  }
}

const credential = getCredential();
```

### Strategy 4: Configuration File

```typescript
// config.ts
import {
  TokenCredential,
  ManagedIdentityCredential,
  DefaultAzureCredential,
  ClientSecretCredential
} from "@azure/identity";

interface AzureConfig {
  keyVaultUrl: string;
  storageAccountName: string;
  credential: TokenCredential;
}

export function getAzureConfig(): AzureConfig {
  const environment = process.env.ENVIRONMENT || "local";
  
  switch (environment) {
    case "production":
      return {
        keyVaultUrl: process.env.KEY_VAULT_URL!,
        storageAccountName: process.env.STORAGE_ACCOUNT_NAME!,
        credential: new ManagedIdentityCredential({
          clientId: process.env.AZURE_USER_ASSIGNED_CLIENT_ID
        })
      };
    
    case "staging":
      return {
        keyVaultUrl: process.env.KEY_VAULT_URL!,
        storageAccountName: process.env.STORAGE_ACCOUNT_NAME!,
        credential: new ManagedIdentityCredential() // System-assigned
      };
    
    case "development":
      // Use service principal for development
      return {
        keyVaultUrl: process.env.KEY_VAULT_URL!,
        storageAccountName: process.env.STORAGE_ACCOUNT_NAME!,
        credential: new ClientSecretCredential(
          process.env.AZURE_TENANT_ID!,
          process.env.AZURE_CLIENT_ID!,
          process.env.AZURE_CLIENT_SECRET!
        )
      };
    
    default: // local
      return {
        keyVaultUrl: process.env.KEY_VAULT_URL || "https://dev-kv.vault.azure.net",
        storageAccountName: process.env.STORAGE_ACCOUNT_NAME || "devstorageaccount",
        credential: new DefaultAzureCredential()
      };
  }
}
```

## 5. Common Pitfalls and Error Handling

### Pitfall 1: Missing Role Assignments

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

async function getSecretWithErrorHandling(secretName: string): Promise<string | null> {
  const credential = new ManagedIdentityCredential();
  const client = new SecretClient(process.env.KEY_VAULT_URL!, credential);
  
  try {
    const secret = await client.getSecret(secretName);
    return secret.value || null;
  } catch (error: any) {
    // Check for specific error types
    if (error.statusCode === 403) {
      console.error("Access denied. The managed identity doesn't have permission.");
      console.error("Required role: 'Key Vault Secrets User' or 'Key Vault Secrets Officer'");
      console.error("Assign role: az role assignment create --assignee <identity-principal-id> --role 'Key Vault Secrets User' --scope <key-vault-resource-id>");
    } else if (error.statusCode === 404) {
      console.error(`Secret '${secretName}' not found in Key Vault`);
    } else if (error.code === "ENOTFOUND") {
      console.error("Key Vault URL is invalid or unreachable");
    } else {
      console.error("Unexpected error:", error.message);
    }
    return null;
  }
}
```

### Pitfall 2: Managed Identity Not Enabled

```typescript
import { ManagedIdentityCredential, CredentialUnavailableError } from "@azure/identity";

async function testManagedIdentity(): Promise<boolean> {
  const credential = new ManagedIdentityCredential();
  
  try {
    // Try to get a token for Azure Storage
    const token = await credential.getToken("https://storage.azure.com/.default");
    console.log("Managed Identity is working!");
    return true;
  } catch (error) {
    if (error instanceof CredentialUnavailableError) {
      console.error("Managed Identity is not available.");
      console.error("Possible reasons:");
      console.error("1. Not running on Azure (VM, App Service, Function, etc.)");
      console.error("2. Managed Identity not enabled on the resource");
      console.error("3. IMDS endpoint not accessible");
      return false;
    }
    throw error;
  }
}
```

### Pitfall 3: Wrong Client ID for User-Assigned Identity

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

async function validateUserAssignedIdentity(clientId: string): Promise<boolean> {
  const credential = new ManagedIdentityCredential({ clientId });
  
  try {
    const token = await credential.getToken("https://management.azure.com/.default");
    console.log("User-assigned identity validated successfully");
    return true;
  } catch (error: any) {
    if (error.message?.includes("No MSI credential available")) {
      console.error(`No user-assigned identity found with client ID: ${clientId}`);
      console.error("Verify:");
      console.error("1. The managed identity is created in Azure");
      console.error("2. The managed identity is assigned to this resource");
      console.error("3. The client ID is correct");
      return false;
    }
    throw error;
  }
}
```

### Pitfall 4: Token Expiration Not Handled

```typescript
import { ManagedIdentityCredential, AccessToken } from "@azure/identity";

class TokenCache {
  private tokenCache: Map<string, AccessToken> = new Map();
  private credential: ManagedIdentityCredential;
  
  constructor(credential: ManagedIdentityCredential) {
    this.credential = credential;
  }
  
  async getToken(scope: string): Promise<string> {
    const cached = this.tokenCache.get(scope);
    
    // Check if token is still valid (with 5-minute buffer)
    if (cached && cached.expiresOnTimestamp > Date.now() + 5 * 60 * 1000) {
      return cached.token;
    }
    
    // Get new token
    const token = await this.credential.getToken(scope);
    this.tokenCache.set(scope, token);
    return token.token;
  }
}

// Usage
const credential = new ManagedIdentityCredential();
const tokenCache = new TokenCache(credential);

// Token is automatically refreshed when needed
const token = await tokenCache.getToken("https://storage.azure.com/.default");
```

### Pitfall 5: Network Issues with IMDS Endpoint

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { retry } from "./retry-helper"; // Custom retry implementation

async function getManagedIdentityTokenWithRetry(scope: string): Promise<string> {
  const credential = new ManagedIdentityCredential();
  
  try {
    const token = await retry(
      async () => credential.getToken(scope),
      {
        maxRetries: 3,
        delayMs: 1000,
        backoffMultiplier: 2
      }
    );
    return token.token;
  } catch (error: any) {
    if (error.code === "ETIMEDOUT" || error.code === "ECONNREFUSED") {
      console.error("IMDS endpoint unreachable. Check:");
      console.error("1. Network connectivity");
      console.error("2. Firewall rules");
      console.error("3. Azure service health");
    }
    throw error;
  }
}

// Simple retry helper
async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; delayMs: number; backoffMultiplier: number }
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i <= options.maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (i < options.maxRetries) {
        const delay = options.delayMs * Math.pow(options.backoffMultiplier, i);
        console.log(`Retry ${i + 1}/${options.maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}
```

### Pitfall 6: Multiple User-Assigned Identities

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// When a resource has multiple user-assigned identities,
// you MUST specify which one to use

// ❌ WRONG: This will fail if multiple identities are assigned
const wrongCredential = new ManagedIdentityCredential();

// ✅ CORRECT: Always specify the client ID
const correctCredential = new ManagedIdentityCredential({
  clientId: process.env.AZURE_CLIENT_ID
});

// Best practice: Use environment variables for configuration
interface ManagedIdentityConfig {
  type: "system" | "user";
  clientId?: string;
}

function createManagedIdentityCredential(config: ManagedIdentityConfig): ManagedIdentityCredential {
  if (config.type === "user") {
    if (!config.clientId) {
      throw new Error("Client ID is required for user-assigned managed identity");
    }
    return new ManagedIdentityCredential({ clientId: config.clientId });
  }
  
  return new ManagedIdentityCredential();
}
```

## Complete Example: Production-Ready Service

```typescript
import {
  ManagedIdentityCredential,
  DefaultAzureCredential,
  TokenCredential,
  CredentialUnavailableError
} from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { BlobServiceClient } from "@azure/storage-blob";

class AzureService {
  private credential: TokenCredential;
  private secretClient: SecretClient;
  private blobServiceClient: BlobServiceClient;
  
  constructor() {
    this.credential = this.createCredential();
    this.secretClient = new SecretClient(
      process.env.KEY_VAULT_URL!,
      this.credential
    );
    this.blobServiceClient = new BlobServiceClient(
      `https://${process.env.STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
      this.credential
    );
  }
  
  private createCredential(): TokenCredential {
    const isAzureEnvironment = 
      process.env.WEBSITE_INSTANCE_ID || // App Service
      process.env.AZURE_FUNCTIONS_ENVIRONMENT || // Functions
      process.env.CONTAINER_APP_NAME; // Container Apps
    
    if (isAzureEnvironment) {
      // Use Managed Identity in Azure
      const clientId = process.env.AZURE_USER_ASSIGNED_CLIENT_ID;
      
      if (clientId) {
        console.log("Using user-assigned managed identity");
        return new ManagedIdentityCredential({ clientId });
      } else {
        console.log("Using system-assigned managed identity");
        return new ManagedIdentityCredential();
      }
    } else {
      // Use DefaultAzureCredential for local development
      console.log("Using DefaultAzureCredential for local development");
      return new DefaultAzureCredential();
    }
  }
  
  async getSecret(secretName: string): Promise<string> {
    try {
      const secret = await this.secretClient.getSecret(secretName);
      return secret.value || "";
    } catch (error: any) {
      this.handleError("getSecret", error);
      throw error;
    }
  }
  
  async uploadBlob(containerName: string, blobName: string, content: Buffer): Promise<void> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(content, content.length);
    } catch (error: any) {
      this.handleError("uploadBlob", error);
      throw error;
    }
  }
  
  private handleError(operation: string, error: any): void {
    console.error(`Error in ${operation}:`, error.message);
    
    if (error instanceof CredentialUnavailableError) {
      console.error("Managed Identity is not available");
      console.error("Ensure managed identity is enabled on this resource");
    } else if (error.statusCode === 403) {
      console.error("Access denied - check role assignments");
    } else if (error.statusCode === 404) {
      console.error("Resource not found");
    } else if (error.code === "ETIMEDOUT") {
      console.error("Request timeout - check network connectivity");
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      // Test credential by getting a token
      const token = await this.credential.getToken("https://vault.azure.net/.default");
      console.log("Health check passed - credential is valid");
      return true;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }
}

// Usage
export async function main(): Promise<void> {
  const service = new AzureService();
  
  // Verify authentication works
  const healthy = await service.healthCheck();
  if (!healthy) {
    throw new Error("Azure service health check failed");
  }
  
  // Use the service
  const secret = await service.getSecret("my-secret");
  console.log("Retrieved secret successfully");
  
  await service.uploadBlob("my-container", "test.txt", Buffer.from("Hello Azure!"));
  console.log("Uploaded blob successfully");
}
```

## Best Practices Summary

1. **Use DefaultAzureCredential** for most scenarios - it handles local development and production seamlessly
2. **Always specify clientId** when using user-assigned managed identity with multiple identities
3. **Handle errors gracefully** - check for 403 (permissions) and CredentialUnavailableError
4. **Assign minimal permissions** - follow principle of least privilege
5. **Test locally** with Azure CLI: `az login` before deploying
6. **Monitor token acquisition** - log authentication attempts for debugging
7. **Use environment variables** for configuration, never hardcode IDs
8. **Implement retry logic** for transient IMDS failures
9. **Document role requirements** in your deployment guides
10. **Validate identity** during application startup with health checks

## Required Azure Role Assignments

Common roles you'll need to assign to your managed identity:

- **Key Vault**: `Key Vault Secrets User` or `Key Vault Secrets Officer`
- **Storage**: `Storage Blob Data Contributor` or `Storage Blob Data Reader`
- **Service Bus**: `Azure Service Bus Data Owner` or `Azure Service Bus Data Sender`
- **Cosmos DB**: `Cosmos DB Built-in Data Contributor`
- **SQL Database**: `SQL DB Contributor` or custom roles

```bash
# Assign role to system-assigned identity
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Key Vault Secrets User" \
  --scope <key-vault-resource-id>

# Assign role to user-assigned identity
az role assignment create \
  --assignee <user-assigned-identity-client-id> \
  --role "Storage Blob Data Contributor" \
  --scope <storage-account-resource-id>
```
