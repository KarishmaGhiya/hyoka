# Evaluation Summary: 20260430-174316

## Run Statistics

| Metric | Value |
|--------|-------|
| Run ID | `20260430-174316` |
| Timestamp | 2026-05-01T00:43:16Z |
| Total Prompts | 14 |
| Total Configs | 12 |
| Total Evaluations | 167 |
| Passed | 0 |
| Failed | 139 |
| Errors | 28 |
| Duration | 41681.8s |

## Comparison Matrix

| Prompt | azure-mcp-skills/claude-opus-4.6 | azure-mcp-skills/claude-sonnet-4.5 | azure-mcp-skills/gpt-5.4 | azure-mcp/claude-opus-4.6 | azure-mcp/claude-sonnet-4.5 | azure-mcp/gpt-5.4 | baseline-skills/claude-opus-4.6 | baseline-skills/claude-sonnet-4.5 | baseline-skills/gpt-5.4 | baseline/claude-opus-4.6 | baseline/claude-sonnet-4.5 | baseline/gpt-5.4 |
|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|
| app-configuration-dp-js-ts-crud | ❌ 18/23 | ❌ 16/23 | ❌ 16/23 | ❌ 18/23 | ❌ 14/23 | ❌ 5/15 | ❌ 18/23 | ❌ 14/23 | ❌ 20/23 | ❌ 18/23 | ❌ 15/23 | ❌ 4/23 |
| cosmos-db-dp-js-ts-crud | ❌ 15/22 | ❌ 13/22 | ❌ 15/22 | ❌ 14/22 | ❌ 13/22 | ❌ 17/22 | ❌ 12/22 | ❌ 13/22 | ❌ 16/21 | ❌ 14/22 | ❌ 14/22 | ❌ 4/22 |
| event-hubs-dp-js-ts-streaming | ❌ 17/23 | ❌ 15/23 | ❌ 17/23 | ❌ 16/23 | ❌ 16/23 | ❌ 17/26 | ❌ 15/23 | ❌ 15/23 | ❌ 18/23 | ❌ 17/23 | ❌ 14/23 | ❌ 17/23 |
| identity-dp-js-ts-default-credential | ⚠️ Error | ❌ 14/20 | ⚠️ Error | ⚠️ Error | ❌ 16/20 | ⚠️ Error | ⚠️ Error | ⚠️ Error | ⚠️ Error | ⚠️ Error | ⚠️ Error | ⚠️ Error |
| identity-dp-js-ts-managed-identity | ⚠️ Error | ⚠️ Error | ⚠️ Error | ⚠️ Error | ⚠️ Error | ⚠️ Error | ⚠️ Error | ❌ 13/21 | ⚠️ Error | ⚠️ Error | ❌ 17/21 | ⚠️ Error |
| identity-dp-js-ts-service-principal | ❌ 15/20 | ⚠️ Error | ⚠️ Error | ❌ 13/20 | ⚠️ Error | ⚠️ Error | ⚠️ Error | ❌ 17/20 | ⚠️ Error | ⚠️ Error | ❌ 17/20 | ⚠️ Error |
| key-vault-dp-js-ts-crud | ❌ 16/20 | ❌ 15/20 | ❌ 16/20 | ❌ 16/20 | ❌ 14/20 | ❌ 16/20 | ❌ 17/20 | ❌ 16/20 | ❌ 16/20 | ❌ 16/20 | ❌ 17/20 | ❌ 16/20 |
| key-vault-dp-js-ts-secret-config | ❌ 24/28 | ❌ 24/28 | ❌ 25/28 | ❌ 25/28 | ❌ 25/28 | ❌ 27/28 | ❌ 25/28 | ❌ 26/28 | ❌ 25/28 | ❌ 26/28 | ❌ 25/28 | ❌ 26/28 |
| resource-manager-mp-js-ts-rg-crud | ❌ 20/23 | ❌ 20/23 | ❌ 20/23 | ❌ 20/23 | ❌ 17/23 | ❌ 20/23 | ❌ 20/23 | ❌ 17/23 | ❌ 18/22 | ❌ 20/23 | ❌ 18/23 | ❌ 20/23 |
| service-bus-dp-js-ts-crud | — | ❌ 13/23 | ❌ 16/23 | ❌ 14/23 | ❌ 15/23 | ❌ 14/23 | ❌ 13/23 | ❌ 13/23 | ❌ 17/22 | ❌ 16/23 | ❌ 14/23 | ❌ 16/23 |
| storage-dp-js-ts-blob-manager | ❌ 22/27 | ❌ 19/27 | ❌ 21/27 | ❌ 20/27 | ❌ 21/27 | ❌ 22/27 | ❌ 21/27 | ❌ 21/27 | ❌ 20/27 | ❌ 21/27 | ❌ 19/27 | ❌ 19/27 |
| storage-dp-js-ts-crud | ❌ 21/23 | ❌ 21/23 | ❌ 22/23 | ❌ 22/23 | ❌ 21/23 | ❌ 22/23 | ❌ 22/23 | ❌ 21/23 | ❌ 22/23 | ❌ 22/23 | ❌ 20/23 | ❌ 22/23 |
| storage-dp-js-ts-encrypted-uploader | ❌ 37/40 | ❌ 35/40 | ❌ 5/23 | ❌ 35/40 | ❌ 32/40 | ❌ 35/40 | ❌ 36/37 | ❌ 30/36 | ❌ 7/34 | ❌ 29/35 | ❌ 32/37 | ❌ 35/40 |
| storage-mp-js-ts-account-mgmt | ❌ 19/23 | ❌ 13/23 | ❌ 19/23 | ❌ 18/23 | ❌ 15/23 | ❌ 18/22 | ❌ 20/23 | ❌ 16/22 | ❌ 18/22 | ❌ 20/23 | ❌ 15/23 | ❌ 19/23 |

