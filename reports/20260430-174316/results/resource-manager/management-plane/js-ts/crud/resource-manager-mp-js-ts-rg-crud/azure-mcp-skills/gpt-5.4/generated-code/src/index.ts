import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient, ResourceGroup } from "@azure/arm-resources";

function getSubscriptionId(): string {
  const value = process.env.AZURE_SUBSCRIPTION_ID;
  if (!value) {
    throw new Error("Set AZURE_SUBSCRIPTION_ID before running this sample.");
  }

  return value;
}

function getResourceGroupName(): string {
  const configuredName = process.env.AZURE_RESOURCE_GROUP_NAME;
  if (configuredName) {
    return configuredName;
  }

  return `rg-sample-${Date.now()}`;
}

async function main(): Promise<void> {
  const subscriptionId = getSubscriptionId();
  const resourceGroupName = getResourceGroupName();
  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(credential, subscriptionId);

  let created = false;

  try {
    console.log(`Creating resource group "${resourceGroupName}" in eastus...`);
    const createdGroup = await client.resourceGroups.createOrUpdate(resourceGroupName, {
      location: "eastus"
    });
    created = true;
    console.log(`Created: ${createdGroup.id}`);

    console.log("\nListing resource groups in the subscription:");
    for await (const resourceGroup of client.resourceGroups.list()) {
      console.log(`- ${resourceGroup.name} (${resourceGroup.location})`);
    }

    console.log(`\nGetting details for "${resourceGroupName}"...`);
    const fetchedGroup = await client.resourceGroups.get(resourceGroupName);
    console.log(JSON.stringify(fetchedGroup, null, 2));

    console.log(`\nUpdating "${resourceGroupName}" with a tag...`);
    const updatedGroup: ResourceGroup = await client.resourceGroups.update(resourceGroupName, {
      tags: {
        ...(fetchedGroup.tags ?? {}),
        sample: "true"
      }
    });
    console.log(JSON.stringify(updatedGroup.tags, null, 2));

    console.log(`\nDeleting "${resourceGroupName}"...`);
    await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
    created = false;
    console.log("Deleted resource group.");
  } catch (error) {
    console.error("Resource group workflow failed:", error);
    throw error;
  } finally {
    if (created) {
      console.log(`\nCleaning up "${resourceGroupName}"...`);
      await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
      console.log("Cleanup complete.");
    }
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exitCode = 1;
});
