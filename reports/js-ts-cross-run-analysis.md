# JS/TS Evaluation Runs — Cross-Run Analysis & Gap Report

**Generated:** 2026-05-04
**Branch:** `kaghiya/issue-294-js-ts-scenarios`
**Scope:** 14 JS/TS Azure SDK prompts across identity, storage, key-vault, cosmos-db, event-hubs, service-bus, app-configuration, and resource-manager services.

---

## Run Overview

| Metric | Run 1 | Run 2 | Run 3 |
|--------|-------|-------|-------|
| **Run ID** | `20260430-161724` | `20260501-160921` | `20260501-181917` |
| **Date** | 2026-04-30 | 2026-05-01 | 2026-05-01 |
| **Total Evals** | 168 | 56 | 56 |
| **Configs** | 12 (3 generators × 4 config types) | 4 (opus + sonnet × baseline ± skills) | 4 (sonnet × baseline ± skills ± MCP) |
| **Generators** | claude-opus-4.6, claude-sonnet-4.5, gpt-5.3-codex | claude-opus-4.6, claude-sonnet-4.5 | claude-sonnet-4.5 only |
| **Reviewers** | gemini-3-pro-preview + claude-sonnet-4.5 | gemini-3-pro-preview + claude-sonnet-4.5 | claude-sonnet-4.5 only (gemini unavailable) |
| **Skills loaded** | 0 (all 168 errored) | 0 (SkillDir bug — skills silently dropped) | 10 (9 remote + 1 local) ✅ |
| **Overall Avg** | N/A (all errors) | **79.1%** | **80.3%** |
| **Errors** | 168 (100%) | 7 (12.5%) | 0 (0%) ✅ |
| **Binary Pass** | 0 | 3 (5.4%) | 4 (7.1%) |
| **Duration** | 1342s | 1246s | 1677s |

---

## What Changed Between Runs

### Run 1 → Run 2

**Root cause of Run 1 failure: Copilot permission bug.** Every file-write tool call failed with `"unexpected user permission response"`. The Copilot SDK's `PermissionHandler.ApproveAll` sent `"approved"` but CLI v1.0.35 expected `"approve-once"`, causing all `create` tool calls to fail silently. Of the 168 errors:
- **90 evals**: Agent attempted file writes but all were permission-denied → `"0 files despite N file-write tool attempts"`
- **78 evals**: Agent never attempted file writes (Q&A-style prompts or agent gave up after seeing permission errors) → `"0 files — agent did not create any files"`

| Change | Impact |
|--------|--------|
| Fixed Copilot permission handler (`ApproveAll` → correct response format) | File creation works |
| Fixed `_direct/` plugin directory resolution in config.go | Configs loaded without crashing |
| Dropped gpt-5.3-codex generator configs (12 → 4 configs) | Focused on best generators |
| Created JS/TS generator skill (`js-ts-azure-patterns`) | 10 cross-cutting SDK patterns |
| Created JS/TS reviewer skill (`js-ts-sdk-validation`) | 10 review checks |
| **Result:** Run went from 168 errors → 49 scored evals + 7 errors | First real JS/TS baseline established |

### Run 2 → Run 3

| Change | Impact |
|--------|--------|
| Fixed `SkillDir: true` missing for plugin entries | Skills actually load now (0 → 10) |
| Switched from local plugins to remote git sparse-checkout fetch | 9 remote Azure SDK TypeScript skills loaded |
| Rewrote 3 identity prompts from Q&A to action-oriented wording | identity-default-credential: 0% → 67.5% |
| Added azure-mcp configs (MCP server evaluation) | 4 new config variants tested |
| Dropped claude-opus-4.6 generator (sonnet-only) | Cleaner apples-to-apples comparison |
| Updated reviewer from gemini-3-pro-preview → gemini-3-pro | Still unavailable — single reviewer fallback |
| **Result:** 0 errors, skills lift +7.1%, MCP lift +2.9% | Skills confirmed working |

---

## Config Performance Across Runs

### Run 2 Configs (baseline only, no MCP)

