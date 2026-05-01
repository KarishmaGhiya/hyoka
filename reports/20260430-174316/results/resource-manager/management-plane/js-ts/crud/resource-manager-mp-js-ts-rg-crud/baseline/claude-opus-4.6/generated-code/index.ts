import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";

// Configuration — set via environment or replace with your values
const subscriptionId =
  process.env.AZURE_SUBSCRIPTION_ID || "<your-subscription-id>";
const resourceGroupName = "rg-demo-typescript";
const location = "eastus";

async function main(): Promise<void> {
  // 1. Authenticate using DefaultAzureCredential
  const credential = new DefaultAzureCredential();

  // 2. Create a ResourceManagementClient
  const client = new ResourceManagementClient(credential, subscriptionId);

  // 3. Create a new resource group in "eastus"
  console.log(`Creating resource group "${resourceGroupName}" in ${location}...`);
  const createResult = await client.resourceGroups.createOrUpdate(
    resourceGroupName,
    { location }
  );
  console.log(
    `Created resource group: ${createResult.name} (provisioning state: ${createResult.properties?.provisioningState})`
  );

  // 4. List all resource groups in the subscription
  console.log("\nListing all resource groups:");
  for await (const rg of client.resourceGroups.list()) {
    console.log(`  - ${rg.name} (${rg.location})`);
  }

  // 5. Get details of the created resource group
  console.log(`\nGetting details for "${resourceGroupName}"...`);
  const getResult = await client.resourceGroups.get(resourceGroupName);
  console.log(`  Name:     ${getResult.name}`);
  console.log(`  Location: ${getResult.location}`);
  console.log(`  ID:       ${getResult.id}`);

  // 6. Update the resource group by adding a tag
  console.log(`\nUpdating "${resourceGroupName}" with tags...`);
  const updateResult = await client.resourceGroups.update(resourceGroupName, {
    tags: { environment: "demo", managedBy: "typescript-sdk" },
  });
  console.log(`  Updated tags: ${JSON.stringify(updateResult.tags)}`);

  // 7. Delete the resource group
  console.log(`\nDeleting resource group "${resourceGroupName}"...`);
  await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
  console.log(`Deleted resource group "${resourceGroupName}".`);
}

main().catch((err: Error) => {
  console.error("Error:", err.message);
  process.exit(1);
});
