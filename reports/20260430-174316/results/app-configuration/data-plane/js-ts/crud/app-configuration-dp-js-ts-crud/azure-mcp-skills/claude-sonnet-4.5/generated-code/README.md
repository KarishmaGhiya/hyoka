# Azure App Configuration TypeScript Demo

A comprehensive TypeScript program demonstrating CRUD operations with Azure App Configuration.

## Features

This demo showcases:
1. ✅ Creating an `AppConfigurationClient` using a connection string
2. ✅ Setting configuration settings with keys and values
3. ✅ Setting configuration settings with labels (e.g., "Production")
4. ✅ Getting configuration settings by key
5. ✅ Listing configuration settings with key filters
6. ✅ Creating feature flag configuration settings
7. ✅ Deleting configuration settings
8. ✅ Proper error handling with `RestError`

## Prerequisites

- Node.js (v16 or higher)
- Azure subscription
- Azure App Configuration resource

## Installation

Install the required npm package:

```bash
npm install @azure/app-configuration
```

Or install all dependencies:

```bash
npm install
```

## Configuration

Set your Azure App Configuration connection string as an environment variable:

### Windows (PowerShell)
```powershell
$env:AZURE_APPCONFIG_CONNECTION_STRING="Endpoint=https://your-config-store.azconfig.io;Id=xxxxx;Secret=xxxxx"
```

### Windows (Command Prompt)
```cmd
set AZURE_APPCONFIG_CONNECTION_STRING=Endpoint=https://your-config-store.azconfig.io;Id=xxxxx;Secret=xxxxx
```

### Linux/macOS
```bash
export AZURE_APPCONFIG_CONNECTION_STRING="Endpoint=https://your-config-store.azconfig.io;Id=xxxxx;Secret=xxxxx"
```

You can find your connection string in the Azure Portal:
1. Navigate to your App Configuration resource
2. Go to "Access keys" under Settings
3. Copy the "Connection string" (either primary or secondary)

## Running the Demo

### Using ts-node
```bash
npm start
```

### Using TypeScript compiler
```bash
npm run build
node dist/azure-app-configuration-demo.js
```

### Development mode (auto-restart)
```bash
npm run dev
```

## Code Structure

The demo performs the following operations in sequence:

### 1. Create AppConfigurationClient
```typescript
const client = new AppConfigurationClient(connectionString);
```

### 2. Set Configuration Settings
```typescript
await client.setConfigurationSetting({
  key: "app:Settings:FontSize",
  value: "24"
});
```

### 3. Set Settings with Labels
```typescript
await client.setConfigurationSetting({
  key: "app:Settings:FontSize",
  value: "28",
  label: "Production"
});
```

### 4. Get Settings
```typescript
const setting = await client.getConfigurationSetting({
  key: "app:Settings:FontSize"
});
```

### 5. List Settings with Filters
```typescript
const settingsIterator = client.listConfigurationSettings({
  keyFilter: "app:Settings:*"
});
```

### 6. Create Feature Flags
```typescript
const featureFlagValue: FeatureFlagValue = {
  id: "BetaFeature",
  enabled: true,
  description: "Beta feature toggle",
  conditions: { clientFilters: [] }
};
```

### 7. Delete Settings
```typescript
await client.deleteConfigurationSetting({
  key: "app:Settings:FontSize"
});
```

## Error Handling

The demo includes comprehensive error handling using `RestError`:

```typescript
try {
  // Operations...
} catch (error) {
  if (error instanceof RestError) {
    console.error(`Status Code: ${error.statusCode}`);
    console.error(`Error Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
  }
}
```

Common error codes:
- **401**: Authentication failed (invalid connection string)
- **403**: Forbidden (insufficient permissions)
- **404**: Resource not found
- **409**: Conflict (ETag mismatch)

## Package Information

**Required package**: `@azure/app-configuration`

Latest version: 1.7.1

Documentation: https://learn.microsoft.com/en-us/javascript/api/@azure/app-configuration

## Learn More

- [Azure App Configuration Documentation](https://learn.microsoft.com/en-us/azure/azure-app-configuration/)
- [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)
- [Feature Management](https://learn.microsoft.com/en-us/azure/azure-app-configuration/concept-feature-management)

## License

MIT
