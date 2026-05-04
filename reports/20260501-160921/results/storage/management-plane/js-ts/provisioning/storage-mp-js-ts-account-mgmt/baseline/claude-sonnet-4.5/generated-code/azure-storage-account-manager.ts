import { DefaultAzureCredential } from "@azure/identity";
import { StorageManagementClient } from "@azure/arm-storage";

/**
 * Azure Storage Account Management Example
 * Demonstrates complete CRUD operations on Azure Storage Accounts
 */

// Configuration
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "your-subscription-id";
const resourceGroupName = process.env.AZURE_RESOURCE_GROUP || "myResourceGroup";
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT || `mystorageacct${Date.now()}`;
const location = "eastus";

async function main() {
  try {
    console.log("=== Azure Storage Account Management ===\n");

    // Step 1: Authenticate using DefaultAzureCredential
    console.log("Step 1: Authenticating with Azure...");
    const credential = new DefaultAzureCredential();
    console.log("✓ Authentication successful\n");

    // Step 2: Create StorageManagementClient
    console.log("Step 2: Creating StorageManagementClient...");
    const storageClient = new StorageManagementClient(
      credential,
      subscriptionId
    );
    console.log("✓ Client created\n");

    // Step 3: Create a new Storage Account with Standard_LRS SKU
    console.log(`Step 3: Creating Storage Account '${storageAccountName}'...`);
    const createParameters = {
      location: location,
      sku: {
        name: "Standard_LRS", // Locally Redundant Storage
      },
      kind: "StorageV2", // General purpose v2
      properties: {
        supportsHttpsTrafficOnly: true,
        minimumTlsVersion: "TLS1_2",
        allowBlobPublicAccess: false,
      },
      tags: {
        environment: "demo",
        purpose: "sdk-example",
      },
    };

    const createPoller = await storageClient.storageAccounts.beginCreate(
      resourceGroupName,
      storageAccountName,
      createParameters
    );

    const createdAccount = await createPoller.pollUntilDone();
    console.log(`✓ Storage Account created: ${createdAccount.name}`);
    console.log(`  - Location: ${createdAccount.location}`);
    console.log(`  - SKU: ${createdAccount.sku?.name}`);
    console.log(`  - Kind: ${createdAccount.kind}\n`);

    // Step 4: List all Storage Accounts in the resource group
    console.log(`Step 4: Listing all Storage Accounts in '${resourceGroupName}'...`);
    const storageAccounts = storageClient.storageAccounts.listByResourceGroup(
      resourceGroupName
    );

    let accountCount = 0;
    // Using async iteration (for-await-of)
    for await (const account of storageAccounts) {
      accountCount++;
      console.log(`  - ${account.name} (${account.location}, ${account.sku?.name})`);
    }
    console.log(`✓ Found ${accountCount} storage account(s)\n`);

    // Step 5: Get properties of the created Storage Account
    console.log(`Step 5: Getting properties of '${storageAccountName}'...`);
    const accountProperties = await storageClient.storageAccounts.getProperties(
      resourceGroupName,
      storageAccountName
    );

    console.log("✓ Account Properties:");
    console.log(`  - Provisioning State: ${accountProperties.provisioningState}`);
    console.log(`  - Primary Location: ${accountProperties.primaryLocation}`);
    console.log(`  - Status of Primary: ${accountProperties.statusOfPrimary}`);
    console.log(`  - HTTPS Only: ${accountProperties.supportsHttpsTrafficOnly}`);
    console.log(`  - Minimum TLS Version: ${accountProperties.minimumTlsVersion}`);
    console.log(
      `  - Blob Versioning Enabled: ${accountProperties.isVersioningEnabled || false}\n`
    );

    // Step 6: Update the account to enable blob versioning
    console.log(`Step 6: Updating '${storageAccountName}' to enable blob versioning...`);

    // First, get the blob service properties
    const blobServiceBefore = await storageClient.blobServices.getServiceProperties(
      resourceGroupName,
      storageAccountName,
      "default"
    );
    console.log(`  - Current versioning state: ${blobServiceBefore.isVersioningEnabled || false}`);

    // Update blob service properties to enable versioning
    const updateParameters = {
      isVersioningEnabled: true,
      deleteRetentionPolicy: {
        enabled: true,
        days: 7,
      },
      containerDeleteRetentionPolicy: {
        enabled: true,
        days: 7,
      },
    };

    const updatedBlobService = await storageClient.blobServices.setServiceProperties(
      resourceGroupName,
      storageAccountName,
      "default",
      updateParameters
    );

    console.log(`✓ Blob versioning enabled: ${updatedBlobService.isVersioningEnabled}`);
    console.log(`  - Delete retention: ${updatedBlobService.deleteRetentionPolicy?.days} days`);
    console.log(
      `  - Container delete retention: ${updatedBlobService.containerDeleteRetentionPolicy?.days} days\n`
    );

    // Step 7: Delete the Storage Account
    console.log(`Step 7: Deleting Storage Account '${storageAccountName}'...`);

    // Confirm deletion (in production, you might want user confirmation)
    const shouldDelete = process.env.SKIP_DELETE !== "true";

    if (shouldDelete) {
      await storageClient.storageAccounts.delete(
        resourceGroupName,
        storageAccountName
      );
      console.log(`✓ Storage Account '${storageAccountName}' deleted successfully\n`);
    } else {
      console.log(`⊗ Deletion skipped (SKIP_DELETE=true)\n`);
    }

    console.log("=== All operations completed successfully ===");
  } catch (error) {
    console.error("Error occurred:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
