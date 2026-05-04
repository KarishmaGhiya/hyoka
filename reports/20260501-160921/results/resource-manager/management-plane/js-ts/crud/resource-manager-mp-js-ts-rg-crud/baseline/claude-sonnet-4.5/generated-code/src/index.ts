import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient, ResourceGroup } from "@azure/arm-resources";

async function main() {
  try {
    // Step 1: Authenticate using DefaultAzureCredential
    console.log("Step 1: Authenticating with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();

    // Get subscription ID from environment variable
    const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    if (!subscriptionId) {
      throw new Error("AZURE_SUBSCRIPTION_ID environment variable is not set");
    }

    // Step 2: Create ResourceManagementClient
    console.log("Step 2: Creating ResourceManagementClient...");
    const client = new ResourceManagementClient(credential, subscriptionId);
    console.log("✓ Client created successfully\n");

    // Generate unique resource group name
    const resourceGroupName = `rg-demo-${Date.now()}`;
    const location = "eastus";

    // Step 3: Create a new resource group
    console.log("Step 3: Creating resource group...");
    console.log(`  Name: ${resourceGroupName}`);
    console.log(`  Location: ${location}`);
    
    const createParams: ResourceGroup = {
      location: location,
      tags: {
        environment: "demo",
        purpose: "sdk-testing"
      }
    };

    const createResult = await client.resourceGroups.createOrUpdate(
      resourceGroupName,
      createParams
    );
    console.log("✓ Resource group created:");
    console.log(`  ID: ${createResult.id}`);
    console.log(`  Name: ${createResult.name}`);
    console.log(`  Location: ${createResult.location}`);
    console.log(`  Provisioning State: ${createResult.properties?.provisioningState}\n`);

    // Step 4: List all resource groups
    console.log("Step 4: Listing all resource groups...");
    let count = 0;
    for await (const rg of client.resourceGroups.list()) {
      count++;
      console.log(`  [${count}] ${rg.name} (${rg.location})`);
    }
    console.log(`✓ Total resource groups: ${count}\n`);

    // Step 5: Get details of the created resource group
    console.log("Step 5: Getting resource group details...");
    const resourceGroup = await client.resourceGroups.get(resourceGroupName);
    console.log("✓ Resource group details:");
    console.log(`  Name: ${resourceGroup.name}`);
    console.log(`  ID: ${resourceGroup.id}`);
    console.log(`  Location: ${resourceGroup.location}`);
    console.log(`  Managed By: ${resourceGroup.managedBy || "N/A"}`);
    console.log(`  Provisioning State: ${resourceGroup.properties?.provisioningState}`);
    console.log(`  Tags:`, resourceGroup.tags);
    console.log();

    // Step 6: Update the resource group by adding a tag
    console.log("Step 6: Updating resource group with new tag...");
    const updateParams: ResourceGroup = {
      location: resourceGroup.location,
      tags: {
        ...resourceGroup.tags,
        updatedAt: new Date().toISOString(),
        status: "modified"
      }
    };

    const updateResult = await client.resourceGroups.update(
      resourceGroupName,
      updateParams
    );
    console.log("✓ Resource group updated:");
    console.log(`  Updated Tags:`, updateResult.tags);
    console.log();

    // Step 7: Delete the resource group
    console.log("Step 7: Deleting resource group...");
    console.log("  This may take a few minutes...");
    
    await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
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

    console.log("=== Demo completed successfully! ===");
  } catch (error: any) {
    console.error("Error occurred:", error.message);
    if (error.statusCode) {
      console.error("Status Code:", error.statusCode);
    }
    if (error.code) {
      console.error("Error Code:", error.code);
    }
    process.exit(1);
  }
}

// Run the main function
main();
