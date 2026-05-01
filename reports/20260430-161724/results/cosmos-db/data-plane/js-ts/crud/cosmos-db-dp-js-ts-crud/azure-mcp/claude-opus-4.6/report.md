# Evaluation Report: cosmos-db-dp-js-ts-crud

**Config:** azure-mcp/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 71.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `cosmos-db-dp-js-ts-crud` |
| Config | azure-mcp/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 71.7s |
| Timestamp | 2026-04-30T23:19:16Z |
| Files Generated | 0 |
| Event Count | 155 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 71.6s |
| **Total** | **71.7s** |

## Configuration

- **name:** azure-mcp/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=358165 out=4107 |
| Turn Count | 10 |

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

The user wants a TypeScript program for Azure Cosmos DB CRUD operations. Let me create the project.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Cosmos DB CRUD project"}
```

### 🔧 2. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-claude-opus-4.6-1165603090"}
```

### 🔧 3. powershell

**Input:**

```json
{"command":"Get-ChildItem -Force | Select-Object Name","description":"List directory contents"}
```

### 🔧 4. glob

**Input:**

```json
{"pattern":"**/*"}
```

### 🔧 5. powershell

**Input:**

```json
{"command":"Get-ChildItem -Force | Select-Object Name","description":"List directory contents"}
```

### 🔧 6. powershell

**Input:**

```json
{"command":"dir","description":"List files"}
```

### 🔧 7. powershell

**Input:**

```json
{"command":"Write-Output \"hello\"","description":"Test powershell"}
```

### 🔧 8. powershell

**Input:**

```json
{"command":"ls","description":"list files","shellId":"main"}
```

### 🔧 9. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"cosmos-db-crud\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Azure Cosmos DB NoSQL CRUD operations in TypeScript\",\n  \"main\": \"dist/index.js\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/index.js\"\n  },\n  \"dependencies\": {\n    \"@azure/cosmos\": \"^4.2.0\"\n  },\n  \"devDependencies\": {\n    \"typescript\": \"^5.7.0\",\n    \"@types/node\": \"^22.0.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-claude-opus-4.6-1165603090\\package.json"}
```

### 🔧 10. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./src\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true,\n    \"declaration\": true\n  },\n  \"include\": [\"src/**/*\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-claude-opus-4.6-1165603090\\tsconfig.json"}
```

### 🔧 11. create

**Input:**

