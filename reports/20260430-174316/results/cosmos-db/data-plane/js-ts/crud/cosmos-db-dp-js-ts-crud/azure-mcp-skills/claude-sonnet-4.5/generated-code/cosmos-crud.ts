import { CosmosClient, Database, Container, ItemResponse } from "@azure/cosmos";

/**
 * Azure Cosmos DB CRUD Operations Demo
 * 
 * Required package: npm install @azure/cosmos
 */

interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

async function runCrudOperations() {
  // Step 1: Create CosmosClient using endpoint and key
  const endpoint = process.env.COSMOS_ENDPOINT || "https://your-account.documents.azure.com:443/";
  const key = process.env.COSMOS_KEY || "your-cosmos-db-key";
  
  const client = new CosmosClient({ endpoint, key });
  
  console.log("✓ CosmosClient created");

  try {
    // Step 2: Create database and container
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

    // Step 3: Create an item
    const newItem: Item = {
      id: "item-001",
      category: "electronics",
      name: "Wireless Mouse",
      quantity: 50
    };

    const createResponse: ItemResponse<Item> = await container.items.create(newItem);
    
    if (createResponse.statusCode === 201) {
      console.log(`✓ Item created (Status: ${createResponse.statusCode})`);
      console.log(`  ID: ${createResponse.resource?.id}, Name: ${createResponse.resource?.name}`);
    } else {
      console.error(`✗ Unexpected status code on create: ${createResponse.statusCode}`);
    }

    // Step 4: Read the item back using item().read()
    const itemId = newItem.id;
    const partitionKeyValue = newItem.category;
    
    const readResponse: ItemResponse<Item> = await container
      .item(itemId, partitionKeyValue)
      .read<Item>();
    
    if (readResponse.statusCode === 200) {
      console.log(`✓ Item read successfully (Status: ${readResponse.statusCode})`);
      console.log(`  Item: ${JSON.stringify(readResponse.resource, null, 2)}`);
    } else {
      console.error(`✗ Unexpected status code on read: ${readResponse.statusCode}`);
    }

    // Step 5: Query items where category equals "electronics" using parameterized query
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
    
    console.log(`✓ Query executed: Found ${queryResults.length} item(s) in 'electronics' category`);
    queryResults.forEach((item, index) => {
      console.log(`  [${index + 1}] ${item.name} (Quantity: ${item.quantity})`);
    });

    // Step 6: Replace the item with updated quantity using item().replace()
    const updatedItem: Item = {
      ...readResponse.resource!,
      quantity: 75 // Update quantity from 50 to 75
    };

    const replaceResponse: ItemResponse<Item> = await container
      .item(itemId, partitionKeyValue)
      .replace<Item>(updatedItem);
    
    if (replaceResponse.statusCode === 200) {
      console.log(`✓ Item replaced successfully (Status: ${replaceResponse.statusCode})`);
      console.log(`  Updated quantity: ${replaceResponse.resource?.quantity}`);
    } else {
      console.error(`✗ Unexpected status code on replace: ${replaceResponse.statusCode}`);
    }

    // Step 7: Delete the item using item().delete()
    const deleteResponse: ItemResponse<Item> = await container
      .item(itemId, partitionKeyValue)
      .delete<Item>();
    
    if (deleteResponse.statusCode === 204) {
      console.log(`✓ Item deleted successfully (Status: ${deleteResponse.statusCode})`);
    } else {
      console.error(`✗ Unexpected status code on delete: ${deleteResponse.statusCode}`);
    }

    // Verify deletion
    try {
      await container.item(itemId, partitionKeyValue).read();
      console.log("✗ Item still exists after deletion");
    } catch (error: any) {
      if (error.code === 404) {
        console.log("✓ Verified: Item no longer exists (404 Not Found)");
      } else {
        throw error;
      }
    }

    console.log("\n🎉 All CRUD operations completed successfully!");

  } catch (error: any) {
    console.error("\n❌ Error occurred:");
    
    if (error.code) {
      console.error(`  Status Code: ${error.code}`);
    }
    
    if (error.body) {
      console.error(`  Message: ${error.body.message || error.body}`);
    } else {
      console.error(`  Message: ${error.message}`);
    }
    
    console.error(`  Details: ${JSON.stringify(error, null, 2)}`);
    process.exit(1);
  }
}

// Run the program
runCrudOperations().catch(console.error);
