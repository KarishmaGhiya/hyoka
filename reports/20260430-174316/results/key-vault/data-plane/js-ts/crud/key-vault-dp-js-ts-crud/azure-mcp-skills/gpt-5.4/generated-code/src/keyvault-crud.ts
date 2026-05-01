import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const secretName = "my-secret";
const initialSecretValue = "my-secret-value";
const updatedSecretValue = "updated-value";

async function main(): Promise<void> {
  const vaultUrl = process.env.KEY_VAULT_URL;

  if (!vaultUrl) {
    throw new Error("Missing KEY_VAULT_URL environment variable.");
  }

  const credential = new DefaultAzureCredential();
  const client = new SecretClient(vaultUrl, credential);

  console.log(`Using Key Vault: ${vaultUrl}`);

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
    console.log(`Updated value: ${updatedSecret.value ?? "<empty>"}`);

    console.log(`Deleting secret "${secretName}"...`);
    const deletePoller = await client.beginDeleteSecret(secretName);
    await deletePoller.pollUntilDone();

    console.log(`Purging secret "${secretName}"...`);
    await client.purgeDeletedSecret(secretName);

    console.log(`Secret "${secretName}" deleted and purged.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Key Vault CRUD operation failed: ${message}`);
    throw error;
  }
}

main().catch(() => {
  process.exitCode = 1;
});
