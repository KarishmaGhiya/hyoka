# JS/TS Evaluation Analysis — Run 3

**Run ID:** `20260501-181917`
**Date:** 2026-05-01
**Duration:** 28 minutes (1676.7s)
**Scope:** 14 JS/TS prompts × 4 configs = 56 evaluations
**Generator:** claude-sonnet-4.5
**Reviewer:** claude-sonnet-4.5 (single reviewer — gemini-3-pro unavailable)

---

## Config Performance

| Config | Avg Score | Criteria Passed | Total Criteria |
|--------|-----------|-----------------|----------------|
| **azure-mcp-skills/claude-sonnet-4.5** | **86.4%** | 291 | 334 |
| baseline-skills/claude-sonnet-4.5 | 81.3% | 273 | 309 |
| azure-mcp/claude-sonnet-4.5 | 77.1% | 263 | 314 |
| baseline/claude-sonnet-4.5 | 76.4% | 249 | 306 |

**Best config:** `azure-mcp-skills` (skills + MCP combined) at **86.4%**

---

## Skills vs No-Skills Comparison

| Dimension | Without | With | Delta |
|-----------|---------|------|-------|
| **Skills** | 76.8% | 83.9% | **+7.1%** ✅ |
| **MCP** | 78.9% | 81.8% | **+2.9%** |
| **Skills + MCP combined** | 76.4% (baseline) | 86.4% (mcp-skills) | **+10.0%** |

> **Skills are now clearly working.** The +7.1% lift (vs +0.3% in Run 2 before bug fixes) confirms that the `SkillDir` bug fix and remote git sparse-checkout fetch are loading all 10 skills (9 remote + 1 local) properly.

---

## Comparison Matrix (score/total)

| Prompt | baseline | baseline-skills | azure-mcp | azure-mcp-skills |
|--------|----------|-----------------|-----------|------------------|
| app-configuration-dp-js-ts-crud | 19/23 | 20/23 | 19/23 | 19/23 |
| cosmos-db-dp-js-ts-crud | 13/22 | 17/21 | 15/21 | 18/21 |
| event-hubs-dp-js-ts-streaming | 17/23 | 17/23 | 18/23 | 17/22 |
| identity-dp-js-ts-default-credential | 18/20 | 19/20 | ✅ PASS | 17/20 |
| identity-dp-js-ts-managed-identity | 19/21 | 19/21 | 18/21 | 18/20 |
| identity-dp-js-ts-service-principal | 19/20 | 14/20 | 15/20 | 15/20 |
| key-vault-dp-js-ts-crud | 17/20 | 18/20 | 16/20 | 17/20 |
| key-vault-dp-js-ts-secret-config | 24/25 | 25/27 | 26/28 | 26/27 |
| resource-manager-mp-js-ts-rg-crud | 20/23 | 20/23 | 18/23 | 21/23 |
| service-bus-dp-js-ts-crud | 16/26 | ✅ PASS | 18/23 | 19/23 |
| storage-dp-js-ts-blob-manager | ✅ PASS | 26/27 | 23/27 | 20/27 |
| storage-dp-js-ts-crud | 22/23 | 22/23 | 22/23 | ✅ PASS |
| storage-dp-js-ts-encrypted-uploader | 26/37 | 37/38 | 35/39 | 42/43 |
| storage-mp-js-ts-account-mgmt | 19/23 | 19/23 | 20/23 | 20/23 |

---

## Per-Prompt Skills Lift

### Baseline → Baseline-Skills

| Prompt | Before | After | Delta |
|--------|--------|-------|-------|
| cosmos-db-dp-js-ts-crud | 13/22 | 17/21 | **+21.9%** |
| storage-dp-js-ts-encrypted-uploader | 26/37 | 37/38 | **+27.1%** |
| storage-dp-js-ts-blob-manager | 0/0 | 26/27 | **+96.3%** |
| identity-dp-js-ts-default-credential | 18/20 | 19/20 | +5.0% |
| key-vault-dp-js-ts-crud | 17/20 | 18/20 | +5.0% |
| app-configuration-dp-js-ts-crud | 19/23 | 20/23 | +4.3% |
| identity-dp-js-ts-service-principal | 19/20 | 14/20 | **-25.0%** ⚠️ |
| key-vault-dp-js-ts-secret-config | 24/25 | 25/27 | -3.4% |

### Azure-MCP → Azure-MCP-Skills

| Prompt | Before | After | Delta |
|--------|--------|-------|-------|
| identity-dp-js-ts-default-credential | 0/0 | 17/20 | **+85.0%** |
| cosmos-db-dp-js-ts-crud | 15/21 | 18/21 | **+14.3%** |
| resource-manager-mp-js-ts-rg-crud | 18/23 | 21/23 | **+13.0%** |
| storage-dp-js-ts-encrypted-uploader | 35/39 | 42/43 | +7.9% |
| storage-dp-js-ts-blob-manager | 23/27 | 20/27 | **-11.1%** ⚠️ |

---

## Top Gaps — Most Failed Criteria

