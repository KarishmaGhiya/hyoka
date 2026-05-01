import { createConfigProvider } from "./config";
import { SecretRotationHelper } from "./rotationHelper";

/**
 * Demo script — exercises the full Key Vault config-provider flow:
 *  1. Bulk-load config keys at startup
 *  2. Read values from cache
 *  3. Refresh a single key
 *  4. Warn about secrets nearing expiry
 *  5. Rotate a secret (new version + delete/purge cleanup)
 */
async function main(): Promise<void> {
  // ── 0. Bootstrap ──────────────────────────────────────────────────────
  console.log("=== Key Vault Config Provider Demo ===\n");

  const { provider, cache, client } = createConfigProvider({
    expiryWarningDays: 7,
  });

  // ── 1. Bulk-load config keys ──────────────────────────────────────────
  const requiredKeys = [
    { name: "app-database-connection", defaultValue: "Server=localhost;Database=app" },
    { name: "app-api-key", defaultValue: "default-api-key" },
    { name: "app-jwt-secret", defaultValue: "default-jwt-secret" },
    { name: "app-feature-flags", defaultValue: "{}" },
  ];

  console.log("Step 1 — Bulk-loading config keys …");
  await cache.loadKeys(requiredKeys);
  console.log(`  Loaded ${requiredKeys.length} keys into cache.\n`);

  // ── 2. Read from cache ────────────────────────────────────────────────
  console.log("Step 2 — Reading values from cache:");
  for (const secret of cache.allCached()) {
    const expiry = secret.expiresOn
      ? secret.expiresOn.toISOString()
      : "no expiry";
    console.log(
      `  ${secret.name} = "${secret.value}" (version: ${secret.version}, expires: ${expiry})`
    );
  }
  console.log();

  // ── 3. Refresh a single key ───────────────────────────────────────────
  console.log("Step 3 — Refreshing 'app-api-key' …");
  const refreshed = await cache.refresh("app-api-key");
  console.log(
    `  Refreshed: "${refreshed.value}" (version: ${refreshed.version})\n`
  );

  // ── 4. Expiry warnings ───────────────────────────────────────────────
  console.log("Step 4 — Checking for secrets near expiry:");
  const nearExpiry = cache.getNearExpiry();
  if (nearExpiry.length === 0) {
    console.log("  ✓ No secrets are within the expiry warning window.\n");
  } else {
    for (const s of nearExpiry) {
      const days = provider.daysUntilExpiry(s);
      console.log(
        `  ⚠ "${s.name}" expires in ${days} day(s) on ${s.expiresOn?.toISOString()}`
      );
    }
    console.log();
  }

  // ── 5. Secret rotation demo ───────────────────────────────────────────
  console.log("Step 5 — Rotating 'app-jwt-secret' …");
  const rotationHelper = new SecretRotationHelper(client);

  // 5a. Create a new version with a fresh expiry (90 days from now)
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + 90);

  const { newVersion } = await rotationHelper.rotate("app-jwt-secret", {
    newValue: `rotated-secret-${Date.now()}`,
    expiresOn: newExpiry,
    cleanupOld: false, // keep old versions by default
  });
  console.log(`  New version after rotation: ${newVersion}\n`);

  // 5b. Demonstrate the delete-and-purge cleanup flow on a disposable secret
  console.log("Step 5b — Delete & purge cleanup demo on 'app-temp-secret' …");
  await client.setSecret("app-temp-secret", "temporary-value", {
    expiresOn: new Date(Date.now() + 86_400_000), // 1 day
  });
  console.log('  Created "app-temp-secret" for cleanup demo.');

  await rotationHelper.rotate("app-temp-secret", {
    newValue: "replacement-value",
    expiresOn: newExpiry,
    cleanupOld: true, // triggers delete → poll → purge
  });
  console.log("  Cleanup flow completed.\n");

  // ── 6. Retrieve a specific version ────────────────────────────────────
  console.log("Step 6 — Retrieving specific version of 'app-jwt-secret' …");
  const specific = await provider.getSecret("app-jwt-secret", {
    version: newVersion,
  });
  console.log(
    `  Retrieved version ${specific.version}: "${specific.value}"\n`
  );

  console.log("=== Demo complete ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
