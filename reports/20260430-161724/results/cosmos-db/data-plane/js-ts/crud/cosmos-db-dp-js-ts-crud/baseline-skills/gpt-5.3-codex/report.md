# Evaluation Report: cosmos-db-dp-js-ts-crud

**Config:** baseline-skills/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 21.8s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `cosmos-db-dp-js-ts-crud` |
| Config | baseline-skills/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 21.8s |
| Timestamp | 2026-04-30T23:19:53Z |
| Files Generated | 0 |
| Event Count | 54 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 21.7s |
| **Total** | **21.8s** |

## Configuration

- **model:** gpt-5.3-codex
- **name:** baseline-skills/gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=44219 out=1230 |
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
{"intent":"Creating Cosmos CRUD script"}
```

### 🔧 2. glob

**Input:**

```json
{"pattern":"*"}
```

### 🔧 3. powershell

**Input:**

```json
{"command":"Get-ChildItem -Force | Select-Object -ExpandProperty Name","description":"List files in workspace"}
```

## Copilot Response

I’ll add a runnable TypeScript script in this workspace that performs the full Cosmos DB CRUD flow with status-code checks and include the required npm package.


Use `@azure/cosmos` and this TypeScript script:

```bash
npm install @azure/cosmos
npm install -D typescript ts-node @types/node
```

```ts
// cosmos-crud.ts
import { CosmosClient } from "@azure/cosmos";

type Item = {
  id: string;
  category: string;
  name: string;
  quantity: number;
};

function assertStatus(actual: number | undefined, expected: number, step: string) {
  if (actual !== expected) {
    throw new Error(`${step} failed. Expected status ${expected}, got ${actual ?? "undefined"}`);
  }
}

async function main() {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint || !key) {
    throw new Error("Set COSMOS_ENDPOINT and COSMOS_KEY environment variables.");
  }

  const client = new CosmosClient({ endpoint, key });

  // 1 & 2. Create client, database, and container
  const { database } = await client.databases.createIfNotExists({ id: "TestDB" });
  const { container } = await database.containers.createIfNotExists({
    id: "Items",
    partitionKey: { paths: ["/category"] },
  });

  const id = `item-${Date.now()}`;
  const category = "electronics";

  // 3. Create item
  const newItem: Item = { id, category, name: "Headphones", quantity: 10 };
  const createRes = await container.items.create(newItem);
  assertStatus(createRes.statusCode, 201, "Create item");

  // 4. Read item
  const readRes = await container.item(id, category).read<Item>();
  assertStatus(readRes.statusCode, 200, "Read item");

  // 5. Parameterized query
  const querySpec = {
    query: "SELECT * FROM c WHERE c.category = @category",
    parameters: [{ name: "@category", value: "electronics" }],
  };
  const queryRes = await container.items.query<Item>(querySpec).fetchAll();
  assertStatus(queryRes.statusCode, 200, "Query items");

  // 6. Replace item (update quantity)
  const updated: Item = { ...(readRes.resource as Item), quantity: 25 };
  const replaceRes = await container.item(id, category).replace(updated);
  assertStatus(replaceRes.statusCode, 200, "Replace item");

  // 7. Delete item
  const deleteRes = await container.item(id, category).delete();
  assertStatus(deleteRes.statusCode, 204, "Delete item");

  console.log("CRUD flow completed successfully.");
}

main().catch((err: any) => {
  const status = err?.statusCode ?? err?.code;
  if (status) {
    console.error(`Cosmos DB error (status/code: ${status}): ${err.message}`);
  } else {
    console.error("Unexpected error:", err);
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
hyoka run --prompt-id cosmos-db-dp-js-ts-crud --config baseline-skills/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
