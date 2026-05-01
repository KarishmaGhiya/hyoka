import {
  AppConfigurationClient,
  ConfigurationSetting,
  featureFlagContentType,
  featureFlagPrefix,
} from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

async function main(): Promise<void> {
  // 1. Create the client using a connection string
  const connectionString =
    process.env.AZURE_APPCONFIG_CONNECTION_STRING ??
    "Endpoint=https://<your-resource>.azconfig.io;Id=<id>;Secret=<secret>";
  const client = new AppConfigurationClient(connectionString);

  const key = "app:Settings:FontSize";

  try {
    // 2. Set a configuration setting
    const setting: ConfigurationSetting = await client.setConfigurationSetting({
      key,
      value: "24",
    });
    console.log(`Set "${setting.key}" = "${setting.value}"`);

    // 3. Set a setting with a label
    const labeledSetting = await client.setConfigurationSetting({
      key,
      value: "28",
      label: "Production",
    });
    console.log(
      `Set "${labeledSetting.key}" = "${labeledSetting.value}" (label: ${labeledSetting.label})`
    );

    // 4. Get the setting by key and print its value
    const retrieved = await client.getConfigurationSetting({ key });
    console.log(`Retrieved "${retrieved.key}" = "${retrieved.value}"`);

    // 5. List all settings matching a key filter
    console.log("\nSettings matching 'app:Settings:*':");
    const settings = client.listConfigurationSettings({
      keyFilter: "app:Settings:*",
    });
    for await (const item of settings) {
      console.log(`  ${item.key} = ${item.value} (label: ${item.label ?? "none"})`);
    }

    // 6. Create a feature flag configuration setting
    const featureFlagKey = `${featureFlagPrefix}BetaFeature`;
    await client.setConfigurationSetting({
      key: featureFlagKey,
      contentType: featureFlagContentType,
      value: JSON.stringify({
        id: "BetaFeature",
        description: "Beta feature toggle",
        enabled: true,
        conditions: { client_filters: [] },
      }),
    });
    console.log("\nFeature flag 'BetaFeature' created.");

    // 7. Delete the setting by key
    await client.deleteConfigurationSetting({ key });
    console.log(`\nDeleted setting with key "${key}"`);

    // Clean up: delete the labeled setting and feature flag
    await client.deleteConfigurationSetting({ key, label: "Production" });
    await client.deleteConfigurationSetting({ key: featureFlagKey });
    console.log("Cleanup complete.");
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(`Azure REST error [${error.statusCode}]: ${error.message}`);
      if (error.statusCode === 401) {
        console.error("Check your connection string or credentials.");
      }
    } else {
      throw error;
    }
  }
}

main();
