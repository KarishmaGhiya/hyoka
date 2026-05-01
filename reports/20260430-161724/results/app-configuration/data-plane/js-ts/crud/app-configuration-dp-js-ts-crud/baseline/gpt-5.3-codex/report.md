# Evaluation Report: app-configuration-dp-js-ts-crud

**Config:** baseline/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 21.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `app-configuration-dp-js-ts-crud` |
| Config | baseline/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 21.7s |
| Timestamp | 2026-04-30T23:17:24Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 21.5s |
| **Total** | **21.7s** |

## Configuration

- **name:** baseline/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=14452 out=1157 |
| Turn Count | 1 |

## Error

```
0 files generated — agent did not create any files
```

## Prompt Sent

```
Write a TypeScript program
that manages configuration settings in Azure App Configuration:
1. Create an AppConfigurationClient using a connection string
2. Set a configuration setting with key "app:Settings:FontSize" and value "24"
3. Set a setting with label "Production"
4. Get the setting by key and print its value
5. List all settings matching the key filter "app:Settings:*" using listConfigurationSettings
6. Create a feature flag configuration setting for "BetaFeature"
7. Delete the setting by key

Show required npm package (@azure/app-configuration) and
proper error handling with RestError.
```

## Copilot Response

Install the SDK, then run this TypeScript program:

```bash
npm install @azure/app-configuration
```

```ts
// index.ts
import { AppConfigurationClient, ConfigurationSetting } from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

async function main(): Promise<void> {
  const connectionString = process.env.AZURE_APP_CONFIG_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("Missing AZURE_APP_CONFIG_CONNECTION_STRING environment variable.");
  }

  const client = new AppConfigurationClient(connectionString);

  const key = "app:Settings:FontSize";

  try {
    // 1,2) Set key/value
    await client.setConfigurationSetting({
      key,
      value: "24",
    });

    // 3) Set same key with label "Production"
    await client.setConfigurationSetting({
      key,
      label: "Production",
      value: "24",
    });

    // 4) Get by key and print value
    const setting = await client.getConfigurationSetting({ key });
    console.log(`Value for "${key}":`, setting.value);

    // 5) List all settings matching key filter
    console.log(`\nSettings matching "app:Settings:*":`);
    for await (const s of client.listConfigurationSettings({
      keyFilter: "app:Settings:*",
    })) {
      console.log(`- key=${s.key}, label=${s.label ?? "<none>"}, value=${s.value}`);
    }

    // 6) Create feature flag "BetaFeature"
    const betaFeatureFlag: ConfigurationSetting = {
      key: ".appconfig.featureflag/BetaFeature",
      contentType: "application/vnd.microsoft.appconfig.ff+json;charset=utf-8",
      value: JSON.stringify({
        id: "BetaFeature",
        description: "Beta feature toggle",
        enabled: true,
        conditions: { client_filters: [] },
      }),
    };
    await client.setConfigurationSetting(betaFeatureFlag);

    // 7) Delete the setting by key
    await client.deleteConfigurationSetting({ key });

    console.log(`\nDeleted setting: ${key}`);
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error("Azure REST error:");
      console.error(`- statusCode: ${error.statusCode}`);
      console.error(`- code: ${error.code}`);
      console.error(`- message: ${error.message}`);
    } else if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
    process.exitCode = 1;
  }
}

main();
```

Run with:

```bash
# Set your connection string first
# PowerShell:
$env:AZURE_APP_CONFIG_CONNECTION_STRING="Endpoint=...;Id=...;Secret=..."

npx ts-node index.ts
```

## Re-run Command

```bash
hyoka run --prompt-id app-configuration-dp-js-ts-crud --config baseline/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
