import { DefaultAzureCredential } from "@azure/identity";
import { StorageManagementClient, StorageAccount } from "@azure/arm-storage";

/**
 * Azure Storage Account Management Example
 * Demonstrates CRUD operations on Storage Accounts using the management plane SDK
 */

async function main() {
  // Configuration - Update these values for your environment
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "your-subscription-id";
  const resourceGroupName = process.env.AZURE_RESOURCE_GROUP || "your-resource-group";
  const location = "eastus";
  const accountName = `mystorageacct${Date.now()}`; // Must be globally unique, 3-24 lowercase letters/numbers

  console.log("Starting Azure Storage Account Management Demo...\n");

  // Step 1: Authenticate using DefaultAzureCredential
  console.log("1. Authenticating with DefaultAzureCredential...");
  const credential = new DefaultAzureCredential();
  console.log("✓ Credential created\n");

  // Step 2: Create StorageManagementClient
  console.log("2. Creating StorageManagementClient...");
  const client = new StorageManagementClient(credential, subscriptionId);
  console.log("✓ Client created\n");

  try {
    // Step 3: Create a new Storage Account
    console.log(`3. Creating Storage Account: ${accountName}...`);
    const createParams = {
      location: location,
      sku: {
        name: "Standard_LRS", // Locally Redundant Storage
      },
      kind: "StorageV2", // General-purpose v2 account
      properties: {
        accessTier: "Hot",
        allowBlobPublicAccess: false,
        supportsHttpsTrafficOnly: true,
        minimumTlsVersion: "TLS1_2",
      },
      tags: {
        environment: "demo",
        purpose: "management-sdk-example",
      },
    };

    // Create operation is long-running, returns a poller
    const createPoller = await client.storageAccounts.beginCreate(
      resourceGroupName,
      accountName,
      createParams
    );
    
    const createdAccount = await createPoller.pollUntilDone();
    console.log(`✓ Storage Account created: ${createdAccount.name}`);
    console.log(`  Location: ${createdAccount.location}`);
    console.log(`  SKU: ${createdAccount.sku?.name}`);
    console.log(`  Kind: ${createdAccount.kind}\n`);

    // Step 4: List all Storage Accounts in the resource group using async iteration
    console.log(`4. Listing Storage Accounts in resource group: ${resourceGroupName}...`);
    let accountCount = 0;
    
    // Using for-await-of for async iteration
    for await (const account of client.storageAccounts.listByResourceGroup(resourceGroupName)) {
      accountCount++;
      console.log(`  - ${account.name} (${account.sku?.name}, ${account.location})`);
    }
    console.log(`✓ Found ${accountCount} storage account(s)\n`);

    // Step 5: Get properties of the created Storage Account
    console.log(`5. Getting properties of Storage Account: ${accountName}...`);
    const accountProperties = await client.storageAccounts.getProperties(
      resourceGroupName,
      accountName
    );
    
    console.log(`✓ Account Properties:`);
    console.log(`  ID: ${accountProperties.id}`);
    console.log(`  Name: ${accountProperties.name}`);
    console.log(`  Type: ${accountProperties.type}`);
    console.log(`  Location: ${accountProperties.location}`);
    console.log(`  SKU: ${accountProperties.sku?.name}`);
    console.log(`  Kind: ${accountProperties.kind}`);
    console.log(`  Provisioning State: ${accountProperties.provisioningState}`);
    console.log(`  Primary Location: ${accountProperties.primaryLocation}`);
    console.log(`  Status of Primary: ${accountProperties.statusOfPrimary}`);
    console.log(`  Access Tier: ${accountProperties.accessTier}`);
    console.log(`  HTTPS Only: ${accountProperties.supportsHttpsTrafficOnly}`);
    console.log(`  Minimum TLS Version: ${accountProperties.minimumTlsVersion}\n`);

    // Step 6: Update the account to enable blob versioning
    console.log(`6. Updating Storage Account to enable blob versioning...`);
    const updateParams = {
      properties: {
        isVersioningEnabled: true,
      },
    };

    const updatedAccount = await client.storageAccounts.update(
      resourceGroupName,
      accountName,
      updateParams
    );
    
    console.log(`✓ Storage Account updated`);
    console.log(`  Versioning Enabled: ${updatedAccount.isVersioningEnabled}\n`);

    // Also update blob service properties to enable versioning at service level
    console.log(`  Enabling versioning at blob service level...`);
    await client.blobServices.setServiceProperties(
      resourceGroupName,
      accountName,
      "default",
      {
        isVersioningEnabled: true,
      }
    );
    console.log(`  ✓ Blob versioning enabled\n`);

    // Get updated blob service properties to verify
    const blobServiceProps = await client.blobServices.getServiceProperties(
      resourceGroupName,
      accountName,
      "default"
    );
    console.log(`  Verified - Blob Versioning: ${blobServiceProps.isVersioningEnabled}\n`);

    // Step 7: Delete the Storage Account
    console.log(`7. Deleting Storage Account: ${accountName}...`);
    await client.storageAccounts.delete(resourceGroupName, accountName);
    console.log(`✓ Storage Account deleted successfully\n`);

    console.log("Demo completed successfully!");

  } catch (error: any) {
    console.error("Error occurred:", error.message);
    if (error.details) {
      console.error("Details:", JSON.stringify(error.details, null, 2));
    }
    throw error;
  }
}

// Run the main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
