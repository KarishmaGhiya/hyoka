import { SecretClient } from "@azure/keyvault-secrets";
import { ManagedIdentityCredential } from "@azure/identity";
import { SecretProvider } from "./secretProvider";
import { CachedConfigProvider } from "./cachedConfigProvider";
import { SecretRotationHelper } from "./secretRotationHelper";

/**
 * Demo: full flow of the Key Vault configuration provider.
 *
 * Requires KEY_VAULT_URL to be set and the managed identity to have
 * Secret Officer (or Get/Set/Delete/Purge) permissions on the vault.
 */
async function main(): Promise<void> {
  const vaultUrl = process.env.KEY_VAULT_URL;
  if (!vaultUrl) {
    console.error("Set KEY_VAULT_URL environment variable and run again.");
    process.exit(1);
  }

  const credential = new ManagedIdentityCredential();
  const secretClient = new SecretClient(vaultUrl, credential);
  const provider = new SecretProvider(secretClient);
  const config = new CachedConfigProvider(provider, { expiryWarningDays: 7 });
  const rotationHelper = new SecretRotationHelper(secretClient);

  // ── Step 1: Bulk-load config keys at startup ──────────────────────────
  console.log("=== Step 1: Bulk-load config keys ===");
  const requiredKeys = [
    { name: "db-connection-string", defaultValue: "Server=localhost;Database=app" },
    { name: "api-key", defaultValue: "default-api-key" },
    { name: "storage-account-key", defaultValue: "default-storage-key" },
  ];
  await config.loadKeys(requiredKeys);
  console.log("Loaded keys into cache.\n");

  // ── Step 2: Read values from cache ────────────────────────────────────
  console.log("=== Step 2: Read from cache ===");
  for (const key of requiredKeys) {
    const entry = await config.get(key.name);
    console.log(
      `  ${entry.name}: value="${entry.value}", version=${entry.version ?? "N/A"}, ` +
        `expires=${entry.expiresOn?.toISOString() ?? "never"}`,
    );
  }
  console.log();

  // ── Step 3: Refresh a single key ──────────────────────────────────────
  console.log("=== Step 3: Refresh a single key ===");
  const refreshed = await config.refresh("api-key");
  console.log(
    `  Refreshed api-key: value="${refreshed.value}", version=${refreshed.version ?? "N/A"}\n`,
  );

  // ── Step 4: Check for near-expiry secrets ─────────────────────────────
  console.log("=== Step 4: Near-expiry warnings ===");
  const nearExpiry = config.getNearExpiry();
  if (nearExpiry.length === 0) {
    console.log("  No secrets are near expiry.\n");
  } else {
    for (const s of nearExpiry) {
      console.log(
        `  ⚠ ${s.name} expires on ${s.expiresOn?.toISOString()} — consider rotating!`,
      );
    }
    console.log();
  }

  // ── Step 5: Secret rotation demo ──────────────────────────────────────
  console.log("=== Step 5: Secret rotation ===");
  const rotationTarget = "api-key";
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // 5a. Create a new version (no cleanup)
  console.log(`  Creating new version of "${rotationTarget}"...`);
  const rotateResult = await rotationHelper.rotate(rotationTarget, {
    newValue: `rotated-value-${Date.now()}`,
    expiresOn: thirtyDaysFromNow,
    contentType: "text/plain",
    cleanupOldSecret: false,
  });
  console.log(
    `  New version created: ${rotateResult.newVersion}, ` +
      `expires ${rotateResult.expiresOn?.toISOString()}\n`,
  );

  // 5b. Demonstrate delete-and-purge cleanup flow
  console.log(`  Demonstrating delete-and-purge cleanup for "${rotationTarget}"...`);
  const cleanupResult = await rotationHelper.rotate(rotationTarget, {
    newValue: `post-cleanup-value-${Date.now()}`,
    expiresOn: thirtyDaysFromNow,
    contentType: "text/plain",
    cleanupOldSecret: true,
  });
  console.log(
    `  Rotation with cleanup complete: version=${cleanupResult.newVersion}, ` +
      `oldCleaned=${cleanupResult.oldVersionCleaned}\n`,
  );

  console.log("=== Done ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
