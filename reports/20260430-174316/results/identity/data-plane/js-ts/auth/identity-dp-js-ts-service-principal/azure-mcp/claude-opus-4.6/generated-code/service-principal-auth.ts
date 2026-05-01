/**
 * Azure Service Principal Authentication with Client Secret
 *
 * Required packages:
 *   npm install @azure/identity @azure/keyvault-secrets dotenv
 *
 * Environment variables (.env):
 *   AZURE_TENANT_ID=<your-tenant-id>
 *   AZURE_CLIENT_ID=<your-client-id>
 *   AZURE_CLIENT_SECRET=<your-client-secret>
 *   KEY_VAULT_URL=https://<your-vault>.vault.azure.net
 */

import { ClientSecretCredential, AuthenticationError } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import * as dotenv from "dotenv";

dotenv.config();

// ---------------------------------------------------------------------------
// 1. Validate required environment variables
// ---------------------------------------------------------------------------
function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const tenantId = getRequiredEnv("AZURE_TENANT_ID");
const clientId = getRequiredEnv("AZURE_CLIENT_ID");
const clientSecret = getRequiredEnv("AZURE_CLIENT_SECRET");
const vaultUrl = getRequiredEnv("KEY_VAULT_URL");

// ---------------------------------------------------------------------------
// 2. Create the ClientSecretCredential
// ---------------------------------------------------------------------------
const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

// ---------------------------------------------------------------------------
// 3. Use the credential with an Azure SDK client (Key Vault example)
// ---------------------------------------------------------------------------
const secretClient = new SecretClient(vaultUrl, credential);

async function listSecrets(): Promise<void> {
  console.log(`Listing secrets in ${vaultUrl}...\n`);
  for await (const secretProperties of secretClient.listPropertiesOfSecrets()) {
    console.log(`  - ${secretProperties.name}  (enabled: ${secretProperties.enabled})`);
  }
}

// ---------------------------------------------------------------------------
// 4. Error handling for authentication failures
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  try {
    await listSecrets();
    console.log("\nAuthentication and listing succeeded.");
  } catch (error: unknown) {
    if (error instanceof AuthenticationError) {
      // Specific identity-library error (bad credentials, expired secret, etc.)
      console.error("Authentication failed:", error.message);
      console.error("Status code:", error.statusCode);
    } else if (error instanceof Error) {
      console.error("Operation failed:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  }
}

main();
