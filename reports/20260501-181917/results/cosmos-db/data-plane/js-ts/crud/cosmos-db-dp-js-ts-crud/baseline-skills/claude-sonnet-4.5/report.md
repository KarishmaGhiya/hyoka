# Evaluation Report: cosmos-db-dp-js-ts-crud

**Config:** baseline-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 135.8s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `cosmos-db-dp-js-ts-crud` |
| Config | baseline-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Score | 17/10 |
| Duration | 135.8s |
| Timestamp | 2026-05-02T01:21:01Z |
| Files Generated | 4 |
| Event Count | 72 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 63.7s |
| Review | 71.9s |
| **Total** | **135.8s** |

## Configuration

- **name:** baseline-skills/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skill Directories | C:\code\hyoka\skills\generator\js-ts-azure-patterns, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-identity-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-storage-blob-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-keyvault-secrets-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-keyvault-keys-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-cosmos-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-servicebus-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-eventhub-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-appconfiguration-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-storage-queue-ts |
| Skills Loaded | azure-identity-ts, azure-storage-blob-ts, azure-keyvault-secrets-ts, azure-keyvault-keys-ts, azure-cosmos-ts, azure-servicebus-ts, azure-eventhub-ts, azure-appconfiguration-ts, azure-storage-queue-ts, customize-cloud-agent |
| Skills Invoked | azure-cosmos-ts |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=67389 out=3776 |
| Turn Count | 3 |

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

## Copilot Reasoning

The user is asking for a TypeScript program that performs CRUD operations on Azure Cosmos DB NoSQL container. This is a perfect match for the azure-cosmos-ts skill. According to my instructions, I should invoke the relevant skill BEFORE writing any code.

Let me invoke the azure-cosmos-ts skill to get SDK-specific patterns, API examples, and acceptance criteria.

Now I have the Azure Cosmos DB skill context. The user wants a TypeScript program that performs CRUD operations. Let me create a comprehensive example that:

1. Creates a CosmosClient using endpoint and key
2. Creates a database "TestDB" and container "Items" with partition key "/category"
3. Creates an item with properties: id, category, name, quantity
4. Reads the item back using item().read()
5. Queries items where category equals "electronics" using parameterized query
6. Replaces the item with updated quantity using item().replace()
7. Deletes the item using item().delete()

I'll follow the best practices from the skill:
- Use proper error handling with status codes
- Use parameterized queries
- Show the required npm package
- Include proper TypeScript types

