# Azure App Configuration TypeScript Demo

This TypeScript program demonstrates comprehensive Azure App Configuration operations.

## Features Demonstrated

1. **Create AppConfigurationClient** - Initialize client with connection string
2. **Set Configuration** - Add settings with keys and values
3. **Labeled Settings** - Create settings with labels (e.g., "Production")
4. **Get Configuration** - Retrieve settings by key
5. **List Settings** - Query settings with key filters
6. **Feature Flags** - Create and manage feature flags
7. **Delete Settings** - Remove configuration settings
8. **Error Handling** - Proper RestError handling with specific error codes

## Prerequisites

- Node.js 16+ and npm
- Azure subscription
- Azure App Configuration resource
- Connection string from Azure App Configuration

## Installation

```bash
npm install
```

This installs:
- `@azure/app-configuration` - Azure App Configuration client library
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution engine

## Configuration

Set your Azure App Configuration connection string as an environment variable:

### Windows (PowerShell)
```powershell
$env:AZURE_APP_CONFIG_CONNECTION_STRING="Endpoint=https://your-app-config.azconfig.io;Id=xxxxx;Secret=xxxxx"
```

### Windows (Command Prompt)
```cmd
set AZURE_APP_CONFIG_CONNECTION_STRING=Endpoint=https://your-app-config.azconfig.io;Id=xxxxx;Secret=xxxxx
```

### Linux/Mac
```bash
export AZURE_APP_CONFIG_CONNECTION_STRING="Endpoint=https://your-app-config.azconfig.io;Id=xxxxx;Secret=xxxxx"
```

## Usage

Run with ts-node:
```bash
npm start
```

Or compile and run:
```bash
npx tsc app-config-demo.ts
node app-config-demo.js
```

## Expected Output

```
Creating AppConfigurationClient...
✓ Client created successfully

Setting configuration: app:Settings:FontSize = 24
✓ Setting created: app:Settings:FontSize = 24

Setting configuration with Production label...
✓ Production setting created: app:Settings:FontSize = 20 (label: Production)

Getting configuration setting by key...
✓ Retrieved setting: app:Settings:FontSize = 24
  - Content Type: N/A
  - Label: (no label)
  - ETag: ...

Listing all settings matching 'app:Settings:*'...
  1. app:Settings:FontSize = 24
  2. app:Settings:FontSize = 20 (label: Production)
✓ Found 2 setting(s)

Creating feature flag for 'BetaFeature'...
✓ Feature flag created: .appconfig.featureflag/BetaFeature
  - Enabled: true

Getting feature flag...
✓ Retrieved feature flag: BetaFeature
  - Description: Beta features for early access
  - Enabled: true

Deleting configuration setting: app:Settings:FontSize
✓ Setting deleted (no label)

Deleting configuration setting with Production label...
✓ Production setting deleted

Deleting feature flag...
✓ Feature flag deleted

All operations completed successfully!
```

## Error Handling

The program includes comprehensive error handling for:
- **401 Unauthorized** - Authentication failures
- **404 Not Found** - Missing configuration settings
- **409 Conflict** - Concurrent modification conflicts
- **429 Too Many Requests** - Rate limiting
- General RestError cases with detailed logging

## Key Concepts

### Configuration Settings
Standard key-value pairs with optional labels for environment-specific values.

### Labels
Used to differentiate settings across environments (e.g., "Production", "Development").

### Feature Flags
Special configuration settings with the key prefix `.appconfig.featureflag/` and specific JSON structure.

### Key Filters
Use wildcards to query multiple settings (e.g., `app:Settings:*`).

## Learn More

- [Azure App Configuration Documentation](https://docs.microsoft.com/azure/azure-app-configuration/)
- [@azure/app-configuration npm package](https://www.npmjs.com/package/@azure/app-configuration)
- [Azure App Configuration SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/appconfiguration/app-configuration)
