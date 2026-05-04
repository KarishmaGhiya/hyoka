import { ConfigurationModule } from "./ConfigurationModule.js";
import { SecretRotationHelper } from "./SecretRotationHelper.js";

/**
 * Demo application showing the full configuration provider workflow
 */
async function main() {
  console.log("🚀 Azure Key Vault Configuration Provider Demo\n");
  console.log("=" .repeat(60));

  // Check for required environment variable
  if (!process.env.KEY_VAULT_URL) {
    console.error("\n❌ Error: KEY_VAULT_URL environment variable is required");
    console.log("\nExample:");
    console.log('  export KEY_VAULT_URL="https://your-vault-name.vault.azure.net"');
    console.log("\nNote: This demo requires Azure authentication via Managed Identity");
    console.log("      For local testing, use DefaultAzureCredential instead (see ConfigurationModule.ts)");
    process.exit(1);
  }

  try {
    // Step 1: Initialize configuration module with 7-day expiry warning
    console.log("\n📦 Step 1: Initialize Configuration Module");
    console.log("-".repeat(60));
    const config = new ConfigurationModule({ expiryWarningDays: 7 });
    const cachedProvider = config.getCachedProvider();
    const secretProvider = config.getSecretProvider();
    const rotationHelper = new SecretRotationHelper(config.getSecretClient());

    // Step 2: Bulk load configuration keys at startup
    console.log("\n📦 Step 2: Bulk Load Configuration Keys");
    console.log("-".repeat(60));
    const configKeys = [
      "database-connection-string",
      "api-key",
      "encryption-key",
      "smtp-password",
    ];
    await cachedProvider.bulkLoad(configKeys);

    // Step 3: Read secrets from cache
    console.log("\n📦 Step 3: Read Secrets from Cache");
    console.log("-".repeat(60));
    for (const key of configKeys) {
      if (cachedProvider.has(key)) {
        const value = await cachedProvider.get(key);
        const masked = value ? `${value.substring(0, 4)}***` : "(empty)";
        console.log(`✅ ${key}: ${masked}`);
      }
    }

    // Step 4: Display cache statistics
    console.log("\n📦 Step 4: Cache Statistics");
    console.log("-".repeat(60));
    const stats = cachedProvider.getCacheStats();
    console.log(`Cache size: ${stats.size} entries`);
    stats.entries.forEach((entry) => {
      const expiry = entry.expiresOn
        ? `expires ${entry.expiresOn.toISOString()}`
        : "no expiry";
      console.log(`  - ${entry.name} | fetched ${entry.fetchedAt.toISOString()} | ${expiry}`);
    });

    // Step 5: Refresh a specific key on demand
    console.log("\n📦 Step 5: On-Demand Refresh");
    console.log("-".repeat(60));
    const keyToRefresh = "api-key";
    console.log(`🔄 Refreshing '${keyToRefresh}'...`);
    await cachedProvider.refresh(keyToRefresh);
    console.log(`✅ Refreshed '${keyToRefresh}' from Key Vault`);

    // Step 6: Check for secrets near expiry
    console.log("\n📦 Step 6: Check for Expiring Secrets");
    console.log("-".repeat(60));
    const expiringSecrets = await cachedProvider.getExpiringSecrets();
    if (expiringSecrets.length > 0) {
      console.log(`⚠️ Found ${expiringSecrets.length} secret(s) near expiry:`);
      expiringSecrets.forEach((secret) => {
        console.log(
          `  - ${secret.secretName}: ${secret.daysUntilExpiry} days until expiry`
        );
        if (secret.isExpired) {
          console.log(`    ⚠️ THIS SECRET IS EXPIRED!`);
        }
      });
    } else {
      console.log("✅ No secrets are near expiry");
    }

    // Step 7: Secret rotation demonstration
    console.log("\n📦 Step 7: Secret Rotation Demo");
    console.log("-".repeat(60));
    const secretToRotate = "demo-rotation-secret";
    
    console.log(`\n🔄 Rotating secret '${secretToRotate}'...`);
    const rotatedSecret = await rotationHelper.rotateSecret(secretToRotate, {
      newValue: `rotated-value-${Date.now()}`,
      expiryDays: 90,
      contentType: "text/plain",
      tags: {
        environment: "demo",
        rotatedBy: "demo-script",
      },
    });

    console.log(`\n📋 New secret details:`);
    console.log(`  Version: ${rotatedSecret.properties.version}`);
    console.log(`  Expires: ${rotatedSecret.properties.expiresOn?.toISOString()}`);
    console.log(`  Enabled: ${rotatedSecret.properties.enabled}`);

    // List all versions
    await rotationHelper.listVersions(secretToRotate);

    // Step 8: Demonstrate delete and purge flow
    console.log("\n📦 Step 8: Delete and Purge Demo");
    console.log("-".repeat(60));
    console.log("⚠️ This demonstrates the safe delete → purge workflow");
    console.log("   (Uncomment the code below to actually delete and purge)");
    
    // Uncomment to actually perform deletion:
    // await rotationHelper.deleteAndPurgeSecret(secretToRotate, true);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Demo completed successfully!");
    console.log("\n💡 Key takeaways:");
    console.log("  • Secrets are cached after first retrieval");
    console.log("  • Bulk loading improves startup performance");
    console.log("  • Expiry monitoring prevents secret expiration issues");
    console.log("  • Rotation creates new versions without downtime");
    console.log("  • Delete operations use polling for safe cleanup");
    console.log("  • Managed Identity provides secure authentication");

  } catch (error: any) {
    console.error("\n❌ Error during demo:", error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.statusCode) {
      console.error(`   Status code: ${error.statusCode}`);
    }
    
    console.log("\n💡 Troubleshooting tips:");
    console.log("  • Ensure KEY_VAULT_URL is set correctly");
    console.log("  • Verify Managed Identity has Key Vault access");
    console.log("  • Check RBAC permissions (Get/Set/Delete/Purge Secrets)");
    console.log("  • Ensure soft-delete is enabled on the Key Vault");
    
    process.exit(1);
  }
}

// Run the demo
main();
