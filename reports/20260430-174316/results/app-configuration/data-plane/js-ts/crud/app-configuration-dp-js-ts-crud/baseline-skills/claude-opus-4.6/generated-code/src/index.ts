import {
  AppConfigurationClient,
  ConfigurationSetting,
  featureFlagPrefix,
  featureFlagContentType,
  isFeatureFlag,
  parseFeatureFlag,
} from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

// Connection string from environment or replace with your own
const connectionString =
  process.env.AZURE_APPCONFIG_CONNECTION_STRING ||
  "Endpoint=https://<your-resource>.azconfig.io;Id=<id>;Secret=<secret>";

async function main(): Promise<void> {
  // 1. Create an AppConfigurationClient using a connection string
  const client = new AppConfigurationClient(connectionString);
  console.log("AppConfigurationClient created successfully.\n");

  const key = "app:Settings:FontSize";

  try {
    // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
    const setting: ConfigurationSetting = await client.setConfigurationSetting({
      key,
      value: "24",
    });
    console.log(`Set setting: ${setting.key} = ${setting.value}`);

    // 3. Set a setting with label "Production"
    const prodSetting: ConfigurationSetting =
      await client.setConfigurationSetting({
        key,
        value: "28",
        label: "Production",
      });
    console.log(
      `Set setting with label: ${prodSetting.key} = ${prodSetting.value} (label: ${prodSetting.label})\n`
    );

    // 4. Get the setting by key and print its value
    const retrieved: ConfigurationSetting =
      await client.getConfigurationSetting({ key });
    console.log(
      `Retrieved setting: ${retrieved.key} = ${retrieved.value}\n`
    );

    // 5. List all settings matching the key filter "app:Settings:*"
    console.log('Listing settings matching "app:Settings:*":');
    const settingsIterator = client.listConfigurationSettings({
      keyFilter: "app:Settings:*",
    });
    for await (const item of settingsIterator) {
      console.log(
        `  Key: ${item.key}, Value: ${item.value}, Label: ${item.label ?? "(none)"}`
      );
    }
    console.log();

    // 6. Create a feature flag configuration setting for "BetaFeature"
    const featureFlagKey = `${featureFlagPrefix}BetaFeature`;
    const featureFlag: ConfigurationSetting =
      await client.setConfigurationSetting({
        key: featureFlagKey,
        value: JSON.stringify({
          id: "BetaFeature",
          description: "Beta feature toggle",
          enabled: true,
          conditions: { client_filters: [] },
        }),
        contentType: featureFlagContentType,
      });
    console.log(`Created feature flag: ${featureFlag.key}`);

    // Verify it's a feature flag using the helper
    if (isFeatureFlag(featureFlag)) {
      const parsed = parseFeatureFlag(featureFlag);
      console.log(
        `  Feature flag "${parsed.value.id}" enabled: ${parsed.value.enabled}\n`
      );
    }

    // 7. Delete the settings by key
    await client.deleteConfigurationSetting({ key });
    console.log(`Deleted setting: ${key}`);

    await client.deleteConfigurationSetting({ key, label: "Production" });
    console.log(`Deleted setting: ${key} (label: Production)`);

    await client.deleteConfigurationSetting({ key: featureFlagKey });
    console.log(`Deleted feature flag: ${featureFlagKey}`);
  } catch (error) {
    // Proper error handling with RestError
    if (error instanceof RestError) {
      console.error(`Azure REST error:`);
      console.error(`  Status code: ${error.statusCode}`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Code: ${error.code}`);
    } else if (error instanceof Error) {
      console.error(`Unexpected error: ${error.message}`);
    }
    process.exit(1);
  }
}

main();