```json
{"file_text":"import { CosmosClient, Database, Container, StatusCodes } from \"@azure/cosmos\";\n\n// ---------- configuration ----------\nconst endpoint = process.env.COSMOS_ENDPOINT || \"\u003cyour-cosmos-endpoint\u003e\";\nconst key = process.env.COSMOS_KEY || \"\u003cyour-cosmos-key\u003e\";\n\nconst databaseId = \"TestDB\";\nconst containerId = \"Items\";\nconst partitionKeyPath = \"/category\";\n\n// ---------- types ----------\ninterface Item {\n  id: string;\n  category: string;\n  name: string;\n  quantity: number;\n}\n\n// ---------- helpers ----------\nasync function createDatabaseAndContainer(\n  client: CosmosClient\n): Promise\u003c{ database: Database; container: Container }\u003e {\n  const { database } = await client.databases.createIfNotExists({\n    id: databaseId,\n  });\n  console.log(`Database ready : ${database.id}`);\n\n  const { container } = await database.containers.createIfNotExists({\n    id: containerId,\n    partitionKey: { paths: [partitionKeyPath] },\n  });\n  console.log(`Container ready: ${container.id}`);\n\n  return { database, container };\n}\n\n// 1 — Create\nasync function createItem(container: Container, item: Item): Promise\u003cItem\u003e {\n  const { resource, statusCode } = await container.items.create\u003cItem\u003e(item);\n  if (statusCode !== StatusCodes.Created) {\n    throw new Error(`Create failed with status ${statusCode}`);\n  }\n  console.log(`Created item   : ${resource!.id} (status ${statusCode})`);\n  return resource!;\n}\n\n// 2 — Read\nasync function readItem(\n  container: Container,\n  id: string,\n  category: string\n): Promise\u003cItem\u003e {\n  const { resource, statusCode } = await container\n    .item(id, category)\n    .read\u003cItem\u003e();\n  if (statusCode !== StatusCodes.Ok) {\n    throw new Error(`Read failed with status ${statusCode}`);\n  }\n  console.log(`Read item      : ${resource!.name}, qty ${resource!.quantity} (status ${statusCode})`);\n  return resource!;\n}\n\n// 3 — Query (parameterized)\nasync function queryItemsByCategory(\n  container: Container,\n  category: string\n): Promise\u003cItem[]\u003e {\n  const querySpec = {\n    query: \"SELECT * FROM Items i WHERE i.category = @category\",\n    parameters: [{ name: \"@category\", value: category }],\n  };\n\n  const { resources } = await container.items\n    .query\u003cItem\u003e(querySpec)\n    .fetchAll();\n  console.log(`Query returned : ${resources.length} item(s) in \"${category}\"`);\n  resources.forEach((r) =\u003e console.log(`  - ${r.name} (qty ${r.quantity})`));\n  return resources;\n}\n\n// 4 — Replace (update)\nasync function replaceItem(\n  container: Container,\n  item: Item\n): Promise\u003cItem\u003e {\n  const { resource, statusCode } = await container\n    .item(item.id, item.category)\n    .replace\u003cItem\u003e(item);\n  if (statusCode !== StatusCodes.Ok) {\n    throw new Error(`Replace failed with status ${statusCode}`);\n  }\n  console.log(`Replaced item  : ${resource!.id}, new qty ${resource!.quantity} (status ${statusCode})`);\n  return resource!;\n}\n\n// 5 — Delete\nasync function deleteItem(\n  container: Container,\n  id: string,\n  category: string\n): Promise\u003cvoid\u003e {\n  const { statusCode } = await container.item(id, category).delete();\n  if (statusCode !== StatusCodes.NoContent) {\n    throw new Error(`Delete failed with status ${statusCode}`);\n  }\n  console.log(`Deleted item   : ${id} (status ${statusCode})`);\n}\n\n// ---------- main ----------\nasync function main(): Promise\u003cvoid\u003e {\n  // Step 1 — Create the CosmosClient\n  const client = new CosmosClient({ endpoint, key });\n\n  // Step 2 — Ensure database \u0026 container exist\n  const { container } = await createDatabaseAndContainer(client);\n\n  const newItem: Item = {\n    id: \"item-1\",\n    category: \"electronics\",\n    name: \"Wireless Mouse\",\n    quantity: 25,\n  };\n\n  // Step 3 — Create an item\n  await createItem(container, newItem);\n\n  // Step 4 — Read the item back\n  await readItem(container, newItem.id, newItem.category);\n\n  // Step 5 — Query items by category\n  await queryItemsByCategory(container, \"electronics\");\n\n  // Step 6 — Replace (update quantity)\n  const updatedItem: Item = { ...newItem, quantity: 50 };\n  await replaceItem(container, updatedItem);\n\n  // Step 7 — Delete the item\n  await deleteItem(container, newItem.id, newItem.category);\n\n  console.log(\"\\nAll CRUD operations completed successfully.\");\n}\n\nmain().catch((err) =\u003e {\n  console.error(\"Fatal error:\", err.message ?? err);\n  process.exit(1);\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-cosmos-db-dp-js-ts-crud-azure-mcp-claude-opus-4.6-1165603090\\src\\index.ts"}
```

### 🔧 12. powershell

**Input:**

```json
{"command":"mkdir -Force src; Write-Output \"done\"","description":"Create src directory","mode":"sync"}
```

## Copilot Response

Let me create the project files directly.

It looks like I'm hitting permission issues. Let me try a different approach.

I'm experiencing persistent permission issues with the tools. Let me provide the complete solution directly.

## Azure Cosmos DB NoSQL CRUD — TypeScript

### Required npm package

```
npm install @azure/cosmos
npm install -D typescript @types/node
```

### `tsconfig.json`

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
  "include": ["src/**/*"]
}
```

### `src/index.ts`

