import {
  AppConfigurationClient,
  ConfigurationSetting,
  FeatureFlagValue,
} from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

async function manageAppConfiguration() {
  // Connection string should be retrieved from environment variable
  const connectionString =
    process.env.AZURE_APPCONFIG_CONNECTION_STRING ||
    "Endpoint=https://your-app-config.azconfig.io;Id=xxxxx;Secret=xxxxx";

  if (!process.env.AZURE_APPCONFIG_CONNECTION_STRING) {
    console.warn(
      "⚠️  AZURE_APPCONFIG_CONNECTION_STRING not set. Using placeholder."
    );
    console.warn(
      "   Set it with: $env:AZURE_APPCONFIG_CONNECTION_STRING='<your-connection-string>'\n"
    );
  }

  try {
    // 1. Create an AppConfigurationClient using connection string
    console.log("1. Creating AppConfigurationClient...");
    const client = new AppConfigurationClient(connectionString);
    console.log("✓ Client created successfully\n");

    const settingKey = "app:Settings:FontSize";
    const productionKey = "app:Settings:Theme";
    const productionLabel = "Production";

    // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
    console.log("2. Setting configuration setting...");
    const fontSizeSetting = await client.setConfigurationSetting({
      key: settingKey,
      value: "24",
    });
    console.log(
      `✓ Set configuration: ${fontSizeSetting.key} = ${fontSizeSetting.value}`
    );
    console.log(`  ETag: ${fontSizeSetting.etag}\n`);

    // 3. Set a setting with label "Production"
    console.log('3. Setting configuration with label "Production"...');
    const productionSetting = await client.setConfigurationSetting({
      key: productionKey,
      value: "DarkMode",
      label: productionLabel,
      contentType: "text/plain",
    });
    console.log(
      `✓ Set configuration: ${productionSetting.key} = ${productionSetting.value}`
    );
    console.log(`  Label: ${productionSetting.label}`);
    console.log(`  Content Type: ${productionSetting.contentType}\n`);

    // 4. Get the setting by key and print its value
    console.log("4. Getting configuration setting by key...");
    const retrievedSetting = await client.getConfigurationSetting({
      key: settingKey,
    });
    console.log(`✓ Retrieved configuration: ${retrievedSetting.key}`);
    console.log(`  Value: ${retrievedSetting.value}`);
    console.log(`  Last Modified: ${retrievedSetting.lastModified}`);
    console.log(`  Read Only: ${retrievedSetting.isReadOnly}\n`);

    // 5. List all settings matching the key filter "app:Settings:*"
    console.log('5. Listing all settings with key filter "app:Settings:*"...');
    const settings = client.listConfigurationSettings({
      keyFilter: "app:Settings:*",
    });

    let count = 0;
    for await (const setting of settings) {
      count++;
      console.log(
        `  [${count}] ${setting.key} = ${setting.value} (Label: ${setting.label || "(none)"})`
      );
    }
    console.log(`✓ Listed ${count} configuration setting(s)\n`);

    // 6. Create a feature flag configuration setting
    console.log('6. Creating feature flag "BetaFeature"...');
    const featureFlagKey = ".appconfig.featureflag/BetaFeature";

    const featureFlagValue: FeatureFlagValue = {
      id: "BetaFeature",
      enabled: true,
      description: "Beta feature for testing new functionality",
      conditions: {
        clientFilters: [
          {
            name: "Microsoft.Percentage",
            parameters: {
              Value: 50,
            },
          },
        ],
      },
    };

    const featureFlagSetting = await client.setConfigurationSetting({
      key: featureFlagKey,
      value: JSON.stringify(featureFlagValue),
      contentType: "application/vnd.microsoft.appconfig.ff+json;charset=utf-8",
    });

    console.log(`✓ Feature flag created: ${featureFlagValue.id}`);
    console.log(`  Enabled: ${featureFlagValue.enabled}`);
    console.log(`  Description: ${featureFlagValue.description}`);
    console.log(
      `  Rollout Percentage: ${featureFlagValue.conditions?.clientFilters?.[0]?.parameters?.Value}%\n`
    );

    // Additional: Get the feature flag back
    console.log("   Retrieving feature flag...");
    const retrievedFeatureFlag = await client.getConfigurationSetting({
      key: featureFlagKey,
    });
    const parsedFeatureFlag: FeatureFlagValue = JSON.parse(
      retrievedFeatureFlag.value || "{}"
    );
    console.log(`   ✓ Retrieved feature flag: ${parsedFeatureFlag.id}`);
    console.log(`     Enabled: ${parsedFeatureFlag.enabled}\n`);

    // 7. Delete the settings by key
    console.log("7. Deleting configuration settings...");

    // Delete the font size setting
    await client.deleteConfigurationSetting({ key: settingKey });
    console.log(`✓ Deleted setting: ${settingKey}`);

    // Delete the production setting
    await client.deleteConfigurationSetting({
      key: productionKey,
      label: productionLabel,
    });
    console.log(`✓ Deleted setting: ${productionKey} (Label: ${productionLabel})`);

    // Delete the feature flag
    await client.deleteConfigurationSetting({ key: featureFlagKey });
    console.log(`✓ Deleted feature flag: BetaFeature\n`);

    // Verify deletion
    console.log("   Verifying deletion...");
    try {
      await client.getConfigurationSetting({ key: settingKey });
      console.log("   ⚠️  Setting still exists (unexpected)");
    } catch (error) {
      if (error instanceof RestError && error.statusCode === 404) {
        console.log("   ✓ Confirmed: Setting no longer exists");
      } else {
        throw error;
      }
    }

    console.log("\n✅ All operations completed successfully!");
  } catch (error) {
    console.error("\n❌ Error occurred:");

    if (error instanceof RestError) {
      // Handle Azure-specific REST errors
      console.error(`  Status Code: ${error.statusCode}`);
      console.error(`  Error Code: ${error.code}`);
      console.error(`  Message: ${error.message}`);

      if (error.statusCode === 401) {
        console.error(
          "\n  Authentication failed. Please check your connection string."
        );
      } else if (error.statusCode === 403) {
        console.error(
          "\n  Permission denied. Ensure your App Configuration has proper access rights."
        );
      } else if (error.statusCode === 404) {
        console.error("\n  Resource not found.");
      } else if (error.statusCode === 429) {
        console.error("\n  Too many requests. Rate limit exceeded.");
      }

      if (error.request) {
        console.error(`  Request URL: ${error.request.url}`);
      }
    } else if (error instanceof Error) {
      console.error(`  ${error.name}: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
    } else {
      console.error(`  Unknown error: ${error}`);
    }

    process.exit(1);
  }
}

// Run the program
manageAppConfiguration();
