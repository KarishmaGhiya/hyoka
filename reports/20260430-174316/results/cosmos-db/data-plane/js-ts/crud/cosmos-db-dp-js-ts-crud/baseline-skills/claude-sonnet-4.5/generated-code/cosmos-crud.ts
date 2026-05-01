import { CosmosClient, Database, Container } from "@azure/cosmos";

// Item interface
interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

async function main() {
  // 1. Create CosmosClient using endpoint and key
  const endpoint = process.env.COSMOS_ENDPOINT || "https://your-account.documents.azure.com:443/";
  const key = process.env.COSMOS_KEY || "your-cosmos-db-key";
  
  const client = new CosmosClient({ endpoint, key });
  console.log("✓ CosmosClient created");

  try {
    // 2. Create database and container
    const databaseId = "TestDB";
    const containerId = "Items";
    const partitionKey = "/category";

    // Create database if it doesn't exist
    const { database }: { database: Database } = await client.databases.createIfNotExists({
      id: databaseId
    });
    console.log(`✓ Database '${databaseId}' ready`);

    // Create container if it doesn't exist
    const { container }: { container: Container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: [partitionKey] }
    });
    console.log(`✓ Container '${containerId}' ready with partition key '${partitionKey}'`);

    // 3. Create an item
    const newItem: Item = {
      id: "item-001",
      category: "electronics",
      name: "Laptop",
      quantity: 5
    };

    const { resource: createdItem, statusCode: createStatus } = await container.items.create(newItem);
    
    if (createStatus === 201) {
      console.log(`✓ Item created (Status: ${createStatus}):`, createdItem);
    } else {
      console.error(`✗ Unexpected status code: ${createStatus}`);
    }

    // 4. Read the item back using item().read()
    const { resource: readItem, statusCode: readStatus } = await container
      .item(newItem.id, newItem.category)
      .read<Item>();
    
    if (readStatus === 200) {
      console.log(`✓ Item read (Status: ${readStatus}):`, readItem);
    } else {
      console.error(`✗ Failed to read item (Status: ${readStatus})`);
    }

    // 5. Query items where category equals "electronics" using parameterized query
    const querySpec = {
      query: "SELECT * FROM c WHERE c.category = @category",
      parameters: [
        {
          name: "@category",
          value: "electronics"
        }
      ]
    };

    const { resources: queryResults } = await container.items
      .query<Item>(querySpec)
      .fetchAll();
    
    console.log(`✓ Query results (found ${queryResults.length} item(s)):`, queryResults);

    // 6. Replace the item with updated quantity using item().replace()
    if (readItem) {
      const updatedItem: Item = {
        ...readItem,
        quantity: 10 // Update quantity from 5 to 10
      };

      const { resource: replacedItem, statusCode: replaceStatus } = await container
        .item(updatedItem.id, updatedItem.category)
        .replace<Item>(updatedItem);
      
      if (replaceStatus === 200) {
        console.log(`✓ Item replaced (Status: ${replaceStatus}):`, replacedItem);
      } else {
        console.error(`✗ Failed to replace item (Status: ${replaceStatus})`);
      }
    }

    // 7. Delete the item using item().delete()
    const { statusCode: deleteStatus } = await container
      .item(newItem.id, newItem.category)
      .delete();
    
    if (deleteStatus === 204) {
      console.log(`✓ Item deleted (Status: ${deleteStatus})`);
    } else {
      console.error(`✗ Failed to delete item (Status: ${deleteStatus})`);
    }

    // Verify deletion
    try {
      await container.item(newItem.id, newItem.category).read();
      console.log("✗ Item still exists after deletion");
    } catch (error: any) {
      if (error.code === 404) {
        console.log("✓ Verified: Item no longer exists (Status: 404)");
      } else {
        console.error("✗ Unexpected error during verification:", error.message);
      }
    }

  } catch (error: any) {
    console.error("✗ Error occurred:");
    console.error(`  Code: ${error.code || 'N/A'}`);
    console.error(`  Status: ${error.statusCode || 'N/A'}`);
    console.error(`  Message: ${error.message}`);
    
    if (error.body) {
      console.error(`  Details: ${JSON.stringify(error.body, null, 2)}`);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
