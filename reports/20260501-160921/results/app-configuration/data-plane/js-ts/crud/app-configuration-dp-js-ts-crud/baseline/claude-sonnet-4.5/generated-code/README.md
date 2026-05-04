# Azure App Configuration - TypeScript Demo

This program demonstrates CRUD operations with Azure App Configuration using TypeScript.

## Features Demonstrated

1. ✅ Create AppConfigurationClient with connection string
2. ✅ Set configuration settings
3. ✅ Set settings with labels (e.g., "Production")
4. ✅ Get settings by key
5. ✅ List settings with key filters
6. ✅ Create feature flags
7. ✅ Delete settings
8. ✅ Proper error handling with RestError

## Prerequisites

- Node.js 16+ and npm
- Azure subscription
- Azure App Configuration resource

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create an Azure App Configuration resource:**
   - Go to Azure Portal
   - Create a new App Configuration resource
   - Copy the connection string from "Access keys" section

3. **Set environment variable:**
   ```bash
   # Windows (PowerShell)
   $env:AZURE_APP_CONFIG_CONNECTION_STRING="your-connection-string"

   # Linux/Mac
   export AZURE_APP_CONFIG_CONNECTION_STRING="your-connection-string"
   ```

## Running the Program

```bash
# Build TypeScript
npm run build

# Run compiled JavaScript
npm start

# Or run directly with ts-node
npm run dev
```

## Expected Output

```
1. Creating AppConfigurationClient...
✓ Client created successfully

2. Setting configuration: app:Settings:FontSize = 24
✓ Configuration setting created

3. Setting configuration with label 'Production'
✓ Production setting created

4. Getting setting by key: app:Settings:FontSize
✓ Retrieved value: 24
  Key: app:Settings:FontSize
  Label: (no label)
  Content Type: (none)

5. Listing all settings with key filter 'app:Settings:*'
  [1] app:Settings:FontSize = 24
  [2] app:Settings:BackgroundColor = Blue (label: Production)
✓ Found 2 setting(s)

6. Creating feature flag: BetaFeature
✓ Feature flag created
  ID: BetaFeature
  Enabled: true

7. Deleting setting: app:Settings:FontSize
✓ Setting deleted

Cleanup: Deleting remaining test settings...
✓ All test settings cleaned up

=== All operations completed successfully! ===
```

## Key Concepts

### Configuration Settings
- **Key**: Unique identifier (e.g., "app:Settings:FontSize")
- **Value**: The setting value
- **Label**: Optional label for different environments (e.g., "Production", "Development")
- **Content Type**: Optional MIME type

### Feature Flags
- Special configuration settings with key prefix `.appconfig.featureflag/`
- Content type: `application/vnd.microsoft.appconfig.ff+json;charset=utf-8`
- Used for feature toggles

### Error Handling
The program uses `RestError` from `@azure/app-configuration` to handle HTTP errors:
- **401**: Authentication failed - check connection string
- **403**: Authorization failed - check permissions
- **404**: Resource not found

## Package Information

**Required NPM Package:** `@azure/app-configuration` (version 1.7.1 or later)

This package provides:
- `AppConfigurationClient` - Main client for App Configuration operations
- `ConfigurationSetting` - Type for configuration settings
- `FeatureFlagValue` - Type for feature flags
- `RestError` - Error type for REST API errors
