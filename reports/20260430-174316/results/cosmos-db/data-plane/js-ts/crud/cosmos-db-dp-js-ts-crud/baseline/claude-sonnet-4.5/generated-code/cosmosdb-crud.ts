import { CosmosClient, Database, Container } from "@azure/cosmos";

// Interface for our item structure
interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

async function performCRUDOperations() {
  // Step 1: Create a CosmosClient using endpoint and key
  const endpoint = process.env.COSMOS_ENDPOINT || "https://your-account.documents.azure.com:443/";
  const key = process.env.COSMOS_KEY || "your-cosmos-db-key";
  
  const client = new CosmosClient({ endpoint, key });

  try {
    // Step 2: Create a database "TestDB" and container "Items" with partition key "/category"
    console.log("Creating database and container...");
    const { database } = await client.databases.createIfNotExists({ id: "TestDB" });
    console.log(`Database created/exists: ${database.id}`);

    const { container } = await database.containers.createIfNotExists({
      id: "Items",
      partitionKey: { paths: ["/category"] }
    });
    console.log(`Container created/exists: ${container.id}`);

    // Step 3: Create an item with properties: id, category, name, quantity
    console.log("\n--- CREATE Operation ---");
    const newItem: Item = {
      id: "item001",
      category: "electronics",
      name: "Laptop",
      quantity: 10
    };

    const { resource: createdItem, statusCode: createStatusCode } = await container.items.create(newItem);
    
    if (createStatusCode === 201) {
      console.log(`✓ Item created successfully (Status: ${createStatusCode})`);
      console.log("Created item:", JSON.stringify(createdItem, null, 2));
    } else {
      console.log(`⚠ Unexpected status code: ${createStatusCode}`);
    }

    // Step 4: Read the item back using item().read()
    console.log("\n--- READ Operation ---");
    const { resource: readItem, statusCode: readStatusCode } = await container
      .item(newItem.id, newItem.category)
      .read<Item>();

    if (readStatusCode === 200) {
      console.log(`✓ Item read successfully (Status: ${readStatusCode})`);
      console.log("Read item:", JSON.stringify(readItem, null, 2));
    } else {
      console.log(`⚠ Unexpected status code: ${readStatusCode}`);
    }

    // Step 5: Query items where category equals "electronics" using parameterized query
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

    const { resources: queryResults } = await container.items.query<Item>(querySpec).fetchAll();
    console.log(`✓ Query executed successfully. Found ${queryResults.length} item(s)`);
    queryResults.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, JSON.stringify(item, null, 2));
    });

    // Step 6: Replace the item with updated quantity using item().replace()
    console.log("\n--- UPDATE (Replace) Operation ---");
    const updatedItem: Item = {
      ...newItem,
      quantity: 25 // Updated quantity
    };

    const { resource: replacedItem, statusCode: replaceStatusCode } = await container
      .item(newItem.id, newItem.category)
      .replace<Item>(updatedItem);

    if (replaceStatusCode === 200) {
      console.log(`✓ Item replaced successfully (Status: ${replaceStatusCode})`);
      console.log("Updated item:", JSON.stringify(replacedItem, null, 2));
    } else {
      console.log(`⚠ Unexpected status code: ${replaceStatusCode}`);
    }

    // Step 7: Delete the item using item().delete()
    console.log("\n--- DELETE Operation ---");
    const { statusCode: deleteStatusCode } = await container
      .item(newItem.id, newItem.category)
      .delete();

    if (deleteStatusCode === 204) {
      console.log(`✓ Item deleted successfully (Status: ${deleteStatusCode})`);
    } else {
      console.log(`⚠ Unexpected status code: ${deleteStatusCode}`);
    }

    // Verify deletion
    try {
      await container.item(newItem.id, newItem.category).read();
      console.log("⚠ Item still exists after delete");
    } catch (error: any) {
      if (error.code === 404) {
        console.log("✓ Verified: Item no longer exists (Status: 404)");
      } else {
        throw error;
      }
    }

    console.log("\n✅ All CRUD operations completed successfully!");

  } catch (error: any) {
    console.error("\n❌ Error occurred:");
    console.error(`Message: ${error.message}`);
    if (error.code) {
      console.error(`Status Code: ${error.code}`);
    }
    if (error.body) {
      console.error("Error details:", JSON.stringify(error.body, null, 2));
    }
    process.exit(1);
  }
}

// Run the program
performCRUDOperations();
