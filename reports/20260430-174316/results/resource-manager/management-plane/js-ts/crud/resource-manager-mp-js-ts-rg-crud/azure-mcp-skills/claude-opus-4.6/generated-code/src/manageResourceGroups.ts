import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";

// Set your subscription ID via the AZURE_SUBSCRIPTION_ID environment variable
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
if (!subscriptionId) {
  throw new Error(
    "AZURE_SUBSCRIPTION_ID environment variable is not set. " +
      "Set it to your Azure subscription ID before running this program."
  );
}

const resourceGroupName = "rg-demo-typescript";
const location = "eastus";

async function main(): Promise<void> {
  // 1. Authenticate using DefaultAzureCredential
  //    Supports Azure CLI, environment variables, managed identity, etc.
  const credential = new DefaultAzureCredential();

  // 2. Create a ResourceManagementClient
  const resourceClient = new ResourceManagementClient(
    credential,
    subscriptionId!
  );

  // 3. Create a new resource group in "eastus"
  console.log(`Creating resource group "${resourceGroupName}" in ${location}...`);
  const createResult = await resourceClient.resourceGroups.createOrUpdate(
    resourceGroupName,
    {
      location,
      tags: { environment: "demo", createdBy: "typescript-sdk" },
    }
  );
  console.log(`Created resource group: ${createResult.name} (ID: ${createResult.id})`);

  // 4. List all resource groups in the subscription
  console.log("\nListing all resource groups in the subscription:");
  for await (const rg of resourceClient.resourceGroups.list()) {
    console.log(`  - ${rg.name} (${rg.location})`);
  }

  // 5. Get details of the created resource group
  console.log(`\nGetting details for "${resourceGroupName}"...`);
  const getResult = await resourceClient.resourceGroups.get(resourceGroupName);
  console.log("Resource group details:");
  console.log(`  Name:       ${getResult.name}`);
  console.log(`  Location:   ${getResult.location}`);
  console.log(`  ID:         ${getResult.id}`);
  console.log(`  Properties: ${JSON.stringify(getResult.properties)}`);
  console.log(`  Tags:       ${JSON.stringify(getResult.tags)}`);

  // 6. Update the resource group by adding a tag
  console.log(`\nUpdating resource group "${resourceGroupName}" with new tag...`);
  const updateResult = await resourceClient.resourceGroups.update(
    resourceGroupName,
    {
      tags: {
        ...getResult.tags,
        updatedAt: new Date().toISOString(),
        purpose: "sdk-demo",
      },
    }
  );
  console.log(`Updated tags: ${JSON.stringify(updateResult.tags)}`);

  // 7. Delete the resource group using beginDeleteAndWait (long-running operation)
  console.log(`\nDeleting resource group "${resourceGroupName}"...`);
  await resourceClient.resourceGroups.beginDeleteAndWait(resourceGroupName);
  console.log(`Resource group "${resourceGroupName}" deleted successfully.`);
}

main().catch((err: Error) => {
  console.error("Error:", err.message);
  process.exit(1);
});
