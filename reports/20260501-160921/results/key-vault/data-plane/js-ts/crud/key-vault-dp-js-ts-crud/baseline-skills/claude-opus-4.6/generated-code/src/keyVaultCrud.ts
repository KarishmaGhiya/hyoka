import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// Set KEY_VAULT_URL to your vault URI, e.g. https://my-vault.vault.azure.net
const vaultUrl = process.env.KEY_VAULT_URL;
if (!vaultUrl) {
  console.error("ERROR: Set the KEY_VAULT_URL environment variable (e.g. https://<vault-name>.vault.azure.net)");
  process.exit(1);
}

const credential = new DefaultAzureCredential();
const client = new SecretClient(vaultUrl, credential);

const secretName = "my-secret";

async function main(): Promise<void> {
  // 1. Create a secret
  console.log(`Creating secret "${secretName}"...`);
  const created = await client.setSecret(secretName, "my-secret-value");
  console.log(`  Created: ${created.name} (version: ${created.properties.version})`);

  // 2. Read the secret back
  console.log(`\nReading secret "${secretName}"...`);
  const read = await client.getSecret(secretName);
  console.log(`  Value : ${read.value}`);

  // 3. Update the secret to a new value
  console.log(`\nUpdating secret "${secretName}" to new value...`);
  const updated = await client.setSecret(secretName, "updated-value");
  console.log(`  Updated: ${updated.name} (version: ${updated.properties.version})`);

  // Verify the update
  const verify = await client.getSecret(secretName);
  console.log(`  Value : ${verify.value}`);

  // 4. Delete and purge the secret (soft-delete enabled vault)
  console.log(`\nDeleting secret "${secretName}"...`);
  const poller = await client.beginDeleteSecret(secretName);
  const deleted = await poller.pollUntilDone();
  console.log(`  Deleted: ${deleted.name} (deleted on: ${deleted.deletedOn})`);

  console.log(`\nPurging secret "${secretName}"...`);
  await client.purgeDeletedSecret(secretName);
  console.log("  Purged successfully.");

  console.log("\nAll CRUD operations completed.");
}

main().catch((err: Error) => {
  console.error("Operation failed:", err.message);
  process.exit(1);
});
