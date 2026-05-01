# Evaluation Report: cosmos-db-dp-js-ts-crud

**Config:** azure-mcp-skills/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 32.2s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `cosmos-db-dp-js-ts-crud` |
| Config | azure-mcp-skills/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 32.2s |
| Timestamp | 2026-04-30T23:19:21Z |
| Files Generated | 0 |
| Event Count | 60 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 32.1s |
| **Total** | **32.2s** |

## Configuration

- **name:** azure-mcp-skills/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=78063 out=1659 |
| Turn Count | 3 |

## Error

```
0 files generated — agent did not create any files
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

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Cosmos CRUD sample"}
```

### 🔧 2. glob

**Input:**

```json
{"pattern":"**/*"}
```

### 🔧 3. report_intent

**Input:**

```json
{"intent":"Creating Cosmos CRUD sample"}
```

### 🔧 4. powershell

**Input:**

```json
{"command":"Get-ChildItem -Force","description":"List workspace files"}
```

## Copilot Response

Install the required package:

```bash
npm install @azure/cosmos
# optional to run TS directly:
npm install -D typescript ts-node @types/node
```

```ts
// cosmos-crud.ts
import { CosmosClient, SqlQuerySpec } from "@azure/cosmos";

type Item = {
  id: string;
  category: string;
  name: string;
  quantity: number;
};

function assertStatus(
  action: string,
  statusCode: number | undefined,
  expected: number[]
) {
  if (!statusCode || !expected.includes(statusCode)) {
    throw new Error(
      `${action} failed. Expected status ${expected.join(" or ")}, got ${
        statusCode ?? "undefined"
      }`
    );
  }
}

async function main() {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint || !key) {
    throw new Error("Set COSMOS_ENDPOINT and COSMOS_KEY environment variables.");
  }

  const client = new CosmosClient({ endpoint, key });

  // 1 & 2) Create database and container
  const { database, statusCode: dbStatus } =
    await client.databases.createIfNotExists({ id: "TestDB" });
  assertStatus("Create database", dbStatus, [200, 201]);

  const { container, statusCode: containerStatus } =
    await database.containers.createIfNotExists({
      id: "Items",
      partitionKey: { paths: ["/category"] },
    });
  assertStatus("Create container", containerStatus, [200, 201]);

  // 3) Create item
  const newItem: Item = {
    id: "item-1",
    category: "electronics",
    name: "Headphones",
    quantity: 10,
  };
  const createRes = await container.items.create(newItem);
  assertStatus("Create item", createRes.statusCode, [201]);

  // 4) Read item back
  const itemRef = container.item(newItem.id, newItem.category);
  const readRes = await itemRef.read<Item>();
  assertStatus("Read item", readRes.statusCode, [200]);

  // 5) Parameterized query
  const querySpec: SqlQuerySpec = {
    query: "SELECT * FROM c WHERE c.category = @category",
    parameters: [{ name: "@category", value: "electronics" }],
  };
  const queryRes = await container.items.query<Item>(querySpec).fetchAll();
  assertStatus("Query items", queryRes.statusCode, [200]);

  // 6) Replace item with updated quantity
  if (!readRes.resource) throw new Error("Read item returned no resource.");
  const updatedItem: Item = { ...readRes.resource, quantity: 25 };
  const replaceRes = await itemRef.replace(updatedItem);
  assertStatus("Replace item", replaceRes.statusCode, [200]);

  // 7) Delete item
  const deleteRes = await itemRef.delete();
  assertStatus("Delete item", deleteRes.statusCode, [200, 204]);

  console.log("CRUD operations completed successfully.");
  console.log("Queried items:", queryRes.resources);
}

main().catch((err: any) => {
  const status = err?.statusCode;
  const code = err?.code;
  const message = err?.message ?? String(err);

  if (status) {
    console.error(`Cosmos DB error (${status}${code ? `, ${code}` : ""}): ${message}`);
  } else {
    console.error(`Unexpected error${code ? ` (${code})` : ""}: ${message}`);
  }
  process.exit(1);
});
```

Run with:

```bash
npx ts-node cosmos-crud.ts
```

## Re-run Command

```bash
hyoka run --prompt-id cosmos-db-dp-js-ts-crud --config azure-mcp-skills/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
