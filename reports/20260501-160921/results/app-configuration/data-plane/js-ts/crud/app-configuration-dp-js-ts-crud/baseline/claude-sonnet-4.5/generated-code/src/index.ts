import {
  AppConfigurationClient,
  ConfigurationSetting,
  FeatureFlagValue,
  RestError
} from "@azure/app-configuration";

async function main() {
  // Get connection string from environment variable
  const connectionString = process.env.AZURE_APP_CONFIG_CONNECTION_STRING;
  
  if (!connectionString) {
    console.error("Error: AZURE_APP_CONFIG_CONNECTION_STRING environment variable is not set");
    console.log("Set it with: export AZURE_APP_CONFIG_CONNECTION_STRING='<your-connection-string>'");
    process.exit(1);
  }

  try {
    // 1. Create an AppConfigurationClient using a connection string
    console.log("1. Creating AppConfigurationClient...");
    const client = new AppConfigurationClient(connectionString);
    console.log("✓ Client created successfully\n");

    // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
    console.log("2. Setting configuration: app:Settings:FontSize = 24");
    const fontSizeSetting: ConfigurationSetting = {
      key: "app:Settings:FontSize",
      value: "24"
    };
    await client.setConfigurationSetting(fontSizeSetting);
    console.log("✓ Configuration setting created\n");

    // 3. Set a setting with label "Production"
    console.log("3. Setting configuration with label 'Production'");
    const prodSetting: ConfigurationSetting = {
      key: "app:Settings:BackgroundColor",
      value: "Blue",
      label: "Production"
    };
    await client.setConfigurationSetting(prodSetting);
    console.log("✓ Production setting created\n");

    // 4. Get the setting by key and print its value
    console.log("4. Getting setting by key: app:Settings:FontSize");
    const retrievedSetting = await client.getConfigurationSetting({
      key: "app:Settings:FontSize"
    });
    console.log(`✓ Retrieved value: ${retrievedSetting.value}`);
    console.log(`  Key: ${retrievedSetting.key}`);
    console.log(`  Label: ${retrievedSetting.label || "(no label)"}`);
    console.log(`  Content Type: ${retrievedSetting.contentType || "(none)"}\n`);

    // 5. List all settings matching the key filter "app:Settings:*"
    console.log("5. Listing all settings with key filter 'app:Settings:*'");
    const settingsList = client.listConfigurationSettings({
      keyFilter: "app:Settings:*"
    });
    
    let count = 0;
    for await (const setting of settingsList) {
      count++;
      console.log(`  [${count}] ${setting.key} = ${setting.value}${setting.label ? ` (label: ${setting.label})` : ""}`);
    }
    console.log(`✓ Found ${count} setting(s)\n`);

    // 6. Create a feature flag configuration setting for "BetaFeature"
    console.log("6. Creating feature flag: BetaFeature");
    const featureFlagValue: FeatureFlagValue = {
      id: "BetaFeature",
      enabled: true,
      description: "Beta feature toggle",
      conditions: {
        clientFilters: []
      }
    };
    
    const featureFlagSetting: ConfigurationSetting = {
      key: ".appconfig.featureflag/BetaFeature",
      value: JSON.stringify(featureFlagValue),
      contentType: "application/vnd.microsoft.appconfig.ff+json;charset=utf-8"
    };
    
    await client.setConfigurationSetting(featureFlagSetting);
    console.log("✓ Feature flag created");
    console.log(`  ID: ${featureFlagValue.id}`);
    console.log(`  Enabled: ${featureFlagValue.enabled}\n`);

    // 7. Delete the setting by key
    console.log("7. Deleting setting: app:Settings:FontSize");
    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize"
    });
    console.log("✓ Setting deleted\n");

    // Cleanup: Delete other test settings
    console.log("Cleanup: Deleting remaining test settings...");
    await client.deleteConfigurationSetting({
      key: "app:Settings:BackgroundColor",
      label: "Production"
    });
    await client.deleteConfigurationSetting({
      key: ".appconfig.featureflag/BetaFeature"
    });
    console.log("✓ All test settings cleaned up\n");

    console.log("=== All operations completed successfully! ===");

  } catch (error) {
    // Proper error handling with RestError
    if (error instanceof RestError) {
      console.error("\n❌ Azure App Configuration Error:");
      console.error(`  Status Code: ${error.statusCode}`);
      console.error(`  Error Code: ${error.code}`);
      console.error(`  Message: ${error.message}`);
      
      if (error.statusCode === 401) {
        console.error("\n  → Check your connection string is valid");
      } else if (error.statusCode === 403) {
        console.error("\n  → Check your permissions in Azure App Configuration");
      } else if (error.statusCode === 404) {
        console.error("\n  → The requested resource was not found");
      }
    } else if (error instanceof Error) {
      console.error("\n❌ Error:", error.message);
    } else {
      console.error("\n❌ Unknown error:", error);
    }
    process.exit(1);
  }
}

main();
