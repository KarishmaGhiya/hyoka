import { CosmosClient, StatusCodes } from "@azure/cosmos";

// Define the item interface
interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

// Configuration — set these environment variables before running
const endpoint = process.env.COSMOS_ENDPOINT ?? "<your-cosmos-endpoint>";
const key = process.env.COSMOS_KEY ?? "<your-cosmos-key>";

const databaseId = "TestDB";
const containerId = "Items";
const partitionKeyPath = "/category";

async function main(): Promise<void> {
  // 1. Create a CosmosClient using endpoint and key
  const client = new CosmosClient({ endpoint, key });

  try {
    // 2. Create database and container
    const { database } = await client.databases.createIfNotExists({
      id: databaseId,
    });
    console.log(`Database created or exists: ${database.id}`);

    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: [partitionKeyPath] },
    });
    console.log(`Container created or exists: ${container.id}`);

    // 3. Create an item
    const newItem: Item = {
      id: "item-1",
      category: "electronics",
      name: "Wireless Mouse",
      quantity: 25,
    };

    const { resource: createdItem, statusCode: createStatus } =
      await container.items.create<Item>(newItem);
    if (createStatus === StatusCodes.Created) {
      console.log(`Created item: ${createdItem?.id} (status ${createStatus})`);
    }

    // 4. Read the item back using item().read()
    const { resource: readItem, statusCode: readStatus } = await container
      .item(newItem.id, newItem.category)
      .read<Item>();

    if (readStatus === StatusCodes.Ok) {
      console.log(
        `Read item: ${readItem?.name}, quantity: ${readItem?.quantity} (status ${readStatus})`
      );
    }

    // 5. Query items where category equals "electronics" using parameterized query
    const querySpec = {
      query: "SELECT * FROM c WHERE c.category = @category",
      parameters: [{ name: "@category", value: "electronics" }],
    };

    const { resources: queryResults } = await container.items
      .query<Item>(querySpec)
      .fetchAll();

    console.log(`Query returned ${queryResults.length} item(s):`);
    for (const item of queryResults) {
      console.log(`  - ${item.name} (quantity: ${item.quantity})`);
    }

    // 6. Replace the item with updated quantity using item().replace()
    const updatedItem: Item = { ...newItem, quantity: 50 };
    const { resource: replacedItem, statusCode: replaceStatus } =
      await container
        .item(newItem.id, newItem.category)
        .replace<Item>(updatedItem);

    if (replaceStatus === StatusCodes.Ok) {
      console.log(
        `Replaced item: quantity updated to ${replacedItem?.quantity} (status ${replaceStatus})`
      );
    }

    // 7. Delete the item using item().delete()
    const { statusCode: deleteStatus } = await container
      .item(newItem.id, newItem.category)
      .delete();

    if (deleteStatus === StatusCodes.NoContent) {
      console.log(`Deleted item: ${newItem.id} (status ${deleteStatus})`);
    }
  } catch (error: unknown) {
    if (error instanceof Object && "code" in error) {
      const cosmosError = error as { code: number; message: string };
      console.error(
        `Cosmos DB error — code: ${cosmosError.code}, message: ${cosmosError.message}`
      );
    } else {
      throw error;
    }
  }
}

main().catch(console.error);
