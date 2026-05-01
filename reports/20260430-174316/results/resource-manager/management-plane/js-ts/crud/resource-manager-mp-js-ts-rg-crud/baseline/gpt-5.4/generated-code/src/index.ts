import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";

const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
const resourceGroupName =
  process.env.AZURE_RESOURCE_GROUP_NAME ?? `copilot-rg-${Date.now()}`;
const location = "eastus";

async function main(): Promise<void> {
  if (!subscriptionId) {
    throw new Error("Missing AZURE_SUBSCRIPTION_ID environment variable.");
  }

  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(credential, subscriptionId);

  console.log(`Creating resource group "${resourceGroupName}" in ${location}...`);
  const createdGroup = await client.resourceGroups.createOrUpdate(resourceGroupName, {
    location
  });
  console.log("Created:", createdGroup.id);

  console.log("\nListing resource groups in the subscription:");
  for await (const group of client.resourceGroups.list()) {
    console.log(`- ${group.name} (${group.location ?? "unknown"})`);
  }

  console.log(`\nGetting details for "${resourceGroupName}"...`);
  const fetchedGroup = await client.resourceGroups.get(resourceGroupName);
  console.log(
    JSON.stringify(
      {
        id: fetchedGroup.id,
        name: fetchedGroup.name,
        location: fetchedGroup.location,
        tags: fetchedGroup.tags ?? {}
      },
      null,
      2
    )
  );

  console.log(`\nUpdating "${resourceGroupName}" with a tag...`);
  const updatedGroup = await client.resourceGroups.update(resourceGroupName, {
    tags: {
      ...(fetchedGroup.tags ?? {}),
      environment: "sample"
    }
  });
  console.log("Updated tags:", updatedGroup.tags ?? {});

  console.log(`\nDeleting "${resourceGroupName}"...`);
  await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
  console.log("Deleted resource group.");
}

main().catch((error: unknown) => {
  console.error("Azure Resource Group sample failed.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
