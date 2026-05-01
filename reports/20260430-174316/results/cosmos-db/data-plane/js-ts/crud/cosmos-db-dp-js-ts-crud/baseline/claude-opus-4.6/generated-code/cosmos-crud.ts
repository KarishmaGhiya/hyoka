import { CosmosClient, Database, Container, StatusCodes } from "@azure/cosmos";

// Configuration — replace with your actual values or use environment variables
const endpoint = process.env.COSMOS_ENDPOINT || "https://your-account.documents.azure.com:443/";
const key = process.env.COSMOS_KEY || "your-account-key";

const databaseId = "TestDB";
const containerId = "Items";
const partitionKeyPath = "/category";

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
    // 2. Create database "TestDB" and container "Items" with partition key "/category"
    console.log("Creating database and container...");

    const { database: db } = await client.databases.createIfNotExists({
      id: databaseId,
    });
    database = db;
    console.log(`Database created/verified: ${database.id}`);

    const { container: cont } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: [partitionKeyPath] },
    });
    container = cont;
    console.log(`Container created/verified: ${container.id}`);

    // 3. Create an item
    const newItem: Item = {
      id: "item1",
      category: "electronics",
      name: "Wireless Mouse",
      quantity: 10,
    };

    console.log("\nCreating item...");
    const { resource: createdItem, statusCode: createStatus } =
      await container.items.create<Item>(newItem);

    if (createStatus === StatusCodes.Created) {
      console.log(`Item created (status ${createStatus}):`, createdItem);
    } else {
      console.warn(`Unexpected status on create: ${createStatus}`);
    }

    // 4. Read the item back using item().read()
    console.log("\nReading item...");
    const { resource: readItem, statusCode: readStatus } = await container
      .item(newItem.id, newItem.category)
      .read<Item>();

    if (readStatus === StatusCodes.Ok) {
      console.log(`Item read (status ${readStatus}):`, readItem);
    } else {
      console.warn(`Unexpected status on read: ${readStatus}`);
    }

    // 5. Query items where category equals "electronics" using parameterized query
    console.log("\nQuerying items with category = 'electronics'...");
    const querySpec = {
      query: "SELECT * FROM Items i WHERE i.category = @category",
      parameters: [{ name: "@category", value: "electronics" }],
    };

    const { resources: queryResults } = await container
      .items.query<Item>(querySpec)
      .fetchAll();

    console.log(`Query returned ${queryResults.length} item(s):`);
    for (const item of queryResults) {
      console.log(` - ${item.name} (qty: ${item.quantity})`);
    }

    // 6. Replace the item with updated quantity using item().replace()
    if (readItem) {
      const updatedItem: Item = { ...readItem, quantity: 25 };

      console.log("\nReplacing item with updated quantity...");
      const { resource: replacedItem, statusCode: replaceStatus } = await container
        .item(updatedItem.id, updatedItem.category)
        .replace<Item>(updatedItem);

      if (replaceStatus === StatusCodes.Ok) {
        console.log(`Item replaced (status ${replaceStatus}):`, replacedItem);
      } else {
        console.warn(`Unexpected status on replace: ${replaceStatus}`);
      }
    }

    // 7. Delete the item using item().delete()
    console.log("\nDeleting item...");
    const { statusCode: deleteStatus } = await container
      .item(newItem.id, newItem.category)
      .delete();

    if (deleteStatus === StatusCodes.NoContent) {
      console.log(`Item deleted (status ${deleteStatus})`);
    } else {
      console.warn(`Unexpected status on delete: ${deleteStatus}`);
    }

    console.log("\nAll CRUD operations completed successfully.");
  } catch (error: unknown) {
    if (error instanceof Object && "code" in error) {
      const cosmosError = error as { code: number; message: string };
      console.error(`Cosmos DB error (code ${cosmosError.code}): ${cosmosError.message}`);
    } else {
      console.error("Unexpected error:", error);
    }
    process.exit(1);
  }
}

main();
