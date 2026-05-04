import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";

/**
 * Azure Resource Group Management Demo
 * Demonstrates CRUD operations on Azure Resource Groups
 */
async function manageResourceGroups() {
  try {
    // 1. Authenticate using DefaultAzureCredential
    console.log("🔐 Authenticating with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();

    // Get subscription ID from environment variable
    const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    if (!subscriptionId) {
      throw new Error("AZURE_SUBSCRIPTION_ID environment variable is not set");
    }

    // 2. Create ResourceManagementClient
    console.log("📦 Creating ResourceManagementClient...");
    const client = new ResourceManagementClient(credential, subscriptionId);

    // Resource group configuration
    const resourceGroupName = `rg-demo-${Date.now()}`;
    const location = "eastus";

    console.log(`\n📝 Working with resource group: ${resourceGroupName}`);

    // 3. Create a new resource group
    console.log("\n✨ Creating resource group...");
    const createResult = await client.resourceGroups.createOrUpdate(
      resourceGroupName,
      {
        location: location,
        tags: {
          environment: "demo",
          purpose: "sdk-testing",
        },
      }
    );
    console.log(`✅ Created resource group: ${createResult.name}`);
    console.log(`   Location: ${createResult.location}`);
    console.log(`   ID: ${createResult.id}`);

    // 4. List all resource groups using iteration
    console.log("\n📋 Listing all resource groups in subscription...");
    let count = 0;
    for await (const resourceGroup of client.resourceGroups.list()) {
      count++;
      console.log(`   ${count}. ${resourceGroup.name} (${resourceGroup.location})`);
    }
    console.log(`✅ Total resource groups found: ${count}`);

    // 5. Get details of the created resource group
    console.log(`\n🔍 Getting details of resource group: ${resourceGroupName}`);
    const resourceGroup = await client.resourceGroups.get(resourceGroupName);
    console.log(`✅ Resource Group Details:`);
    console.log(`   Name: ${resourceGroup.name}`);
    console.log(`   Location: ${resourceGroup.location}`);
    console.log(`   Provisioning State: ${resourceGroup.properties?.provisioningState}`);
    console.log(`   Resource Group ID: ${resourceGroup.id}`);
    console.log(`   Tags:`, resourceGroup.tags);

    // 6. Update the resource group by adding a tag
    console.log(`\n🏷️  Updating resource group with additional tag...`);
    const updateResult = await client.resourceGroups.update(resourceGroupName, {
      tags: {
        ...resourceGroup.tags,
        lastModified: new Date().toISOString(),
        status: "active",
      },
    });
    console.log(`✅ Updated resource group tags:`);
    console.log(`   Tags:`, updateResult.tags);

    // Optional: Wait before deletion (comment out if you want to keep the resource group)
    console.log("\n⏳ Waiting 5 seconds before deletion...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 7. Delete the resource group using beginDeleteAndWait
    console.log(`\n🗑️  Deleting resource group: ${resourceGroupName}...`);
    console.log("   (This may take a few minutes)");
    await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
    console.log(`✅ Successfully deleted resource group: ${resourceGroupName}`);

    console.log("\n🎉 All operations completed successfully!");
  } catch (error) {
    console.error("\n❌ Error occurred:", error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
    throw error;
  }
}

// Execute the main function
console.log("🚀 Starting Azure Resource Group Management Demo\n");
console.log("=" .repeat(60));

manageResourceGroups()
  .then(() => {
    console.log("=" .repeat(60));
    console.log("\n✨ Demo completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Demo failed with error");
    process.exit(1);
  });
