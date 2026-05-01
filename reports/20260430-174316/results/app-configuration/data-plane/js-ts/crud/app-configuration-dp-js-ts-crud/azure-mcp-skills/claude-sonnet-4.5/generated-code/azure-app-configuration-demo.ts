import {
  AppConfigurationClient,
  ConfigurationSetting,
  FeatureFlagValue,
  RestError
} from "@azure/app-configuration";

/**
 * Azure App Configuration Demo
 * Demonstrates CRUD operations with Azure App Configuration
 */
async function manageAppConfiguration(): Promise<void> {
  try {
    // 1. Create an AppConfigurationClient using a connection string
    // Replace with your actual connection string from Azure Portal
    const connectionString = process.env.AZURE_APPCONFIG_CONNECTION_STRING || 
      "Endpoint=https://your-config-store.azconfig.io;Id=xxxxx;Secret=xxxxx";
    
    console.log("🔗 Creating AppConfigurationClient...\n");
    const client = new AppConfigurationClient(connectionString);

    // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
    console.log("📝 Setting configuration: app:Settings:FontSize = 24");
    const fontSizeSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "24"
    });
    console.log(`✅ Set: ${fontSizeSetting.key} = ${fontSizeSetting.value}`);
    console.log(`   ETag: ${fontSizeSetting.etag}\n`);

    // 3. Set a setting with label "Production"
    console.log("📝 Setting configuration with Production label");
    const prodSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "28",
      label: "Production"
    });
    console.log(`✅ Set: ${prodSetting.key} = ${prodSetting.value} [${prodSetting.label}]`);
    console.log(`   ETag: ${prodSetting.etag}\n`);

    // 4. Get the setting by key and print its value
    console.log("🔍 Getting configuration setting by key");
    const retrievedSetting = await client.getConfigurationSetting({
      key: "app:Settings:FontSize"
    });
    console.log(`✅ Retrieved: ${retrievedSetting.key} = ${retrievedSetting.value}`);
    console.log(`   Label: ${retrievedSetting.label || "(no label)"}`);
    console.log(`   Content Type: ${retrievedSetting.contentType || "(none)"}`);
    console.log(`   Last Modified: ${retrievedSetting.lastModified}\n`);

    // 5. List all settings matching the key filter "app:Settings:*"
    console.log("📋 Listing all settings matching 'app:Settings:*'");
    const settingsIterator = client.listConfigurationSettings({
      keyFilter: "app:Settings:*"
    });

    let count = 0;
    for await (const setting of settingsIterator) {
      count++;
      console.log(`   ${count}. ${setting.key} = ${setting.value}`);
      if (setting.label) {
        console.log(`      Label: ${setting.label}`);
      }
    }
    console.log(`✅ Found ${count} setting(s)\n`);

    // 6. Create a feature flag configuration setting for "BetaFeature"
    console.log("🚩 Creating feature flag: BetaFeature");
    
    const featureFlagValue: FeatureFlagValue = {
      id: "BetaFeature",
      enabled: true,
      description: "Beta feature toggle for testing new functionality",
      conditions: {
        clientFilters: []
      }
    };

    const featureFlagSetting = await client.setConfigurationSetting({
      key: ".appconfig.featureflag/BetaFeature",
      value: JSON.stringify(featureFlagValue),
      contentType: "application/vnd.microsoft.appconfig.ff+json;charset=utf-8"
    });
    
    console.log(`✅ Feature flag created: ${featureFlagValue.id}`);
    console.log(`   Enabled: ${featureFlagValue.enabled}`);
    console.log(`   Description: ${featureFlagValue.description}\n`);

    // Additional: List all feature flags
    console.log("📋 Listing all feature flags");
    const featureFlagsIterator = client.listConfigurationSettings({
      keyFilter: ".appconfig.featureflag/*"
    });

    let flagCount = 0;
    for await (const flag of featureFlagsIterator) {
      flagCount++;
      const flagValue = JSON.parse(flag.value || "{}") as FeatureFlagValue;
      console.log(`   ${flagCount}. ${flagValue.id} - Enabled: ${flagValue.enabled}`);
    }
    console.log(`✅ Found ${flagCount} feature flag(s)\n`);

    // 7. Delete the setting by key
    console.log("🗑️  Deleting configuration setting: app:Settings:FontSize");
    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize"
    });
    console.log("✅ Deleted setting (no label)\n");

    // Delete the Production labeled setting
    console.log("🗑️  Deleting configuration setting with Production label");
    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize",
      label: "Production"
    });
    console.log("✅ Deleted setting (Production label)\n");

    // Delete the feature flag
    console.log("🗑️  Deleting feature flag: BetaFeature");
    await client.deleteConfigurationSetting({
      key: ".appconfig.featureflag/BetaFeature"
    });
    console.log("✅ Deleted feature flag\n");

    // Verify deletion by attempting to list again
    console.log("✅ Verifying deletion...");
    const verifyIterator = client.listConfigurationSettings({
      keyFilter: "app:Settings:*"
    });
    
    let remainingCount = 0;
    for await (const setting of verifyIterator) {
      remainingCount++;
      console.log(`   Still exists: ${setting.key}`);
    }
    
    if (remainingCount === 0) {
      console.log("✅ All settings successfully deleted!\n");
    } else {
      console.log(`⚠️  ${remainingCount} setting(s) still remain\n`);
    }

    console.log("🎉 Demo completed successfully!");

  } catch (error) {
    // Proper error handling with RestError
    if (error instanceof RestError) {
      console.error("❌ Azure App Configuration Error:");
      console.error(`   Status Code: ${error.statusCode}`);
      console.error(`   Error Code: ${error.code}`);
      console.error(`   Message: ${error.message}`);
      
      if (error.statusCode === 401) {
        console.error("\n💡 Hint: Check your connection string and ensure it's valid");
      } else if (error.statusCode === 403) {
        console.error("\n💡 Hint: Ensure you have proper permissions to access this configuration store");
      } else if (error.statusCode === 404) {
        console.error("\n💡 Hint: The requested configuration setting was not found");
      }
    } else if (error instanceof Error) {
      console.error("❌ Error:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error("❌ Unknown error:", error);
    }
    process.exit(1);
  }
}

// Run the demo
console.log("🚀 Azure App Configuration TypeScript Demo\n");
console.log("=" .repeat(60) + "\n");

manageAppConfiguration()
  .then(() => {
    console.log("\n" + "=".repeat(60));
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Unhandled error:", error);
    process.exit(1);
  });
