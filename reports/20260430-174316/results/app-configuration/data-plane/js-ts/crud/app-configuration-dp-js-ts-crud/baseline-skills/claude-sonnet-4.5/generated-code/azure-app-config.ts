import { 
    AppConfigurationClient, 
    ConfigurationSetting,
    FeatureFlagValue,
    RestError 
} from "@azure/app-configuration";

/**
 * Azure App Configuration Management Demo
 * Demonstrates CRUD operations, filtering, and feature flags
 */
async function manageAppConfiguration(): Promise<void> {
    // Connection string from environment variable or replace with your connection string
    const connectionString = process.env.AZURE_APP_CONFIG_CONNECTION_STRING || 
        "Endpoint=https://your-app-config.azconfig.io;Id=xxxxx;Secret=xxxxx";

    try {
        // 1. Create an AppConfigurationClient using connection string
        console.log("1. Creating AppConfigurationClient...");
        const client = new AppConfigurationClient(connectionString);
        console.log("✓ Client created successfully\n");

        // 2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
        console.log("2. Setting configuration: app:Settings:FontSize = 24");
        const fontSizeSetting = await client.setConfigurationSetting({
            key: "app:Settings:FontSize",
            value: "24"
        });
        console.log(`✓ Setting created: ${fontSizeSetting.key} = ${fontSizeSetting.value}`);
        console.log(`  ETag: ${fontSizeSetting.etag}\n`);

        // 3. Set a setting with label "Production"
        console.log("3. Setting configuration with label 'Production'");
        const prodSetting = await client.setConfigurationSetting({
            key: "app:Settings:FontSize",
            value: "18",
            label: "Production"
        });
        console.log(`✓ Setting created: ${prodSetting.key} (${prodSetting.label}) = ${prodSetting.value}\n`);

        // Set additional settings for filtering demonstration
        console.log("Setting additional configuration values for filtering...");
        await client.setConfigurationSetting({
            key: "app:Settings:BackgroundColor",
            value: "blue"
        });
        await client.setConfigurationSetting({
            key: "app:Settings:Theme",
            value: "dark"
        });
        console.log("✓ Additional settings created\n");

        // 4. Get the setting by key and print its value
        console.log("4. Getting setting by key: app:Settings:FontSize");
        const retrievedSetting = await client.getConfigurationSetting({
            key: "app:Settings:FontSize"
        });
        console.log(`✓ Retrieved setting:`);
        console.log(`  Key: ${retrievedSetting.key}`);
        console.log(`  Value: ${retrievedSetting.value}`);
        console.log(`  Label: ${retrievedSetting.label || "(no label)"}`);
        console.log(`  Content Type: ${retrievedSetting.contentType || "(none)"}`);
        console.log(`  Last Modified: ${retrievedSetting.lastModified}\n`);

        // 5. List all settings matching the key filter "app:Settings:*"
        console.log("5. Listing all settings matching 'app:Settings:*'");
        const settings: ConfigurationSetting[] = [];
        const settingsIterator = client.listConfigurationSettings({
            keyFilter: "app:Settings:*"
        });

        for await (const setting of settingsIterator) {
            settings.push(setting);
            console.log(`  - ${setting.key}${setting.label ? ` [${setting.label}]` : ""} = ${setting.value}`);
        }
        console.log(`✓ Found ${settings.length} settings\n`);

        // 6. Create a feature flag configuration setting for "BetaFeature"
        console.log("6. Creating feature flag: BetaFeature");
        
        const featureFlagValue: FeatureFlagValue = {
            id: "BetaFeature",
            description: "Beta feature for testing new functionality",
            enabled: true,
            conditions: {
                clientFilters: [
                    {
                        name: "Microsoft.Percentage",
                        parameters: {
                            Value: 50
                        }
                    }
                ]
            }
        };

        const featureFlag = await client.setConfigurationSetting({
            key: ".appconfig.featureflag/BetaFeature",
            value: JSON.stringify(featureFlagValue),
            contentType: "application/vnd.microsoft.appconfig.ff+json;charset=utf-8"
        });
        
        console.log(`✓ Feature flag created: ${featureFlag.key}`);
        console.log(`  Enabled: ${JSON.parse(featureFlag.value!).enabled}`);
        console.log(`  Description: ${JSON.parse(featureFlag.value!).description}\n`);

        // List all feature flags
        console.log("Listing all feature flags:");
        const featureFlagsIterator = client.listConfigurationSettings({
            keyFilter: ".appconfig.featureflag/*"
        });

        for await (const flag of featureFlagsIterator) {
            const flagValue = JSON.parse(flag.value!);
            console.log(`  - ${flagValue.id}: ${flagValue.enabled ? "ENABLED" : "DISABLED"}`);
        }
        console.log();

        // 7. Delete the setting by key
        console.log("7. Deleting setting: app:Settings:FontSize");
        await client.deleteConfigurationSetting({
            key: "app:Settings:FontSize"
        });
        console.log("✓ Setting deleted (no label)\n");

        // Delete the Production labeled setting
        console.log("Deleting setting with Production label...");
        await client.deleteConfigurationSetting({
            key: "app:Settings:FontSize",
            label: "Production"
        });
        console.log("✓ Setting deleted (Production label)\n");

        // Cleanup: Delete other settings
        console.log("Cleaning up remaining test settings...");
        await client.deleteConfigurationSetting({ key: "app:Settings:BackgroundColor" });
        await client.deleteConfigurationSetting({ key: "app:Settings:Theme" });
        await client.deleteConfigurationSetting({ key: ".appconfig.featureflag/BetaFeature" });
        console.log("✓ Cleanup complete\n");

        console.log("=== All operations completed successfully ===");

    } catch (error) {
        // Proper error handling with RestError
        if (error instanceof RestError) {
            console.error("❌ Azure App Configuration Error:");
            console.error(`  Status Code: ${error.statusCode}`);
            console.error(`  Error Code: ${error.code}`);
            console.error(`  Message: ${error.message}`);
            
            // Handle specific error codes
            switch (error.statusCode) {
                case 401:
                    console.error("\n💡 Authentication failed. Check your connection string.");
                    break;
                case 403:
                    console.error("\n💡 Access denied. Check your permissions.");
                    break;
                case 404:
                    console.error("\n💡 Configuration setting not found.");
                    break;
                case 409:
                    console.error("\n💡 Conflict. The setting may have been modified.");
                    break;
                case 429:
                    console.error("\n💡 Too many requests. Rate limit exceeded.");
                    break;
                default:
                    console.error(`\n💡 An error occurred with status code ${error.statusCode}`);
            }
            
            if (error.request) {
                console.error(`  Request URL: ${error.request.url}`);
            }
        } else if (error instanceof Error) {
            console.error("❌ Error:", error.message);
            console.error(error.stack);
        } else {
            console.error("❌ Unknown error:", error);
        }
        
        process.exit(1);
    }
}

