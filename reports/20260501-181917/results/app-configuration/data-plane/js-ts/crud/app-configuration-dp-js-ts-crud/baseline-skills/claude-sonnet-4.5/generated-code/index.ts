import {
  AppConfigurationClient,
  ConfigurationSetting,
  FeatureFlagValue,
  featureFlagPrefix,
  featureFlagContentType,
} from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

async function main() {
  try {
    // 1. Create an AppConfigurationClient using a connection string
    const connectionString = process.env.AZURE_APPCONFIG_CONNECTION_STRING;
    
    if (!connectionString) {
      throw new Error(
        "AZURE_APPCONFIG_CONNECTION_STRING environment variable is required"
      );
    }

    console.log("Creating AppConfigurationClient...\n");
    const client = new AppConfigurationClient(connectionString);

    // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
    console.log("Setting configuration: app:Settings:FontSize = 24");
    const fontSizeSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "24",
      contentType: "text/plain",
    });
    console.log(`✓ Created setting with etag: ${fontSizeSetting.etag}\n`);

    // 3. Set a setting with label "Production"
    console.log('Setting configuration with label "Production"');
    const prodSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "24",
      label: "Production",
      contentType: "text/plain",
      tags: { environment: "prod" },
    });
    console.log(`✓ Created production setting with etag: ${prodSetting.etag}\n`);

    // 4. Get the setting by key and print its value
    console.log("Getting setting by key: app:Settings:FontSize");
    const retrievedSetting = await client.getConfigurationSetting({
      key: "app:Settings:FontSize",
    });
    console.log(`✓ Retrieved value: ${retrievedSetting.value}`);
    console.log(`  Label: ${retrievedSetting.label || "(no label)"}`);
    console.log(`  Content Type: ${retrievedSetting.contentType}\n`);

    // Get the production-labeled setting
    console.log('Getting setting with label "Production"');
    const prodRetrieved = await client.getConfigurationSetting({
      key: "app:Settings:FontSize",
      label: "Production",
    });
    console.log(`✓ Retrieved production value: ${prodRetrieved.value}`);
    console.log(`  Label: ${prodRetrieved.label}`);
    console.log(`  Tags: ${JSON.stringify(prodRetrieved.tags)}\n`);

    // Add more settings to demonstrate filtering
    console.log("Adding additional settings for demonstration...");
    await client.setConfigurationSetting({
      key: "app:Settings:Theme",
      value: "Dark",
    });
    await client.setConfigurationSetting({
      key: "app:Settings:Language",
      value: "en-US",
    });
    await client.setConfigurationSetting({
      key: "app:Database:ConnectionString",
      value: "Server=myserver;Database=mydb",
    });
    console.log("✓ Additional settings created\n");

    // 5. List all settings matching the key filter "app:Settings:*"
    console.log('Listing all settings matching "app:Settings:*"');
    const settings = client.listConfigurationSettings({
      keyFilter: "app:Settings:*",
    });

    let count = 0;
    for await (const setting of settings) {
      count++;
      console.log(
        `  ${count}. Key: ${setting.key}, Value: ${setting.value}, Label: ${setting.label || "(no label)"}`
      );
    }
    console.log(`✓ Found ${count} settings\n`);

    // 6. Create a feature flag configuration setting for "BetaFeature"
    console.log("Creating feature flag: BetaFeature");
    const featureFlag: ConfigurationSetting<FeatureFlagValue> = {
      key: `${featureFlagPrefix}BetaFeature`,
      contentType: featureFlagContentType,
      value: {
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
      },
    };

    const createdFlag = await client.setConfigurationSetting(featureFlag);
    console.log(`✓ Feature flag created: ${createdFlag.key}`);
    console.log(`  Enabled: ${createdFlag.value?.enabled}`);
    console.log(`  Description: ${createdFlag.value?.description}`);
    console.log(`  Filters: ${JSON.stringify(createdFlag.value?.conditions?.clientFilters)}\n`);

    // List feature flags
    console.log("Listing all feature flags:");
    const featureFlags = client.listConfigurationSettings({
      keyFilter: `${featureFlagPrefix}*`,
    });

    for await (const flag of featureFlags) {
      console.log(`  Feature: ${flag.key}`);
      console.log(`  Enabled: ${flag.value?.enabled}\n`);
    }

    // 7. Delete the setting by key
    console.log("Deleting settings...");
    
    // Delete the font size setting (no label)
    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize",
    });
    console.log("✓ Deleted: app:Settings:FontSize (no label)");

    // Delete the production-labeled setting
    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize",
      label: "Production",
    });
    console.log("✓ Deleted: app:Settings:FontSize (Production label)");

    // Delete other demo settings
    await client.deleteConfigurationSetting({ key: "app:Settings:Theme" });
    await client.deleteConfigurationSetting({ key: "app:Settings:Language" });
    await client.deleteConfigurationSetting({
      key: "app:Database:ConnectionString",
    });
    console.log("✓ Deleted additional demo settings");

    // Delete the feature flag
    await client.deleteConfigurationSetting({
      key: `${featureFlagPrefix}BetaFeature`,
    });
    console.log("✓ Deleted feature flag: BetaFeature\n");

    // Verify deletion
    console.log("Verifying deletion...");
    try {
      await client.getConfigurationSetting({
        key: "app:Settings:FontSize",
      });
      console.log("⚠ Setting still exists (unexpected)");
    } catch (error) {
      if (error instanceof RestError && error.statusCode === 404) {
        console.log("✓ Setting successfully deleted (404 Not Found)\n");
      } else {
        throw error;
      }
    }

    console.log("All operations completed successfully!");
  } catch (error) {
    // Proper error handling with RestError
    if (error instanceof RestError) {
      console.error("\n❌ Azure App Configuration Error:");
      console.error(`  Status Code: ${error.statusCode}`);
      console.error(`  Error Code: ${error.code}`);
      console.error(`  Message: ${error.message}`);
      
      if (error.statusCode === 401) {
        console.error("\n  → Check your connection string and credentials");
      } else if (error.statusCode === 403) {
        console.error("\n  → Check your access permissions");
      } else if (error.statusCode === 409) {
        console.error("\n  → Resource already exists or conflict occurred");
      }
      
      process.exit(1);
    } else if (error instanceof Error) {
      console.error("\n❌ Error:", error.message);
      process.exit(1);
    } else {
      console.error("\n❌ Unknown error:", error);
      process.exit(1);
    }
  }
}

main();
