# JS/TS Evaluation Summary — April 30, 2026

## Run Details

- **Duration:** ~1 hour 37 minutes (started 5:43 PM, finished ~7:20 PM PT)
- **Evaluations:** 167/168 completed (1 timed out)
- **Scope:** 14 JS/TS prompts × 12 configs
- **Pass rate:** 0/167 (none hit 100% criteria)
- **File generation:** 139 evals generated files, 28 produced 0 files

## Results by Config (avg review score)

| Config | Avg Score | Files Generated |
|---|---|---|
| `azure-mcp-skills/claude-opus-4.6` | **80.4%** | 50 |
| `baseline-skills/claude-opus-4.6` | **80.0%** | 53 |
| `baseline/claude-opus-4.6` | **79.5%** | 53 |
| `baseline/claude-sonnet-4.5` | **78.5%** | 66 |
| `baseline-skills/claude-sonnet-4.5` | **78.2%** | 70 |
| `azure-mcp/claude-opus-4.6` | **77.7%** | 54 |
| `azure-mcp/claude-sonnet-4.5` | **77.6%** | 61 |
| `azure-mcp/gpt-5.4` | **77.5%** | 52 |
| `baseline-skills/gpt-5.4` | **77.4%** | 47 |
| `azure-mcp-skills/claude-sonnet-4.5` | **76.7%** | 62 |
| `azure-mcp-skills/gpt-5.4` | **74.0%** | 51 |
| `baseline/gpt-5.4` | **70.3%** | 51 |

## Results by Prompt (avg review score)

| Prompt | Avg Score | Files |
|---|---|---|
| `storage-dp-js-ts-crud` | **93.8%** 🟢 | 48 |
| `key-vault-dp-js-ts-secret-config` | **90.5%** 🟢 | 106 |
| `resource-manager-mp-js-ts-rg-crud` | **82.2%** | 48 |
| `storage-mp-js-ts-account-mgmt` | **80.4%** | 48 |
| `key-vault-dp-js-ts-crud` | **80.2%** | 48 |
| `storage-dp-js-ts-encrypted-uploader` | **80.0%** | 82 |
| `storage-dp-js-ts-blob-manager` | **78.8%** | 76 |
| `identity-dp-js-ts-managed-identity` | **75.2%** | 14 |
| `identity-dp-js-ts-service-principal` | **73.8%** | 11 |
| `identity-dp-js-ts-default-credential` | **72.9%** | 8 |
| `event-hubs-dp-js-ts-streaming` | **70.4%** | 48 |
| `app-configuration-dp-js-ts-crud` | **68.8%** | 43 |
| `service-bus-dp-js-ts-crud` | **63.6%** 🔴 | 44 |
| `cosmos-db-dp-js-ts-crud` | **63.2%** 🔴 | 46 |

## Worst-Performing Language-Level Criteria

| Pass Rate | Criteria |
|---|---|
| **10.0%** (27/270) | Logging via `@azure/logger` |
| **20.4%** (55/270) | `RestError` Exception Handling |
| **40.0%** (108/270) | Error Handling (general) |
| **64.8%** (175/270) | `@azure/identity` for Authentication |
| **68.5%** (185/270) | Client Constructor with Endpoint and Credential |
| **72.6%** (196/270) | Pagination with `for-await-of` |
| **75.2%** (203/270) | Best Practices |
| **81.1%** (219/270) | Latest Package Versions |
| **89.3%** (241/270) | LRO Pattern (`beginXxx` + `pollUntilDone`) |
| **91.5%** (247/270) | Code Builds |
| **93.3%** (252/270) | `package.json` with Correct Dependencies |
| **96.3%** (260/270) | Async/Await Pattern |
| **97.0%** (262/270) | Code Quality |
| **100%** (270/270) | Correct `@azure/` Scoped Packages |
| **100%** (270/270) | No Deprecated Packages |

## Prompt-Specific Criteria Failures (0% pass rate)

- `Error handling for RestError` — 0/8 across multiple prompts
- `Handles Key Vault errors via RestError` — 0/7
- `Handles blob not found errors (404 status code) on download/delete` — 0/10
- `Handles lease conflict errors (409 status code)` — 0/13
- `NOT collecting all listed blobs into an array before processing` — 0/15
- `completeMessage(), abandonMessage(), deadLetterMessage()` — 0/19

## Key Patterns Observed

1. **Logging is the biggest gap (10% pass rate):** Generators almost never include `@azure/logger` setup with `setLogLevel()`. This is the single most impactful area for skills to address.

2. **Error handling is weak (20-40% pass rate):** `RestError` with `statusCode` checks is rarely generated. Generators use generic `try/catch` instead of Azure-specific error handling patterns.

3. **Auth criteria at 64.8%:** The updated criteria requiring production-aware credential usage (not just `DefaultAzureCredential`) catches many generators that use the simplest credential pattern.

