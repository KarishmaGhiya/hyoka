import { CosmosClient } from "@azure/cosmos";

// ── Configuration ──────────────────────────────────────────────────
const endpoint = process.env.COSMOS_ENDPOINT || "<your-cosmos-endpoint>";
const key = process.env.COSMOS_KEY || "<your-cosmos-key>";

const databaseId = "TestDB";
const containerId = "Items";
const partitionKeyPath = "/category";

// ── 1. Create the CosmosClient ─────────────────────────────────────
const client = new CosmosClient({ endpoint, key });

// ── Item type ──────────────────────────────────────────────────────
interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

async function main(): Promise<void> {
  // ── 2. Create database and container ─────────────────────────────
  const { database } = await client.databases.createIfNotExists({
    id: databaseId,
  });
  console.log(`Database ready : ${database.id}`);

  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: [partitionKeyPath] },
  });
  console.log(`Container ready: ${container.id}`);

  // ── 3. Create an item ────────────────────────────────────────────
  const newItem: Item = {
    id: "item-1",
    category: "electronics",
    name: "Wireless Mouse",
    quantity: 25,
  };

  const { resource: created, statusCode: createStatus } =
    await container.items.create<Item>(newItem);
  console.log(`\nCreated item   : ${created?.name} (status ${createStatus})`);

  // ── 4. Read the item back ────────────────────────────────────────
  const { resource: readItem, statusCode: readStatus } = await container
    .item(newItem.id, newItem.category)
    .read<Item>();
  console.log(
    `Read item      : ${readItem?.name}, qty=${readItem?.quantity} (status ${readStatus})`
  );

  // ── 5. Query items (parameterized) ───────────────────────────────
  const querySpec = {
    query: "SELECT * FROM Items i WHERE i.category = @category",
    parameters: [{ name: "@category", value: "electronics" }],
  };

  const { resources: results } = await container.items
    .query<Item>(querySpec)
    .fetchAll();
  console.log(`\nQuery results (category = "electronics"):`);
  for (const item of results) {
    console.log(`  - ${item.name} (qty: ${item.quantity})`);
  }

  // ── 6. Replace (update) the item ─────────────────────────────────
  const updatedItem: Item = { ...newItem, quantity: 50 };
  const { resource: replaced, statusCode: replaceStatus } = await container
    .item(newItem.id, newItem.category)
    .replace<Item>(updatedItem);
  console.log(
    `\nReplaced item  : ${replaced?.name}, qty=${replaced?.quantity} (status ${replaceStatus})`
  );

  // ── 7. Delete the item ───────────────────────────────────────────
  const { statusCode: deleteStatus } = await container
    .item(newItem.id, newItem.category)
    .delete();
  console.log(`Deleted item   : ${newItem.id} (status ${deleteStatus})`);

  // ── Cleanup (optional) ───────────────────────────────────────────
  await database.delete();
  console.log(`\nCleaned up database "${databaseId}".`);
}

main().catch((err) => {
  if (err.code) {
    console.error(`Cosmos DB error ${err.code}: ${err.message}`);
  } else {
    console.error("Unexpected error:", err);
  }
  process.exit(1);
});
