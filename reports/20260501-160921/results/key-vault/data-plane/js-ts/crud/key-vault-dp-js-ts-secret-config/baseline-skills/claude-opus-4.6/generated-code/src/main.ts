import { createSecretClient } from "./config";
import { SecretProvider } from "./secretProvider";
import { CachedSecretProvider } from "./cachingLayer";
import { SecretRotationHelper } from "./rotationHelper";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Keys that the application requires at startup. */
const REQUIRED_CONFIG_KEYS = [
  "database-connection-string",
  "api-key",
  "storage-account-key",
];

async function main(): Promise<void> {
  // ── 1. Connect to Key Vault ────────────────────────────────────────
  console.log("=== Initialising Key Vault config provider ===\n");
  const client = createSecretClient();
  const provider = new SecretProvider(client);
  const cache = new CachedSecretProvider(provider, {
    warningWindowMs: SEVEN_DAYS_MS,
  });

  // ── 2. Bulk-load required config keys ──────────────────────────────
  console.log("Loading required config keys:", REQUIRED_CONFIG_KEYS.join(", "));
  await cache.bulkLoad(REQUIRED_CONFIG_KEYS);

  console.log("\nCached values after bulk load:");
  for (const [name, entry] of cache.entries()) {
    console.log(
      `  ${name} = "${entry.value}" (version: ${entry.version ?? "n/a"}, ` +
        `expires: ${entry.expiresOn?.toISOString() ?? "never"})`,
    );
  }

  // ── 3. Read from cache ─────────────────────────────────────────────
  console.log("\n=== Reading secrets from cache ===\n");
  for (const key of REQUIRED_CONFIG_KEYS) {
    const entry = await cache.get(key);
    console.log(`  ${key} → ${entry ? `"${entry.value}"` : "(not found)"}`);
  }

  // ── 4. Refresh a single key ────────────────────────────────────────
  const refreshKey = REQUIRED_CONFIG_KEYS[0];
  console.log(`\n=== Refreshing key: ${refreshKey} ===\n`);
  const refreshed = await cache.refresh(refreshKey);
  if (refreshed) {
    console.log(
      `  Updated ${refreshKey} = "${refreshed.value}" (version: ${refreshed.version ?? "n/a"})`,
    );
  } else {
    console.log(`  ${refreshKey} no longer exists in Key Vault.`);
  }

  // ── 5. Expiry warnings ────────────────────────────────────────────
  console.log("\n=== Checking for near-expiry secrets ===\n");
  const nearExpiry = cache.getNearExpiryKeys();
  if (nearExpiry.length > 0) {
    console.log("  ⚠ The following secrets expire within 7 days:");
    for (const name of nearExpiry) {
      const entry = await cache.get(name);
      console.log(
        `    - ${name} (expires: ${entry?.expiresOn?.toISOString() ?? "unknown"})`,
      );
    }
  } else {
    console.log("  ✓ No secrets are near expiry.");
  }

  // ── 6. Secret rotation ────────────────────────────────────────────
  const rotationTarget = "api-key";
  console.log(`\n=== Rotating secret: ${rotationTarget} ===\n`);
  const rotator = new SecretRotationHelper(client);

  // 6a. Create a new version with a fresh value and 90-day expiry.
  const newExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const rotationResult = await rotator.createNewVersion(
    rotationTarget,
    `rotated-value-${Date.now()}`,
    newExpiry,
  );
  console.log(
    `  New version created: ${rotationResult.newVersion}\n` +
      `  Expires: ${rotationResult.expiresOn?.toISOString() ?? "never"}`,
  );

  // 6b. Demonstrate the delete-and-purge cleanup flow.
  //     In a real app this would target a *different* secret name being
  //     retired, not the one we just rotated.  Here we use a dedicated
  //     disposable secret for the demo.
  const disposableSecret = "rotation-demo-disposable";
  console.log(
    `\n  Creating disposable secret "${disposableSecret}" for cleanup demo…`,
  );
  await client.setSecret(disposableSecret, "temporary-value", {
    expiresOn: new Date(Date.now() + 60_000),
  });

  console.log(
    `  Deleting and purging "${disposableSecret}" (this may take a moment)…`,
  );
  await rotator.deleteAndPurge(disposableSecret);
  console.log(`  ✓ "${disposableSecret}" has been permanently purged.`);

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
