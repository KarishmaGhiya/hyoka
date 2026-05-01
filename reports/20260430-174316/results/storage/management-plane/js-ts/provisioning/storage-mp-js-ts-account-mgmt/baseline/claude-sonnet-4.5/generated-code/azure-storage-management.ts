import { DefaultAzureCredential } from "@azure/identity";
import { StorageManagementClient } from "@azure/arm-storage";

// Configuration
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "your-subscription-id";
const resourceGroupName = process.env.AZURE_RESOURCE_GROUP || "your-resource-group";
const storageAccountName = `stgacct${Date.now().toString().slice(-8)}`; // Unique name
const location = "eastus";

async function main() {
  try {
    // Step 1: Authenticate using DefaultAzureCredential
    console.log("1. Authenticating with Azure...");
    const credential = new DefaultAzureCredential();

    // Step 2: Create StorageManagementClient
    console.log("2. Creating StorageManagementClient...");
    const client = new StorageManagementClient(credential, subscriptionId);

    // Step 3: Create a new Storage Account with Standard_LRS SKU
    console.log(`3. Creating Storage Account '${storageAccountName}'...`);
    const createResult = await client.storageAccounts.beginCreateAndWait(
      resourceGroupName,
      storageAccountName,
      {
        sku: {
          name: "Standard_LRS",
        },
        kind: "StorageV2",
        location: location,
        properties: {
          allowBlobPublicAccess: false,
          minimumTlsVersion: "TLS1_2",
          supportsHttpsTrafficOnly: true,
        },
      }
    );
    console.log(`   ✓ Storage Account created: ${createResult.name}`);
    console.log(`   - ID: ${createResult.id}`);
    console.log(`   - Location: ${createResult.location}`);
    console.log(`   - SKU: ${createResult.sku?.name}`);

    // Step 4: List all Storage Accounts in the resource group using async iteration
    console.log(`\n4. Listing all Storage Accounts in resource group '${resourceGroupName}'...`);
    const storageAccounts = client.storageAccounts.listByResourceGroup(resourceGroupName);
    let count = 0;
    for await (const account of storageAccounts) {
      count++;
      console.log(`   - ${account.name} (${account.sku?.name}) in ${account.location}`);
    }
    console.log(`   ✓ Total accounts found: ${count}`);

    // Step 5: Get the properties of the created Storage Account
    console.log(`\n5. Getting properties of Storage Account '${storageAccountName}'...`);
    const accountProperties = await client.storageAccounts.getProperties(
      resourceGroupName,
      storageAccountName
    );
    console.log(`   ✓ Account properties retrieved:`);
    console.log(`   - Name: ${accountProperties.name}`);
    console.log(`   - Kind: ${accountProperties.kind}`);
    console.log(`   - Primary Location: ${accountProperties.primaryLocation}`);
    console.log(`   - Provisioning State: ${accountProperties.provisioningState}`);
    console.log(`   - Access Tier: ${accountProperties.accessTier}`);
    console.log(`   - Blob Versioning Enabled: ${accountProperties.isVersioningEnabled || false}`);

    // Step 6: Update the account to enable blob versioning
    console.log(`\n6. Updating Storage Account to enable blob versioning...`);
    const updateResult = await client.storageAccounts.update(
      resourceGroupName,
      storageAccountName,
      {
        properties: {
          isVersioningEnabled: true,
        },
      }
    );
    console.log(`   ✓ Storage Account updated`);
    console.log(`   - Blob Versioning Enabled: ${updateResult.isVersioningEnabled}`);

    // Verify the update
    const updatedProperties = await client.storageAccounts.getProperties(
      resourceGroupName,
      storageAccountName
    );
    console.log(`   - Verified Blob Versioning: ${updatedProperties.isVersioningEnabled}`);

    // Step 7: Delete the Storage Account
    console.log(`\n7. Deleting Storage Account '${storageAccountName}'...`);
    await client.storageAccounts.delete(resourceGroupName, storageAccountName);
    console.log(`   ✓ Storage Account deleted successfully`);

    console.log("\n✅ All operations completed successfully!");

  } catch (error) {
    console.error("❌ Error occurred:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Run the program
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
