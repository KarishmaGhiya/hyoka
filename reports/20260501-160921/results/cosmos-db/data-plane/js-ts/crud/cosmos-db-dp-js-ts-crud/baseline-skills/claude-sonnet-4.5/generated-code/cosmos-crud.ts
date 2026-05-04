import { CosmosClient, Database, Container } from "@azure/cosmos";

// Define the item interface
interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

async function main() {
  // 1. Create a CosmosClient using endpoint and key
  const endpoint = process.env.COSMOS_ENDPOINT || "https://your-account.documents.azure.com:443/";
  const key = process.env.COSMOS_KEY || "your-cosmos-db-key";
  
  const client = new CosmosClient({ endpoint, key });
  
  try {
    // 2. Create a database "TestDB" and container "Items" with partition key "/category"
    console.log("Creating database and container...");
    
    const { database } = await client.databases.createIfNotExists({
      id: "TestDB"
    });
    console.log(`Database created/exists: ${database.id}`);
    
    const { container } = await database.containers.createIfNotExists({
      id: "Items",
      partitionKey: { paths: ["/category"] }
    });
    console.log(`Container created/exists: ${container.id}`);
    
    // 3. Create an item with properties: id, category, name, quantity
    console.log("\n--- CREATE Operation ---");
    const newItem: Item = {
      id: "item-001",
      category: "electronics",
      name: "Wireless Mouse",
      quantity: 50
    };
    
    const { resource: createdItem, statusCode: createStatus } = await container.items.create(newItem);
    console.log(`Item created (Status: ${createStatus}):`, createdItem);
    
    if (createStatus !== 201) {
      throw new Error(`Failed to create item. Status: ${createStatus}`);
    }
    
    // 4. Read the item back using item().read()
    console.log("\n--- READ Operation ---");
    const { resource: readItem, statusCode: readStatus } = await container
      .item(newItem.id, newItem.category)
      .read<Item>();
    
    console.log(`Item read (Status: ${readStatus}):`, readItem);
    
    if (readStatus !== 200) {
      throw new Error(`Failed to read item. Status: ${readStatus}`);
    }
    
    // 5. Query items where category equals "electronics" using parameterized query
    console.log("\n--- QUERY Operation ---");
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
    
    console.log(`Query results (found ${queryResults.length} items):`, queryResults);
    
    // 6. Replace the item with updated quantity using item().replace()
    console.log("\n--- UPDATE (Replace) Operation ---");
    const updatedItem: Item = {
      ...readItem!,
      quantity: 75  // Update quantity
    };
    
    const { resource: replacedItem, statusCode: replaceStatus } = await container
      .item(updatedItem.id, updatedItem.category)
      .replace<Item>(updatedItem);
    
    console.log(`Item replaced (Status: ${replaceStatus}):`, replacedItem);
    
    if (replaceStatus !== 200) {
      throw new Error(`Failed to replace item. Status: ${replaceStatus}`);
    }
    
    // 7. Delete the item using item().delete()
    console.log("\n--- DELETE Operation ---");
    const { statusCode: deleteStatus } = await container
      .item(newItem.id, newItem.category)
      .delete();
    
    console.log(`Item deleted (Status: ${deleteStatus})`);
    
    if (deleteStatus !== 204) {
      throw new Error(`Failed to delete item. Status: ${deleteStatus}`);
    }
    
    // Verify deletion
    try {
      await container.item(newItem.id, newItem.category).read();
      console.log("WARNING: Item still exists after deletion");
    } catch (error: any) {
      if (error.code === 404) {
        console.log("Verified: Item successfully deleted (404 Not Found)");
      } else {
        throw error;
      }
    }
    
    console.log("\n✅ All CRUD operations completed successfully!");
    
  } catch (error: any) {
    console.error("\n❌ Error occurred:");
    console.error(`Message: ${error.message}`);
    console.error(`Status Code: ${error.code || error.statusCode || "N/A"}`);
    
    if (error.body) {
      console.error(`Details: ${JSON.stringify(error.body, null, 2)}`);
    }
    
    process.exit(1);
  }
}

main();
