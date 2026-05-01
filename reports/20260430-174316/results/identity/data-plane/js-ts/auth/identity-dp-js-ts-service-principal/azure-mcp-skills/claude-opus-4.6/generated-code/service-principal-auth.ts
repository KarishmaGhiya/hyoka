/**
 * Azure Service Principal Authentication with Client Secret
 *
 * Required npm packages:
 *   npm install @azure/identity @azure/keyvault-secrets @azure/storage-blob
 *
 * Environment variables (never hardcode these):
 *   AZURE_TENANT_ID     - Your Microsoft Entra ID tenant ID
 *   AZURE_CLIENT_ID     - The service principal's application (client) ID
 *   AZURE_CLIENT_SECRET - The service principal's client secret value
 *
 * References:
 *   https://learn.microsoft.com/javascript/api/overview/azure/identity-readme
 *   https://learn.microsoft.com/azure/developer/javascript/sdk/authentication/on-premises-apps
 */

import { ClientSecretCredential, AuthenticationError } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";

// ---------------------------------------------------------------------------
// 1. Load credentials from environment variables
// ---------------------------------------------------------------------------
function loadConfig() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing required environment variables: " +
        "AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET"
    );
  }

  return { tenantId, clientId, clientSecret };
}

// ---------------------------------------------------------------------------
// 2. Create a ClientSecretCredential
// ---------------------------------------------------------------------------
function createCredential(): ClientSecretCredential {
  const { tenantId, clientId, clientSecret } = loadConfig();

  return new ClientSecretCredential(tenantId, clientId, clientSecret, {
    // Optional: configure retry and logging
    retryOptions: {
      maxRetries: 3,
      retryDelayInMs: 800,
      maxRetryDelayInMs: 5000,
    },
  });
}

// ---------------------------------------------------------------------------
// 3a. Example: Use with Azure Blob Storage
// ---------------------------------------------------------------------------
async function listBlobContainers(accountName: string): Promise<void> {
  const credential = createCredential();
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );

  console.log(`Listing containers in storage account: ${accountName}`);
  for await (const container of blobServiceClient.listContainers()) {
    console.log(`  - ${container.name}`);
  }
}

// ---------------------------------------------------------------------------
// 3b. Example: Use with Azure Key Vault
// ---------------------------------------------------------------------------
async function getKeyVaultSecret(
  vaultName: string,
  secretName: string
): Promise<string | undefined> {
  const credential = createCredential();
  const client = new SecretClient(
    `https://${vaultName}.vault.azure.net`,
    credential
  );

  const secret = await client.getSecret(secretName);
  console.log(`Retrieved secret "${secretName}" from vault "${vaultName}"`);
  return secret.value;
}

// ---------------------------------------------------------------------------
// 4. Error handling for authentication failures
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  try {
    // Replace with your actual resource names
    await listBlobContainers("mystorageaccount");
    await getKeyVaultSecret("mykeyvault", "my-secret");
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) {
      // Specific authentication errors from @azure/identity
      console.error("Authentication failed:");
      console.error(`  Status code: ${error.statusCode}`);
      console.error(`  Message:     ${error.message}`);

      // Common causes and remediation
      if (error.message.includes("AADSTS7000215")) {
        console.error("  → Invalid client secret. Rotate it in Entra ID.");
      } else if (error.message.includes("AADSTS700016")) {
        console.error("  → App not found. Verify the client ID.");
      } else if (error.message.includes("AADSTS90002")) {
        console.error("  → Tenant not found. Verify the tenant ID.");
      }
    } else if (error instanceof Error) {
      console.error(`Unexpected error: ${error.message}`);
    }
    process.exit(1);
  }
}

main();