4. **Identity prompts generate very few files (8-14 total):** These are simpler auth-focused prompts, but the low file count suggests generators may be under-generating for these scenarios.

5. **Complex, well-defined prompts score best:** `storage-crud` (93.8%) and `key-vault-secret-config` (90.5%) have the most specific criteria and the generators do well on them.

6. **Cosmos DB and Service Bus score worst (~63%):** These services have complex patterns (partition keys, dead-lettering, message settlement) that generators consistently miss.

7. **MCP configs don't significantly outperform baseline:** The Azure MCP tools provide marginal benefit (~0-1%) suggesting the current MCP server may not provide enough JS/TS-specific guidance.

8. **Skills configs show marginal improvement (~1-2%):** The `azure-sdk-typescript@skills` plugin wasn't installed locally, so the "skills" configs may not have actually loaded the plugin skills during generation.

9. **Claude Opus consistently leads:** Across all config variants, `claude-opus-4.6` outperforms `claude-sonnet-4.5` by ~1-3% and `gpt-5.4` by ~5-10%.

10. **Service Bus dead-lettering never generated (0/19):** `completeMessage()`, `abandonMessage()`, and `deadLetterMessage()` patterns are completely absent from generated code.

## TypeScript Skills Plugin — Gap Analysis

### Current State

- The `azure-sdk-typescript@skills` plugin is referenced in configs but **not installed locally** — no local plugin YAML exists
- Generator skills directory (`skills/generator/`) has **zero SKILL.md files** — no local guidance for code generation
- Reviewer skills are generic (build verification, version check) or **Java-only** (`java-sdk-validation`) — none target JS/TS Azure patterns
- No service-specific criteria exist for any of the 8 Azure services covered by JS/TS prompts

### Recommended Skills to Create

Based on criteria failure rates, the TypeScript skills plugin should teach:

1. **`@azure/logger` setup** (90% failure rate)
   - Always import `setLogLevel` from `@azure/logger`
   - Set log level based on environment variable
   - Example: `setLogLevel("info")` for production, `setLogLevel("verbose")` for debugging

2. **`RestError` handling patterns** (80% failure rate)
   - Import `RestError` from `@azure/core-rest-pipeline`
   - Check `statusCode` for specific HTTP errors (404, 409, etc.)
   - Pattern: `catch (e) { if (e instanceof RestError && e.statusCode === 404) { ... } }`

3. **Production-aware authentication** (35% failure rate)
   - Use `ManagedIdentityCredential` in production, `DefaultAzureCredential` in development
   - Environment-based credential selection pattern
   - Never hardcode vault URLs or credentials

4. **Service-specific patterns:**
   - **Service Bus:** `completeMessage()`, `abandonMessage()`, `deadLetterMessage()` (0% pass rate)
   - **Cosmos DB:** Partition key usage, `FeedResponse` iteration, error status codes (13% pass rate)
   - **Storage:** Blob leasing with `BlobLeaseClient`, streaming upload with `uploadStream()`, NOT collecting blobs into array
   - **Event Hubs:** Checkpointing with `updateCheckpoint()`, consumer/producer lifecycle

5. **JS/TS-specific reviewer skill** — equivalent to `java-sdk-validation` but for TypeScript Azure SDK patterns

## Configs Used

12 configs organized in 4 tiers × 3 models:

| Tier | claude-opus-4.6 | claude-sonnet-4.5 | gpt-5.4 |
|---|---|---|---|
| **baseline** | baseline/claude-opus-4.6 | baseline/claude-sonnet-4.5 | baseline/gpt-5.4 |
| **baseline-skills** | baseline-skills/claude-opus-4.6 | baseline-skills/claude-sonnet-4.5 | baseline-skills/gpt-5.4 |
| **azure-mcp** | azure-mcp/claude-opus-4.6 | azure-mcp/claude-sonnet-4.5 | azure-mcp/gpt-5.4 |
| **azure-mcp-skills** | azure-mcp-skills/claude-opus-4.6 | azure-mcp-skills/claude-sonnet-4.5 | azure-mcp-skills/gpt-5.4 |

All reviewers use the same 3-model panel: `claude-opus-4.6`, `gemini-3-pro-preview`, `gpt-4.1`.

## Recommendations — Tiers & Models

### Model Ranking

| Model | Avg Score | Delta |
|---|---|---|
| claude-opus-4.6 | **79.4%** | baseline |
| claude-sonnet-4.5 | **77.8%** | -1.6% |
| gpt-5.4 | **74.8%** | -4.6% |

### Tier Ranking

| Tier | Avg Score |
|---|---|
| baseline-skills | **78.5%** |
| azure-mcp | **77.6%** |
| azure-mcp-skills | **77.0%** |
| baseline | **76.1%** |

### Recommendations

1. **Drop gpt-5.4 for now** — it consistently trails by ~5% across all tiers. Not worth 4 extra evals per prompt unless specifically benchmarking OpenAI models.

