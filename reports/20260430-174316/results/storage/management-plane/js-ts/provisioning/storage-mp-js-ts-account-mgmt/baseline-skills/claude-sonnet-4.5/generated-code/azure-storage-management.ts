import { DefaultAzureCredential } from "@azure/identity";
import { StorageManagementClient } from "@azure/arm-storage";
import type { StorageAccount, StorageAccountCreateParameters } from "@azure/arm-storage";

/**
 * Azure Storage Account Management Demo
 * Demonstrates CRUD operations on Azure Storage Accounts using the management plane SDK
 */

// Configuration constants
const SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID || "your-subscription-id";
const RESOURCE_GROUP_NAME = process.env.AZURE_RESOURCE_GROUP || "my-resource-group";
const STORAGE_ACCOUNT_NAME = `mystorageacct${Date.now().toString().slice(-8)}`; // Must be globally unique
const LOCATION = "eastus";

async function main() {
  console.log("Azure Storage Account Management Demo");
  console.log("=====================================\n");

  // Step 1: Authenticate using DefaultAzureCredential
  console.log("Step 1: Authenticating with DefaultAzureCredential...");
  const credential = new DefaultAzureCredential();
  console.log("✓ Credential created\n");

  // Step 2: Create StorageManagementClient
  console.log("Step 2: Creating StorageManagementClient...");
  const client = new StorageManagementClient(credential, SUBSCRIPTION_ID);
  console.log("✓ Client created\n");

  try {
    // Step 3: Create a new Storage Account
    console.log(`Step 3: Creating Storage Account '${STORAGE_ACCOUNT_NAME}'...`);
    const createParameters: StorageAccountCreateParameters = {
      location: LOCATION,
      sku: {
        name: "Standard_LRS", // Locally redundant storage
      },
      kind: "StorageV2",
      properties: {
        supportsHttpsTrafficOnly: true,
        minimumTlsVersion: "TLS1_2",
        allowBlobPublicAccess: false,
      },
      tags: {
        environment: "demo",
        purpose: "testing",
      },
    };

    const createPoller = await client.storageAccounts.beginCreate(
      RESOURCE_GROUP_NAME,
      STORAGE_ACCOUNT_NAME,
      createParameters
    );

    // Wait for the operation to complete
    const storageAccount = await createPoller.pollUntilDone();
    console.log(`✓ Storage Account created: ${storageAccount.name}`);
    console.log(`  - ID: ${storageAccount.id}`);
    console.log(`  - Location: ${storageAccount.location}`);
    console.log(`  - SKU: ${storageAccount.sku?.name}`);
    console.log(`  - Provisioning State: ${storageAccount.properties?.provisioningState}\n`);

    // Step 4: List all Storage Accounts in the resource group
    console.log(`Step 4: Listing all Storage Accounts in '${RESOURCE_GROUP_NAME}'...`);
    let accountCount = 0;
    
    // Using async iteration (for await...of)
    for await (const account of client.storageAccounts.listByResourceGroup(
      RESOURCE_GROUP_NAME
    )) {
      accountCount++;
      console.log(`  - ${account.name} (${account.sku?.name}, ${account.location})`);
    }
    console.log(`✓ Found ${accountCount} storage account(s)\n`);

    // Step 5: Get properties of the created Storage Account
    console.log(`Step 5: Getting properties of '${STORAGE_ACCOUNT_NAME}'...`);
    const accountProperties = await client.storageAccounts.getProperties(
      RESOURCE_GROUP_NAME,
      STORAGE_ACCOUNT_NAME
    );

    console.log("✓ Storage Account Properties:");
    console.log(`  - Name: ${accountProperties.name}`);
    console.log(`  - Type: ${accountProperties.type}`);
    console.log(`  - Kind: ${accountProperties.kind}`);
    console.log(`  - Location: ${accountProperties.location}`);
    console.log(`  - SKU: ${accountProperties.sku?.name}`);
    console.log(`  - Primary Location: ${accountProperties.properties?.primaryLocation}`);
    console.log(`  - Status of Primary: ${accountProperties.properties?.statusOfPrimary}`);
    console.log(`  - HTTPS Only: ${accountProperties.properties?.supportsHttpsTrafficOnly}`);
    console.log(`  - Min TLS Version: ${accountProperties.properties?.minimumTlsVersion}`);
    console.log(`  - Blob Versioning: ${accountProperties.properties?.isVersioningEnabled || false}\n`);

    // Step 6: Update the account to enable blob versioning
    console.log(`Step 6: Updating '${STORAGE_ACCOUNT_NAME}' to enable blob versioning...`);
    
    // Get the blob service properties first
    let blobServiceProperties = await client.blobServices.getServiceProperties(
      RESOURCE_GROUP_NAME,
      STORAGE_ACCOUNT_NAME,
      "default"
    );

    // Update blob service properties to enable versioning
    const updatedBlobServiceProperties = await client.blobServices.setServiceProperties(
      RESOURCE_GROUP_NAME,
      STORAGE_ACCOUNT_NAME,
      "default",
      {
        isVersioningEnabled: true,
        deleteRetentionPolicy: {
          enabled: true,
          days: 7,
        },
      }
    );

    console.log("✓ Blob versioning enabled");
    console.log(`  - Versioning Enabled: ${updatedBlobServiceProperties.isVersioningEnabled}`);
    console.log(`  - Delete Retention: ${updatedBlobServiceProperties.deleteRetentionPolicy?.days} days\n`);

    // Verify the update
    const updatedAccount = await client.storageAccounts.getProperties(
      RESOURCE_GROUP_NAME,
      STORAGE_ACCOUNT_NAME
    );
    console.log("✓ Verified account update\n");

    // Step 7: Delete the Storage Account
    console.log(`Step 7: Deleting Storage Account '${STORAGE_ACCOUNT_NAME}'...`);
    await client.storageAccounts.delete(RESOURCE_GROUP_NAME, STORAGE_ACCOUNT_NAME);
    console.log("✓ Storage Account deleted successfully\n");

    console.log("=====================================");
    console.log("Demo completed successfully!");
  } catch (error) {
    console.error("\n❌ Error occurred:");
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