Let me create this program now.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Cosmos DB CRUD app"}
```

### 🔧 2. skill

**Input:**

```json
{"skill":"azure-cosmos-ts"}
```

### 🔧 3. create

**Input:**

```json
{"file_text":"import { CosmosClient, Container, Database, ErrorResponse, SqlQuerySpec } from \"@azure/cosmos\";\n\ninterface Item {\n  id: string;\n  category: string;\n  name: string;\n  quantity: number;\n}\n\nasync function main() {\n  // 1. Create a CosmosClient using endpoint and key\n  const endpoint = process.env.COSMOS_ENDPOINT || \"https://\u003cyour-account\u003e.documents.azure.com:443/\";\n  const key = process.env.COSMOS_KEY || \"\u003cyour-key\u003e\";\n  \n  const client = new CosmosClient({ endpoint, key });\n  console.log(\"✓ CosmosClient created\");\n\n  try {\n    // 2. Create a database \"TestDB\" and container \"Items\" with partition key \"/category\"\n    const { database } = await client.databases.createIfNotExists({\n      id: \"TestDB\",\n    });\n    console.log(\"✓ Database 'TestDB' created or already exists\");\n\n    const { container } = await database.containers.createIfNotExists({\n      id: \"Items\",\n      partitionKey: { paths: [\"/category\"] },\n    });\n    console.log(\"✓ Container 'Items' created with partition key '/category'\");\n\n    // 3. Create an item with properties: id, category, name, quantity\n    const newItem: Item = {\n      id: \"item-001\",\n      category: \"electronics\",\n      name: \"Laptop\",\n      quantity: 10,\n    };\n\n    const { resource: createdItem, statusCode: createStatus } = await container.items.create\u003cItem\u003e(newItem);\n    console.log(`✓ Item created (Status: ${createStatus}):`, createdItem);\n\n    // 4. Read the item back using item().read()\n    const { resource: readItem, statusCode: readStatus } = await container\n      .item(newItem.id, newItem.category)\n      .read\u003cItem\u003e();\n    console.log(`✓ Item read (Status: ${readStatus}):`, readItem);\n\n    // 5. Query items where category equals \"electronics\" using parameterized query\n    const querySpec: SqlQuerySpec = {\n      query: \"SELECT * FROM c WHERE c.category = @category\",\n      parameters: [\n        { name: \"@category\", value: \"electronics\" },\n      ],\n    };\n\n    const { resources: queryResults } = await container.items\n      .query\u003cItem\u003e(querySpec)\n      .fetchAll();\n    console.log(`✓ Query results (found ${queryResults.length} items):`, queryResults);\n\n    // 6. Replace the item with updated quantity using item().replace()\n    if (readItem) {\n      readItem.quantity = 25;\n      const { resource: updatedItem, statusCode: replaceStatus } = await container\n        .item(readItem.id, readItem.category)\n        .replace\u003cItem\u003e(readItem);\n      console.log(`✓ Item replaced with updated quantity (Status: ${replaceStatus}):`, updatedItem);\n    }\n\n    // 7. Delete the item using item().delete()\n    const { statusCode: deleteStatus } = await container\n      .item(newItem.id, newItem.category)\n      .delete();\n    console.log(`✓ Item deleted (Status: ${deleteStatus})`);\n\n    // Verify deletion\n    try {\n      await container.item(newItem.id, newItem.category).read\u003cItem\u003e();\n    } catch (error) {\n      if (error instanceof ErrorResponse \u0026\u0026 error.code === 404) {\n        console.log(\"✓ Verified: Item no longer exists\");\n      }\n    }\n\n  } catch (error) {\n    if (error instanceof ErrorResponse) {\n      console.error(`❌ Cosmos DB Error (${error.code}): ${error.message}`);\n      \n      switch (error.code) {\n        case 400:\n          console.error(\"Bad request - check your request parameters\");\n          break;\n        case 401:\n          console.error(\"Unauthorized - check your credentials\");\n          break;\n        case 403:\n          console.error(\"Forbidden - check your permissions\");\n          break;\n        case 404:\n          console.error(\"Resource not found\");\n          break;\n        case 409:\n          console.error(\"Conflict - resource already exists\");\n          break;\n        case 412:\n          console.error(\"Precondition failed - ETag mismatch\");\n          break;\n        case 429:\n          console.error(`Rate limited - retry after ${error.retryAfterInMs}ms`);\n          break;\n        case 500:\n          console.error(\"Internal server error\");\n          break;\n        case 503:\n          console.error(\"Service unavailable\");\n          break;\n        default:\n          console.error(\"Unknown error occurred\");\n      }\n    } else {\n      console.error(\"❌ Unexpected error:\", error);\n    }\n    process.exit(1);\n  } finally {\n    // Clean up\n    client.dispose();\n    console.log(\"✓ CosmosClient disposed\");\n  }\n}\n\nmain().catch((error) =\u003e {\n  console.error(\"❌ Fatal error:\", error);\n  process.exit(1);\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-290962838\\cosmos-crud.ts"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"cosmos-crud-example\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Azure Cosmos DB CRUD operations example\",\n  \"main\": \"cosmos-crud.ts\",\n  \"scripts\": {\n    \"start\": \"ts-node cosmos-crud.ts\",\n    \"build\": \"tsc\",\n    \"dev\": \"ts-node-dev cosmos-crud.ts\"\n  },\n  \"dependencies\": {\n    \"@azure/cosmos\": \"^4.9.0\",\n    \"@azure/identity\": \"^4.0.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.0.0\",\n    \"typescript\": \"^5.0.0\",\n    \"ts-node\": \"^10.9.0\",\n    \"ts-node-dev\": \"^2.0.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-290962838\\package.json"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true,\n    \"moduleResolution\": \"node\"\n  },\n  \"include\": [\"*.ts\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-290962838\\tsconfig.json"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"# Azure Cosmos DB CRUD Operations Example\n\nThis TypeScript program demonstrates all CRUD operations on Azure Cosmos DB NoSQL containers.\n\n## Features\n\n1. ✅ Create CosmosClient using endpoint and key\n2. ✅ Create database \"TestDB\" and container \"Items\" with partition key \"/category\"\n3. ✅ Create an item with id, category, name, quantity properties\n4. ✅ Read the item using item().read()\n5. ✅ Query items with parameterized query (category = \"electronics\")\n6. ✅ Replace item with updated quantity using item().replace()\n7. ✅ Delete item using item().delete()\n8. ✅ Comprehensive error handling with status code checks\n\n## Required Package\n\n```bash\nnpm install @azure/cosmos @azure/identity\n```\n\n## Setup\n\n1. **Install dependencies:**\n   ```bash\n   npm install\n   ```\n\n2. **Set environment variables:**\n   ```bash\n   # Windows PowerShell\n   $env:COSMOS_ENDPOINT=\"https://\u003cyour-account\u003e.documents.azure.com:443/\"\n   $env:COSMOS_KEY=\"\u003cyour-primary-or-secondary-key\u003e\"\n\n   # Linux/macOS\n   export COSMOS_ENDPOINT=\"https://\u003cyour-account\u003e.documents.azure.com:443/\"\n   export COSMOS_KEY=\"\u003cyour-primary-or-secondary-key\u003e\"\n   ```\n\n## Run\n\n```bash\n# Using ts-node\nnpm start\n\n# Or compile and run\nnpm run build\nnode dist/cosmos-crud.js\n```\n\n## Expected Output\n\n```\n✓ CosmosClient created\n✓ Database 'TestDB' created or already exists\n✓ Container 'Items' created with partition key '/category'\n✓ Item created (Status: 201): { id: 'item-001', category: 'electronics', name: 'Laptop', quantity: 10 }\n✓ Item read (Status: 200): { id: 'item-001', category: 'electronics', name: 'Laptop', quantity: 10 }\n✓ Query results (found 1 items): [...]\n✓ Item replaced with updated quantity (Status: 200): { id: 'item-001', category: 'electronics', name: 'Laptop', quantity: 25 }\n✓ Item deleted (Status: 204)\n✓ Verified: Item no longer exists\n✓ CosmosClient disposed\n```\n\n## Error Handling\n\nThe program handles common Cosmos DB errors:\n- **400**: Bad request\n- **401**: Unauthorized\n- **403**: Forbidden\n- **404**: Not found\n- **409**: Conflict\n- **412**: Precondition failed (ETag mismatch)\n- **429**: Rate limited (includes retry-after time)\n- **500**: Internal server error\n- **503**: Service unavailable\n\n## Notes\n\n- Uses key-based authentication (recommended to use Microsoft Entra token credentials in production)\n- Container uses partition key `/category` for optimal distribution\n- All operations include status code checks\n- Parameterized queries prevent injection attacks\n- Client is properly disposed in finally block\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-290962838\\README.md"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"# Azure Cosmos DB Configuration\nCOSMOS_ENDPOINT=https://\u003cyour-account\u003e.documents.azure.com:443/\nCOSMOS_KEY=\u003cyour-primary-or-secondary-key\u003e\n\n# Optional: For production environments using Microsoft Entra token credentials\n# AZURE_TOKEN_CREDENTIALS=prod\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-290962838\\.env.example"}
```

## Generated Files

- `README.md`
- `cosmos-crud.ts`
- `package.json`
- `tsconfig.json`

## Copilot Response

I'll help you create a TypeScript program for Azure Cosmos DB CRUD operations. Let me first invoke the Azure Cosmos DB skill to get the best practices and patterns.

Now I'll create a comprehensive TypeScript program demonstrating all the CRUD operations you requested.

Perfect! I've created a complete TypeScript program demonstrating all Azure Cosmos DB CRUD operations. Here's what was created:

## 📁 Files Created

**`cosmos-crud.ts`** - Main program with all 7 operations:
1. ✅ CosmosClient creation (endpoint + key)
2. ✅ Database "TestDB" & container "Items" with partition key "/category"
3. ✅ Create item with id, category, name, quantity
4. ✅ Read item using `item().read()`
5. ✅ Parameterized query for category = "electronics"
6. ✅ Replace item with updated quantity using `item().replace()`
7. ✅ Delete item using `item().delete()`

**`package.json`** - Dependencies including `@azure/cosmos@^4.9.0`

**`tsconfig.json`** - TypeScript configuration

**`README.md`** - Setup instructions and documentation

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
$env:COSMOS_ENDPOINT="https://<your-account>.documents.azure.com:443/"
$env:COSMOS_KEY="<your-key>"

# Run the program
npm start
```

