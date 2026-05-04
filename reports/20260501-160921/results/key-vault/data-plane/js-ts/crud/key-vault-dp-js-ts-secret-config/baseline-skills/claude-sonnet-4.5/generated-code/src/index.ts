import { DefaultAzureCredential } from "@azure/identity";
import { ConfigurationModule } from "./ConfigurationModule";
import { SecretRotationHelper } from "./SecretRotationHelper";

/**
 * Demo script that showcases the full Key Vault configuration provider flow.
 */
async function main() {
  console.log("=== Azure Key Vault Configuration Provider Demo ===\n");

  // Get vault URL from environment variable
  const vaultUrl = process.env.AZURE_KEYVAULT_URL;
  if (!vaultUrl) {
    console.error(
      "Error: AZURE_KEYVAULT_URL environment variable is not set."
    );
    console.log(
      "Set it using: export AZURE_KEYVAULT_URL=https://your-vault.vault.azure.net"
    );
    process.exit(1);
  }

  console.log(`Using Key Vault: ${vaultUrl}\n`);

  try {
    // Step 1: Initialize configuration module with managed identity
    console.log("Step 1: Initializing configuration module...");
    const config = ConfigurationModule.getInstance({
      vaultUrl,
      expiryWarningDays: 7,
    });

    // Step 2: Bulk-load required configuration keys at startup
    console.log("\nStep 2: Bulk-loading configuration keys...");
    const requiredKeys = [
      "DatabaseConnectionString",
      "ApiKey",
      "EncryptionKey",
    ];

    await config.initialize(requiredKeys);

    // Step 3: Read configuration values from cache
    console.log("\nStep 3: Reading configuration values from cache...");
    for (const key of requiredKeys) {
      const value = await config.get(key, "NOT_SET");
      const maskedValue = value ? `${value.substring(0, 4)}****` : "NOT_SET";
      console.log(`  ${key}: ${maskedValue}`);
    }

    console.log(`\nCache size: ${config.getCachingProvider().getCacheSize()} secrets`);

    // Step 4: Refresh a specific configuration key
    console.log("\nStep 4: Refreshing a specific key...");
    const refreshedValue = await config.refresh("ApiKey");
    console.log(
      `  ApiKey refreshed: ${refreshedValue ? refreshedValue.substring(0, 4) + "****" : "NOT_SET"}`
    );

    // Step 5: Check for expiring secrets
    console.log("\nStep 5: Checking for secrets expiring soon...");
    const expiringSecrets = await config.checkExpiring();
    if (expiringSecrets.length > 0) {
      console.log("  ⚠️  WARNING: The following secrets are expiring soon:");
      expiringSecrets.forEach((secret) => console.log(`    - ${secret}`));
    } else {
      console.log("  ✓ No secrets are expiring within the warning window.");
    }

    // Step 6: Demonstrate secret rotation
    console.log("\nStep 6: Demonstrating secret rotation...");
    const credential = new DefaultAzureCredential();
    const rotationHelper = new SecretRotationHelper(vaultUrl, credential);

    // Create a test secret for rotation demo
    const testSecretName = "TestRotationSecret";
    const originalValue = `original-value-${Date.now()}`;

    console.log(`\n  Creating test secret '${testSecretName}'...`);
    await rotationHelper.rotateSecret(testSecretName, originalValue, {
      expiryDays: 30,
      contentType: "text/plain",
      tags: { environment: "demo", purpose: "rotation-test" },
    });

    // Rotate the secret with a new value
    const newValue = `rotated-value-${Date.now()}`;
    console.log(`\n  Rotating secret to new value...`);
    const newVersion = await rotationHelper.rotateSecret(
      testSecretName,
      newValue,
      {
        expiryDays: 60,
        contentType: "text/plain",
        tags: { environment: "demo", purpose: "rotation-test", rotated: "true" },
      }
    );

    console.log(`\n  ✓ Secret rotated successfully!`);
    console.log(`    New version: ${newVersion}`);

    // Step 7: Demonstrate delete and purge flow
    console.log("\nStep 7: Demonstrating safe delete and purge flow...");
    console.log("  Note: This is a destructive operation for demo purposes.");

    console.log(`\n  Deleting secret '${testSecretName}'...`);
    const recoveryId = await rotationHelper.deleteSecretVersion(testSecretName);
    console.log(`  ✓ Secret soft-deleted. Recovery ID: ${recoveryId}`);

    console.log("\n  Waiting for delete to fully propagate...");
    await sleep(5000);

    console.log(`\n  Purging deleted secret '${testSecretName}'...`);
    await rotationHelper.purgeDeletedSecret(testSecretName);
    console.log("  ✓ Secret permanently purged.");

    console.log("\n=== Demo Complete ===");
    console.log("\nSummary:");
    console.log("  ✓ Configuration module initialized with managed identity");
    console.log("  ✓ Secrets bulk-loaded and cached");
    console.log("  ✓ Individual secret refresh demonstrated");
    console.log("  ✓ Expiry checking implemented");
    console.log("  ✓ Secret rotation with versioning demonstrated");
    console.log("  ✓ Safe delete and purge flow demonstrated");

  } catch (error: any) {
    console.error("\n❌ Error during demo:", error.message);
    if (error.statusCode === 401 || error.statusCode === 403) {
      console.error(
        "\nAuthentication Error: Ensure your managed identity or Azure CLI credentials have proper Key Vault permissions."
      );
      console.error("Required permissions: Get, List, Set, Delete, Purge secrets");
    }
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the demo
main();
