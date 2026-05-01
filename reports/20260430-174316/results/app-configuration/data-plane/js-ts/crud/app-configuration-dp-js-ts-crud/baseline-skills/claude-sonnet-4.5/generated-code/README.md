# Azure App Configuration Demo

A comprehensive TypeScript example demonstrating Azure App Configuration operations.

## Features Demonstrated

1. **Client Creation**: Initialize AppConfigurationClient with connection string
2. **Set Configuration**: Create settings with keys and values
3. **Labels**: Set settings with labels (e.g., "Production", "Development")
4. **Get Configuration**: Retrieve settings by key
5. **List Settings**: Filter and list settings using key patterns
6. **Feature Flags**: Create and manage feature flags with conditions
7. **Delete Settings**: Remove configuration settings
8. **Error Handling**: Proper RestError handling with specific status codes

## Prerequisites

- Node.js (v16 or higher)
- Azure subscription
- Azure App Configuration resource

## Installation

```bash
npm install
```

## Configuration

Set your Azure App Configuration connection string as an environment variable:

```bash
# Windows (PowerShell)
$env:AZURE_APP_CONFIG_CONNECTION_STRING="Endpoint=https://your-app-config.azconfig.io;Id=xxxxx;Secret=xxxxx"

# Windows (CMD)
set AZURE_APP_CONFIG_CONNECTION_STRING=Endpoint=https://your-app-config.azconfig.io;Id=xxxxx;Secret=xxxxx

# Linux/macOS
export AZURE_APP_CONFIG_CONNECTION_STRING="Endpoint=https://your-app-config.azconfig.io;Id=xxxxx;Secret=xxxxx"
```

Or modify the connection string directly in the code (not recommended for production).

## Usage

### Run with ts-node (development):
```bash
npm run dev
```

### Build and run (production):
```bash
npm run build
npm start
```

## Key Operations

### Creating a Client
```typescript
const client = new AppConfigurationClient(connectionString);
```

### Setting Configuration
```typescript
await client.setConfigurationSetting({
    key: "app:Settings:FontSize",
    value: "24"
});
```

### Setting with Label
```typescript
await client.setConfigurationSetting({
    key: "app:Settings:FontSize",
    value: "18",
    label: "Production"
});
```

### Getting Configuration
```typescript
const setting = await client.getConfigurationSetting({
    key: "app:Settings:FontSize"
});
```

### Listing Settings
```typescript
const settingsIterator = client.listConfigurationSettings({
    keyFilter: "app:Settings:*"
});

for await (const setting of settingsIterator) {
    console.log(`${setting.key} = ${setting.value}`);
}
```

### Feature Flags
```typescript
const featureFlagValue: FeatureFlagValue = {
    id: "BetaFeature",
    enabled: true,
    conditions: { clientFilters: [...] }
};

await client.setConfigurationSetting({
    key: ".appconfig.featureflag/BetaFeature",
    value: JSON.stringify(featureFlagValue),
    contentType: "application/vnd.microsoft.appconfig.ff+json;charset=utf-8"
});
```

### Deleting Settings
```typescript
await client.deleteConfigurationSetting({
    key: "app:Settings:FontSize"
});
```

## Error Handling

The code demonstrates proper error handling with RestError:

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

### Common Status Codes
- **401**: Authentication failed
- **403**: Access denied
- **404**: Configuration not found
- **409**: Conflict (concurrent modification)
- **412**: Precondition failed (ETag mismatch)
- **429**: Rate limit exceeded

## Package

- **@azure/app-configuration**: Official Azure SDK for App Configuration (v1.6.1+)

## Learn More

- [Azure App Configuration Documentation](https://docs.microsoft.com/azure/azure-app-configuration/)
- [SDK Reference](https://docs.microsoft.com/javascript/api/@azure/app-configuration/)
- [Feature Management](https://docs.microsoft.com/azure/azure-app-configuration/concept-feature-management)
