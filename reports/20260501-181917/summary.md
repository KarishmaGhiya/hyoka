# Evaluation Summary: 20260501-181917

## Run Statistics

| Metric | Value |
|--------|-------|
| Run ID | `20260501-181917` |
| Timestamp | 2026-05-02T01:19:17Z |
| Total Prompts | 14 |
| Total Configs | 4 |
| Total Evaluations | 56 |
| Passed | 4 |
| Failed | 52 |
| Errors | 0 |
| Duration | 1676.7s |

## Comparison Matrix

| Prompt | azure-mcp-skills/claude-sonnet-4.5 | azure-mcp/claude-sonnet-4.5 | baseline-skills/claude-sonnet-4.5 | baseline/claude-sonnet-4.5 |
|--------|--------|--------|--------|--------|
| app-configuration-dp-js-ts-crud | ❌ 19/23 | ❌ 19/23 | ❌ 20/23 | ❌ 19/23 |
| cosmos-db-dp-js-ts-crud | ❌ 18/21 | ❌ 15/21 | ❌ 17/21 | ❌ 13/22 |
| event-hubs-dp-js-ts-streaming | ❌ 17/22 | ❌ 18/23 | ❌ 17/23 | ❌ 17/23 |
| identity-dp-js-ts-default-credential | ❌ 17/20 | ✅ | ❌ 19/20 | ❌ 18/20 |
| identity-dp-js-ts-managed-identity | ❌ 18/20 | ❌ 18/21 | ❌ 19/21 | ❌ 19/21 |
| identity-dp-js-ts-service-principal | ❌ 15/20 | ❌ 15/20 | ❌ 14/20 | ❌ 19/20 |
| key-vault-dp-js-ts-crud | ❌ 17/20 | ❌ 16/20 | ❌ 18/20 | ❌ 17/20 |
| key-vault-dp-js-ts-secret-config | ❌ 26/27 | ❌ 26/28 | ❌ 25/27 | ❌ 24/25 |
| resource-manager-mp-js-ts-rg-crud | ❌ 21/23 | ❌ 18/23 | ❌ 20/23 | ❌ 20/23 |
| service-bus-dp-js-ts-crud | ❌ 19/23 | ❌ 18/23 | ✅ | ❌ 16/26 |
| storage-dp-js-ts-blob-manager | ❌ 20/27 | ❌ 23/27 | ❌ 26/27 | ✅ |
| storage-dp-js-ts-crud | ✅ 22/22 | ❌ 22/23 | ❌ 22/23 | ❌ 22/23 |
| storage-dp-js-ts-encrypted-uploader | ❌ 42/43 | ❌ 35/39 | ❌ 37/38 | ❌ 26/37 |
| storage-mp-js-ts-account-mgmt | ❌ 20/23 | ❌ 20/23 | ❌ 19/23 | ❌ 19/23 |

## Detailed Results

| Prompt | Config | Result | Score | Duration | Files |
|--------|--------|--------|-------|----------|-------|
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 19/23 | 184.7s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 19/23 | 118.1s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 20/23 | 163.1s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 19/23 | 101.0s | 3 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 18/21 | 159.3s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 15/21 | 104.7s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 17/21 | 135.8s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 13/22 | 118.4s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 17/22 | 193.0s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 18/23 | 208.4s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 17/23 | 273.9s | 6 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 17/23 | 139.0s | 4 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 17/20 | 292.7s | 7 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ✅ | — | 285.1s | 6 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 19/20 | 238.3s | 6 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 18/20 | 193.3s | 6 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 18/20 | 177.5s | 4 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 18/21 | 176.3s | 5 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 19/21 | 340.5s | 6 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 19/21 | 222.7s | 6 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 15/20 | 152.7s | 4 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 15/20 | 185.9s | 5 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 14/20 | 219.4s | 6 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 19/20 | 182.6s | 6 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 17/20 | 142.0s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 16/20 | 123.9s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 18/20 | 160.1s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 17/20 | 108.8s | 4 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 26/27 | 480.7s | 13 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 26/28 | 405.9s | 11 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 25/27 | 300.2s | 8 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 24/25 | 365.2s | 12 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 21/23 | 298.3s | 8 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 18/23 | 96.2s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 20/23 | 139.7s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 20/23 | 130.4s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 19/23 | 176.4s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 18/23 | 142.2s | 3 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ✅ | — | 164.4s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 16/26 | 107.9s | 4 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 20/27 | 425.1s | 9 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 23/27 | 308.9s | 8 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 26/27 | 385.6s | 9 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ✅ | — | 347.4s | 9 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ✅ | 22/22 | 124.8s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 22/23 | 124.2s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 22/23 | 137.0s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 22/23 | 130.7s | 4 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 42/43 | 450.0s | 12 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 35/39 | 313.6s | 9 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 37/38 | 467.6s | 11 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 26/37 | 175.2s | 7 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/azure-mcp-skills/claude-sonnet-4.5/report.md) | azure-mcp-skills/claude-sonnet-4.5 | ❌ | 20/23 | 163.2s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 20/23 | 112.6s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 19/23 | 113.2s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 19/23 | 126.1s | 4 |

