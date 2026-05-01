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
    console.log("Secret created.");
  } catch (error) {
    throw new Error(
      `Failed to create secret "${secretName}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  try {
    console.log(`Reading secret "${secretName}"...`);
    const secret = await client.getSecret(secretName);

    if (typeof secret.value !== "string") {
      throw new Error(`Secret "${secretName}" was returned without a value.`);
    }

    console.log(`Secret value: ${secret.value}`);
  } catch (error) {
    throw new Error(
      `Failed to read secret "${secretName}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  try {
    console.log(`Updating secret "${secretName}"...`);
    await client.setSecret(secretName, updatedSecretValue);
    console.log("Secret updated.");
  } catch (error) {
    throw new Error(
      `Failed to update secret "${secretName}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  try {
    console.log(`Deleting secret "${secretName}"...`);
    const deletePoller = await client.beginDeleteSecret(secretName);
    await deletePoller.pollUntilDone();
    console.log("Secret deleted.");

    console.log(`Purging secret "${secretName}"...`);
    await client.purgeDeletedSecret(secretName);
    console.log("Secret purged.");
  } catch (error) {
    throw new Error(
      `Failed to delete or purge secret "${secretName}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

main().catch((error) => {
  console.error(
    `Azure Key Vault CRUD script failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
});
