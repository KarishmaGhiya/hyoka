import { createConfigProvider, createSecretClient } from "./config";
import { SecretRotationHelper } from "./rotationHelper";

/**
 * Demo script that exercises the full Key Vault config provider flow:
 *   1. Bulk-load config keys at startup
 *   2. Read values from cache
 *   3. Refresh a single key
 *   4. Check for near-expiry warnings
 *   5. Perform a secret rotation (new version + delete-and-purge cleanup)
 */
async function main(): Promise<void> {
  console.log("=== Key Vault Configuration Provider Demo ===\n");

  // ── 1. Create the caching config provider ─────────────────────────
  const config = createConfigProvider({ expiryWarningDays: 7 });

  const requiredKeys = [
    "app-database-connection",
    "app-api-key",
    "app-signing-secret",
  ];

  console.log("Step 1 · Bulk-loading config keys...");
  const loaded = await config.loadAll(requiredKeys);

  for (const [key, result] of loaded) {
    console.log(
      `  ✔ ${key} = "${maskValue(result.value)}" ` +
        `(version: ${result.version ?? "n/a"}, ` +
        `expires: ${result.expiresOn?.toISOString() ?? "never"})`
    );
  }

  // ── 2. Read from cache (no Key Vault call) ─────────────────────────
  console.log("\nStep 2 · Reading from cache...");
  const cached = await config.get("app-api-key");
  console.log(
    `  ✔ app-api-key (cached) = "${maskValue(cached.value)}"`
  );
  console.log(`  Cached keys: [${config.getCachedKeys().join(", ")}]`);

  // ── 3. Refresh a single key ────────────────────────────────────────
  console.log("\nStep 3 · Refreshing app-signing-secret...");
  const refreshed = await config.refresh("app-signing-secret");
  console.log(
    `  ✔ app-signing-secret (refreshed) = "${maskValue(refreshed.value)}" ` +
      `(version: ${refreshed.version ?? "n/a"})`
  );

  // ── 4. Check for near-expiry warnings ──────────────────────────────
  console.log("\nStep 4 · Checking for near-expiry secrets...");
  const warnings = config.getNearExpiry();

  if (warnings.length === 0) {
    console.log("  ✔ No secrets are near expiry.");
  } else {
    for (const w of warnings) {
      console.log(
        `  ⚠ "${w.name}" expires in ${w.daysRemaining} day(s)!`
      );
    }
  }

  // ── 5. Demonstrate secret rotation ─────────────────────────────────
  console.log("\nStep 5 · Rotating secret 'app-api-key'...");
  const client = createSecretClient();
  const rotator = new SecretRotationHelper(client);

  // 5a. Create a new version (simple rotation).
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const rotationResult = await rotator.rotate("app-api-key", {
    newValue: `new-api-key-${Date.now()}`,
    expiresOn: thirtyDaysFromNow,
    contentType: "text/plain",
    purgeOldVersion: false,
  });

  console.log(
    `  ✔ Created new version: ${rotationResult.newVersion} ` +
      `(previous: ${rotationResult.previousVersion ?? "none"})`
  );

  // 5b. Full rotation with delete-and-purge cleanup.
  console.log(
    "\n  Performing full rotation with delete-and-purge cleanup..."
  );

  const fullRotation = await rotator.rotate("app-api-key", {
    newValue: `rotated-api-key-${Date.now()}`,
    expiresOn: thirtyDaysFromNow,
    contentType: "text/plain",
    purgeOldVersion: true,
  });

  console.log(
    `  ✔ Full rotation complete – new version: ${fullRotation.newVersion}, ` +
      `purged: ${fullRotation.purged}`
  );

  // ── Done ───────────────────────────────────────────────────────────
  console.log("\n=== Demo complete ===");
}

/** Mask all but the first 4 characters of a secret value for display. */
function maskValue(value: string): string {
  if (value.length <= 4) return "****";
  return value.slice(0, 4) + "****";
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