## 🛡️ Error Handling

The program includes comprehensive error handling for all common status codes (400, 401, 403, 404, 409, 412, 429, 500, 503) with descriptive messages and proper resource cleanup.

## Code Review (LLM-as-Judge)

**Score: 17/21 criteria passed**

### Criteria Results

| Criterion | Result | Reason |
|-----------|--------|--------|
| Code Builds | ✅ | Valid TypeScript syntax with proper tsconfig.json, package.json with all required dependencies, and correct imports. No syntax errors detected. |
| Latest Package Versions | ✅ | @azure/cosmos@^4.9.0 and @azure/identity@^4.0.0 are recent stable versions. Using caret ranges allows automatic patch/minor updates. |
| Best Practices | ✅ | Uses async/await pattern, proper client disposal in finally block, error handling with ErrorResponse, and environment variables for configuration. |
| Error Handling | ✅ | Comprehensive error handling with ErrorResponse catch, status code checking (400-503), and specific error messages for each status code including retry-after for 429. |
| Code Quality | ✅ | Clean, readable code with TypeScript interfaces, descriptive variable names, logical flow, and helpful console output with status codes. |
| Correct @azure/ Scoped Packages | ✅ | Uses @azure/cosmos and @azure/identity - both are correctly scoped packages. No deprecated unscoped packages. |
| @azure/identity for Authentication | ❌ | Includes @azure/identity as dependency but does NOT use it. Code uses key-based authentication (CosmosClient with key) instead of token credential. Should use DefaultAzureCredential or specific credential type. |
| Client Constructor with Endpoint and Credential | ❌ | Uses new CosmosClient({ endpoint, key }) with hardcoded key instead of credential object pattern. Should be new CosmosClient({ endpoint, credential }). |
| Async/Await Pattern | ✅ | All async operations use await. Top-level async function with proper error handling. No .then()/.catch() chains or callbacks. |
| Pagination with for-await-of | ❌ | Query uses .fetchAll() which loads all results into memory. Should use for-await-of iteration over the query iterator or byPage() for proper pagination. |
| LRO Pattern (beginXxx + pollUntilDone) | ✅ | Not applicable - Cosmos DB operations used here (create, read, query, replace, delete) are not long-running operations. Criterion passes by N/A. |
| RestError Exception Handling | ❌ | Catches ErrorResponse from @azure/cosmos (correct for Cosmos) but not RestError from @azure/core-rest-pipeline. However, ErrorResponse is the appropriate exception type for Cosmos SDK, so this is a criterial mismatch. Status code inspection is correct. |
| No Deprecated Packages | ✅ | Only uses @azure/cosmos and @azure/identity - both are current track packages. No deprecated packages present. |
| Logging via @azure/logger | ❌ | No @azure/logger usage. Uses console.log/console.error instead. Should use setLogLevel() or AZURE_LOG_LEVEL for SDK diagnostics. |
| package.json with Correct Dependencies | ✅ | Valid package.json with @azure/cosmos and @azure/identity dependencies, plus TypeScript and ts-node devDependencies. tsconfig.json is present and properly configured. |
| @azure/cosmos npm package | ✅ | package.json includes @azure/cosmos@^4.9.0 |
| CosmosClient constructor with endpoint and key | ✅ | Line 15: new CosmosClient({ endpoint, key }) correctly creates client with endpoint and key from environment variables |
| client.databases.createIfNotExists() and database.containers.createIfNotExists() | ✅ | Lines 19-22: client.databases.createIfNotExists() creates TestDB. Lines 24-27: database.containers.createIfNotExists() creates Items container with partition key /category |
| container.items.create() and container.item(id, partitionKey).read() | ✅ | Lines 36-37: container.items.create() creates item. Lines 40-42: container.item().read() reads item back with id and partition key |
| container.items.query() with SqlQuerySpec | ✅ | Lines 45-51: Uses SqlQuerySpec with parameterized query (@category parameter) for category='electronics' |
| container.item(id, partitionKey).replace() and .delete() | ✅ | Lines 56-60: container.item().replace() updates quantity. Lines 63-66: container.item().delete() deletes the item |
| FeedResponse iteration and error status codes | ✅ | Lines 53-54: Uses fetchAll() to get resources. Lines 37, 42, 59, 65: Extracts statusCode from responses. Lines 76-108: Comprehensive status code error handling (400-503) |

