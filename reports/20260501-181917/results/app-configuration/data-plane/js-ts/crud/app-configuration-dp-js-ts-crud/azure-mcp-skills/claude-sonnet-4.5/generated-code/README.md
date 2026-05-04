# Azure App Configuration TypeScript Demo

This demo showcases how to use the Azure App Configuration SDK for JavaScript/TypeScript to manage configuration settings and feature flags.

## Features Demonstrated

1. ✅ Creating an `AppConfigurationClient` using a connection string
2. ✅ Setting configuration settings with key-value pairs
3. ✅ Using labels for environment-specific settings
4. ✅ Getting settings by key
5. ✅ Listing settings with key filters
6. ✅ Creating feature flag configuration settings
7. ✅ Deleting settings
8. ✅ Comprehensive error handling with `RestError`

## Prerequisites

- Node.js 18 or higher
- An Azure App Configuration resource
- Connection string from your App Configuration resource

## Installation

```bash
# Install dependencies
npm install
```

### Required Package

```bash
npm install @azure/app-configuration
```

## Configuration

Set your Azure App Configuration connection string as an environment variable:

### Windows (PowerShell)
```powershell
$env:AZURE_APPCONFIG_CONNECTION_STRING="Endpoint=https://<your-resource>.azconfig.io;Id=...;Secret=..."
```

### Windows (CMD)
```cmd
set AZURE_APPCONFIG_CONNECTION_STRING=Endpoint=https://<your-resource>.azconfig.io;Id=...;Secret=...
```

### Linux/macOS
```bash
export AZURE_APPCONFIG_CONNECTION_STRING="Endpoint=https://<your-resource>.azconfig.io;Id=...;Secret=..."
```

### Getting Your Connection String

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to your App Configuration resource
3. Go to **Settings** → **Access keys**
4. Copy a connection string (Read-only or Read-write)

## Running the Demo

### Using ts-node (Development)
```bash
npm run dev
```

### Using compiled JavaScript
```bash
npm run build
npm start
```

### Direct execution
```bash
npx ts-node app-configuration-demo.ts
```

## Expected Output

```
1. Creating AppConfigurationClient...
   ✓ Client created successfully

2. Setting configuration: key="app:Settings:FontSize", value="24"
   ✓ Setting created with etag: ...

3. Setting configuration with label "Production"
   ✓ Production setting created: app:Settings:Theme = Dark

4. Getting setting by key "app:Settings:FontSize"
   ✓ Retrieved value: 24
   ✓ Content type: text/plain
   ✓ Last modified: ...

5. Listing all settings with filter "app:Settings:*"
   - app:Settings:FontSize = 24
   - app:Settings:Theme = Dark [Production]
   ✓ Found 2 settings

6. Creating feature flag "BetaFeature"
   ✓ Feature flag created: .appconfig.featureflag/BetaFeature
   ✓ Enabled: true
   ✓ Description: Beta feature for early access users

   Listing all feature flags:
   - BetaFeature: Enabled

7. Deleting setting "app:Settings:FontSize"
   ✓ Setting deleted successfully

   Verifying deletion...
   ✓ Confirmed: Setting does not exist

Cleaning up test data...
✓ Cleanup completed

✅ All operations completed successfully!
```

## Error Handling

The demo includes comprehensive error handling for common scenarios:

- **401 Unauthorized**: Invalid credentials
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Setting or resource doesn't exist
- **409 Conflict**: Setting already exists (use `setConfigurationSetting` instead of `addConfigurationSetting`)
- **412 Precondition Failed**: ETag mismatch (concurrent modification)
- **429 Too Many Requests**: Rate limiting

## Key Concepts

### Configuration Settings
- **Key**: Hierarchical identifier (e.g., `app:Settings:FontSize`)
- **Value**: String value stored in App Configuration
- **Label**: Optional tag for environment-specific values (e.g., "Production", "Development")
- **Content Type**: Metadata describing the value format
- **Tags**: Key-value pairs for categorization

### Feature Flags
- Special configuration settings with prefix `.appconfig.featureflag/`
- Include enabled state, description, and client filters
- Support percentage rollouts and targeting filters
- Managed through `FeatureFlagValue` type

### Operations
- `setConfigurationSetting()`: Create or update (upsert)
- `addConfigurationSetting()`: Create only (fails if exists)
- `getConfigurationSetting()`: Retrieve by key and label
- `listConfigurationSettings()`: Query with filters
- `deleteConfigurationSetting()`: Remove by key and label

## Additional Resources

- [Azure App Configuration Documentation](https://learn.microsoft.com/azure/azure-app-configuration/)
- [@azure/app-configuration SDK Reference](https://learn.microsoft.com/javascript/api/@azure/app-configuration/)
- [Feature Management Documentation](https://learn.microsoft.com/azure/azure-app-configuration/concept-feature-management)

## License

MIT
