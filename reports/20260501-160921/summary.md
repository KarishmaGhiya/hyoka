# JS/TS Evaluation Run 2 — Analysis Summary

**Date:** 2026-05-01 | **Evals:** 56 (14 prompts × 4 configs) | **Total Time:** ~153 min | **Overall Avg Score:** 69.2% (+5.2% vs Run 1)

---

## Run Statistics

| Metric | Value |
|--------|-------|
| Run ID | `20260501-160921` |
| Timestamp | 2026-05-01T23:09:21Z |
| Total Prompts | 14 |
| Total Configs | 4 |
| Total Evaluations | 56 |
| Passed | 3 |
| Failed | 46 |
| Errors | 7 |
| Duration | 1245.7s |

## Comparison Matrix

| Prompt | baseline-skills/claude-opus-4.6 | baseline-skills/claude-sonnet-4.5 | baseline/claude-opus-4.6 | baseline/claude-sonnet-4.5 |
|--------|--------|--------|--------|--------|
| app-configuration-dp-js-ts-crud | ❌ 19/23 | ❌ 19/23 | ❌ 19/22 | ❌ 20/23 |
| cosmos-db-dp-js-ts-crud | ❌ 14/22 | ❌ 16/22 | ❌ 18/23 | ❌ 15/21 |
| event-hubs-dp-js-ts-streaming | ❌ 17/24 | ✅ | ❌ 17/23 | ❌ 17/23 |
| identity-dp-js-ts-default-credential | ⚠️ Error | ⚠️ Error | ⚠️ Error | ⚠️ Error |
| identity-dp-js-ts-managed-identity | ⚠️ Error | ❌ 16/21 | ⚠️ Error | ❌ 19/21 |
| identity-dp-js-ts-service-principal | ⚠️ Error | ❌ 16/20 | ❌ 17/20 | ❌ 18/20 |
| key-vault-dp-js-ts-crud | ❌ 16/20 | ❌ 17/19 | ❌ 15/19 | ❌ 17/20 |
| key-vault-dp-js-ts-secret-config | ❌ 28/30 | ❌ 27/28 | ❌ 24/28 | ❌ 26/30 |
| resource-manager-mp-js-ts-rg-crud | ❌ 20/23 | ❌ 21/23 | ❌ 21/23 | ❌ 21/23 |
| service-bus-dp-js-ts-crud | ❌ 18/23 | ❌ 22/26 | ❌ 17/24 | ❌ 19/24 |
| storage-dp-js-ts-blob-manager | ❌ 22/27 | ❌ 22/27 | ✅ | ❌ 21/26 |
| storage-dp-js-ts-crud | ❌ 22/23 | ❌ 22/23 | ❌ 22/23 | ✅ |
| storage-dp-js-ts-encrypted-uploader | ❌ 38/40 | ❌ 35/39 | ❌ 37/38 | ❌ 31/38 |
| storage-mp-js-ts-account-mgmt | ❌ 19/23 | ❌ 21/23 | ❌ 19/22 | ❌ 20/23 |

## Detailed Results

