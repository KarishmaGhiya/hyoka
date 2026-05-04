import { CosmosClient, Container, Database, ErrorResponse, SqlQuerySpec } from "@azure/cosmos";

interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

async function main() {
  // 1. Create a CosmosClient using endpoint and key
  const endpoint = process.env.COSMOS_ENDPOINT || "https://<your-account>.documents.azure.com:443/";
  const key = process.env.COSMOS_KEY || "<your-key>";
  
  const client = new CosmosClient({ endpoint, key });
  console.log("✓ CosmosClient created");

  try {
    // 2. Create a database "TestDB" and container "Items" with partition key "/category"
    const { database } = await client.databases.createIfNotExists({
      id: "TestDB",
    });
    console.log("✓ Database 'TestDB' created or already exists");

    const { container } = await database.containers.createIfNotExists({
      id: "Items",
      partitionKey: { paths: ["/category"] },
    });
    console.log("✓ Container 'Items' created with partition key '/category'");

    // 3. Create an item with properties: id, category, name, quantity
    const newItem: Item = {
      id: "item-001",
      category: "electronics",
      name: "Laptop",
      quantity: 10,
    };

    const { resource: createdItem, statusCode: createStatus } = await container.items.create<Item>(newItem);
    console.log(`✓ Item created (Status: ${createStatus}):`, createdItem);

    // 4. Read the item back using item().read()
    const { resource: readItem, statusCode: readStatus } = await container
      .item(newItem.id, newItem.category)
      .read<Item>();
    console.log(`✓ Item read (Status: ${readStatus}):`, readItem);

    // 5. Query items where category equals "electronics" using parameterized query
    const querySpec: SqlQuerySpec = {
      query: "SELECT * FROM c WHERE c.category = @category",
      parameters: [
        { name: "@category", value: "electronics" },
      ],
    };

    const { resources: queryResults } = await container.items
      .query<Item>(querySpec)
      .fetchAll();
    console.log(`✓ Query results (found ${queryResults.length} items):`, queryResults);

    // 6. Replace the item with updated quantity using item().replace()
    if (readItem) {
      readItem.quantity = 25;
      const { resource: updatedItem, statusCode: replaceStatus } = await container
        .item(readItem.id, readItem.category)
        .replace<Item>(readItem);
      console.log(`✓ Item replaced with updated quantity (Status: ${replaceStatus}):`, updatedItem);
    }

    // 7. Delete the item using item().delete()
    const { statusCode: deleteStatus } = await container
      .item(newItem.id, newItem.category)
      .delete();
    console.log(`✓ Item deleted (Status: ${deleteStatus})`);

    // Verify deletion
    try {
      await container.item(newItem.id, newItem.category).read<Item>();
    } catch (error) {
      if (error instanceof ErrorResponse && error.code === 404) {
        console.log("✓ Verified: Item no longer exists");
      }
    }

  } catch (error) {
    if (error instanceof ErrorResponse) {
      console.error(`❌ Cosmos DB Error (${error.code}): ${error.message}`);
      
      switch (error.code) {
        case 400:
          console.error("Bad request - check your request parameters");
          break;
        case 401:
          console.error("Unauthorized - check your credentials");
          break;
        case 403:
          console.error("Forbidden - check your permissions");
          break;
        case 404:
          console.error("Resource not found");
          break;
        case 409:
          console.error("Conflict - resource already exists");
          break;
        case 412:
          console.error("Precondition failed - ETag mismatch");
          break;
        case 429:
          console.error(`Rate limited - retry after ${error.retryAfterInMs}ms`);
          break;
        case 500:
          console.error("Internal server error");
          break;
        case 503:
          console.error("Service unavailable");
          break;
        default:
          console.error("Unknown error occurred");
      }
    } else {
      console.error("❌ Unexpected error:", error);
    }
    process.exit(1);
  } finally {
    // Clean up
    client.dispose();
    console.log("✓ CosmosClient disposed");
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
