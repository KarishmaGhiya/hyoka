import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";

// Configuration
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "<your-subscription-id>";
const resourceGroupName = "rg-demo-typescript";
const location = "eastus";

async function main() {
  try {
    // 1. Authenticate using DefaultAzureCredential
    console.log("Authenticating with Azure...");
    const credential = new DefaultAzureCredential();

    // 2. Create a ResourceManagementClient
    console.log("Creating ResourceManagementClient...");
    const client = new ResourceManagementClient(credential, subscriptionId);

    // 3. Create a new resource group
    console.log(`\nCreating resource group: ${resourceGroupName}`);
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
    console.log(`✓ Resource group created: ${createResult.name}`);
    console.log(`  Location: ${createResult.location}`);
    console.log(`  Provisioning State: ${createResult.properties?.provisioningState}`);

    // 4. List all resource groups using iteration
    console.log("\nListing all resource groups in subscription:");
    let count = 0;
    for await (const rg of client.resourceGroups.list()) {
      count++;
      console.log(`  ${count}. ${rg.name} (${rg.location})`);
    }
    console.log(`✓ Total resource groups: ${count}`);

    // 5. Get details of the created resource group
    console.log(`\nGetting details of resource group: ${resourceGroupName}`);
    const rgDetails = await client.resourceGroups.get(resourceGroupName);
    console.log(`✓ Resource Group Details:`);
    console.log(`  Name: ${rgDetails.name}`);
    console.log(`  Location: ${rgDetails.location}`);
    console.log(`  ID: ${rgDetails.id}`);
    console.log(`  Provisioning State: ${rgDetails.properties?.provisioningState}`);
    console.log(`  Tags:`, JSON.stringify(rgDetails.tags, null, 2));

    // 6. Update the resource group by adding a tag
    console.log(`\nUpdating resource group with additional tag...`);
    const updateResult = await client.resourceGroups.update(resourceGroupName, {
      tags: {
        ...rgDetails.tags,
        updatedAt: new Date().toISOString(),
        status: "active"
      }
    });
    console.log(`✓ Resource group updated successfully`);
    console.log(`  Updated Tags:`, JSON.stringify(updateResult.tags, null, 2));

    // 7. Delete the resource group using beginDeleteAndWait
    console.log(`\nDeleting resource group: ${resourceGroupName}`);
    console.log("This may take a few minutes...");
    await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
    console.log(`✓ Resource group deleted successfully`);

    // Verify deletion
    console.log("\nVerifying deletion by listing resource groups:");
    const remainingGroups: string[] = [];
    for await (const rg of client.resourceGroups.list()) {
      remainingGroups.push(rg.name!);
    }
    if (!remainingGroups.includes(resourceGroupName)) {
      console.log(`✓ Confirmed: ${resourceGroupName} no longer exists`);
    }

    console.log("\n✓ All operations completed successfully!");

  } catch (error) {
    console.error("Error occurred:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Run the program
main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
