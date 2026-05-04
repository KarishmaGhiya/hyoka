import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";

// Configuration — set AZURE_SUBSCRIPTION_ID in your environment
const subscriptionId: string = process.env.AZURE_SUBSCRIPTION_ID ?? "";
if (!subscriptionId) {
  throw new Error(
    "AZURE_SUBSCRIPTION_ID environment variable is required. " +
      "Set it to your Azure subscription ID before running this program."
  );
}

const resourceGroupName = "rg-demo-typescript";
const location = "eastus";

async function main(): Promise<void> {
  // 1. Authenticate using DefaultAzureCredential
  //    Tries env vars → managed identity → VS Code → Azure CLI → PowerShell
  const credential = new DefaultAzureCredential();

  // 2. Create the Resource Management client
  const client = new ResourceManagementClient(credential, subscriptionId);

  // 3. Create a new resource group
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
  console.log(`\nGetting details of "${resourceGroupName}"...`);
  const getResult = await client.resourceGroups.get(resourceGroupName);
  console.log(`  Name:     ${getResult.name}`);
  console.log(`  Location: ${getResult.location}`);
  console.log(`  ID:       ${getResult.id}`);
  console.log(`  Tags:     ${JSON.stringify(getResult.tags)}`);

  // 6. Update the resource group by adding a tag
  console.log(`\nUpdating "${resourceGroupName}" with tags...`);
  const updateResult = await client.resourceGroups.update(resourceGroupName, {
    tags: {
      environment: "demo",
      managedBy: "typescript-sdk",
    },
  });
  console.log(`  Updated tags: ${JSON.stringify(updateResult.tags)}`);

  // 7. Delete the resource group (long-running operation)
  console.log(`\nDeleting resource group "${resourceGroupName}"...`);
  await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
  console.log(`Deleted resource group "${resourceGroupName}" successfully.`);
}

main().catch((err: Error) => {
  console.error("Error:", err.message);
  process.exit(1);
});
