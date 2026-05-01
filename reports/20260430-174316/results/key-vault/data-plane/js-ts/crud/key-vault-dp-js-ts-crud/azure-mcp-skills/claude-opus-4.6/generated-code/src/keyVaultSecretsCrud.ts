import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

// Set this environment variable before running:
//   export KEY_VAULT_URL="https://<your-vault-name>.vault.azure.net"
const vaultUrl = process.env.KEY_VAULT_URL;
if (!vaultUrl) {
  console.error("ERROR: Set the KEY_VAULT_URL environment variable.");
  process.exit(1);
}

const credential = new DefaultAzureCredential();
const client = new SecretClient(vaultUrl, credential);

const SECRET_NAME = "my-secret";

async function main(): Promise<void> {
  // 1. CREATE
  console.log(`\n--- Creating secret "${SECRET_NAME}" ---`);
  const created = await client.setSecret(SECRET_NAME, "my-secret-value");
  console.log(`Created: ${created.name} = ${created.value}`);

  // 2. READ
  console.log(`\n--- Reading secret "${SECRET_NAME}" ---`);
  const read = await client.getSecret(SECRET_NAME);
  console.log(`Read:    ${read.name} = ${read.value}`);

  // 3. UPDATE (setSecret overwrites the value, creating a new version)
  console.log(`\n--- Updating secret "${SECRET_NAME}" ---`);
  const updated = await client.setSecret(SECRET_NAME, "updated-value");
  console.log(`Updated: ${updated.name} = ${updated.value}`);

  // Verify the update
  const verify = await client.getSecret(SECRET_NAME);
  console.log(`Verify:  ${verify.name} = ${verify.value}`);

  // 4. DELETE & PURGE (for soft-delete enabled vaults)
  console.log(`\n--- Deleting secret "${SECRET_NAME}" ---`);
  const deletePoller = await client.beginDeleteSecret(SECRET_NAME);
  const deleted = await deletePoller.pollUntilDone();
  console.log(`Deleted: ${deleted.name} (recoveryId: ${deleted.recoveryId})`);

  console.log(`\n--- Purging secret "${SECRET_NAME}" ---`);
  await client.purgeDeletedSecret(SECRET_NAME);
  console.log(`Purged:  ${SECRET_NAME}`);

  console.log("\nAll CRUD operations completed successfully.");
}

main().catch((err: Error) => {
  console.error("Operation failed:", err.message);
  process.exit(1);
});
