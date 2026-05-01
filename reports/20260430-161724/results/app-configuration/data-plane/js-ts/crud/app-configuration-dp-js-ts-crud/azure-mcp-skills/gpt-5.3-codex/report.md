# Evaluation Report: app-configuration-dp-js-ts-crud

**Config:** azure-mcp-skills/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 23.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `app-configuration-dp-js-ts-crud` |
| Config | azure-mcp-skills/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 23.0s |
| Timestamp | 2026-04-30T23:20:14Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 22.9s |
| **Total** | **23.0s** |

## Configuration

- **name:** azure-mcp-skills/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=25739 out=1085 |
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

Use this package:

```bash
npm install @azure/app-configuration
```

```ts
// appconfig-demo.ts
import { AppConfigurationClient, RestError } from "@azure/app-configuration";

async function main(): Promise<void> {
  const connectionString = process.env.APPCONFIG_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("Set APPCONFIG_CONNECTION_STRING in your environment.");
  }

  const client = new AppConfigurationClient(connectionString);
  const key = "app:Settings:FontSize";

  // 1 & 2) Set a configuration setting (no label)
  await client.setConfigurationSetting({
    key,
    value: "24",
  });

  // 3) Set a setting with label "Production"
  await client.setConfigurationSetting({
    key,
    value: "24",
    label: "Production",
  });

  // 4) Get setting by key and print its value
  const current = await client.getConfigurationSetting({ key });
  console.log(`Current value for ${key}: ${current.value}`);

  // 5) List settings matching key filter
  console.log(`\nSettings matching "app:Settings:*":`);
  for await (const setting of client.listConfigurationSettings({
    keyFilter: "app:Settings:*",
  })) {
    console.log(`- key=${setting.key}, label=${setting.label ?? "<none>"}, value=${setting.value}`);
  }

  // 6) Create a feature flag setting for "BetaFeature"
  await client.setConfigurationSetting({
    key: ".appconfig.featureflag/BetaFeature",
    contentType: "application/vnd.microsoft.appconfig.ff+json;charset=utf-8",
    value: JSON.stringify({
      id: "BetaFeature",
      description: "Beta feature toggle",
      enabled: true,
      conditions: { client_filters: [] },
    }),
  });

  // 7) Delete setting by key (deletes the unlabeled one)
  await client.deleteConfigurationSetting({ key });

  console.log("\nDone.");
}

main().catch((err: unknown) => {
  if (err instanceof RestError) {
    console.error("Azure App Configuration REST error:");
    console.error(`- message: ${err.message}`);
    console.error(`- code: ${err.code}`);
    console.error(`- statusCode: ${err.statusCode}`);
  } else if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
  } else {
    console.error("Unexpected error:", err);
  }
  process.exit(1);
});
```

Run with:

```bash
set APPCONFIG_CONNECTION_STRING=<your-connection-string>
npx ts-node appconfig-demo.ts
```

## Re-run Command

```bash
hyoka run --prompt-id app-configuration-dp-js-ts-crud --config azure-mcp-skills/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
