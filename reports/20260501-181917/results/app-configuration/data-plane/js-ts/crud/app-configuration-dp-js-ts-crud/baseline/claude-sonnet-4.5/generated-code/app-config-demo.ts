import { AppConfigurationClient, RestError } from "@azure/app-configuration";

/**
 * Demonstrates Azure App Configuration operations including:
 * - Setting configuration values
 * - Getting configuration values
 * - Listing configurations with filters
 * - Creating feature flags
 * - Deleting configurations
 */
async function manageAppConfiguration() {
  // Connection string should be stored securely (e.g., environment variable)
  const connectionString = process.env.AZURE_APP_CONFIG_CONNECTION_STRING;

  if (!connectionString) {
    console.error("Error: AZURE_APP_CONFIG_CONNECTION_STRING environment variable is not set");
    process.exit(1);
  }

  try {
    // 1. Create an AppConfigurationClient using connection string
    console.log("Creating AppConfigurationClient...");
    const client = new AppConfigurationClient(connectionString);
    console.log("✓ Client created successfully\n");

    // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
    console.log("Setting configuration: app:Settings:FontSize = 24");
    const fontSizeSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "24"
    });
    console.log(`✓ Setting created: ${fontSizeSetting.key} = ${fontSizeSetting.value}\n`);

    // 3. Set a setting with label "Production"
    console.log("Setting configuration with Production label...");
    const prodSetting = await client.setConfigurationSetting({
      key: "app:Settings:FontSize",
      value: "20",
      label: "Production"
    });
    console.log(`✓ Production setting created: ${prodSetting.key} = ${prodSetting.value} (label: ${prodSetting.label})\n`);

    // 4. Get the setting by key and print its value
    console.log("Getting configuration setting by key...");
    const retrievedSetting = await client.getConfigurationSetting({
      key: "app:Settings:FontSize"
    });
    console.log(`✓ Retrieved setting: ${retrievedSetting.key} = ${retrievedSetting.value}`);
    console.log(`  - Content Type: ${retrievedSetting.contentType || "N/A"}`);
    console.log(`  - Label: ${retrievedSetting.label || "(no label)"}`);
    console.log(`  - ETag: ${retrievedSetting.etag}\n`);

    // 5. List all settings matching the key filter "app:Settings:*"
    console.log("Listing all settings matching 'app:Settings:*'...");
    const settingsList = client.listConfigurationSettings({
      keyFilter: "app:Settings:*"
    });

    let count = 0;
    for await (const setting of settingsList) {
      count++;
      console.log(`  ${count}. ${setting.key} = ${setting.value} ${setting.label ? `(label: ${setting.label})` : ""}`);
    }
    console.log(`✓ Found ${count} setting(s)\n`);

    // 6. Create a feature flag configuration setting for "BetaFeature"
    console.log("Creating feature flag for 'BetaFeature'...");
    const featureFlag = await client.setConfigurationSetting({
      key: ".appconfig.featureflag/BetaFeature",
      value: JSON.stringify({
        id: "BetaFeature",
        description: "Beta features for early access",
        enabled: true,
        conditions: {
          client_filters: []
        }
      }),
      contentType: "application/vnd.microsoft.appconfig.ff+json;charset=utf-8"
    });
    console.log(`✓ Feature flag created: ${featureFlag.key}`);
    console.log(`  - Enabled: ${JSON.parse(featureFlag.value || "{}").enabled}\n`);

    // Additional: Get the feature flag
    console.log("Getting feature flag...");
    const retrievedFeatureFlag = await client.getConfigurationSetting({
      key: ".appconfig.featureflag/BetaFeature"
    });
    const featureFlagValue = JSON.parse(retrievedFeatureFlag.value || "{}");
    console.log(`✓ Retrieved feature flag: ${featureFlagValue.id}`);
    console.log(`  - Description: ${featureFlagValue.description}`);
    console.log(`  - Enabled: ${featureFlagValue.enabled}\n`);

    // 7. Delete the setting by key
    console.log("Deleting configuration setting: app:Settings:FontSize");
    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize"
    });
    console.log("✓ Setting deleted (no label)\n");

    // Delete the production labeled setting
    console.log("Deleting configuration setting with Production label...");
    await client.deleteConfigurationSetting({
      key: "app:Settings:FontSize",
      label: "Production"
    });
    console.log("✓ Production setting deleted\n");

    // Delete the feature flag
    console.log("Deleting feature flag...");
    await client.deleteConfigurationSetting({
      key: ".appconfig.featureflag/BetaFeature"
    });
    console.log("✓ Feature flag deleted\n");

    console.log("All operations completed successfully!");

  } catch (error) {
    // Proper error handling with RestError
    if (error instanceof RestError) {
      console.error("\n❌ Azure App Configuration Error:");
      console.error(`  - Status Code: ${error.statusCode}`);
      console.error(`  - Error Code: ${error.code}`);
      console.error(`  - Message: ${error.message}`);
      console.error(`  - Request ID: ${error.request?.requestId || "N/A"}`);
      
      // Handle specific error cases
      if (error.statusCode === 401) {
        console.error("\n  → Authentication failed. Check your connection string.");
      } else if (error.statusCode === 404) {
        console.error("\n  → Configuration setting not found.");
      } else if (error.statusCode === 409) {
        console.error("\n  → Conflict - setting already exists or has been modified.");
      } else if (error.statusCode === 429) {
        console.error("\n  → Too many requests. Rate limit exceeded.");
      }
    } else if (error instanceof Error) {
      console.error("\n❌ Unexpected Error:");
      console.error(`  - Message: ${error.message}`);
      console.error(`  - Stack: ${error.stack}`);
    } else {
      console.error("\n❌ Unknown Error:", error);
    }
    
    process.exit(1);
  }
}

// Run the demo
manageAppConfiguration();
