# Evaluation Report: app-configuration-dp-js-ts-crud

**Config:** baseline-skills/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 27.4s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `app-configuration-dp-js-ts-crud` |
| Config | baseline-skills/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 27.4s |
| Timestamp | 2026-04-30T23:17:24Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 27.0s |
| **Total** | **27.4s** |

## Configuration

- **name:** baseline-skills/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=14458 out=1619 |
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

Use this:

```bash
npm install @azure/app-configuration @azure/core-rest-pipeline
```

```ts
// app-config.ts
import {
  AppConfigurationClient,
  featureFlagContentType,
} from "@azure/app-configuration";
import { RestError } from "@azure/core-rest-pipeline";

async function main(): Promise<void> {
  const connectionString = process.env.AZURE_APP_CONFIGURATION_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error(
      "Missing AZURE_APP_CONFIGURATION_CONNECTION_STRING environment variable."
    );
  }

  const client = new AppConfigurationClient(connectionString);
  const key = "app:Settings:FontSize";

  // 1 & 2) Set configuration setting (no label)
  await client.setConfigurationSetting({
    key,
    value: "24",
  });

  // 3) Set configuration setting with label "Production"
  await client.setConfigurationSetting({
    key,
    value: "24",
    label: "Production",
  });

  // 4) Get the setting by key and print value
  const setting = await client.getConfigurationSetting({ key });
  console.log(`Value for "${key}": ${setting.value}`);

  // 5) List settings matching key filter
  console.log('\nSettings matching "app:Settings:*":');
  for await (const item of client.listConfigurationSettings({
    keyFilter: "app:Settings:*",
  })) {
    console.log(`- key=${item.key}, label=${item.label ?? "(none)"}, value=${item.value}`);
  }

  // 6) Create feature flag setting for "BetaFeature"
  await client.setConfigurationSetting({
    key: ".appconfig.featureflag/BetaFeature",
    contentType: featureFlagContentType,
    value: JSON.stringify({
      id: "BetaFeature",
      description: "Controls beta feature rollout",
      enabled: true,
      conditions: { client_filters: [] },
    }),
  });

  // 7) Delete the setting by key (unlabeled)
  await client.deleteConfigurationSetting({ key });
  console.log(`\nDeleted setting with key "${key}" (unlabeled).`);
}

main().catch((err: unknown) => {
  if (err instanceof RestError) {
    console.error(
      `Azure REST error${err.statusCode ? ` (${err.statusCode})` : ""}: ${err.message}`
    );
    if (err.code) console.error(`Code: ${err.code}`);
  } else if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
  } else {
    console.error("Unknown error:", err);
  }
  process.exitCode = 1;
});
```

Run with:

```bash
set AZURE_APP_CONFIGURATION_CONNECTION_STRING=your_connection_string
npx ts-node app-config.ts
```

## Re-run Command

```bash
hyoka run --prompt-id app-configuration-dp-js-ts-crud --config baseline-skills/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
