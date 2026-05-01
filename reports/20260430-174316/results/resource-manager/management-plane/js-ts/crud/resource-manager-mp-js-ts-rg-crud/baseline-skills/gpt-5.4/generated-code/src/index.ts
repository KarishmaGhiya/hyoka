import { ResourceManagementClient } from "@azure/arm-resources";
import { DefaultAzureCredential } from "@azure/identity";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main(): Promise<void> {
  const subscriptionId = getRequiredEnv("AZURE_SUBSCRIPTION_ID");
  const resourceGroupName =
    process.env.AZURE_RESOURCE_GROUP_NAME ?? `rg-mgmt-sdk-sample-${Date.now()}`;
  const location = "eastus";

  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(credential, subscriptionId);

  console.log(`Creating resource group "${resourceGroupName}" in ${location}...`);
  const createdGroup = await client.resourceGroups.createOrUpdate(resourceGroupName, {
    location,
  });
  console.log("Created:", createdGroup);

  console.log("\nListing resource groups in the subscription...");
  for await (const resourceGroup of client.resourceGroups.list()) {
    console.log(`- ${resourceGroup.name} (${resourceGroup.location ?? "unknown"})`);
  }

  console.log(`\nGetting details for "${resourceGroupName}"...`);
  const fetchedGroup = await client.resourceGroups.get(resourceGroupName);
  console.log("Fetched:", fetchedGroup);

  console.log(`\nUpdating "${resourceGroupName}" with a tag...`);
  const updatedGroup = await client.resourceGroups.update(resourceGroupName, {
    tags: {
      ...(fetchedGroup.tags ?? {}),
      environment: "sample",
    },
  });
  console.log("Updated:", updatedGroup);

  console.log(`\nDeleting "${resourceGroupName}"...`);
  await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
  console.log("Deleted resource group.");
}

main().catch((error: unknown) => {
  console.error("Azure resource group workflow failed.");
  console.error(error);
  process.exitCode = 1;
});
