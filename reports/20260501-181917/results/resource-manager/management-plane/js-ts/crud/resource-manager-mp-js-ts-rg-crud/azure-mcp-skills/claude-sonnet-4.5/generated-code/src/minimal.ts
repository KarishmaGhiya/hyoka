import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";

/**
 * Minimal Example: Azure Resource Group CRUD Operations
 * 
 * This is a simplified version showing just the core operations.
 */

async function minimalExample() {
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID!;
  
  // 1. Authenticate and create client
  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(credential, subscriptionId);
  
  const rgName = `rg-minimal-${Date.now()}`;
  
  try {
    // 2. Create
    console.log("Creating resource group...");
    await client.resourceGroups.createOrUpdate(rgName, {
      location: "eastus",
      tags: { purpose: "demo" }
    });
    console.log("✓ Created");
    
    // 3. List
    console.log("\nListing all resource groups...");
    for await (const rg of client.resourceGroups.list()) {
      console.log(`  - ${rg.name}`);
    }
    
    // 4. Get
    console.log(`\nGetting details of ${rgName}...`);
    const rg = await client.resourceGroups.get(rgName);
    console.log(`✓ Location: ${rg.location}`);
    
    // 5. Update
    console.log("\nUpdating tags...");
    await client.resourceGroups.update(rgName, {
      tags: { ...rg.tags, updated: "true" }
    });
    console.log("✓ Updated");
    
    // 6. Delete
    console.log("\nDeleting resource group...");
    await client.resourceGroups.beginDeleteAndWait(rgName);
    console.log("✓ Deleted");
    
  } catch (error: any) {
    console.error("Error:", error.message);
    throw error;
  }
}

minimalExample();
