# Performance Trends

**Generated:** 2026-05-02T00:56:47Z | **Total Evaluations:** 406

## 🤖 AI Analysis

**TOOL USAGE & RESOURCE IMPACT ANALYSIS**

---

### 1. TOOL USAGE COMPARISON

- **Baseline configs** (e.g., `baseline/claude-opus-4.6`, `baseline/gpt-5.4`):
  - Rely on basic tools: `create`, `edit`, `view`, `powershell`, `glob`, `report_intent`.
  - No Azure-specific tools; tool usage is mostly for file ops and shell commands.
  - Tool call counts are high for `create`, `view`, `powershell`.

- **Azure-MCP configs** (e.g., `azure-mcp/claude-opus-4.6`, `azure-mcp/gpt-5.4`):
  - Use all baseline tools plus Azure-specific: `azure-documentation`, `azure-get_azure_bestpractices`, `azure-servicebus`.
  - More diverse tool usage; Azure tools called in 20–50% of runs.
  - Tool call counts for Azure tools: `azure-documentation` (up to 8), `azure-get_azure_bestpractices` (up to 13).

---

### 2. RESOURCE IMPACT

- **Biggest improvement with tools:**  
  - No prompt shows a dramatic pass rate jump with tools; pass rates remain low (max 33%).
  - Some prompts (e.g., `storage-dp-java-crud`, `storage-mp-java-account-mgmt`, `storage-dp-js-ts-crud`) have isolated passes, but not consistently tied to tool access.
  - **Azure-specific tools** are used, but do not correlate with higher pass rates.

- **Similar performance with/without tools:**  
  - Most prompts (e.g., `identity-dp-js-ts-default-credential`, `key-vault-dp-js-ts-crud`, `cosmos-db-dp-js-ts-crud`) fail regardless of tool access.
  - Duration and tool usage are similar between configs.

---

### 3. KNOWLEDGE vs TOOLS

- **Baseline (no tools):**
  - Agent relies on built-in LLM knowledge, basic file and shell ops.
  - Struggles with Azure-specific tasks due to lack of contextual resources.

- **Tool-enhanced runs:**
  - Azure tools (`azure-documentation`, `azure-get_azure_bestpractices`) are most impactful for context, but not sufficient alone.
  - File ops and shell commands remain heavily used; Azure tools supplement but do not replace them.

---

### 4. RECOMMENDATIONS

- **Prompts needing more tools/resources:**
  - Prompts with complex Azure flows (e.g., `identity-dp-js-ts-default-credential`, `key-vault-dp-js-ts-crud`) would benefit from:
    - Live API reference access
    - Example code snippets
    - Azure CLI integration
    - Test harnesses for validation

- **Tools to add:**
  - Direct Azure SDK API querying
  - Automated test runners for generated code
  - More granular Azure service plugins (e.g., for Cosmos DB, Event Hubs)

---

### 5. QUALITY DELTA

- **Pass rates:**  
  - Remain extremely low (2% overall), with no config showing clear superiority.
- **File counts & durations:**  
  - Similar between configs; tool access does not reduce duration or increase output files.
- **Scores:**  
  - Not provided, but pass/fail trends show no significant improvement with tools.

---

**Summary:**  
Tool access (especially Azure-specific) increases the diversity of actions but does not yet translate to higher pass rates or quality. Most prompts remain unsolved regardless of toolset. To improve, add richer Azure integrations and automated validation. Focus on prompts with complex Azure flows for future tool/resource investment.

---

## Summary

| Metric | Value |
|--------|-------|
| Total Evaluations | 406 |
| Passed | 7 (2%) |
| Failed | 399 |
| Avg Score | 19.1 avg |
| Unique Prompts | 19 |
| Configs | 16 |

## ⚠️ Regression Alerts

