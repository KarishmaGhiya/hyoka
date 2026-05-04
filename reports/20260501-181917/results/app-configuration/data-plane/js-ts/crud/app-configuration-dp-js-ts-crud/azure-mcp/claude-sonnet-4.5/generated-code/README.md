# Azure App Configuration TypeScript Example

This program demonstrates how to manage configuration settings in Azure App Configuration using TypeScript.

## Features

1. **Create AppConfigurationClient** - Initialize client with connection string
2. **Set Configuration Settings** - Add key-value pairs to App Configuration
3. **Use Labels** - Organize settings with labels (e.g., "Production")
4. **Get Settings** - Retrieve configuration values by key
5. **List Settings** - Query settings with key filters
6. **Feature Flags** - Create and manage feature flags with rollout percentages
7. **Delete Settings** - Remove configuration settings
8. **Error Handling** - Comprehensive error handling with RestError

## Prerequisites

- Node.js (v16 or later)
- Azure subscription
- Azure App Configuration resource

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Connection String

Get your connection string from Azure Portal:
- Go to your App Configuration resource
- Navigate to **Settings** > **Access keys**
- Copy one of the connection strings

Set the environment variable:

**PowerShell:**
```powershell
$env:AZURE_APPCONFIG_CONNECTION_STRING="Endpoint=https://your-app-config.azconfig.io;Id=xxxxx;Secret=xxxxx"
```

**CMD:**
```cmd
set AZURE_APPCONFIG_CONNECTION_STRING=Endpoint=https://your-app-config.azconfig.io;Id=xxxxx;Secret=xxxxx
```

**Bash:**
```bash
export AZURE_APPCONFIG_CONNECTION_STRING="Endpoint=https://your-app-config.azconfig.io;Id=xxxxx;Secret=xxxxx"
```

## Run

```bash
npm start
```

Or with ts-node directly:
```bash
npx ts-node index.ts
```

Or compile and run:
```bash
npm run build
node dist/index.js
```

## Package Information

**Required Package:**
- `@azure/app-configuration` (^1.7.0) - Azure App Configuration client library

**Dev Dependencies:**
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution engine
- `@types/node` - Node.js type definitions

## Code Structure

The program demonstrates:

- **Client Creation**: Using connection string authentication
- **Setting Operations**: Adding configuration with various properties
- **Labels**: Organizing settings by environment (Production, Development, etc.)
- **Feature Flags**: Creating feature flags with client filters and rollout percentages
- **Querying**: Filtering settings with key patterns
- **Error Handling**: Catching and handling `RestError` with specific status codes (401, 403, 404, 429)
- **Cleanup**: Proper resource deletion and verification

## Error Handling

The program handles various error scenarios:

- **401 Unauthorized**: Invalid connection string or expired credentials
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Setting doesn't exist
- **429 Too Many Requests**: Rate limit exceeded
- **RestError**: Azure-specific errors with detailed information

## Example Output

```
1. Creating AppConfigurationClient...
✓ Client created successfully

2. Setting configuration setting...
✓ Set configuration: app:Settings:FontSize = 24
  ETag: "abc123..."

3. Setting configuration with label "Production"...
✓ Set configuration: app:Settings:Theme = DarkMode
  Label: Production
  Content Type: text/plain

4. Getting configuration setting by key...
✓ Retrieved configuration: app:Settings:FontSize
  Value: 24
  Last Modified: 2026-05-01T18:19:37.000Z
  Read Only: false

5. Listing all settings with key filter "app:Settings:*"...
  [1] app:Settings:FontSize = 24 (Label: (none))
  [2] app:Settings:Theme = DarkMode (Label: Production)
✓ Listed 2 configuration setting(s)

6. Creating feature flag "BetaFeature"...
✓ Feature flag created: BetaFeature
  Enabled: true
  Description: Beta feature for testing new functionality
  Rollout Percentage: 50%

7. Deleting configuration settings...
✓ Deleted setting: app:Settings:FontSize
✓ Deleted setting: app:Settings:Theme (Label: Production)
✓ Deleted feature flag: BetaFeature

✅ All operations completed successfully!
```

## Learn More

- [Azure App Configuration Documentation](https://docs.microsoft.com/azure/azure-app-configuration/)
- [@azure/app-configuration NPM Package](https://www.npmjs.com/package/@azure/app-configuration)
- [Feature Management](https://docs.microsoft.com/azure/azure-app-configuration/concept-feature-management)
