import { createSecretClient } from "./config";
import { SecretProvider } from "./secretProvider";
import { CachedSecretProvider } from "./cachedSecretProvider";
import { SecretRotationHelper } from "./secretRotationHelper";

/**
 * Demo script – exercises every component end-to-end:
 *
 *  1. Bulk-load config keys into the cache.
 *  2. Read values from cache.
 *  3. Refresh a single key.
 *  4. Warn about secrets nearing expiry.
 *  5. Rotate a secret (new version → delete & purge old).
 */
async function main(): Promise<void> {
  // --- Set up clients -------------------------------------------------------
  const client = createSecretClient();
  const provider = new SecretProvider(client);
  const cache = new CachedSecretProvider(provider, {
    expiryWarningMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  const rotator = new SecretRotationHelper(client);

  // --- 1. Bulk-load required config keys ------------------------------------
  const requiredKeys = ["app-db-connection", "app-api-key", "app-jwt-secret"];
  console.log("=== Step 1: Bulk-loading config keys ===");
  await cache.loadAll(requiredKeys, "<not-set>");
  console.log(`Loaded ${requiredKeys.length} keys into cache.\n`);

  // --- 2. Read from cache ---------------------------------------------------
  console.log("=== Step 2: Reading cached values ===");
  for (const key of requiredKeys) {
    const entry = await cache.get(key);
    console.log(
      `  ${entry.name} = ${entry.value}` +
        (entry.version ? ` (v${entry.version})` : "") +
        (entry.expiresOn ? ` [expires ${entry.expiresOn.toISOString()}]` : "")
    );
  }
  console.log();

  // --- 3. Refresh a single key ----------------------------------------------
  const refreshKey = "app-api-key";
  console.log(`=== Step 3: Refreshing "${refreshKey}" ===`);
  const refreshed = await cache.refresh(refreshKey);
  console.log(
    `  ${refreshed.name} refreshed → ${refreshed.value}` +
      (refreshed.version ? ` (v${refreshed.version})` : "") +
      `  [cachedAt ${refreshed.cachedAt.toISOString()}]\n`
  );

  // --- 4. Expiry warnings ---------------------------------------------------
  console.log("=== Step 4: Checking for expiring secrets ===");
  const expiring = cache.getExpiringSecrets();
  if (expiring.length === 0) {
    console.log("  No secrets are near expiry.\n");
  } else {
    for (const entry of expiring) {
      const daysLeft = entry.expiresOn
        ? Math.ceil(
            (entry.expiresOn.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        : "?";
      console.log(
        `  ⚠  "${entry.name}" expires in ${daysLeft} day(s) ` +
          `(${entry.expiresOn?.toISOString()})`
      );
    }
    console.log();
  }

  // --- 5. Secret rotation ---------------------------------------------------
  const rotateTarget = "app-rotate-demo";
  console.log(`=== Step 5: Rotating secret "${rotateTarget}" ===`);

  // 5a. Create a new version with fresh value + expiry
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + 90);

  const rotated = await rotator.createNewVersion(
    rotateTarget,
    `rotated-value-${Date.now()}`,
    newExpiry
  );
  console.log(
    `  Created new version ${rotated.newVersion} ` +
      `(expires ${rotated.expiresOn.toISOString()})`
  );

  // 5b. Demonstrate delete-and-purge cleanup flow
  console.log(
    `  Deleting and purging "${rotateTarget}" (soft-delete → purge)...`
  );
  await rotator.deleteAndPurge(rotateTarget);
  console.log(`  "${rotateTarget}" fully purged.\n`);

  console.log("=== Done ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
