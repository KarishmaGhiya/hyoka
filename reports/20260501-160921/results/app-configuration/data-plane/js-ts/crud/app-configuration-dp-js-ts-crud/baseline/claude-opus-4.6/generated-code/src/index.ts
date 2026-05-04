import {
  AppConfigurationClient,
  featureFlagContentType,
  featureFlagPrefix,
  isFeatureFlag,
} from "@azure/app-configuration";
import type { ConfigurationSetting } from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

// Connection string from environment or replace with your own
const connectionString =
  process.env.AZURE_APPCONFIG_CONNECTION_STRING ||
  "Endpoint=https://<your-resource>.azconfig.io;Id=<id>;Secret=<secret>";

async function main(): Promise<void> {
  // 1. Create an AppConfigurationClient using a connection string
  const client = new AppConfigurationClient(connectionString);
  console.log("AppConfigurationClient created successfully.\n");

  try {
    // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
    const fontSizeSetting: ConfigurationSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "24",
    });
    console.log(`Set setting: ${fontSizeSetting.key} = ${fontSizeSetting.value}`);

    // 3. Set a setting with label "Production"
    const productionSetting: ConfigurationSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "28",
      label: "Production",
    });
    console.log(
      `Set setting: ${productionSetting.key} = ${productionSetting.value} (label: ${productionSetting.label})\n`
    );

    // 4. Get the setting by key and print its value
    const retrievedSetting: ConfigurationSetting = await client.getConfigurationSetting({
      key: "app:Settings:FontSize",
    });
    console.log(
      `Retrieved setting: ${retrievedSetting.key} = ${retrievedSetting.value}\n`
    );

    // 5. List all settings matching the key filter "app:Settings:*"
    console.log('Listing settings matching "app:Settings:*":');
    const settingsIterator = client.listConfigurationSettings({
      keyFilter: "app:Settings:*",
    });
    for await (const setting of settingsIterator) {
      console.log(
        `  Key: ${setting.key}, Value: ${setting.value}, Label: ${setting.label ?? "(none)"}`
      );
    }
    console.log();

    // 6. Create a feature flag configuration setting for "BetaFeature"
    const featureFlagKey = `${featureFlagPrefix}BetaFeature`;
    const featureFlag: ConfigurationSetting = await client.setConfigurationSetting({
      key: featureFlagKey,
      value: JSON.stringify({
        id: "BetaFeature",
        description: "Beta feature flag for testing",
        enabled: true,
        conditions: { client_filters: [] },
      }),
      contentType: featureFlagContentType,
    });
    console.log(`Created feature flag: ${featureFlag.key}`);

    // Verify it is recognized as a feature flag
    const retrievedFlag = await client.getConfigurationSetting({
      key: featureFlagKey,
    });
    console.log(`Is feature flag: ${isFeatureFlag(retrievedFlag)}\n`);

    // 7. Delete the settings by key
    await client.deleteConfigurationSetting({ key: "app:Settings:FontSize" });
    console.log('Deleted setting: "app:Settings:FontSize"');

    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize",
      label: "Production",
    });
    console.log('Deleted setting: "app:Settings:FontSize" (label: Production)');

    await client.deleteConfigurationSetting({ key: featureFlagKey });
    console.log(`Deleted feature flag: ${featureFlagKey}`);
  } catch (error: unknown) {
    // Proper error handling with RestError
    if (error instanceof RestError) {
      console.error(`Azure REST Error: ${error.message}`);
      console.error(`  Status code: ${error.statusCode}`);
      console.error(`  Error code: ${error.code}`);
      console.error(`  Request ID: ${error.request?.requestId}`);
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unknown error occurred");
    }
    process.exit(1);
  }
}

main();
