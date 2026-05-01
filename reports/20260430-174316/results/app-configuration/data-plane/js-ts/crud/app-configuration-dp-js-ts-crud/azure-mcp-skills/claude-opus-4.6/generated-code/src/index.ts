import {
  AppConfigurationClient,
  ConfigurationSetting,
  featureFlagPrefix,
  featureFlagContentType,
} from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

/**
 * Demonstrates CRUD operations with Azure App Configuration:
 * - Set, get, list, and delete configuration settings
 * - Work with labeled settings and feature flags
 */
async function main(): Promise<void> {
  // 1. Create client using a connection string
  const connectionString =
    process.env.AZURE_APPCONFIG_CONNECTION_STRING ??
    "Endpoint=https://<your-resource>.azconfig.io;Id=<id>;Secret=<secret>";

  const client = new AppConfigurationClient(connectionString);

  try {
    // 2. Set a configuration setting
    const fontSizeSetting: ConfigurationSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "24",
    });
    console.log(`Set setting: ${fontSizeSetting.key} = ${fontSizeSetting.value}`);

    // 3. Set a setting with a label
    const prodSetting: ConfigurationSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "20",
      label: "Production",
    });
    console.log(
      `Set labeled setting: ${prodSetting.key} = ${prodSetting.value} (label: ${prodSetting.label})`,
    );

    // 4. Get a setting by key and print its value
    const retrieved: ConfigurationSetting = await client.getConfigurationSetting({
      key: "app:Settings:FontSize",
    });
    console.log(`Retrieved setting: ${retrieved.key} = ${retrieved.value}`);

    // 5. List all settings matching a key filter
    console.log("\nSettings matching 'app:Settings:*':");
    const settingsIterator = client.listConfigurationSettings({
      keyFilter: "app:Settings:*",
    });
    for await (const setting of settingsIterator) {
      console.log(`  ${setting.key} = ${setting.value} (label: ${setting.label ?? "(none)"})`);
    }

    // 6. Create a feature flag configuration setting
    const featureFlagId = `${featureFlagPrefix}BetaFeature`;
    const featureFlag: ConfigurationSetting = await client.setConfigurationSetting({
      key: featureFlagId,
      contentType: featureFlagContentType,
      value: JSON.stringify({
        id: "BetaFeature",
        description: "Controls access to beta features",
        enabled: true,
        conditions: { client_filters: [] },
      }),
    });
    console.log(`\nCreated feature flag: ${featureFlag.key}`);

    // 7. Delete the setting by key
    await client.deleteConfigurationSetting({ key: "app:Settings:FontSize" });
    console.log("\nDeleted setting: app:Settings:FontSize (no label)");

    // Clean up: delete the labeled setting and feature flag
    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize",
      label: "Production",
    });
    await client.deleteConfigurationSetting({ key: featureFlagId });
    console.log("Cleaned up remaining settings.");
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(`Azure REST error: ${error.message}`);
      console.error(`  Status code: ${error.statusCode}`);
      console.error(`  Request ID: ${error.request?.headers?.get("x-ms-client-request-id")}`);
    } else if (error instanceof Error) {
      console.error(`Unexpected error: ${error.message}`);
    }
    process.exit(1);
  }
}

main();
