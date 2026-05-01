import { AppConfigurationClient, ConfigurationSetting } from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

/**
 * Demonstrates Azure App Configuration operations including:
 * - Creating settings with labels
 * - Getting settings
 * - Listing settings with filters
 * - Creating feature flags
 * - Deleting settings
 */
async function main() {
  try {
    // 1. Create an AppConfigurationClient using a connection string
    const connectionString = process.env.AZURE_APP_CONFIG_CONNECTION_STRING;
    
    if (!connectionString) {
      throw new Error(
        "AZURE_APP_CONFIG_CONNECTION_STRING environment variable is required"
      );
    }

    const client = new AppConfigurationClient(connectionString);
    console.log("✓ AppConfigurationClient created successfully\n");

    // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
    console.log("Setting configuration: app:Settings:FontSize = 24");
    const fontSizeSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "24"
    });
    console.log(`✓ Setting created with key: ${fontSizeSetting.key}\n`);

    // 3. Set a setting with label "Production"
    console.log('Setting configuration with label "Production"');
    const productionSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "28",
      label: "Production"
    });
    console.log(`✓ Setting created with label: ${productionSetting.label}\n`);

    // 4. Get the setting by key and print its value
    console.log("Getting configuration by key...");
    const retrievedSetting = await client.getConfigurationSetting({
      key: "app:Settings:FontSize"
    });
    console.log(`✓ Retrieved setting: ${retrievedSetting.key} = ${retrievedSetting.value}`);
    console.log(`  Label: ${retrievedSetting.label || "(no label)"}`);
    console.log(`  Content Type: ${retrievedSetting.contentType || "(none)"}`);
    console.log(`  Last Modified: ${retrievedSetting.lastModified}\n`);

    // 5. List all settings matching the key filter "app:Settings:*"
    console.log('Listing all settings matching "app:Settings:*"...');
    const settingsIterator = client.listConfigurationSettings({
      keyFilter: "app:Settings:*"
    });

    let count = 0;
    for await (const setting of settingsIterator) {
      count++;
      console.log(`  [${count}] ${setting.key} = ${setting.value} (label: ${setting.label || "none"})`);
    }
    console.log(`✓ Found ${count} setting(s)\n`);

    // 6. Create a feature flag configuration setting for "BetaFeature"
    console.log('Creating feature flag "BetaFeature"...');
    const featureFlag: ConfigurationSetting = {
      key: ".appconfig.featureflag/BetaFeature",
      value: JSON.stringify({
        id: "BetaFeature",
        description: "Beta feature for testing",
        enabled: true,
        conditions: {
          client_filters: []
        }
      }),
      contentType: "application/vnd.microsoft.appconfig.ff+json;charset=utf-8"
    };

    const createdFeatureFlag = await client.setConfigurationSetting(featureFlag);
    console.log(`✓ Feature flag created: ${createdFeatureFlag.key}`);
    console.log(`  Enabled: ${JSON.parse(createdFeatureFlag.value!).enabled}\n`);

    // Additional: List all feature flags
    console.log("Listing all feature flags...");
    const featureFlagsIterator = client.listConfigurationSettings({
      keyFilter: ".appconfig.featureflag/*"
    });

    for await (const flag of featureFlagsIterator) {
      const flagData = JSON.parse(flag.value!);
      console.log(`  • ${flagData.id}: ${flagData.enabled ? "enabled" : "disabled"}`);
    }
    console.log();

    // 7. Delete the setting by key
    console.log("Deleting configuration setting...");
    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize"
    });
    console.log("✓ Setting deleted: app:Settings:FontSize (no label)\n");

    // Also delete the Production labeled setting
    console.log("Deleting Production labeled setting...");
    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize",
      label: "Production"
    });
    console.log("✓ Setting deleted: app:Settings:FontSize (Production label)\n");

    // Delete the feature flag
    console.log("Deleting feature flag...");
    await client.deleteConfigurationSetting({
      key: ".appconfig.featureflag/BetaFeature"
    });
    console.log("✓ Feature flag deleted: BetaFeature\n");

    console.log("All operations completed successfully!");

  } catch (error) {
    // Proper error handling with RestError
    if (error instanceof RestError) {
      console.error("Azure App Configuration REST Error:");
      console.error(`  Status Code: ${error.statusCode}`);
      console.error(`  Error Code: ${error.code}`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Request ID: ${error.request?.requestId || "N/A"}`);
      
      // Handle specific error codes
      switch (error.statusCode) {
        case 401:
          console.error("\n⚠ Authentication failed. Check your connection string.");
          break;
        case 403:
          console.error("\n⚠ Access forbidden. Verify your permissions.");
          break;
        case 404:
          console.error("\n⚠ Resource not found.");
          break;
        case 409:
          console.error("\n⚠ Conflict. The resource may already exist.");
          break;
        case 429:
          console.error("\n⚠ Too many requests. Rate limit exceeded.");
          break;
        default:
          console.error(`\n⚠ Unexpected error with status code ${error.statusCode}`);
      }
    } else if (error instanceof Error) {
      console.error("Error:", error.message);
      console.error(error.stack);
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  }
}

// Run the program
main();
