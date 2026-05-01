/**
 * Common Pitfalls and Error Handling
 * 
 * This file covers common issues developers encounter when using
 * Managed Identity and how to handle them properly.
 */

import {
  ManagedIdentityCredential,
  DefaultAzureCredential,
  TokenCredential,
} from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { BlobServiceClient } from "@azure/storage-blob";

/**
 * PITFALL 1: Not enabling Managed Identity on the Azure resource
 * 
 * Error: "No MSI credential available"
 * Solution: Enable system-assigned or assign user-assigned identity
 */
export async function pitfall1_IdentityNotEnabled() {
  try {
    const credential = new ManagedIdentityCredential();
    const token = await credential.getToken("https://vault.azure.net/.default");
    console.log("Identity is enabled ✓");
  } catch (error: any) {
    if (error.message?.includes("No Managed Identity endpoint found")) {
      console.error("PITFALL: Managed Identity not enabled");
      console.error("\nSOLUTION:");
      console.error("1. Azure Portal → Your Resource → Identity");
      console.error("2. Enable 'System assigned' OR assign a 'User assigned' identity");
      console.error("3. Save and redeploy your application");
      console.error("\nCLI Command:");
      console.error("  az vm identity assign --name myVM --resource-group myRG");
      console.error("  az webapp identity assign --name myApp --resource-group myRG");
    }
    throw error;
  }
}

/**
 * PITFALL 2: Missing RBAC permissions
 * 
 * Error: 403 Forbidden
 * Solution: Assign appropriate role to the identity
 */
export async function pitfall2_MissingPermissions() {
  const credential = new ManagedIdentityCredential();
  const secretClient = new SecretClient("https://mykeyvault.vault.azure.net", credential);

  try {
    await secretClient.getSecret("my-secret");
  } catch (error: any) {
    if (error.statusCode === 403) {
      console.error("PITFALL: Missing RBAC permissions");
      console.error("\nSOLUTION:");
      console.error("1. Azure Portal → Key Vault → Access control (IAM)");
      console.error("2. Add role assignment:");
      console.error("   - Role: 'Key Vault Secrets User' (or appropriate role)");
      console.error("   - Assign to: Your Managed Identity");
      console.error("\nCLI Command:");
      console.error("  # Get the principal ID of your managed identity");
      console.error("  principalId=$(az vm identity show --name myVM --resource-group myRG --query principalId -o tsv)");
      console.error("  # Assign role");
      console.error("  az role assignment create \\");
      console.error("    --role 'Key Vault Secrets User' \\");
      console.error("    --assignee $principalId \\");
      console.error("    --scope /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/{vault}");
      console.error("\nCommon Roles:");
      console.error("  - Storage Blob Data Contributor");
      console.error("  - Storage Queue Data Contributor");
      console.error("  - Key Vault Secrets User");
      console.error("  - Cosmos DB Account Reader Role");
    }
    throw error;
  }
}

/**
 * PITFALL 3: Using wrong client ID for user-assigned identity
 * 
 * Error: "The requested identity has not been assigned"
 * Solution: Verify the client ID and assignment
 */
export async function pitfall3_WrongClientId(clientId: string) {
  try {
    const credential = new ManagedIdentityCredential({ clientId });
    await credential.getToken("https://vault.azure.net/.default");
  } catch (error: any) {
    if (error.message?.includes("not been assigned")) {
      console.error("PITFALL: Wrong client ID or identity not assigned");
      console.error(`\nProvided Client ID: ${clientId}`);
      console.error("\nSOLUTION:");
      console.error("1. Verify the client ID is correct:");
      console.error("   Azure Portal → Managed Identities → Your Identity → Properties → Client ID");
      console.error("\n2. Ensure identity is assigned to your resource:");
      console.error("   Azure Portal → Your Resource → Identity → User assigned → Add");
      console.error("\nCLI Commands:");
      console.error("  # List user-assigned identities");
      console.error("  az identity list --resource-group myRG");
      console.error("  # Assign to VM");
      console.error("  az vm identity assign --name myVM --resource-group myRG \\");
      console.error("    --identities /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{identity-name}");
    }
    throw error;
  }
}