## Detailed Results

| Prompt | Config | Result | Score | Duration | Files |
|--------|--------|--------|-------|----------|-------|
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/azure-mcp-skills/claude-opus-4.6/report.md) | azure-mcp-skills/claude-opus-4.6 | ❌ | 18/23 | 248.6s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 16/23 | 248.0s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | 16/23 | 319.7s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | 18/23 | 252.7s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 14/23 | 239.8s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | 5/15 | 140.3s | 2 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 18/23 | 245.7s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 14/23 | 263.8s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | 20/23 | 293.5s | 3 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 18/23 | 240.2s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 15/23 | 211.0s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | 4/23 | 169.9s | 2 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/azure-mcp-skills/claude-opus-4.6/report.md) | azure-mcp-skills/claude-opus-4.6 | ❌ | 15/22 | 293.0s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 13/22 | 204.8s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | 15/22 | 207.5s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | 14/22 | 313.5s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 13/22 | 226.8s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | 17/22 | 332.1s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 12/22 | 310.0s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 13/22 | 187.8s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | 16/21 | 258.8s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 14/22 | 254.4s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 14/22 | 191.0s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | 4/22 | 220.9s | 2 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/azure-mcp-skills/claude-opus-4.6/report.md) | azure-mcp-skills/claude-opus-4.6 | ❌ | 17/23 | 299.1s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 15/23 | 204.7s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | 17/23 | 269.9s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | 16/23 | 285.9s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 16/23 | 258.5s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | 17/26 | 242.7s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 15/23 | 247.7s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 15/23 | 220.0s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | 18/23 | 305.3s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 17/23 | 238.1s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 14/23 | 204.9s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | 17/23 | 279.5s | 4 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/azure-mcp-skills/claude-opus-4.6/report.md) | azure-mcp-skills/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 49.0s | 0 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 14/20 | 244.1s | 4 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 56.4s | 0 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 54.9s | 0 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 16/20 | 619.2s | 4 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 75.0s | 0 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 30.2s | 0 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 33.0s | 0 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 40.4s | 0 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 26.7s | 0 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 33.4s | 0 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 37.3s | 0 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/azure-mcp-skills/claude-opus-4.6/report.md) | azure-mcp-skills/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 47.2s | 0 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 50.3s | 0 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 51.5s | 0 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 50.7s | 0 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 59.7s | 0 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 69.1s | 0 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 28.7s | 0 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 13/21 | 405.2s | 7 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 50.3s | 0 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 31.1s | 0 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 17/21 | 434.3s | 7 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 34.2s | 0 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/azure-mcp-skills/claude-opus-4.6/report.md) | azure-mcp-skills/claude-opus-4.6 | ❌ | 15/20 | 222.9s | 1 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 45.0s | 0 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 82.4s | 0 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | 13/20 | 150.6s | 1 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 39.7s | 0 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 43.3s | 0 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 18.4s | 0 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 17/20 | 297.2s | 5 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 23.5s | 0 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 24.6s | 0 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 17/20 | 239.8s | 4 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 21.4s | 0 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/azure-mcp-skills/claude-opus-4.6/report.md) | azure-mcp-skills/claude-opus-4.6 | ❌ | 16/20 | 250.6s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 15/20 | 228.1s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | 16/20 | 211.0s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | 16/20 | 247.5s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 14/20 | 194.1s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | 16/20 | 241.9s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 17/20 | 236.4s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 16/20 | 157.5s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | 16/20 | 195.0s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 16/20 | 250.0s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 17/20 | 199.2s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | 16/20 | 233.5s | 4 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/azure-mcp-skills/claude-opus-4.6/report.md) | azure-mcp-skills/claude-opus-4.6 | ❌ | 24/28 | 304.4s | 8 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 24/28 | 472.3s | 10 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | 25/28 | 405.5s | 10 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | 25/28 | 355.1s | 8 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 25/28 | 590.2s | 10 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | 27/28 | 388.2s | 9 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 25/28 | 389.9s | 8 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 26/28 | 575.6s | 10 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | 25/28 | 368.3s | 8 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 26/28 | 345.0s | 8 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 25/28 | 364.2s | 8 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | 26/28 | 441.5s | 9 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/azure-mcp-skills/claude-opus-4.6/report.md) | azure-mcp-skills/claude-opus-4.6 | ❌ | 20/23 | 280.0s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 20/23 | 201.6s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | 20/23 | 254.9s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | 20/23 | 239.6s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 17/23 | 249.3s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | 20/23 | 310.6s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 20/23 | 235.9s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 17/23 | 228.5s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | 18/22 | 226.2s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 20/23 | 236.5s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 18/23 | 195.1s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | 20/23 | 237.7s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 13/23 | 252.3s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | 16/23 | 297.3s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | 14/23 | 324.0s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 15/23 | 223.7s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | 14/23 | 216.2s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 13/23 | 271.5s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 13/23 | 293.1s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | 17/22 | 232.6s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 16/23 | 269.4s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 14/23 | 231.2s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | 16/23 | 223.7s | 4 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/azure-mcp-skills/claude-opus-4.6/report.md) | azure-mcp-skills/claude-opus-4.6 | ❌ | 22/27 | 370.3s | 6 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 19/27 | 327.4s | 6 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | 21/27 | 384.0s | 6 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | 20/27 | 376.0s | 6 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 21/27 | 428.1s | 8 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | 22/27 | 402.4s | 6 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 21/27 | 370.6s | 6 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 21/27 | 429.9s | 7 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | 20/27 | 344.1s | 6 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 21/27 | 365.7s | 6 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 19/27 | 342.0s | 6 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | 19/27 | 388.0s | 7 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/azure-mcp-skills/claude-opus-4.6/report.md) | azure-mcp-skills/claude-opus-4.6 | ❌ | 21/23 | 254.3s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 21/23 | 190.6s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | 22/23 | 276.4s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | 22/23 | 251.1s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 21/23 | 206.4s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | 22/23 | 272.0s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 22/23 | 247.6s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 21/23 | 192.6s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | 22/23 | 255.8s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 22/23 | 228.9s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 20/23 | 175.5s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | 22/23 | 205.4s | 4 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/azure-mcp-skills/claude-opus-4.6/report.md) | azure-mcp-skills/claude-opus-4.6 | ❌ | 37/40 | 416.3s | 7 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 35/40 | 588.8s | 10 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | 5/23 | 274.8s | 3 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | 35/40 | 407.9s | 7 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 32/40 | 404.4s | 7 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | 35/40 | 485.6s | 7 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 36/37 | 353.3s | 7 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 30/36 | 480.5s | 9 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | 7/34 | 375.0s | 2 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 29/35 | 228.1s | 7 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 32/37 | 439.9s | 9 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | 35/40 | 420.8s | 7 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/azure-mcp-skills/claude-opus-4.6/report.md) | azure-mcp-skills/claude-opus-4.6 | ❌ | 19/23 | 321.3s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 13/23 | 323.6s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/azure-mcp-skills/gpt-5.4/report.md) | azure-mcp-skills/gpt-5.4 | ❌ | 19/23 | 320.4s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/azure-mcp/claude-opus-4.6/report.md) | azure-mcp/claude-opus-4.6 | ❌ | 18/23 | 279.3s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 15/23 | 248.7s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/azure-mcp/gpt-5.4/report.md) | azure-mcp/gpt-5.4 | ❌ | 18/22 | 307.9s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 20/23 | 265.6s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 16/22 | 229.6s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/baseline-skills/gpt-5.4/report.md) | baseline-skills/gpt-5.4 | ❌ | 18/22 | 291.5s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 20/23 | 289.6s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 15/23 | 264.0s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/baseline/gpt-5.4/report.md) | baseline/gpt-5.4 | ❌ | 19/23 | 253.1s | 4 |

