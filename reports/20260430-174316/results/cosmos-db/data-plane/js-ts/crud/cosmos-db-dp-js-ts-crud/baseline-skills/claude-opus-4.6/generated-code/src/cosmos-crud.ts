import { CosmosClient, Database, Container, StatusCodes } from "@azure/cosmos";

// Configuration — replace with your actual endpoint and key
const endpoint = process.env.COSMOS_ENDPOINT || "<your-cosmos-endpoint>";
const key = process.env.COSMOS_KEY || "<your-cosmos-key>";

const databaseId = "TestDB";
const containerId = "Items";
const partitionKey = "/category";

interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

async function main(): Promise<void> {
  // 1. Create a CosmosClient using endpoint and key
  const client = new CosmosClient({ endpoint, key });

  let database: Database;
  let container: Container;

  try {
    // 2. Create database and container with partition key "/category"
    ({ database } = await client.databases.createIfNotExists({ id: databaseId }));
    console.log(`Database created or exists: ${database.id}`);

    ({ container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: [partitionKey] },
    }));
    console.log(`Container created or exists: ${container.id}`);

    // 3. Create an item
    const newItem: Item = {
      id: "item1",
      category: "electronics",
      name: "Laptop",
      quantity: 5,
    };

    const { resource: createdItem, statusCode: createStatus } =
      await container.items.create<Item>(newItem);
    console.log(`\nCreated item (status ${createStatus}):`);
    console.log(createdItem);

    // 4. Read the item back using item().read()
    const { resource: readItem, statusCode: readStatus } = await container
      .item(newItem.id, newItem.category)
      .read<Item>();

    if (readStatus === StatusCodes.Ok) {
      console.log(`\nRead item (status ${readStatus}):`);
      console.log(readItem);
    } else {
      console.error(`Read failed with status ${readStatus}`);
    }

    // 5. Query items where category equals "electronics" using parameterized query
    const querySpec = {
      query: "SELECT * FROM Items i WHERE i.category = @category",
      parameters: [{ name: "@category", value: "electronics" }],
    };

    const { resources: queriedItems } = await container.items
      .query<Item>(querySpec)
      .fetchAll();

    console.log(`\nQueried items (found ${queriedItems.length}):`);
    for (const item of queriedItems) {
      console.log(` - ${item.name} (qty: ${item.quantity})`);
    }

    // 6. Replace the item with updated quantity using item().replace()
    const updatedItem: Item = { ...newItem, quantity: 10 };
    const { resource: replacedItem, statusCode: replaceStatus } = await container
      .item(newItem.id, newItem.category)
      .replace<Item>(updatedItem);

    console.log(`\nReplaced item (status ${replaceStatus}):`);
    console.log(replacedItem);

    // 7. Delete the item using item().delete()
    const { statusCode: deleteStatus } = await container
      .item(newItem.id, newItem.category)
      .delete();

    console.log(`\nDeleted item (status ${deleteStatus})`);
  } catch (error: unknown) {
    if (error instanceof Object && "code" in error) {
      const cosmosError = error as { code: number; message: string };
      console.error(`Cosmos DB error (code ${cosmosError.code}): ${cosmosError.message}`);
    } else {
      throw error;
    }
  }

  // Cleanup: remove database (optional — comment out to keep data)
  try {
    await client.database(databaseId).delete();
    console.log(`\nCleaned up database "${databaseId}"`);
  } catch {
    // ignore cleanup errors
  }
}

main().catch(console.error);