/**
 * PITFALL 4: Token expiration not handled
 * 
 * The SDK handles token refresh automatically, but you should
 * be aware of it for long-running operations
 */
export async function pitfall4_TokenExpiration() {
  const credential = new ManagedIdentityCredential();
  
  // ✓ GOOD: SDK clients handle token refresh automatically
  const blobServiceClient = new BlobServiceClient(
    "https://mystorageaccount.blob.core.windows.net",
    credential
  );

  // This will work even in long-running operations
  // The credential automatically refreshes tokens as needed
  for (let i = 0; i < 100; i++) {
    await blobServiceClient.getContainerClient(`container-${i}`).exists();
    // No need to manually refresh token
  }

  console.log("✓ Token refresh is handled automatically by Azure SDK");
}

/**
 * PITFALL 5: Not handling transient failures
 * 
 * Solution: Implement retry logic for transient errors
 */
export async function pitfall5_NoRetryLogic() {
  const credential = new ManagedIdentityCredential();
  const secretClient = new SecretClient("https://mykeyvault.vault.azure.net", credential);

  // ✗ BAD: No retry logic
  // await secretClient.getSecret("my-secret");

  // ✓ GOOD: With retry logic
  const maxRetries = 3;
  const retryDelayMs = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const secret = await secretClient.getSecret("my-secret");
      console.log("✓ Secret retrieved successfully");
      return secret.value;
    } catch (error: any) {
      const isTransient = 
        error.statusCode === 429 || // Too many requests
        error.statusCode === 503 || // Service unavailable
        error.statusCode === 504 || // Gateway timeout
        error.code === "ETIMEDOUT" ||
        error.code === "ECONNRESET";

      if (isTransient && attempt < maxRetries) {
        console.log(`Transient error, retrying (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
      } else {
        throw error;
      }
    }
  }
}

/**
 * PITFALL 6: Testing in production first
 * 
 * Solution: Test locally and validate before deploying
 */
export async function pitfall6_TestingStrategy() {
  console.log("TESTING STRATEGY:\n");

  console.log("1. LOCAL TESTING:");
  console.log("   - Use Azure CLI: az login");
  console.log("   - Use DefaultAzureCredential in your code");
  console.log("   - Verify your user account has the same permissions\n");

  console.log("2. VALIDATION:");
  console.log("   - Test authentication before using services");
  
  try {
    const credential = new DefaultAzureCredential();
    await credential.getToken("https://vault.azure.net/.default");
    console.log("   ✓ Credential validation successful\n");
  } catch (error: any) {
    console.log("   ✗ Credential validation failed");
    console.log(`   Error: ${error.message}\n`);
  }

  console.log("3. STAGING ENVIRONMENT:");
  console.log("   - Deploy to staging with Managed Identity enabled");
  console.log("   - Verify permissions are correctly assigned");
  console.log("   - Test all Azure service integrations\n");

  console.log("4. MONITORING:");
  console.log("   - Enable Application Insights");
  console.log("   - Monitor authentication failures");
  console.log("   - Set up alerts for 401/403 errors");
}

/**
 * PITFALL 7: Hardcoding resource URLs
 * 
 * Solution: Use environment variables or configuration
 */
export class ConfigurableAzureService {
  private credential: TokenCredential;
  private storageAccountName: string;
  private keyVaultName: string;

  constructor() {
    // ✓ GOOD: Read from environment variables
    this.storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
    this.keyVaultName = process.env.AZURE_KEYVAULT_NAME || "";
    
    const userAssignedClientId = process.env.AZURE_CLIENT_ID;
    
    this.credential = new DefaultAzureCredential({
      managedIdentityClientId: userAssignedClientId,
    });

    this.validate();
  }

  private validate(): void {
    if (!this.storageAccountName) {
      throw new Error("AZURE_STORAGE_ACCOUNT_NAME environment variable not set");
    }
    if (!this.keyVaultName) {
      throw new Error("AZURE_KEYVAULT_NAME environment variable not set");
    }
  }

  getBlobServiceClient(): BlobServiceClient {
    return new BlobServiceClient(
      `https://${this.storageAccountName}.blob.core.windows.net`,
      this.credential
    );
  }

  getSecretClient(): SecretClient {
    return new SecretClient(
      `https://${this.keyVaultName}.vault.azure.net`,
      this.credential
    );
  }
}