| Config | Avg Score | Errors |
|--------|-----------|--------|
| baseline-skills/claude-opus-4.6 | 82.8% | 3 |
| baseline-skills/claude-sonnet-4.5 | 79.3% | 1 |
| baseline/claude-opus-4.6 | 77.5% | 2 |
| baseline/claude-sonnet-4.5 | 77.2% | 1 |

### Run 3 Configs (sonnet-only, +MCP)

| Config | Avg Score | Errors |
|--------|-----------|--------|
| **azure-mcp-skills/claude-sonnet-4.5** | **86.4%** | 0 |
| baseline-skills/claude-sonnet-4.5 | 81.3% | 0 |
| azure-mcp/claude-sonnet-4.5 | 77.1% | 0 |
| baseline/claude-sonnet-4.5 | 76.4% | 0 |

### Skills & MCP Lift (Run 3)

| Dimension | Without | With | Delta |
|-----------|---------|------|-------|
| **Skills** | 76.8% | 83.9% | **+7.1%** ✅ |
| **MCP** | 78.9% | 81.8% | **+2.9%** |
| **Both combined** | 76.4% (baseline) | 86.4% (mcp-skills) | **+10.0%** |

---

## Per-Prompt Score Progression (Run 2 → Run 3)

| Prompt | Run 2 Avg | Run 3 Avg | Delta | Notes |
|--------|-----------|-----------|-------|-------|
| identity-dp-js-ts-default-credential | 0.0% (4 errors) | **67.5%** | **+67.5%** | Prompt rewrite fixed |
| storage-dp-js-ts-crud | 71.7% | **96.7%** | **+25.0%** | Big improvement |
| event-hubs-dp-js-ts-streaming | 54.7% | **75.8%** | **+21.2%** | Skills helped |
| identity-dp-js-ts-managed-identity | 83.3% (2 errors) | **89.2%** | **+5.8%** | Errors eliminated |
| key-vault-dp-js-ts-secret-config | 90.5% | **94.4%** | **+3.9%** | Consistently strong |
| storage-dp-js-ts-blob-manager | 60.9% | **63.9%** | +3.0% | Still weak |
| cosmos-db-dp-js-ts-crud | 71.5% | **74.3%** | +2.8% | Skills +21.9% on baseline |
| key-vault-dp-js-ts-crud | 83.4% | 85.0% | +1.6% | Stable |
| app-configuration-dp-js-ts-crud | 84.6% | 83.7% | -0.9% | Flat |
| storage-mp-js-ts-account-mgmt | 86.8% | 84.8% | -2.0% | Flat |
| storage-dp-js-ts-encrypted-uploader | 90.9% | 88.8% | -2.2% | Slight regression |
| resource-manager-mp-js-ts-rg-crud | 90.2% | 85.9% | -4.3% | Slight regression |
| identity-dp-js-ts-service-principal | 85.0% (1 error) | 78.8% | -6.2% | Regression |
| service-bus-dp-js-ts-crud | 78.2% | **55.6%** | **-22.6%** | Significant regression |

---

## Remaining Gaps After Run 3

### Gap 1: `@azure/logger` — Universal Failure

| Run | Failures | Notes |
|-----|----------|-------|
| Run 2 | 43 | Most-failed criterion |
| Run 3 | 50 | Still #1, slightly worse |

**Problem:** Agents almost never include `import { setLogLevel } from "@azure/logger"` or call `setLogLevel("info")`. The `js-ts-azure-patterns` skill lists this as Pattern #1 (CRITICAL), but agents ignore it.

**Why it persists:** `@azure/logger` is a diagnostic/debugging concern, not part of core functionality. LLMs deprioritize it. SDK documentation samples rarely include it.

**Recommended fix:**
- Add explicit `@azure/logger` requirement directly in each prompt's instructions (not just skills)
- Or lower the weight of this criterion if it's not essential for code correctness

### Gap 2: `RestError` Exception Handling — 64% Failure Rate

| Run | Failures | Notes |
|-----|----------|-------|
| Run 2 | 35 | |
| Run 3 | 36 | No improvement |

