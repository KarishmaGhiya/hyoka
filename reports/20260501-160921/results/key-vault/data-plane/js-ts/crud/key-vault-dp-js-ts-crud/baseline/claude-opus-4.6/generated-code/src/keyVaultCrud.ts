import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// Set KEY_VAULT_URL to your vault's URI, e.g. https://my-vault.vault.azure.net
const vaultUrl = process.env.KEY_VAULT_URL;
if (!vaultUrl) {
  console.error("ERROR: Set the KEY_VAULT_URL environment variable (e.g. https://<vault-name>.vault.azure.net)");
  process.exit(1);
}

const credential = new DefaultAzureCredential();
const client = new SecretClient(vaultUrl, credential);

const SECRET_NAME = "my-secret";

async function main(): Promise<void> {
  try {
    // 1. Create
    console.log(`\n--- Creating secret "${SECRET_NAME}" ---`);
    const created = await client.setSecret(SECRET_NAME, "my-secret-value");
    console.log(`  Created: ${created.name} (version: ${created.properties.version})`);

    // 2. Read
    console.log(`\n--- Reading secret "${SECRET_NAME}" ---`);
    const read = await client.getSecret(SECRET_NAME);
    console.log(`  Value : ${read.value}`);

    // 3. Update
    console.log(`\n--- Updating secret "${SECRET_NAME}" ---`);
    const updated = await client.setSecret(SECRET_NAME, "updated-value");
    console.log(`  Updated: ${updated.name} (version: ${updated.properties.version})`);

    const verify = await client.getSecret(SECRET_NAME);
    console.log(`  New value: ${verify.value}`);

    // 4. Delete & Purge (soft-delete enabled vault)
    console.log(`\n--- Deleting secret "${SECRET_NAME}" ---`);
    const deletePoller = await client.beginDeleteSecret(SECRET_NAME);
    const deleted = await deletePoller.pollUntilDone();
    console.log(`  Deleted : ${deleted.name} (deleted on: ${deleted.deletedOn})`);

    console.log(`\n--- Purging secret "${SECRET_NAME}" ---`);
    await client.purgeDeletedSecret(SECRET_NAME);
    console.log(`  Purged successfully.`);

    console.log("\nAll CRUD operations completed.");
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`\nError: ${err.message}`);
    } else {
      console.error("\nUnknown error:", err);
    }
    process.exit(1);
  }
}

main();
