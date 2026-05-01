# Evaluation Report: identity-dp-js-ts-service-principal

**Config:** baseline/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 36.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `identity-dp-js-ts-service-principal` |
| Config | baseline/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 36.7s |
| Timestamp | 2026-04-30T23:23:50Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 36.6s |
| **Total** | **36.7s** |

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
| Token Usage | in=16485 out=2347 |
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

The user is asking for guidance on authenticating to Azure using a Service Principal with client secret in Node.js/TypeScript. This is a straightforward request for code examples and best practices - not asking me to modify any existing codebase.

I should provide:
1. Required npm packages
2. How to create ClientSecretCredential
3. Example usage with an Azure SDK client
4. Best practices for secret management
5. Error handling patterns

This is a knowledge-sharing/tutorial request, not a task that requires exploring a codebase or making changes. I should provide a complete, well-documented TypeScript example with explanations.

I don't need to use any tools for this - I can directly provide the information and code examples.

## Copilot Response

I'll provide you with a complete guide for authenticating to Azure using a Service Principal with client secret in TypeScript.

## 1. Required npm packages

```bash
npm install @azure/identity @azure/keyvault-secrets dotenv
# Or if using another Azure SDK (e.g., Storage, Cosmos DB):
npm install @azure/storage-blob @azure/cosmos
```

## 2. Complete TypeScript Example

```typescript
import { ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Configuration interface
interface AzureServicePrincipalConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

// Validate required environment variables
function getServicePrincipalConfig(): AzureServicePrincipalConfig {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing required environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
    );
  }

  return { tenantId, clientId, clientSecret };
}

// Create credential with error handling
function createCredential(): ClientSecretCredential {
  try {
    const config = getServicePrincipalConfig();
    
    const credential = new ClientSecretCredential(
      config.tenantId,
      config.clientId,
      config.clientSecret
    );

    return credential;
  } catch (error) {
    console.error("Failed to create credential:", error);
    throw error;
  }
}

// Example: Using credential with Key Vault
async function accessKeyVault(vaultUrl: string, secretName: string): Promise<string> {
  try {
    // Create credential
    const credential = createCredential();

    // Create Azure SDK client
    const client = new SecretClient(vaultUrl, credential);

    // Use the client
    const secret = await client.getSecret(secretName);
    
    if (!secret.value) {
      throw new Error(`Secret ${secretName} has no value`);
    }

    return secret.value;
  } catch (error) {
    // Handle specific authentication errors
    if (error instanceof Error) {
      if (error.message.includes("AADSTS")) {
        console.error("Azure AD authentication error:", error.message);
        throw new Error("Authentication failed. Check tenant ID, client ID, and client secret.");
      } else if (error.message.includes("ENOTFOUND")) {
        console.error("Network error:", error.message);
        throw new Error("Cannot reach Azure services. Check network connection.");
      } else if (error.message.includes("401") || error.message.includes("403")) {
        console.error("Authorization error:", error.message);
        throw new Error("Service Principal lacks required permissions.");
      }
    }
    
    console.error("Unexpected error:", error);
    throw error;
  }
}

// Example: Main function with comprehensive error handling
async function main() {
  try {
    const vaultUrl = process.env.AZURE_KEY_VAULT_URL || "https://your-vault.vault.azure.net/";
    const secretName = "my-secret";

    console.log("Authenticating to Azure...");
    const secretValue = await accessKeyVault(vaultUrl, secretName);
    console.log("Successfully retrieved secret");
    
    // Use the secret (never log actual secret values!)
    // console.log("Secret value:", secretValue); // DON'T DO THIS
    
  } catch (error) {
    console.error("Application error:", error);
    process.exit(1);
  }
}

main();
```

## 3. Environment Configuration (.env file)

```env
# Azure Service Principal credentials
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here

# Azure resource URLs
AZURE_KEY_VAULT_URL=https://your-vault.vault.azure.net/
```

## 4. Best Practices for Secret Management

```typescript
// secrets-manager.ts
import { SecretClient } from "@azure/keyvault-secrets";
import { ClientSecretCredential } from "@azure/identity";

/**
 * Centralized secrets manager using Azure Key Vault
 */
export class SecretsManager {
  private static instance: SecretsManager;
  private secretClient: SecretClient;
  private cache: Map<string, { value: string; expiry: number }>;

  private constructor() {
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      process.env.AZURE_CLIENT_SECRET!
    );

    this.secretClient = new SecretClient(
      process.env.AZURE_KEY_VAULT_URL!,
      credential
    );

    this.cache = new Map();
  }

  static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  async getSecret(name: string, cacheDurationMs: number = 300000): Promise<string> {
    // Check cache first
    const cached = this.cache.get(name);
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }

    // Fetch from Key Vault
    const secret = await this.secretClient.getSecret(name);
    if (!secret.value) {
      throw new Error(`Secret ${name} is empty`);
    }

    // Cache the value
    this.cache.set(name, {
      value: secret.value,
      expiry: Date.now() + cacheDurationMs,
    });

    return secret.value;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
```

## 5. Security Best Practices Checklist

```typescript
// security-best-practices.ts

/**
 * BEST PRACTICES FOR SECRET MANAGEMENT:
 * 
 * 1. NEVER commit secrets to version control
 *    - Add .env to .gitignore
 *    - Use environment variables or Azure Key Vault
 * 
 * 2. Use Azure Key Vault for production
 *    - Store all secrets in Key Vault
 *    - Use Managed Identity when possible (eliminates secrets entirely)
 * 
 * 3. Rotate secrets regularly
 *    - Set expiration dates
 *    - Implement automated rotation
 * 
 * 4. Limit Service Principal permissions
 *    - Follow principle of least privilege
 *    - Use RBAC to grant minimal required access
 * 
 * 5. Never log secrets
 *    - Sanitize logs before output
 *    - Use structured logging with secret masking
 * 
 * 6. Use different credentials per environment
 *    - Separate dev/staging/prod Service Principals
 *    - Isolate access boundaries
 */

// Example: Sanitized logging
function sanitizeLogData(data: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ["secret", "password", "token", "key", "credential"];
  const sanitized = { ...data };

  for (const key in sanitized) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = "***REDACTED***";
    }
  }

  return sanitized;
}

console.log(sanitizeLogData({
  clientId: "abc123",
  clientSecret: "super-secret", // Will be redacted
  tenantId: "xyz789"
}));
```

## 6. .gitignore (Critical!)

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Node modules
node_modules/

# Logs
*.log
```

## Key Points:

1. **Use `@azure/identity`** - Modern, standardized Azure authentication
2. **Environment variables** - Keep secrets out of code
3. **Azure Key Vault** - Production-grade secret storage
4. **Error handling** - Catch auth failures and provide actionable messages
5. **Never log secrets** - Sanitize all logging output
6. **Least privilege** - Grant minimal required permissions to Service Principal

This setup follows Azure and Node.js security best practices while providing robust error handling for authentication failures.

## Re-run Command

```bash
hyoka run --prompt-id identity-dp-js-ts-service-principal --config baseline/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
