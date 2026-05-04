import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";

/**
 * Main function to demonstrate Azure Resource Group management operations
 */
async function main(): Promise<void> {
  try {
    // Configuration
    const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    
    if (!subscriptionId) {
      throw new Error("AZURE_SUBSCRIPTION_ID environment variable is required");
    }

    const resourceGroupName = `rg-demo-${Date.now()}`;
    const location = "eastus";

    console.log("=== Azure Resource Group Management Demo ===\n");

    // Step 1: Authenticate using DefaultAzureCredential
    console.log("1. Authenticating with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    console.log("   ✓ Authentication configured\n");

    // Step 2: Create ResourceManagementClient
    console.log("2. Creating ResourceManagementClient...");
    const client = new ResourceManagementClient(credential, subscriptionId);
    console.log(`   ✓ Client created for subscription: ${subscriptionId}\n`);

    // Step 3: Create a new resource group
    console.log(`3. Creating resource group: ${resourceGroupName}...`);
    const createResult = await client.resourceGroups.createOrUpdate(
      resourceGroupName,
      {
        location: location,
        tags: {
          environment: "demo",
          createdBy: "typescript-sdk"
        }
      }
    );
    console.log(`   ✓ Resource group created successfully`);
    console.log(`   - Name: ${createResult.name}`);
    console.log(`   - Location: ${createResult.location}`);
    console.log(`   - Provisioning State: ${createResult.properties?.provisioningState}\n`);

    // Step 4: List all resource groups
    console.log("4. Listing all resource groups in the subscription...");
    let count = 0;
    const resourceGroups = client.resourceGroups.list();
    
    console.log("   Resource Groups:");
    for await (const rg of resourceGroups) {
      count++;
      console.log(`   - ${rg.name} (${rg.location})`);
    }
    console.log(`   ✓ Total resource groups found: ${count}\n`);

    // Step 5: Get details of the created resource group
    console.log(`5. Getting details of resource group: ${resourceGroupName}...`);
    const resourceGroup = await client.resourceGroups.get(resourceGroupName);
    console.log(`   ✓ Resource group details retrieved:`);
    console.log(`   - ID: ${resourceGroup.id}`);
    console.log(`   - Name: ${resourceGroup.name}`);
    console.log(`   - Location: ${resourceGroup.location}`);
    console.log(`   - Provisioning State: ${resourceGroup.properties?.provisioningState}`);
    console.log(`   - Tags:`, JSON.stringify(resourceGroup.tags, null, 2));
    console.log();

    // Step 6: Update the resource group by adding a tag
    console.log("6. Updating resource group with a new tag...");
    const updateResult = await client.resourceGroups.update(resourceGroupName, {
      tags: {
        ...resourceGroup.tags,
        status: "active",
        lastModified: new Date().toISOString()
      }
    });
    console.log(`   ✓ Resource group updated successfully`);
    console.log(`   - Updated Tags:`, JSON.stringify(updateResult.tags, null, 2));
    console.log();

    // Step 7: Delete the resource group
    console.log(`7. Deleting resource group: ${resourceGroupName}...`);
    console.log("   (This may take a few minutes...)");
    
    await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
    
    console.log(`   ✓ Resource group deleted successfully\n`);

    // Verify deletion
    console.log("8. Verifying deletion...");
    try {
      await client.resourceGroups.get(resourceGroupName);
      console.log("   ⚠ Resource group still exists (unexpected)");
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.log("   ✓ Resource group confirmed deleted\n");
      } else {
        throw error;
      }
    }

    console.log("=== Demo completed successfully ===");

  } catch (error) {
    console.error("Error occurred:", error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
