import { CosmosClient, ErrorResponse, SqlQuerySpec } from "@azure/cosmos";

// Define the item interface
interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

async function main() {
  // Step 1: Create a CosmosClient using endpoint and key
  const endpoint = process.env.COSMOS_ENDPOINT || "https://your-account.documents.azure.com:443/";
  const key = process.env.COSMOS_KEY || "your-cosmos-key";

  const client = new CosmosClient({ endpoint, key });
  console.log("✓ CosmosClient created");

  try {
    // Step 2: Create database "TestDB" and container "Items" with partition key "/category"
    const { database } = await client.databases.createIfNotExists({
      id: "TestDB",
    });
    console.log("✓ Database 'TestDB' created or already exists");

    const { container } = await database.containers.createIfNotExists({
      id: "Items",
      partitionKey: { paths: ["/category"] },
    });
    console.log("✓ Container 'Items' created or already exists with partition key '/category'");

    // Step 3: Create an item with properties: id, category, name, quantity
    const newItem: Item = {
      id: "item-001",
      category: "electronics",
      name: "Laptop",
      quantity: 10,
    };

    const createResponse = await container.items.create<Item>(newItem);
    
    if (createResponse.statusCode === 201) {
      console.log(`✓ Item created successfully (Status: ${createResponse.statusCode})`);
      console.log("  Created item:", createResponse.resource);
    } else {
      console.log(`⚠ Item creation returned status: ${createResponse.statusCode}`);
    }

    // Step 4: Read the item back using item().read()
    const readResponse = await container
      .item(newItem.id, newItem.category)
      .read<Item>();

    if (readResponse.statusCode === 200 && readResponse.resource) {
      console.log(`✓ Item read successfully (Status: ${readResponse.statusCode})`);
      console.log("  Read item:", readResponse.resource);
    } else {
      console.log(`⚠ Item read returned status: ${readResponse.statusCode}`);
    }

    // Step 5: Query items where category equals "electronics" using parameterized query
    const querySpec: SqlQuerySpec = {
      query: "SELECT * FROM c WHERE c.category = @category",
      parameters: [
        { name: "@category", value: "electronics" },
      ],
    };

    const queryResponse = await container.items
      .query<Item>(querySpec)
      .fetchAll();

    console.log(`✓ Query executed successfully`);
    console.log(`  Found ${queryResponse.resources.length} item(s) in 'electronics' category:`);
    queryResponse.resources.forEach((item, index) => {
      console.log(`    [${index + 1}] ${item.name} - Quantity: ${item.quantity}`);
    });

    // Step 6: Replace the item with updated quantity using item().replace()
    const itemToUpdate = readResponse.resource;
    if (itemToUpdate) {
      itemToUpdate.quantity = 15; // Update quantity from 10 to 15

      const replaceResponse = await container
        .item(itemToUpdate.id, itemToUpdate.category)
        .replace<Item>(itemToUpdate);

      if (replaceResponse.statusCode === 200) {
        console.log(`✓ Item replaced successfully (Status: ${replaceResponse.statusCode})`);
        console.log("  Updated item:", replaceResponse.resource);
      } else {
        console.log(`⚠ Item replace returned status: ${replaceResponse.statusCode}`);
      }
    }

    // Step 7: Delete the item using item().delete()
    const deleteResponse = await container
      .item(newItem.id, newItem.category)
      .delete();

    if (deleteResponse.statusCode === 204) {
      console.log(`✓ Item deleted successfully (Status: ${deleteResponse.statusCode})`);
    } else {
      console.log(`⚠ Item delete returned status: ${deleteResponse.statusCode}`);
    }

    // Verify deletion by attempting to read the item
    try {
      await container.item(newItem.id, newItem.category).read<Item>();
      console.log("⚠ Item still exists after deletion");
    } catch (error) {
      if (error instanceof ErrorResponse && error.code === 404) {
        console.log("✓ Verified: Item no longer exists (404 Not Found)");
      } else {
        throw error;
      }
    }

    console.log("\n✓ All CRUD operations completed successfully!");

  } catch (error) {
    // Handle errors with appropriate status code checks
    if (error instanceof ErrorResponse) {
      console.error(`\n✗ Cosmos DB Error (Status ${error.code}):`);
      
      switch (error.code) {
        case 400:
          console.error("  Bad Request - Invalid request syntax");
          break;
        case 401:
          console.error("  Unauthorized - Invalid credentials");
          break;
        case 403:
          console.error("  Forbidden - Insufficient permissions");
          break;
        case 404:
          console.error("  Not Found - Resource does not exist");
          break;
        case 409:
          console.error("  Conflict - Resource already exists");
          break;
        case 412:
          console.error("  Precondition Failed - ETag mismatch");
          break;
        case 413:
          console.error("  Request Entity Too Large - Document exceeds size limit");
          break;
        case 429:
          console.error(`  Too Many Requests - Rate limited. Retry after ${error.retryAfterInMs}ms`);
          break;
        case 500:
          console.error("  Internal Server Error - Service error");
          break;
        case 503:
          console.error("  Service Unavailable - Service temporarily unavailable");
          break;
        default:
          console.error(`  Error: ${error.message}`);
      }
      
      console.error(`  Details: ${error.message}`);
    } else {
      console.error("\n✗ Unexpected error:", error);
    }
    
    process.exit(1);
  } finally {
    // Clean up: Close the client connection
    client.dispose();
    console.log("\n✓ CosmosClient disposed");
  }
}

// Run the program
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
