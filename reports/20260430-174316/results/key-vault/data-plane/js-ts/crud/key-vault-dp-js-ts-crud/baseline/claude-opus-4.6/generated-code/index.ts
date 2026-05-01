import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

// Set this environment variable before running: AZURE_KEYVAULT_URL
// Example: https://<your-vault-name>.vault.azure.net
const vaultUrl = process.env.AZURE_KEYVAULT_URL;
if (!vaultUrl) {
  console.error("Error: AZURE_KEYVAULT_URL environment variable is not set.");
  console.error("Set it to your vault URL, e.g. https://my-vault.vault.azure.net");
  process.exit(1);
}

const credential = new DefaultAzureCredential();
const client = new SecretClient(vaultUrl, credential);

const SECRET_NAME = "my-secret";

async function main(): Promise<void> {
  try {
    // 1. Create a new secret
    console.log(`\n--- Creating secret "${SECRET_NAME}" ---`);
    const created = await client.setSecret(SECRET_NAME, "my-secret-value");
    console.log(`Created secret "${created.name}" (version: ${created.properties.version})`);

    // 2. Read the secret back
    console.log(`\n--- Reading secret "${SECRET_NAME}" ---`);
    const read = await client.getSecret(SECRET_NAME);
    console.log(`Secret value: ${read.value}`);

    // 3. Update the secret to a new value
    console.log(`\n--- Updating secret "${SECRET_NAME}" ---`);
    const updated = await client.setSecret(SECRET_NAME, "updated-value");
    console.log(`Updated secret "${updated.name}" (version: ${updated.properties.version})`);

    // Verify the update
    const verify = await client.getSecret(SECRET_NAME);
    console.log(`Verified updated value: ${verify.value}`);

    // 4. Delete the secret and purge it (soft-delete enabled vault)
    console.log(`\n--- Deleting secret "${SECRET_NAME}" ---`);
    const deletePoller = await client.beginDeleteSecret(SECRET_NAME);
    const deleted = await deletePoller.pollUntilDone();
    console.log(`Deleted secret "${deleted.name}" (deleted on: ${deleted.properties.deletedOn})`);

    console.log(`\n--- Purging secret "${SECRET_NAME}" ---`);
    await client.purgeDeletedSecret(SECRET_NAME);
    console.log(`Purged secret "${SECRET_NAME}" permanently.`);

    console.log("\nAll CRUD operations completed successfully.");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unknown error occurred:", error);
    }
    process.exit(1);
  }
}

main();
