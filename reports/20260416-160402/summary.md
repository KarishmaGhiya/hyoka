# Evaluation Summary: 20260416-160402

## Run Statistics

| Metric | Value |
|--------|-------|
| Run ID | `20260416-160402` |
| Timestamp | 2026-04-16T23:04:02Z |
| Total Prompts | 1 |
| Total Configs | 3 |
| Total Evaluations | 3 |
| Passed | 0 |
| Failed | 3 |
| Errors | 0 |
| Duration | 380.9s |

## Comparison Matrix

| Prompt | azure-mcp/claude-sonnet-4.5 | baseline-skills/claude-sonnet-4.5 | baseline/claude-sonnet-4.5 |
|--------|--------|--------|--------|
| storage-dp-java-blob-manager | ❌ 12/24 | ❌ 9/24 | ❌ 13/24 |

## Detailed Results

| Prompt | Config | Result | Score | Duration | Files |
|--------|--------|--------|-------|----------|-------|
| [storage-dp-java-blob-manager](results/storage/data-plane/java/crud/azure-mcp/claude-sonnet-4.5/report.md) | azure-mcp/claude-sonnet-4.5 | ❌ | 12/24 | 380.8s | 7 |
| [storage-dp-java-blob-manager](results/storage/data-plane/java/crud/baseline-skills/claude-sonnet-4.5/report.md) | baseline-skills/claude-sonnet-4.5 | ❌ | 9/24 | 366.5s | 6 |
| [storage-dp-java-blob-manager](results/storage/data-plane/java/crud/baseline/claude-sonnet-4.5/report.md) | baseline/claude-sonnet-4.5 | ❌ | 13/24 | 380.7s | 6 |

## Duration Analysis (by Prompt)

| Prompt | Min | Avg | Max |
|--------|-----|-----|-----|
| storage-dp-java-blob-manager | 366.5s (baseline-skills/claude-sonnet-4.5) | 376.0s | 380.8s (azure-mcp/claude-sonnet-4.5) |

⏱ **Slowest:** storage-dp-java-blob-manager/azure-mcp/claude-sonnet-4.5 · **Fastest:** storage-dp-java-blob-manager/baseline-skills/claude-sonnet-4.5

## Prompt Comparison

| Prompt | Total | Passed | Failed | Pass Rate |
|--------|-------|--------|--------|----------|
| storage-dp-java-blob-manager | 3 | 0 | 3 | 0.0% |

## Config Comparison

| Config | Total | Passed | Failed | Pass Rate |
|--------|-------|--------|--------|----------|
| azure-mcp/claude-sonnet-4.5 | 1 | 0 | 1 | 0.0% |
| baseline-skills/claude-sonnet-4.5 | 1 | 0 | 1 | 0.0% |
| baseline/claude-sonnet-4.5 | 1 | 0 | 1 | 0.0% |