// Additional helper function to demonstrate conditional updates with ETag
async function conditionalUpdate(): Promise<void> {
    const connectionString = process.env.AZURE_APP_CONFIG_CONNECTION_STRING || 
        "Endpoint=https://your-app-config.azconfig.io;Id=xxxxx;Secret=xxxxx";
    
    try {
        const client = new AppConfigurationClient(connectionString);
        
        // Set initial value
        const setting = await client.setConfigurationSetting({
            key: "app:Settings:ApiTimeout",
            value: "30"
        });
        
        console.log("\nConditional Update Example:");
        console.log(`Initial value: ${setting.value}, ETag: ${setting.etag}`);
        
        // Update only if ETag matches (optimistic concurrency)
        const updated = await client.setConfigurationSetting(
            {
                key: "app:Settings:ApiTimeout",
                value: "60"
            },
            {
                onlyIfUnchanged: true,
                etag: setting.etag
            }
        );
        
        console.log(`✓ Conditional update successful: ${updated.value}`);
        
        // Cleanup
        await client.deleteConfigurationSetting({ key: "app:Settings:ApiTimeout" });
        
    } catch (error) {
        if (error instanceof RestError && error.statusCode === 412) {
            console.error("❌ Precondition failed: Setting was modified by another process");
        } else {
            throw error;
        }
    }
}

// Run the main demo
console.log("=== Azure App Configuration Demo ===\n");
manageAppConfiguration()
    .then(() => {
        console.log("\nRunning conditional update example...");
        return conditionalUpdate();
    })
    .then(() => {
        console.log("\n✓ All demos completed successfully");
    })
    .catch(error => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
