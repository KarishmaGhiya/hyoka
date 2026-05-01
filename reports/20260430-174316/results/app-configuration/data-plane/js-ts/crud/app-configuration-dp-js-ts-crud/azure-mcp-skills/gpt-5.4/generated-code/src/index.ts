import {
  AppConfigurationClient,
  type ConfigurationSettingId,
  type FeatureFlagValue,
} from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

const connectionString = process.env.AZURE_APPCONFIG_CONNECTION_STRING;

const fontSizeKey = "app:Settings:FontSize";
const productionLabel = "Production";
const betaFeatureKey = "BetaFeature";

function createClient(connectionStringValue: string | undefined): AppConfigurationClient {
  if (!connectionStringValue) {
    throw new Error(
      "Set AZURE_APPCONFIG_CONNECTION_STRING before running this sample.",
    );
  }

  return new AppConfigurationClient(connectionStringValue);
}

function logRestError(error: RestError): void {
  console.error("Azure App Configuration request failed.");
  console.error(`Status: ${error.statusCode ?? "unknown"}`);
  console.error(`Code: ${error.code ?? "unknown"}`);
  console.error(`Message: ${error.message}`);
}

async function deleteIfExists(
  client: AppConfigurationClient,
  settingId: ConfigurationSettingId,
): Promise<void> {
  try {
    await client.deleteConfigurationSetting(settingId);
  } catch (error: unknown) {
    if (error instanceof RestError && error.statusCode === 404) {
      return;
    }

    throw error;
  }
}

async function main(): Promise<void> {
  const client = createClient(connectionString);

  const featureFlag: FeatureFlagValue = {
    enabled: true,
    description: "Enables the BetaFeature experience.",
    conditions: {
      clientFilters: [],
    },
  };

  try {
    const defaultSetting = await client.setConfigurationSetting({
      key: fontSizeKey,
      value: "24",
    });
    console.log(`Set ${defaultSetting.key}=${defaultSetting.value}`);

    const productionSetting = await client.setConfigurationSetting({
      key: fontSizeKey,
      label: productionLabel,
      value: "24",
    });
    console.log(
      `Set ${productionSetting.key}=${productionSetting.value} with label ${productionSetting.label}`,
    );

    const retrievedSetting = await client.getConfigurationSetting({
      key: fontSizeKey,
    });
    console.log(`Retrieved value for ${fontSizeKey}: ${retrievedSetting.value}`);

    console.log(`Settings matching ${fontSizeKey.replace("FontSize", "*")}:`);
    for await (const setting of client.listConfigurationSettings({
      keyFilter: "app:Settings:*",
    })) {
      console.log(
        `- key=${setting.key}, label=${setting.label ?? "(none)"}, value=${setting.value ?? "(null)"}`,
      );
    }

    const createdFeatureFlag = await client.setConfigurationSetting({
      key: betaFeatureKey,
      value: featureFlag,
    });
    console.log(`Created feature flag ${createdFeatureFlag.key}`);

    await client.deleteConfigurationSetting({ key: fontSizeKey });
    console.log(`Deleted setting ${fontSizeKey}`);

    await deleteIfExists(client, { key: fontSizeKey, label: productionLabel });
    await deleteIfExists(client, { key: createdFeatureFlag.key });
  } catch (error: unknown) {
    if (error instanceof RestError) {
      logRestError(error);
      return;
    }

    throw error;
  }
}

main().catch((error: unknown) => {
  if (error instanceof RestError) {
    logRestError(error);
    process.exitCode = 1;
    return;
  }

  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error("An unknown error occurred.");
  }

  process.exitCode = 1;
});
