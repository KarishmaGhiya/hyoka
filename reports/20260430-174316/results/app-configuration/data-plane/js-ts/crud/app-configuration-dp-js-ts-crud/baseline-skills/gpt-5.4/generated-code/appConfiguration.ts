import {
  AppConfigurationClient,
  featureFlagContentType,
  type FeatureFlagValue,
} from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

const connectionString = process.env.AZURE_APP_CONFIGURATION_CONNECTION_STRING;

if (!connectionString) {
  throw new Error(
    "Set AZURE_APP_CONFIGURATION_CONNECTION_STRING before running this example.",
  );
}

const client = new AppConfigurationClient(connectionString);
const key = "app:Settings:FontSize";
const productionLabel = "Production";

async function main(): Promise<void> {
  try {
    await client.setConfigurationSetting({
      key,
      value: "24",
    });

    await client.setConfigurationSetting({
      key,
      label: productionLabel,
      value: "24",
    });

    const setting = await client.getConfigurationSetting({ key });
    console.log(`Value for "${key}": ${setting.value ?? "<no value>"}`);

    console.log('Settings matching "app:Settings:*":');
    for await (const item of client.listConfigurationSettings({
      keyFilter: "app:Settings:*",
    })) {
      const label = item.label ? ` [${item.label}]` : "";
      console.log(`- ${item.key}${label} = ${item.value ?? "<no value>"}`);
    }

    const betaFeatureFlag: FeatureFlagValue = {
      enabled: true,
      description: "Enables the beta feature experience.",
      conditions: {
        clientFilters: [],
      },
    };

    await client.setConfigurationSetting({
      key: "BetaFeature",
      contentType: featureFlagContentType,
      value: betaFeatureFlag,
    });

    console.log('Created feature flag "BetaFeature".');

    await client.deleteConfigurationSetting({ key });
    console.log(`Deleted setting "${key}".`);
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(`Azure App Configuration request failed: ${error.message}`);

      if (error.statusCode !== undefined) {
        console.error(`Status code: ${error.statusCode}`);
      }
    } else if (error instanceof Error) {
      console.error(`Unexpected error: ${error.message}`);
    } else {
      console.error("Unexpected non-Error failure:", error);
    }

    process.exitCode = 1;
  }
}

void main();
