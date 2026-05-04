import {
  AppConfigurationClient,
  featureFlagPrefix,
  featureFlagContentType,
  isFeatureFlag,
} from "@azure/app-configuration";
import type { ConfigurationSetting } from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

/**
 * Demonstrates CRUD operations with Azure App Configuration:
 * - Set, get, list, and delete configuration settings
 * - Work with labeled settings and feature flags
 * - Handle errors with RestError
 */
async function main(): Promise<void> {
  // 1. Create an AppConfigurationClient using a connection string
  const connectionString =
    process.env.AZURE_APPCONFIG_CONNECTION_STRING ??
    "Endpoint=https://<your-appconfig>.azconfig.io;Id=<id>;Secret=<secret>";

  const client = new AppConfigurationClient(connectionString);
  console.log("AppConfigurationClient created successfully.\n");

  try {
    // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
    const fontSizeSetting: ConfigurationSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "24",
    });
    console.log(
      `Set setting => key: "${fontSizeSetting.key}", value: "${fontSizeSetting.value}"`
    );

    // 3. Set a setting with label "Production"
    const productionSetting: ConfigurationSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "20",
      label: "Production",
    });
    console.log(
      `Set labeled setting => key: "${productionSetting.key}", value: "${productionSetting.value}", label: "${productionSetting.label}"\n`
    );

    // 4. Get the setting by key and print its value
    const retrieved: ConfigurationSetting = await client.getConfigurationSetting({
      key: "app:Settings:FontSize",
    });
    console.log(
      `Retrieved setting => key: "${retrieved.key}", value: "${retrieved.value}"\n`
    );

    // 5. List all settings matching the key filter "app:Settings:*"
    console.log('Listing settings matching "app:Settings:*":');
    const settingsIterator = client.listConfigurationSettings({
      keyFilter: "app:Settings:*",
    });
    for await (const setting of settingsIterator) {
      console.log(
        `  key: "${setting.key}", value: "${setting.value}", label: "${setting.label ?? "(none)"}"`
      );
    }
    console.log();

    // 6. Create a feature flag configuration setting for "BetaFeature"
    const featureFlagKey = `${featureFlagPrefix}BetaFeature`;
    const featureFlag: ConfigurationSetting = await client.setConfigurationSetting({
      key: featureFlagKey,
      value: JSON.stringify({
        id: "BetaFeature",
        description: "Controls access to the beta feature",
        enabled: true,
        conditions: { client_filters: [] },
      }),
      contentType: featureFlagContentType,
    });
    console.log(`Created feature flag => key: "${featureFlag.key}"`);

    // Verify it is recognized as a feature flag
    const retrievedFlag = await client.getConfigurationSetting({
      key: featureFlagKey,
    });
    if (isFeatureFlag(retrievedFlag)) {
      console.log(
        `  Verified as feature flag, enabled: ${JSON.parse(retrievedFlag.value!).enabled}\n`
      );
    }

    // 7. Delete the settings by key
    await client.deleteConfigurationSetting({ key: "app:Settings:FontSize" });
    console.log('Deleted setting with key "app:Settings:FontSize" (no label).');

    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize",
      label: "Production",
    });
    console.log('Deleted setting with key "app:Settings:FontSize" (label: "Production").');

    await client.deleteConfigurationSetting({ key: featureFlagKey });
    console.log(`Deleted feature flag with key "${featureFlagKey}".`);
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(`Azure RestError: ${error.message}`);
      console.error(`  Status code: ${error.statusCode}`);
      console.error(`  Error code:  ${error.code}`);
    } else if (error instanceof Error) {
      console.error(`Unexpected error: ${error.message}`);
    } else {
      console.error("An unknown error occurred.");
    }
  }
}

main();
