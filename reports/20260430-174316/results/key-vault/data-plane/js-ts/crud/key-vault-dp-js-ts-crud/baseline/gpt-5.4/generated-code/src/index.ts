import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const secretName = "my-secret";
const initialSecretValue = "my-secret-value";
const updatedSecretValue = "updated-value";

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main(): Promise<void> {
  const vaultUrl = getRequiredEnvVar("KEY_VAULT_URL");
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(vaultUrl, credential);

  try {
    console.log(`Creating secret "${secretName}"...`);
    await client.setSecret(secretName, initialSecretValue);

    console.log(`Reading secret "${secretName}"...`);
    const createdSecret = await client.getSecret(secretName);
    console.log(`Secret value: ${createdSecret.value ?? "<empty>"}`);

    console.log(`Updating secret "${secretName}"...`);
    await client.setSecret(secretName, updatedSecretValue);

    console.log(`Reading updated secret "${secretName}"...`);
    const updatedSecret = await client.getSecret(secretName);
    console.log(`Updated secret value: ${updatedSecret.value ?? "<empty>"}`);

    console.log(`Deleting secret "${secretName}"...`);
    const deletePoller = await client.beginDeleteSecret(secretName);
    await deletePoller.pollUntilDone();

    console.log(`Purging secret "${secretName}"...`);
    await client.purgeDeletedSecret(secretName);

    console.log("Secret deleted and purged successfully.");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Key Vault operation failed: ${error.message}`);
      console.error(error.stack);
    } else {
      console.error("Key Vault operation failed with a non-Error value:", error);
    }

    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(`Application failed: ${error.message}`);
    console.error(error.stack);
  } else {
    console.error("Application failed with a non-Error value:", error);
  }

  process.exit(1);
});
