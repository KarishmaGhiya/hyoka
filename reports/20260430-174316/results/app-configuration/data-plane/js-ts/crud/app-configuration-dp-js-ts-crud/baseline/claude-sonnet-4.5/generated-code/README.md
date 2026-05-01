# Azure App Configuration - TypeScript Demo

This TypeScript program demonstrates comprehensive Azure App Configuration operations.

## Features

✅ **Create AppConfigurationClient** - Initialize client with connection string  
✅ **Set Configuration Settings** - Create settings with keys and values  
✅ **Label Support** - Set settings with labels (e.g., "Production")  
✅ **Get Settings** - Retrieve configuration by key  
✅ **List Settings** - Filter settings using key patterns  
✅ **Feature Flags** - Create and manage feature flag configurations  
✅ **Delete Settings** - Remove configuration settings  
✅ **Error Handling** - Comprehensive RestError handling with specific status codes

## Prerequisites

- Node.js (v16 or higher)
- Azure App Configuration resource
- Connection string from Azure Portal

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variable:**
   ```bash
   # Windows (PowerShell)
   $env:AZURE_APP_CONFIG_CONNECTION_STRING="Endpoint=https://your-appconfig.azconfig.io;Id=xxx;Secret=xxx"

   # Windows (Command Prompt)
   set AZURE_APP_CONFIG_CONNECTION_STRING=Endpoint=https://your-appconfig.azconfig.io;Id=xxx;Secret=xxx

   # Linux/Mac
   export AZURE_APP_CONFIG_CONNECTION_STRING="Endpoint=https://your-appconfig.azconfig.io;Id=xxx;Secret=xxx"
   ```

   To get your connection string:
   - Go to Azure Portal
   - Navigate to your App Configuration resource
   - Select "Access keys" under Settings
   - Copy the connection string

## Running the Program

**Development mode (with ts-node):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## What the Program Does

1. **Creates Client** - Initializes AppConfigurationClient with connection string
2. **Sets FontSize Setting** - Creates `app:Settings:FontSize = "24"`
3. **Sets Labeled Setting** - Creates same key with "Production" label and value "28"
4. **Retrieves Setting** - Gets the setting and displays its properties
5. **Lists Settings** - Shows all settings matching `app:Settings:*` filter
6. **Creates Feature Flag** - Adds `BetaFeature` feature flag (enabled)
7. **Deletes All** - Cleans up by removing all created settings

## Error Handling

The program includes comprehensive error handling for:

- **401 Unauthorized** - Invalid connection string
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Resource already exists
- **429 Too Many Requests** - Rate limiting
- **RestError** - Azure-specific REST errors
- **General Errors** - Other runtime errors

## Required NPM Package

```json
{
  "dependencies": {
    "@azure/app-configuration": "^1.7.1"
  }
}
```

## Key Concepts

### Configuration Settings
Regular key-value pairs for application configuration:
```typescript
{
  key: "app:Settings:FontSize",
  value: "24",
  label: "Production"  // optional
}
```

### Feature Flags
Special configuration settings for feature management:
```typescript
{
  key: ".appconfig.featureflag/BetaFeature",
  value: JSON.stringify({
    id: "BetaFeature",
    enabled: true,
    conditions: { client_filters: [] }
  }),
  contentType: "application/vnd.microsoft.appconfig.ff+json;charset=utf-8"
}
```

### Labels
Use labels to maintain different values for the same key:
- `Production` - Production environment settings
- `Development` - Development environment settings
- `Staging` - Staging environment settings

## API Reference

- `setConfigurationSetting()` - Create or update a setting
- `getConfigurationSetting()` - Retrieve a specific setting
- `listConfigurationSettings()` - List settings with filters
- `deleteConfigurationSetting()` - Remove a setting

## License

MIT
