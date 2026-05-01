import { createKeyVaultClient } from "./config";
import { SecretProvider } from "./secretProvider";
import { CachedSecretProvider } from "./cachedSecretProvider";
import { SecretRotationHelper } from "./secretRotationHelper";

/**
 * Demo script that exercises the full Key Vault configuration flow:
 *
 * 1. Bulk-load several config keys at startup.
 * 2. Read them from cache.
 * 3. Refresh a single key.
 * 4. Check for secrets nearing expiry.
 * 5. Rotate a secret (create new version + delete-and-purge cleanup).
 */
async function main(): Promise<void> {
  // ── 0. Setup ───────────────────────────────────────────────────────
  const client = createKeyVaultClient();
  const provider = new SecretProvider(client);
  const cache = new CachedSecretProvider(provider, /* warningDays */ 7);
  const rotationHelper = new SecretRotationHelper(client);

  const configKeys = ["app-db-connection", "app-api-key", "app-jwt-secret"];

  // ── 1. Bulk-load config keys ───────────────────────────────────────
  console.log("=== Step 1: Bulk-loading config keys ===");
  const loaded = await cache.loadSecrets(configKeys, {
    "app-db-connection": "Server=localhost;Database=dev",
    "app-api-key": "dev-api-key-placeholder",
    "app-jwt-secret": "dev-jwt-secret-placeholder",
  });

  for (const [key, secret] of loaded) {
    console.log(
      `  ${key}: "${secret.value}" (version: ${secret.version ?? "default"})`
    );
  }

  // ── 2. Read from cache ─────────────────────────────────────────────
  console.log("\n=== Step 2: Reading secrets from cache ===");
  for (const key of configKeys) {
    const cached = await cache.getSecret(key);
    console.log(`  ${key}: "${cached?.value ?? "(not found)"}"`);
  }

  // ── 3. Refresh a single key ────────────────────────────────────────
  console.log("\n=== Step 3: Refreshing 'app-api-key' ===");
  const refreshed = await cache.refreshSecret("app-api-key");
  if (refreshed) {
    console.log(
      `  Refreshed app-api-key: "${refreshed.value}" (version: ${refreshed.version ?? "n/a"})`
    );
  } else {
    console.log("  app-api-key not found in Key Vault after refresh.");
  }

  // ── 4. Check for expiring secrets ──────────────────────────────────
  console.log("\n=== Step 4: Checking for expiring secrets ===");
  const expiring = cache.getExpiringSecrets();
  if (expiring.length === 0) {
    console.log("  No secrets are expiring within the warning window.");
  } else {
    for (const s of expiring) {
      console.log(
        `  WARNING: "${s.name}" expires on ${s.expiresOn?.toISOString()}`
      );
    }
    console.log("  Auto-refreshing expiring secrets...");
    const refreshedKeys = await cache.refreshExpiring();
    console.log(`  Refreshed: ${refreshedKeys.join(", ") || "(none)"}`);
  }

  // ── 5. Secret rotation ─────────────────────────────────────────────
  console.log("\n=== Step 5: Rotating secret 'app-rotation-demo' ===");
  const expiresOn = new Date();
  expiresOn.setDate(expiresOn.getDate() + 90);

  const rotationResult = await rotationHelper.rotateSecret(
    "app-rotation-demo",
    `rotated-value-${Date.now()}`,
    expiresOn
  );
  console.log(`  New version : ${rotationResult.newVersion}`);
  console.log(`  Old version : ${rotationResult.previousVersion ?? "(none)"}`);
  console.log(`  Expires on  : ${rotationResult.expiresOn.toISOString()}`);

  // Demonstrate the delete-and-purge cleanup flow.
  console.log(
    "\n=== Step 5b: Delete-and-purge cleanup of 'app-rotation-demo' ==="
  );
  console.log(
    "  Starting soft-delete (long-running operation), waiting for completion..."
  );
  await rotationHelper.deleteAndPurgeSecret("app-rotation-demo");
  console.log(
    "  Secret 'app-rotation-demo' deleted and purged successfully."
  );

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
