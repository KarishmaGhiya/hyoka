import { CosmosClient, Database, Container } from "@azure/cosmos";

interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

async function main() {
  // 1. Create a CosmosClient using endpoint and key
  const endpoint = process.env.COSMOS_ENDPOINT || "https://your-account.documents.azure.com:443/";
  const key = process.env.COSMOS_KEY || "your-cosmos-key";
  
  const client = new CosmosClient({ endpoint, key });
  
  try {
    // 2. Create database "TestDB" and container "Items" with partition key "/category"
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
      name: "Laptop",
      quantity: 10
    };
    
    const { resource: createdItem, statusCode: createStatus } = await container.items.create(newItem);
    
    if (createStatus === 201) {
      console.log(`Item created successfully (Status: ${createStatus})`);
      console.log(JSON.stringify(createdItem, null, 2));
    } else {
      console.log(`Unexpected status code: ${createStatus}`);
    }
    
    // 4. Read the item back using item().read()
    console.log("\n--- READ Operation ---");
    const { resource: readItem, statusCode: readStatus } = await container
      .item(newItem.id, newItem.category)
      .read<Item>();
    
    if (readStatus === 200) {
      console.log(`Item read successfully (Status: ${readStatus})`);
      console.log(JSON.stringify(readItem, null, 2));
    } else {
      console.log(`Unexpected status code: ${readStatus}`);
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
    
    console.log(`Found ${queryResults.length} item(s) in electronics category:`);
    queryResults.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, JSON.stringify(item, null, 2));
    });
    
    // 6. Replace the item with updated quantity using item().replace()
    console.log("\n--- REPLACE Operation ---");
    if (readItem) {
      const updatedItem: Item = {
        ...readItem,
        quantity: 25
      };
      
      const { resource: replacedItem, statusCode: replaceStatus } = await container
        .item(updatedItem.id, updatedItem.category)
        .replace<Item>(updatedItem);
      
      if (replaceStatus === 200) {
        console.log(`Item replaced successfully (Status: ${replaceStatus})`);
        console.log(JSON.stringify(replacedItem, null, 2));
      } else {
        console.log(`Unexpected status code: ${replaceStatus}`);
      }
    }
    
    // 7. Delete the item using item().delete()
    console.log("\n--- DELETE Operation ---");
    const { statusCode: deleteStatus } = await container
      .item(newItem.id, newItem.category)
      .delete();
    
    if (deleteStatus === 204) {
      console.log(`Item deleted successfully (Status: ${deleteStatus})`);
    } else {
      console.log(`Unexpected status code: ${deleteStatus}`);
    }
    
    // Verify deletion
    console.log("\nVerifying deletion...");
    try {
      const { statusCode: verifyStatus } = await container
        .item(newItem.id, newItem.category)
        .read();
      console.log(`Item still exists (Status: ${verifyStatus})`);
    } catch (error: any) {
      if (error.code === 404) {
        console.log("Item successfully deleted - not found (404)");
      } else {
        throw error;
      }
    }
    
  } catch (error: any) {
    console.error("\nError occurred:");
    console.error(`Message: ${error.message}`);
    if (error.code) {
      console.error(`Status Code: ${error.code}`);
    }
    if (error.body) {
      console.error(`Error Body: ${JSON.stringify(error.body, null, 2)}`);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
