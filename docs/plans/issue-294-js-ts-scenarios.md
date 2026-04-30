# Issue #294 — JS/TS Language Scenarios Plan

> **Issue:** <https://github.com/ronniegeraghty/hyoka/issues/294>
> **Branch:** `kaghiya/issue-294-js-ts-scenarios`
> **Goal:** Add TypeScript scenarios for Storage & Key Vault, create JS/TS language criteria

## Current State

JS/TS has 11 prompt files but only **1 Storage** (`crud-blobs`, basic) and **1 Key Vault** (`crud-secrets`, basic).
Java (the reference) has 4 Storage and 2 Key Vault prompts at varied difficulty levels.

### Existing JS/TS Prompts

| Service | ID | Difficulty | Category |
|---|---|---|---|
| Storage (dp) | `storage-dp-js-ts-crud` | basic | crud |
| Storage (mp) | `storage-mp-js-ts-account-mgmt` | intermediate | provisioning |
| Key Vault (dp) | `key-vault-dp-js-ts-crud` | basic | crud |
| App Config (dp) | `app-configuration-dp-js-ts-crud` | basic | crud |
| Identity (dp) | `identity-dp-js-ts-default-credential` | basic | auth |
| Identity (dp) | `identity-dp-js-ts-managed-identity` | intermediate | auth |
| Identity (dp) | `identity-dp-js-ts-service-principal` | intermediate | auth |
| Event Hubs (dp) | `event-hubs-dp-js-ts-streaming` | intermediate | streaming |
| Cosmos DB (dp) | `cosmos-db-dp-js-ts-crud` | basic | crud |
| Service Bus (dp) | `service-bus-dp-js-ts-crud` | intermediate | crud |
| Resource Mgr (mp) | `resource-manager-mp-js-ts-rg-crud` | basic | crud |

---

## Deliverables

### 1. `criteria/language/js-ts.yaml` — Language-specific criteria

TypeScript/JS grading criteria (mirrors `criteria/language/java.yaml`):

- **Correct `@azure/` scoped packages** — no deprecated `azure-storage`, `ms-rest-azure`, `azure-arm-*`
- **`@azure/identity` for authentication** — must be present
- **`DefaultAzureCredential` usage** — no hardcoded keys, connection strings, or SAS tokens
- **Client constructor pattern** — endpoint URL + credential (not legacy patterns)
- **`for await...of` for pagination** — uses `PagedAsyncIterableIterator`, not flattening all pages into an array
- **LRO uses `beginXxx()` + `pollUntilDone()`** — no manual polling loops or `setTimeout` retries
- **`RestError` handling** — catches `RestError` with `statusCode` inspection, not just generic `Error`
- **Proper async/await** — no callback-based patterns, no `.then()` chains when `await` is cleaner
- **No deprecated packages** — rejects `azure-storage`, `ms-rest-azure`, `azure-arm-*`, `@azure/ms-rest-*`
- **Logging via `@azure/logger` / `AZURE_LOG_LEVEL`** — not custom logging wrappers
- **`package.json` present** with correct dependencies

### 2. `prompts/storage/data-plane/js-ts/blob-storage-manager.prompt.md` (advanced)

Mirrors Java's `blob-storage-manager`. A reusable Blob Storage management utility:

- **BlobServiceClient** with `DefaultAzureCredential`
- **Streaming upload** for large files via `BlockBlobClient.uploadStream()` (not `uploadData()` which loads into memory)
- **Download** with proper Node.js stream handling (`readableStreamBody`)
- **Blob leasing** for concurrency via `BlobLeaseClient`
- **Blob index tags** on upload
- **Retry configuration** via `StorageRetryOptions` in pipeline options
- **Logging** via `@azure/logger` / `setLogLevel()`
- **List blobs** with `for await...of` async iteration

**ID:** `storage-dp-js-ts-blob-manager`

### 3. `prompts/key-vault/data-plane/js-ts/secret-config.prompt.md` (intermediate)

Mirrors Java's `secret-config`. A config provider backed by Key Vault:

- **Secret versioning** via `getSecret(name, { version })`
- **Secret expiry inspection** via `properties.expiresOn`
- **In-memory caching** (Map) with bulk-load and single-key refresh
- **Secret rotation** — version-based: just call `setSecret()` with same name to create a new version (avoids soft-delete name reservation issues). Optionally show delete+purge+recreate flow with purge-protection caveats
- **Configurable near-expiry warning window**

> **Design note (from rubber-duck review):** `beginDeleteSecret()` → `pollUntilDone()` does NOT
> free the name for reuse — the deleted secret stays reserved until purged or recovered. So
> version-based rotation (`setSecret()` same name) is the correct default pattern. Delete+purge
> is only needed for full name reuse.

**ID:** `key-vault-dp-js-ts-secret-config`

### 4. `prompts/storage/data-plane/js-ts/encrypted-uploader.prompt.md` (advanced)

Mirrors Java's `encrypted-uploader`. Client-side encryption with Key Vault Keys:

- **`@azure/keyvault-keys`** and `CryptographyClient` for wrap/unwrap (NOT `SecretClient`)
- **Local AES-GCM** encryption with Node.js `crypto` module
- **Envelope encryption** pattern (DEK/KEK)
- **Blob metadata** stores: wrapped DEK, IV, **auth tag** (JS-specific — GCM tag is separate), key ID
- **Multi-service auth** sharing single `DefaultAzureCredential`
- **Error handling** for Key Vault errors (key disabled/not found) and Storage errors

> **Design note (from rubber-duck review):** In Node.js AES-GCM, the auth tag is separate from
> the ciphertext (unlike Java where it's appended). Must explicitly store the auth tag in blob
> metadata or decryption will fail.

**ID:** `storage-dp-js-ts-encrypted-uploader`

---

## Execution Order

1. Create `criteria/language/js-ts.yaml`
2. Create `blob-storage-manager.prompt.md`
3. Create `secret-config.prompt.md`
4. Create `encrypted-uploader.prompt.md`
5. Review existing `crud-blobs` and `crud-secrets` prompts for correctness
6. Run hyoka evaluations on JS/TS prompts (if time permits)

## Out of Scope (future work)

- `blob-event-notifier` equivalent (Event Grid + Storage, multi-service) — defer to follow-up
- Running full eval sweeps across all configs
- Adding service-specific criteria for services without one (Cosmos DB, Event Hubs, etc.)

## Key JS/TS SDK Patterns (Reference)

| Pattern | JS/TS API |
|---|---|
| Authentication | `DefaultAzureCredential` from `@azure/identity` |
| Client construction | `new BlobServiceClient(url, credential, options?)` |
| Pagination | `for await (const item of client.listXxx()) { }` |
| LRO | `const poller = await client.beginXxx(); await poller.pollUntilDone();` |
| Error handling | `catch (e) { if (e instanceof RestError) { e.statusCode } }` |
| Streaming upload | `blockBlobClient.uploadStream(readableStream, bufferSize, maxConcurrency)` |
| Streaming download | `const resp = await blobClient.download(); resp.readableStreamBody` |
| Blob leasing | `new BlobLeaseClient(blobClient).acquireLease(duration)` |
| Secret versioning | `client.getSecret(name, { version: "abc123" })` |
| Logging | `import { setLogLevel } from "@azure/logger"; setLogLevel("info");` |
| Crypto (Node) | `crypto.createCipheriv("aes-256-gcm", key, iv)` — auth tag is separate |
