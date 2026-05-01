# Performance Trends

**Generated:** 2026-04-30T23:52:24Z | **Total Evaluations:** 181

## 🤖 AI Analysis

**TOOL USAGE & RESOURCE IMPACT ANALYSIS**

---

### 1. TOOL USAGE COMPARISON

- **Baseline configs** (e.g., `baseline/gpt-5.3-codex`, `baseline/claude-opus-4.6`):
  - Relied on: `powershell`, `view`, `glob`, `create`, `report_intent`
  - No Azure-specific tools; some runs used only built-in knowledge (no tool calls)
- **Azure-MCP configs** (e.g., `azure-mcp/claude-opus-4.6`, `azure-mcp/gpt-5.3-codex`):
  - Used all baseline tools plus: `azure-get_azure_bestpractices`, `azure-documentation`, `azure-servicebus`, `web_fetch`, `sql`
  - More frequent and diverse tool usage, especially Azure-specific tools

**Tool call counts:** Azure-MCP configs consistently made more tool calls per run, especially for Azure-specific helpers.

---

### 2. RESOURCE IMPACT

- **Biggest improvement with tools:**  
  - No prompt showed a significant pass rate increase with tools; pass rates remained extremely low (2% overall).
  - Prompts like `storage-dp-java-crud` and `storage-mp-java-account-mgmt` had the only passes, but these were in baseline configs, not tool-enhanced ones.
- **Similar performance:**  
  - Most prompts (e.g., `identity-dp-js-ts-default-credential`, `key-vault-dp-js-ts-crud`, `event-hubs-dp-js-ts-streaming`) failed across all configs, regardless of tool access.

---

### 3. KNOWLEDGE vs TOOLS

- **Baseline (no tools):**
  - Relied on model’s internal knowledge and generic tools (`powershell`, `view`, `glob`).
  - Many runs had no tool usage at all, especially for simple CRUD or identity prompts.
- **Tool-enhanced runs:**
  - Azure-specific tools (`azure-get_azure_bestpractices`, `azure-documentation`, `azure-servicebus`) were used, but not consistently.
  - Most impactful: `azure-get_azure_bestpractices` and `azure-documentation` (used in identity and key vault prompts), but did not translate to higher pass rates.

---

### 4. RECOMMENDATIONS

- **Prompts needing more tools/resources:**
  - Prompts with zero passes and only generic tool usage (e.g., `identity-dp-js-ts-default-credential`, `event-hubs-dp-js-ts-streaming`) would benefit from more targeted Azure SDK helpers or code validation tools.
- **Tools to add:**
  - Add tools for code linting, Azure SDK API reference lookup, and live code execution/testing.
  - Increase use of Azure-specific tools—ensure agents are prompted to leverage them for relevant prompts.

---

### 5. QUALITY DELTA

- **Pass rates:** No significant improvement with tools (2% overall, passes occurred in baseline).
- **File counts & durations:** Tool-enhanced runs often took longer (more tool calls), but did not yield better results.
- **Scores:** Not provided, but pass/fail and durations suggest tool access alone is not enough—agent prompting and tool integration need improvement.

---

**Summary:**  
Tool access increased resource usage and tool diversity, but did not improve pass rates. Most prompts failed regardless of tool availability. Stronger integration of Azure-specific tools and additional validation/testing resources are needed to realize quality gains.

---

## Summary

| Metric | Value |
|--------|-------|
| Total Evaluations | 181 |
| Passed | 3 (2%) |
| Failed | 178 |
| Avg Score | 15.7 avg |
| Unique Prompts | 19 |
| Configs | 12 |

## ⚠️ Regression Alerts

- 📉 **storage-dp-java-crud** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-dp-js-ts-crud** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **app-configuration-dp-js-ts-crud** / `baseline/claude-opus-4.6` — previously passing, now failing

## Performance Over Time