2. **Keep only 2 tiers: `baseline` and `baseline-skills`** — MCP adds complexity but no measurable benefit (+0.5% avg). Skills showed the most uplift (+2.4%), and that's *without the plugin actually being installed*. Once the plugin installation is fixed, skills configs could see a bigger jump.

3. **Recommended config set (4 configs):**
   - `baseline/claude-opus-4.6` — best raw model
   - `baseline/claude-sonnet-4.5` — cost-effective comparison
   - `baseline-skills/claude-opus-4.6` — skills uplift measurement
   - `baseline-skills/claude-sonnet-4.5` — skills + cost-effective

4. **Re-evaluate MCP after skills are working** — MCP and skills are both partially broken (plugin not installed), so tier comparisons are confounded. Fix the plugin, create JS/TS generator skills, then re-run for a clean signal.

**Impact:** Cuts eval time from ~1.5 hours (12 configs) to ~30 minutes (4 configs) per language, enabling faster iteration as TypeScript skills are built out.

## Timing Data

**Total run time:** ~1 hour 37 minutes wall clock (167 evals ran sequentially)
**Sum of all eval durations:** ~11.6 hours (cumulative across all evals)

### Per-Model Average Duration

| Model | Avg Total | Avg Generation | Avg Review | Evals |
|---|---|---|---|---|
| claude-opus-4.6 | **4.0 min** | 1.8 min | 2.7 min | 55 |
| claude-sonnet-4.5 | **4.5 min** | 1.8 min | 2.8 min | 56 |
| gpt-5.4 | **4.0 min** | 1.9 min | 2.6 min | 56 |

### Per-Config Average Duration

| Config | Avg Total | Avg Gen | Avg Review | Evals |
|---|---|---|---|---|
| baseline/claude-opus-4.6 | **3.6 min** | 96s | 153s | 14 |
| baseline/gpt-5.4 | **3.8 min** | 106s | 153s | 14 |
| baseline-skills/claude-opus-4.6 | **3.9 min** | 103s | 165s | 14 |
| baseline-skills/gpt-5.4 | **3.9 min** | 106s | 161s | 14 |
| azure-mcp-skills/gpt-5.4 | **4.1 min** | 128s | 147s | 14 |
| baseline/claude-sonnet-4.5 | **4.2 min** | 99s | 165s | 14 |
| azure-mcp/gpt-5.4 | **4.2 min** | 122s | 165s | 14 |
| azure-mcp/claude-opus-4.6 | **4.3 min** | 114s | 165s | 14 |
| azure-mcp-skills/claude-opus-4.6 | **4.3 min** | 112s | 173s | 13 |
| azure-mcp-skills/claude-sonnet-4.5 | **4.3 min** | 102s | 179s | 14 |
| azure-mcp/claude-sonnet-4.5 | **4.7 min** | 113s | 200s | 14 |
| baseline-skills/claude-sonnet-4.5 | **4.8 min** | 125s | 172s | 14 |

### Timing Observations

- **Baseline configs are fastest** (~3.6–3.8 min) — no MCP/skills overhead
- **Review takes ~60% of total time** — generation averages ~100-130s, review averages ~150-200s
- **Claude Sonnet is slowest overall** despite being a smaller model — likely due to longer review times
- **MCP configs add ~30s overhead** on average compared to their baseline counterparts
- **With the recommended 4-config set**, estimated run time per language: ~4 configs × 14 prompts × 4 min = **~56 eval-minutes** (sequential wall time ~30 min with parallelism)

## Recommendation — Generator vs Reviewer Models

### Rationale

- **Self-review bias**: Using the same model for generation and review leads to inflated scores — models tend to rate their own output more favorably
- **Review cost**: Review takes ~60% of total eval time; trimming from 3 to 2 reviewers saves ~30-40s per eval
- **Model diversity**: Keeping reviewers from different model families provides more robust scoring

### Changes Applied

| Role | Previous | Updated |
|---|---|---|
| Generator | claude-opus-4.6 / claude-sonnet-4.5 / gpt-5.4 | **claude-opus-4.6 / claude-sonnet-4.5** (drop gpt-5.4) |
| Reviewer panel | claude-opus-4.6 + gemini-3-pro-preview + gpt-4.1 | **claude-sonnet-4.5 + gemini-3-pro-preview** |

### Key Principles

1. **Avoid overlap between primary generator and reviewer** — claude-opus-4.6 is the top generator, so it was removed from the reviewer panel and replaced with claude-sonnet-4.5
2. **Trim to 2 reviewers** — dropped gpt-4.1 (oldest model in the panel) to reduce review time
3. **Keep model family diversity** — Anthropic (sonnet) + Google (gemini) ensures independent perspectives
4. **Re-evaluate after next run** — compare scoring consistency with the 2-reviewer panel vs the previous 3-reviewer panel
