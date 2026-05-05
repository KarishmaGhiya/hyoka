# Evaluation Report: cosmos-db-dp-js-ts-crud

**Config:** azure-mcp-skills/gpt-5.4 | **Result:** ❌ FAILED | **Duration:** 207.5s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `cosmos-db-dp-js-ts-crud` |
| Config | azure-mcp-skills/gpt-5.4 |
| Result | ❌ FAILED |
| Score | 15/10 |
| Duration | 207.5s |
| Timestamp | 2026-05-01T01:03:57Z |
| Files Generated | 4 |
| Event Count | 219 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 112.8s |
| Review | 94.5s |
| **Total** | **207.5s** |

## Configuration

- **model:** gpt-5.4
- **name:** azure-mcp-skills/gpt-5.4

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.4 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=302073 out=3911 |
| Turn Count | 10 |

## Prompt Sent

```
Write a TypeScript program
that performs CRUD operations on items in an Azure Cosmos DB NoSQL container:
1. Create a CosmosClient using endpoint and key
2. Create a database "TestDB" and container "Items" with partition key "/category"
3. Create an item with properties: id, category, name, quantity
4. Read the item back using item().read()
5. Query items where category equals "electronics" using parameterized query
6. Replace the item with updated quantity using item().replace()
7. Delete the item using item().delete()

Show required npm package and handle errors with appropriate status code checks.
```

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Exploring workspace"}
```

### 🔧 2. glob

**Input:**

```json
{"paths":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-skills-gpt-5.4-463857957","pattern":"**/*"}
```

### 🔧 3. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"intent":"Generate TypeScript Azure Cosmos DB sample with CRUD and error handling"}
```

### 🔧 4. report_intent

**Input:**

```json
{"intent":"Gathering guidance"}
```

### 🔧 5. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"command":"get_azure_bestpractices_get","intent":"Generate TypeScript Azure Cosmos DB sample with CRUD and error handling","parameters":{"action":"code-generation","resource":"general"}}
```

### 🔧 6. apply_patch

**Input:**

```json
"*** Begin Patch\n*** Add File: package.json\n+{\n+  \"name\": \"cosmos-db-crud-sample\",\n+  \"version\": \"1.0.0\",\n+  \"private\": true,\n+  \"scripts\": {\n+    \"build\": \"tsc --noEmit\",\n+    \"start\": \"tsx src\\\\cosmosCrud.ts\"\n+  },\n+  \"dependencies\": {\n+    \"@azure/cosmos\": \"^4.5.1\"\n+  },\n+  \"devDependencies\": {\n+    \"@types/node\": \"^24.6.0\",\n+    \"tsx\": \"^4.20.6\",\n+    \"typescript\": \"^5.9.3\"\n+  }\n+}\n*** Add File: tsconfig.json\n+{\n+  \"compilerOptions\": {\n+    \"target\": \"ES2022\",\n+    \"module\": \"NodeNext\",\n+    \"moduleResolution\": \"NodeNext\",\n+    \"strict\": true,\n+    \"esModuleInterop\": true,\n+    \"forceConsistentCasingInFileNames\": true,\n+    \"skipLibCheck\": true,\n+    \"outDir\": \"dist\"\n+  },\n+  \"include\": [\n+    \"src/**/*.ts\"\n+  ]\n+}\n*** Add File: src\\cosmosCrud.ts\n+import { CosmosClient, type Container, type Database } from \"@azure/cosmos\";\n+\n+type InventoryItem = {\n+  id: string;\n+  category: string;\n+  name: string;\n+  quantity: number;\n+};\n+\n+function getRequiredEnv(name: string): string {\n+  const value = process.env[name];\n+  if (!value) {\n+    throw new Error(`Missing required environment variable: ${name}`);\n+  }\n+  return value;\n+}\n+\n+function expectStatus(\n+  operation: string,\n+  statusCode: number | undefined,\n+  expected: number[],\n+): void {\n+  if (statusCode === undefined || !expected.includes(statusCode)) {\n+    throw new Error(\n+      `${operation} failed. Expected status ${expected.join(\" or \")}, received ${statusCode ?? \"unknown\"}.`,\n+    );\n+  }\n+}\n+\n+async function ensureResources(client: CosmosClient): Promise\u003c{\n+  database: Database;\n+  container: Container;\n+}\u003e {\n+  const databaseResponse = await client.databases.createIfNotExists({\n+    id: \"TestDB\",\n+  });\n+  expectStatus(\"Create database\", databaseResponse.statusCode, [200, 201]);\n+\n+  const containerResponse = await databaseResponse.database.containers.createIfNotExists({\n+    id: \"Items\",\n+    partitionKey: {\n+      paths: [\"/category\"],\n+    },\n+  });\n+  expectStatus(\"Create container\", containerResponse.statusCode, [200, 201]);\n+\n+  return {\n+    database: databaseResponse.database,\n+    container: containerResponse.container,\n+  };\n+}\n+\n+async function run(): Promise\u003cvoid\u003e {\n+  const endpoint = getRequiredEnv(\"COSMOS_ENDPOINT\");\n+  const key = getRequiredEnv(\"COSMOS_KEY\");\n+\n+  const client = new CosmosClient({ endpoint, key });\n+  const { database, container } = await ensureResources(client);\n+\n+  console.log(`Using database \"${database.id}\" and container \"${container.id}\".`);\n+\n+  const item: InventoryItem = {\n+    id: `item-${Date.now()}`,\n+    category: \"electronics\",\n+    name: \"Wireless Mouse\",\n+    quantity: 10,\n+  };\n+\n+  const createResponse = await container.items.create(item);\n+  expectStatus(\"Create item\", createResponse.statusCode, [201]);\n+  console.log(\"Created item:\", createResponse.resource);\n+\n+  const itemRef = container.item(item.id, item.category);\n+\n+  const readResponse = await itemRef.read\u003cInventoryItem\u003e();\n+  expectStatus(\"Read item\", readResponse.statusCode, [200]);\n+  console.log(\"Read item:\", readResponse.resource);\n+\n+  const querySpec = {\n+    query: \"SELECT * FROM c WHERE c.category = @category\",\n+    parameters: [\n+      {\n+        name: \"@category\",\n+        value: \"electronics\",\n+      },\n+    ],\n+  };\n+\n+  const queryResponse = await container.items\n+    .query\u003cInventoryItem\u003e(querySpec)\n+    .fetchAll();\n+  expectStatus(\"Query items\", queryResponse.statusCode, [200]);\n+  console.log(\"Queried items:\", queryResponse.resources);\n+\n+  if (!readResponse.resource) {\n+    throw new Error(\"Read item response did not include a resource.\");\n+  }\n+\n+  const updatedItem: InventoryItem = {\n+    ...readResponse.resource,\n+    quantity: readResponse.resource.quantity + 5,\n+  };\n+\n+  const replaceResponse = await itemRef.replace\u003cInventoryItem\u003e(updatedItem);\n+  expectStatus(\"Replace item\", replaceResponse.statusCode, [200]);\n+  console.log(\"Updated item:\", replaceResponse.resource);\n+\n+  const deleteResponse = await itemRef.delete();\n+  expectStatus(\"Delete item\", deleteResponse.statusCode, [204]);\n+  console.log(`Deleted item \"${item.id}\".`);\n+}\n+\n+run().catch((error: unknown) =\u003e {\n+  const statusCode =\n+    typeof error === \"object\" \u0026\u0026\n+    error !== null \u0026\u0026\n+    \"code\" in error \u0026\u0026\n+    typeof (error as { code?: unknown }).code === \"number\"\n+      ? (error as { code: number }).code\n+      : typeof error === \"object\" \u0026\u0026\n+          error !== null \u0026\u0026\n+          \"statusCode\" in error \u0026\u0026\n+          typeof (error as { statusCode?: unknown }).statusCode === \"number\"\n+        ? (error as { statusCode: number }).statusCode\n+        : undefined;\n+\n+  if (statusCode === 401 || statusCode === 403) {\n+    console.error(\"Authentication or authorization failed. Check COSMOS_ENDPOINT and COSMOS_KEY.\");\n+  } else if (statusCode === 404) {\n+    console.error(\"A Cosmos DB resource was not found.\");\n+  } else if (statusCode === 409) {\n+    console.error(\"A conflicting Cosmos DB resource already exists.\");\n+  } else {\n+    console.error(\"Cosmos DB CRUD sample failed.\");\n+  }\n+\n+  console.error(error);\n+  process.exitCode = 1;\n+});\n*** End Patch\n"
```

### 🔧 7. report_intent

**Input:**

```json
{"intent":"Installing dependencies"}
```

### 🔧 8. powershell

**Input:**

```json
{"command":"npm install","description":"Install npm dependencies","initial_wait":180,"mode":"sync","shellId":"cosmos-sample"}
```

### 🔧 9. report_intent

**Input:**

```json
{"intent":"Validating sample"}
```

### 🔧 10. powershell

**Input:**

```json
{"command":"npm run build","description":"Type-check TypeScript sample","initial_wait":180,"mode":"sync","shellId":"cosmos-sample"}
```

### 🔧 11. report_intent

**Input:**

```json
{"intent":"Fixing type issue"}
```

### 🔧 12. rg

**Input:**

```json
{"-n":true,"glob":"**/*.d.ts","head_limit":20,"output_mode":"content","paths":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-skills-gpt-5.4-463857957\\node_modules\\@azure\\cosmos","pattern":"interface FeedResponse|type FeedResponse|class FeedResponse"}
```

### 🔧 13. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-skills-gpt-5.4-463857957\\src\\cosmosCrud.ts","view_range":[70,120]}
```

### 🔧 14. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-skills-gpt-5.4-463857957\\node_modules\\@azure\\cosmos\\dist\\commonjs\\request\\FeedResponse.d.ts","view_range":[1,80]}
```

### 🔧 15. apply_patch

**Input:**

```json
"*** Begin Patch\n*** Update File: src\\cosmosCrud.ts\n@@\n   const queryResponse = await container.items\n     .query\u003cInventoryItem\u003e(querySpec)\n     .fetchAll();\n-  expectStatus(\"Query items\", queryResponse.statusCode, [200]);\n   console.log(\"Queried items:\", queryResponse.resources);\n*** End Patch\n"
```

### 🔧 16. report_intent

**Input:**

```json
{"intent":"Validating sample"}
```

### 🔧 17. powershell

**Input:**

```json
{"command":"npm run build","description":"Type-check TypeScript sample","initial_wait":180,"mode":"sync","shellId":"cosmos-sample"}
```

## Generated Files

- `package-lock.json`
- `package.json`
- `src\cosmosCrud.ts`
- `tsconfig.json`

## Copilot Response

I found an empty workspace, so I'm adding a self-contained sample rather than wiring into an existing project. I'll keep it to the Azure Cosmos DB SDK pattern the user asked for, with explicit status checks around each CRUD step.

I'm switching from discovery to implementation: creating a minimal TypeScript sample project so the package requirement is explicit and the code is runnable as-is.

The sample is in place. I'm doing one pass to make sure the installed SDK version and the TypeScript config compile cleanly together.

The SDK's query response type doesn't expose `statusCode`, so I'm tightening that one spot to use the typed result shape and keep status-based handling in the central error path where the SDK does expose it on failures.

Added a runnable TypeScript Cosmos DB CRUD sample in `src\cosmosCrud.ts` plus a minimal `package.json` and `tsconfig.json`. The required npm package is **`@azure/cosmos`**; the sample also includes `typescript`, `tsx`, and `@types/node` so it can build and run directly.

Use it with:

```powershell
$env:COSMOS_ENDPOINT="https://<account>.documents.azure.com:443/"
$env:COSMOS_KEY="<key>"
npm start
```

The program does all requested operations against `TestDB` / `Items`, uses `/category` as the partition key, runs the parameterized `category = "electronics"` query, and checks status codes for create/read/replace/delete while handling common Cosmos DB errors like 401/403, 404, and 409.

## Code Review (LLM-as-Judge)

**Score: 15/22 criteria passed**

### Criteria Results

| Criterion | Result | Reason |
|-----------|--------|--------|
| Code Builds | ✅ | Includes valid tsconfig.json, package.json, and TypeScript code; should build successfully. |
| Latest Package Versions | ❌ | @azure/cosmos is not at the latest version (4.5.1 in package.json, 4.9.3 in lockfile, latest is higher). |
| Best Practices | ✅ | Uses async/await, environment variables for secrets, and proper SDK patterns. |
| Error Handling | ❌ | Does not catch or check for RestError; only inspects generic error objects. |
| Code Quality | ✅ | Code is clean, readable, and well-structured. |
| Correct @azure/ Scoped Packages | ✅ | Only @azure/cosmos is used; no deprecated or unscoped packages. |
| @azure/identity for Authentication | ❌ | Does not use @azure/identity; uses key-based auth, which is not best practice. |
| Client Constructor with Endpoint and Credential | ✅ | CosmosClient is constructed with endpoint and key as required by Cosmos DB. |
| Async/Await Pattern | ✅ | All async operations use async/await. |
| Pagination with for-await-of | ❌ | Does not use for-await-of; uses fetchAll() for query results. |
| LRO Pattern (beginXxx + pollUntilDone) | ✅ | No LROs required for Cosmos DB CRUD; not applicable. |
| RestError Exception Handling | ❌ | Does not catch RestError; only generic error handling. |
| No Deprecated Packages | ✅ | No deprecated packages present. |
| Logging via @azure/logger | ❌ | Does not use @azure/logger for diagnostic logging. |
| package.json with Correct Dependencies | ✅ | package.json includes all required dependencies for TypeScript and Cosmos SDK. |
| @azure/cosmos npm package | ✅ | @azure/cosmos is included. |
| CosmosClient constructor with endpoint and key | ✅ | CosmosClient is constructed with endpoint and key. |
| client.databases.createIfNotExists() and database.containers.createIfNotExists() | ✅ | Both methods are used as required. |
| container.items.create(), container.item(id, partitionKey).read() | ✅ | Both methods are used as required. |
| container.items.query() with SqlQuerySpec | ✅ | Parameterized query with SqlQuerySpec is used. |
| container.item(id, partitionKey).replace() and .delete() | ✅ | Both methods are used as required. |
| FeedResponse iteration and error status codes | ❌ | Does not iterate FeedResponse with for-await-of; error status codes are checked but not via RestError. |

### Summary

The code is clean, builds, and covers all required Cosmos DB CRUD operations with correct SDK usage. However, it lacks @azure/identity, does not use for-await-of for pagination, does not handle RestError, and omits @azure/logger for diagnostics. Some package versions are outdated.

### Strengths

- Covers all required CRUD operations.
- Clean, idiomatic TypeScript code.
- Proper use of async/await and SDK patterns.
- package.json and tsconfig.json are present and correct.

### Issues

- No @azure/identity usage; uses key-based auth.
- No RestError exception handling.
- No @azure/logger diagnostic logging.
- Does not use for-await-of for pagination.
- Not all packages are at latest versions.

## Grader Results

| Grader | Type | Score | Summary |
|--------|------|-------|----------|
| `gpt-4.1` | review | 15/22 | The code is clean, builds, and covers all required Cosmos DB CRUD operations wit… |
| 🏆 `gpt-4.1` | review | 15/22 | The code is clean, builds, and covers all required Cosmos DB CRUD operations wit… |

## Re-run Command

```bash
hyoka run --prompt-id cosmos-db-dp-js-ts-crud --config azure-mcp-skills/gpt-5.4
```

---

[← Back to Summary](../../../../../../summary.md)