### Summary

The generated code successfully implements all required Cosmos DB CRUD operations with proper error handling and status code checks. However, it fails several Azure SDK best practices: uses key-based authentication instead of @azure/identity credentials, loads all query results into memory with fetchAll() instead of using for-await-of pagination, and lacks @azure/logger for SDK diagnostics. The code is otherwise well-structured, includes all required operations, and demonstrates comprehensive error handling.

### Strengths

- All CRUD operations correctly implemented with proper Cosmos DB SDK methods
- Comprehensive error handling with specific status code checks (400-503)
- Proper async/await pattern throughout
- Client disposal in finally block
- Parameterized queries prevent injection attacks
- Clear console output with status codes
- Well-structured TypeScript with interfaces
- Complete package.json and tsconfig.json

### Issues

- Uses key-based authentication instead of credential-based auth - @azure/identity is included but not used
- Query operation uses fetchAll() which loads all results into memory - should use for-await-of iteration
- No @azure/logger usage for SDK diagnostic logging
- README mentions key-based auth is not recommended for production but code doesn't demonstrate the recommended pattern

## Grader Results

| Grader | Type | Score | Summary |
|--------|------|-------|----------|
| `claude-sonnet-4.5` | review | 17/21 | The generated code successfully implements all required Cosmos DB CRUD operation… |
| 🏆 `claude-sonnet-4.5` | review | 17/21 | The generated code successfully implements all required Cosmos DB CRUD operation… |

## Re-run Command

```bash
hyoka run --prompt-id cosmos-db-dp-js-ts-crud --config baseline-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
