import { AppConfigurationClient, ConfigurationSetting } from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

async function main() {
    // Connection string should be stored securely (e.g., environment variable)
    const connectionString = process.env.AZURE_APPCONFIG_CONNECTION_STRING || 
        "<your-connection-string-here>";

    if (!connectionString || connectionString === "<your-connection-string-here>") {
        console.error("Please set AZURE_APPCONFIG_CONNECTION_STRING environment variable");
        process.exit(1);
    }

    try {
        // 1. Create an AppConfigurationClient using a connection string
        console.log("Creating AppConfigurationClient...");
        const client = new AppConfigurationClient(connectionString);

        // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
        console.log("\n--- Setting configuration: app:Settings:FontSize = 24 ---");
        const fontSizeSetting = await client.setConfigurationSetting({
            key: "app:Settings:FontSize",
            value: "24"
        });
        console.log(`Set: ${fontSizeSetting.key} = ${fontSizeSetting.value}`);

        // 3. Set a setting with label "Production"
        console.log("\n--- Setting configuration with Production label ---");
        const prodSetting = await client.setConfigurationSetting({
            key: "app:Settings:BackgroundColor",
            value: "Blue",
            label: "Production"
        });
        console.log(`Set: ${prodSetting.key} = ${prodSetting.value} (label: ${prodSetting.label})`);

        // 4. Get the setting by key and print its value
        console.log("\n--- Getting configuration by key ---");
        const retrievedSetting = await client.getConfigurationSetting({
            key: "app:Settings:FontSize"
        });
        console.log(`Retrieved: ${retrievedSetting.key} = ${retrievedSetting.value}`);

        // 5. List all settings matching the key filter "app:Settings:*"
        console.log("\n--- Listing all settings matching 'app:Settings:*' ---");
        const settingsIterator = client.listConfigurationSettings({
            keyFilter: "app:Settings:*"
        });

        for await (const setting of settingsIterator) {
            console.log(`  - ${setting.key} = ${setting.value}${setting.label ? ` (label: ${setting.label})` : ""}`);
        }

        // 6. Create a feature flag configuration setting for "BetaFeature"
        console.log("\n--- Creating feature flag for 'BetaFeature' ---");
        const featureFlagKey = ".appconfig.featureflag/BetaFeature";
        const featureFlagValue = JSON.stringify({
            id: "BetaFeature",
            enabled: true,
            conditions: {
                client_filters: []
            }
        });

        const featureFlag = await client.setConfigurationSetting({
            key: featureFlagKey,
            value: featureFlagValue,
            contentType: "application/vnd.microsoft.appconfig.ff+json;charset=utf-8"
        });
        console.log(`Created feature flag: ${featureFlag.key}`);
        console.log(`  Enabled: ${JSON.parse(featureFlag.value || "{}").enabled}`);

        // 7. Delete the setting by key
        console.log("\n--- Deleting configuration setting ---");
        const deletedSetting = await client.deleteConfigurationSetting({
            key: "app:Settings:FontSize"
        });
        console.log(`Deleted: ${deletedSetting.key}`);

        // Verify deletion
        console.log("\n--- Verifying deletion ---");
        try {
            await client.getConfigurationSetting({
                key: "app:Settings:FontSize"
            });
            console.log("Setting still exists (unexpected)");
        } catch (error) {
            if (error instanceof RestError && error.statusCode === 404) {
                console.log("Setting successfully deleted (404 Not Found)");
            } else {
                throw error;
            }
        }

        // Clean up other settings created during demo
        console.log("\n--- Cleaning up demo settings ---");
        await client.deleteConfigurationSetting({
            key: "app:Settings:BackgroundColor",
            label: "Production"
        });
        await client.deleteConfigurationSetting({
            key: featureFlagKey
        });
        console.log("Cleanup complete");

    } catch (error) {
        if (error instanceof RestError) {
            console.error(`REST Error occurred:`);
            console.error(`  Status Code: ${error.statusCode}`);
            console.error(`  Error Code: ${error.code}`);
            console.error(`  Message: ${error.message}`);
            console.error(`  Details: ${error.details?.error?.message || "N/A"}`);
        } else if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        } else {
            console.error(`Unknown error:`, error);
        }
        process.exit(1);
    }
}

main().catch((error) => {
    console.error("Unhandled error in main:", error);
    process.exit(1);
});
