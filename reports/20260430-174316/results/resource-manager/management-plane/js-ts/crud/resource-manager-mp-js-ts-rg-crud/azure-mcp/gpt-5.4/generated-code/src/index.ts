import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";

const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
const location = "eastus";
const resourceGroupName =
  process.env.AZURE_RESOURCE_GROUP_NAME ?? `rg-sdk-sample-${Date.now()}`;

function requireSubscriptionId(): string {
  if (!subscriptionId) {
    throw new Error(
      "Set the AZURE_SUBSCRIPTION_ID environment variable before running this sample."
    );
  }

  return subscriptionId;
}

async function main(): Promise<void> {
  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(
    credential,
    requireSubscriptionId()
  );

  let wasCreated = false;

  try {
    console.log(`Creating resource group "${resourceGroupName}" in "${location}"...`);
    const createdResourceGroup = await client.resourceGroups.createOrUpdate(
      resourceGroupName,
      {
        location
      }
    );
    wasCreated = true;
    console.log(`Created: ${createdResourceGroup.id}`);

    console.log("\nListing resource groups in the subscription:");
    for await (const group of client.resourceGroups.list()) {
      console.log(`- ${group.name} (${group.location})`);
    }

    console.log(`\nGetting details for "${resourceGroupName}"...`);
    const fetchedResourceGroup = await client.resourceGroups.get(resourceGroupName);
    console.log(
      JSON.stringify(
        {
          id: fetchedResourceGroup.id,
          name: fetchedResourceGroup.name,
          location: fetchedResourceGroup.location,
          tags: fetchedResourceGroup.tags ?? {}
        },
        null,
        2
      )
    );

    console.log(`\nUpdating "${resourceGroupName}" with a tag...`);
    const updatedResourceGroup = await client.resourceGroups.update(
      resourceGroupName,
      {
        tags: {
          ...(fetchedResourceGroup.tags ?? {}),
          environment: "sample"
        }
      }
    );
    console.log(
      `Updated tags: ${JSON.stringify(updatedResourceGroup.tags ?? {}, null, 2)}`
    );
  } finally {
    if (wasCreated) {
      console.log(`\nDeleting "${resourceGroupName}"...`);
      await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
      console.log("Deleted resource group.");
    }
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(`Sample failed: ${error.message}`);
  } else {
    console.error("Sample failed with a non-Error value:", error);
  }

  process.exitCode = 1;
});
