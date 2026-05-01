# Azure App Configuration TypeScript Demo

This TypeScript program demonstrates CRUD operations with Azure App Configuration.

## Features

1. ✅ Create an AppConfigurationClient using a connection string
2. ✅ Set configuration settings with keys and values
3. ✅ Set settings with labels (e.g., "Production")
4. ✅ Get settings by key and display values
5. ✅ List settings with key filters
6. ✅ Create feature flag configuration settings
7. ✅ Delete settings by key
8. ✅ Proper error handling with RestError

## Prerequisites

- Node.js (v18 or later)
- An Azure App Configuration resource
- Connection string from your Azure App Configuration resource

## Installation

```bash
npm install
```

This will install the required dependency:
- `@azure/app-configuration` - Azure App Configuration client library

## Configuration

Set your Azure App Configuration connection string as an environment variable:

### Windows (PowerShell)
```powershell
$env:AZURE_APPCONFIG_CONNECTION_STRING="Endpoint=https://your-app-config.azconfig.io;Id=xxx;Secret=xxx"
```

### Windows (Command Prompt)
```cmd
set AZURE_APPCONFIG_CONNECTION_STRING=Endpoint=https://your-app-config.azconfig.io;Id=xxx;Secret=xxx
```

### Linux/macOS
```bash
export AZURE_APPCONFIG_CONNECTION_STRING="Endpoint=https://your-app-config.azconfig.io;Id=xxx;Secret=xxx"
```

## Usage

### Development Mode (with ts-node)
```bash
npm run dev
```

### Build and Run
```bash
npm run build
npm start
```

## What the Program Does

1. **Creates Client**: Initializes an AppConfigurationClient with your connection string
2. **Sets Configuration**: Creates `app:Settings:FontSize` with value "24"
3. **Sets Labeled Configuration**: Creates the same key with "Production" label and value "32"
4. **Retrieves Setting**: Gets the configuration by key and displays its properties
5. **Lists Settings**: Queries all settings matching `app:Settings:*` pattern
6. **Creates Feature Flag**: Adds a feature flag for "BetaFeature" with proper JSON structure
7. **Deletes Settings**: Removes all created settings including the feature flag

## Error Handling

The program includes comprehensive error handling for:
- Missing connection string
- Authentication errors (401)
- Not found errors (404)
- Rate limiting (429)
- Network issues
- RestError from Azure SDK

## Output Example

```
1. Creating AppConfigurationClient...
✓ Client created successfully

2. Setting configuration: app:Settings:FontSize = 24
✓ Set: app:Settings:FontSize = 24

3. Setting configuration with Production label: app:Settings:FontSize = 32
✓ Set: app:Settings:FontSize (label: Production) = 32

4. Getting configuration setting by key...
✓ Retrieved: app:Settings:FontSize = 24
  Label: (no label)
  Content Type: (none)
  ETag: "abc123..."

5. Listing all settings with key filter 'app:Settings:*'...
  [1] app:Settings:FontSize (label: (no label)) = 24
  [2] app:Settings:FontSize (label: Production) = 32
✓ Found 2 settings

6. Creating feature flag for 'BetaFeature'...
✓ Feature flag created: .appconfig.featureflag/BetaFeature
  Enabled: true

7. Deleting configuration settings...
✓ Deleted: app:Settings:FontSize (no label)
✓ Deleted: app:Settings:FontSize (Production label)
✓ Deleted: BetaFeature feature flag

✅ All operations completed successfully!
```

## Key Concepts

### Configuration Settings
- **Key**: Unique identifier (e.g., "app:Settings:FontSize")
- **Value**: The configuration value
- **Label**: Optional label for versioning (e.g., "Production", "Development")
- **Content Type**: MIME type of the value

### Feature Flags
- Special configuration settings with key prefix `.appconfig.featureflag/`
- Content type: `application/vnd.microsoft.appconfig.ff+json;charset=utf-8`
- Value is JSON with `id`, `enabled`, `conditions`, etc.

## License

MIT
