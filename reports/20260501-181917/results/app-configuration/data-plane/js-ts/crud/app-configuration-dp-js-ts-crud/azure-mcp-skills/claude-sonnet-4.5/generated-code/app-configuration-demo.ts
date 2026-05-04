import {
  AppConfigurationClient,
  ConfigurationSetting,
  FeatureFlagValue,
  featureFlagPrefix,
  featureFlagContentType,
} from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

/**
 * Azure App Configuration Demo
 * 
 * Demonstrates:
 * - Creating an AppConfigurationClient with connection string
 * - Setting configuration settings
 * - Using labels
 * - Getting settings
 * - Listing settings with filters
 * - Creating feature flags
 * - Deleting settings
 * - Error handling with RestError
 */

async function main() {
  // Get connection string from environment variable
  const connectionString = process.env.AZURE_APPCONFIG_CONNECTION_STRING;
  
  if (!connectionString) {
    throw new Error(
      "AZURE_APPCONFIG_CONNECTION_STRING environment variable is required.\n" +
      "Set it to: Endpoint=https://<your-resource>.azconfig.io;Id=...;Secret=..."
    );
  }

  try {
    // 1. Create AppConfigurationClient using connection string
    console.log("1. Creating AppConfigurationClient...");
    const client = new AppConfigurationClient(connectionString);
    console.log("   ✓ Client created successfully\n");

    // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
    console.log('2. Setting configuration: key="app:Settings:FontSize", value="24"');
    const fontSizeSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "24",
      contentType: "text/plain",
      tags: { category: "UI", type: "setting" },
    });
    console.log(`   ✓ Setting created with etag: ${fontSizeSetting.etag}\n`);

    // 3. Set a setting with label "Production"
    console.log('3. Setting configuration with label "Production"');
    const prodSetting = await client.setConfigurationSetting({
      key: "app:Settings:Theme",
      value: "Dark",
      label: "Production",
      contentType: "text/plain",
      tags: { environment: "prod" },
    });
    console.log(`   ✓ Production setting created: ${prodSetting.key} = ${prodSetting.value}\n`);

    // 4. Get the setting by key and print its value
    console.log('4. Getting setting by key "app:Settings:FontSize"');
    const retrievedSetting = await client.getConfigurationSetting({
      key: "app:Settings:FontSize",
    });
    console.log(`   ✓ Retrieved value: ${retrievedSetting.value}`);
    console.log(`   ✓ Content type: ${retrievedSetting.contentType}`);
    console.log(`   ✓ Last modified: ${retrievedSetting.lastModified}\n`);

    // 5. List all settings matching the key filter "app:Settings:*"
    console.log('5. Listing all settings with filter "app:Settings:*"');
    const settings = client.listConfigurationSettings({
      keyFilter: "app:Settings:*",
    });

    let count = 0;
    for await (const setting of settings) {
      count++;
      console.log(`   - ${setting.key} = ${setting.value}${setting.label ? ` [${setting.label}]` : ""}`);
    }
    console.log(`   ✓ Found ${count} settings\n`);

    // 6. Create a feature flag configuration setting for "BetaFeature"
    console.log('6. Creating feature flag "BetaFeature"');
    const featureFlag: ConfigurationSetting<FeatureFlagValue> = {
      key: `${featureFlagPrefix}BetaFeature`,
      contentType: featureFlagContentType,
      value: {
        id: "BetaFeature",
        enabled: true,
        description: "Beta feature for early access users",
        conditions: {
          clientFilters: [
            {
              name: "Microsoft.Percentage",
              parameters: {
                Value: 50, // 50% rollout
              },
            },
          ],
        },
      },
    };

    const createdFlag = await client.addConfigurationSetting(featureFlag);
    console.log(`   ✓ Feature flag created: ${createdFlag.key}`);
    console.log(`   ✓ Enabled: ${createdFlag.value?.enabled}`);
    console.log(`   ✓ Description: ${createdFlag.value?.description}\n`);

    // List all feature flags
    console.log("   Listing all feature flags:");
    const featureFlags = client.listConfigurationSettings({
      keyFilter: `${featureFlagPrefix}*`,
    });

    for await (const flag of featureFlags) {
      console.log(`   - ${flag.key.replace(featureFlagPrefix, "")}: ${flag.value?.enabled ? "Enabled" : "Disabled"}`);
    }
    console.log();

    // 7. Delete the setting by key
    console.log('7. Deleting setting "app:Settings:FontSize"');
    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize",
    });
    console.log("   ✓ Setting deleted successfully\n");

    // Verify deletion
    console.log("   Verifying deletion...");
    try {
      await client.getConfigurationSetting({
        key: "app:Settings:FontSize",
      });
      console.log("   ⚠ Setting still exists (unexpected)");
    } catch (error) {
      if (error instanceof RestError && error.statusCode === 404) {
        console.log("   ✓ Confirmed: Setting does not exist\n");
      } else {
        throw error;
      }
    }

    // Cleanup: Delete other test settings
    console.log("Cleaning up test data...");
    try {
      await client.deleteConfigurationSetting({ key: "app:Settings:Theme", label: "Production" });
      await client.deleteConfigurationSetting({ key: `${featureFlagPrefix}BetaFeature` });
      console.log("✓ Cleanup completed\n");
    } catch (error) {
      if (error instanceof RestError && error.statusCode === 404) {
        console.log("✓ Settings already deleted\n");
      } else {
        throw error;
      }
    }

    console.log("✅ All operations completed successfully!");

  } catch (error) {
    // Error handling with RestError
    if (error instanceof RestError) {
      console.error("\n❌ Azure App Configuration error:");
      console.error(`   Status Code: ${error.statusCode}`);
      console.error(`   Error Code: ${error.code}`);
      console.error(`   Message: ${error.message}`);
      console.error(`   Request ID: ${error.request?.requestId}`);

      // Handle specific error cases
      switch (error.statusCode) {
        case 401:
          console.error("\n   → Check your connection string credentials");
          break;
        case 403:
          console.error("\n   → Insufficient permissions. Ensure you have Data Owner or Contributor role");
          break;
        case 404:
          console.error("\n   → Configuration setting or App Configuration resource not found");
          break;
        case 409:
          console.error("\n   → Conflict: Setting already exists (use setConfigurationSetting instead)");
          break;
        case 412:
          console.error("\n   → Precondition failed: ETag mismatch (concurrent modification)");
          break;
        case 429:
          console.error("\n   → Too many requests. Implement retry with exponential backoff");
          break;
      }
    } else if (error instanceof Error) {
      console.error("\n❌ Error:", error.message);
      console.error(error.stack);
    } else {
      console.error("\n❌ Unknown error:", error);
    }
    process.exit(1);
  }
}

// Run the demo
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