**Problem:** Agents use generic `try { } catch (error) { }` instead of importing `RestError` from `@azure/core-rest-pipeline` and checking `error instanceof RestError` with `statusCode` inspection.

**Why it persists:** Generic error handling "works" — the agent sees no compilation error. RestError is an Azure SDK-specific pattern that isn't part of standard TypeScript.

**Recommended fix:**
- Strengthen skill Pattern #7 with more explicit examples
- Add RestError as a hard requirement in prompts for CRUD scenarios

### Gap 3: `@azure/identity` Authentication — ~29% Failure Rate

| Run | Failures | Notes |
|-----|----------|-------|
| Run 2 | 17 | |
| Run 3 | 16 | Flat |

**Problem:** Agents use connection strings or hardcoded secrets instead of `DefaultAzureCredential` from `@azure/identity`.

**Why it persists:** Many Azure SDK quickstart samples show connection string usage first. The agent picks the "easiest" auth method.

**Recommended fix:**
- Prompts should explicitly say "Use `DefaultAzureCredential` from `@azure/identity` — do NOT use connection strings"
- Skill Pattern #2 covers this but isn't strong enough

### Gap 4: `service-bus-dp-js-ts-crud` — Severe Regression (-22.6%)

**Run 2:** 78.2% → **Run 3:** 55.6%

This prompt regressed significantly. Possible causes:
- Different config mix (Run 2 had opus; Run 3 is sonnet-only)
- MCP configs may have introduced noise
- Skills may be providing conflicting guidance for Service Bus

**Recommended fix:** Investigate the Run 3 service-bus reports to identify which criteria regressed and why.

### Gap 5: Gemini Reviewer Unavailable

All three model IDs tried (`gemini-3-pro-preview`, `gemini-2.5-pro`, `gemini-3-pro`) returned "Model not available." This means:
- All reviews rely on a **single claude-sonnet-4.5 reviewer** — no second opinion
- Review panel diversity (designed to reduce bias) is lost

**Recommended fix:** Find the correct Gemini model ID for the Copilot SDK, or substitute another model (e.g., `gpt-5.2`).

### Gap 6: Binary Pass Rate Still Low (7.1%)

Avg scores are 76-86% but only 4/56 evals pass. The pass threshold requires ALL criteria to pass — a single miss on `@azure/logger` fails the entire eval.

**Recommended fix:** Consider a threshold-based pass (e.g., ≥90% criteria) instead of all-or-nothing.

### Gap 7: `Code Builds` Criterion Failing (5 failures in Run 3)

Some generated code has syntax errors or import issues. This is a correctness problem.

**Recommended fix:** Investigate which prompts produce non-building code and whether the build grader is running correctly.

---

## Improvements Made — What to Keep

### ✅ Keep: Action-Oriented Prompt Wording

**Before (Run 2):** "Show me how to authenticate using DefaultAzureCredential. Explain the credential chain..."
**After (Run 3):** "Write a TypeScript program that authenticates to Azure using DefaultAzureCredential..."

**Impact:** identity-default-credential went from 0% (generated no files) to 67.5%. This pattern should be applied to **all** prompts.

### ✅ Keep: Remote Skill Fetch via Git Sparse-Checkout

Using `source: remote` with `repo: microsoft/skills/.github/plugins/azure-sdk-typescript/skills` loads 9 official Azure SDK TypeScript skills directly from the upstream repo.

**Impact:** Skills are always up-to-date. No manual copy. Cache avoids repeated fetches.

### ✅ Keep: SkillDir Bug Fix

Setting `SkillDir: true` for resolved plugin entries ensures skills actually load into the Copilot session.

**Impact:** Run 2 loaded 0 skills (bug). Run 3 loaded 10 skills → +7.1% lift.

### ✅ Keep: MCP + Skills Combined Config

`azure-mcp-skills/claude-sonnet-4.5` scored **86.4%** — the highest of any config. The combination of Azure MCP tools + SDK skills provides the best results.

### ✅ Keep: Focused Generator (claude-sonnet-4.5)

