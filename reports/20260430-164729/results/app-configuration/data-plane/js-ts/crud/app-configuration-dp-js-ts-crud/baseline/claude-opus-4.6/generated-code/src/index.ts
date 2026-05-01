import {
  AppConfigurationClient,
  featureFlagContentType,
  featureFlagPrefix,
} from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

/**
 * Demonstrates CRUD operations for Azure App Configuration settings.
 *
 * Required environment variable:
 *   AZURE_APP_CONFIGURATION_CONNECTION_STRING
 */
async function main(): Promise<void> {
  // 1. Create an AppConfigurationClient using a connection string
  const connectionString = process.env.AZURE_APP_CONFIGURATION_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error(
      "Environment variable AZURE_APP_CONFIGURATION_CONNECTION_STRING is not set."
    );
  }

  const client = new AppConfigurationClient(connectionString);
  console.log("AppConfigurationClient created successfully.\n");

  const key = "app:Settings:FontSize";

  try {
    // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
    const setting = await client.setConfigurationSetting({
      key,
      value: "24",
    });
    console.log(`Set setting -> key: "${setting.key}", value: "${setting.value}"`);

    // 3. Set a setting with label "Production"
    const productionSetting = await client.setConfigurationSetting({
      key,
      value: "24",
      label: "Production",
    });
    console.log(
      `Set setting -> key: "${productionSetting.key}", value: "${productionSetting.value}", label: "${productionSetting.label}"\n`
    );

    // 4. Get the setting by key and print its value
    const retrievedSetting = await client.getConfigurationSetting({ key });
    console.log(
      `Retrieved setting -> key: "${retrievedSetting.key}", value: "${retrievedSetting.value}"\n`
    );

    // 5. List all settings matching the key filter "app:Settings:*"
    console.log('Listing settings matching "app:Settings:*":');
    const settingsIterator = client.listConfigurationSettings({
      keyFilter: "app:Settings:*",
    });
    for await (const item of settingsIterator) {
      console.log(`  key: "${item.key}", value: "${item.value}", label: "${item.label ?? ""}"`);
    }
    console.log();

    // 6. Create a feature flag configuration setting for "BetaFeature"
    const featureFlagKey = `${featureFlagPrefix}BetaFeature`;
    const featureFlag = await client.setConfigurationSetting({
      key: featureFlagKey,
      contentType: featureFlagContentType,
      value: JSON.stringify({
        id: "BetaFeature",
        description: "Beta feature flag",
        enabled: true,
        conditions: { client_filters: [] },
      }),
    });
    console.log(
      `Set feature flag -> key: "${featureFlag.key}", value: ${featureFlag.value}\n`
    );

    // 7. Delete the settings by key
    await client.deleteConfigurationSetting({ key });
    console.log(`Deleted setting with key: "${key}"`);

    await client.deleteConfigurationSetting({ key, label: "Production" });
    console.log(`Deleted setting with key: "${key}", label: "Production"`);

    await client.deleteConfigurationSetting({ key: featureFlagKey });
    console.log(`Deleted feature flag with key: "${featureFlagKey}"`);
  } catch (error) {
    if (error instanceof RestError) {
      console.error(`Azure RestError: ${error.message}`);
      console.error(`  Status code: ${error.statusCode ?? "N/A"}`);
      console.error(`  Error code:  ${error.code ?? "N/A"}`);
    } else {
      throw error;
    }
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