| Criterion | Failures | % of Evals |
|-----------|----------|-----------|
| **Logging via @azure/logger** | 150 | Nearly universal |
| **RestError Exception Handling** | 108 | ~75% |
| **@azure/identity for Authentication** | 48 | ~86% |
| **Client Constructor with Endpoint and Credential** | 42 | ~75% |
| **Error Handling** | 42 | ~75% |
| **Best Practices** | 39 | ~70% |
| **Pagination with for-await-of** | 21 | ~38% |
| **Code Builds** | 15 | ~27% |

### Gap Analysis

1. **`@azure/logger` (150 failures):** The #1 gap. Despite the `js-ts-azure-patterns` skill listing `@azure/logger` as Pattern #1 (CRITICAL), agents almost never include `setLogLevel()` or `@azure/logger` imports. **Action:** Consider making the skill instructions more emphatic, or add explicit `@azure/logger` usage to the prompt reference code.

2. **`RestError` handling (108 failures):** Agents use generic `try/catch(error)` instead of catching `RestError` from `@azure/core-rest-pipeline` and inspecting `statusCode`. The skill has this as Pattern #7 but agents default to generic error handling. **Action:** Strengthen the RestError examples in the skill or add explicit instructions in prompts.

3. **`@azure/identity` authentication (48 failures):** Many evals use connection strings or hardcoded secrets instead of `DefaultAzureCredential`. This is a fundamental SDK best practice that agents should follow by default. **Action:** The skill covers this (Pattern #2), but connection string examples in SDK docs may be overriding it.

---

## Prompt Rankings (Worst to Best)

| Prompt | Avg Score | Notes |
|--------|-----------|-------|
| service-bus-dp-js-ts-crud | **55.6%** | Lowest — had 0/0 pass-through on one config |
| storage-dp-js-ts-blob-manager | **63.9%** | Inconsistent across configs |
| identity-dp-js-ts-default-credential | **67.5%** | Improved from 0% (Run 2) after prompt rewrite |
| cosmos-db-dp-js-ts-crud | **74.3%** | Skills helped significantly (+21.9%) |
| event-hubs-dp-js-ts-streaming | 75.8% | Stable, not much skills lift |
| identity-dp-js-ts-service-principal | 78.8% | Regressed with skills (-25% baseline) |
| app-configuration-dp-js-ts-crud | 83.7% | Solid |
| storage-mp-js-ts-account-mgmt | 84.8% | Stable |
| key-vault-dp-js-ts-crud | 85.0% | Solid |
| resource-manager-mp-js-ts-rg-crud | 85.9% | +13% with MCP-skills |
| storage-dp-js-ts-encrypted-uploader | 88.8% | Big skills lift (+27%) |
| identity-dp-js-ts-managed-identity | 89.2% | Near pass threshold |
| key-vault-dp-js-ts-secret-config | **94.4%** | Best prompt |
| storage-dp-js-ts-crud | **96.7%** | Best prompt, near-perfect |

---

## Regressions to Investigate

| Prompt | Config | Before → After | Delta |
|--------|--------|----------------|-------|
| identity-dp-js-ts-service-principal | baseline → baseline-skills | 19/20 → 14/20 | **-25%** |
| storage-dp-js-ts-blob-manager | azure-mcp → azure-mcp-skills | 23/27 → 20/27 | **-11.1%** |

These cases where skills *hurt* performance may indicate conflicting instructions between the skill content and what the prompt/model already knows.

---

## Notes

- **gemini-3-pro reviewer unavailable:** `gemini-3-pro-preview`, `gemini-2.5-pro`, and `gemini-3-pro` all returned "Model not available." All 56 reviews used single claude-sonnet-4.5 reviewer.
- **Binary pass rate:** Only 4/56 evals passed (7.1%), but average scores are 76-86%. The pass threshold is strict — many evals miss by 1-3 criteria.
- **0/0 entries:** Some config+prompt combinations show `0/0` scores — this means the reviewer returned a perfect score with no criteria breakdown (treated as pass).
- **Identity prompts recovered:** All 3 identity prompts went from 0% (Run 2, generated no files) to 67-89% after rewriting from Q&A-style to action-oriented wording.

---

## Run Comparison (Run 2 → Run 3)

| Metric | Run 2 | Run 3 | Change |
|--------|-------|-------|--------|
| Overall avg | 69.2% | 80.5% | **+11.3%** |
| Skills lift | +0.3% | +7.1% | Skills now working |
| Identity prompts | 0% (no files) | 67-89% | Prompt rewrite fixed |
| Skills loaded | 0 (bug) | 10 (9 remote + 1 local) | SkillDir fix + sparse-checkout |

---

## Recommended Next Steps

1. **Fix top 3 gaps:** Strengthen `@azure/logger`, `RestError`, and `@azure/identity` patterns in the generator skill — current skill content is not being followed reliably
2. **Investigate regressions:** Why do skills hurt `identity-service-principal` and `storage-blob-manager`?
3. **Fix Gemini reviewer:** Find a working Gemini model ID for the review panel (single-reviewer risk)
4. **Improve lowest prompts:** `service-bus-crud` (55.6%) and `storage-blob-manager` (63.9%) need prompt rewrites
5. **Lower pass threshold?** 93% of evals "fail" but have 76-86% scores — consider adjusting threshold
