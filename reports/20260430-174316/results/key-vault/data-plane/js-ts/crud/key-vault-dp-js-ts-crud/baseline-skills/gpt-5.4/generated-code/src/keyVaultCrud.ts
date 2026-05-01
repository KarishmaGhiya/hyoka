import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const secretName = "my-secret";
const initialSecretValue = "my-secret-value";
const updatedSecretValue = "updated-value";
const keyVaultUrl = process.env.KEY_VAULT_URL;

function getRequiredEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function waitForDeletedSecret(client: SecretClient, name: string): Promise<void> {
  const maxAttempts = 15;
  const delayMs = 2_000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await client.getDeletedSecret(name);
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(
          `Deleted secret '${name}' was not available for purge after ${maxAttempts} attempts.`,
          { cause: error },
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function main(): Promise<void> {
  const vaultUrl = getRequiredEnvVar("KEY_VAULT_URL", keyVaultUrl);
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(vaultUrl, credential);

  try {
    console.log(`Creating secret '${secretName}'...`);
    await client.setSecret(secretName, initialSecretValue);

    console.log(`Reading secret '${secretName}'...`);
    const createdSecret = await client.getSecret(secretName);
    console.log(`Secret value: ${createdSecret.value ?? "<empty>"}`);

    console.log(`Updating secret '${secretName}'...`);
    await client.setSecret(secretName, updatedSecretValue);

    console.log(`Reading updated secret '${secretName}'...`);
    const updatedSecret = await client.getSecret(secretName);
    console.log(`Updated secret value: ${updatedSecret.value ?? "<empty>"}`);

    console.log(`Deleting secret '${secretName}'...`);
    const deletePoller = await client.beginDeleteSecret(secretName);
    await deletePoller.pollUntilDone();

    console.log(`Waiting for deleted secret '${secretName}' to become purgeable...`);
    await waitForDeletedSecret(client, secretName);

    console.log(`Purging secret '${secretName}'...`);
    await client.purgeDeletedSecret(secretName);

    console.log("CRUD workflow completed successfully.");
  } catch (error) {
    console.error("Azure Key Vault CRUD operation failed.");
    if (error instanceof Error) {
      console.error(error.message);
      if (error.cause instanceof Error) {
        console.error(`Cause: ${error.cause.message}`);
      }
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
}

void main();