| Prompt | Config | Result | Score | Duration | Files |
|--------|--------|--------|-------|----------|-------|
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 19/23 | 174.1s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 19/23 | 105.1s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 19/22 | 196.7s | 4 |
| [app-configuration-dp-js-ts-crud](results/app-configuration/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 20/23 | 136.6s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 14/22 | 162.6s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 16/22 | 100.8s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 18/23 | 180.4s | 4 |
| [cosmos-db-dp-js-ts-crud](results/cosmos-db/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 15/21 | 93.7s | 3 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 17/24 | 265.8s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ✅ | — | 116.0s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 17/23 | 293.4s | 4 |
| [event-hubs-dp-js-ts-streaming](results/event-hubs/data-plane/js-ts/streaming/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 17/23 | 124.9s | 4 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 34.7s | 0 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 50.1s | 0 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 27.7s | 0 |
| [identity-dp-js-ts-default-credential](results/identity/data-plane/js-ts/auth/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 28.2s | 0 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 51.5s | 0 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 16/21 | 208.1s | 5 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 27.2s | 0 |
| [identity-dp-js-ts-managed-identity](results/identity/data-plane/js-ts/auth/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 19/21 | 153.2s | 3 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | Generator produced no files — the agent did not invoke any file-write tools | 103.1s | 0 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 16/20 | 135.6s | 4 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 17/20 | 79.9s | 1 |
| [identity-dp-js-ts-service-principal](results/identity/data-plane/js-ts/auth/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 18/20 | 125.0s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 16/20 | 163.7s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 17/19 | 109.9s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 15/19 | 158.1s | 4 |
| [key-vault-dp-js-ts-crud](results/key-vault/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 17/20 | 97.1s | 4 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 28/30 | 301.5s | 8 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 27/28 | 421.3s | 10 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 24/28 | 211.2s | 8 |
| [key-vault-dp-js-ts-secret-config](results/key-vault/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 26/30 | 345.9s | 11 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 20/23 | 215.7s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 21/23 | 128.6s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 21/23 | 189.0s | 4 |
| [resource-manager-mp-js-ts-rg-crud](results/resource-manager/management-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 21/23 | 104.5s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 18/23 | 168.8s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 22/26 | 151.2s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 17/24 | 155.9s | 4 |
| [service-bus-dp-js-ts-crud](results/service-bus/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 19/24 | 89.4s | 4 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 22/27 | 205.1s | 6 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 22/27 | 310.0s | 8 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ✅ | — | 216.7s | 6 |
| [storage-dp-js-ts-blob-manager](results/storage/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 21/26 | 322.0s | 8 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 22/23 | 168.7s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 22/23 | 112.2s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 22/23 | 194.2s | 4 |
| [storage-dp-js-ts-crud](results/storage/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ✅ | — | 95.2s | 4 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 38/40 | 285.6s | 7 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 35/39 | 311.9s | 8 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 37/38 | 231.0s | 7 |
| [storage-dp-js-ts-encrypted-uploader](results/storage/data-plane/js-ts/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 31/38 | 204.8s | 7 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/baseline-skills/claude-opus-4.6/report.md) | baseline-skills/claude-opus-4.6 | ❌ | 19/23 | 144.9s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 21/23 | 127.3s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | 19/22 | 164.6s | 4 |
| [storage-mp-js-ts-account-mgmt](results/storage/management-plane/js-ts/provisioning/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 20/23 | 113.6s | 4 |

## Duration Analysis (by Prompt)

| Prompt | Min | Avg | Max |
|--------|-----|-----|-----|
| service-bus-dp-js-ts-crud | 89.4s (baseline/claude-sonnet-4.5) | 141.3s | 168.8s (baseline-skills/claude-opus-4.6) |
| storage-dp-js-ts-crud | 95.2s (baseline/claude-sonnet-4.5) | 142.6s | 194.2s (baseline/claude-opus-4.6) |
| storage-dp-js-ts-encrypted-uploader | 204.8s (baseline/claude-sonnet-4.5) | 258.4s | 311.9s (baseline-skills/claude-sonnet-4.5) |
| event-hubs-dp-js-ts-streaming | 116.0s (baseline-skills/claude-sonnet-4.5) | 200.0s | 293.4s (baseline/claude-opus-4.6) |
| identity-dp-js-ts-managed-identity | 27.2s (baseline/claude-opus-4.6) | 110.0s | 208.1s (baseline-skills/claude-sonnet-4.5) |
| key-vault-dp-js-ts-secret-config | 211.2s (baseline/claude-opus-4.6) | 320.0s | 421.3s (baseline-skills/claude-sonnet-4.5) |
| storage-dp-js-ts-blob-manager | 205.1s (baseline-skills/claude-opus-4.6) | 263.5s | 322.0s (baseline/claude-sonnet-4.5) |
| storage-mp-js-ts-account-mgmt | 113.6s (baseline/claude-sonnet-4.5) | 137.6s | 164.6s (baseline/claude-opus-4.6) |
| identity-dp-js-ts-default-credential | 27.7s (baseline/claude-opus-4.6) | 35.1s | 50.1s (baseline-skills/claude-sonnet-4.5) |
| app-configuration-dp-js-ts-crud | 105.1s (baseline-skills/claude-sonnet-4.5) | 153.1s | 196.7s (baseline/claude-opus-4.6) |
| cosmos-db-dp-js-ts-crud | 93.7s (baseline/claude-sonnet-4.5) | 134.4s | 180.4s (baseline/claude-opus-4.6) |
| identity-dp-js-ts-service-principal | 79.9s (baseline/claude-opus-4.6) | 110.9s | 135.6s (baseline-skills/claude-sonnet-4.5) |
| key-vault-dp-js-ts-crud | 97.1s (baseline/claude-sonnet-4.5) | 132.2s | 163.7s (baseline-skills/claude-opus-4.6) |
| resource-manager-mp-js-ts-rg-crud | 104.5s (baseline/claude-sonnet-4.5) | 159.4s | 215.7s (baseline-skills/claude-opus-4.6) |

⏱ **Slowest:** key-vault-dp-js-ts-secret-config/baseline-skills/claude-sonnet-4.5 · **Fastest:** identity-dp-js-ts-managed-identity/baseline/claude-opus-4.6

## Prompt Comparison

| Prompt | Total | Passed | Failed | Pass Rate |
|--------|-------|--------|--------|----------|
| app-configuration-dp-js-ts-crud | 4 | 0 | 4 | 0.0% |
| cosmos-db-dp-js-ts-crud | 4 | 0 | 4 | 0.0% |
| event-hubs-dp-js-ts-streaming | 4 | 1 | 3 | 25.0% |
| identity-dp-js-ts-default-credential | 4 | 0 | 4 | 0.0% |
| identity-dp-js-ts-managed-identity | 4 | 0 | 4 | 0.0% |
| identity-dp-js-ts-service-principal | 4 | 0 | 4 | 0.0% |
| key-vault-dp-js-ts-crud | 4 | 0 | 4 | 0.0% |
| key-vault-dp-js-ts-secret-config | 4 | 0 | 4 | 0.0% |
| resource-manager-mp-js-ts-rg-crud | 4 | 0 | 4 | 0.0% |
| service-bus-dp-js-ts-crud | 4 | 0 | 4 | 0.0% |
| storage-dp-js-ts-blob-manager | 4 | 1 | 3 | 25.0% |
| storage-dp-js-ts-crud | 4 | 1 | 3 | 25.0% |
| storage-dp-js-ts-encrypted-uploader | 4 | 0 | 4 | 0.0% |
| storage-mp-js-ts-account-mgmt | 4 | 0 | 4 | 0.0% |

## Config Comparison

| Config | Total | Passed | Failed | Pass Rate |
|--------|-------|--------|--------|----------|
| baseline-skills/claude-opus-4.6 | 14 | 0 | 14 | 0.0% |
| baseline-skills/claude-sonnet-4.5 | 14 | 1 | 13 | 7.1% |
| baseline/claude-opus-4.6 | 14 | 1 | 13 | 7.1% |
| baseline/claude-sonnet-4.5 | 14 | 1 | 13 | 7.1% |

## Prompt Deltas

| Prompt | Passes On | Fails On |
|--------|-----------|----------|
| event-hubs-dp-js-ts-streaming | baseline-skills/claude-sonnet-4.5 | baseline-skills/claude-opus-4.6 |
| event-hubs-dp-js-ts-streaming | baseline-skills/claude-sonnet-4.5 | baseline/claude-opus-4.6 |
| event-hubs-dp-js-ts-streaming | baseline-skills/claude-sonnet-4.5 | baseline/claude-sonnet-4.5 |
| storage-dp-js-ts-blob-manager | baseline/claude-opus-4.6 | baseline-skills/claude-opus-4.6 |
| storage-dp-js-ts-blob-manager | baseline/claude-opus-4.6 | baseline-skills/claude-sonnet-4.5 |
| storage-dp-js-ts-blob-manager | baseline/claude-opus-4.6 | baseline/claude-sonnet-4.5 |
| storage-dp-js-ts-crud | baseline/claude-sonnet-4.5 | baseline-skills/claude-opus-4.6 |
| storage-dp-js-ts-crud | baseline/claude-sonnet-4.5 | baseline-skills/claude-sonnet-4.5 |
| storage-dp-js-ts-crud | baseline/claude-sonnet-4.5 | baseline/claude-opus-4.6 |


---

## Detailed Analysis (Run 2 vs Run 1)

### Changes Since Run 1
1. Dropped gpt-5.4 generator configs (12->8 configs)
2. Updated reviewer panel to claude-sonnet-4.5 + gemini-3-pro-preview
3. Installed azure-sdk-typescript plugin locally (was broken in Run 1)
4. Fixed plugin resolution for _direct/ directory
5. Created JS/TS generator skill (js-ts-azure-patterns)
6. Created JS/TS reviewer skill (js-ts-sdk-validation)

### Per-Config Results

| Config | Avg Score | Avg Time |
|--------|-----------|----------|
| baseline-skills/claude-sonnet-4.5 | **73.7%** | 2.8m |
| baseline/claude-sonnet-4.5 | 71.7% | 2.4m |
| baseline/claude-opus-4.6 | 66.4% | 2.8m |
| baseline-skills/claude-opus-4.6 | 65.0% | 2.9m |

- **Sonnet > Opus** as generator: 72.7% vs 65.7%
- **Skills configs marginal**: 69.4% vs 69.1%

### Prompt Comparison (Run 1 vs Run 2)

| Prompt | Run 1 | Run 2 | Delta |
|--------|-------|-------|-------|
| identity-dp-js-ts-service-principal | 25.3% | 63.8% | **+38.5%** |
| identity-dp-js-ts-managed-identity | 12.3% | 41.7% | **+29.4%** |
| app-configuration-dp-js-ts-crud | 67.5% | 84.6% | **+17.2%** |
| service-bus-dp-js-ts-crud | 63.7% | 78.2% | **+14.5%** |
| storage-dp-js-ts-encrypted-uploader | 78.9% | 90.9% | **+12.0%** |
| cosmos-db-dp-js-ts-crud | 62.4% | 71.5% | +9.1% |
| storage-mp-js-ts-account-mgmt | 79.3% | 86.8% | +7.5% |
| resource-manager-mp-js-ts-rg-crud | 82.9% | 90.2% | +7.3% |
| key-vault-dp-js-ts-crud | 80.1% | 83.4% | +3.3% |
| key-vault-dp-js-ts-secret-config | 90.4% | 90.5% | +0.1% |
| identity-dp-js-ts-default-credential | 12.3% | 0.0% | -12.3% |
| event-hubs-dp-js-ts-streaming | 70.1% | 54.7% | -15.5% |
| storage-dp-js-ts-blob-manager | 77.8% | 60.9% | -16.9% |
| storage-dp-js-ts-crud | 93.8% | 71.7% | -22.0% |

**10 improved, 4 regressed. Biggest wins: identity prompts (+29-39%).**

### Worst Criteria Pass Rates

| Criteria | Rate |
|----------|------|
| RestError handling (service-specific) | 0% |
| Logging via @azure/logger | 7% |
| RestError Exception Handling (general) | 24% |
| @azure/identity for Authentication | 63% |
| Error Handling (general) | 65% |
| Client Constructor with Endpoint+Credential | 67% |

### Recommendations
1. **Fix identity-dp-js-ts-default-credential prompt** - generation failed in all configs
2. **@azure/logger** (7% pass) - needs stronger prompt guidance
3. **RestError** (0-24%) - agents don't use RestError specifically
4. **Investigate regressions** in storage-crud, storage-blob-manager, event-hubs
5. **Consider sonnet as primary generator** (72.7% vs 65.7%)
6. **Skills configs show no significant lift** - investigate why
