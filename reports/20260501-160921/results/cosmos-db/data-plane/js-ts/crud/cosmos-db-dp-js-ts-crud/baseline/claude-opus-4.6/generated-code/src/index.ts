import { CosmosClient, Database, Container, StatusCodes } from "@azure/cosmos";

// ---------------------------------------------------------------------------
// Configuration – replace with your actual Cosmos DB endpoint and key
// ---------------------------------------------------------------------------
const endpoint = process.env.COSMOS_ENDPOINT || "<your-cosmos-endpoint>";
const key = process.env.COSMOS_KEY || "<your-cosmos-key>";

const databaseId = "TestDB";
const containerId = "Items";
const partitionKeyPath = "/category";

// ---------------------------------------------------------------------------
// Item interface
// ---------------------------------------------------------------------------
interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Main CRUD workflow
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  // 1. Create a CosmosClient using endpoint and key
  const client = new CosmosClient({ endpoint, key });

  let database: Database;
  let container: Container;

  try {
    // 2. Create database and container (with partition key /category)
    ({ database } = await client.databases.createIfNotExists({
      id: databaseId,
    }));
    console.log(`Database ready : ${database.id}`);

    ({ container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: [partitionKeyPath] },
    }));
    console.log(`Container ready: ${container.id}`);

    // 3. Create an item
    const newItem: Item = {
      id: "item-1",
      category: "electronics",
      name: "Wireless Mouse",
      quantity: 5,
    };

    const { resource: createdItem, statusCode: createStatus } =
      await container.items.create<Item>(newItem);
    console.log(
      `\nCreated item   : ${createdItem?.id} (status ${createStatus})`
    );

    // 4. Read the item back using item().read()
    const { resource: readItem, statusCode: readStatus } = await container
      .item(newItem.id, newItem.category)
      .read<Item>();
    console.log(
      `Read item      : ${readItem?.name}, qty=${readItem?.quantity} (status ${readStatus})`
    );

    // 5. Query items where category equals "electronics" (parameterized)
    const querySpec = {
      query: "SELECT * FROM c WHERE c.category = @category",
      parameters: [{ name: "@category", value: "electronics" }],
    };

    const { resources: queryResults } = await container.items
      .query<Item>(querySpec)
      .fetchAll();
    console.log(`\nQuery results  : ${queryResults.length} item(s)`);
    for (const item of queryResults) {
      console.log(`  - ${item.id}: ${item.name} (qty ${item.quantity})`);
    }

    // 6. Replace the item with updated quantity
    const updatedItem: Item = { ...readItem!, quantity: 10 };
    const { resource: replacedItem, statusCode: replaceStatus } =
      await container
        .item(updatedItem.id, updatedItem.category)
        .replace<Item>(updatedItem);
    console.log(
      `\nReplaced item  : qty=${replacedItem?.quantity} (status ${replaceStatus})`
    );

    // 7. Delete the item
    const { statusCode: deleteStatus } = await container
      .item(newItem.id, newItem.category)
      .delete();
    console.log(`Deleted item   : ${newItem.id} (status ${deleteStatus})`);
  } catch (error: unknown) {
    // Handle Cosmos DB errors with status code checks
    if (error instanceof Object && "code" in error) {
      const cosmosError = error as { code: number; message?: string };
      switch (cosmosError.code) {
        case StatusCodes.NotFound:
          console.error("Resource not found (404).");
          break;
        case StatusCodes.Conflict:
          console.error("Conflict – resource already exists (409).");
          break;
        case StatusCodes.TooManyRequests:
          console.error("Rate limited (429). Retry after back-off.");
          break;
        default:
          console.error(
            `Cosmos DB error ${cosmosError.code}: ${cosmosError.message}`
          );
      }
    } else {
      console.error("Unexpected error:", error);
    }
    process.exitCode = 1;
  }
}

main();
