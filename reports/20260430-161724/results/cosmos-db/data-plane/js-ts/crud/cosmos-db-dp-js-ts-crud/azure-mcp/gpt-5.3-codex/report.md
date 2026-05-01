# Evaluation Report: cosmos-db-dp-js-ts-crud

**Config:** azure-mcp/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 35.4s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `cosmos-db-dp-js-ts-crud` |
| Config | azure-mcp/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 35.4s |
| Timestamp | 2026-04-30T23:19:15Z |
| Files Generated | 0 |
| Event Count | 56 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 35.3s |
| **Total** | **35.4s** |

## Configuration

- **name:** azure-mcp/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=77834 out=1801 |
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
{"intent":"Scaffolding Cosmos CRUD"}
```

### 🔧 2. glob

**Input:**

```json
{"pattern":"**/*"}
```

### 🔧 3. powershell

**Input:**

```json
{"command":"Get-ChildItem -Force","description":"List workspace files"}
```

## Copilot Response

Use **`@azure/cosmos`**.

```bash
npm install @azure/cosmos
npm install -D typescript ts-node @types/node
```

```ts
// cosmos-crud.ts
import { CosmosClient, type Container, type ItemResponse } from "@azure/cosmos";
import { randomUUID } from "crypto";

type Item = {
  id: string;
  category: string;
  name: string;
  quantity: number;
};

function expectStatus(operation: string, actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(`${operation} failed: expected ${expected}, got ${actual}`);
  }
}

async function main() {
  const endpoint = process.env.COSMOS_ENDPOINT ?? "<your-cosmos-endpoint>";
  const key = process.env.COSMOS_KEY ?? "<your-cosmos-key>";

  if (endpoint.startsWith("<") || key.startsWith("<")) {
    throw new Error("Set COSMOS_ENDPOINT and COSMOS_KEY environment variables.");
  }

  const client = new CosmosClient({ endpoint, key });

  // 1) Create CosmosClient
  // 2) Create database and container
  const { database, statusCode: dbStatus } = await client.databases.createIfNotExists({ id: "TestDB" });
  if (dbStatus !== 200 && dbStatus !== 201) {
    throw new Error(`Database createIfNotExists unexpected status: ${dbStatus}`);
  }

  const { container, statusCode: containerStatus } = await database.containers.createIfNotExists({
    id: "Items",
    partitionKey: { paths: ["/category"] },
  });
  if (containerStatus !== 200 && containerStatus !== 201) {
    throw new Error(`Container createIfNotExists unexpected status: ${containerStatus}`);
  }

  const item: Item = {
    id: randomUUID(),
    category: "electronics",
    name: "Wireless Mouse",
    quantity: 10,
  };

  const itemRef = container.item(item.id, item.category);

  // 3) Create item
  const createResp = await container.items.create<Item>(item);
  expectStatus("Create item", createResp.statusCode, 201);

  // 4) Read item back using item().read()
  const readResp = await itemRef.read<Item>();
  expectStatus("Read item", readResp.statusCode, 200);

  // 5) Query by category using parameterized query
  const querySpec = {
    query: "SELECT * FROM c WHERE c.category = @category",
    parameters: [{ name: "@category", value: "electronics" }],
  };
  const queryResp = await container.items.query<Item>(querySpec).fetchAll();
  if (!queryResp.resources.length) {
    throw new Error("Query returned no items for category 'electronics'.");
  }

  // 6) Replace item with updated quantity using item().replace()
  const updated: Item = { ...readResp.resource!, quantity: 25 };
  const replaceResp: ItemResponse<Item> = await itemRef.replace<Item>(updated);
  expectStatus("Replace item", replaceResp.statusCode, 200);

  // 7) Delete item using item().delete()
  const deleteResp = await itemRef.delete();
  expectStatus("Delete item", deleteResp.statusCode, 204);

  console.log("CRUD operations completed successfully.");
}

main().catch((err: any) => {
  const statusCode = typeof err?.code === "number" ? err.code : undefined; // Cosmos HTTP errors expose .code
  if (statusCode === 404) {
    console.error("Resource not found (404):", err.message);
  } else if (statusCode === 409) {
    console.error("Conflict (409):", err.message);
  } else if (statusCode === 429) {
    console.error("Rate limited (429):", err.message);
  } else if (statusCode && statusCode >= 500) {
    console.error(`Cosmos service error (${statusCode}):`, err.message);
  } else {
    console.error("Unhandled error:", err.message ?? err);
  }
  process.exit(1);
});
```

Run with:

```bash
# PowerShell
$env:COSMOS_ENDPOINT="https://<account>.documents.azure.com:443/"
$env:COSMOS_KEY="<key>"
npx ts-node cosmos-crud.ts
```

## Re-run Command

```bash
hyoka run --prompt-id cosmos-db-dp-js-ts-crud --config azure-mcp/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
