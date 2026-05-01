# Evaluation Summary: 20260416-162650

## Run Statistics

| Metric | Value |
|--------|-------|
| Run ID | `20260416-162650` |
| Timestamp | 2026-04-16T23:26:50Z |
| Total Prompts | 5 |
| Total Configs | 1 |
| Total Evaluations | 5 |
| Passed | 2 |
| Failed | 0 |
| Errors | 3 |
| Duration | 101.3s |

## Comparison Matrix

| Prompt | baseline/claude-opus-4.6 |
|--------|--------|
| storage-dp-java-blob-event-notifier | ⚠️ Error |
| storage-dp-java-blob-manager | ⚠️ Error |
| storage-dp-java-crud | ✅ |
| storage-dp-java-encrypted-uploader | ⚠️ Error |
| storage-mp-java-account-mgmt | ✅ |

## Detailed Results

| Prompt | Config | Result | Score | Duration | Files |
|--------|--------|--------|-------|----------|-------|
| [storage-dp-java-blob-event-notifier](results/storage/data-plane/java/streaming/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | Generation cancelled due to action limit | 101.2s | 2 |
| [storage-dp-java-blob-manager](results/storage/data-plane/java/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | Generation cancelled due to action limit | 101.2s | 0 |
| [storage-dp-java-crud](results/storage/data-plane/java/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ✅ | — | 100.5s | 2 |
| [storage-dp-java-encrypted-uploader](results/storage/data-plane/java/crud/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ❌ | Generation cancelled due to action limit | 101.2s | 0 |
| [storage-mp-java-account-mgmt](results/storage/management-plane/java/provisioning/baseline/claude-opus-4.6/report.md) | baseline/claude-opus-4.6 | ✅ | — | 100.6s | 2 |

## Duration Analysis (by Prompt)

| Prompt | Min | Avg | Max |
|--------|-----|-----|-----|
| storage-dp-java-blob-manager | 101.2s (baseline/claude-opus-4.6) | 101.2s | 101.2s (baseline/claude-opus-4.6) |
| storage-dp-java-crud | 100.5s (baseline/claude-opus-4.6) | 100.5s | 100.5s (baseline/claude-opus-4.6) |
| storage-dp-java-encrypted-uploader | 101.2s (baseline/claude-opus-4.6) | 101.2s | 101.2s (baseline/claude-opus-4.6) |
| storage-mp-java-account-mgmt | 100.6s (baseline/claude-opus-4.6) | 100.6s | 100.6s (baseline/claude-opus-4.6) |
| storage-dp-java-blob-event-notifier | 101.2s (baseline/claude-opus-4.6) | 101.2s | 101.2s (baseline/claude-opus-4.6) |

⏱ **Slowest:** storage-dp-java-blob-event-notifier/baseline/claude-opus-4.6 · **Fastest:** storage-dp-java-crud/baseline/claude-opus-4.6

## Prompt Comparison

| Prompt | Total | Passed | Failed | Pass Rate |
|--------|-------|--------|--------|----------|
| storage-dp-java-blob-event-notifier | 1 | 0 | 1 | 0.0% |
| storage-dp-java-blob-manager | 1 | 0 | 1 | 0.0% |
| storage-dp-java-crud | 1 | 1 | 0 | 100.0% |
| storage-dp-java-encrypted-uploader | 1 | 0 | 1 | 0.0% |
| storage-mp-java-account-mgmt | 1 | 1 | 0 | 100.0% |

## Config Comparison

| Config | Total | Passed | Failed | Pass Rate |
|--------|-------|--------|--------|----------|
| baseline/claude-opus-4.6 | 5 | 2 | 3 | 40.0% |

