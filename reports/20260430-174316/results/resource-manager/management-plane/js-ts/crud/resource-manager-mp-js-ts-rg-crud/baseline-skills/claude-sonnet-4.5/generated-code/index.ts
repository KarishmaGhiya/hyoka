import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient, ResourceGroup } from "@azure/arm-resources";

async function main() {
  try {
    console.log("=== Azure Resource Group Management Demo ===\n");

    // Step 1: Authenticate using DefaultAzureCredential
    console.log("1. Authenticating with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    
    // Get subscription ID from environment variable
    const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    if (!subscriptionId) {
      throw new Error("AZURE_SUBSCRIPTION_ID environment variable is not set");
    }
    console.log(`   Subscription ID: ${subscriptionId}\n`);

    // Step 2: Create ResourceManagementClient
    console.log("2. Creating ResourceManagementClient...");
    const client = new ResourceManagementClient(credential, subscriptionId);
    console.log("   Client created successfully\n");

    // Step 3: Create a new resource group
    const resourceGroupName = `rg-demo-${Date.now()}`;
    const location = "eastus";
    
    console.log(`3. Creating resource group: ${resourceGroupName}`);
    const createParams: ResourceGroup = {
      location: location,
      tags: {
        environment: "demo",
        createdBy: "typescript-sdk"
      }
    };
    
    const createdRg = await client.resourceGroups.createOrUpdate(
      resourceGroupName,
      createParams
    );
    console.log(`   ✓ Resource group created: ${createdRg.name}`);
    console.log(`   Location: ${createdRg.location}`);
    console.log(`   Provisioning State: ${createdRg.properties?.provisioningState}\n`);

    // Step 4: List all resource groups in the subscription
    console.log("4. Listing all resource groups in subscription:");
    const resourceGroups: ResourceGroup[] = [];
    for await (const rg of client.resourceGroups.list()) {
      resourceGroups.push(rg);
      console.log(`   - ${rg.name} (${rg.location})`);
    }
    console.log(`   Total resource groups: ${resourceGroups.length}\n`);

    // Step 5: Get details of the created resource group
    console.log(`5. Getting details of resource group: ${resourceGroupName}`);
    const rgDetails = await client.resourceGroups.get(resourceGroupName);
    console.log(`   Name: ${rgDetails.name}`);
    console.log(`   Location: ${rgDetails.location}`);
    console.log(`   ID: ${rgDetails.id}`);
    console.log(`   Provisioning State: ${rgDetails.properties?.provisioningState}`);
    console.log(`   Tags:`, rgDetails.tags);
    console.log();

    // Step 6: Update the resource group by adding a tag
    console.log(`6. Updating resource group with additional tag...`);
    const updateParams: ResourceGroup = {
      location: rgDetails.location!,
      tags: {
        ...rgDetails.tags,
        lastModified: new Date().toISOString(),
        status: "updated"
      }
    };
    
    const updatedRg = await client.resourceGroups.createOrUpdate(
      resourceGroupName,
      updateParams
    );
    console.log(`   ✓ Resource group updated`);
    console.log(`   Updated tags:`, updatedRg.tags);
    console.log();

    // Step 7: Delete the resource group
    console.log(`7. Deleting resource group: ${resourceGroupName}`);
    console.log("   This operation may take a few minutes...");
    
    await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
    console.log(`   ✓ Resource group deleted successfully\n`);

    console.log("=== Demo completed successfully ===");

  } catch (error) {
    console.error("\n❌ Error occurred:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Run the main function
main();
