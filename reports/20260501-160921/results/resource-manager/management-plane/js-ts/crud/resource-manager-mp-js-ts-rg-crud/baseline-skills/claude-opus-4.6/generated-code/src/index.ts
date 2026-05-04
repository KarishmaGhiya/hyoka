import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";
import type { ResourceGroup } from "@azure/arm-resources";

// Configure these values for your environment
const subscriptionId =
  process.env.AZURE_SUBSCRIPTION_ID || "<your-subscription-id>";
const resourceGroupName = "rg-demo-eastus";
const location = "eastus";

async function main(): Promise<void> {
  // 1. Authenticate using DefaultAzureCredential
  const credential = new DefaultAzureCredential();

  // 2. Create a ResourceManagementClient
  const client = new ResourceManagementClient(credential, subscriptionId);

  // 3. Create a new resource group in "eastus"
  console.log(`Creating resource group "${resourceGroupName}"...`);
  const createResult: ResourceGroup =
    await client.resourceGroups.createOrUpdate(resourceGroupName, {
      location,
      tags: { environment: "demo" },
    });
  console.log(
    `Created resource group: ${createResult.name} (${createResult.location})`
  );

  // 4. List all resource groups using async iteration
  console.log("\nListing all resource groups:");
  for await (const rg of client.resourceGroups.list()) {
    console.log(`  - ${rg.name} (${rg.location})`);
  }

  // 5. Get details of the created resource group
  console.log(`\nGetting details for "${resourceGroupName}"...`);
  const getResult = await client.resourceGroups.get(resourceGroupName);
  console.log(`  Name:       ${getResult.name}`);
  console.log(`  Location:   ${getResult.location}`);
  console.log(`  Properties: ${getResult.properties?.provisioningState}`);
  console.log(`  Tags:       ${JSON.stringify(getResult.tags)}`);

  // 6. Update the resource group by adding a tag
  console.log(`\nUpdating resource group with new tag...`);
  const updateResult = await client.resourceGroups.update(resourceGroupName, {
    tags: {
      ...getResult.tags,
      updatedBy: "azure-sdk-demo",
    },
  });
  console.log(`  Updated tags: ${JSON.stringify(updateResult.tags)}`);

  // 7. Delete the resource group using beginDeleteAndWait
  console.log(`\nDeleting resource group "${resourceGroupName}"...`);
  await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
  console.log("Resource group deleted successfully.");
}

main().catch((err: Error) => {
  console.error("Error:", err.message);
  process.exit(1);
});