| Prompt | Config | 20260416-1 | 20260416-1 | 20260416-1 | 20260416-1 | 20260416-1 | 20260430-1 | 20260430-1 | 20260430-1 | Trend |
|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|-------|
| storage-dp-java-blob-manager | azure-mcp/claude-sonnet-4.5 | ❌ 6.3m | — | — | — | — | — | — | — | 🆕 new |
| storage-dp-java-blob-manager | baseline-skills/claude-sonnet-4.5 | ❌ 6.1m | — | — | — | — | — | — | — | 🆕 new |
| storage-dp-java-blob-manager | baseline/claude-opus-4.6 | — | ❌ 1.7m | — | — | — | — | — | — | 🆕 new |
| storage-dp-java-blob-manager | baseline/claude-sonnet-4.5 | ❌ 6.3m | — | — | — | — | — | — | — | 🆕 new |
| storage-dp-java-crud | baseline/claude-opus-4.6 | — | ✅ 1.7m | ❌ 3.6m | ❌ 3.9m | — | — | — | — | 📉 regressing |
| storage-dp-java-encrypted-uploader | baseline/claude-opus-4.6 | — | ❌ 1.7m | — | — | — | — | — | — | 🆕 new |
| storage-dp-java-blob-event-notifier | baseline/claude-opus-4.6 | — | ❌ 1.7m | — | — | — | — | — | — | 🆕 new |
| storage-mp-java-account-mgmt | baseline/claude-opus-4.6 | — | ✅ 1.7m | — | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-crud | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.0m | — | 🆕 new |
| storage-dp-js-ts-crud | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 55s | — | 🆕 new |
| storage-dp-js-ts-crud | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 18s | — | 🆕 new |
| storage-dp-js-ts-crud | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 54s | — | 🆕 new |
| storage-dp-js-ts-crud | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.4m | — | 🆕 new |
| storage-dp-js-ts-crud | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 24s | — | 🆕 new |
| storage-dp-js-ts-crud | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.3m | — | 🆕 new |
| storage-dp-js-ts-crud | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 50s | — | 🆕 new |
| storage-dp-js-ts-crud | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 16s | — | 🆕 new |
| storage-dp-js-ts-crud | baseline/claude-opus-4.6 | — | — | — | — | ✅ 3.2m | — | ❌ 57s | — | 📉 regressing |
| storage-dp-js-ts-crud | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.0m | — | 🆕 new |
| storage-dp-js-ts-crud | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 22s | — | 🆕 new |
| app-configuration-dp-js-ts-crud | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 56s | — | 🆕 new |
| app-configuration-dp-js-ts-crud | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.8m | — | 🆕 new |
| app-configuration-dp-js-ts-crud | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 23s | — | 🆕 new |
| app-configuration-dp-js-ts-crud | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.5m | — | 🆕 new |
| app-configuration-dp-js-ts-crud | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.7m | — | 🆕 new |
| app-configuration-dp-js-ts-crud | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 42s | — | 🆕 new |
| app-configuration-dp-js-ts-crud | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.1m | — | 🆕 new |
| app-configuration-dp-js-ts-crud | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.2m | — | 🆕 new |
| app-configuration-dp-js-ts-crud | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 27s | — | 🆕 new |
| app-configuration-dp-js-ts-crud | baseline/claude-opus-4.6 | — | — | — | — | — | ❌ 1.2m | ❌ 1.2m | ❌ 4.8m | 📉 regressing |
| app-configuration-dp-js-ts-crud | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.2m | — | 🆕 new |
| app-configuration-dp-js-ts-crud | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 22s | — | 🆕 new |
| identity-dp-js-ts-default-credential | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 52s | — | 🆕 new |
| identity-dp-js-ts-default-credential | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 37s | — | 🆕 new |
| identity-dp-js-ts-default-credential | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 28s | — | 🆕 new |
| identity-dp-js-ts-default-credential | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 50s | — | 🆕 new |
| identity-dp-js-ts-default-credential | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 41s | — | 🆕 new |
| identity-dp-js-ts-default-credential | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 47s | — | 🆕 new |
| identity-dp-js-ts-default-credential | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 34s | — | 🆕 new |
| identity-dp-js-ts-default-credential | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 32s | — | 🆕 new |
| identity-dp-js-ts-default-credential | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 23s | — | 🆕 new |
| identity-dp-js-ts-default-credential | baseline/claude-opus-4.6 | — | — | — | — | — | — | ❌ 33s | — | 🆕 new |
| identity-dp-js-ts-default-credential | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.6m | — | 🆕 new |
| identity-dp-js-ts-default-credential | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 25s | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.1m | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.3m | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 32s | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.2m | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.1m | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 35s | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 60s | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 51s | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 22s | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | baseline/claude-opus-4.6 | — | — | — | — | — | — | ❌ 51s | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 52s | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 18s | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.1m | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.6m | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 31s | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 60s | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.4m | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 29s | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 56s | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.2m | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 30s | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | baseline/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.3m | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.2m | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 28s | — | 🆕 new |
| key-vault-dp-js-ts-crud | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 45s | — | 🆕 new |
| key-vault-dp-js-ts-crud | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.1m | — | 🆕 new |
| key-vault-dp-js-ts-crud | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 30s | — | 🆕 new |
| key-vault-dp-js-ts-crud | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 50s | — | 🆕 new |
| key-vault-dp-js-ts-crud | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.3m | — | 🆕 new |
| key-vault-dp-js-ts-crud | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 25s | — | 🆕 new |
| key-vault-dp-js-ts-crud | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 42s | — | 🆕 new |
| key-vault-dp-js-ts-crud | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 59s | — | 🆕 new |
| key-vault-dp-js-ts-crud | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 14s | — | 🆕 new |
| key-vault-dp-js-ts-crud | baseline/claude-opus-4.6 | — | — | — | — | — | — | ❌ 54s | — | 🆕 new |
| key-vault-dp-js-ts-crud | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 57s | — | 🆕 new |
| key-vault-dp-js-ts-crud | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 15s | — | 🆕 new |
| identity-dp-js-ts-managed-identity | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 44s | — | 🆕 new |
| identity-dp-js-ts-managed-identity | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 3.3m | — | 🆕 new |
| identity-dp-js-ts-managed-identity | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 39s | — | 🆕 new |
| identity-dp-js-ts-managed-identity | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 51s | — | 🆕 new |
| identity-dp-js-ts-managed-identity | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 3.7m | — | 🆕 new |
| identity-dp-js-ts-managed-identity | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 33s | — | 🆕 new |
| identity-dp-js-ts-managed-identity | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 28s | — | 🆕 new |
| identity-dp-js-ts-managed-identity | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 53s | — | 🆕 new |
| identity-dp-js-ts-managed-identity | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 26s | — | 🆕 new |
| identity-dp-js-ts-managed-identity | baseline/claude-opus-4.6 | — | — | — | — | — | — | ❌ 29s | — | 🆕 new |
| identity-dp-js-ts-managed-identity | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 3.5m | — | 🆕 new |
| identity-dp-js-ts-managed-identity | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 28s | — | 🆕 new |
| identity-dp-js-ts-service-principal | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 38s | — | 🆕 new |
| identity-dp-js-ts-service-principal | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.8m | — | 🆕 new |
| identity-dp-js-ts-service-principal | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 29s | — | 🆕 new |
| identity-dp-js-ts-service-principal | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 34s | — | 🆕 new |
| identity-dp-js-ts-service-principal | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 44s | — | 🆕 new |
| identity-dp-js-ts-service-principal | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 30s | — | 🆕 new |
| identity-dp-js-ts-service-principal | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 23s | — | 🆕 new |
| identity-dp-js-ts-service-principal | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 35s | — | 🆕 new |
| identity-dp-js-ts-service-principal | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 17s | — | 🆕 new |
| identity-dp-js-ts-service-principal | baseline/claude-opus-4.6 | — | — | — | — | — | — | ❌ 20s | — | 🆕 new |
| identity-dp-js-ts-service-principal | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 37s | — | 🆕 new |
| identity-dp-js-ts-service-principal | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 25s | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 2.0m | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 2.8m | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 27s | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.3m | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 2.4m | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 20s | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.7m | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 2.3m | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 22s | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | baseline/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.4m | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.9m | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 18s | — | 🆕 new |
| service-bus-dp-js-ts-crud | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 60s | — | 🆕 new |
| service-bus-dp-js-ts-crud | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.3m | — | 🆕 new |
| service-bus-dp-js-ts-crud | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 30s | — | 🆕 new |
| service-bus-dp-js-ts-crud | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.7m | — | 🆕 new |
| service-bus-dp-js-ts-crud | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.8m | — | 🆕 new |
| service-bus-dp-js-ts-crud | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 27s | — | 🆕 new |
| service-bus-dp-js-ts-crud | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.2m | — | 🆕 new |
| service-bus-dp-js-ts-crud | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.5m | — | 🆕 new |
| service-bus-dp-js-ts-crud | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 24s | — | 🆕 new |
| service-bus-dp-js-ts-crud | baseline/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.0m | — | 🆕 new |
| service-bus-dp-js-ts-crud | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.9m | — | 🆕 new |
| service-bus-dp-js-ts-crud | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 18s | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.4m | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.3m | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 30s | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.0m | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 59s | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 19s | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 45s | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.0m | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 13s | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | baseline/claude-opus-4.6 | — | — | — | — | — | — | ❌ 56s | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.1m | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 14s | — | 🆕 new |
| storage-dp-js-ts-blob-manager | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.0m | — | 🆕 new |
| storage-dp-js-ts-blob-manager | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 2.7m | — | 🆕 new |
| storage-dp-js-ts-blob-manager | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 1.1m | — | 🆕 new |
| storage-dp-js-ts-blob-manager | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.3m | — | 🆕 new |
| storage-dp-js-ts-blob-manager | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 2.3m | — | 🆕 new |
| storage-dp-js-ts-blob-manager | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 1.1m | — | 🆕 new |
| storage-dp-js-ts-blob-manager | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.7m | — | 🆕 new |
| storage-dp-js-ts-blob-manager | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.3m | — | 🆕 new |
| storage-dp-js-ts-blob-manager | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 42s | — | 🆕 new |
| storage-dp-js-ts-blob-manager | baseline/claude-opus-4.6 | — | — | — | — | — | — | ❌ 2.0m | — | 🆕 new |
| storage-dp-js-ts-blob-manager | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 2.7m | — | 🆕 new |
| storage-dp-js-ts-blob-manager | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 1.0m | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 2.1m | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 2.8m | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 49s | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 2.0m | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 2.1m | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 1.2m | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 2.7m | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 2.6m | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 56s | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | baseline/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.5m | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.6m | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 50s | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | azure-mcp-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.6m | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | azure-mcp-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.3m | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | azure-mcp-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 22s | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | azure-mcp/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.6m | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 1.5m | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | azure-mcp/gpt-5.3-codex | — | — | — | — | — | — | ❌ 17s | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | baseline-skills/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.3m | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 60s | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | baseline-skills/gpt-5.3-codex | — | — | — | — | — | — | ❌ 16s | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | baseline/claude-opus-4.6 | — | — | — | — | — | — | ❌ 1.0m | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | ❌ 57s | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | baseline/gpt-5.3-codex | — | — | — | — | — | — | ❌ 19s | — | 🆕 new |

## Config Comparison

| Config | Runs | Pass Rate | Avg Duration | Avg Score |
|--------|------|-----------|--------------|----------|
| baseline/claude-opus-4.6 | 24 | 12% | 1.7m | 19.0 avg |
| azure-mcp/claude-opus-4.6 | 14 | 0% | 1.2m | — |
| azure-mcp/gpt-5.3-codex | 14 | 0% | 35s | — |
| azure-mcp-skills/claude-sonnet-4.5 | 14 | 0% | 1.8m | — |
| baseline-skills/claude-opus-4.6 | 14 | 0% | 1.1m | — |
| azure-mcp-skills/gpt-5.3-codex | 14 | 0% | 32s | — |
| azure-mcp/claude-sonnet-4.5 | 15 | 0% | 2.0m | 12.0 avg |
| baseline/claude-sonnet-4.5 | 15 | 0% | 1.8m | 13.0 avg |
| baseline-skills/claude-sonnet-4.5 | 15 | 0% | 1.5m | 9.0 avg |
| baseline/gpt-5.3-codex | 14 | 0% | 26s | — |
| baseline-skills/gpt-5.3-codex | 14 | 0% | 25s | — |
| azure-mcp-skills/claude-opus-4.6 | 14 | 0% | 1.2m | — |

