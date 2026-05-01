import { DefaultAzureCredential } from "@azure/identity";
import { StorageManagementClient } from "@azure/arm-storage";

async function manageStorageAccount() {
  // Configuration - Replace with your actual values
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "YOUR_SUBSCRIPTION_ID";
  const resourceGroupName = process.env.RESOURCE_GROUP_NAME || "your-resource-group";
  const location = "eastus";
  const storageAccountName = `mystorageacct${Date.now()}`; // Must be globally unique
  
  console.log("Starting Azure Storage Account management demo...\n");

  try {
    // Step 1: Authenticate using DefaultAzureCredential
    console.log("1. Authenticating with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    console.log("✓ Authentication successful\n");

    // Step 2: Create a StorageManagementClient
    console.log("2. Creating StorageManagementClient...");
    const client = new StorageManagementClient(credential, subscriptionId);
    console.log("✓ Client created\n");

    // Step 3: Create a new Storage Account with Standard_LRS SKU
    console.log(`3. Creating Storage Account: ${storageAccountName}...`);
    const createParams = {
      location: location,
      sku: {
        name: "Standard_LRS", // Locally redundant storage
      },
      kind: "StorageV2",
      properties: {
        supportsHttpsTrafficOnly: true,
        minimumTlsVersion: "TLS1_2",
        allowBlobPublicAccess: false,
      },
    };

    const createPoller = await client.storageAccounts.beginCreateAndWait(
      resourceGroupName,
      storageAccountName,
      createParams
    );
    console.log(`✓ Storage Account created: ${createPoller.name}`);
    console.log(`  - ID: ${createPoller.id}`);
    console.log(`  - Location: ${createPoller.location}`);
    console.log(`  - SKU: ${createPoller.sku?.name}\n`);

    // Step 4: List all Storage Accounts in the resource group
    console.log(`4. Listing all Storage Accounts in resource group: ${resourceGroupName}...`);
    let accountCount = 0;
    for await (const account of client.storageAccounts.listByResourceGroup(
      resourceGroupName
    )) {
      accountCount++;
      console.log(`  - ${account.name} (${account.sku?.name})`);
    }
    console.log(`✓ Total accounts found: ${accountCount}\n`);

    // Step 5: Get the properties of the created Storage Account
    console.log(`5. Getting properties of Storage Account: ${storageAccountName}...`);
    const accountProperties = await client.storageAccounts.getProperties(
      resourceGroupName,
      storageAccountName
    );
    console.log(`✓ Account properties retrieved:`);
    console.log(`  - Name: ${accountProperties.name}`);
    console.log(`  - Kind: ${accountProperties.kind}`);
    console.log(`  - SKU: ${accountProperties.sku?.name}`);
    console.log(`  - Primary Location: ${accountProperties.primaryLocation}`);
    console.log(`  - Status: ${accountProperties.statusOfPrimary}`);
    console.log(`  - HTTPS Only: ${accountProperties.supportsHttpsTrafficOnly}`);
    console.log(`  - TLS Version: ${accountProperties.minimumTlsVersion}`);
    console.log(`  - Blob Versioning: ${accountProperties.isVersioningEnabled || false}\n`);

    // Step 6: Update the account to enable blob versioning
    console.log(`6. Updating Storage Account to enable blob versioning...`);
    const updateParams = {
      properties: {
        isVersioningEnabled: true,
      },
    };

    const updatedAccount = await client.storageAccounts.update(
      resourceGroupName,
      storageAccountName,
      updateParams
    );
    console.log(`✓ Storage Account updated`);
    console.log(`  - Blob Versioning: ${updatedAccount.isVersioningEnabled}\n`);

    // Verify the update
    const verifyAccount = await client.storageAccounts.getProperties(
      resourceGroupName,
      storageAccountName
    );
    console.log(`Verification - Blob Versioning is now: ${verifyAccount.isVersioningEnabled}\n`);

    // Step 7: Delete the Storage Account
    console.log(`7. Deleting Storage Account: ${storageAccountName}...`);
    await client.storageAccounts.delete(resourceGroupName, storageAccountName);
    console.log(`✓ Storage Account deleted successfully\n`);

    console.log("✓ All operations completed successfully!");

  } catch (error: any) {
    console.error("Error occurred:", error.message);
    if (error.details) {
      console.error("Error details:", error.details);
    }
    process.exit(1);
  }
}

// Run the program
manageStorageAccount().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
