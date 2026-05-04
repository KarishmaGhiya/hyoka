/**
 * Azure Service Principal Authentication with Client Secret
 *
 * Required packages:
 *   npm install @azure/identity @azure/keyvault-secrets
 *
 * @azure/identity       - Provides ClientSecretCredential and other credential classes
 * @azure/keyvault-secrets - Example SDK client (swap for any Azure SDK client)
 */

import { ClientSecretCredential, AuthenticationError } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// ---------------------------------------------------------------------------
// 1. Configuration — load from environment variables, never hard-code secrets
// ---------------------------------------------------------------------------
interface ServicePrincipalConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

function loadConfig(): ServicePrincipalConfig {
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
// 2. Create the credential
// ---------------------------------------------------------------------------
function createCredential(config: ServicePrincipalConfig): ClientSecretCredential {
  return new ClientSecretCredential(
    config.tenantId,
    config.clientId,
    config.clientSecret,
    {
      // Optional: configure retry and logging
      retryOptions: {
        maxRetries: 3,
        retryDelayInMs: 800,
        maxRetryDelayInMs: 6400,
      },
    }
  );
}

// ---------------------------------------------------------------------------
// 3. Use the credential with an Azure SDK client (Key Vault example)
// ---------------------------------------------------------------------------
async function useWithKeyVault(credential: ClientSecretCredential): Promise<void> {
  const vaultUrl = process.env.AZURE_KEYVAULT_URL;
  if (!vaultUrl) {
    throw new Error("Missing AZURE_KEYVAULT_URL environment variable");
  }

  const secretClient = new SecretClient(vaultUrl, credential);

  // List secrets (demonstrates the credential in action)
  console.log("Listing secrets in vault...");
  for await (const secretProperties of secretClient.listPropertiesOfSecrets()) {
    console.log(`  - ${secretProperties.name} (enabled: ${secretProperties.enabled})`);
  }
}

// ---------------------------------------------------------------------------
// 4. Verify the credential works by requesting a token directly
// ---------------------------------------------------------------------------
async function verifyCredential(credential: ClientSecretCredential): Promise<void> {
  const tokenResponse = await credential.getToken(
    "https://management.azure.com/.default"
  );
  console.log(
    `Token acquired, expires: ${new Date(tokenResponse.expiresOnTimestamp).toISOString()}`
  );
}

// ---------------------------------------------------------------------------
// 5. Error handling
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  try {
    const config = loadConfig();
    const credential = createCredential(config);

    await verifyCredential(credential);
    await useWithKeyVault(credential);
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) {
      // AuthenticationError includes statusCode and detailed message
      console.error(`Authentication failed (HTTP ${error.statusCode}): ${error.message}`);

      // Common causes:
      // 401 — invalid client secret or client ID
      // 400 — invalid tenant ID or malformed request
      // 403 — SP exists but lacks required permissions
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("Unknown error", error);
    }
    process.exit(1);
  }
}

main();
