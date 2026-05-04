# Azure App Configuration Demo

This TypeScript program demonstrates all core operations with Azure App Configuration.

## Features Demonstrated

1. ✅ Create AppConfigurationClient with connection string
2. ✅ Set configuration setting (key: "app:Settings:FontSize", value: "24")
3. ✅ Set configuration setting with label "Production"
4. ✅ Get configuration setting by key
5. ✅ List all settings matching key filter "app:Settings:*"
6. ✅ Create feature flag for "BetaFeature"
7. ✅ Delete configuration setting
8. ✅ Proper error handling with RestError

## Prerequisites

- Node.js (v14 or higher)
- Azure App Configuration resource
- Connection string for your App Configuration store

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your connection string as an environment variable:
   
   **Windows (PowerShell):**
   ```powershell
   $env:AZURE_APPCONFIG_CONNECTION_STRING="Endpoint=https://your-store.azconfig.io;Id=xxx;Secret=xxx"
   ```

   **Windows (CMD):**
   ```cmd
   set AZURE_APPCONFIG_CONNECTION_STRING=Endpoint=https://your-store.azconfig.io;Id=xxx;Secret=xxx
   ```

   **Linux/macOS:**
   ```bash
   export AZURE_APPCONFIG_CONNECTION_STRING="Endpoint=https://your-store.azconfig.io;Id=xxx;Secret=xxx"
   ```

## Running the Program

### Option 1: Using ts-node (development)
```bash
npm run dev
```

### Option 2: Compile and run
```bash
npm run build
npm start
```

## Required Package

- **@azure/app-configuration** (^1.7.1): Official Azure SDK for App Configuration
  - Provides `AppConfigurationClient` for managing configuration settings
  - Includes TypeScript definitions
  - Exports `RestError` from `@azure/core-rest-pipeline` for error handling

## Error Handling

The program demonstrates proper error handling with `RestError`:
- Catches REST API errors with status codes
- Displays error codes and messages
- Handles 404 (Not Found) specifically when verifying deletion
- Graceful fallback for other error types

## Output Example

```
Creating AppConfigurationClient...

--- Setting configuration: app:Settings:FontSize = 24 ---
Set: app:Settings:FontSize = 24

--- Setting configuration with Production label ---
Set: app:Settings:BackgroundColor = Blue (label: Production)

--- Getting configuration by key ---
Retrieved: app:Settings:FontSize = 24

--- Listing all settings matching 'app:Settings:*' ---
  - app:Settings:BackgroundColor = Blue (label: Production)
  - app:Settings:FontSize = 24

--- Creating feature flag for 'BetaFeature' ---
Created feature flag: .appconfig.featureflag/BetaFeature
  Enabled: true

--- Deleting configuration setting ---
Deleted: app:Settings:FontSize

--- Verifying deletion ---
Setting successfully deleted (404 Not Found)

--- Cleaning up demo settings ---
Cleanup complete
```