## Duration Analysis (by Prompt)

| Prompt | Min | Avg | Max |
|--------|-----|-----|-----|
| resource-manager-mp-js-ts-rg-crud | 195.1s (baseline/claude-sonnet-4.5) | 241.3s | 310.6s (azure-mcp/gpt-5.4) |
| storage-dp-js-ts-crud | 175.5s (baseline/claude-sonnet-4.5) | 229.7s | 276.4s (azure-mcp-skills/gpt-5.4) |
| app-configuration-dp-js-ts-crud | 140.3s (azure-mcp/gpt-5.4) | 239.4s | 319.7s (azure-mcp-skills/gpt-5.4) |
| key-vault-dp-js-ts-crud | 157.5s (baseline-skills/claude-sonnet-4.5) | 220.4s | 250.6s (azure-mcp-skills/claude-opus-4.6) |
| storage-dp-js-ts-blob-manager | 327.4s (azure-mcp-skills/claude-sonnet-4.5) | 377.4s | 429.9s (baseline-skills/claude-sonnet-4.5) |
| storage-dp-js-ts-encrypted-uploader | 228.1s (baseline/claude-opus-4.6) | 406.3s | 588.8s (azure-mcp-skills/claude-sonnet-4.5) |
| storage-mp-js-ts-account-mgmt | 229.6s (baseline-skills/claude-sonnet-4.5) | 282.9s | 323.6s (azure-mcp-skills/claude-sonnet-4.5) |
| event-hubs-dp-js-ts-streaming | 204.7s (azure-mcp-skills/claude-sonnet-4.5) | 254.7s | 305.3s (baseline-skills/gpt-5.4) |
| service-bus-dp-js-ts-crud | 216.2s (azure-mcp/gpt-5.4) | 257.7s | 324.0s (azure-mcp/claude-opus-4.6) |
| identity-dp-js-ts-default-credential | 26.7s (baseline/claude-opus-4.6) | 108.3s | 619.2s (azure-mcp/claude-sonnet-4.5) |
| identity-dp-js-ts-managed-identity | 28.7s (baseline-skills/claude-opus-4.6) | 109.4s | 434.3s (baseline/claude-sonnet-4.5) |
| key-vault-dp-js-ts-secret-config | 304.4s (azure-mcp-skills/claude-opus-4.6) | 416.7s | 590.2s (azure-mcp/claude-sonnet-4.5) |
| cosmos-db-dp-js-ts-crud | 187.8s (baseline-skills/claude-sonnet-4.5) | 250.0s | 332.1s (azure-mcp/gpt-5.4) |
| identity-dp-js-ts-service-principal | 18.4s (baseline-skills/claude-opus-4.6) | 100.7s | 297.2s (baseline-skills/claude-sonnet-4.5) |

