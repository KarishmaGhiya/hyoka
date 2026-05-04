import { ConfigModule } from "./config.js";
import { SecretRotationHelper } from "./rotationHelper.js";

async function main() {
  console.log("🚀 Azure Key Vault Configuration Provider Demo\n");
  console.log("=" .repeat(60));

  try {
    // Initialize configuration module with managed identity
    const config = new ConfigModule({
      expiryWarningDays: 7,
    });

    const cachingProvider = config.getCachingProvider();
    const secretProvider = config.getSecretProvider();
    const secretClient = config.getSecretClient();

    // Step 1: Create some test secrets for the demo
    console.log("\n📝 Step 1: Creating test secrets...");
    console.log("=" .repeat(60));

    const testSecrets = [
      { name: "database-connection-string", value: "Server=db.example.com;Database=prod" },
      { name: "api-key", value: "sk-test-1234567890abcdef" },
      { name: "storage-account-key", value: "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo=" },
    ];

    for (const { name, value } of testSecrets) {
      const expiresOn = new Date();
      expiresOn.setDate(expiresOn.getDate() + 90); // Expires in 90 days

      await secretClient.setSecret(name, value, {
        expiresOn,
        contentType: "text/plain",
        tags: { environment: "demo", createdBy: "config-provider-demo" },
      });
      console.log(`✅ Created secret: ${name}`);
    }

    // Step 2: Bulk-load secrets at startup
    console.log("\n📦 Step 2: Bulk-loading configuration at startup...");
    console.log("=" .repeat(60));

    await cachingProvider.bulkLoad([
      "database-connection-string",
      "api-key",
      "storage-account-key",
      "non-existent-secret", // This one doesn't exist
    ]);

    console.log(`\n📊 Cache size: ${cachingProvider.getCacheSize()} secrets`);

    // Step 3: Read secrets from cache
    console.log("\n📖 Step 3: Reading secrets from cache...");
    console.log("=" .repeat(60));

    const dbConnection = await cachingProvider.get("database-connection-string");
    const apiKey = await cachingProvider.get("api-key");
    const storageKey = await cachingProvider.get("storage-account-key");
    const missing = await cachingProvider.get(
      "non-existent-secret",
      "default-value"
    );

    console.log(`Database connection: ${dbConnection}`);
    console.log(`API key: ${apiKey?.substring(0, 20)}...`);
    console.log(`Storage key: ${storageKey?.substring(0, 20)}...`);
    console.log(`Missing secret (with default): ${missing}`);

    // Step 4: Refresh a specific secret
    console.log("\n🔄 Step 4: Refreshing a specific secret...");
    console.log("=" .repeat(60));

    await cachingProvider.refresh("api-key");
    const refreshedApiKey = await cachingProvider.get("api-key");
    console.log(`Refreshed API key: ${refreshedApiKey?.substring(0, 20)}...`);

    // Step 5: Check for expiring secrets
    console.log("\n⚠️  Step 5: Checking for expiring secrets...");
    console.log("=" .repeat(60));

    // Create a secret that's expiring soon for demo
    const expiringSoonDate = new Date();
    expiringSoonDate.setDate(expiringSoonDate.getDate() + 5); // Expires in 5 days

    await secretClient.setSecret("expiring-soon-secret", "temporary-value", {
      expiresOn: expiringSoonDate,
      tags: { purpose: "demo-expiry" },
    });

    await cachingProvider.refresh("expiring-soon-secret");

    const expiringSecrets = cachingProvider.getExpiringSoonSecrets();
    if (expiringSecrets.length > 0) {
      console.log(`⚠️  Found ${expiringSecrets.length} secret(s) expiring soon:`);
      for (const secret of expiringSecrets) {
        const daysLeft = secretProvider.getDaysUntilExpiration(secret);
        console.log(
          `   - ${secret.name}: expires in ${daysLeft} days (${secret.expiresOn?.toISOString()})`
        );
      }
    } else {
      console.log("✅ No secrets expiring within the warning window");
    }

    // Step 6: Secret version retrieval
    console.log("\n📌 Step 6: Retrieving specific secret versions...");
    console.log("=" .repeat(60));

    const metadata = cachingProvider.getMetadata("api-key");
    if (metadata?.version) {
      console.log(`Current version of 'api-key': ${metadata.version}`);

      const specificVersion = await secretProvider.getSecretVersion(
        "api-key",
        metadata.version
      );
      console.log(
        `Retrieved specific version: ${specificVersion?.substring(0, 20)}...`
      );
    }

    // Step 7: Secret rotation
    console.log("\n🔐 Step 7: Performing secret rotation...");
    console.log("=" .repeat(60));

    const rotationHelper = new SecretRotationHelper(secretClient);

    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 365); // New secret expires in 1 year

    const newVersion = await rotationHelper.rotateSecret(
      "api-key",
      "sk-rotated-new-value-" + Date.now(),
      {
        expiresOn: newExpiryDate,
        tags: { rotatedAt: new Date().toISOString(), rotatedBy: "demo" },
      }
    );

    console.log(`\n🔍 Listing all versions of 'api-key'...`);
    const versions = await rotationHelper.listSecretVersions("api-key");
    console.log(`Found ${versions.length} version(s): ${versions.join(", ")}`);

    // Verify the rotated secret
    await cachingProvider.refresh("api-key");
    const rotatedValue = await cachingProvider.get("api-key");
    console.log(`\n✅ Rotated secret value: ${rotatedValue?.substring(0, 30)}...`);

    // Step 8: Delete and purge workflow
    console.log("\n🗑️  Step 8: Delete and purge workflow...");
    console.log("=" .repeat(60));

    // Create a test secret for deletion
    await secretClient.setSecret("test-delete-secret", "temporary-test-value");
    console.log("✅ Created test secret for deletion: test-delete-secret");

    // Perform safe delete and purge
    await rotationHelper.deleteAndPurgeSecret("test-delete-secret");

    // Try to retrieve the purged secret
    const purgedSecret = await secretProvider.getSecret(
      "test-delete-secret",
      "not-found"
    );
    console.log(`\n🔍 Attempting to retrieve purged secret: ${purgedSecret}`);

    // Step 9: Summary
    console.log("\n📊 Demo Summary");
    console.log("=" .repeat(60));
    console.log("✅ Successfully demonstrated:");
    console.log("   • Secure connection with Managed Identity");
    console.log("   • Bulk-loading secrets at startup");
    console.log("   • Caching with automatic expiry checks");
    console.log("   • On-demand secret refresh");
    console.log("   • Expiry warnings and monitoring");
    console.log("   • Secret version retrieval");
    console.log("   • Secret rotation with new versions");
    console.log("   • Safe delete-and-purge workflow");

    // Cleanup demo secrets
    console.log("\n🧹 Cleaning up demo secrets...");
    for (const { name } of testSecrets) {
      try {
        await rotationHelper.deleteAndPurgeSecret(name);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    try {
      await rotationHelper.deleteAndPurgeSecret("expiring-soon-secret");
    } catch (error) {
      // Ignore cleanup errors
    }

    console.log("\n✅ Demo completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Error during demo:", error.message);

    if (error.code === "ENOTFOUND" || error.message.includes("ENOTFOUND")) {
      console.error(
        "\n💡 Tip: Ensure KEY_VAULT_URL environment variable is set correctly"
      );
      console.error("   Example: KEY_VAULT_URL=https://your-vault.vault.azure.net");
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      console.error(
        "\n💡 Tip: Ensure Managed Identity has proper permissions on Key Vault"
      );
      console.error("   Required permissions: Get, List, Set, Delete, Purge secrets");
    }

    process.exit(1);
  }
}

// Run the demo
main();
