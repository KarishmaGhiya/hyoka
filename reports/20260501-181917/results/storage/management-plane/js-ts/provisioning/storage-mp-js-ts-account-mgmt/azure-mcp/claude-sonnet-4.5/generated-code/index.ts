import { DefaultAzureCredential } from "@azure/identity";
import { StorageManagementClient } from "@azure/arm-storage";
import type { StorageAccount } from "@azure/arm-storage";

/**
 * Azure Storage Account Management Demo
 * 
 * This program demonstrates how to manage Azure Storage Accounts using
 * the @azure/arm-storage management plane SDK.
 */

// Configuration - Replace with your actual values
const SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID || "your-subscription-id";
const RESOURCE_GROUP_NAME = process.env.RESOURCE_GROUP_NAME || "my-resource-group";
const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME || `mystgacct${Date.now()}`.substring(0, 24);
const LOCATION = "eastus";

async function main() {
  try {
    console.log("=== Azure Storage Account Management Demo ===\n");

    // Step 1: Authenticate using DefaultAzureCredential
    console.log("Step 1: Authenticating with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    console.log("✓ Authentication successful\n");

    // Step 2: Create StorageManagementClient
    console.log("Step 2: Creating StorageManagementClient...");
    const client = new StorageManagementClient(credential, SUBSCRIPTION_ID);
    console.log("✓ Client created successfully\n");

    // Step 3: Create a new Storage Account
    console.log("Step 3: Creating Storage Account...");
    console.log(`  Name: ${STORAGE_ACCOUNT_NAME}`);
    console.log(`  Resource Group: ${RESOURCE_GROUP_NAME}`);
    console.log(`  Location: ${LOCATION}`);
    console.log(`  SKU: Standard_LRS`);
    
    const createPoller = await client.storageAccounts.beginCreateAndWait(
      RESOURCE_GROUP_NAME,
      STORAGE_ACCOUNT_NAME,
      {
        sku: {
          name: "Standard_LRS", // Locally Redundant Storage
        },
        kind: "StorageV2", // General-purpose v2 account
        location: LOCATION,
        properties: {
          allowBlobPublicAccess: false,
          minimumTlsVersion: "TLS1_2",
          supportsHttpsTrafficOnly: true,
        },
        tags: {
          environment: "demo",
          purpose: "management-sdk-example",
        },
      }
    );
    
    console.log(`✓ Storage Account created: ${createPoller.name}`);
    console.log(`  Provisioning State: ${createPoller.provisioningState}`);
    console.log(`  Primary Location: ${createPoller.primaryLocation}\n`);

    // Step 4: List all Storage Accounts in the resource group
    console.log("Step 4: Listing all Storage Accounts in resource group...");
    let accountCount = 0;
    
    const storageAccountsList = client.storageAccounts.listByResourceGroup(
      RESOURCE_GROUP_NAME
    );
    
    // Using async iteration
    for await (const account of storageAccountsList) {
      accountCount++;
      console.log(`  [${accountCount}] ${account.name}`);
      console.log(`      SKU: ${account.sku?.name}`);
      console.log(`      Location: ${account.location}`);
      console.log(`      Kind: ${account.kind}`);
    }
    
    console.log(`✓ Found ${accountCount} storage account(s)\n`);

    // Step 5: Get properties of the created Storage Account
    console.log("Step 5: Getting Storage Account properties...");
    const accountProperties: StorageAccount = await client.storageAccounts.getProperties(
      RESOURCE_GROUP_NAME,
      STORAGE_ACCOUNT_NAME
    );
    
    console.log(`  Name: ${accountProperties.name}`);
    console.log(`  ID: ${accountProperties.id}`);
    console.log(`  Type: ${accountProperties.type}`);
    console.log(`  Location: ${accountProperties.location}`);
    console.log(`  Provisioning State: ${accountProperties.provisioningState}`);
    console.log(`  Creation Time: ${accountProperties.creationTime}`);
    console.log(`  Primary Endpoints:`);
    console.log(`    Blob: ${accountProperties.primaryEndpoints?.blob}`);
    console.log(`    Queue: ${accountProperties.primaryEndpoints?.queue}`);
    console.log(`    Table: ${accountProperties.primaryEndpoints?.table}`);
    console.log(`    File: ${accountProperties.primaryEndpoints?.file}`);
    console.log(`  HTTPS Only: ${accountProperties.enableHttpsTrafficOnly}`);
    console.log(`  TLS Version: ${accountProperties.minimumTlsVersion}`);
    console.log(`  Blob Versioning Enabled: ${accountProperties.isVersioningEnabled || false}\n`);

    // Step 6: Update the account to enable blob versioning
    console.log("Step 6: Updating Storage Account to enable blob versioning...");
    const updatedAccount = await client.storageAccounts.update(
      RESOURCE_GROUP_NAME,
      STORAGE_ACCOUNT_NAME,
      {
        properties: {
          isVersioningEnabled: true,
        },
      }
    );
    
    console.log(`✓ Storage Account updated`);
    console.log(`  Blob Versioning Enabled: ${updatedAccount.isVersioningEnabled}\n`);

    // Verify the update
    const verifyAccount = await client.storageAccounts.getProperties(
      RESOURCE_GROUP_NAME,
      STORAGE_ACCOUNT_NAME
    );
    console.log(`  Verification - Blob Versioning: ${verifyAccount.isVersioningEnabled}\n`);

    // Step 7: Delete the Storage Account
    console.log("Step 7: Deleting Storage Account...");
    console.log(`  This will permanently delete: ${STORAGE_ACCOUNT_NAME}`);
    
    // Uncomment the following lines to actually delete the account
    // await client.storageAccounts.delete(RESOURCE_GROUP_NAME, STORAGE_ACCOUNT_NAME);
    // console.log(`✓ Storage Account deleted successfully\n`);
    
    console.log("  (Deletion skipped - uncomment code to enable)\n");

    console.log("=== Demo completed successfully ===");
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
