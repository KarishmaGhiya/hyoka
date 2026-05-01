import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";

/**
 * Azure Resource Group Management Demo
 * Demonstrates CRUD operations on Azure Resource Groups using the management plane SDK
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

    console.log("=".repeat(60));
    console.log("Azure Resource Group Management Demo");
    console.log("=".repeat(60));
    console.log(`Subscription ID: ${subscriptionId}`);
    console.log(`Resource Group Name: ${resourceGroupName}`);
    console.log(`Location: ${location}\n`);

    // Step 1: Authenticate using DefaultAzureCredential
    console.log("Step 1: Authenticating with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    console.log("✓ Authentication successful\n");

    // Step 2: Create ResourceManagementClient
    console.log("Step 2: Creating ResourceManagementClient...");
    const client = new ResourceManagementClient(credential, subscriptionId);
    console.log("✓ Client created successfully\n");

    // Step 3: Create a new resource group
    console.log("Step 3: Creating resource group...");
    const createResult = await client.resourceGroups.createOrUpdate(
      resourceGroupName,
      {
        location: location,
        tags: {
          environment: "demo",
          purpose: "testing",
        },
      }
    );
    console.log("✓ Resource group created successfully");
    console.log(`  Name: ${createResult.name}`);
    console.log(`  Location: ${createResult.location}`);
    console.log(`  ID: ${createResult.id}`);
    console.log(`  Provisioning State: ${createResult.properties?.provisioningState}\n`);

    // Step 4: List all resource groups in the subscription
    console.log("Step 4: Listing all resource groups...");
    let count = 0;
    for await (const resourceGroup of client.resourceGroups.list()) {
      count++;
      console.log(`  [${count}] ${resourceGroup.name} (${resourceGroup.location})`);
    }
    console.log(`✓ Total resource groups: ${count}\n`);

    // Step 5: Get details of the created resource group
    console.log("Step 5: Getting resource group details...");
    const getResult = await client.resourceGroups.get(resourceGroupName);
    console.log("✓ Resource group details retrieved");
    console.log(`  Name: ${getResult.name}`);
    console.log(`  Location: ${getResult.location}`);
    console.log(`  ID: ${getResult.id}`);
    console.log(`  Provisioning State: ${getResult.properties?.provisioningState}`);
    console.log(`  Tags:`, JSON.stringify(getResult.tags, null, 2));
    console.log();

    // Step 6: Update the resource group by adding a tag
    console.log("Step 6: Updating resource group with new tag...");
    const updateResult = await client.resourceGroups.update(
      resourceGroupName,
      {
        tags: {
          ...getResult.tags,
          updatedAt: new Date().toISOString(),
          status: "modified",
        },
      }
    );
    console.log("✓ Resource group updated successfully");
    console.log(`  Updated Tags:`, JSON.stringify(updateResult.tags, null, 2));
    console.log();

    // Step 7: Delete the resource group
    console.log("Step 7: Deleting resource group...");
    console.log("  This may take a few minutes...");
    
    const deletePoller = await client.resourceGroups.beginDelete(
      resourceGroupName
    );
    await deletePoller.pollUntilDone();
    
    console.log("✓ Resource group deleted successfully\n");

    // Verify deletion
    console.log("Verifying deletion...");
    try {
      await client.resourceGroups.get(resourceGroupName);
      console.log("⚠ Resource group still exists (unexpected)");
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.log("✓ Confirmed: Resource group no longer exists\n");
      } else {
        throw error;
      }
    }

    console.log("=".repeat(60));
    console.log("Demo completed successfully!");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\n❌ Error occurred:");
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Execute the main function
main();
