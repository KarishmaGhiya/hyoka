import { CosmosClient, Database, Container } from "@azure/cosmos";

interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

async function runCrudOperations() {
  // 1. Create a CosmosClient using endpoint and key
  const endpoint = process.env.COSMOS_ENDPOINT || "https://your-account.documents.azure.com:443/";
  const key = process.env.COSMOS_KEY || "your-cosmos-db-key";

  const client = new CosmosClient({ endpoint, key });

  console.log("✓ CosmosClient created");

  try {
    // 2. Create a database "TestDB" and container "Items" with partition key "/category"
    const { database } = await client.databases.createIfNotExists({
      id: "TestDB"
    });
    console.log("✓ Database 'TestDB' created or already exists");

    const { container } = await database.containers.createIfNotExists({
      id: "Items",
      partitionKey: {
        paths: ["/category"],
        version: 2
      }
    });
    console.log("✓ Container 'Items' created or already exists");

    // 3. Create an item with properties: id, category, name, quantity
    const newItem: Item = {
      id: "item-001",
      category: "electronics",
      name: "Wireless Mouse",
      quantity: 50
    };

    const { resource: createdItem, statusCode: createStatusCode } = await container.items.create(newItem);
    
    if (createStatusCode === 201) {
      console.log(`✓ Item created (Status: ${createStatusCode}):`, createdItem);
    } else {
      console.log(`⚠ Item creation returned status: ${createStatusCode}`);
    }

    // 4. Read the item back using item().read()
    const { resource: readItem, statusCode: readStatusCode } = await container
      .item(newItem.id, newItem.category)
      .read<Item>();

    if (readStatusCode === 200) {
      console.log(`✓ Item read (Status: ${readStatusCode}):`, readItem);
    } else {
      console.log(`⚠ Item read returned status: ${readStatusCode}`);
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

    const { resources: queryResults } = await container.items.query<Item>(querySpec).fetchAll();
    console.log(`✓ Query results (found ${queryResults.length} items):`, queryResults);

    // 6. Replace the item with updated quantity using item().replace()
    if (readItem) {
      const updatedItem: Item = {
        ...readItem,
        quantity: 75
      };

      const { resource: replacedItem, statusCode: replaceStatusCode } = await container
        .item(updatedItem.id, updatedItem.category)
        .replace<Item>(updatedItem);

      if (replaceStatusCode === 200) {
        console.log(`✓ Item replaced (Status: ${replaceStatusCode}):`, replacedItem);
      } else {
        console.log(`⚠ Item replace returned status: ${replaceStatusCode}`);
      }
    }

    // 7. Delete the item using item().delete()
    const { statusCode: deleteStatusCode } = await container
      .item(newItem.id, newItem.category)
      .delete();

    if (deleteStatusCode === 204) {
      console.log(`✓ Item deleted (Status: ${deleteStatusCode})`);
    } else {
      console.log(`⚠ Item delete returned status: ${deleteStatusCode}`);
    }

    console.log("\n✅ All CRUD operations completed successfully!");

  } catch (error: any) {
    console.error("❌ Error occurred:");
    
    if (error.code) {
      console.error(`  Error Code: ${error.code}`);
    }
    
    if (error.statusCode) {
      console.error(`  Status Code: ${error.statusCode}`);
    }
    
    console.error(`  Message: ${error.message}`);
    
    if (error.body) {
      console.error(`  Details: ${JSON.stringify(error.body, null, 2)}`);
    }
    
    process.exit(1);
  }
}

// Run the CRUD operations
runCrudOperations();