⏱ **Slowest:** identity-dp-js-ts-default-credential/azure-mcp/claude-sonnet-4.5 · **Fastest:** identity-dp-js-ts-service-principal/baseline-skills/claude-opus-4.6

## Prompt Comparison

| Prompt | Total | Passed | Failed | Pass Rate |
|--------|-------|--------|--------|----------|
| app-configuration-dp-js-ts-crud | 12 | 0 | 12 | 0.0% |
| cosmos-db-dp-js-ts-crud | 12 | 0 | 12 | 0.0% |
| event-hubs-dp-js-ts-streaming | 12 | 0 | 12 | 0.0% |
| identity-dp-js-ts-default-credential | 12 | 0 | 12 | 0.0% |
| identity-dp-js-ts-managed-identity | 12 | 0 | 12 | 0.0% |
| identity-dp-js-ts-service-principal | 12 | 0 | 12 | 0.0% |
| key-vault-dp-js-ts-crud | 12 | 0 | 12 | 0.0% |
| key-vault-dp-js-ts-secret-config | 12 | 0 | 12 | 0.0% |
| resource-manager-mp-js-ts-rg-crud | 12 | 0 | 12 | 0.0% |
| service-bus-dp-js-ts-crud | 11 | 0 | 11 | 0.0% |
| storage-dp-js-ts-blob-manager | 12 | 0 | 12 | 0.0% |
| storage-dp-js-ts-crud | 12 | 0 | 12 | 0.0% |
| storage-dp-js-ts-encrypted-uploader | 12 | 0 | 12 | 0.0% |
| storage-mp-js-ts-account-mgmt | 12 | 0 | 12 | 0.0% |

## Config Comparison

| Config | Total | Passed | Failed | Pass Rate |
|--------|-------|--------|--------|----------|
| azure-mcp-skills/claude-opus-4.6 | 13 | 0 | 13 | 0.0% |
| azure-mcp-skills/claude-sonnet-4.5 | 14 | 0 | 14 | 0.0% |
| azure-mcp-skills/gpt-5.4 | 14 | 0 | 14 | 0.0% |
| azure-mcp/claude-opus-4.6 | 14 | 0 | 14 | 0.0% |
| azure-mcp/claude-sonnet-4.5 | 14 | 0 | 14 | 0.0% |
| azure-mcp/gpt-5.4 | 14 | 0 | 14 | 0.0% |
| baseline-skills/claude-opus-4.6 | 14 | 0 | 14 | 0.0% |
| baseline-skills/claude-sonnet-4.5 | 14 | 0 | 14 | 0.0% |
| baseline-skills/gpt-5.4 | 14 | 0 | 14 | 0.0% |
| baseline/claude-opus-4.6 | 14 | 0 | 14 | 0.0% |
| baseline/claude-sonnet-4.5 | 14 | 0 | 14 | 0.0% |
| baseline/gpt-5.4 | 14 | 0 | 14 | 0.0% |