- 📉 **storage-dp-java-crud** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-dp-js-ts-crud** / `baseline-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-dp-js-ts-crud** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-dp-js-ts-crud** / `azure-mcp-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-dp-js-ts-crud** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-dp-js-ts-crud** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-dp-js-ts-crud** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-dp-js-ts-crud** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **app-configuration-dp-js-ts-crud** / `azure-mcp-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **app-configuration-dp-js-ts-crud** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **app-configuration-dp-js-ts-crud** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **app-configuration-dp-js-ts-crud** / `baseline/claude-sonnet-4.5` — previously passing, now failing
- 📉 **app-configuration-dp-js-ts-crud** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **app-configuration-dp-js-ts-crud** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **app-configuration-dp-js-ts-crud** / `baseline-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **app-configuration-dp-js-ts-crud** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **cosmos-db-dp-js-ts-crud** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **cosmos-db-dp-js-ts-crud** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **cosmos-db-dp-js-ts-crud** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **cosmos-db-dp-js-ts-crud** / `baseline-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **cosmos-db-dp-js-ts-crud** / `azure-mcp-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **cosmos-db-dp-js-ts-crud** / `baseline/claude-sonnet-4.5` — previously passing, now failing
- 📉 **cosmos-db-dp-js-ts-crud** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **cosmos-db-dp-js-ts-crud** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **identity-dp-js-ts-default-credential** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **identity-dp-js-ts-default-credential** / `baseline-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **identity-dp-js-ts-default-credential** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **identity-dp-js-ts-default-credential** / `azure-mcp-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **identity-dp-js-ts-default-credential** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **identity-dp-js-ts-default-credential** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **identity-dp-js-ts-default-credential** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **event-hubs-dp-js-ts-streaming** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **event-hubs-dp-js-ts-streaming** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **event-hubs-dp-js-ts-streaming** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **event-hubs-dp-js-ts-streaming** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **event-hubs-dp-js-ts-streaming** / `baseline/claude-sonnet-4.5` — previously passing, now failing
- 📉 **event-hubs-dp-js-ts-streaming** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **event-hubs-dp-js-ts-streaming** / `azure-mcp-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-crud** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-crud** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-crud** / `baseline-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-crud** / `baseline/claude-sonnet-4.5` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-crud** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-crud** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-crud** / `azure-mcp-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-crud** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **identity-dp-js-ts-managed-identity** / `azure-mcp-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **identity-dp-js-ts-managed-identity** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **identity-dp-js-ts-managed-identity** / `baseline/claude-sonnet-4.5` — previously passing, now failing
- 📉 **identity-dp-js-ts-managed-identity** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **identity-dp-js-ts-managed-identity** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **identity-dp-js-ts-managed-identity** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **identity-dp-js-ts-managed-identity** / `baseline-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **identity-dp-js-ts-managed-identity** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **identity-dp-js-ts-service-principal** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **identity-dp-js-ts-service-principal** / `baseline-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **identity-dp-js-ts-service-principal** / `baseline/claude-sonnet-4.5` — previously passing, now failing
- 📉 **identity-dp-js-ts-service-principal** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **identity-dp-js-ts-service-principal** / `azure-mcp-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **identity-dp-js-ts-service-principal** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **identity-dp-js-ts-service-principal** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **identity-dp-js-ts-service-principal** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-secret-config** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-secret-config** / `baseline-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-secret-config** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-secret-config** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-secret-config** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-secret-config** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-secret-config** / `baseline/claude-sonnet-4.5` — previously passing, now failing
- 📉 **key-vault-dp-js-ts-secret-config** / `azure-mcp-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **service-bus-dp-js-ts-crud** / `baseline/claude-sonnet-4.5` — previously passing, now failing
- 📉 **service-bus-dp-js-ts-crud** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **service-bus-dp-js-ts-crud** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **service-bus-dp-js-ts-crud** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **service-bus-dp-js-ts-crud** / `baseline-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **service-bus-dp-js-ts-crud** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **service-bus-dp-js-ts-crud** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **resource-manager-mp-js-ts-rg-crud** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **resource-manager-mp-js-ts-rg-crud** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **resource-manager-mp-js-ts-rg-crud** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **resource-manager-mp-js-ts-rg-crud** / `baseline/claude-sonnet-4.5` — previously passing, now failing
- 📉 **resource-manager-mp-js-ts-rg-crud** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **resource-manager-mp-js-ts-rg-crud** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **resource-manager-mp-js-ts-rg-crud** / `azure-mcp-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **resource-manager-mp-js-ts-rg-crud** / `baseline-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-dp-js-ts-blob-manager** / `baseline/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-dp-js-ts-blob-manager** / `baseline-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-dp-js-ts-blob-manager** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-dp-js-ts-blob-manager** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-dp-js-ts-blob-manager** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-dp-js-ts-blob-manager** / `azure-mcp-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-dp-js-ts-blob-manager** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-dp-js-ts-encrypted-uploader** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-dp-js-ts-encrypted-uploader** / `baseline-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-dp-js-ts-encrypted-uploader** / `azure-mcp-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-dp-js-ts-encrypted-uploader** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-dp-js-ts-encrypted-uploader** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-dp-js-ts-encrypted-uploader** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-dp-js-ts-encrypted-uploader** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-dp-js-ts-encrypted-uploader** / `baseline/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-mp-js-ts-account-mgmt** / `azure-mcp/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-mp-js-ts-account-mgmt** / `baseline-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-mp-js-ts-account-mgmt** / `baseline-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-mp-js-ts-account-mgmt** / `azure-mcp-skills/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-mp-js-ts-account-mgmt** / `baseline/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-mp-js-ts-account-mgmt** / `azure-mcp/claude-opus-4.6` — previously passing, now failing
- 📉 **storage-mp-js-ts-account-mgmt** / `azure-mcp-skills/claude-sonnet-4.5` — previously passing, now failing
- 📉 **storage-mp-js-ts-account-mgmt** / `baseline/claude-sonnet-4.5` — previously passing, now failing

## Performance Over Time

| Prompt | Config | 20260416-1 | 20260430-1 | 20260430-1 | 20260430-1 | 20260430-1 | 20260501-1 | 20260501-1 | 20260501-1 | Trend |
|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|-------|
| storage-dp-java-blob-manager | azure-mcp/claude-sonnet-4.5 | — | — | — | — | — | — | — | — | 🆕 new |
| storage-dp-java-blob-manager | baseline-skills/claude-sonnet-4.5 | — | — | — | — | — | — | — | — | 🆕 new |
| storage-dp-java-blob-manager | baseline/claude-opus-4.6 | — | — | — | — | — | — | — | — | 🆕 new |
| storage-dp-java-blob-manager | baseline/claude-sonnet-4.5 | — | — | — | — | — | — | — | — | 🆕 new |
| storage-dp-java-crud | baseline/claude-opus-4.6 | — | — | — | — | — | — | — | — | 📉 regressing |
| storage-dp-java-encrypted-uploader | baseline/claude-opus-4.6 | — | — | — | — | — | — | — | — | 🆕 new |
| storage-dp-java-blob-event-notifier | baseline/claude-opus-4.6 | — | — | — | — | — | — | — | — | 🆕 new |
| storage-mp-java-account-mgmt | baseline/claude-opus-4.6 | — | — | — | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-crud | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 1.0m | — | ❌ 4.2m | — | — | — | 📉 regressing |
| storage-dp-js-ts-crud | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 55s | — | ❌ 3.2m | — | — | — | 📉 regressing |
| storage-dp-js-ts-crud | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 18s | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-crud | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 4.6m | — | — | — | 🆕 new |
| storage-dp-js-ts-crud | azure-mcp/claude-opus-4.6 | — | — | ❌ 54s | — | ❌ 4.2m | — | — | — | 📉 regressing |
| storage-dp-js-ts-crud | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 1.4m | — | ❌ 3.4m | — | — | — | 📉 regressing |
| storage-dp-js-ts-crud | azure-mcp/gpt-5.3-codex | — | — | ❌ 24s | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-crud | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 4.5m | — | — | — | 🆕 new |
| storage-dp-js-ts-crud | baseline-skills/claude-opus-4.6 | — | — | ❌ 1.3m | — | ❌ 4.1m | ❌ 2.8m | — | — | 📉 regressing |
| storage-dp-js-ts-crud | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 50s | — | ❌ 3.2m | ❌ 1.9m | — | — | 📉 regressing |
| storage-dp-js-ts-crud | baseline-skills/gpt-5.3-codex | — | — | ❌ 16s | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-crud | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 4.3m | — | — | — | 🆕 new |
| storage-dp-js-ts-crud | baseline/claude-opus-4.6 | ✅ 3.2m | — | ❌ 57s | — | ❌ 3.8m | ❌ 3.2m | — | — | 📉 regressing |
| storage-dp-js-ts-crud | baseline/claude-sonnet-4.5 | — | — | ❌ 1.0m | — | ❌ 2.9m | ✅ 1.6m | — | — | ⚠️ flaky |
| storage-dp-js-ts-crud | baseline/gpt-5.3-codex | — | — | ❌ 22s | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-crud | baseline/gpt-5.4 | — | — | — | — | ❌ 3.4m | — | — | — | 🆕 new |
| app-configuration-dp-js-ts-crud | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 56s | — | ❌ 4.1m | — | — | — | 📉 regressing |
| app-configuration-dp-js-ts-crud | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 1.8m | — | ❌ 4.1m | — | — | — | 📉 regressing |
| app-configuration-dp-js-ts-crud | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 23s | — | — | — | — | — | 🆕 new |
| app-configuration-dp-js-ts-crud | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 5.3m | — | — | — | 🆕 new |
| app-configuration-dp-js-ts-crud | azure-mcp/claude-opus-4.6 | — | — | ❌ 1.5m | — | ❌ 4.2m | — | — | — | 📉 regressing |
| app-configuration-dp-js-ts-crud | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 1.7m | — | ❌ 4.0m | — | — | — | 📉 regressing |
| app-configuration-dp-js-ts-crud | azure-mcp/gpt-5.3-codex | — | — | ❌ 42s | — | — | — | — | — | 🆕 new |
| app-configuration-dp-js-ts-crud | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 2.3m | — | — | — | 🆕 new |
| app-configuration-dp-js-ts-crud | baseline-skills/claude-opus-4.6 | — | — | ❌ 1.1m | — | ❌ 4.1m | ❌ 2.9m | — | — | 📉 regressing |
| app-configuration-dp-js-ts-crud | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 1.2m | — | ❌ 4.4m | ❌ 1.8m | — | — | 📉 regressing |
| app-configuration-dp-js-ts-crud | baseline-skills/gpt-5.3-codex | — | — | ❌ 27s | — | — | — | — | — | 🆕 new |
| app-configuration-dp-js-ts-crud | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 4.9m | — | — | — | 🆕 new |
| app-configuration-dp-js-ts-crud | baseline/claude-opus-4.6 | — | ❌ 1.2m | ❌ 1.2m | ❌ 4.8m | ❌ 4.0m | ❌ 3.3m | — | — | 📉 regressing |
| app-configuration-dp-js-ts-crud | baseline/claude-sonnet-4.5 | — | — | ❌ 1.2m | — | ❌ 3.5m | ❌ 2.3m | — | — | 📉 regressing |
| app-configuration-dp-js-ts-crud | baseline/gpt-5.3-codex | — | — | ❌ 22s | — | — | — | — | — | 🆕 new |
| app-configuration-dp-js-ts-crud | baseline/gpt-5.4 | — | — | — | — | ❌ 2.8m | — | — | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 1.1m | — | ❌ 4.9m | — | — | — | 📉 regressing |
| cosmos-db-dp-js-ts-crud | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 1.3m | — | ❌ 3.4m | — | — | — | 📉 regressing |
| cosmos-db-dp-js-ts-crud | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 32s | — | — | — | — | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 3.5m | — | — | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | azure-mcp/claude-opus-4.6 | — | — | ❌ 1.2m | — | ❌ 5.2m | — | — | — | 📉 regressing |
| cosmos-db-dp-js-ts-crud | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 1.1m | — | ❌ 3.8m | — | — | — | 📉 regressing |
| cosmos-db-dp-js-ts-crud | azure-mcp/gpt-5.3-codex | — | — | ❌ 35s | — | — | — | — | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 5.5m | — | — | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | baseline-skills/claude-opus-4.6 | — | — | ❌ 60s | — | ❌ 5.2m | ❌ 2.7m | — | — | 📉 regressing |
| cosmos-db-dp-js-ts-crud | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 51s | — | ❌ 3.1m | ❌ 1.7m | — | — | 📉 regressing |
| cosmos-db-dp-js-ts-crud | baseline-skills/gpt-5.3-codex | — | — | ❌ 22s | — | — | — | — | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 4.3m | — | — | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | baseline/claude-opus-4.6 | — | — | ❌ 51s | — | ❌ 4.2m | ❌ 3.0m | — | — | 📉 regressing |
| cosmos-db-dp-js-ts-crud | baseline/claude-sonnet-4.5 | — | — | ❌ 52s | — | ❌ 3.2m | ❌ 1.6m | — | — | 📉 regressing |
| cosmos-db-dp-js-ts-crud | baseline/gpt-5.3-codex | — | — | ❌ 18s | — | — | — | — | — | 🆕 new |
| cosmos-db-dp-js-ts-crud | baseline/gpt-5.4 | — | — | — | — | ❌ 3.7m | — | — | — | 🆕 new |
| identity-dp-js-ts-default-credential | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 52s | — | ❌ 49s | — | — | — | 📉 regressing |
| identity-dp-js-ts-default-credential | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 37s | — | ❌ 4.1m | — | — | — | 📉 regressing |
| identity-dp-js-ts-default-credential | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 28s | — | — | — | — | — | 🆕 new |
| identity-dp-js-ts-default-credential | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 56s | — | — | — | 🆕 new |
| identity-dp-js-ts-default-credential | azure-mcp/claude-opus-4.6 | — | — | ❌ 50s | — | ❌ 55s | — | — | — | 📉 regressing |
| identity-dp-js-ts-default-credential | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 41s | — | ❌ 10.3m | — | — | — | 📉 regressing |
| identity-dp-js-ts-default-credential | azure-mcp/gpt-5.3-codex | — | — | ❌ 47s | — | — | — | — | — | 🆕 new |
| identity-dp-js-ts-default-credential | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 1.2m | — | — | — | 🆕 new |
| identity-dp-js-ts-default-credential | baseline-skills/claude-opus-4.6 | — | — | ❌ 34s | — | ❌ 30s | ❌ 35s | — | — | 📉 regressing |
| identity-dp-js-ts-default-credential | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 32s | — | ❌ 33s | ❌ 50s | — | — | 📉 regressing |
| identity-dp-js-ts-default-credential | baseline-skills/gpt-5.3-codex | — | — | ❌ 23s | — | — | — | — | — | 🆕 new |
| identity-dp-js-ts-default-credential | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 40s | — | — | — | 🆕 new |
| identity-dp-js-ts-default-credential | baseline/claude-opus-4.6 | — | — | ❌ 33s | — | ❌ 27s | ❌ 28s | — | — | 📉 regressing |
| identity-dp-js-ts-default-credential | baseline/claude-sonnet-4.5 | — | — | ❌ 1.6m | — | ❌ 33s | ❌ 28s | ✅ 2.7m | ❌ 2.1m | ⚠️ flaky |
| identity-dp-js-ts-default-credential | baseline/gpt-5.3-codex | — | — | ❌ 25s | — | — | — | — | — | 🆕 new |
| identity-dp-js-ts-default-credential | baseline/gpt-5.4 | — | — | — | — | ❌ 37s | — | — | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 1.1m | — | ❌ 5.0m | — | — | — | 📉 regressing |
| event-hubs-dp-js-ts-streaming | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 1.6m | — | ❌ 3.4m | — | — | — | 📉 regressing |
| event-hubs-dp-js-ts-streaming | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 31s | — | — | — | — | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 4.5m | — | — | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | azure-mcp/claude-opus-4.6 | — | — | ❌ 60s | — | ❌ 4.8m | — | — | — | 📉 regressing |
| event-hubs-dp-js-ts-streaming | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 1.4m | — | ❌ 4.3m | — | — | — | 📉 regressing |
| event-hubs-dp-js-ts-streaming | azure-mcp/gpt-5.3-codex | — | — | ❌ 29s | — | — | — | — | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 4.0m | — | — | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | baseline-skills/claude-opus-4.6 | — | — | ❌ 56s | — | ❌ 4.1m | ❌ 4.4m | — | — | 📉 regressing |
| event-hubs-dp-js-ts-streaming | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 1.2m | — | ❌ 3.7m | ✅ 1.9m | — | — | ⚠️ flaky |
| event-hubs-dp-js-ts-streaming | baseline-skills/gpt-5.3-codex | — | — | ❌ 30s | — | — | — | — | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 5.1m | — | — | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | baseline/claude-opus-4.6 | — | — | ❌ 1.3m | — | ❌ 4.0m | ❌ 4.9m | — | — | 📉 regressing |
| event-hubs-dp-js-ts-streaming | baseline/claude-sonnet-4.5 | — | — | ❌ 1.2m | — | ❌ 3.4m | ❌ 2.1m | — | — | 📉 regressing |
| event-hubs-dp-js-ts-streaming | baseline/gpt-5.3-codex | — | — | ❌ 28s | — | — | — | — | — | 🆕 new |
| event-hubs-dp-js-ts-streaming | baseline/gpt-5.4 | — | — | — | — | ❌ 4.7m | — | — | — | 🆕 new |
| key-vault-dp-js-ts-crud | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 45s | — | ❌ 4.2m | — | — | — | 📉 regressing |
| key-vault-dp-js-ts-crud | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 1.1m | — | ❌ 3.8m | — | — | — | 📉 regressing |
| key-vault-dp-js-ts-crud | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 30s | — | — | — | — | — | 🆕 new |
| key-vault-dp-js-ts-crud | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 3.5m | — | — | — | 🆕 new |
| key-vault-dp-js-ts-crud | azure-mcp/claude-opus-4.6 | — | — | ❌ 50s | — | ❌ 4.1m | — | — | — | 📉 regressing |
| key-vault-dp-js-ts-crud | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 1.3m | — | ❌ 3.2m | — | — | — | 📉 regressing |
| key-vault-dp-js-ts-crud | azure-mcp/gpt-5.3-codex | — | — | ❌ 25s | — | — | — | — | — | 🆕 new |
| key-vault-dp-js-ts-crud | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 4.0m | — | — | — | 🆕 new |
| key-vault-dp-js-ts-crud | baseline-skills/claude-opus-4.6 | — | — | ❌ 42s | — | ❌ 3.9m | ❌ 2.7m | — | — | 📉 regressing |
| key-vault-dp-js-ts-crud | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 59s | — | ❌ 2.6m | ❌ 1.8m | — | — | 📉 regressing |
| key-vault-dp-js-ts-crud | baseline-skills/gpt-5.3-codex | — | — | ❌ 14s | — | — | — | — | — | 🆕 new |
| key-vault-dp-js-ts-crud | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 3.2m | — | — | — | 🆕 new |
| key-vault-dp-js-ts-crud | baseline/claude-opus-4.6 | — | — | ❌ 54s | — | ❌ 4.2m | ❌ 2.6m | — | — | 📉 regressing |
| key-vault-dp-js-ts-crud | baseline/claude-sonnet-4.5 | — | — | ❌ 57s | — | ❌ 3.3m | ❌ 1.6m | — | — | 📉 regressing |
| key-vault-dp-js-ts-crud | baseline/gpt-5.3-codex | — | — | ❌ 15s | — | — | — | — | — | 🆕 new |
| key-vault-dp-js-ts-crud | baseline/gpt-5.4 | — | — | — | — | ❌ 3.9m | — | — | — | 🆕 new |
| identity-dp-js-ts-managed-identity | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 44s | — | ❌ 47s | — | — | — | 📉 regressing |
| identity-dp-js-ts-managed-identity | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 3.3m | — | ❌ 50s | — | — | — | 📉 regressing |
| identity-dp-js-ts-managed-identity | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 39s | — | — | — | — | — | 🆕 new |
| identity-dp-js-ts-managed-identity | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 52s | — | — | — | 🆕 new |
| identity-dp-js-ts-managed-identity | azure-mcp/claude-opus-4.6 | — | — | ❌ 51s | — | ❌ 51s | — | — | — | 📉 regressing |
| identity-dp-js-ts-managed-identity | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 3.7m | — | ❌ 60s | — | — | — | 📉 regressing |
| identity-dp-js-ts-managed-identity | azure-mcp/gpt-5.3-codex | — | — | ❌ 33s | — | — | — | — | — | 🆕 new |
| identity-dp-js-ts-managed-identity | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 1.2m | — | — | — | 🆕 new |
| identity-dp-js-ts-managed-identity | baseline-skills/claude-opus-4.6 | — | — | ❌ 28s | — | ❌ 29s | ❌ 51s | — | — | 📉 regressing |
| identity-dp-js-ts-managed-identity | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 53s | — | ❌ 6.8m | ❌ 3.5m | — | — | 📉 regressing |
| identity-dp-js-ts-managed-identity | baseline-skills/gpt-5.3-codex | — | — | ❌ 26s | — | — | — | — | — | 🆕 new |
| identity-dp-js-ts-managed-identity | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 50s | — | — | — | 🆕 new |
| identity-dp-js-ts-managed-identity | baseline/claude-opus-4.6 | — | — | ❌ 29s | — | ❌ 31s | ❌ 27s | — | — | 📉 regressing |
| identity-dp-js-ts-managed-identity | baseline/claude-sonnet-4.5 | — | — | ❌ 3.5m | — | ❌ 7.2m | ❌ 2.6m | — | — | 📉 regressing |
| identity-dp-js-ts-managed-identity | baseline/gpt-5.3-codex | — | — | ❌ 28s | — | — | — | — | — | 🆕 new |
| identity-dp-js-ts-managed-identity | baseline/gpt-5.4 | — | — | — | — | ❌ 34s | — | — | — | 🆕 new |
| identity-dp-js-ts-service-principal | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 38s | — | ❌ 3.7m | — | — | — | 📉 regressing |
| identity-dp-js-ts-service-principal | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 1.8m | — | ❌ 45s | — | — | — | 📉 regressing |
| identity-dp-js-ts-service-principal | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 29s | — | — | — | — | — | 🆕 new |
| identity-dp-js-ts-service-principal | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 1.4m | — | — | — | 🆕 new |
| identity-dp-js-ts-service-principal | azure-mcp/claude-opus-4.6 | — | — | ❌ 34s | — | ❌ 2.5m | — | — | — | 📉 regressing |
| identity-dp-js-ts-service-principal | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 44s | — | ❌ 40s | — | — | — | 📉 regressing |
| identity-dp-js-ts-service-principal | azure-mcp/gpt-5.3-codex | — | — | ❌ 30s | — | — | — | — | — | 🆕 new |
| identity-dp-js-ts-service-principal | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 43s | — | — | — | 🆕 new |
| identity-dp-js-ts-service-principal | baseline-skills/claude-opus-4.6 | — | — | ❌ 23s | — | ❌ 18s | ❌ 1.7m | — | — | 📉 regressing |
| identity-dp-js-ts-service-principal | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 35s | — | ❌ 5.0m | ❌ 2.3m | — | — | 📉 regressing |
| identity-dp-js-ts-service-principal | baseline-skills/gpt-5.3-codex | — | — | ❌ 17s | — | — | — | — | — | 🆕 new |
| identity-dp-js-ts-service-principal | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 24s | — | — | — | 🆕 new |
| identity-dp-js-ts-service-principal | baseline/claude-opus-4.6 | — | — | ❌ 20s | — | ❌ 25s | ❌ 1.3m | — | — | 📉 regressing |
| identity-dp-js-ts-service-principal | baseline/claude-sonnet-4.5 | — | — | ❌ 37s | — | ❌ 4.0m | ❌ 2.1m | — | — | 📉 regressing |
| identity-dp-js-ts-service-principal | baseline/gpt-5.3-codex | — | — | ❌ 25s | — | — | — | — | — | 🆕 new |
| identity-dp-js-ts-service-principal | baseline/gpt-5.4 | — | — | — | — | ❌ 21s | — | — | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 2.0m | — | ❌ 5.1m | — | — | — | 📉 regressing |
| key-vault-dp-js-ts-secret-config | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 2.8m | — | ❌ 7.9m | — | — | — | 📉 regressing |
| key-vault-dp-js-ts-secret-config | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 27s | — | — | — | — | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 6.8m | — | — | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | azure-mcp/claude-opus-4.6 | — | — | ❌ 1.3m | — | ❌ 5.9m | — | — | — | 📉 regressing |
| key-vault-dp-js-ts-secret-config | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 2.4m | — | ❌ 9.8m | — | — | — | 📉 regressing |
| key-vault-dp-js-ts-secret-config | azure-mcp/gpt-5.3-codex | — | — | ❌ 20s | — | — | — | — | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 6.5m | — | — | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | baseline-skills/claude-opus-4.6 | — | — | ❌ 1.7m | — | ❌ 6.5m | ❌ 5.0m | — | — | 📉 regressing |
| key-vault-dp-js-ts-secret-config | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 2.3m | — | ❌ 9.6m | ❌ 7.0m | — | — | 📉 regressing |
| key-vault-dp-js-ts-secret-config | baseline-skills/gpt-5.3-codex | — | — | ❌ 22s | — | — | — | — | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 6.1m | — | — | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | baseline/claude-opus-4.6 | — | — | ❌ 1.4m | — | ❌ 5.7m | ❌ 3.5m | — | — | 📉 regressing |
| key-vault-dp-js-ts-secret-config | baseline/claude-sonnet-4.5 | — | — | ❌ 1.9m | — | ❌ 6.1m | ❌ 5.8m | — | — | 📉 regressing |
| key-vault-dp-js-ts-secret-config | baseline/gpt-5.3-codex | — | — | ❌ 18s | — | — | — | — | — | 🆕 new |
| key-vault-dp-js-ts-secret-config | baseline/gpt-5.4 | — | — | — | — | ❌ 7.4m | — | — | — | 🆕 new |
| service-bus-dp-js-ts-crud | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 60s | — | — | — | — | — | 🆕 new |
| service-bus-dp-js-ts-crud | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 1.3m | — | ❌ 4.2m | — | — | — | 📉 regressing |
| service-bus-dp-js-ts-crud | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 30s | — | — | — | — | — | 🆕 new |
| service-bus-dp-js-ts-crud | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 5.0m | — | — | — | 🆕 new |
| service-bus-dp-js-ts-crud | azure-mcp/claude-opus-4.6 | — | — | ❌ 1.7m | — | ❌ 5.4m | — | — | — | 📉 regressing |
| service-bus-dp-js-ts-crud | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 1.8m | — | ❌ 3.7m | — | — | — | 📉 regressing |
| service-bus-dp-js-ts-crud | azure-mcp/gpt-5.3-codex | — | — | ❌ 27s | — | — | — | — | — | 🆕 new |
| service-bus-dp-js-ts-crud | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 3.6m | — | — | — | 🆕 new |
| service-bus-dp-js-ts-crud | baseline-skills/claude-opus-4.6 | — | — | ❌ 1.2m | — | ❌ 4.5m | ❌ 2.8m | — | — | 📉 regressing |
| service-bus-dp-js-ts-crud | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 1.5m | — | ❌ 4.9m | ❌ 2.5m | — | — | 📉 regressing |
| service-bus-dp-js-ts-crud | baseline-skills/gpt-5.3-codex | — | — | ❌ 24s | — | — | — | — | — | 🆕 new |
| service-bus-dp-js-ts-crud | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 3.9m | — | — | — | 🆕 new |
| service-bus-dp-js-ts-crud | baseline/claude-opus-4.6 | — | — | ❌ 1.0m | — | ❌ 4.5m | ❌ 2.6m | — | — | 📉 regressing |
| service-bus-dp-js-ts-crud | baseline/claude-sonnet-4.5 | — | — | ❌ 1.9m | — | ❌ 3.9m | ❌ 1.5m | — | — | 📉 regressing |
| service-bus-dp-js-ts-crud | baseline/gpt-5.3-codex | — | — | ❌ 18s | — | — | — | — | — | 🆕 new |
| service-bus-dp-js-ts-crud | baseline/gpt-5.4 | — | — | — | — | ❌ 3.7m | — | — | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 1.4m | — | ❌ 4.7m | — | — | — | 📉 regressing |
| resource-manager-mp-js-ts-rg-crud | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 1.3m | — | ❌ 3.4m | — | — | — | 📉 regressing |
| resource-manager-mp-js-ts-rg-crud | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 30s | — | — | — | — | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 4.2m | — | — | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | azure-mcp/claude-opus-4.6 | — | — | ❌ 1.0m | — | ❌ 4.0m | — | — | — | 📉 regressing |
| resource-manager-mp-js-ts-rg-crud | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 59s | — | ❌ 4.2m | — | — | — | 📉 regressing |
| resource-manager-mp-js-ts-rg-crud | azure-mcp/gpt-5.3-codex | — | — | ❌ 19s | — | — | — | — | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 5.2m | — | — | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | baseline-skills/claude-opus-4.6 | — | — | ❌ 45s | — | ❌ 3.9m | ❌ 3.6m | — | — | 📉 regressing |
| resource-manager-mp-js-ts-rg-crud | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 1.0m | — | ❌ 3.8m | ❌ 2.1m | — | — | 📉 regressing |
| resource-manager-mp-js-ts-rg-crud | baseline-skills/gpt-5.3-codex | — | — | ❌ 13s | — | — | — | — | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 3.8m | — | — | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | baseline/claude-opus-4.6 | — | — | ❌ 56s | — | ❌ 3.9m | ❌ 3.1m | — | — | 📉 regressing |
| resource-manager-mp-js-ts-rg-crud | baseline/claude-sonnet-4.5 | — | — | ❌ 1.1m | — | ❌ 3.3m | ❌ 1.7m | — | — | 📉 regressing |
| resource-manager-mp-js-ts-rg-crud | baseline/gpt-5.3-codex | — | — | ❌ 14s | — | — | — | — | — | 🆕 new |
| resource-manager-mp-js-ts-rg-crud | baseline/gpt-5.4 | — | — | — | — | ❌ 4.0m | — | — | — | 🆕 new |
| storage-dp-js-ts-blob-manager | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 1.0m | — | ❌ 6.2m | — | — | — | 📉 regressing |
| storage-dp-js-ts-blob-manager | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 2.7m | — | ❌ 5.5m | — | — | — | 📉 regressing |
| storage-dp-js-ts-blob-manager | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 1.1m | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-blob-manager | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 6.4m | — | — | — | 🆕 new |
| storage-dp-js-ts-blob-manager | azure-mcp/claude-opus-4.6 | — | — | ❌ 1.3m | — | ❌ 6.3m | — | — | — | 📉 regressing |
| storage-dp-js-ts-blob-manager | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 2.3m | — | ❌ 7.1m | — | — | — | 📉 regressing |
| storage-dp-js-ts-blob-manager | azure-mcp/gpt-5.3-codex | — | — | ❌ 1.1m | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-blob-manager | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 6.7m | — | — | — | 🆕 new |
| storage-dp-js-ts-blob-manager | baseline-skills/claude-opus-4.6 | — | — | ❌ 1.7m | — | ❌ 6.2m | ❌ 3.4m | — | — | 📉 regressing |
| storage-dp-js-ts-blob-manager | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 1.3m | — | ❌ 7.2m | ❌ 5.2m | — | — | 📉 regressing |
| storage-dp-js-ts-blob-manager | baseline-skills/gpt-5.3-codex | — | — | ❌ 42s | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-blob-manager | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 5.7m | — | — | — | 🆕 new |
| storage-dp-js-ts-blob-manager | baseline/claude-opus-4.6 | — | — | ❌ 2.0m | — | ❌ 6.1m | ✅ 3.6m | — | — | ⚠️ flaky |
| storage-dp-js-ts-blob-manager | baseline/claude-sonnet-4.5 | — | — | ❌ 2.7m | — | ❌ 5.7m | ❌ 5.4m | — | — | 📉 regressing |
| storage-dp-js-ts-blob-manager | baseline/gpt-5.3-codex | — | — | ❌ 1.0m | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-blob-manager | baseline/gpt-5.4 | — | — | — | — | ❌ 6.5m | — | — | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 2.1m | — | ❌ 6.9m | — | — | — | 📉 regressing |
| storage-dp-js-ts-encrypted-uploader | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 2.8m | — | ❌ 9.8m | — | — | — | 📉 regressing |
| storage-dp-js-ts-encrypted-uploader | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 49s | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 4.6m | — | — | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | azure-mcp/claude-opus-4.6 | — | — | ❌ 2.0m | — | ❌ 6.8m | — | — | — | 📉 regressing |
| storage-dp-js-ts-encrypted-uploader | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 2.1m | — | ❌ 6.7m | — | — | — | 📉 regressing |
| storage-dp-js-ts-encrypted-uploader | azure-mcp/gpt-5.3-codex | — | — | ❌ 1.2m | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 8.1m | — | — | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | baseline-skills/claude-opus-4.6 | — | — | ❌ 2.7m | — | ❌ 5.9m | ❌ 4.8m | — | — | 📉 regressing |
| storage-dp-js-ts-encrypted-uploader | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 2.6m | — | ❌ 8.0m | ❌ 5.2m | — | — | 📉 regressing |
| storage-dp-js-ts-encrypted-uploader | baseline-skills/gpt-5.3-codex | — | — | ❌ 56s | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 6.2m | — | — | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | baseline/claude-opus-4.6 | — | — | ❌ 1.5m | — | ❌ 3.8m | ❌ 3.8m | — | — | 📉 regressing |
| storage-dp-js-ts-encrypted-uploader | baseline/claude-sonnet-4.5 | — | — | ❌ 1.6m | — | ❌ 7.3m | ❌ 3.4m | — | — | 📉 regressing |
| storage-dp-js-ts-encrypted-uploader | baseline/gpt-5.3-codex | — | — | ❌ 50s | — | — | — | — | — | 🆕 new |
| storage-dp-js-ts-encrypted-uploader | baseline/gpt-5.4 | — | — | — | — | ❌ 7.0m | — | — | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | azure-mcp-skills/claude-opus-4.6 | — | — | ❌ 1.6m | — | ❌ 5.4m | — | — | — | 📉 regressing |
| storage-mp-js-ts-account-mgmt | azure-mcp-skills/claude-sonnet-4.5 | — | — | ❌ 1.3m | — | ❌ 5.4m | — | — | — | 📉 regressing |
| storage-mp-js-ts-account-mgmt | azure-mcp-skills/gpt-5.3-codex | — | — | ❌ 22s | — | — | — | — | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | azure-mcp-skills/gpt-5.4 | — | — | — | — | ❌ 5.3m | — | — | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | azure-mcp/claude-opus-4.6 | — | — | ❌ 1.6m | — | ❌ 4.7m | — | — | — | 📉 regressing |
| storage-mp-js-ts-account-mgmt | azure-mcp/claude-sonnet-4.5 | — | — | ❌ 1.5m | — | ❌ 4.1m | — | — | — | 📉 regressing |
| storage-mp-js-ts-account-mgmt | azure-mcp/gpt-5.3-codex | — | — | ❌ 17s | — | — | — | — | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | azure-mcp/gpt-5.4 | — | — | — | — | ❌ 5.1m | — | — | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | baseline-skills/claude-opus-4.6 | — | — | ❌ 1.3m | — | ❌ 4.4m | ❌ 2.4m | — | — | 📉 regressing |
| storage-mp-js-ts-account-mgmt | baseline-skills/claude-sonnet-4.5 | — | — | ❌ 60s | — | ❌ 3.8m | ❌ 2.1m | — | — | 📉 regressing |
| storage-mp-js-ts-account-mgmt | baseline-skills/gpt-5.3-codex | — | — | ❌ 16s | — | — | — | — | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | baseline-skills/gpt-5.4 | — | — | — | — | ❌ 4.9m | — | — | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | baseline/claude-opus-4.6 | — | — | ❌ 1.0m | — | ❌ 4.8m | ❌ 2.7m | — | — | 📉 regressing |
| storage-mp-js-ts-account-mgmt | baseline/claude-sonnet-4.5 | — | — | ❌ 57s | — | ❌ 4.4m | ❌ 1.9m | — | — | 📉 regressing |
| storage-mp-js-ts-account-mgmt | baseline/gpt-5.3-codex | — | — | ❌ 19s | — | — | — | — | — | 🆕 new |
| storage-mp-js-ts-account-mgmt | baseline/gpt-5.4 | — | — | — | — | ❌ 4.2m | — | — | — | 🆕 new |

## Config Comparison

| Config | Runs | Pass Rate | Avg Duration | Avg Score |
|--------|------|-----------|--------------|----------|
| azure-mcp-skills/gpt-5.3-codex | 14 | 0% | 32s | — |
| baseline/gpt-5.4 | 14 | 0% | 3.8m | 18.0 avg |
| baseline-skills/claude-sonnet-4.5 | 43 | 2% | 3.0m | 19.0 avg |
| baseline-skills/claude-opus-4.6 | 42 | 0% | 2.6m | 20.5 avg |
| azure-mcp/gpt-5.4 | 14 | 0% | 4.2m | 19.4 avg |
| azure-mcp-skills/gpt-5.4 | 14 | 0% | 4.1m | 17.5 avg |
| azure-mcp-skills/claude-opus-4.6 | 27 | 0% | 2.7m | 20.4 avg |
| azure-mcp/claude-sonnet-4.5 | 29 | 0% | 3.3m | 17.8 avg |
| baseline/claude-sonnet-4.5 | 45 | 4% | 2.8m | 18.9 avg |
| baseline/claude-opus-4.6 | 52 | 8% | 2.5m | 20.0 avg |
| azure-mcp/gpt-5.3-codex | 14 | 0% | 35s | — |
| azure-mcp-skills/claude-sonnet-4.5 | 28 | 0% | 3.0m | 18.2 avg |
| baseline-skills/gpt-5.3-codex | 14 | 0% | 25s | — |
| baseline/gpt-5.3-codex | 14 | 0% | 26s | — |
| azure-mcp/claude-opus-4.6 | 28 | 0% | 2.7m | 19.2 avg |
| baseline-skills/gpt-5.4 | 14 | 0% | 3.9m | 17.9 avg |

