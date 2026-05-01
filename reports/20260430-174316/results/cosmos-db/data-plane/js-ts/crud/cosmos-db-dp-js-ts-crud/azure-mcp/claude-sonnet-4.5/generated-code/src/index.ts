import { CosmosClient, Database, Container, ItemResponse } from "@azure/cosmos";

interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

async function performCrudOperations(): Promise<void> {
  // 1. Create a CosmosClient using endpoint and key
  const endpoint = process.env.COSMOS_ENDPOINT || "https://your-account.documents.azure.com:443/";
  const key = process.env.COSMOS_KEY || "your-cosmos-db-key";

  const client = new CosmosClient({ endpoint, key });
  console.log("✓ CosmosClient created");

  try {
    // 2. Create a database "TestDB" and container "Items" with partition key "/category"
    const databaseId = "TestDB";
    const containerId = "Items";

    const { database }: { database: Database } = await client.databases.createIfNotExists({
      id: databaseId,
    });
    console.log(`✓ Database created or exists: ${database.id}`);

    const { container }: { container: Container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: ["/category"] },
    });
    console.log(`✓ Container created or exists: ${container.id}`);

    // 3. Create an item with properties: id, category, name, quantity
    const newItem: Item = {
      id: "item-001",
      category: "electronics",
      name: "Laptop",
      quantity: 10,
    };

    const { resource: createdItem, statusCode: createStatusCode }: ItemResponse<Item> = 
      await container.items.create(newItem);

    if (createStatusCode === 201) {
      console.log(`✓ Item created (Status ${createStatusCode}):`, createdItem);
    } else {
      console.error(`✗ Unexpected status code during create: ${createStatusCode}`);
    }

    // 4. Read the item back using item().read()
    const { resource: readItem, statusCode: readStatusCode }: ItemResponse<Item> = 
      await container.item(newItem.id, newItem.category).read();

    if (readStatusCode === 200) {
      console.log(`✓ Item read (Status ${readStatusCode}):`, readItem);
    } else {
      console.error(`✗ Unexpected status code during read: ${readStatusCode}`);
    }

    // 5. Query items where category equals "electronics" using parameterized query
    const querySpec = {
      query: "SELECT * FROM c WHERE c.category = @category",
      parameters: [
        {
          name: "@category",
          value: "electronics",
        },
      ],
    };

    const { resources: queryResults } = await container.items.query<Item>(querySpec).fetchAll();
    console.log(`✓ Query results (Found ${queryResults.length} items):`, queryResults);

    // 6. Replace the item with updated quantity using item().replace()
    if (readItem) {
      const updatedItem: Item = {
        ...readItem,
        quantity: 25,
      };

      const { resource: replacedItem, statusCode: replaceStatusCode }: ItemResponse<Item> = 
        await container.item(updatedItem.id, updatedItem.category).replace(updatedItem);

      if (replaceStatusCode === 200) {
        console.log(`✓ Item replaced (Status ${replaceStatusCode}):`, replacedItem);
      } else {
        console.error(`✗ Unexpected status code during replace: ${replaceStatusCode}`);
      }
    }

    // 7. Delete the item using item().delete()
    const { statusCode: deleteStatusCode } = await container.item(newItem.id, newItem.category).delete();

    if (deleteStatusCode === 204) {
      console.log(`✓ Item deleted (Status ${deleteStatusCode})`);
    } else {
      console.error(`✗ Unexpected status code during delete: ${deleteStatusCode}`);
    }

    console.log("\n✓ All CRUD operations completed successfully!");

  } catch (error: any) {
    console.error("✗ Error occurred:", error.message);
    if (error.code) {
      console.error(`  Error code: ${error.code}`);
    }
    if (error.statusCode) {
      console.error(`  Status code: ${error.statusCode}`);
    }
    throw error;
  }
}

// Run the program
performCrudOperations()
  .then(() => {
    console.log("\nProgram completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nProgram failed:", error.message);
    process.exit(1);
  });
