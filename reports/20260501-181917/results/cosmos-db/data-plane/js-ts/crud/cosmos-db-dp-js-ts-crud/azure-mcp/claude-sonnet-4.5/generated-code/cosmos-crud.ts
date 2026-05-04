import { CosmosClient, Database, Container } from "@azure/cosmos";

/**
 * Azure Cosmos DB CRUD Operations Demo
 */

// Configuration
const endpoint = process.env.COSMOS_ENDPOINT || "https://your-account.documents.azure.com:443/";
const key = process.env.COSMOS_KEY || "your-cosmos-db-key";
const databaseId = "TestDB";
const containerId = "Items";

// Item interface
interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

async function main() {
  // 1. Create CosmosClient using endpoint and key
  console.log("1. Creating CosmosClient...");
  const client = new CosmosClient({ endpoint, key });

  try {
    // 2. Create database and container
    console.log("\n2. Creating database and container...");
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    console.log(`   Database '${databaseId}' ready`);

    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: ["/category"] }
    });
    console.log(`   Container '${containerId}' ready with partition key '/category'`);

    // 3. Create an item
    console.log("\n3. Creating item...");
    const newItem: Item = {
      id: "item001",
      category: "electronics",
      name: "Wireless Mouse",
      quantity: 15
    };

    const { resource: createdItem, statusCode: createStatus } = await container.items.create(newItem);
    
    if (createStatus === 201) {
      console.log(`   ✓ Item created successfully (Status: ${createStatus})`);
      console.log(`   Item:`, JSON.stringify(createdItem, null, 2));
    } else {
      console.log(`   ⚠ Unexpected status: ${createStatus}`);
    }

    // 4. Read the item back using item().read()
    console.log("\n4. Reading item by id and partition key...");
    const { resource: readItem, statusCode: readStatus } = await container
      .item(newItem.id, newItem.category)
      .read<Item>();

    if (readStatus === 200) {
      console.log(`   ✓ Item read successfully (Status: ${readStatus})`);
      console.log(`   Item:`, JSON.stringify(readItem, null, 2));
    } else if (readStatus === 404) {
      console.log(`   ✗ Item not found (Status: ${readStatus})`);
    } else {
      console.log(`   ⚠ Unexpected status: ${readStatus}`);
    }

    // 5. Query items where category equals "electronics" using parameterized query
    console.log("\n5. Querying items with category='electronics'...");
    const querySpec = {
      query: "SELECT * FROM c WHERE c.category = @category",
      parameters: [
        {
          name: "@category",
          value: "electronics"
        }
      ]
    };

    const { resources: items } = await container.items.query<Item>(querySpec).fetchAll();
    console.log(`   ✓ Found ${items.length} item(s)`);
    items.forEach((item, index) => {
      console.log(`   Item ${index + 1}:`, JSON.stringify(item, null, 2));
    });

    // 6. Replace the item with updated quantity using item().replace()
    console.log("\n6. Updating item quantity...");
    if (readItem) {
      const updatedItem: Item = {
        ...readItem,
        quantity: 25  // Updated quantity
      };

      const { resource: replacedItem, statusCode: replaceStatus } = await container
        .item(updatedItem.id, updatedItem.category)
        .replace<Item>(updatedItem);

      if (replaceStatus === 200) {
        console.log(`   ✓ Item updated successfully (Status: ${replaceStatus})`);
        console.log(`   Updated quantity: ${readItem.quantity} → ${replacedItem?.quantity}`);
      } else if (replaceStatus === 404) {
        console.log(`   ✗ Item not found (Status: ${replaceStatus})`);
      } else {
        console.log(`   ⚠ Unexpected status: ${replaceStatus}`);
      }
    }

    // 7. Delete the item using item().delete()
    console.log("\n7. Deleting item...");
    const { statusCode: deleteStatus } = await container
      .item(newItem.id, newItem.category)
      .delete();

    if (deleteStatus === 204) {
      console.log(`   ✓ Item deleted successfully (Status: ${deleteStatus})`);
    } else if (deleteStatus === 404) {
      console.log(`   ⚠ Item not found (Status: ${deleteStatus})`);
    } else {
      console.log(`   ⚠ Unexpected status: ${deleteStatus}`);
    }

    // Verify deletion
    console.log("\n8. Verifying deletion...");
    try {
      const { statusCode: verifyStatus } = await container
        .item(newItem.id, newItem.category)
        .read();
      console.log(`   ⚠ Item still exists (Status: ${verifyStatus})`);
    } catch (error: any) {
      if (error.code === 404) {
        console.log(`   ✓ Confirmed: Item no longer exists`);
      } else {
        console.log(`   Error verifying deletion: ${error.message}`);
      }
    }

    console.log("\n✓ All CRUD operations completed successfully!");

  } catch (error: any) {
    console.error("\n✗ Error occurred:");
    console.error(`   Code: ${error.code}`);
    console.error(`   Status: ${error.statusCode || error.code}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.body) {
      console.error(`   Details:`, JSON.stringify(error.body, null, 2));
    }
    
    process.exit(1);
  }
}

// Run the program
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
