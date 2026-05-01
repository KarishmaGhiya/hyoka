# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** azure-mcp-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 45.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | azure-mcp-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 45.0s |
| Timestamp | 2026-05-01T00:48:23Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 44.9s |
| **Total** | **45.0s** |

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
| Token Usage | in=35064 out=2810 |
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

The user wants to learn how to authenticate to Azure using a Service Principal with client secret in Node.js/TypeScript. They want:
1. Required npm packages
2. How to create ClientSecretCredential
3. Using it with an Azure SDK client
4. Best practices for secret management
5. Error handling

This is a straightforward request for information/example code. I should provide a complete, well-structured TypeScript example that covers all these points. I don't need to create any files unless they ask me to, but I should provide comprehensive example code.

Let me provide a clear, complete example covering all their requirements.

## Copilot Response

I'll provide you with a complete TypeScript example for authenticating to Azure using a Service Principal with client secret.

## Required npm Packages

```bash
npm install @azure/identity @azure/keyvault-secrets dotenv
# Or any other Azure SDK package you need, e.g., @azure/storage-blob, @azure/arm-resources
```

## Complete TypeScript Example

```typescript
import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Azure Service Principal Authentication Example
 */

// 1. Retrieve credentials from environment variables (NEVER hardcode)
const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;

// 2. Validate required credentials are present
if (!tenantId || !clientId || !clientSecret) {
  throw new Error(
    "Missing required environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
  );
}

// 3. Create ClientSecretCredential
const credential = new ClientSecretCredential(
  tenantId,
  clientId,
  clientSecret,
  {
    // Optional: Configure additional options
    authorityHost: "https://login.microsoftonline.com", // Default
    // Optional: Enable logging for debugging
    // loggingOptions: {
    //   allowLoggingAccountIdentifiers: true,
    //   enableUnsafeSupportLogging: true
    // }
  }
);

// 4. Use the credential with an Azure SDK client
async function authenticateAndUseAzureService() {
  try {
    // Example: Using with Key Vault
    const keyVaultUrl = process.env.AZURE_KEYVAULT_URL;
    if (!keyVaultUrl) {
      throw new Error("AZURE_KEYVAULT_URL environment variable is required");
    }

    const secretClient = new SecretClient(keyVaultUrl, credential);

    // Test authentication by attempting to get a secret
    const secretName = "example-secret";
    const secret = await secretClient.getSecret(secretName);
    console.log(`Successfully authenticated! Retrieved secret: ${secret.name}`);

    return secret;
  } catch (error) {
    handleAuthenticationError(error);
  }
}

// 5. Error Handling for Authentication Failures
function handleAuthenticationError(error: unknown): never {
  if (error instanceof Error) {
    // Check for common authentication errors
    if (error.message.includes("AADSTS")) {
      // Azure AD error codes
      if (error.message.includes("AADSTS700016")) {
        throw new Error(
          "Authentication failed: Invalid client ID. Verify AZURE_CLIENT_ID is correct."
        );
      } else if (error.message.includes("AADSTS7000215")) {
        throw new Error(
          "Authentication failed: Invalid client secret. Verify AZURE_CLIENT_SECRET is correct."
        );
      } else if (error.message.includes("AADSTS90002")) {
        throw new Error(
          "Authentication failed: Invalid tenant ID. Verify AZURE_TENANT_ID is correct."
        );
      } else if (error.message.includes("AADSTS50034")) {
        throw new Error(
          "Authentication failed: Service principal does not exist in tenant."
        );
      }
    }

    // Network or connectivity errors
    if (error.message.includes("ENOTFOUND") || error.message.includes("ETIMEDOUT")) {
      throw new Error(
        `Network error: Unable to reach Azure services. Check your internet connection.\n${error.message}`
      );
    }

    // Permission errors
    if (error.message.includes("403") || error.message.includes("Forbidden")) {
      throw new Error(
        "Authorization failed: Service principal lacks required permissions for this resource."
      );
    }

    // Generic error
    throw new Error(`Azure authentication error: ${error.message}`);
  }

  throw new Error(`Unknown error during authentication: ${String(error)}`);
}

// 6. Example with retry logic for transient failures
async function authenticateWithRetry(maxRetries = 3, delayMs = 1000) {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Authentication attempt ${attempt}/${maxRetries}...`);
      return await authenticateAndUseAzureService();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on authentication credential errors (they won't succeed)
      if (
        lastError.message.includes("Invalid client") ||
        lastError.message.includes("AADSTS")
      ) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        console.log(`Attempt failed, retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw lastError || new Error("Authentication failed after retries");
}

// 7. Alternative: Using with other Azure services
async function examplesWithOtherServices() {
  // Example with Storage Blob
  const { BlobServiceClient } = await import("@azure/storage-blob");
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );

  // Example with Resource Management
  const { ResourceManagementClient } = await import("@azure/arm-resources");
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID!;
  const resourceClient = new ResourceManagementClient(credential, subscriptionId);

  // Example with Cosmos DB
  const { CosmosClient } = await import("@azure/cosmos");
  const endpoint = process.env.AZURE_COSMOS_ENDPOINT!;
  const cosmosClient = new CosmosClient({ endpoint, aadCredentials: credential });

  return { blobServiceClient, resourceClient, cosmosClient };
}

// Run the example
authenticateWithRetry()
  .then(() => console.log("Authentication successful!"))
  .catch((error) => console.error("Authentication failed:", error.message));
```

## .env File (NEVER commit this!)

```env
# Azure Service Principal Credentials
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here

# Resource-specific configuration
AZURE_KEYVAULT_URL=https://your-keyvault.vault.azure.net
AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
AZURE_SUBSCRIPTION_ID=your-subscription-id
```

## Best Practices for Secret Management

### 1. **Environment Variables (Development)**
```typescript
// Use dotenv for local development
import * as dotenv from "dotenv";
dotenv.config();
```

### 2. **Azure Key Vault (Production)**
```typescript
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// In production, use managed identity to access Key Vault
const keyVaultCredential = new DefaultAzureCredential();
const secretClient = new SecretClient(
  "https://your-keyvault.vault.azure.net",
  keyVaultCredential
);

// Retrieve service principal credentials from Key Vault
const tenantId = (await secretClient.getSecret("AZURE-TENANT-ID")).value;
const clientId = (await secretClient.getSecret("AZURE-CLIENT-ID")).value;
const clientSecret = (await secretClient.getSecret("AZURE-CLIENT-SECRET")).value;
```

### 3. **.gitignore Configuration**
```gitignore
.env
.env.*
!.env.example
*.local
credentials.json
```

### 4. **Environment-specific Configuration**
```typescript
// config.ts
interface AzureConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export function getAzureConfig(): AzureConfig {
  const config = {
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  };

  // Validate all required fields
  const missing = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Azure configuration: ${missing.join(", ")}`
    );
  }

  return config as AzureConfig;
}
```

### 5. **Credential Rotation Support**
```typescript
class CredentialManager {
  private credential: ClientSecretCredential;
  private lastRotation: Date;

  constructor(
    private tenantId: string,
    private clientId: string,
    private getSecret: () => Promise<string>
  ) {
    this.lastRotation = new Date();
    this.credential = this.createCredential();
  }

  private createCredential(): ClientSecretCredential {
    return new ClientSecretCredential(
      this.tenantId,
      this.clientId,
      // Secret retrieved dynamically
      this.getSecret() as any
    );
  }

  async rotateCredential(): Promise<void> {
    this.credential = this.createCredential();
    this.lastRotation = new Date();
  }

  getCredential(): ClientSecretCredential {
    return this.credential;
  }
}
```

## Key Takeaways

✅ **Use `@azure/identity` package** for authentication  
✅ **Never hardcode secrets** - use environment variables or Key Vault  
✅ **Validate credentials** before attempting authentication  
✅ **Handle Azure AD error codes** (AADSTS*) specifically  
✅ **Use retry logic** for transient network failures only  
✅ **In production**, prefer Managed Identity over Service Principal when possible  
✅ **Rotate secrets regularly** and support dynamic credential loading  
✅ **Add `.env` to `.gitignore`** immediately

This example provides production-ready authentication with proper error handling and security practices!

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config azure-mcp-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
