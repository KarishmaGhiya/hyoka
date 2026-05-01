import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";

// Configure these values for your environment
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "<your-subscription-id>";
const resourceGroupName = "rg-demo-ts-crud";
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
  console.log(`Created: ${createResult.name} (id: ${createResult.id})\n`);

  // 4. List all resource groups in the subscription
  console.log("Listing all resource groups:");
  for await (const rg of client.resourceGroups.list()) {
    console.log(`  - ${rg.name} (${rg.location})`);
  }
  console.log();

  // 5. Get details of the created resource group
  console.log(`Getting details for "${resourceGroupName}"...`);
  const getResult = await client.resourceGroups.get(resourceGroupName);
  console.log(`  Name:         ${getResult.name}`);
  console.log(`  Location:     ${getResult.location}`);
  console.log(`  Provisioning: ${getResult.properties?.provisioningState}`);
  console.log(`  Tags:         ${JSON.stringify(getResult.tags)}\n`);

  // 6. Update the resource group by adding a tag
  console.log(`Updating "${resourceGroupName}" with tags...`);
  const updateResult = await client.resourceGroups.update(resourceGroupName, {
    tags: { environment: "demo", managedBy: "typescript-sdk" },
  });
  console.log(`  Updated tags: ${JSON.stringify(updateResult.tags)}\n`);

  // 7. Delete the resource group using beginDeleteAndWait
  console.log(`Deleting "${resourceGroupName}" (this may take a while)...`);
  await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
  console.log("Deleted successfully.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
