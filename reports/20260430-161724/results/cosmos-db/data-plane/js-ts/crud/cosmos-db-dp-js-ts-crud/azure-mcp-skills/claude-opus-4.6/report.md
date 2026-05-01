# Evaluation Report: cosmos-db-dp-js-ts-crud

**Config:** azure-mcp-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 67.4s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `cosmos-db-dp-js-ts-crud` |
| Config | azure-mcp-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 67.4s |
| Timestamp | 2026-04-30T23:19:37Z |
| Files Generated | 0 |
| Event Count | 142 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 67.3s |
| **Total** | **67.4s** |

## Configuration

- **model:** claude-opus-4.6
- **name:** azure-mcp-skills/claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=323587 out=3892 |
| Turn Count | 9 |

## Error

```
0 files generated despite 3 file-write tool attempts
```

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

The user wants a TypeScript program for Azure Cosmos DB CRUD operations. Let me create the project structure.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Cosmos DB CRUD app"}
```

### 🔧 2. powershell

**Input:**

```json
{"command":"cd C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-skills-claude-opus-4.6-4275805577; npm init -y 2\u003e\u00261 | Select-Object -Last 1; npm install @azure/cosmos 2\u003e\u00261 | Select-Object -Last 3; npm install -D typescript @types/node 2\u003e\u00261 | Select-Object -Last 3","description":"Initialize project and install dependencies","initial_wait":30}
```

### 🔧 3. powershell

**Input:**

```json
{"command":"cd C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-skills-claude-opus-4.6-4275805577; npm init -y 2\u003e\u00261 | Out-Null; npm install @azure/cosmos 2\u003e\u00261 | Select-Object -Last 3","description":"Init project and install cosmos SDK","initial_wait":30}
```

### 🔧 4. powershell

**Input:**

```json
{"command":"cd C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-skills-claude-opus-4.6-4275805577\nnpm init -y","description":"Initialize npm project","initial_wait":15}
```

### 🔧 5. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-skills-claude-opus-4.6-4275805577"}
```

### 🔧 6. powershell

**Input:**

```json
{"command":"Get-Location","description":"Check current directory"}
```

### 🔧 7. powershell

**Input:**

```json
{"command":"pwd","description":"Check working directory","initial_wait":10}
```

### 🔧 8. powershell

**Input:**

```json
{"command":"echo \"hello\"","description":"Test shell access"}
```

### 🔧 9. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"cosmos-crud\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Azure Cosmos DB NoSQL CRUD operations in TypeScript\",\n  \"main\": \"dist/index.js\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/index.js\"\n  },\n  \"dependencies\": {\n    \"@azure/cosmos\": \"^4.2.0\"\n  },\n  \"devDependencies\": {\n    \"typescript\": \"^5.4.0\",\n    \"@types/node\": \"^20.11.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-skills-claude-opus-4.6-4275805577\\package.json"}
```

### 🔧 10. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./src\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true\n  },\n  \"include\": [\"src\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-skills-claude-opus-4.6-4275805577\\tsconfig.json"}
```

### 🔧 11. create

**Input:**

```json
{"file_text":"import { CosmosClient, Database, Container, StatusCodes } from \"@azure/cosmos\";\n\n// --- Configuration ---\nconst endpoint = process.env.COSMOS_ENDPOINT || \"\u003cyour-cosmos-endpoint\u003e\";\nconst key = process.env.COSMOS_KEY || \"\u003cyour-cosmos-key\u003e\";\n\nconst databaseId = \"TestDB\";\nconst containerId = \"Items\";\nconst partitionKeyPath = \"/category\";\n\n// --- Types ---\ninterface Item {\n  id: string;\n  category: string;\n  name: string;\n  quantity: number;\n}\n\nasync function main(): Promise\u003cvoid\u003e {\n  // 1. Create a CosmosClient using endpoint and key\n  const client = new CosmosClient({ endpoint, key });\n\n  try {\n    // 2. Create database and container\n    const { database } = await client.databases.createIfNotExists({\n      id: databaseId,\n    });\n    console.log(`Database ready: ${database.id}`);\n\n    const { container } = await database.containers.createIfNotExists({\n      id: containerId,\n      partitionKey: { paths: [partitionKeyPath] },\n    });\n    console.log(`Container ready: ${container.id}`);\n\n    // 3. Create an item\n    const newItem: Item = {\n      id: \"item-1\",\n      category: \"electronics\",\n      name: \"Wireless Mouse\",\n      quantity: 25,\n    };\n\n    const { resource: created, statusCode: createStatus } =\n      await container.items.create\u003cItem\u003e(newItem);\n    console.log(\n      `\\nCreated item (status ${createStatus}):`,\n      JSON.stringify(created, null, 2)\n    );\n\n    // 4. Read the item back\n    const { resource: readItem, statusCode: readStatus } = await container\n      .item(newItem.id, newItem.category)\n      .read\u003cItem\u003e();\n    console.log(\n      `\\nRead item (status ${readStatus}):`,\n      JSON.stringify(readItem, null, 2)\n    );\n\n    // 5. Query items where category equals \"electronics\"\n    const querySpec = {\n      query: \"SELECT * FROM c WHERE c.category = @category\",\n      parameters: [{ name: \"@category\", value: \"electronics\" }],\n    };\n\n    const { resources: queryResults } = await container.items\n      .query\u003cItem\u003e(querySpec)\n      .fetchAll();\n    console.log(`\\nQuery returned ${queryResults.length} item(s):`);\n    for (const item of queryResults) {\n      console.log(`  - ${item.name} (qty: ${item.quantity})`);\n    }\n\n    // 6. Replace the item with updated quantity\n    const updatedItem: Item = { ...readItem!, quantity: 50 };\n    const { resource: replaced, statusCode: replaceStatus } = await container\n      .item(newItem.id, newItem.category)\n      .replace\u003cItem\u003e(updatedItem);\n    console.log(\n      `\\nReplaced item (status ${replaceStatus}):`,\n      JSON.stringify(replaced, null, 2)\n    );\n\n    // 7. Delete the item\n    const { statusCode: deleteStatus } = await container\n      .item(newItem.id, newItem.category)\n      .delete();\n    console.log(`\\nDeleted item (status ${deleteStatus})`);\n  } catch (error: unknown) {\n    if (typeof error === \"object\" \u0026\u0026 error !== null \u0026\u0026 \"code\" in error) {\n      const cosmosError = error as { code: number; body?: string };\n      switch (cosmosError.code) {\n        case StatusCodes.NotFound:\n          console.error(\"Resource not found (404)\");\n          break;\n        case StatusCodes.Conflict:\n          console.error(\"Resource already exists (409)\");\n          break;\n        case StatusCodes.TooManyRequests:\n          console.error(\"Rate limited (429) — retry after back-off\");\n          break;\n        default:\n          console.error(`Cosmos DB error (${cosmosError.code}):`, cosmosError.body);\n      }\n    } else {\n      console.error(\"Unexpected error:\", error);\n    }\n    process.exit(1);\n  }\n}\n\nmain();\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-skills-claude-opus-4.6-4275805577\\src\\index.ts"}
```

