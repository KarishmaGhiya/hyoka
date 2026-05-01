# Evaluation Report: cosmos-db-dp-js-ts-crud

**Config:** baseline/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 18.1s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `cosmos-db-dp-js-ts-crud` |
| Config | baseline/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 18.1s |
| Timestamp | 2026-04-30T23:20:05Z |
| Files Generated | 0 |
| Event Count | 54 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 18.0s |
| **Total** | **18.1s** |

## Configuration

- **name:** baseline/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=43967 out=1105 |
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
{"intent":"Scaffolding CRUD script"}
```

### 🔧 2. glob

**Input:**

```json
{"pattern":"**/*"}
```

### 🔧 3. powershell

**Input:**

```json
{"command":"Get-ChildItem -Recurse -File | Select-Object -ExpandProperty FullName","description":"List workspace files"}
```

## Copilot Response

I’ll add a runnable TypeScript script with the full Cosmos DB CRUD flow and include the required npm package in `package.json`.

Use **`@azure/cosmos`**.

```bash
npm install @azure/cosmos
```

```ts
// cosmos-crud.ts
import { CosmosClient } from "@azure/cosmos";

type InventoryItem = {
  id: string;
  category: string;
  name: string;
  quantity: number;
};

async function main() {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint || !key) {
    throw new Error("Set COSMOS_ENDPOINT and COSMOS_KEY environment variables.");
  }

  const client = new CosmosClient({ endpoint, key });

  const { database } = await client.databases.createIfNotExists({ id: "TestDB" });
  const { container } = await database.containers.createIfNotExists({
    id: "Items",
    partitionKey: { paths: ["/category"] },
  });

  const item: InventoryItem = {
    id: "item-1",
    category: "electronics",
    name: "Wireless Mouse",
    quantity: 10,
  };

  // 1) Create item
  const createRes = await container.items.create(item);
  if (createRes.statusCode !== 201) {
    throw new Error(`Create failed. Expected 201, got ${createRes.statusCode}`);
  }

  // 2) Read item
  const readRes = await container.item(item.id, item.category).read<InventoryItem>();
  if (readRes.statusCode !== 200 || !readRes.resource) {
    throw new Error(`Read failed. Expected 200, got ${readRes.statusCode}`);
  }

  // 3) Parameterized query
  const querySpec = {
    query: "SELECT * FROM c WHERE c.category = @category",
    parameters: [{ name: "@category", value: "electronics" }],
  };
  const queryRes = await container.items.query<InventoryItem>(querySpec).fetchAll();
  if (queryRes.resources.length === 0) {
    throw new Error("Query returned no items for category 'electronics'.");
  }

  // 4) Replace item (update quantity)
  const updated: InventoryItem = { ...readRes.resource, quantity: 25 };
  const replaceRes = await container.item(item.id, item.category).replace(updated);
  if (replaceRes.statusCode !== 200) {
    throw new Error(`Replace failed. Expected 200, got ${replaceRes.statusCode}`);
  }

  // 5) Delete item
  const deleteRes = await container.item(item.id, item.category).delete();
  if (deleteRes.statusCode !== 204) {
    throw new Error(`Delete failed. Expected 204, got ${deleteRes.statusCode}`);
  }

  console.log("CRUD operations completed successfully.");
}

main().catch((err: any) => {
  const statusCode = err?.code ?? err?.statusCode;
  if (statusCode) {
    console.error(`Cosmos DB error (status/code: ${statusCode}):`, err.message);
  } else {
    console.error("Unexpected error:", err?.message ?? err);
  }
  process.exit(1);
});
```

Run with environment variables set for your Cosmos account endpoint/key.

## Re-run Command

```bash
hyoka run --prompt-id cosmos-db-dp-js-ts-crud --config baseline/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
