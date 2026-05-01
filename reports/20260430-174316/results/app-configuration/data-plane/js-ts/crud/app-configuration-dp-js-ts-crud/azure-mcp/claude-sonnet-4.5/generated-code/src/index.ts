import { AppConfigurationClient, ConfigurationSetting } from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

async function main() {
  // Get connection string from environment variable
  const connectionString = process.env.AZURE_APPCONFIG_CONNECTION_STRING;

  if (!connectionString) {
    console.error("Error: AZURE_APPCONFIG_CONNECTION_STRING environment variable is not set");
    console.log("\nPlease set the connection string:");
    console.log("export AZURE_APPCONFIG_CONNECTION_STRING='<your-connection-string>'");
    process.exit(1);
  }

  try {
    // 1. Create an AppConfigurationClient using a connection string
    console.log("1. Creating AppConfigurationClient...");
    const client = new AppConfigurationClient(connectionString);
    console.log("✓ Client created successfully\n");

    // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
    console.log("2. Setting configuration: app:Settings:FontSize = 24");
    const fontSizeSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "24",
    });
    console.log(`✓ Set: ${fontSizeSetting.key} = ${fontSizeSetting.value}\n`);

    // 3. Set a setting with label "Production"
    console.log("3. Setting configuration with Production label: app:Settings:FontSize = 32");
    const prodSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "32",
      label: "Production",
    });
    console.log(`✓ Set: ${prodSetting.key} (label: ${prodSetting.label}) = ${prodSetting.value}\n`);

    // 4. Get the setting by key and print its value
    console.log("4. Getting configuration setting by key...");
    const retrievedSetting = await client.getConfigurationSetting({
      key: "app:Settings:FontSize",
    });
    console.log(`✓ Retrieved: ${retrievedSetting.key} = ${retrievedSetting.value}`);
    console.log(`  Label: ${retrievedSetting.label || "(no label)"}`);
    console.log(`  Content Type: ${retrievedSetting.contentType || "(none)"}`);
    console.log(`  ETag: ${retrievedSetting.etag}\n`);

    // 5. List all settings matching the key filter "app:Settings:*"
    console.log("5. Listing all settings with key filter 'app:Settings:*'...");
    const settingsList = client.listConfigurationSettings({
      keyFilter: "app:Settings:*",
    });

    let count = 0;
    for await (const setting of settingsList) {
      count++;
      console.log(`  [${count}] ${setting.key} (label: ${setting.label || "(no label)"}) = ${setting.value}`);
    }
    console.log(`✓ Found ${count} settings\n`);

    // 6. Create a feature flag configuration setting for "BetaFeature"
    console.log("6. Creating feature flag for 'BetaFeature'...");
    const featureFlagKey = ".appconfig.featureflag/BetaFeature";
    const featureFlagValue = JSON.stringify({
      id: "BetaFeature",
      description: "Beta feature toggle",
      enabled: true,
      conditions: {
        client_filters: [],
      },
    });

    const featureFlag = await client.setConfigurationSetting({
      key: featureFlagKey,
      value: featureFlagValue,
      contentType: "application/vnd.microsoft.appconfig.ff+json;charset=utf-8",
    });
    console.log(`✓ Feature flag created: ${featureFlag.key}`);
    console.log(`  Enabled: ${JSON.parse(featureFlag.value || "{}").enabled}\n`);

    // 7. Delete the setting by key
    console.log("7. Deleting configuration settings...");
    
    // Delete the no-label setting
    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize",
    });
    console.log("✓ Deleted: app:Settings:FontSize (no label)");

    // Delete the Production label setting
    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize",
      label: "Production",
    });
    console.log("✓ Deleted: app:Settings:FontSize (Production label)");

    // Delete the feature flag
    await client.deleteConfigurationSetting({
      key: featureFlagKey,
    });
    console.log("✓ Deleted: BetaFeature feature flag\n");

    console.log("✅ All operations completed successfully!");

  } catch (error) {
    // Proper error handling with RestError
    if (error instanceof RestError) {
      console.error("\n❌ Azure App Configuration Error:");
      console.error(`  Status Code: ${error.statusCode}`);
      console.error(`  Error Code: ${error.code}`);
      console.error(`  Message: ${error.message}`);
      
      if (error.statusCode === 401) {
        console.error("\n💡 Hint: Check your connection string is valid and has proper permissions");
      } else if (error.statusCode === 404) {
        console.error("\n💡 Hint: The requested configuration setting was not found");
      } else if (error.statusCode === 429) {
        console.error("\n💡 Hint: Too many requests - consider implementing retry logic");
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

// Run the main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