```typescript
import { CosmosClient, Database, Container, StatusCodes } from "@azure/cosmos";

// ---------- configuration ----------
const endpoint = process.env.COSMOS_ENDPOINT || "<your-cosmos-endpoint>";
const key      = process.env.COSMOS_KEY      || "<your-cosmos-key>";

const databaseId    = "TestDB";
const containerId   = "Items";
const partitionKey  = "/category";

// ---------- types ----------
interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

// ---------- helpers ----------
async function createDatabaseAndContainer(
  client: CosmosClient
): Promise<{ database: Database; container: Container }> {
  const { database } = await client.databases.createIfNotExists({ id: databaseId });
  console.log(`Database ready : ${database.id}`);

  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: [partitionKey] },
  });
  console.log(`Container ready: ${container.id}`);
  return { database, container };
}

// 1 — Create
async function createItem(container: Container, item: Item): Promise<Item> {
  const { resource, statusCode } = await container.items.create<Item>(item);
  if (statusCode !== StatusCodes.Created) {
    throw new Error(`Create failed with status ${statusCode}`);
  }
  console.log(`Created item   : ${resource!.id} (status ${statusCode})`);
  return resource!;
}

// 2 — Read
async function readItem(container: Container, id: string, category: string): Promise<Item> {
  const { resource, statusCode } = await container.item(id, category).read<Item>();
  if (statusCode !== StatusCodes.Ok) {
    throw new Error(`Read failed with status ${statusCode}`);
  }
  console.log(`Read item      : ${resource!.name}, qty ${resource!.quantity} (status ${statusCode})`);
  return resource!;
}

// 3 — Query (parameterized)
async function queryItemsByCategory(container: Container, category: string): Promise<Item[]> {
  const querySpec = {
    query: "SELECT * FROM Items i WHERE i.category = @category",
    parameters: [{ name: "@category", value: category }],
  };
  const { resources } = await container.items.query<Item>(querySpec).fetchAll();
  console.log(`Query returned : ${resources.length} item(s) in "${category}"`);
  resources.forEach((r) => console.log(`  - ${r.name} (qty ${r.quantity})`));
  return resources;
}

// 4 — Replace (update)
async function replaceItem(container: Container, item: Item): Promise<Item> {
  const { resource, statusCode } = await container.item(item.id, item.category).replace<Item>(item);
  if (statusCode !== StatusCodes.Ok) {
    throw new Error(`Replace failed with status ${statusCode}`);
  }
  console.log(`Replaced item  : ${resource!.id}, new qty ${resource!.quantity} (status ${statusCode})`);
  return resource!;
}

// 5 — Delete
async function deleteItem(container: Container, id: string, category: string): Promise<void> {
  const { statusCode } = await container.item(id, category).delete();
  if (statusCode !== StatusCodes.NoContent) {
    throw new Error(`Delete failed with status ${statusCode}`);
  }
  console.log(`Deleted item   : ${id} (status ${statusCode})`);
}

// ---------- main ----------
async function main(): Promise<void> {
  const client = new CosmosClient({ endpoint, key });
  const { container } = await createDatabaseAndContainer(client);

  const newItem: Item = {
    id: "item-1",
    category: "electronics",
    name: "Wireless Mouse",
    quantity: 25,
  };

  await createItem(container, newItem);
  await readItem(container, newItem.id, newItem.category);
  await queryItemsByCategory(container, "electronics");

  const updatedItem: Item = { ...newItem, quantity: 50 };
  await replaceItem(container, updatedItem);

  await deleteItem(container, newItem.id, newItem.category);

  console.log("\nAll CRUD operations completed successfully.");
}

main().catch((err) => {
  console.error("Fatal error:", err.message ?? err);
  process.exit(1);
});
```

### How to run

```bash
export COSMOS_ENDPOINT="https://<account>.documents.azure.com:443/"
export COSMOS_KEY="<your-key>"
npm install && npm run build && npm start
```

**Key points:**
- Uses `@azure/cosmos` SDK v4 with `StatusCodes` for response validation
- `createIfNotExists` ensures idempotent setup of database/container
- Parameterized query (`@category`) prevents injection
- Each operation checks its expected HTTP status (201, 200, 204)
- Partition key (`category`) is passed on point reads/writes for efficiency

## Re-run Command

```bash
hyoka run --prompt-id cosmos-db-dp-js-ts-crud --config azure-mcp/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
