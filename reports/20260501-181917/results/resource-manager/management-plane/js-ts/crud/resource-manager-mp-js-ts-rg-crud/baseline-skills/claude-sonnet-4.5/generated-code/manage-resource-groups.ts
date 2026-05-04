import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient, ResourceGroup } from "@azure/arm-resources";

async function main() {
  // Configuration
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
  if (!subscriptionId) {
    throw new Error("AZURE_SUBSCRIPTION_ID environment variable is required");
  }

  const resourceGroupName = `rg-demo-${Date.now()}`;
  const location = "eastus";

  console.log("=== Azure Resource Group Management Demo ===\n");

  // 1. Authenticate using DefaultAzureCredential
  console.log("1. Authenticating with DefaultAzureCredential...");
  const credential = new DefaultAzureCredential();

  // 2. Create ResourceManagementClient
  console.log("2. Creating ResourceManagementClient...");
  const client = new ResourceManagementClient(credential, subscriptionId);
  console.log("   ✓ Client created successfully\n");

  try {
    // 3. Create a new resource group
    console.log(`3. Creating resource group: ${resourceGroupName}`);
    const createParams: ResourceGroup = {
      location: location,
      tags: {
        environment: "demo",
        purpose: "testing"
      }
    };

    const createdRg = await client.resourceGroups.createOrUpdate(
      resourceGroupName,
      createParams
    );
    console.log(`   ✓ Resource group created: ${createdRg.name}`);
    console.log(`   Location: ${createdRg.location}`);
    console.log(`   Provisioning State: ${createdRg.properties?.provisioningState}\n`);

    // 4. List all resource groups using iteration
    console.log("4. Listing all resource groups in subscription:");
    let count = 0;
    for await (const rg of client.resourceGroups.list()) {
      count++;
      console.log(`   - ${rg.name} (${rg.location})`);
      if (count >= 10) {
        console.log("   ... (showing first 10 only)");
        break;
      }
    }
    console.log();

    // 5. Get details of the created resource group
    console.log(`5. Getting details of resource group: ${resourceGroupName}`);
    const retrievedRg = await client.resourceGroups.get(resourceGroupName);
    console.log(`   Name: ${retrievedRg.name}`);
    console.log(`   Location: ${retrievedRg.location}`);
    console.log(`   ID: ${retrievedRg.id}`);
    console.log(`   Provisioning State: ${retrievedRg.properties?.provisioningState}`);
    console.log("   Tags:", retrievedRg.tags);
    console.log();

    // 6. Update the resource group by adding a tag
    console.log(`6. Updating resource group with additional tag...`);
    const updateParams: ResourceGroup = {
      tags: {
        ...retrievedRg.tags,
        updatedAt: new Date().toISOString(),
        status: "active"
      }
    };

    const updatedRg = await client.resourceGroups.update(
      resourceGroupName,
      updateParams
    );
    console.log(`   ✓ Resource group updated`);
    console.log("   New Tags:", updatedRg.tags);
    console.log();

    // 7. Delete the resource group using beginDeleteAndWait
    console.log(`7. Deleting resource group: ${resourceGroupName}`);
    console.log("   This may take a few minutes...");
    
    const deletePoller = await client.resourceGroups.beginDelete(
      resourceGroupName
    );
    await deletePoller.pollUntilDone();
    
    console.log(`   ✓ Resource group deleted successfully\n`);

    console.log("=== Demo completed successfully ===");

  } catch (error) {
    console.error("Error occurred:", error);
    
    // Cleanup: attempt to delete the resource group if it exists
    try {
      console.log("\nAttempting cleanup...");
      const deletePoller = await client.resourceGroups.beginDelete(
        resourceGroupName
      );
      await deletePoller.pollUntilDone();
      console.log("Cleanup completed");
    } catch (cleanupError) {
      console.error("Cleanup failed:", cleanupError);
    }
    
    throw error;
  }
}

// Run the program
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