## Duration Analysis (by Prompt)

| Prompt | Min | Avg | Max |
|--------|-----|-----|-----|
| storage-dp-js-ts-crud | 124.2s (azure-mcp/claude-sonnet-4.5) | 129.2s | 137.0s (baseline-skills/claude-sonnet-4.5) |
| app-configuration-dp-js-ts-crud | 101.0s (baseline/claude-sonnet-4.5) | 141.7s | 184.7s (azure-mcp-skills/claude-sonnet-4.5) |
| storage-dp-js-ts-encrypted-uploader | 175.2s (baseline/claude-sonnet-4.5) | 351.6s | 467.6s (baseline-skills/claude-sonnet-4.5) |
| identity-dp-js-ts-default-credential | 193.3s (baseline/claude-sonnet-4.5) | 252.4s | 292.7s (azure-mcp-skills/claude-sonnet-4.5) |
| service-bus-dp-js-ts-crud | 107.9s (baseline/claude-sonnet-4.5) | 147.7s | 176.4s (azure-mcp-skills/claude-sonnet-4.5) |
| identity-dp-js-ts-managed-identity | 176.3s (azure-mcp/claude-sonnet-4.5) | 229.2s | 340.5s (baseline-skills/claude-sonnet-4.5) |
| resource-manager-mp-js-ts-rg-crud | 96.2s (azure-mcp/claude-sonnet-4.5) | 166.1s | 298.3s (azure-mcp-skills/claude-sonnet-4.5) |
| storage-dp-js-ts-blob-manager | 308.9s (azure-mcp/claude-sonnet-4.5) | 366.8s | 425.1s (azure-mcp-skills/claude-sonnet-4.5) |
| storage-mp-js-ts-account-mgmt | 112.6s (azure-mcp/claude-sonnet-4.5) | 128.8s | 163.2s (azure-mcp-skills/claude-sonnet-4.5) |
| cosmos-db-dp-js-ts-crud | 104.7s (azure-mcp/claude-sonnet-4.5) | 129.5s | 159.3s (azure-mcp-skills/claude-sonnet-4.5) |
| event-hubs-dp-js-ts-streaming | 139.0s (baseline/claude-sonnet-4.5) | 203.6s | 273.9s (baseline-skills/claude-sonnet-4.5) |
| identity-dp-js-ts-service-principal | 152.7s (azure-mcp-skills/claude-sonnet-4.5) | 185.1s | 219.4s (baseline-skills/claude-sonnet-4.5) |
| key-vault-dp-js-ts-crud | 108.8s (baseline/claude-sonnet-4.5) | 133.7s | 160.1s (baseline-skills/claude-sonnet-4.5) |
| key-vault-dp-js-ts-secret-config | 300.2s (baseline-skills/claude-sonnet-4.5) | 388.0s | 480.7s (azure-mcp-skills/claude-sonnet-4.5) |

⏱ **Slowest:** key-vault-dp-js-ts-secret-config/azure-mcp-skills/claude-sonnet-4.5 · **Fastest:** resource-manager-mp-js-ts-rg-crud/azure-mcp/claude-sonnet-4.5

## Prompt Comparison

| Prompt | Total | Passed | Failed | Pass Rate |
|--------|-------|--------|--------|----------|
| app-configuration-dp-js-ts-crud | 4 | 0 | 4 | 0.0% |
| cosmos-db-dp-js-ts-crud | 4 | 0 | 4 | 0.0% |
| event-hubs-dp-js-ts-streaming | 4 | 0 | 4 | 0.0% |
| identity-dp-js-ts-default-credential | 4 | 1 | 3 | 25.0% |
| identity-dp-js-ts-managed-identity | 4 | 0 | 4 | 0.0% |
| identity-dp-js-ts-service-principal | 4 | 0 | 4 | 0.0% |
| key-vault-dp-js-ts-crud | 4 | 0 | 4 | 0.0% |
| key-vault-dp-js-ts-secret-config | 4 | 0 | 4 | 0.0% |
| resource-manager-mp-js-ts-rg-crud | 4 | 0 | 4 | 0.0% |
| service-bus-dp-js-ts-crud | 4 | 1 | 3 | 25.0% |
| storage-dp-js-ts-blob-manager | 4 | 1 | 3 | 25.0% |
| storage-dp-js-ts-crud | 4 | 1 | 3 | 25.0% |
| storage-dp-js-ts-encrypted-uploader | 4 | 0 | 4 | 0.0% |
| storage-mp-js-ts-account-mgmt | 4 | 0 | 4 | 0.0% |