/**
 * PITFALL 8: Not understanding scope requirements
 * 
 * Different Azure services require different token scopes
 */
export async function pitfall8_IncorrectScopes() {
  const credential = new ManagedIdentityCredential();

  console.log("TOKEN SCOPES FOR DIFFERENT SERVICES:\n");

  const scopes = {
    "Storage": "https://storage.azure.com/.default",
    "Key Vault": "https://vault.azure.net/.default",
    "Azure Resource Manager": "https://management.azure.com/.default",
    "Microsoft Graph": "https://graph.microsoft.com/.default",
    "Cosmos DB": "https://cosmos.azure.com/.default",
  };

  for (const [service, scope] of Object.entries(scopes)) {
    try {
      await credential.getToken(scope);
      console.log(`✓ ${service}: ${scope}`);
    } catch (error) {
      console.log(`✗ ${service}: ${scope} (requires permission)`);
    }
  }

  console.log("\nNote: SDK clients automatically use the correct scope");
}

/**
 * Comprehensive error handler
 */
export async function handleManagedIdentityError(error: any): Promise<void> {
  console.error("\n🔴 MANAGED IDENTITY ERROR DETECTED\n");

  // Check error type and provide specific guidance
  const errorMsg = error.message?.toLowerCase() || "";
  const errorCode = error.code || "";
  const statusCode = error.statusCode || 0;

  if (errorMsg.includes("no managed identity endpoint")) {
    console.error("Issue: Managed Identity not available");
    console.error("Cause: Not running in Azure OR identity not enabled");
    console.error("Fix: Enable identity on your Azure resource\n");
  } else if (errorMsg.includes("not been assigned")) {
    console.error("Issue: User-assigned identity not assigned to resource");
    console.error("Fix: Assign the identity or check the client ID\n");
  } else if (statusCode === 403) {
    console.error("Issue: Permission denied");
    console.error("Fix: Grant appropriate RBAC role to the identity\n");
  } else if (statusCode === 401) {
    console.error("Issue: Authentication failed");
    console.error("Fix: Verify identity is properly configured\n");
  } else if (statusCode === 429) {
    console.error("Issue: Too many requests");
    console.error("Fix: Implement backoff/retry logic\n");
  } else if (errorCode === "ENOTFOUND") {
    console.error("Issue: Service endpoint not found");
    console.error("Fix: Check the resource URL\n");
  } else {
    console.error(`Issue: Unexpected error`);
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${errorCode}`);
    console.error(`Status: ${statusCode}\n`);
  }

  console.error("Full error details:", error);
}

/**
 * Best practices summary
 */
export function printBestPractices(): void {
  console.log(`
✨ MANAGED IDENTITY BEST PRACTICES

1. ✓ Use DefaultAzureCredential for maximum flexibility
   - Works in Azure with Managed Identity
   - Works locally with Azure CLI
   - Works in CI/CD with service principals

2. ✓ Use system-assigned identity when possible
   - Simpler to manage
   - Automatic lifecycle with resource
   - Use user-assigned when sharing across resources

3. ✓ Follow principle of least privilege
   - Grant only necessary permissions
   - Use specific RBAC roles, not broad ones
   - Regularly review and audit permissions

4. ✓ Handle errors gracefully
   - Implement retry logic for transient failures
   - Log authentication errors for monitoring
   - Provide helpful error messages

5. ✓ Test thoroughly
   - Test locally with Azure CLI
   - Test in staging with actual Managed Identity
   - Validate permissions before production

6. ✓ Use environment variables for configuration
   - Never hardcode resource names
   - Use different configs for dev/staging/prod
   - Keep client IDs in configuration, not code

7. ✓ Monitor authentication
   - Enable Application Insights
   - Track authentication failures
   - Set up alerts for permission issues

8. ✓ Document your setup
   - Document required permissions
   - Document identity assignments
   - Provide setup guide for new developers
  `);
}
