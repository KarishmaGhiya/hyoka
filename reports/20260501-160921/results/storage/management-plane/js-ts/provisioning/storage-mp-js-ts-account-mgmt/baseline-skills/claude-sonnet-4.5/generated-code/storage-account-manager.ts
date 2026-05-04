import { DefaultAzureCredential } from "@azure/identity";
import { StorageManagementClient } from "@azure/arm-storage";
import type { 
  StorageAccount, 
  StorageAccountCreateParameters,
  StorageAccountUpdateParameters 
} from "@azure/arm-storage";

/**
 * Azure Storage Account Management Example
 * 
 * Demonstrates:
 * - Authentication with DefaultAzureCredential
 * - Creating a storage account
 * - Listing storage accounts with async iteration
 * - Getting storage account properties
 * - Updating storage account settings
 * - Deleting a storage account
 */

// Configuration - Replace with your values
const SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID || "<your-subscription-id>";
const RESOURCE_GROUP = process.env.AZURE_RESOURCE_GROUP || "myResourceGroup";
const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME || `storage${Date.now()}`;
const LOCATION = "eastus";

async function main(): Promise<void> {
  console.log("=== Azure Storage Account Management Demo ===\n");

  // Step 1: Authenticate using DefaultAzureCredential
  console.log("Step 1: Authenticating with DefaultAzureCredential...");
  const credential = new DefaultAzureCredential();

  // Step 2: Create StorageManagementClient
  console.log("Step 2: Creating StorageManagementClient...");
  const client = new StorageManagementClient(credential, SUBSCRIPTION_ID);
  console.log("✓ Client created successfully\n");

  try {
    // Step 3: Create a new Storage Account
    console.log("Step 3: Creating Storage Account...");
    console.log(`  Name: ${STORAGE_ACCOUNT_NAME}`);
    console.log(`  Resource Group: ${RESOURCE_GROUP}`);
    console.log(`  Location: ${LOCATION}`);
    console.log(`  SKU: Standard_LRS\n`);

    const createParameters: StorageAccountCreateParameters = {
      location: LOCATION,
      sku: {
        name: "Standard_LRS" // Locally redundant storage
      },
      kind: "StorageV2", // General-purpose v2 account
      properties: {
        accessTier: "Hot",
        allowBlobPublicAccess: false,
        supportsHttpsTrafficOnly: true,
        minimumTlsVersion: "TLS1_2"
      },
      tags: {
        environment: "demo",
        purpose: "management-sdk-example"
      }
    };

    // Begin create operation and wait for completion
    const createPoller = await client.storageAccounts.beginCreate(
      RESOURCE_GROUP,
      STORAGE_ACCOUNT_NAME,
      createParameters
    );

    const createdAccount = await createPoller.pollUntilDone();
    console.log("✓ Storage Account created successfully");
    console.log(`  ID: ${createdAccount.id}`);
    console.log(`  Provisioning State: ${createdAccount.provisioningState}\n`);

    // Step 4: List all Storage Accounts in the resource group
    console.log("Step 4: Listing all Storage Accounts in resource group...");
    let accountCount = 0;

    // Using async iteration (for await...of)
    for await (const account of client.storageAccounts.listByResourceGroup(RESOURCE_GROUP)) {
      accountCount++;
      console.log(`  [${accountCount}] ${account.name}`);
      console.log(`      Location: ${account.location}`);
      console.log(`      SKU: ${account.sku?.name}`);
      console.log(`      Kind: ${account.kind}`);
    }
    console.log(`✓ Found ${accountCount} storage account(s)\n`);

    // Step 5: Get properties of the created Storage Account
    console.log("Step 5: Getting Storage Account properties...");
    const accountProperties: StorageAccount = await client.storageAccounts.getProperties(
      RESOURCE_GROUP,
      STORAGE_ACCOUNT_NAME
    );

    console.log(`  Name: ${accountProperties.name}`);
    console.log(`  Location: ${accountProperties.location}`);
    console.log(`  SKU: ${accountProperties.sku?.name}`);
    console.log(`  Kind: ${accountProperties.kind}`);
    console.log(`  Creation Time: ${accountProperties.creationTime}`);
    console.log(`  Primary Location: ${accountProperties.primaryLocation}`);
    console.log(`  Status of Primary: ${accountProperties.statusOfPrimary}`);
    console.log(`  Access Tier: ${accountProperties.accessTier}`);
    console.log(`  HTTPS Only: ${accountProperties.enableHttpsTrafficOnly}`);
    console.log(`  Minimum TLS Version: ${accountProperties.minimumTlsVersion}`);
    console.log(`  Blob Versioning Enabled: ${accountProperties.isVersioningEnabled || false}\n`);

    // Step 6: Update the account to enable blob versioning
    console.log("Step 6: Updating Storage Account to enable blob versioning...");
    
    const updateParameters: StorageAccountUpdateParameters = {
      properties: {
        isVersioningEnabled: true
      }
    };

    const updatedAccount = await client.storageAccounts.update(
      RESOURCE_GROUP,
      STORAGE_ACCOUNT_NAME,
      updateParameters
    );

    console.log("✓ Storage Account updated successfully");
    console.log(`  Blob Versioning Enabled: ${updatedAccount.isVersioningEnabled}\n`);

    // Verify the update
    const verifyAccount = await client.storageAccounts.getProperties(
      RESOURCE_GROUP,
      STORAGE_ACCOUNT_NAME
    );
    console.log(`  Verified - Blob Versioning: ${verifyAccount.isVersioningEnabled}\n`);

    // Step 7: Delete the Storage Account
    console.log("Step 7: Deleting Storage Account...");
    console.log(`  Deleting: ${STORAGE_ACCOUNT_NAME}...`);
    
    await client.storageAccounts.delete(RESOURCE_GROUP, STORAGE_ACCOUNT_NAME);
    
    console.log("✓ Storage Account deleted successfully\n");

    // Verify deletion by attempting to list accounts
    console.log("Verifying deletion...");
    let foundDeleted = false;
    for await (const account of client.storageAccounts.listByResourceGroup(RESOURCE_GROUP)) {
      if (account.name === STORAGE_ACCOUNT_NAME) {
        foundDeleted = true;
        break;
      }
    }
    
    if (!foundDeleted) {
      console.log("✓ Confirmed: Storage Account no longer exists\n");
    } else {
      console.log("⚠ Warning: Storage Account still appears in list (may be propagating)\n");
    }

    console.log("=== Demo completed successfully! ===");

  } catch (error: any) {
    console.error("\n❌ Error occurred:");
    console.error(`  Message: ${error.message}`);
    
    if (error.statusCode) {
      console.error(`  Status Code: ${error.statusCode}`);
    }
    
    if (error.code) {
      console.error(`  Error Code: ${error.code}`);
    }
    
    if (error.details) {
      console.error(`  Details: ${JSON.stringify(error.details, null, 2)}`);
    }
    
    throw error;
  }
}

// Execute the main function
main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