## Config Comparison

| Config | Total | Passed | Failed | Pass Rate |
|--------|-------|--------|--------|----------|
| azure-mcp-skills/claude-sonnet-4.5 | 14 | 1 | 13 | 7.1% |
| azure-mcp/claude-sonnet-4.5 | 14 | 1 | 13 | 7.1% |
| baseline-skills/claude-sonnet-4.5 | 14 | 1 | 13 | 7.1% |
| baseline/claude-sonnet-4.5 | 14 | 1 | 13 | 7.1% |

## Prompt Deltas

| Prompt | Passes On | Fails On |
|--------|-----------|----------|
| identity-dp-js-ts-default-credential | azure-mcp/claude-sonnet-4.5 | azure-mcp-skills/claude-sonnet-4.5 |
| identity-dp-js-ts-default-credential | azure-mcp/claude-sonnet-4.5 | baseline-skills/claude-sonnet-4.5 |
| identity-dp-js-ts-default-credential | azure-mcp/claude-sonnet-4.5 | baseline/claude-sonnet-4.5 |
| service-bus-dp-js-ts-crud | baseline-skills/claude-sonnet-4.5 | azure-mcp-skills/claude-sonnet-4.5 |
| service-bus-dp-js-ts-crud | baseline-skills/claude-sonnet-4.5 | azure-mcp/claude-sonnet-4.5 |
| service-bus-dp-js-ts-crud | baseline-skills/claude-sonnet-4.5 | baseline/claude-sonnet-4.5 |
| storage-dp-js-ts-blob-manager | baseline/claude-sonnet-4.5 | azure-mcp-skills/claude-sonnet-4.5 |
| storage-dp-js-ts-blob-manager | baseline/claude-sonnet-4.5 | azure-mcp/claude-sonnet-4.5 |
| storage-dp-js-ts-blob-manager | baseline/claude-sonnet-4.5 | baseline-skills/claude-sonnet-4.5 |
| storage-dp-js-ts-crud | azure-mcp-skills/claude-sonnet-4.5 | azure-mcp/claude-sonnet-4.5 |
| storage-dp-js-ts-crud | azure-mcp-skills/claude-sonnet-4.5 | baseline-skills/claude-sonnet-4.5 |
| storage-dp-js-ts-crud | azure-mcp-skills/claude-sonnet-4.5 | baseline/claude-sonnet-4.5 |

## Regression Analysis: `service-bus-dp-js-ts-crud`

**Run 2 avg: 78.2% → Run 3 avg: 55.6% (-22.6%)**

### Root Causes

#### 1. `baseline-skills` review panel completely failed → treated as 0%

Log evidence: `"Review panel failed" error="all reviewers failed"`
- `gemini-3-pro`: unavailable (known issue)
- `claude-sonnet-4.5`: also failed for this eval (JSON parse error or timeout)

The generation **succeeded** (4 files, 98s, `success: True`) but produced **no review scores** (0/0). This false-zero dragged the prompt average from ~75% down to 55.6%.

#### 2. Reviewer criteria drift (baseline: 19/24 → 16/26)

| Criteria | Run 2 | Run 3 | Issue |
|----------|-------|-------|-------|
| `Pagination with for-await-of` | ✅ | ❌ | Reviewer says "Not applicable" but marks FAIL |
| `LRO Pattern` | ✅ | ❌ | Reviewer says "Not applicable" but marks FAIL |
| `Best Practices` | ✅ | ❌ | Now stricter about connection string |
| `abandonMessage()` | N/A | ❌ (new) | Criteria split from single `completeMessage()` criterion |
| `deadLetterMessage()` | N/A | ❌ (new) | Same — generator only demonstrates `completeMessage()` |

#### 3. Prompt/criteria conflict

The prompt says: `"Create a ServiceBusClient using a connection string"` but criteria fail on `@azure/identity for Authentication` and `Client Constructor with Endpoint and Credential`.

### Recommended Fixes

1. Remove `gemini-3-pro` from reviewer panel (causes total failures)
2. Update prompt to use `DefaultAzureCredential` instead of connection string
3. Add `abandonMessage()` and `deadLetterMessage()` to prompt numbered steps
4. Address reviewer inconsistency: "N/A" criteria should not be scored FAIL

