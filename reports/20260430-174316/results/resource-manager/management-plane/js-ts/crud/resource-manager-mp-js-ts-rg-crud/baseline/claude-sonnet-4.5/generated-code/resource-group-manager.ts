import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient, ResourceGroup } from "@azure/arm-resources";

async function manageResourceGroups() {
  try {
    // 1. Authenticate using DefaultAzureCredential
    console.log("Authenticating with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();

    // 2. Create a ResourceManagementClient with credential and subscription ID
    const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    if (!subscriptionId) {
      throw new Error("AZURE_SUBSCRIPTION_ID environment variable is not set");
    }

    console.log(`Creating ResourceManagementClient for subscription: ${subscriptionId}`);
    const client = new ResourceManagementClient(credential, subscriptionId);

    // 3. Create a new resource group in "eastus" region
    const resourceGroupName = `rg-demo-${Date.now()}`;
    const location = "eastus";

    console.log(`\nCreating resource group: ${resourceGroupName} in ${location}...`);
    const createParams: ResourceGroup = {
      location: location,
      tags: {
        environment: "demo",
        purpose: "testing"
      }
    };

    const createdResourceGroup = await client.resourceGroups.createOrUpdate(
      resourceGroupName,
      createParams
    );
    console.log(`Resource group created successfully:`);
    console.log(`  Name: ${createdResourceGroup.name}`);
    console.log(`  Location: ${createdResourceGroup.location}`);
    console.log(`  ID: ${createdResourceGroup.id}`);

    // 4. List all resource groups in the subscription using iteration
    console.log(`\nListing all resource groups in subscription...`);
    let count = 0;
    for await (const resourceGroup of client.resourceGroups.list()) {
      count++;
      console.log(`  ${count}. ${resourceGroup.name} (${resourceGroup.location})`);
    }
    console.log(`Total resource groups: ${count}`);

    // 5. Get details of the created resource group
    console.log(`\nGetting details of resource group: ${resourceGroupName}...`);
    const retrievedResourceGroup = await client.resourceGroups.get(resourceGroupName);
    console.log(`Resource group details:`);
    console.log(`  Name: ${retrievedResourceGroup.name}`);
    console.log(`  Location: ${retrievedResourceGroup.location}`);
    console.log(`  Provisioning State: ${retrievedResourceGroup.properties?.provisioningState}`);
    console.log(`  Tags:`, retrievedResourceGroup.tags);

    // 6. Update the resource group by adding a tag
    console.log(`\nUpdating resource group with additional tag...`);
    const updateParams: ResourceGroup = {
      location: retrievedResourceGroup.location,
      tags: {
        ...retrievedResourceGroup.tags,
        updatedAt: new Date().toISOString(),
        status: "modified"
      }
    };

    const updatedResourceGroup = await client.resourceGroups.createOrUpdate(
      resourceGroupName,
      updateParams
    );
    console.log(`Resource group updated successfully`);
    console.log(`  Updated tags:`, updatedResourceGroup.tags);

    // 7. Delete the resource group using beginDeleteAndWait
    console.log(`\nDeleting resource group: ${resourceGroupName}...`);
    console.log(`This may take a few moments...`);

    await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
    console.log(`Resource group deleted successfully`);

    // Verify deletion
    console.log(`\nVerifying deletion...`);
    try {
      await client.resourceGroups.get(resourceGroupName);
      console.log(`WARNING: Resource group still exists`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.log(`Confirmed: Resource group no longer exists`);
      } else {
        throw error;
      }
    }

    console.log(`\n✅ All operations completed successfully!`);

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

// Run the program
console.log("=".repeat(60));
console.log("Azure Resource Group Management Demo");
console.log("=".repeat(60));

manageResourceGroups()
  .then(() => {
    console.log("\nProgram completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nProgram failed:", error);
    process.exit(1);
  });