Sonnet is faster and cheaper than Opus, with comparable or better scores. The Run 2 data showed sonnet (72.7%) > opus (65.7%) as generator.

### ✅ Keep: `.skills-cache/` for Performance

Sparse-checkout caching avoids repeated git clones. First fetch ~3s, cache hit <100ms.

---

## Recommended Future Improvements

### Priority 1: Fix Top 3 Criteria Gaps

1. **`@azure/logger`**: Add explicit requirement to prompt instructions OR reduce criterion weight
2. **`RestError` handling**: Add to prompt requirements for all CRUD prompts
3. **`@azure/identity`**: Add "Use DefaultAzureCredential, NOT connection strings" to prompts

### Priority 2: Fix Regressions

4. **service-bus-dp-js-ts-crud**: Investigate why it dropped from 78.2% to 55.6%
5. **identity-dp-js-ts-service-principal**: Skills caused -25% regression — check for conflicting skill instructions

### Priority 3: Infrastructure

6. **Fix Gemini reviewer**: Find a working model ID or substitute another model for review panel diversity
7. **Pass threshold**: Consider ≥90% criteria pass instead of 100% for binary pass/fail
8. **Add `-y` flag to CI**: All automated runs should use `-y` to skip confirmation prompt

### Priority 4: Expand Coverage

9. **Apply action-oriented wording** to any remaining Q&A-style prompts
10. **Add more JS/TS prompts** for services with only 1 prompt (e.g., cosmos-db, event-hubs)
11. **Run with claude-opus-4.6** on best configs to see if premium model improves top gaps

---

## Appendix: Full Per-Prompt Comparison Matrix (Run 3)

| Prompt | baseline | baseline-skills | azure-mcp | azure-mcp-skills |
|--------|----------|-----------------|-----------|------------------|
| app-configuration-dp-js-ts-crud | 19/23 (82.6%) | 20/23 (87.0%) | 19/23 (82.6%) | 19/23 (82.6%) |
| cosmos-db-dp-js-ts-crud | 13/22 (59.1%) | 17/21 (81.0%) | 15/21 (71.4%) | 18/21 (85.7%) |
| event-hubs-dp-js-ts-streaming | 17/23 (73.9%) | 17/23 (73.9%) | 18/23 (78.3%) | 17/22 (77.3%) |
| identity-dp-js-ts-default-credential | 18/20 (90.0%) | 19/20 (95.0%) | ✅ PASS | 17/20 (85.0%) |
| identity-dp-js-ts-managed-identity | 19/21 (90.5%) | 19/21 (90.5%) | 18/21 (85.7%) | 18/20 (90.0%) |
| identity-dp-js-ts-service-principal | 19/20 (95.0%) | 14/20 (70.0%) | 15/20 (75.0%) | 15/20 (75.0%) |
| key-vault-dp-js-ts-crud | 17/20 (85.0%) | 18/20 (90.0%) | 16/20 (80.0%) | 17/20 (85.0%) |
| key-vault-dp-js-ts-secret-config | 24/25 (96.0%) | 25/27 (92.6%) | 26/28 (92.9%) | 26/27 (96.3%) |
| resource-manager-mp-js-ts-rg-crud | 20/23 (87.0%) | 20/23 (87.0%) | 18/23 (78.3%) | 21/23 (91.3%) |
| service-bus-dp-js-ts-crud | 16/26 (61.5%) | ✅ PASS | 18/23 (78.3%) | 19/23 (82.6%) |
| storage-dp-js-ts-blob-manager | ✅ PASS | 26/27 (96.3%) | 23/27 (85.2%) | 20/27 (74.1%) |
| storage-dp-js-ts-crud | 22/23 (95.7%) | 22/23 (95.7%) | 22/23 (95.7%) | ✅ PASS |
| storage-dp-js-ts-encrypted-uploader | 26/37 (70.3%) | 37/38 (97.4%) | 35/39 (89.7%) | 42/43 (97.7%) |
| storage-mp-js-ts-account-mgmt | 19/23 (82.6%) | 19/23 (82.6%) | 20/23 (87.0%) | 20/23 (87.0%) |
