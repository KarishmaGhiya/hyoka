import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";

/**
 * Azure Resource Group Management Demo
 * Demonstrates CRUD operations on Azure Resource Groups using the Management Plane SDK
 */
async function main() {
  try {
    // Configuration
    const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    if (!subscriptionId) {
      throw new Error("AZURE_SUBSCRIPTION_ID environment variable is required");
    }

    const resourceGroupName = `rg-demo-${Date.now()}`;
    const location = "eastus";

    console.log("=".repeat(60));
    console.log("Azure Resource Group Management Demo");
    console.log("=".repeat(60));
    console.log();

    // Step 1: Authenticate using DefaultAzureCredential
    console.log("Step 1: Authenticating with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    console.log("✓ Authentication configured");
    console.log();

    // Step 2: Create ResourceManagementClient
    console.log("Step 2: Creating ResourceManagementClient...");
    const client = new ResourceManagementClient(credential, subscriptionId);
    console.log(`✓ Client created for subscription: ${subscriptionId}`);
    console.log();

    // Step 3: Create a new resource group
    console.log("Step 3: Creating resource group...");
    console.log(`  Name: ${resourceGroupName}`);
    console.log(`  Location: ${location}`);
    
    const createResult = await client.resourceGroups.createOrUpdate(
      resourceGroupName,
      {
        location: location,
        tags: {
          environment: "demo",
          purpose: "sdk-example"
        }
      }
    );
    
    console.log(`✓ Resource group created successfully`);
    console.log(`  ID: ${createResult.id}`);
    console.log(`  Provisioning State: ${createResult.properties?.provisioningState}`);
    console.log();

    // Step 4: List all resource groups in the subscription
    console.log("Step 4: Listing all resource groups...");
    const resourceGroups = [];
    
    for await (const rg of client.resourceGroups.list()) {
      resourceGroups.push(rg);
    }
    
    console.log(`✓ Found ${resourceGroups.length} resource group(s):`);
    resourceGroups.forEach((rg, index) => {
      console.log(`  ${index + 1}. ${rg.name} (${rg.location})`);
      if (rg.tags && Object.keys(rg.tags).length > 0) {
        console.log(`     Tags: ${JSON.stringify(rg.tags)}`);
      }
    });
    console.log();

    // Step 5: Get details of the created resource group
    console.log("Step 5: Getting resource group details...");
    const rgDetails = await client.resourceGroups.get(resourceGroupName);
    
    console.log(`✓ Resource group details:`);
    console.log(`  Name: ${rgDetails.name}`);
    console.log(`  Location: ${rgDetails.location}`);
    console.log(`  ID: ${rgDetails.id}`);
    console.log(`  Provisioning State: ${rgDetails.properties?.provisioningState}`);
    console.log(`  Tags: ${JSON.stringify(rgDetails.tags, null, 2)}`);
    console.log();

    // Step 6: Update the resource group by adding a tag
    console.log("Step 6: Updating resource group tags...");
    const updatedRg = await client.resourceGroups.update(resourceGroupName, {
      tags: {
        ...rgDetails.tags,
        updated: "true",
        timestamp: new Date().toISOString()
      }
    });
    
    console.log(`✓ Resource group updated successfully`);
    console.log(`  Updated Tags: ${JSON.stringify(updatedRg.tags, null, 2)}`);
    console.log();

    // Step 7: Delete the resource group
    console.log("Step 7: Deleting resource group...");
    console.log("  This operation may take a few minutes...");
    
    await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
    
    console.log(`✓ Resource group "${resourceGroupName}" deleted successfully`);
    console.log();

    console.log("=".repeat(60));
    console.log("Demo completed successfully!");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("Error occurred:");
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the main function
main();
