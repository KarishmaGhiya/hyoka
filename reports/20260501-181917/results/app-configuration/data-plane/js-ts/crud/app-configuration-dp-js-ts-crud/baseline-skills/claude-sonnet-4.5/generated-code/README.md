# Azure App Configuration TypeScript Demo

This program demonstrates how to manage configuration settings in Azure App Configuration using the `@azure/app-configuration` SDK.

## Features Demonstrated

1. ✅ Create an AppConfigurationClient using a connection string
2. ✅ Set a configuration setting with key "app:Settings:FontSize" and value "24"
3. ✅ Set a setting with label "Production"
4. ✅ Get the setting by key and print its value
5. ✅ List all settings matching the key filter "app:Settings:*"
6. ✅ Create a feature flag configuration setting for "BetaFeature"
7. ✅ Delete the setting by key
8. ✅ Proper error handling with RestError

## Prerequisites

- Node.js 16+ and npm
- An Azure App Configuration resource
- Connection string for your App Configuration store

## Installation

```bash
npm install
```

## Configuration

Set the environment variable with your App Configuration connection string:

### Windows (PowerShell)
```powershell
$env:AZURE_APPCONFIG_CONNECTION_STRING="Endpoint=https://your-resource.azconfig.io;Id=xxx;Secret=xxx"
```

### Windows (Command Prompt)
```cmd
set AZURE_APPCONFIG_CONNECTION_STRING=Endpoint=https://your-resource.azconfig.io;Id=xxx;Secret=xxx
```

### Linux/macOS
```bash
export AZURE_APPCONFIG_CONNECTION_STRING="Endpoint=https://your-resource.azconfig.io;Id=xxx;Secret=xxx"
```

You can find your connection string in the Azure Portal:
1. Navigate to your App Configuration resource
2. Go to "Access keys" under Settings
3. Copy the "Connection string" value

## Running the Program

```bash
npm start
```

Or with TypeScript directly:
```bash
npx ts-node index.ts
```

## Expected Output

```
Creating AppConfigurationClient...

Setting configuration: app:Settings:FontSize = 24
✓ Created setting with etag: ...

Setting configuration with label "Production"
✓ Created production setting with etag: ...

Getting setting by key: app:Settings:FontSize
✓ Retrieved value: 24
  Label: (no label)
  Content Type: text/plain

Getting setting with label "Production"
✓ Retrieved production value: 24
  Label: Production
  Tags: {"environment":"prod"}

Adding additional settings for demonstration...
✓ Additional settings created

Listing all settings matching "app:Settings:*"
  1. Key: app:Settings:FontSize, Value: 24, Label: (no label)
  2. Key: app:Settings:FontSize, Value: 24, Label: Production
  3. Key: app:Settings:Language, Value: en-US, Label: (no label)
  4. Key: app:Settings:Theme, Value: Dark, Label: (no label)
✓ Found 4 settings

Creating feature flag: BetaFeature
✓ Feature flag created: .appconfig.featureflag/BetaFeature
  Enabled: true
  Description: Beta feature for testing new functionality
  Filters: [{"name":"Microsoft.Percentage","parameters":{"Value":50}}]

Listing all feature flags:
  Feature: .appconfig.featureflag/BetaFeature
  Enabled: true

Deleting settings...
✓ Deleted: app:Settings:FontSize (no label)
✓ Deleted: app:Settings:FontSize (Production label)
✓ Deleted additional demo settings
✓ Deleted feature flag: BetaFeature

Verifying deletion...
✓ Setting successfully deleted (404 Not Found)

All operations completed successfully!
```

## Key Concepts

### Connection String Authentication
```typescript
const client = new AppConfigurationClient(connectionString);
```

### Setting Configuration Values
```typescript
await client.setConfigurationSetting({
  key: "app:Settings:FontSize",
  value: "24",
  label: "Production",  // Optional
  tags: { environment: "prod" },  // Optional
});
```

### Getting Configuration Values
```typescript
const setting = await client.getConfigurationSetting({
  key: "app:Settings:FontSize",
  label: "Production",  // Optional
});
```

### Listing with Filters
```typescript
const settings = client.listConfigurationSettings({
  keyFilter: "app:Settings:*",
  labelFilter: "Production",  // Optional
});

for await (const setting of settings) {
  console.log(`${setting.key}: ${setting.value}`);
}
```

### Feature Flags
```typescript
const featureFlag: ConfigurationSetting<FeatureFlagValue> = {
  key: `${featureFlagPrefix}BetaFeature`,
  contentType: featureFlagContentType,
  value: {
    id: "BetaFeature",
    enabled: true,
    conditions: { clientFilters: [...] },
  },
};
```

### Error Handling
```typescript
try {
  // Operations
} catch (error) {
  if (error instanceof RestError) {
    console.error(`Status: ${error.statusCode}`);
    console.error(`Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
  }
}
```

## Dependencies

- **@azure/app-configuration** (^1.7.1): Azure App Configuration client library
- **@azure/identity** (^4.5.0): Azure authentication library
- **@azure/core-rest-pipeline**: Provides RestError type for error handling

## License

MIT
