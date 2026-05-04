import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";

/**
 * Azure Resource Group Management Example
 * 
 * This program demonstrates how to:
 * 1. Authenticate using DefaultAzureCredential
 * 2. Create a ResourceManagementClient
 * 3. Create a resource group
 * 4. List all resource groups
 * 5. Get resource group details
 * 6. Update resource group tags
 * 7. Delete a resource group
 */

async function main() {
  // Get subscription ID from environment variable
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
  
  if (!subscriptionId) {
    throw new Error("AZURE_SUBSCRIPTION_ID environment variable is required");
  }

  console.log("=".repeat(60));
  console.log("Azure Resource Group Management Demo");
  console.log("=".repeat(60));
  console.log();

  // Step 1: Authenticate using DefaultAzureCredential
  console.log("🔐 Step 1: Authenticating with DefaultAzureCredential...");
  const credential = new DefaultAzureCredential();
  console.log("✅ Credential created successfully");
  console.log();

  // Step 2: Create ResourceManagementClient
  console.log("🔧 Step 2: Creating ResourceManagementClient...");
  const client = new ResourceManagementClient(credential, subscriptionId);
  console.log("✅ Client created successfully");
  console.log(`   Subscription ID: ${subscriptionId}`);
  console.log();

  // Generate a unique resource group name
  const timestamp = Date.now();
  const resourceGroupName = `rg-demo-${timestamp}`;
  const location = "eastus";

  // Step 3: Create a new resource group
  console.log("📦 Step 3: Creating resource group...");
  console.log(`   Name: ${resourceGroupName}`);
  console.log(`   Location: ${location}`);
  
  const createResult = await client.resourceGroups.createOrUpdate(
    resourceGroupName,
    {
      location: location,
      tags: {
        environment: "demo",
        createdBy: "typescript-sdk"
      }
    }
  );
  
  console.log("✅ Resource group created successfully");
  console.log(`   ID: ${createResult.id}`);
  console.log(`   Provisioning State: ${createResult.properties?.provisioningState}`);
  console.log();

  // Step 4: List all resource groups
  console.log("📋 Step 4: Listing all resource groups in subscription...");
  let resourceGroupCount = 0;
  
  // Using async iteration to list all resource groups
  for await (const resourceGroup of client.resourceGroups.list()) {
    resourceGroupCount++;
    console.log(`   - ${resourceGroup.name} (${resourceGroup.location})`);
    if (resourceGroup.tags) {
      const tags = Object.entries(resourceGroup.tags)
        .map(([key, value]) => `${key}=${value}`)
        .join(", ");
      console.log(`     Tags: ${tags}`);
    }
  }
  
  console.log(`✅ Found ${resourceGroupCount} resource group(s)`);
  console.log();

  // Step 5: Get details of the created resource group
  console.log("🔍 Step 5: Getting details of created resource group...");
  const resourceGroup = await client.resourceGroups.get(resourceGroupName);
  
  console.log("✅ Resource group details:");
  console.log(`   Name: ${resourceGroup.name}`);
  console.log(`   Location: ${resourceGroup.location}`);
  console.log(`   ID: ${resourceGroup.id}`);
  console.log(`   Provisioning State: ${resourceGroup.properties?.provisioningState}`);
  console.log(`   Managed By: ${resourceGroup.managedBy || "N/A"}`);
  
  if (resourceGroup.tags) {
    console.log("   Tags:");
    for (const [key, value] of Object.entries(resourceGroup.tags)) {
      console.log(`     - ${key}: ${value}`);
    }
  }
  console.log();

  // Step 6: Update the resource group by adding a tag
  console.log("🏷️  Step 6: Updating resource group tags...");
  const updateResult = await client.resourceGroups.update(
    resourceGroupName,
    {
      tags: {
        ...resourceGroup.tags,
        updated: "true",
        lastModified: new Date().toISOString()
      }
    }
  );
  
  console.log("✅ Resource group updated successfully");
  console.log("   Updated tags:");
  if (updateResult.tags) {
    for (const [key, value] of Object.entries(updateResult.tags)) {
      console.log(`     - ${key}: ${value}`);
    }
  }
  console.log();

  // Step 7: Delete the resource group
  console.log("🗑️  Step 7: Deleting resource group...");
  console.log("   This operation may take several minutes...");
  
  // beginDeleteAndWait is a long-running operation that waits for completion
  await client.resourceGroups.beginDeleteAndWait(resourceGroupName);
  
  console.log("✅ Resource group deleted successfully");
  console.log();

  // Verify deletion
  console.log("✔️  Verifying deletion...");
  try {
    await client.resourceGroups.get(resourceGroupName);
    console.log("⚠️  Warning: Resource group still exists");
  } catch (error: any) {
    if (error.statusCode === 404) {
      console.log("✅ Confirmed: Resource group no longer exists");
    } else {
      throw error;
    }
  }
  console.log();

  console.log("=".repeat(60));
  console.log("Demo completed successfully! 🎉");
  console.log("=".repeat(60));
}

// Execute the main function with error handling
main().catch((error) => {
  console.error("❌ Error occurred:");
  console.error(error.message);
  
  if (error.code) {
    console.error(`   Error Code: ${error.code}`);
  }
  
  if (error.statusCode) {
    console.error(`   Status Code: ${error.statusCode}`);
  }
  
  process.exit(1);
});
