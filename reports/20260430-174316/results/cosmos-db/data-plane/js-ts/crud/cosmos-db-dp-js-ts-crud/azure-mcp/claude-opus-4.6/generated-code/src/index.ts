import { CosmosClient, Database, Container, StatusCodes } from "@azure/cosmos";

// Replace with your actual Cosmos DB endpoint and key
const endpoint = process.env.COSMOS_ENDPOINT || "<your-cosmos-endpoint>";
const key = process.env.COSMOS_KEY || "<your-cosmos-key>";

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
    // 2. Create database "TestDB" and container "Items" with partition key "/category"
    const { database } = await client.databases.createIfNotExists({
      id: "TestDB",
    });
    console.log(`Database ready: ${database.id}`);

    const { container } = await database.containers.createIfNotExists({
      id: "Items",
      partitionKey: { paths: ["/category"] },
    });
    console.log(`Container ready: ${container.id}`);

    // 3. Create an item
    const newItem: Item = {
      id: "item1",
      category: "electronics",
      name: "Wireless Mouse",
      quantity: 10,
    };

    const { resource: createdItem, statusCode: createStatus } =
      await container.items.create(newItem);
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
      query: "SELECT * FROM Items i WHERE i.category = @category",
      parameters: [{ name: "@category", value: "electronics" }],
    };

    const { resources: queriedItems } = await container.items
      .query<Item>(querySpec)
      .fetchAll();
    console.log(`Query returned ${queriedItems.length} item(s):`);
    for (const item of queriedItems) {
      console.log(`  - ${item.name} (quantity: ${item.quantity})`);
    }

    // 6. Replace the item with updated quantity using item().replace()
    const updatedItem: Item = { ...newItem, quantity: 25 };
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

    // Clean up: delete the database
    await database.delete();
    console.log("Cleaned up: database deleted.");
  } catch (error: unknown) {
    if (error instanceof Object && "code" in error) {
      const cosmosError = error as { code: number; message: string };
      console.error(
        `Cosmos DB error (code ${cosmosError.code}): ${cosmosError.message}`
      );
    } else {
      throw error;
    }
  }
}

main().catch(console.error);