## Copilot Response

I'm unable to run shell commands in this session, so I'll create all the files directly.

It seems file operations are being blocked. Let me present the complete solution directly:

---

**Required npm package:** `@azure/cosmos`

```bash
npm init -y
npm install @azure/cosmos
npm install -D typescript @types/node
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**src/index.ts**
```typescript
import { CosmosClient, StatusCodes } from "@azure/cosmos";

const endpoint = process.env.COSMOS_ENDPOINT || "<your-cosmos-endpoint>";
const key = process.env.COSMOS_KEY || "<your-cosmos-key>";

const databaseId = "TestDB";
const containerId = "Items";

interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

async function main(): Promise<void> {
  // 1. Create a CosmosClient using endpoint and key
  const client = new CosmosClient({ endpoint, key });

  try {
    // 2. Create database and container with partition key /category
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    console.log(`Database ready: ${database.id}`);

    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: ["/category"] },
    });
    console.log(`Container ready: ${container.id}`);

    // 3. Create an item
    const newItem: Item = {
      id: "item-1",
      category: "electronics",
      name: "Wireless Mouse",
      quantity: 25,
    };
    const { resource: created, statusCode: createStatus } =
      await container.items.create<Item>(newItem);
    console.log(`\nCreated (status ${createStatus}):`, JSON.stringify(created, null, 2));

    // 4. Read the item back
    const { resource: readItem, statusCode: readStatus } = await container
      .item(newItem.id, newItem.category)
      .read<Item>();
    console.log(`\nRead (status ${readStatus}):`, JSON.stringify(readItem, null, 2));

    // 5. Query items where category = "electronics" (parameterized)
    const { resources: results } = await container.items
      .query<Item>({
        query: "SELECT * FROM c WHERE c.category = @category",
        parameters: [{ name: "@category", value: "electronics" }],
      })
      .fetchAll();
    console.log(`\nQuery returned ${results.length} item(s):`);
    for (const item of results) {
      console.log(`  - ${item.name} (qty: ${item.quantity})`);
    }

    // 6. Replace the item with updated quantity
    const updated: Item = { ...readItem!, quantity: 50 };
    const { resource: replaced, statusCode: replaceStatus } = await container
      .item(newItem.id, newItem.category)
      .replace<Item>(updated);
    console.log(`\nReplaced (status ${replaceStatus}):`, JSON.stringify(replaced, null, 2));

    // 7. Delete the item
    const { statusCode: deleteStatus } = await container
      .item(newItem.id, newItem.category)
      .delete();
    console.log(`\nDeleted (status ${deleteStatus})`);

  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error) {
      const cosmosErr = error as { code: number; body?: string };
      switch (cosmosErr.code) {
        case StatusCodes.NotFound:
          console.error("Resource not found (404)");
          break;
        case StatusCodes.Conflict:
          console.error("Resource already exists (409)");
          break;
        case StatusCodes.TooManyRequests:
          console.error("Rate limited (429) — retry after back-off");
          break;
        default:
          console.error(`Cosmos DB error (${cosmosErr.code}):`, cosmosErr.body);
      }
    } else {
      console.error("Unexpected error:", error);
    }
    process.exit(1);
  }
}

main();
```

**Run it:**
```bash
export COSMOS_ENDPOINT="https://<account>.documents.azure.com:443/"
export COSMOS_KEY="<your-key>"
npx tsc && node dist/index.js
```

Key points:
- **`item(id, partitionKey)`** — both arguments are required for point reads, replace, and delete
- **Parameterized queries** (`@category`) prevent injection attacks
- **`createIfNotExists`** is idempotent for database/container setup
- **`StatusCodes`** from `@azure/cosmos` provides named constants for HTTP status code checks

## Re-run Command

```bash
hyoka run --prompt-id cosmos-db-dp-js-ts-crud --config azure-mcp-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
