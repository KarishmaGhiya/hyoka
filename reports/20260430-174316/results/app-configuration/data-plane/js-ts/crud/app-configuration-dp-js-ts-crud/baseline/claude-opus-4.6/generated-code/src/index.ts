import {
  AppConfigurationClient,
  ConfigurationSetting,
  featureFlagContentType,
  featureFlagPrefix,
} from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

// Retrieve the connection string from environment variable
const connectionString = process.env.AZURE_APPCONFIG_CONNECTION_STRING;
if (!connectionString) {
  throw new Error(
    "Environment variable AZURE_APPCONFIG_CONNECTION_STRING is not set."
  );
}

async function main(): Promise<void> {
  // 1. Create AppConfigurationClient using a connection string
  const client = new AppConfigurationClient(connectionString!);
  console.log("AppConfigurationClient created successfully.\n");

  const key = "app:Settings:FontSize";

  try {
    // 2. Set a configuration setting with key and value
    const addedSetting: ConfigurationSetting = await client.setConfigurationSetting({
      key,
      value: "24",
    });
    console.log(`Added setting: ${addedSetting.key} = ${addedSetting.value}`);

    // 3. Set a setting with label "Production"
    const labeledSetting: ConfigurationSetting = await client.setConfigurationSetting({
      key,
      value: "28",
      label: "Production",
    });
    console.log(
      `Added labeled setting: ${labeledSetting.key} = ${labeledSetting.value} (label: ${labeledSetting.label})\n`
    );

    // 4. Get the setting by key and print its value
    const retrievedSetting = await client.getConfigurationSetting({ key });
    console.log(
      `Retrieved setting: ${retrievedSetting.key} = ${retrievedSetting.value}\n`
    );

    // 5. List all settings matching key filter "app:Settings:*"
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
    const featureFlagValue = JSON.stringify({
      id: "BetaFeature",
      description: "Beta feature flag for testing",
      enabled: true,
      conditions: {
        client_filters: [],
      },
    });

    const featureFlag: ConfigurationSetting = await client.setConfigurationSetting({
      key: featureFlagKey,
      value: featureFlagValue,
      contentType: featureFlagContentType,
    });
    console.log(
      `Created feature flag: ${featureFlag.key} (contentType: ${featureFlag.contentType})`
    );
    console.log(`  Value: ${featureFlag.value}\n`);

    // 7. Delete the settings by key
    await client.deleteConfigurationSetting({ key });
    console.log(`Deleted setting with key: ${key}`);

    await client.deleteConfigurationSetting({ key, label: "Production" });
    console.log(`Deleted setting with key: ${key}, label: Production`);

    await client.deleteConfigurationSetting({ key: featureFlagKey });
    console.log(`Deleted feature flag: ${featureFlagKey}`);

    console.log("\nAll operations completed successfully.");
  } catch (error) {
    // Proper error handling with RestError
    if (error instanceof RestError) {
      console.error(`Azure REST API error:`);
      console.error(`  Status code: ${error.statusCode}`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Code: ${error.code}`);
    } else if (error instanceof Error) {
      console.error(`Unexpected error: ${error.message}`);
    } else {
      console.error("An unknown error occurred:", error);
    }
    process.exit(1);
  }
}

main();
